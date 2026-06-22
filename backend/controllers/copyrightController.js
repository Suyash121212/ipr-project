const path = require("path");
const fs = require("fs");
const Copyright = require("../models/Copyright");
const { buildFileMeta } = require("../middleware/upload");

// ──────────────────────────────────────────────
// STATS
// ──────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const base = { isDeleted: false };

    const [
      totalCopyrights,
      draftCopyrights,
      submittedCopyrights,
      underReviewCopyrights,
      registeredCopyrights,
      workTypeStats,
    ] = await Promise.all([
      Copyright.countDocuments(base),
      Copyright.countDocuments({ ...base, status: "draft" }),
      Copyright.countDocuments({ ...base, status: "submitted" }),
      Copyright.countDocuments({ ...base, status: "under-review" }),
      Copyright.countDocuments({ ...base, status: "registered" }),
      Copyright.aggregate([
        { $match: base },
        { $group: { _id: "$workType", count: { $sum: 1 } } },
      ]),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCopyrights = await Copyright.countDocuments({
      ...base,
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      success: true,
      data: {
        total: totalCopyrights,
        draft: draftCopyrights,
        submitted: submittedCopyrights,
        underReview: underReviewCopyrights,
        registered: registeredCopyrights,
        recent: recentCopyrights,
        workTypeBreakdown: workTypeStats,
      },
    });
  } catch (error) {
    console.error("Error fetching copyright stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching statistics",
    });
  }
};

// ──────────────────────────────────────────────
// USER-SCOPED
// Users always see ALL their own applications,
// regardless of whether admin has soft-deleted them.
// ──────────────────────────────────────────────

const getUserCopyrightCount = async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    // No isDeleted filter — user sees everything they submitted
    const base = { clerkUserId };

    const [total, draft, submitted, underReview, registered, rejected] =
      await Promise.all([
        Copyright.countDocuments(base),
        Copyright.countDocuments({ ...base, status: "draft" }),
        Copyright.countDocuments({ ...base, status: "submitted" }),
        Copyright.countDocuments({ ...base, status: "under-review" }),
        Copyright.countDocuments({ ...base, status: "registered" }),
        Copyright.countDocuments({ ...base, status: "rejected" }),
      ]);

    res.json({
      success: true,
      data: { total, draft, submitted, underReview, registered, rejected },
    });
  } catch (error) {
    console.error("Error fetching copyright count:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching copyright count",
    });
  }
};

const getUserCopyrightById = async (req, res) => {
  try {
    const { clerkUserId, copyrightId } = req.params;

    // No isDeleted filter — user can always view their own application
    const copyright = await Copyright.findOne({
      clerkUserId,
      $or: [{ _id: copyrightId }, { applicationNumber: copyrightId }],
    });

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: "Copyright application not found",
      });
    }

    res.json({ success: true, data: copyright });
  } catch (error) {
    console.error("Error fetching copyright details:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching copyright details",
    });
  }
};

const getUserCopyrights = async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // No isDeleted filter — user always sees their own applications
    const filter = { clerkUserId };

    const [copyrights, total] = await Promise.all([
      Copyright.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Copyright.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: copyrights,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching user copyrights:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching copyright applications",
    });
  }
};

// ──────────────────────────────────────────────
// CREATE
// ──────────────────────────────────────────────

const createCopyright = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.title) {
      return res.status(400).json({ success: false, error: "Title is required" });
    }
    if (!payload.clerkUserId) {
      return res.status(400).json({ success: false, error: "User authentication required" });
    }

    const copyright = new Copyright(payload);
    const saved = await copyright.save();

    res.status(201).json({
      success: true,
      message: "Copyright application created successfully",
      data: saved,
    });
  } catch (error) {
    console.error("[copyright] POST / error:", error);
    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ success: false, message: "Validation error", errors });
    }
    res.status(400).json({
      success: false,
      error: "Failed to create copyright application",
      details: error.message,
    });
  }
};

// ──────────────────────────────────────────────
// ADMIN LIST — excludes soft-deleted by default
// ──────────────────────────────────────────────

const getAllCopyrights = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const showDeleted = req.query.showDeleted === "true";
    const filter = { isDeleted: showDeleted };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.workType) filter.workType = req.query.workType;

    const [copyrights, total] = await Promise.all([
      Copyright.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Copyright.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: copyrights,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching copyrights:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching copyright applications",
    });
  }
};

// ──────────────────────────────────────────────
// GET BY ID
// ──────────────────────────────────────────────

const getCopyrightById = async (req, res) => {
  try {
    const copyright = await Copyright.findOne({
      isDeleted: false,
      $or: [{ _id: req.params.id }, { applicationNumber: req.params.id }],
    });

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: "Copyright application not found",
      });
    }

    res.json({ success: true, data: copyright });
  } catch (error) {
    console.error("Error fetching copyright:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching copyright application",
    });
  }
};

// ──────────────────────────────────────────────
// UPDATE (Admin)
// ──────────────────────────────────────────────

const updateCopyright = async (req, res) => {
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

    const copyright = await Copyright.findOneAndUpdate(
      {
        isDeleted: false,
        $or: [{ _id: req.params.id }, { applicationNumber: req.params.id }],
      },
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: "Copyright application not found",
      });
    }

    res.json({
      success: true,
      message: "Copyright application updated successfully",
      data: copyright,
    });
  } catch (error) {
    console.error("Error updating copyright:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while updating copyright application",
    });
  }
};

// ──────────────────────────────────────────────
// SOFT DELETE
// ──────────────────────────────────────────────

