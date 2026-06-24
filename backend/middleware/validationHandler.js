const { validationResult } = require('express-validator');

const validationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((err) => err.msg),
    });
  }
  next();
};

module.exports = { validationHandler };