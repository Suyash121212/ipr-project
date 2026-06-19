const Copyright = require('../models/Copyright');
const uploadUtils = require('../middleware/upload');
const fs = require('fs');
const uploadToCloudinary = require('../utils/CloudinaryUpload');

// @desc    Get copyright statistics
const getStats = async (req, res) => {
  try {
    const totalCopyrights = await Copyright.countDocuments();
    const draftCopyrights = await Copyright.countDocuments({ status: 'draft' });
    const submittedCopyrights = await Copyright.countDocuments({ status: 'submitted' });
    const underReviewCopyrights = await Copyright.countDocuments({ status: 'under-review' });
    const registeredCopyrights = await Copyright.countDocuments({ status: 'registered' });

    const workTypeStats = await Copyright.aggregate([
      {
        $group: {
          _id: '$workType',
          count: { $sum: 1 }
        }
      }
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCopyrights = await Copyright.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
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
        workTypeBreakdown: workTypeStats
      }
    });
  } catch (error) {
    console.error('Error fetching copyright stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching statistics'
    });
  }
};

// @desc    Get copyright count for a specific user
const getUserCopyrightCount = async (req, res) => {
  try {
    const { clerkUserId } = req.params;

    const [total, draft, submitted, underReview, registered, rejected] = await Promise.all([
      Copyright.countDocuments({ clerkUserId }),
      Copyright.countDocuments({ clerkUserId, status: 'draft' }),
      Copyright.countDocuments({ clerkUserId, status: 'submitted' }),
      Copyright.countDocuments({ clerkUserId, status: 'under-review' }),
      Copyright.countDocuments({ clerkUserId, status: 'registered' }),
      Copyright.countDocuments({ clerkUserId, status: 'rejected' })
    ]);

    res.json({
      success: true,
      data: { total, draft, submitted, underReview, registered, rejected }
    });
  } catch (error) {
    console.error('Error fetching copyright count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching copyright count'
    });
  }
};

// @desc    Get a specific copyright for a user (by ID or application number)
const getUserCopyrightById = async (req, res) => {
  try {
    const { clerkUserId, copyrightId } = req.params;

    const copyright = await Copyright.findOne({
      clerkUserId,
      $or: [
        { _id: copyrightId },
        { applicationNumber: copyrightId }
      ]
    });

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: 'Copyright application not found'
      });
    }

    res.json({ success: true, data: copyright });
  } catch (error) {
    console.error('Error fetching copyright details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching copyright details'
    });
  }
};

// @desc    Get all copyrights for a specific user (paginated)
const getUserCopyrights = async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [copyrights, total] = await Promise.all([
      Copyright.find({ clerkUserId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Copyright.countDocuments({ clerkUserId })
    ]);

    res.json({
      success: true,
      data: copyrights,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user copyrights:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching copyright applications'
    });
  }
};

// @desc    Create a new copyright application
const createCopyright = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    if (!payload.clerkUserId) {
      return res.status(400).json({ success: false, error: 'User authentication required' });
    }

    const copyright = new Copyright(payload);
    const saved = await copyright.save();

    res.status(201).json({
      success: true,
      message: 'Copyright application created successfully',
      data: saved
    });
  } catch (error) {
    console.error('[copyright] POST / error:', error);

    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }

    res.status(400).json({
      success: false,
      error: 'Failed to create copyright application',
      details: error.message
    });
  }
};

// @desc    Get all copyright applications — Admin only (paginated, filterable)
const getAllCopyrights = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.workType) filter.workType = req.query.workType;

    const [copyrights, total] = await Promise.all([
      Copyright.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Copyright.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: copyrights,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching copyrights:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching copyright applications'
    });
  }
};

// @desc    Get a copyright by ID or application number
const getCopyrightById = async (req, res) => {
  try {
    const copyright = await Copyright.findOne({
      $or: [
        { _id: req.params.id },
        { applicationNumber: req.params.id }
      ]
    });

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: 'Copyright application not found'
      });
    }

    res.json({ success: true, data: copyright });
  } catch (error) {
    console.error('Error fetching copyright:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching copyright application'
    });
  }
};

// @desc    Update a copyright — Admin only
const updateCopyright = async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['status', 'currentStep', 'currentStage', 'applicationNumber', 'filingDate'];

    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) filteredUpdates[field] = updates[field];
    });

    if (filteredUpdates.currentStage !== undefined) {
      filteredUpdates.currentStage = Number(filteredUpdates.currentStage);
    }

    const copyright = await Copyright.findOneAndUpdate(
      {
        $or: [
          { _id: req.params.id },
          { applicationNumber: req.params.id }
        ]
      },
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: 'Copyright application not found'
      });
    }

    res.json({
      success: true,
      message: 'Copyright application updated successfully',
      data: copyright
    });
  } catch (error) {
    console.error('Error updating copyright:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating copyright application'
    });
  }
};

// @desc    Delete a copyright application
const deleteCopyright = async (req, res) => {
  try {
    const { clerkUserId, isAdmin } = req.body;

    const copyright = await Copyright.findOne({
      $or: [
        { _id: req.params.id },
        { applicationNumber: req.params.id }
      ]
    });

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: 'Copyright application not found'
      });
    }

    if (!isAdmin && clerkUserId && copyright.clerkUserId !== clerkUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own applications.'
      });
    }

    if (copyright.files?.length > 0) {
      copyright.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (err) {
          console.error(`Failed to delete file ${file.path}:`, err);
        }
      });
    }

    await Copyright.findByIdAndDelete(copyright._id);

    return res.json({
      success: true,
      message: 'Copyright application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting copyright:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting copyright application'
    });
  }
};

