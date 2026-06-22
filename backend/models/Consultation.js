const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true
  },
  consultationId: {
    type: String,
    unique: true,
    default: function() {
      return 'CONS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  workType: {
    type: String,
    required: true,
    enum: ['patent', 'trademark', 'copyright', 'design', 'litigation', 'other']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  consultationType: {
    type: String,
    required: true,
    enum: ['phone', 'video', 'person']
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    type: String,
    required: true
  },
  uploadedFiles: [{
    fileName: String,
    originalName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  marketingConsent: {
    type: Boolean,
    default: false
  },
  communicationPreference: {
    type: String,
    enum: ['email', 'phone', 'both'],
    default: 'both'
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedAttorney: String,
  consultationNotes: String,
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  estimatedCost: Number,
  actualCost: Number,

  // ── Soft delete ──────────────────────────────
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: String,
    default: null,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Consultation', consultationSchema);