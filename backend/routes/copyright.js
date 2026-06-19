const express = require('express');
const router = express.Router();
const uploadUtils = require('../middleware/upload');
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
  uploadPrimaryFile,
  uploadSupportingDocuments,
  updateStep,
  recordPayment,
  downloadFile,
  getCertificate
} = require('../controllers/copyrightController');

// ============================================
// SPECIFIC ROUTES (before /:id wildcard routes)
// ============================================

router.get('/stats/overview', getStats);

router.get('/user/:clerkUserId/count', getUserCopyrightCount);
router.get('/user/:clerkUserId/:copyrightId', getUserCopyrightById);
router.get('/user/:clerkUserId', getUserCopyrights);

// ============================================
// GENERIC / CRUD ROUTES
// ============================================

router.post('/', createCopyright);
router.get('/', getAllCopyrights);

router.get('/:id', getCopyrightById);
router.put('/:id', updateCopyright);
router.delete('/:id', deleteCopyright);

// ============================================
// FILE UPLOAD ROUTES
// ============================================

router.post('/:id/primary-file', uploadUtils.upload.single('primary'), uploadPrimaryFile);
router.post('/:id/supporting-documents', uploadUtils.upload.array('documents', 10), uploadSupportingDocuments);

router.use(uploadUtils.handleMulterError);

// ============================================
// MISC ROUTES
// ============================================

router.patch('/:id/step', updateStep);
router.post('/:id/payment', recordPayment);
router.get('/:id/download/:fileId', downloadFile);
router.get('/:id/certificate', getCertificate);

// DOWNload 
router.get('/:id/download/:fileId', downloadFile); 

module.exports = router;
