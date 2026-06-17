const express = require('express');
const router = express.Router();
const uploadUtils = require('../middleware/upload');
const {
  getStats,
  getAllPatents,
  getUserPatentCount,
  getUserPatents,
  getUserPatentById,
  createPatent,
  getPatentById,
  updatePatent,
  deletePatent,
  uploadTechnicalDrawings,
  uploadSupportingDocuments,
  updateCompletedDocuments,
  updateStep,
  downloadFile,
  getCertificate
} = require('../controllers/patentController');

// ============================================
// STATS & ADMIN
// ============================================
router.get('/stats/overview', getStats);

// ============================================
// USER-SCOPED ROUTES  (must come before /:id)
// ============================================
router.get('/user/:clerkUserId/count', getUserPatentCount);
router.get('/user/:clerkUserId/:patentId', getUserPatentById);
router.get('/user/:clerkUserId', getUserPatents);

// ============================================
// COLLECTION ROUTES
// ============================================
router.get('/', getAllPatents);
router.post('/', createPatent);

// ============================================
// SINGLE PATENT ROUTES
// ============================================
router.get('/:id', getPatentById);
router.put('/:id', updatePatent);
router.delete('/:id', deletePatent);

// ============================================
// FILE UPLOADS
// ============================================
router.post('/:id/technical-drawings', uploadUtils.upload.array('drawings', 10), uploadTechnicalDrawings);
router.post('/:id/supporting-documents', uploadUtils.upload.array('documents', 10), uploadSupportingDocuments);

// ============================================
// PATCH HELPERS
// ============================================
router.patch('/:id/completed-documents', updateCompletedDocuments);
router.patch('/:id/step', updateStep);

// ============================================
// FILE DOWNLOAD & CERTIFICATE
// ============================================
router.get('/:id/download/:fileId', downloadFile);
router.get('/:id/certificate', getCertificate);

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
router.use(uploadUtils.handleMulterError);


module.exports = router;