// @desc    Upload primary work file
const uploadPrimaryFile = async (req, res) => {
  try {
    const copyright = await Copyright.findById(req.params.id);
    if (!copyright) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Copyright application not found' });
    }

    // ← actual Cloudinary upload (was missing entirely)
    const result = await uploadToCloudinary(req.file, 'IPR_web/copyrights/primary-file');

    const fileMeta = {
      filename: result.public_id,
      originalName: req.file.originalname,
      cloudinaryUrl: result.secure_url,
      download_url: result.secure_url.replace('/upload/', '/upload/fl_attachment/'),
      publicId: result.public_id,
      resourceType: result.resource_type,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadDate: new Date()
    };

    // Primary file goes first, replacing any existing primary
    copyright.files = [fileMeta, ...copyright.files];
    await copyright.save();

    res.json({ success: true, message: 'Primary file uploaded successfully', data: fileMeta });
  } catch (error) {
    console.error('[copyright] uploadPrimaryFile error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Failed to upload primary file', details: error.message });
  }
};

// @desc    Upload supporting documents
const uploadSupportingDocuments = async (req, res) => {
  try {
    const copyright = await Copyright.findById(req.params.id);
    if (!copyright) {
      req.files?.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
      return res.status(404).json({ success: false, message: 'Copyright application not found' });
    }

    // ← actual Cloudinary upload for each file (was missing entirely)
    const docs = await Promise.all(
      req.files.map(async (f) => {
        const result = await uploadToCloudinary(f, 'IPR_web/copyrights/supporting-documents');
        return {
          filename: result.public_id,
          originalName: f.originalname,
          cloudinaryUrl: result.secure_url,
          download_url: result.secure_url.replace('/upload/', '/upload/fl_attachment/'),
          publicId: result.public_id,
          resourceType: result.resource_type,
          size: f.size,
          mimetype: f.mimetype,
          uploadDate: new Date()
        };
      })
    );

    copyright.files.push(...docs);
    await copyright.save();

    res.json({ success: true, message: 'Supporting documents uploaded successfully', data: docs });
  } catch (error) {
    console.error('[copyright] uploadSupportingDocuments error:', error);
    req.files?.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
    res.status(500).json({ success: false, message: 'Failed to upload supporting documents', details: error.message });
  }
};
// @desc    Update current step
const updateStep = async (req, res) => {
  try {
    const { step } = req.body;
    if (typeof step !== 'number' || step < 1 || step > 6) {
      return res.status(400).json({ success: false, message: 'Invalid step value' });
    }

    const updated = await Copyright.findByIdAndUpdate(
      req.params.id,
      { currentStep: step },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Copyright application not found'
      });
    }

    res.json({ success: true, message: 'Step updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update step',
      details: error.message
    });
  }
};

// @desc    Record payment and mark application as submitted
const recordPayment = async (req, res) => {
  try {
    const { amount, method, transactionId } = req.body || {};
    const copyright = await Copyright.findById(req.params.id);

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: 'Copyright application not found'
      });
    }

    copyright.payment = {
      amount: amount || 0,
      method: method || 'unknown',
      transactionId: transactionId || null,
      date: new Date()
    };
    copyright.status = 'submitted';
    copyright.currentStep = Math.max(copyright.currentStep || 1, 4);

    await copyright.save();

    res.json({
      success: true,
      message: 'Payment recorded and application submitted successfully',
      data: copyright
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment recording failed',
      details: error.message
    });
  }
};

// @desc    Download a file attached to a copyright
const downloadFile = async (req, res) => {
  try {
    const copyright = await Copyright.findById(req.params.id);
    if (!copyright) {
      return res.status(404).json({ success: false, message: 'Copyright application not found' });
    }

    const file = copyright.files.find(f => f._id?.toString() === req.params.fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const cloudinaryUrl = file.download_url || file.cloudinaryUrl;
    if (!cloudinaryUrl) {
      return res.status(404).json({ success: false, message: 'No download URL on file record' });
    }

    const downloadUrl = cloudinaryUrl.includes('fl_attachment')
      ? cloudinaryUrl
      : cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');

    const axios = require('axios');
    const response = await axios.get(downloadUrl, { responseType: 'stream' });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName || 'download')}"`);
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    response.data.pipe(res);
  } catch (error) {
    console.error('Copyright download error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to download file', details: error.message });
  }
};

// @desc    Get registration certificate (only if status is 'registered')
const getCertificate = async (req, res) => {
  try {
    const copyright = await Copyright.findById(req.params.id);
    if (!copyright) {
      return res.status(404).json({ success: false, message: 'Copyright application not found' });
    }

    if (copyright.status !== 'registered') {
      return res.json({
        success: false,
        message: 'Certificate not yet issued',
        status: copyright.status,
        currentStep: copyright.currentStep
      });
    }

    res.json({
      success: true,
      message: 'Certificate available',
      applicationNumber: copyright.applicationNumber,
      registeredOn: copyright.updatedAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificate',
      details: error.message
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
  uploadPrimaryFile,
  uploadSupportingDocuments,
  updateStep,
  recordPayment,
  downloadFile,
  getCertificate
};