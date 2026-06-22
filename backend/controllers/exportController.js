/**
 * exportController.js
 *
 * Generates Excel (.xlsx) exports for Admin users.
 *
 * GET /api/export/patents        → all patent applications
 * GET /api/export/copyrights     → all copyright applications
 * GET /api/export/consultations  → all consultation requests
 *
 * Query params (all optional):
 *   status        — filter by status
 *   showDeleted   — "true" to include soft-deleted records
 *
 * Auth: isAdmin=true required (passed via query or x-is-admin header).
 */

const ExcelJS = require("exceljs");
const Patent = require("../models/Patent");
const Copyright = require("../models/Copyright");
const Consultation = require("../models/Consultation");

// ─────────────────────────────────────────────────
// Auth helper (same pattern used across the project)
// ─────────────────────────────────────────────────
function isAdminRequest(req) {
  return (
    req.query.isAdmin === "true" ||
    req.headers["x-is-admin"] === "true"
  );
}

// ─────────────────────────────────────────────────
// Shared Excel styling helpers
// ─────────────────────────────────────────────────

/** Apply consistent header row style */
function styleHeaderRow(row, bgArgb = "FF1E293B") {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: bgArgb },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top:    { style: "thin", color: { argb: "FF475569" } },
      left:   { style: "thin", color: { argb: "FF475569" } },
      bottom: { style: "thin", color: { argb: "FF475569" } },
      right:  { style: "thin", color: { argb: "FF475569" } },
    };
  });
}

/** Apply zebra striping and borders to a data row */
function styleDataRow(row, rowIndex) {
  const isEven = rowIndex % 2 === 0;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isEven ? "FFF8FAFC" : "FFFFFFFF" },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = {
      top:    { style: "hair", color: { argb: "FFE2E8F0" } },
      left:   { style: "hair", color: { argb: "FFE2E8F0" } },
      bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
      right:  { style: "hair", color: { argb: "FFE2E8F0" } },
    };
  });
}

/** Format a date value for the cell */
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Send the workbook as an HTTP download */
async function sendWorkbook(res, workbook, filename) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );
  await workbook.xlsx.write(res);
  res.end();
}

// ─────────────────────────────────────────────────
// PATENT EXPORT
// ─────────────────────────────────────────────────
const exportPatents = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const showDeleted = req.query.showDeleted === "true";
    const filter = { isDeleted: showDeleted };
    if (req.query.status) filter.status = req.query.status;

    const patents = await Patent.find(filter).sort({ createdAt: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "IPR Admin";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Patent Applications", {
      pageSetup: { orientation: "landscape", fitToPage: true },
      views: [{ state: "frozen", ySplit: 1 }],
    });

    // ── Columns ──
    sheet.columns = [
      { header: "Application No.",   key: "applicationNumber", width: 20 },
      { header: "Invention Title",   key: "inventionTitle",    width: 35 },
      { header: "Inventor Name",     key: "inventorName",      width: 25 },
      { header: "Applicant Name",    key: "applicantName",     width: 25 },
      { header: "Address",           key: "address",           width: 30 },
      { header: "Email",             key: "email",             width: 28 },
      { header: "Phone",             key: "phone",             width: 18 },
      { header: "Status",            key: "status",            width: 18 },
      { header: "Current Stage",     key: "currentStage",      width: 14 },
      { header: "Filing Date",       key: "filingDate",        width: 16 },
      { header: "Priority Date",     key: "priorityDate",      width: 16 },
      { header: "Technical Drawings",key: "drawings",          width: 14 },
      { header: "Supporting Docs",   key: "docs",              width: 14 },
      { header: "Additional Applicants", key: "additionalApplicants", width: 30 },
      { header: "Deleted",           key: "isDeleted",         width: 10 },
      { header: "Submitted On",      key: "createdAt",         width: 18 },
    ];

    styleHeaderRow(sheet.getRow(1), "FF0F172A");

    patents.forEach((p, idx) => {
      const row = sheet.addRow({
        applicationNumber:    p.applicationNumber || "Draft",
        inventionTitle:       p.inventionTitle || "",
        inventorName:         p.inventorName || "",
        applicantName:        p.applicantName || "",
        address:              p.address || "",
        email:                p.email || "",
        phone:                p.phone || "",
        status:               (p.status || "draft").replace(/-/g, " "),
        currentStage:         p.currentStage || 1,
        filingDate:           fmtDate(p.filingDate || p.createdAt),
        priorityDate:         fmtDate(p.priorityDate),
        drawings:             (p.technicalDrawings || []).length,
        docs:                 (p.supportingDocuments || []).length,
        additionalApplicants: (p.additionalApplicants || [])
          .map((a) => `${a.name} (${a.email || ""})`)
          .join("; "),
        isDeleted:            p.isDeleted ? "Yes" : "No",
        createdAt:            fmtDate(p.createdAt),
      });
      styleDataRow(row, idx + 2);
    });

    // Summary row
    sheet.addRow([]);
    const summaryRow = sheet.addRow([`Total Records: ${patents.length}`, "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    summaryRow.getCell(1).font = { bold: true, italic: true, color: { argb: "FF64748B" } };

    const today = new Date().toISOString().slice(0, 10);
    await sendWorkbook(res, workbook, `Patents_Export_${today}.xlsx`);
  } catch (err) {
    console.error("exportPatents error:", err);
    res.status(500).json({ success: false, message: "Failed to generate patent export." });
  }
};

