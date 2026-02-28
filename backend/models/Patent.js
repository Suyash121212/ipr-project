const mongoose = require('mongoose');
const Counter = require("../models/counterModel");

const documentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  size: Number,
  mimetype: String,
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const patentSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true
  },
  inventionTitle: {
    type: String,
    required: true
  },
  inventorName: {
    type: String,
    required: true
  },
  applicantName: {
    type: String,
    required: true
  },
  technicalDescription: {
    type: String,
    required: true
  },

  // Admin sets this (1–6) to control user's progress timeline
  currentStage: {
    type: Number,
    default: 1,
    min: 1,
    max: 6
  },

  email: {
    type: String
  },
  phone: {
    type: String
  },
  technicalDrawings: [documentSchema],
  supportingDocuments: [documentSchema],

  // Tracks which step the filing wizard is on (1, 2, 3)
  currentStep: {
    type: Number,
    default: 1
  },

  // Status enum - covers all statuses used by admin + frontend
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'applied',
      'under-review',
      'under-examination',
      'pending',
      'published',
      'objection',
      'granted',
      'approved',
      'renewal',
      'rejected',
      'cancelled',
      'expired'
    ],
    default: 'draft'
  },

  applicationNumber: {
    type: String,
    unique: true,
    // This allows multiple documents without applicationNumber
  },
  filingDate: {
    type: Date,
    default: Date.now
  },
  priorityDate: {
    type: Date
  },
  completedDocuments: [{
    type: Number
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Auto-generate application number only when status changes to 'submitted'
patentSchema.pre("save", async function () {
  if (this.isNew && !this.applicationNumber) {
    const year = new Date().getFullYear();

    const counter = await Counter.findOneAndUpdate(
      { name: `patent_${year}` },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );

    this.applicationNumber =
      `PAT-${year}-${counter.seq.toString().padStart(5, "0")}`;
  }
});

module.exports = mongoose.model('Patent', patentSchema);
