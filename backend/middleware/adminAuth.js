/**
 * adminAuth.js
 *
 * Validates admin JWT on every protected request.
 *
 * Checks (in order):
 *  1. Authorization: Bearer <token> header present
 *  2. JWT signature valid and not expired
 *  3. role === "admin"
 *  4. jti exists in AdminSession collection (server-side revocation)
 *     → if the session was logged out from any device, this fails everywhere
 *
 * This prevents token theft: copying a token to another browser
 * does NOT bypass auth because the session is tied to the registry,
 * not just to the token string.
 */

const jwt = require("jsonwebtoken");
const AdminSession = require("../models/AdminSession");

module.exports = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not set in .env");
      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: no token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // 1 & 2 — verify signature + expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const msg =
        err.name === "TokenExpiredError"
          ? "Session expired. Please log in again."
          : "Invalid token.";
      return res.status(401).json({ success: false, message: msg });
    }

    // 3 — role check
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: admin role required.",
      });
    }

    // 4 — server-side session registry check
    if (!decoded.jti) {
      // Token was issued without a jti (pre-TOTP migration) — reject it
      return res.status(401).json({
        success: false,
        message: "Session invalid. Please log in again.",
      });
    }

    const session = await AdminSession.findOne({ jti: decoded.jti });
    if (!session) {
      // Session was revoked (logout from any device) or never registered
      return res.status(401).json({
        success: false,
        message: "Session has been revoked. Please log in again.",
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("adminAuth error:", err);
    return res.status(500).json({ success: false, message: "Authentication error." });
  }
};
