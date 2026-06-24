/**
 * otpRoutes.js  — Admin Authentication (TOTP / Microsoft Authenticator)
 *
 * Flow:
 *   POST /api/admin-login          Step 1 — verify email + password
 *   POST /api/verify-admin-totp    Step 2 — verify 6-digit TOTP code → issue JWT
 *
 * One-time setup (run once, QR code is then scanned with any TOTP app):
 *   POST /api/admin-totp-setup     — generate secret + QR code
 *   POST /api/admin-totp-confirm   — confirm the secret is working, save to .env
 *
 * The TOTP secret is stored in process.env.ADMIN_TOTP_SECRET.
 * After /api/admin-totp-confirm succeeds, add the printed secret line to .env manually.
 */

const express = require("express");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const AdminSession = require("../models/AdminSession");

const router = express.Router();

// ─────────────────────────────────────────────
// Rate limiters
// ─────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { success: false, message: "Too many login attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const totpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 10,
  message: { success: false, message: "Too many TOTP attempts. Try again in 5 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─────────────────────────────────────────────
// Helper — verify password (plain or bcrypt hash)
// ─────────────────────────────────────────────

async function verifyPassword(input, stored) {
  if (!stored) return false;
  // If the stored value looks like a bcrypt hash, use bcrypt
  if (stored.startsWith("$2")) {
    return bcrypt.compare(input, stored);
  }
  // Plain-text fallback (development only — hash it in production)
  return input === stored;
}

// ─────────────────────────────────────────────
// STEP 1 — POST /api/admin-login
// Verifies email + password. Does NOT issue a JWT yet.
// Returns { success: true } so the frontend can show the TOTP field.
// ─────────────────────────────────────────────

router.post("/admin-login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("❌ ADMIN_EMAIL or ADMIN_PASSWORD not set in .env");
      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
      });
    }

    const emailMatch = email.toLowerCase() === adminEmail.toLowerCase();
    const passwordMatch = await verifyPassword(password, adminPassword);

    if (!emailMatch || !passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Credentials valid — tell frontend to request TOTP code
    return res.json({
      success: true,
      requireTotp: true,
      message: "Credentials verified. Enter your authenticator code.",
    });
  } catch (err) {
    console.error("❌ admin-login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─────────────────────────────────────────────
// STEP 2 — POST /api/verify-admin-totp
// Verifies the 6-digit TOTP code from Microsoft Authenticator.
// Issues a signed JWT on success.
// ─────────────────────────────────────────────

router.post("/verify-admin-totp", totpLimiter, async (req, res) => {
  try {
    const { email, token: totpToken } = req.body;

    if (!email || !totpToken) {
      return res.status(400).json({
        success: false,
        message: "Email and authenticator code are required.",
      });
    }

    // Must still match admin email (prevents brute-forcing TOTP on arbitrary accounts)
    if (email.toLowerCase() !== (process.env.ADMIN_EMAIL || "").toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const secret = process.env.ADMIN_TOTP_SECRET;

    if (!secret) {
      console.error("❌ ADMIN_TOTP_SECRET is not set in .env");
      return res.status(500).json({
        success: false,
        message: "TOTP not configured. Run /api/admin-totp-setup first.",
      });
    }

    // Verify the TOTP code
    // window: 1  →  accepts 1 step before/after (±30 seconds) to tolerate clock drift
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: totpToken.replace(/\s/g, ""), // strip any spaces
      window: 1,
    });

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authenticator code. Please try again.",
      });
    }

    // Issue JWT with a unique jti (JWT ID) for server-side revocation
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not set in .env");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT_SECRET missing.",
      });
    }

    const jti = uuidv4(); // unique ID for this token
    const expiresInSeconds = 8 * 60 * 60; // 8 hours
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const jwtToken = jwt.sign(
      { email, role: "admin", jti },
      process.env.JWT_SECRET,
      { expiresIn: expiresInSeconds }
    );

    // Hash the User-Agent for fingerprinting (never store raw UA)
    const rawUA = req.headers["user-agent"] || "";
    const userAgentHash = crypto
      .createHash("sha256")
      .update(rawUA)
      .digest("hex");

    // Register this session — if jti is not in this collection, token is rejected
    await AdminSession.create({ jti, email, userAgentHash, expiresAt });

    console.log(`✅ Admin authenticated via TOTP: ${email} | session: ${jti.slice(0, 8)}…`);

    return res.json({
      success: true,
      token: jwtToken,
      message: "Authentication successful.",
    });
  } catch (err) {
    console.error("❌ verify-admin-totp error:", err);
    return res.status(500).json({ success: false, message: "TOTP verification failed." });
  }
});

