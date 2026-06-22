const path = require("path");
const fs = require("fs");
const Patent = require("../models/Patent");
const { buildFileMeta } = require("../middleware/upload");

// ──────────────────────────────────────────────
// STATS & ADMIN
// ──────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const base = { isDeleted: false };
    const [
      totalPatents,
      draftPatents,
      submittedPatents,
      underExaminationPatents,
      grantedPatents,
      publishedPatents,
      patentTypeStats,
    ] = await Promise.all([
      Patent.countDocuments(base),
      Patent.countDocuments({ ...base, status: "draft" }),
      Patent.countDocuments({ ...base, status: "submitted" }),
      Patent.countDocuments({ ...base, status: "under-examination" }),
      Patent.countDocuments({ ...base, status: "granted" }),
      Patent.countDocuments({ ...base, status: "published" }),
      Patent.aggregate([
        { $match: base },
        { $group: { _id: "$patentType", count: { $sum: 1 } } },
      ]),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPatents = await Patent.countDocuments({
      ...base,
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      success: true,
      data: {
        total: totalPatents,
        draft: draftPatents,
        submitted: submittedPatents,
        underExamination: underExaminationPatents,
        granted: grantedPatents,
        published: publishedPatents,
        recent: recentPatents,
        patentTypeBreakdown: patentTypeStats,
      },
    });
  } catch (error) {
    console.error("Error fetching patent stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching statistics",
    });
  }
};

// ──────────────────────────────────────────────
// ALL PATENTS (Admin) — excludes soft-deleted by default
// ──────────────────────────────────────────────

const getAllPatents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ?showDeleted=true lets admin view the trash bin
    const showDeleted = req.query.showDeleted === "true";
    const filter = { isDeleted: showDeleted };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.patentType) filter.patentType = req.query.patentType;
    if (req.query.clerkUserId) filter.clerkUserId = req.query.clerkUserId;

    const [patents, total] = await Promise.all([
      Patent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Patent.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: patents,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching patents:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching patent applications",
    });
  }
};

// ──────────────────────────────────────────────
// USER-SCOPED QUERIES
// Users always see ALL their own applications,
// regardless of whether admin has soft-deleted them.
// isDeleted only hides records from the ADMIN list.
// ──────────────────────────────────────────────

const getUserPatentCount = async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    // No isDeleted filter — user sees everything they submitted
    const base = { clerkUserId };

    const [total, draft, submitted, underExamination, granted, published, rejected] =
      await Promise.all([
        Patent.countDocuments(base),
        Patent.countDocuments({ ...base, status: "draft" }),
        Patent.countDocuments({ ...base, status: "submitted" }),
        Patent.countDocuments({ ...base, status: "under-examination" }),
        Patent.countDocuments({ ...base, status: "granted" }),
        Patent.countDocuments({ ...base, status: "published" }),
        Patent.countDocuments({ ...base, status: "rejected" }),
      ]);

    res.json({
      success: true,
      data: { total, draft, submitted, underExamination, granted, published, rejected },
    });
  } catch (error) {
    console.error("Error fetching patent count:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching patent count",
    });
  }
};

const getUserPatents = async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // No isDeleted filter — user always sees their own applications
    const filter = { clerkUserId };

    const [patents, total] = await Promise.all([
      Patent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Patent.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: patents,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching user patents:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching patent applications",
    });
  }
};

const getUserPatentById = async (req, res) => {
  try {
    const { clerkUserId, patentId } = req.params;

    // No isDeleted filter — user can always view their own application detail
    const patent = await Patent.findOne({
      clerkUserId,
      $or: [{ _id: patentId }, { applicationNumber: patentId }],
    });

    if (!patent) {
      return res
        .status(404)
        .json({ success: false, message: "Patent application not found" });
    }

    res.json({ success: true, data: patent });
  } catch (error) {
    console.error("Error fetching patent details:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching patent details",
    });
  }
};

// ──────────────────────────────────────────────
// CRUD
// ──────────────────────────────────────────────

