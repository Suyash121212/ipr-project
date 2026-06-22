/**
 * routes/export.js
 *
 * GET /api/export/patents        — export all patents as .xlsx
 * GET /api/export/copyrights     — export all copyrights as .xlsx
 * GET /api/export/consultations  — export all consultations as .xlsx
 *
 * All routes require ?isAdmin=true or x-is-admin: true header.
 *
 * Optional query params:
 *   status        — filter by status value
 *   showDeleted   — "true" to include soft-deleted records
 */

const express = require("express");
const router = express.Router();
const {
  exportPatents,
  exportCopyrights,
  exportConsultations,
} = require("../controllers/exportController");

router.get("/patents",       exportPatents);
router.get("/copyrights",    exportCopyrights);
router.get("/consultations", exportConsultations);

module.exports = router;
