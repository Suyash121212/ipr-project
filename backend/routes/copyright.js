const express = require('express');
const router = express.Router();
const Copyright = require('../models/Copyright');
const uploadUtils = require('../middleware/upload');
const fs = require('fs');

// ============================================
// SPECIFIC ROUTES FIRST (before /:id routes)
// ============================================

// @route   GET /api/copyright/stats/overview
// @desc    Get copyright statistics
// @access  Private
router.get('/stats/overview', async (req, res) => {
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
});

// @route   GET /api/copyright/user/:clerkUserId/count
// @desc    Get copyright count for user
// @access  Private
router.get('/user/:clerkUserId/count', async (req, res) => {
  try {
    const total = await Copyright.countDocuments({ 
      clerkUserId: req.params.clerkUserId 
    });

    const draft = await Copyright.countDocuments({ 
      clerkUserId: req.params.clerkUserId,
      status: 'draft'
    });
    
    const submitted = await Copyright.countDocuments({ 
      clerkUserId: req.params.clerkUserId,
      status: 'submitted'
    });
    
    const underReview = await Copyright.countDocuments({ 
      clerkUserId: req.params.clerkUserId,
      status: 'under-review'
    });

    const registered = await Copyright.countDocuments({ 
      clerkUserId: req.params.clerkUserId,
      status: 'registered'
    });

    const rejected = await Copyright.countDocuments({ 
      clerkUserId: req.params.clerkUserId,
      status: 'rejected'
    });

    res.json({
      success: true,
      data: {
        total,
        draft,
        submitted,
        underReview,
        registered,
        rejected
      }
    });
  } catch (error) {
    console.error('Error fetching copyright count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching copyright count'
    });
  }
});

// @route   GET /api/copyright/user/:clerkUserId/:copyrightId
// @desc    Get specific copyright details for user
// @access  Private
router.get('/user/:clerkUserId/:copyrightId', async (req, res) => {
  try {
    const copyright = await Copyright.findOne({
      clerkUserId: req.params.clerkUserId,
      $or: [
        { _id: req.params.copyrightId },
        { applicationNumber: req.params.copyrightId }
      ]
    });

    if (!copyright) {
      return res.status(404).json({
        success: false,
        message: 'Copyright application not found'
      });
    }

    res.json({
      success: true,
      data: copyright
    });
  } catch (error) {
    console.error('Error fetching copyright details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching copyright details'
    });
  }
});

// @route   GET /api/copyright/user/:clerkUserId
// @desc    Get copyright applications for specific user
// @access  Private
router.get('/user/:clerkUserId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    //console.log(`[copyright] Fetching copyrights for user: ${req.params.clerkUserId}`);

    const copyrights = await Copyright.find({ 
      clerkUserId: req.params.clerkUserId 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Copyright.countDocuments({ 
      clerkUserId: req.params.clerkUserId 
    });

    //console.log(`[copyright] Found ${copyrights.length} copyrights for user ${req.params.clerkUserId}`);

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
});

// ============================================
// GENERIC ROUTES (after specific routes)
// ============================================

// @route   POST /api/copyright
// @desc    Create a new copyright application
// @access  Private
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
   // console.log('[copyright] POST / - payload:', JSON.stringify(payload));
    
    if (!payload.title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title is required' 
      });
    }
    if (!payload.clerkUserId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User authentication required' 
      });
    }

    const copyright = new Copyright(payload);
    const saved = await copyright.save();
    
    //console.log('[copyright] created id:', saved._id);
    
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

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(400).json({ 
      success: false, 
      error: 'Failed to create copyright application', 
      details: error.message 
    });
  }
});

// @route   GET /api/copyright
// @desc    Get all copyright applications (Admin only)
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

    if (req.query.workType) {
      filter.workType = req.query.workType;
    }

    const copyrights = await Copyright.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Copyright.countDocuments(filter);

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
});

// @route   GET /api/copyright/:id
// @desc    Get copyright by ID
// @access  Private
router.get('/:id', async (req, res) => {
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

    res.json({
      success: true,
      data: copyright
    });
  } catch (error) {
    console.error('Error fetching copyright:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching copyright application'
    });
  }
});

