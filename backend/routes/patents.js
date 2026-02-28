const express = require('express');
const router = express.Router();
const Patent = require('../models/Patent');
const uploadUtils = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// ============================================
// SPECIFIC ROUTES FIRST (before /:id routes)
// ============================================

// @route   GET /api/patent/stats/overview
// @desc    Get patent statistics (Admin)
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const totalPatents = await Patent.countDocuments();
    const draftPatents = await Patent.countDocuments({ status: 'draft' });
    const submittedPatents = await Patent.countDocuments({ status: 'submitted' });
    const underExaminationPatents = await Patent.countDocuments({ status: 'under-examination' });
    const grantedPatents = await Patent.countDocuments({ status: 'granted' });
    const publishedPatents = await Patent.countDocuments({ status: 'published' });

    const patentTypeStats = await Patent.aggregate([
      {
        $group: {
          _id: '$patentType',
          count: { $sum: 1 }
        }
      }
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPatents = await Patent.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
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
        patentTypeBreakdown: patentTypeStats
      }
    });
  } catch (error) {
    console.error('Error fetching patent stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching statistics'
    });
  }
});

// @route   GET /api/patent/user/:clerkUserId/count
// @desc    Get patent count for user
// @access  Private
router.get('/user/:clerkUserId/count', async (req, res) => {
  try {
    const total = await Patent.countDocuments({
      clerkUserId: req.params.clerkUserId
    });

    const draft = await Patent.countDocuments({
      clerkUserId: req.params.clerkUserId,
      status: 'draft'
    });

    const submitted = await Patent.countDocuments({
      clerkUserId: req.params.clerkUserId,
      status: 'submitted'
    });

    const underExamination = await Patent.countDocuments({
      clerkUserId: req.params.clerkUserId,
      status: 'under-examination'
    });

    const granted = await Patent.countDocuments({
      clerkUserId: req.params.clerkUserId,
      status: 'granted'
    });

    const published = await Patent.countDocuments({
      clerkUserId: req.params.clerkUserId,
      status: 'published'
    });

    const rejected = await Patent.countDocuments({
      clerkUserId: req.params.clerkUserId,
      status: 'rejected'
    });

    res.json({
      success: true,
      data: {
        total,
        draft,
        submitted,
        underExamination,
        granted,
        published,
        rejected
      }
    });
  } catch (error) {
    console.error('Error fetching patent count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching patent count'
    });
  }
});

// @route   GET /api/patent/user/:clerkUserId/:patentId
// @desc    Get specific patent details for user
// @access  Private
router.get('/user/:clerkUserId/:patentId', async (req, res) => {
  try {
    const patent = await Patent.findOne({
      clerkUserId: req.params.clerkUserId,
      $or: [
        { _id: req.params.patentId },
        { applicationNumber: req.params.patentId }
      ]
    });

    if (!patent) {
      return res.status(404).json({
        success: false,
        message: 'Patent application not found'
      });
    }

    res.json({
      success: true,
      data: patent
    });
  } catch (error) {
    console.error('Error fetching patent details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching patent details'
    });
  }
});

// @route   GET /api/patent/user/:clerkUserId
// @desc    Get patent applications for specific user
// @access  Private
router.get('/user/:clerkUserId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

   // console.log(`[patent] Fetching patents for user: ${req.params.clerkUserId}`);

    const patents = await Patent.find({
      clerkUserId: req.params.clerkUserId
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Patent.countDocuments({
      clerkUserId: req.params.clerkUserId
    });

    //console.log(`[patent] Found ${patents.length} patents for user ${req.params.clerkUserId}`);

    res.json({
      success: true,
      data: patents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user patents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching patent applications'
    });
  }
});

// ============================================
// GENERIC ROUTES (after specific routes)
// ============================================

