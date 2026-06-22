const express = require("express");
const router = express.Router();
const { uploadCopyrights, handleMulterError } = require("../middleware/upload");
const {
  getStats,
  getUserCopyrightCount,
  getUserCopyrightById,
  getUserCopyrights,
  createCopyright,
  getAllCopyrights,
  getCopyrightById,
  updateCopyright,
  deleteCopyright,
  restoreCopyright,
  uploadPrimaryFile,
  uploadSupportingDocuments,
  updateStep,
  recordPayment,
  downloadFile,
  getCertificate,
} = require("../controllers/copyrightController");

// ── Specific routes (before /:id wildcard) ──
router.get("/stats/overview", getStats);

router.get("/user/:clerkUserId/count", getUserCopyrightCount);
router.get("/user/:clerkUserId/:copyrightId", getUserCopyrightById);
router.get("/user/:clerkUserId", getUserCopyrights);

// ── Generic / CRUD ──
router.post("/", createCopyright);
router.get("/", getAllCopyrights);

router.get("/:id", getCopyrightById);
router.put("/:id", updateCopyright);
router.delete("/:id", deleteCopyright);
router.patch("/:id/restore", restoreCopyright);

// ── File upload routes (local storage/copyrights/) ──
router.post(
  "/:id/primary-file",
  uploadCopyrights.single("primary"),
  uploadPrimaryFile
);
router.post(
  "/:id/supporting-documents",
  uploadCopyrights.array("documents", 10),
  uploadSupportingDocuments
);

// ── Misc routes ──
router.patch("/:id/step", updateStep);
router.post("/:id/payment", recordPayment);
router.get("/:id/download/:fileId", downloadFile);
router.get("/:id/certificate", getCertificate);

// ── Multer error handler ──
router.use(handleMulterError);

module.exports = router;