// ─────────────────────────────────────────────────
// COPYRIGHT EXPORT
// ─────────────────────────────────────────────────
const exportCopyrights = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const showDeleted = req.query.showDeleted === "true";
    const filter = { isDeleted: showDeleted };
    if (req.query.status) filter.status = req.query.status;

    const copyrights = await Copyright.find(filter).sort({ createdAt: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "IPR Admin";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Copyright Applications", {
      pageSetup: { orientation: "landscape", fitToPage: true },
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = [
      { header: "Application No.",   key: "applicationNumber", width: 20 },
      { header: "Work Title",        key: "title",             width: 35 },
      { header: "Author Name",       key: "authorName",        width: 25 },
      { header: "Applicant Name",    key: "applicantName",     width: 25 },
      { header: "Applicant Email",   key: "applicantEmail",    width: 28 },
      { header: "Applicant Phone",   key: "applicantPhone",    width: 18 },
      { header: "Applicant Address", key: "applicantAddress",  width: 30 },
      { header: "Work Type",         key: "workType",          width: 18 },
      { header: "Language",          key: "language",          width: 15 },
      { header: "Published",         key: "isPublished",       width: 12 },
      { header: "Publication Date",  key: "publicationDate",   width: 18 },
      { header: "Status",            key: "status",            width: 20 },
      { header: "Current Stage",     key: "currentStage",      width: 14 },
      { header: "Filing Date",       key: "filingDate",        width: 16 },
      { header: "Files Uploaded",    key: "filesCount",        width: 14 },
      { header: "Payment Method",    key: "paymentMethod",     width: 16 },
      { header: "Payment Amount",    key: "paymentAmount",     width: 16 },
      { header: "Additional Applicants", key: "additionalApplicants", width: 30 },
      { header: "Deleted",           key: "isDeleted",         width: 10 },
      { header: "Submitted On",      key: "createdAt",         width: 18 },
    ];

    styleHeaderRow(sheet.getRow(1), "FF0F172A");

    copyrights.forEach((c, idx) => {
      const row = sheet.addRow({
        applicationNumber:    c.applicationNumber || "Draft",
        title:                c.title || "",
        authorName:           c.authorName || "",
        applicantName:        c.applicantName || "",
        applicantEmail:       c.applicantEmail || "",
        applicantPhone:       c.applicantPhone || "",
        applicantAddress:     c.applicantAddress || "",
        workType:             c.workType || "",
        language:             c.language || "",
        isPublished:          c.isPublished ? "Yes" : "No",
        publicationDate:      fmtDate(c.publicationDate),
        status:               (c.status || "draft").replace(/-/g, " "),
        currentStage:         c.currentStage || 1,
        filingDate:           fmtDate(c.filingDate || c.createdAt),
        filesCount:           (c.files || []).length,
        paymentMethod:        c.payment?.method || "",
        paymentAmount:        c.payment?.amount ? `₹${c.payment.amount}` : "",
        additionalApplicants: (c.additionalApplicants || [])
          .map((a) => `${a.name} (${a.email || ""})`)
          .join("; "),
        isDeleted:            c.isDeleted ? "Yes" : "No",
        createdAt:            fmtDate(c.createdAt),
      });
      styleDataRow(row, idx + 2);
    });

    sheet.addRow([]);
    const summaryRow = sheet.addRow([`Total Records: ${copyrights.length}`]);
    summaryRow.getCell(1).font = { bold: true, italic: true, color: { argb: "FF64748B" } };

    const today = new Date().toISOString().slice(0, 10);
    await sendWorkbook(res, workbook, `Copyrights_Export_${today}.xlsx`);
  } catch (err) {
    console.error("exportCopyrights error:", err);
    res.status(500).json({ success: false, message: "Failed to generate copyright export." });
  }
};