// @route   POST /api/patent
// @desc    Create a new patent application
// @access  Private
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    //console.log('[patent] POST / - payload:', JSON.stringify(payload));

    // Basic validation
    if (!payload.inventionTitle) {
      return res.status(400).json({
        success: false,
        error: 'Invention title is required'
      });
    }
    if (!payload.clerkUserId) {
      return res.status(400).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const patent = new Patent(payload);
    const savedPatent = await patent.save();

   // console.log('[patent] created id:', savedPatent._id);

    res.status(201).json({
      success: true,
      message: 'Patent application created successfully',
      data: savedPatent
    });
  } catch (error) {
    console.error('[patent] POST / error:', error);

    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(400).json({
      success: false,
      error: 'Failed to create patent application',
      details: error.message
    });
  }
});

// @route   GET /api/patent
// @desc    Get all patent applications (Admin only)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.patentType) {
      filter.patentType = req.query.patentType;
    }

    const patents = await Patent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Patent.countDocuments(filter);

    res.json({
      success: true,
      data: patents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching patents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching patent applications'
    });
  }
});

// @route   GET /api/patent/:id
// @desc    Get patent by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const patent = await Patent.findOne({
      $or: [
        { _id: req.params.id },
        { applicationNumber: req.params.id }
      ]
    });

    if (!patent) {
      return res.status(404).json({
        success: false,
        message: 'Patent application not found'
      });
    }

    res.json({
      success: true,
      data: patent
    });
  } catch (error) {
    console.error('Error fetching patent:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching patent application'
    });
  }
});

// @route   PUT /api/patent/:id
// @desc    Update patent application
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    // FIX 1: Added 'currentStage' and 'status' to allowed updates
    const allowedUpdates = ['status', 'currentStep', 'currentStage', 'applicationNumber', 'filingDate'];

    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // FIX 2: Parse currentStage as Number directly in filteredUpdates (removed broken updateData ref)
    if (filteredUpdates.currentStage !== undefined) {
      filteredUpdates.currentStage = Number(filteredUpdates.currentStage);
    }

    const patent = await Patent.findOneAndUpdate(
      {
        $or: [
          { _id: req.params.id },
          { applicationNumber: req.params.id }
        ]
      },
      { $set: filteredUpdates },  // FIX 3: Use $set to avoid accidentally wiping other fields
      { new: true, runValidators: true }
    );

    if (!patent) {
      return res.status(404).json({
        success: false,
        message: 'Patent application not found'
      });
    }

    res.json({
      success: true,
      message: 'Patent application updated successfully',
      data: patent
    });
  } catch (error) {
    console.error('Error updating patent:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating patent application'
    });
  }
});

// @route   DELETE /api/patent/:id
// @desc    Delete patent application
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { clerkUserId, isAdmin } = req.body; // ⬅ get isAdmin flag

    const patent = await Patent.findOne({
      $or: [
        { _id: req.params.id },
        { applicationNumber: req.params.id }
      ]
    });

    if (!patent) {
      return res.status(404).json({
        success: false,
        message: 'Patent application not found'
      });
    }

    // 🛑 Normal user: check ownership
    if (!isAdmin && clerkUserId && patent.clerkUserId !== clerkUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own applications.'
      });
    }

    // 🔥 Admin override → skip user ownership check
    // if (isAdmin) {
    //   console.log("🛑 Admin override: deleting patent without user ownership check");
    // }

    // Delete associated files
    const allFiles = [
      ...(patent.technicalDrawings || []),
      ...(patent.supportingDocuments || [])
    ];

    allFiles.forEach(file => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          //console.log(`Deleted file: ${file.path}`);
        }
      } catch (fileError) {
        //console.error(`Error deleting file ${file.path}:`, fileError);
      }
    });

    await Patent.findByIdAndDelete(patent._id);

    res.json({
      success: true,
      message: 'Patent application deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting patent:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting patent application'
    });
  }
});