// @route   PUT /api/copyright/:id
// @desc    Update copyright (Admin only)
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

    // FIX 2: Parse currentStage as Number to avoid string/number type mismatch in MongoDB
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
      { $set: filteredUpdates },  // FIX 3: Use $set to avoid wiping other fields
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
});

// @route   DELETE /api/copyright/:id
// @desc    Delete copyright application
// @access  Private
router.delete('/:id', async (req, res) => {
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

    // 👇 If request is from a normal user (Clerk)
    if (!isAdmin && clerkUserId && copyright.clerkUserId !== clerkUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own applications.'
      });
    }

    // 👇 If admin delete request → skip ownership match
    // if (isAdmin) {
    //   console.log("🛑 Admin override: deleting copyright without user check");
    // }

    // File deletion block
    if (copyright.files?.length > 0) {
      copyright.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
           // console.log(`Deleted file: ${file.path}`);
          }
        } catch (error) {
          console.error(`Failed to delete file ${file.path}:`, error);
        }
      });
    }

    await Copyright.findByIdAndDelete(copyright._id);

    return res.json({
      success: true,
      message: 'Copyright application deleted successfully'
    });

  } catch (error) {
    console.error("Error deleting copyright:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while deleting copyright application"
    });
  }
});


// Upload primary work file
router.post('/:id/primary-file', uploadUtils.upload.single('primary'), async (req, res) => {
  try {
    // console.log(`[copyright] POST /${req.params.id}/primary-file - file:`, req.file && {
    //   originalname: req.file.originalname,
    //   filename: req.file.filename,
    //   size: req.file.size,
    //   mimetype: req.file.mimetype,
    //   path: req.file.path
    // });
    
    const copyright = await Copyright.findById(req.params.id);
    if (!copyright) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ 
        success: false, 
        message: 'Copyright application not found' 
      });
    }

    const fileMeta = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadDate: new Date()
    };

    copyright.files = [fileMeta, ...copyright.files];
    await copyright.save();
    
    //console.log('[copyright] after primary upload, id:', copyright._id, 'filesCount:', (copyright.files || []).length);

    res.json({ 
      success: true, 
      message: 'Primary file uploaded successfully', 
      data: fileMeta 
    });
  } catch (error) {
    console.error(`[copyright] POST /${req.params.id}/primary-file error:`, error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload primary file', 
      details: error.message 
    });
  }
});

// Upload supporting documents
router.post('/:id/supporting-documents', uploadUtils.upload.array('documents', 10), async (req, res) => {
  try {
    //console.log(`[copyright] POST /${req.params.id}/supporting-documents - files count:`, req.files && req.files.length);
    
    const copyright = await Copyright.findById(req.params.id);
    if (!copyright) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(f => { 
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path); 
        });
      }
      return res.status(404).json({ 
        success: false, 
        message: 'Copyright application not found' 
      });
    }

    const docs = req.files.map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      path: f.path,
      size: f.size,
      mimetype: f.mimetype,
      uploadDate: new Date()
    }));

    copyright.files.push(...docs);
    await copyright.save();
    
    //console.log('[copyright] after supporting upload, id:', copyright._id, 'filesCount:', (copyright.files || []).length);

    res.json({ 
      success: true, 
      message: 'Supporting documents uploaded successfully', 
      data: docs 
    });
  } catch (error) {
    console.error(`[copyright] POST /${req.params.id}/supporting-documents error:`, error);
    if (req.files && req.files.length > 0) {
      req.files.forEach(f => { 
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path); 
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

    res.json({ 
      success: true, 
      message: 'Step updated successfully', 
      data: updated 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update step', 
      details: error.message 
    });
  }
});

// Record payment
router.post('/:id/payment', async (req, res) => {
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
});

// Download file
router.get('/:id/download/:fileId', async (req, res) => {
  try {
    const copyright = await Copyright.findById(req.params.id);
    if (!copyright) {
      return res.status(404).json({ 
        success: false, 
        message: 'Copyright application not found' 
      });
    }

    const file = (copyright.files || []).find(f => f._id && f._id.toString() === req.params.fileId);
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
    const copyright = await Copyright.findById(req.params.id);
    if (!copyright) {
      return res.status(404).json({ 
        success: false, 
        message: 'Copyright application not found' 
      });
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
});

module.exports = router;