const createPatent = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.inventionTitle) {
      return res
        .status(400)
        .json({ success: false, error: "Invention title is required" });
    }
    if (!payload.clerkUserId) {
      return res
        .status(400)
        .json({ success: false, error: "User authentication required" });
    }

    const patent = new Patent(payload);
    const savedPatent = await patent.save();

    res.status(201).json({
      success: true,
      message: "Patent application created successfully",
      data: savedPatent,
    });
  } catch (error) {
    console.error("Error creating patent:", error);
    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return res
        .status(400)
        .json({ success: false, message: "Validation error", errors });
    }
    res.status(400).json({
      success: false,
      error: "Failed to create patent application",
      details: error.message,
    });
  }
};

const getPatentById = async (req, res) => {
  try {
    const patent = await Patent.findOne({
      isDeleted: false,
      $or: [{ _id: req.params.id }, { applicationNumber: req.params.id }],
    });

    if (!patent) {
      return res
        .status(404)
        .json({ success: false, message: "Patent application not found" });
    }

    res.json({ success: true, data: patent });
  } catch (error) {
    console.error("Error fetching patent:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching patent application",
    });
  }
};

const updatePatent = async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      "status",
      "currentStep",
      "currentStage",
      "applicationNumber",
      "filingDate",
    ];

    const filteredUpdates = {};
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) filteredUpdates[field] = updates[field];
    });

    if (filteredUpdates.currentStage !== undefined) {
      filteredUpdates.currentStage = Number(filteredUpdates.currentStage);
    }

    const patent = await Patent.findOneAndUpdate(
      {
        isDeleted: false,
        $or: [{ _id: req.params.id }, { applicationNumber: req.params.id }],
      },
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );

    if (!patent) {
      return res
        .status(404)
        .json({ success: false, message: "Patent application not found" });
    }

    res.json({
      success: true,
      message: "Patent application updated successfully",
      data: patent,
    });
  } catch (error) {
    console.error("Error updating patent:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while updating patent application",
    });
  }
};

// ──────────────────────────────────────────────
// SOFT DELETE  (replaces hard delete)
// ──────────────────────────────────────────────

const deletePatent = async (req, res) => {
  try {
    const { clerkUserId, isAdmin } = req.body;

    const patent = await Patent.findOne({
      isDeleted: false,
      $or: [{ _id: req.params.id }, { applicationNumber: req.params.id }],
    });

    if (!patent) {
      return res
        .status(404)
        .json({ success: false, message: "Patent application not found" });
    }

    if (!isAdmin && clerkUserId && patent.clerkUserId !== clerkUserId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own applications.",
      });
    }

    // Soft delete — mark as deleted, keep files and data intact
    patent.isDeleted = true;
    patent.deletedAt = new Date();
    patent.deletedBy = isAdmin ? "ADMIN" : (clerkUserId || "UNKNOWN");
    await patent.save();

    res.json({
      success: true,
      message: "Patent application deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting patent:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while deleting patent application",
    });
  }
};

// ──────────────────────────────────────────────
// RESTORE  (admin only — undoes soft delete)
// ──────────────────────────────────────────────

const restorePatent = async (req, res) => {
  try {
    const patent = await Patent.findOne({
      isDeleted: true,
      $or: [{ _id: req.params.id }, { applicationNumber: req.params.id }],
    });

    if (!patent) {
      return res.status(404).json({
        success: false,
        message: "Deleted patent application not found",
      });
    }

    patent.isDeleted = false;
    patent.deletedAt = null;
    patent.deletedBy = null;
    await patent.save();

    res.json({
      success: true,
      message: "Patent application restored successfully.",
      data: patent,
    });
  } catch (error) {
    console.error("Error restoring patent:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while restoring patent application",
    });
  }
};

// ──────────────────────────────────────────────
// FILE UPLOADS (local disk)
// ──────────────────────────────────────────────

