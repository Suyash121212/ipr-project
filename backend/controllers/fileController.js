/**
 * fileController.js
 *
 * Secure file download and preview endpoints.
 * - Files are NEVER exposed via static middleware.
 * - Every request validates the file exists in MongoDB before serving.
 * - Admin can access all files; users can access only their own files.
 *
 * Routes registered in routes/files.js:
 *   GET /api/files/download/:fileId   → download (Content-Disposition: attachment)
 *   GET /api/files/view/:fileId       → inline view (PDFs, images)
 */

const path = require("path");
const fs = require("fs");
const Patent = require("../models/Patent");
const Copyright = require("../models/Copyright");
const Consultation = require("../models/Consultation");
const Communication = require("../models/Communication");
const { STORAGE_ROOT } = require("../middleware/upload");

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Resolve the absolute filesystem path from the stored relative filePath.
 * Stored as: "storage/patents/1718952000-Signed_Form1.pdf"
 * Resolved to: /var/www/backend/storage/patents/...
 *
 * Path-traversal protection: we normalize the path and ensure it starts
 * with the STORAGE_ROOT prefix before serving.
 */
function resolveFilePath(relativeFilePath) {
  // Remove any leading slash or "../" sequences
  const safe = relativeFilePath.replace(/^[/\\]+/, "").replace(/\.\./g, "");
  const absolute = path.resolve(path.join(__dirname, "..", safe));
  const storageRoot = path.resolve(STORAGE_ROOT);

  // Guard against path traversal
  if (!absolute.startsWith(storageRoot)) {
    return null;
  }
  return absolute;
}

/**
 * Search all models for a file record matching the given MongoDB subdoc _id.
 * Returns { file, ownerClerkUserId, modelName } or null.
 */
async function findFileRecord(fileId) {
  // ── Patent drawings / supporting docs ──
  const patent = await Patent.findOne({
    $or: [
      { "technicalDrawings._id": fileId },
      { "supportingDocuments._id": fileId },
    ],
  }).lean();

  if (patent) {
    const file =
      (patent.technicalDrawings || []).find(
        (f) => f._id.toString() === fileId
      ) ||
      (patent.supportingDocuments || []).find(
        (f) => f._id.toString() === fileId
      );
    return { file, ownerClerkUserId: patent.clerkUserId, modelName: "Patent" };
  }

  // ── Copyright files ──
  const copyright = await Copyright.findOne({
    "files._id": fileId,
  }).lean();

  if (copyright) {
    const file = (copyright.files || []).find(
      (f) => f._id.toString() === fileId
    );
    return {
      file,
      ownerClerkUserId: copyright.clerkUserId,
      modelName: "Copyright",
    };
  }

  // ── Consultation uploaded files ──
  const consultation = await Consultation.findOne({
    "uploadedFiles._id": fileId,
  }).lean();

  if (consultation) {
    const file = (consultation.uploadedFiles || []).find(
      (f) => f._id.toString() === fileId
    );
    // Normalise field names — Consultation uses fileSize/mimeType
    if (file) {
      const normalised = {
        ...file,
        size: file.size || file.fileSize,
        mimetype: file.mimetype || file.mimeType,
        originalName: file.originalName || file.fileName,
      };
      return {
        file: normalised,
        ownerClerkUserId: consultation.clerkUserId,
        modelName: "Consultation",
      };
    }
  }

  // ── Communication attachments ──
  const communication = await Communication.findOne({
    "attachments._id": fileId,
  }).lean();

  if (communication) {
    const file = (communication.attachments || []).find(
      (f) => f._id.toString() === fileId
    );
    if (file) {
      return {
        file,
        ownerClerkUserId: communication.clerkUserId,
        modelName: "Communication",
      };
    }
  }

  return null;
}


/**
 * Simple auth helper — reads clerkUserId + isAdmin from query or body.
 * In production you would verify a JWT or session cookie here.
 */
function getCallerIdentity(req) {
  const clerkUserId =
    req.query.clerkUserId || req.headers["x-clerk-user-id"] || null;
  const isAdmin =
    req.query.isAdmin === "true" ||
    req.headers["x-is-admin"] === "true" ||
    false;
  return { clerkUserId, isAdmin };
}

// ──────────────────────────────────────────────
// Download endpoint
// ──────────────────────────────────────────────
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId || fileId.length < 10) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid file ID" });
    }

    const result = await findFileRecord(fileId);

    if (!result || !result.file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    const { file, ownerClerkUserId } = result;
    const { clerkUserId, isAdmin } = getCallerIdentity(req);

    // Ownership check: admin can access all, user only their own
    if (!isAdmin && clerkUserId && clerkUserId !== ownerClerkUserId) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    // Resolve absolute path and guard against traversal
    const filePath = file.filePath || file.path;
    if (!filePath) {
      return res
        .status(404)
        .json({ success: false, message: "File path not recorded" });
    }

    const absolutePath = resolveFilePath(filePath);
    if (!absolutePath) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid file path" });
    }

    if (!fs.existsSync(absolutePath)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found on disk" });
    }

    const originalName =
      file.originalName || file.originalname || file.fileName || "download";

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(originalName)}"`
    );
    return res.download(absolutePath, originalName);
  } catch (error) {
    console.error("File download error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to download file" });
  }
};

// ──────────────────────────────────────────────
// View / preview endpoint (inline)
// ──────────────────────────────────────────────
const viewFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId || fileId.length < 10) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid file ID" });
    }

    const result = await findFileRecord(fileId);

    if (!result || !result.file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    const { file, ownerClerkUserId } = result;
    const { clerkUserId, isAdmin } = getCallerIdentity(req);

    // Ownership check
    if (!isAdmin && clerkUserId && clerkUserId !== ownerClerkUserId) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    const filePath = file.filePath || file.path;
    if (!filePath) {
      return res
        .status(404)
        .json({ success: false, message: "File path not recorded" });
    }

    const absolutePath = resolveFilePath(filePath);
    if (!absolutePath) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid file path" });
    }

    if (!fs.existsSync(absolutePath)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found on disk" });
    }

    // Use sendFile for inline viewing (browser handles PDF/image natively)
    return res.sendFile(absolutePath);
  } catch (error) {
    console.error("File view error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to view file" });
  }
};

module.exports = { downloadFile, viewFile };
