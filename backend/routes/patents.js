const express = require("express");
const router = express.Router();
const { uploadPatents, handleMulterError } = require("../middleware/upload");
const {
  getStats,
  getAllPatents,
  getUserPatentCount,
  getUserPatents,
  getUserPatentById,
  createPatent,
  getPatentById,
  updatePatent,
  deletePatent,
  restorePatent,
  uploadTechnicalDrawings,
  uploadSupportingDocuments,
  updateCompletedDocuments,
  updateStep,
  downloadFile,
  getCertificate,
} = require("../controllers/patentController");

// ── Stats & Admin ──
router.get("/stats/overview", getStats);

// ── User-scoped (must come before /:id wildcard) ──
router.get("/user/:clerkUserId/count", getUserPatentCount);
router.get("/user/:clerkUserId/:patentId", getUserPatentById);
router.get("/user/:clerkUserId", getUserPatents);

// ── Collection routes ──
router.get("/", getAllPatents);
router.post("/", createPatent);

// ── Single patent ──
router.get("/:id", getPatentById);
router.put("/:id", updatePatent);
router.delete("/:id", deletePatent);
router.patch("/:id/restore", restorePatent);

// ── File uploads (local storage/patents/) ──
router.post(
  "/:id/technical-drawings",
  uploadPatents.array("drawings", 10),
  uploadTechnicalDrawings
);
router.post(
  "/:id/supporting-documents",
  uploadPatents.array("documents", 10),
  uploadSupportingDocuments
);

// ── Patch helpers ──
router.patch("/:id/completed-documents", updateCompletedDocuments);
router.patch("/:id/step", updateStep);

// ── File download & certificate ──
router.get("/:id/download/:fileId", downloadFile);
router.get("/:id/certificate", getCertificate);

// ── Multer error handler ──
router.use(handleMulterError);

module.exports = router;