// Upload technical drawings
router.post('/:id/technical-drawings', uploadUtils.upload.array('drawings', 10), async (req, res) => {
  try {
    //console.log(`[patent] POST /${req.params.id}/technical-drawings - files count:`, req.files && req.files.length);

    const patent = await Patent.findById(req.params.id);
    if (!patent) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Patent application not found'
      });
    }

    const drawings = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: new Date()
    }));

    patent.technicalDrawings.push(...drawings);
    await patent.save();

    //console.log('[patent] after drawings upload, id:', patent._id, 'drawingsCount:', (patent.technicalDrawings || []).length);

    res.json({
      success: true,
      message: 'Technical drawings uploaded successfully',
      data: drawings
    });
  } catch (error) {
    console.error(`[patent] POST /${req.params.id}/technical-drawings error:`, error);
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload technical drawings',
      details: error.message
    });
  }
});

// In your patents.js route file
router.get('/', async (req, res) => {
  try {
    // Get clerkUserId from query params or headers
    const { clerkUserId } = req.query;

    const filter = clerkUserId ? { clerkUserId } : {};
    const patents = await Patent.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: patents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patents',
      details: error.message
    });
  }
});

// Upload supporting documents
router.post('/:id/supporting-documents', uploadUtils.upload.array('documents', 10), async (req, res) => {
  try {
   // console.log(`[patent] POST /${req.params.id}/supporting-documents - files count:`, req.files && req.files.length);

    const patent = await Patent.findById(req.params.id);
    if (!patent) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Patent application not found'
      });
    }

    const documents = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: new Date()
    }));

    patent.supportingDocuments.push(...documents);
    await patent.save();

   // console.log('[patent] after documents upload, id:', patent._id, 'documentsCount:', (patent.supportingDocuments || []).length);

    res.json({
      success: true,
      message: 'Supporting documents uploaded successfully',
      data: documents
    });
  } catch (error) {
    console.error(`[patent] POST /${req.params.id}/supporting-documents error:`, error);
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload supporting documents',
      details: error.message
    });
  }
});

router.use(uploadUtils.handleMulterError);

// Update completed documents
router.patch('/:id/completed-documents', async (req, res) => {
  try {
    const { documentIds } = req.body;
    const patent = await Patent.findById(req.params.id);

    if (!patent) {
      return res.status(404).json({
        success: false,
        message: 'Patent application not found'
      });
    }

    patent.completedDocuments = documentIds || [];
    await patent.save();

    res.json({
      success: true,
      message: 'Completed documents updated successfully',
      data: patent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update completed documents',
      details: error.message
    });
  }
});

// Update current step
router.patch('/:id/step', async (req, res) => {
  try {
    const { step } = req.body;
    if (typeof step !== 'number' || step < 1 || step > 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step value'
      });
    }

    const patent = await Patent.findByIdAndUpdate(
      req.params.id,
      { currentStep: step },
      { new: true }
    );

    if (!patent) {
      return res.status(404).json({
        success: false,
        message: 'Patent application not found'
      });
    }

    res.json({
      success: true,
      message: 'Step updated successfully',
      data: patent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update step',
      details: error.message
    });
  }
});

// Download a file
router.get('/:id/download/:fileId', async (req, res) => {
  try {
    const patent = await Patent.findById(req.params.id);
    if (!patent) {
      return res.status(404).json({
        success: false,
        message: 'Patent application not found'
      });
    }

    const file = [...(patent.technicalDrawings || []), ...(patent.supportingDocuments || [])]
      .find(f => f._id && f._id.toString() === req.params.fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: 'File missing on server'
      });
    }

    res.download(file.path, file.originalName || file.filename);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      details: error.message
    });
  }
});

// Get certificate
router.get('/:id/certificate', async (req, res) => {
  try {
    const patent = await Patent.findById(req.params.id);
    if (!patent) {
      return res.status(404).json({
        success: false,
        message: 'Patent application not found'
      });
    }

    if (!['granted', 'published', 'approved'].includes(patent.status)) {
      return res.json({
        success: false,
        message: 'Certificate not yet issued',
        status: patent.status,
        currentStep: patent.currentStep
      });
    }

    res.json({
      success: true,
      message: 'Certificate available',
      applicationNumber: patent.applicationNumber,
      grantedOn: patent.updatedAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificate',
      details: error.message
    });
  }
});

module.exports = router;