const uploadTechnicalDrawings = async (req, res) => {
  try {
    const patent = await Patent.findOne({ _id: req.params.id, isDeleted: false });
    if (!patent) {
      req.files?.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
      return res
        .status(404)
        .json({ success: false, message: "Patent application not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const drawings = req.files.map((file) => buildFileMeta(file, "patents"));
    patent.technicalDrawings.push(...drawings);
    await patent.save();

    res.json({
      success: true,
      message: "Technical drawings uploaded successfully",
      data: drawings,
    });
  } catch (error) {
    console.error("Error uploading technical drawings:", error);
    req.files?.forEach((file) => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
    res.status(500).json({
      success: false,
      message: "Failed to upload technical drawings",
      details: error.message,
    });
  }
};

const uploadSupportingDocuments = async (req, res) => {
  try {
    const patent = await Patent.findOne({ _id: req.params.id, isDeleted: false });
    if (!patent) {
      req.files?.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
      return res
        .status(404)
        .json({ success: false, message: "Patent application not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const documents = req.files.map((file) => buildFileMeta(file, "patents"));
    patent.supportingDocuments.push(...documents);
    await patent.save();

    res.json({
      success: true,
      message: "Supporting documents uploaded successfully",
      data: documents,
    });
  } catch (error) {
    console.error("Error uploading supporting documents:", error);
    req.files?.forEach((file) => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
    res.status(500).json({
      success: false,
      message: "Failed to upload supporting documents",
      details: error.message,
    });
  }
};

// ──────────────────────────────────────────────
// PATCH HELPERS
// ──────────────────────────────────────────────

const updateCompletedDocuments = async (req, res) => {
  try {
    const patent = await Patent.findOne({ _id: req.params.id, isDeleted: false });
    if (!patent) {
      return res
        .status(404)
        .json({ success: false, message: "Patent application not found" });
    }

    patent.completedDocuments = req.body.documentIds || [];
    await patent.save();

    res.json({
      success: true,
      message: "Completed documents updated successfully",
      data: patent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update completed documents",
      details: error.message,
    });
  }
};

const updateStep = async (req, res) => {
  try {
    const { step } = req.body;
    if (typeof step !== "number" || step < 1 || step > 6) {
      return res.status(400).json({ success: false, message: "Invalid step value" });
    }

    const patent = await Patent.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { currentStep: step },
      { new: true }
    );

    if (!patent) {
      return res
        .status(404)
        .json({ success: false, message: "Patent application not found" });
    }

    res.json({ success: true, message: "Step updated successfully", data: patent });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update step",
      details: error.message,
    });
  }
};

// ──────────────────────────────────────────────
// FILE DOWNLOAD
// ──────────────────────────────────────────────

const downloadFile = async (req, res) => {
  try {
    const patent = await Patent.findOne({ _id: req.params.id, isDeleted: false });
    if (!patent) {
      return res
        .status(404)
        .json({ success: false, message: "Patent application not found" });
    }

    const file = [
      ...(patent.technicalDrawings || []),
      ...(patent.supportingDocuments || []),
    ].find((f) => f._id?.toString() === req.params.fileId);

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const filePath = file.filePath || file.path;
    if (!filePath) {
      return res
        .status(404)
        .json({ success: false, message: "File path not recorded" });
    }

    const absolute = path.resolve(path.join(__dirname, "..", filePath));
    if (!fs.existsSync(absolute)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found on disk" });
    }

    const originalName = file.originalName || file.fileName || "download";
    return res.download(absolute, originalName);
  } catch (error) {
    console.error("Download error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to download file",
      details: error.message,
    });
  }
};

// ──────────────────────────────────────────────
// CERTIFICATE
// ──────────────────────────────────────────────

const getCertificate = async (req, res) => {
  try {
    const patent = await Patent.findOne({ _id: req.params.id, isDeleted: false });
    if (!patent) {
      return res
        .status(404)
        .json({ success: false, message: "Patent application not found" });
    }

    if (!["granted", "published", "approved"].includes(patent.status)) {
      return res.json({
        success: false,
        message: "Certificate not yet issued",
        status: patent.status,
        currentStep: patent.currentStep,
      });
    }

    res.json({
      success: true,
      message: "Certificate available",
      applicationNumber: patent.applicationNumber,
      grantedOn: patent.updatedAt,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch certificate",
      details: error.message,
    });
  }
};

module.exports = {
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
};
