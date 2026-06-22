const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ──────────────────────────────────────────────
// Ensure all storage folders exist on startup
// ──────────────────────────────────────────────
const STORAGE_ROOT = path.join(__dirname, "../storage");

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
// Allowed MIME types
// ──────────────────────────────────────────────
const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpg",
  "image/jpeg",
];

// ──────────────────────────────────────────────
// Filename generator: timestamp-originalname.ext
// ──────────────────────────────────────────────
function generateFileName(originalname) {
  const ext = path.extname(originalname);
  const base = path
    .basename(originalname, ext)
    .replace(/[^a-zA-Z0-9_\-]/g, "_")
    .slice(0, 80); // cap length
  return `${Date.now()}-${base}${ext}`;
}

// ──────────────────────────────────────────────
// Multer storage factory
// ──────────────────────────────────────────────
function createDiskStorage(subfolder) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const dest = path.join(STORAGE_ROOT, subfolder);
      // Ensure folder exists (already created above, but guard for safety)
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      cb(null, dest);
    },
    filename: function (req, file, cb) {
      cb(null, generateFileName(file.originalname));
    },
  });
}

// ──────────────────────────────────────────────
// File filter
// ──────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, DOCX, PNG, JPG, JPEG are allowed."
      ),
      false
    );
  }
};

// ──────────────────────────────────────────────
// Upload instances per destination
// ──────────────────────────────────────────────
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const upload = multer({
  storage: createDiskStorage("temp"),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const uploadPatents = multer({
  storage: createDiskStorage("patents"),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const uploadCopyrights = multer({
  storage: createDiskStorage("copyrights"),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const uploadCommunications = multer({
  storage: createDiskStorage("communications"),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const uploadCertificates = multer({
  storage: createDiskStorage("certificates"),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// ──────────────────────────────────────────────
// Multer error handler middleware
// ──────────────────────────────────────────────
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ success: false, error: "File too large. Maximum size is 20 MB." });
    }
    return res.status(400).json({ success: false, error: error.message });
  }
  if (
    error &&
    error.message &&
    error.message.startsWith("Invalid file type")
  ) {
    return res.status(400).json({ success: false, error: error.message });
  }
  next(error);
};

// ──────────────────────────────────────────────
// Helper: build file metadata object from multer file
// ──────────────────────────────────────────────
function buildFileMeta(file, subfolder) {
  return {
    fileName: file.filename,
    originalName: file.originalname,
    filePath: `storage/${subfolder}/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
    uploadDate: new Date(),
  };
}

module.exports = {
  upload,
  uploadPatents,
  uploadCopyrights,
  uploadCommunications,
  uploadCertificates,
  handleMulterError,
  buildFileMeta,
  STORAGE_ROOT,
  generateFileName,
};
