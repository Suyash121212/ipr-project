const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
require("dotenv").config();

// ──────────────────────────────────────────────
// Import routes
// ──────────────────────────────────────────────
const copyrightRoutes = require("./routes/copyright");
const contactRoutes = require("./routes/contact");
const patentRoutes = require("./routes/patents");
const consultationRoutes = require("./routes/consultations");
const paymentRoutes = require("./routes/paymentRoutes");
const otpRoutes = require("./routes/otpRoutes");
const fileRoutes = require("./routes/files");
const communicationRoutes = require("./routes/communications");

const app = express();
const PORT = process.env.PORT || 3001;

// ──────────────────────────────────────────────
// Ensure local storage folders exist on startup
// upload middleware also does this, but we do it
// here too so the server fails fast if disk is full
// ──────────────────────────────────────────────
const STORAGE_ROOT = path.join(__dirname, "storage");
const STORAGE_DIRS = [
  "patents",
  "copyrights",
  "communications",
  "certificates",
  "profile-images",
  "temp",
];

STORAGE_DIRS.forEach((dir) => {
  const fullPath = path.join(STORAGE_ROOT, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Created storage directory: ${fullPath}`);
  }
});

// ──────────────────────────────────────────────
// Rate limiting
// ──────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

const consultationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,  // 20 submissions per hour per IP — reasonable for production
  message: {
    success: false,
    message: "Too many consultation submissions. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for admins checking their own submissions
  skip: (req) => req.method !== 'POST', // only limit POST (submissions), not GET
});

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "https://ipr-project-chi.vercel.app",
      "https://ipr-project-chi.vercel.app/",
      /\.vercel\.app$/,
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-clerk-user-id", "x-is-admin"],
  })
);
app.use(globalLimiter);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.set("trust proxy", 1);

// NOTE: Storage folder is intentionally NOT exposed via express.static.
// All file access goes through authenticated /api/files/* endpoints.

// ──────────────────────────────────────────────
// MongoDB connection
// ──────────────────────────────────────────────
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/ip_secure_legal"
  )
  .then(() => console.log("✅ Connected to MongoDB successfully"))
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/", (req, res) => {
  res.json({ message: "IPR Backend API is running 🔥" });
});

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.use("/api", otpRoutes);
app.use("/api/copyright", copyrightRoutes);
app.use("/api", contactRoutes);
app.use("/api/patents", patentRoutes);
app.use("/api/consultations", consultationLimiter, consultationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/communications", communicationRoutes);

// ──────────────────────────────────────────────
// Multer error handler
// ──────────────────────────────────────────────
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File too large (max 20 MB)",
      LIMIT_FILE_COUNT: "Too many files (max 10)",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field",
    };
    return res.status(400).json({
      success: false,
      message: messages[error.code] || "Upload error",
    });
  }
  next(error);
});

// ──────────────────────────────────────────────
// 404 handler
// ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.originalUrl,
    availableEndpoints: [
      "/api/health",
      "/api/send-admin-otp",
      "/api/verify-admin-otp",
      "/api/copyright",
      "/api/contact",
      "/api/patents",
      "/api/consultations",
      "/api/files/download/:fileId",
      "/api/files/view/:fileId",
    ],
  });
});

// ──────────────────────────────────────────────
// Global error handler
// ──────────────────────────────────────────────
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ──────────────────────────────────────────────
// Graceful shutdown
// ──────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  return () => {
    console.log(`\n${signal} received. Shutting down...`);
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log("MongoDB disconnected.");
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(1), 10000);
  };
};
process.on("SIGTERM", gracefulShutdown("SIGTERM"));
process.on("SIGINT", gracefulShutdown("SIGINT"));

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Local storage: ${STORAGE_ROOT}`);
  console.log(`📧 Email OTP active`);
});

module.exports = app;
