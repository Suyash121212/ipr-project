const jwt = require("jsonwebtoken");

/**
 * adminAuth middleware
 *
 * Validates the Bearer JWT token issued during admin OTP login.
 * Attach this to any route that should only be accessible to admins.
 *
 * The token is stored in localStorage as "adminToken" on the frontend
 * and sent as:  Authorization: Bearer <token>
 */
module.exports = (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is not set in .env");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT_SECRET missing",
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: no token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure the token is for an admin
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: admin role required",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    const msg =
      error.name === "TokenExpiredError"
        ? "Session expired, please log in again"
        : "Invalid token";

    return res.status(401).json({
      success: false,
      message: msg,
    });
  }
};
