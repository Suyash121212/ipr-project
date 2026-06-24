const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

const router = express.Router();

// In-memory OTP storage
const otpStore = new Map();

// =======================
// Cleanup Expired OTPs
// =======================
setInterval(() => {
  const now = Date.now();

  for (const [email, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 60 * 1000);

// =======================
// Rate Limiter
// =======================
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
});

// =======================
// Email Transporter
// =======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ Email configuration error:", error);
  } else {
    console.log("📧 Email service ready");
  }
});

// =======================
// Step 1: Verify Email & Password
// =======================
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.json({
      success: true,
      message: "Credentials verified",
    });
  } catch (error) {
    console.error("❌ Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// =======================
// Step 2: Send OTP
// =======================
router.post("/send-admin-otp", otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Only admin email allowed
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized email",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    otpStore.set(email, {
      otp,
      attempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await transporter.sendMail({
      from: `"IPR Admin" <${process.env.ADMIN_EMAIL}>`,
      to: email,
      subject: "Admin Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Admin Verification Code</h2>

          <p>Your OTP is:</p>

          <div
            style="
              font-size:32px;
              font-weight:bold;
              color:#4f46e5;
              letter-spacing:8px;
            "
          >
            ${otp}
          </div>

          <p>This code expires in 5 minutes.</p>
        </div>
      `,
    });

    console.log(`📧 OTP sent to ${email}`);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("❌ Send OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});

// =======================
// Step 3: Verify OTP
// =======================
router.post("/verify-admin-otp", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const storedOtp = otpStore.get(email);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    }

    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(email);

      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (storedOtp.otp !== code) {
      storedOtp.attempts += 1;

      if (storedOtp.attempts >= 5) {
        otpStore.delete(email);

        return res.status(400).json({
          success: false,
          message: "Too many invalid attempts. Request a new OTP.",
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. Remaining attempts: ${
          5 - storedOtp.attempts
        }`,
      });
    }

    // OTP Verified
    otpStore.delete(email);

    const token = jwt.sign(
      {
        email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    console.log(`✅ Admin authenticated: ${email}`);

    return res.json({
      success: true,
      token,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("❌ OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
});

module.exports = router;