// ─────────────────────────────────────────────────
// CONSULTATION EXPORT
// ─────────────────────────────────────────────────
const exportConsultations = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const showDeleted = req.query.showDeleted === "true";
    const filter = { isDeleted: showDeleted };
    if (req.query.status) filter.status = req.query.status;

    const consultations = await Consultation.find(filter).sort({ createdAt: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "IPR Admin";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Consultation Requests", {
      pageSetup: { orientation: "landscape", fitToPage: true },
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = [
      { header: "Consultation ID",   key: "consultationId",   width: 28 },
      { header: "Full Name",         key: "fullName",          width: 25 },
      { header: "Email",             key: "email",             width: 28 },
      { header: "Phone",             key: "phone",             width: 18 },
      { header: "Work Type",         key: "workType",          width: 18 },
      { header: "Consultation Type", key: "consultationType",  width: 18 },
      { header: "Preferred Date",    key: "preferredDate",     width: 16 },
      { header: "Preferred Time",    key: "preferredTime",     width: 14 },
      { header: "Status",            key: "status",            width: 15 },
      { header: "Files Uploaded",    key: "filesCount",        width: 14 },
      { header: "Assigned Attorney", key: "assignedAttorney",  width: 22 },
      { header: "Follow Up Required",key: "followUpRequired",  width: 18 },
      { header: "Follow Up Date",    key: "followUpDate",      width: 16 },
      { header: "Estimated Cost",    key: "estimatedCost",     width: 16 },
      { header: "Actual Cost",       key: "actualCost",        width: 14 },
      { header: "Comm. Preference",  key: "communicationPreference", width: 18 },
      { header: "Marketing Consent", key: "marketingConsent",  width: 18 },
      { header: "Deleted",           key: "isDeleted",         width: 10 },
      { header: "Submitted On",      key: "createdAt",         width: 18 },
    ];

    styleHeaderRow(sheet.getRow(1), "FF0F172A");

    consultations.forEach((c, idx) => {
      const row = sheet.addRow({
        consultationId:         c.consultationId || "",
        fullName:               c.fullName || "",
        email:                  c.email || "",
        phone:                  c.phone || "",
        workType:               c.workType || "",
        consultationType:       c.consultationType || "",
        preferredDate:          fmtDate(c.preferredDate),
        preferredTime:          c.preferredTime || "",
        status:                 c.status || "pending",
        filesCount:             (c.uploadedFiles || []).length,
        assignedAttorney:       c.assignedAttorney || "",
        followUpRequired:       c.followUpRequired ? "Yes" : "No",
        followUpDate:           fmtDate(c.followUpDate),
        estimatedCost:          c.estimatedCost ? `₹${c.estimatedCost}` : "",
        actualCost:             c.actualCost ? `₹${c.actualCost}` : "",
        communicationPreference: c.communicationPreference || "",
        marketingConsent:       c.marketingConsent ? "Yes" : "No",
        isDeleted:              c.isDeleted ? "Yes" : "No",
        createdAt:              fmtDate(c.createdAt),
      });
      styleDataRow(row, idx + 2);
    });

    sheet.addRow([]);
    const summaryRow = sheet.addRow([`Total Records: ${consultations.length}`]);
    summaryRow.getCell(1).font = { bold: true, italic: true, color: { argb: "FF64748B" } };

    const today = new Date().toISOString().slice(0, 10);
    await sendWorkbook(res, workbook, `Consultations_Export_${today}.xlsx`);
  } catch (err) {
    console.error("exportConsultations error:", err);
    res.status(500).json({ success: false, message: "Failed to generate consultation export." });
  }
};

module.exports = { exportPatents, exportCopyrights, exportConsultations };
