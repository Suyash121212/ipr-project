/**
 * routes/files.js
 *
 * Secure file serving routes.
 * Files are never served via express.static — always validated through MongoDB first.
 *
 * GET /api/files/download/:fileId   → download file (Content-Disposition: attachment)
 * GET /api/files/view/:fileId       → inline view for PDFs and images
 */

const express = require("express");
const router = express.Router();
const { downloadFile, viewFile } = require("../controllers/fileController");

router.get("/download/:fileId", downloadFile);
router.get("/view/:fileId", viewFile);

module.exports = router;