// ─────────────────────────────────────────────
// ONE-TIME SETUP — POST /api/admin-totp-setup
// Generates a new TOTP secret and returns a QR code data URL.
// Scan this QR code once with Microsoft Authenticator.
// Then call /api/admin-totp-confirm to save the secret.
// ─────────────────────────────────────────────

router.post("/admin-totp-setup", async (req, res) => {
  try {
    // Basic guard: only allow setup if no secret is currently configured,
    // OR if the current admin password is supplied.
    const { password } = req.body;

    const passwordMatch = await verifyPassword(
      password || "",
      process.env.ADMIN_PASSWORD || ""
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Admin password required to generate a new TOTP secret.",
      });
    }

    // Generate a new TOTP secret
    const secret = speakeasy.generateSecret({
      name: `IPR Admin (${process.env.ADMIN_EMAIL || "admin"})`,
      issuer: "IPR Management System",
      length: 32,
    });

    // Generate QR code as a data URL so the frontend can display it
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    console.log("🔑 New TOTP secret generated (NOT yet saved)");
    console.log(`   Base32 secret: ${secret.base32}`);
    console.log("   Add to .env: ADMIN_TOTP_SECRET=" + secret.base32);

    return res.json({
      success: true,
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode: qrDataUrl,
      message:
        "Scan the QR code with Microsoft Authenticator, then call /api/admin-totp-confirm with the 6-digit code to activate.",
    });
  } catch (err) {
    console.error("❌ admin-totp-setup error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate TOTP secret." });
  }
});

// ─────────────────────────────────────────────
// ONE-TIME CONFIRM — POST /api/admin-totp-confirm
// After scanning the QR code, confirm the setup by verifying one code.
// Prints the ADMIN_TOTP_SECRET value to add to .env manually.
// ─────────────────────────────────────────────

router.post("/admin-totp-confirm", async (req, res) => {
  try {
    const { secret, token: totpToken } = req.body;

    if (!secret || !totpToken) {
      return res.status(400).json({
        success: false,
        message: "secret and token are required.",
      });
    }

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: totpToken.replace(/\s/g, ""),
      window: 1,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Code does not match. Make sure you scanned the correct QR code and try again.",
      });
    }

    console.log("✅ TOTP confirmed. Add this line to your .env file:");
    console.log(`   ADMIN_TOTP_SECRET=${secret}`);

    return res.json({
      success: true,
      message: "TOTP verified successfully! Add the following line to your backend .env file to activate:",
      envLine: `ADMIN_TOTP_SECRET=${secret}`,
    });
  } catch (err) {
    console.error("❌ admin-totp-confirm error:", err);
    return res.status(500).json({ success: false, message: "Confirmation failed." });
  }
});

// ─────────────────────────────────────────────
// LOGOUT — POST /api/admin-logout
// Deletes the session from the registry.
// The JWT is now dead server-side even if the token hasn't expired.
// ─────────────────────────────────────────────

router.post("/admin-logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token — treat as already logged out
      return res.json({ success: true, message: "Logged out." });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Expired or invalid — nothing to revoke
      return res.json({ success: true, message: "Logged out." });
    }

    if (decoded.jti) {
      await AdminSession.deleteOne({ jti: decoded.jti });
      console.log(`🚪 Admin session revoked: ${decoded.email} | ${decoded.jti.slice(0, 8)}…`);
    }

    return res.json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    console.error("❌ admin-logout error:", err);
    return res.status(500).json({ success: false, message: "Logout failed." });
  }
});

// ─────────────────────────────────────────────
// Legacy email OTP routes — kept for backward compatibility
// These are no-ops now; the frontend no longer calls them
// ─────────────────────────────────────────────

router.post("/send-admin-otp", (req, res) => {
  return res.status(410).json({
    success: false,
    message: "Email OTP has been replaced with Microsoft Authenticator (TOTP). Use /api/verify-admin-totp.",
  });
});

router.post("/verify-admin-otp", (req, res) => {
  return res.status(410).json({
    success: false,
    message: "Email OTP has been replaced with Microsoft Authenticator (TOTP). Use /api/verify-admin-totp.",
  });
});

module.exports = router;
