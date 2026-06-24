const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validationHandler } = require('../middleware/validationHandler');
const {
  submitContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats,
} = require('../controllers/contactController');

// ── Rate limiter ──────────────────────────────────────────────────────────────
const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: {
    success: false,
    error: 'Too many contact form submissions. Please try again later.',
    details: ['Rate limit exceeded'],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Validation rules ──────────────────────────────────────────────────────────
const validateContact = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Please enter a valid email address'),

  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[\+]?[1-9][\d\s\-\(\)]{7,20}$/)
    .withMessage('Please enter a valid phone number'),

  body('company')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),

  body('serviceType')
    .isIn(['patents', 'trademarks', 'copyrights', 'ip-litigation', 'licensing', 'consultation'])
    .withMessage('Please select a valid service type'),

  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
];

// ── Routes ────────────────────────────────────────────────────────────────────
// server.js mounts this router at /api/contact
// So route paths here should NOT repeat /contact

// POST /api/contact           — submit contact form (public)
router.post('/', contactRateLimit, validateContact, validationHandler, submitContact);

// GET  /api/contact/stats     — contact statistics (admin)
router.get('/stats', getContactStats);

// GET  /api/contact           — list all contacts (admin)
router.get('/', getAllContacts);

// GET  /api/contact/:id       — get single contact (admin)
router.get('/:id', getContactById);

// PATCH /api/contact/:id      — update status/notes (admin)
router.patch('/:id', updateContact);

// DELETE /api/contact/:id     — delete contact (admin)
router.delete('/:id', deleteContact);

module.exports = router;