const deleteCopyright = async (req, res) => {
  try {
    const { clerkUserId, isAdmin } = req.body;

    const copyright = await Copyright.findOne({
      isDeleted: false,
      $or: [{ _id: req.params.id }, { applicationNumber: req.params.id }],
    });

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: "Copyright application not found",
      });
    }

    if (!isAdmin && clerkUserId && copyright.clerkUserId !== clerkUserId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own applications.",
      });
    }

    // Soft delete — files stay on disk, record stays in DB
    copyright.isDeleted = true;
    copyright.deletedAt = new Date();
    copyright.deletedBy = isAdmin ? "ADMIN" : (clerkUserId || "UNKNOWN");
    await copyright.save();

    return res.json({
      success: true,
      message: "Copyright application deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting copyright:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while deleting copyright application",
    });
  }
};

// ──────────────────────────────────────────────
// RESTORE (admin only)
// ──────────────────────────────────────────────

const restoreCopyright = async (req, res) => {
  try {
    const copyright = await Copyright.findOne({
      isDeleted: true,
      $or: [{ _id: req.params.id }, { applicationNumber: req.params.id }],
    });

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: "Deleted copyright application not found",
      });
    }

    copyright.isDeleted = false;
    copyright.deletedAt = null;
    copyright.deletedBy = null;
    await copyright.save();

    res.json({
      success: true,
      message: "Copyright application restored successfully.",
      data: copyright,
    });
  } catch (error) {
    console.error("Error restoring copyright:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while restoring copyright application",
    });
  }
};

// ──────────────────────────────────────────────
// FILE UPLOADS (local disk)
// ──────────────────────────────────────────────

const uploadPrimaryFile = async (req, res) => {
  try {
    const copyright = await Copyright.findOne({ _id: req.params.id, isDeleted: false });
    if (!copyright) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Copyright application not found" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileMeta = buildFileMeta(req.file, "copyrights");
    copyright.files = [fileMeta, ...copyright.files];
    await copyright.save();

    res.json({
      success: true,
      message: "Primary file uploaded successfully",
      data: fileMeta,
    });
  } catch (error) {
    console.error("[copyright] uploadPrimaryFile error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: "Failed to upload primary file",
      details: error.message,
    });
  }
};

const uploadSupportingDocuments = async (req, res) => {
  try {
    const copyright = await Copyright.findOne({ _id: req.params.id, isDeleted: false });
    if (!copyright) {
      req.files?.forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
      return res.status(404).json({ success: false, message: "Copyright application not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const docs = req.files.map((f) => buildFileMeta(f, "copyrights"));
    copyright.files.push(...docs);
    await copyright.save();

    res.json({
      success: true,
      message: "Supporting documents uploaded successfully",
      data: docs,
    });
  } catch (error) {
    console.error("[copyright] uploadSupportingDocuments error:", error);
    req.files?.forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
    res.status(500).json({
      success: false,
      message: "Failed to upload supporting documents",
      details: error.message,
    });
  }
};

// ──────────────────────────────────────────────
// STEP UPDATE
// ──────────────────────────────────────────────

const updateStep = async (req, res) => {
  try {
    const { step } = req.body;
    if (typeof step !== "number" || step < 1 || step > 6) {
      return res.status(400).json({ success: false, message: "Invalid step value" });
    }

    const updated = await Copyright.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { currentStep: step },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Copyright application not found",
      });
    }

    res.json({ success: true, message: "Step updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update step",
      details: error.message,
    });
  }
};

// ──────────────────────────────────────────────
// PAYMENT
// ──────────────────────────────────────────────

const recordPayment = async (req, res) => {
  try {
    const { amount, method, transactionId } = req.body || {};
    const copyright = await Copyright.findOne({ _id: req.params.id, isDeleted: false });

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: "Copyright application not found",
      });
    }

    copyright.payment = {
      amount: amount || 0,
      method: method || "unknown",
      transactionId: transactionId || null,
      date: new Date(),
    };
    copyright.status = "submitted";
    copyright.currentStep = Math.max(copyright.currentStep || 1, 4);
    await copyright.save();

    res.json({
      success: true,
      message: "Payment recorded and application submitted successfully",
      data: copyright,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment recording failed",
      details: error.message,
    });
  }
};

// ──────────────────────────────────────────────
// FILE DOWNLOAD
// ──────────────────────────────────────────────

const downloadFile = async (req, res) => {
  try {
    const copyright = await Copyright.findOne({ _id: req.params.id, isDeleted: false });
    if (!copyright) {
      return res.status(404).json({ success: false, message: "Copyright application not found" });
    }

    const file = copyright.files.find((f) => f._id?.toString() === req.params.fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const filePath = file.filePath || file.path;
    if (!filePath) {
      return res.status(404).json({ success: false, message: "File path not recorded" });
    }

    const absolute = path.resolve(path.join(__dirname, "..", filePath));
    if (!fs.existsSync(absolute)) {
      return res.status(404).json({ success: false, message: "File not found on disk" });
    }

    const originalName = file.originalName || file.fileName || "download";
    return res.download(absolute, originalName);
  } catch (error) {
    console.error("Copyright download error:", error.message);
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
    const copyright = await Copyright.findOne({ _id: req.params.id, isDeleted: false });
    if (!copyright) {
      return res.status(404).json({ success: false, message: "Copyright application not found" });
    }

    if (copyright.status !== "registered") {
      return res.json({
        success: false,
        message: "Certificate not yet issued",
        status: copyright.status,
        currentStep: copyright.currentStep,
      });
    }

    res.json({
      success: true,
      message: "Certificate available",
      applicationNumber: copyright.applicationNumber,
      registeredOn: copyright.updatedAt,
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
};
