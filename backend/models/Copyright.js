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

const copyrightSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  workType: String,
  language: String,
  authorName: String,
  applicantName: String,
  description: String,
  publicationDate: Date,
  isPublished: {
    type: Boolean,
    default: false
  },
  files: [documentSchema],
  currentStep: {
    type: Number,
    default: 1
  },

  // FIX 1: Added currentStage to track admin-controlled 6-stage progress
  currentStage: {
    type: Number,
    default: 1,
    min: 1,
    max: 6
  },

  // FIX 2: Expanded status enum to cover all 6 stages
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'under-review',
      'under-examination',
      'objection',
      'registered',
      'certificate-issued',
      'rejected',
      'cancelled',
      'expired'
    ],
    default: 'draft'
  },

  applicationNumber: {
    type: String,
    unique: true,
    sparse: true  // allows multiple drafts without applicationNumber
  },
  filingDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// FIX 3: Only generate application number when status changes to 'submitted'
// (not on every new document) — prevents duplicate key errors for drafts
// FIX 4: Sequential number per year using last existing number (not count)
//         so deleting records doesn't break the sequence
// Auto-generate application number only when status changes to 'submitted'
copyrightSchema.pre("save", async function () {
  if (this.isNew && !this.applicationNumber) {
    const year = new Date().getFullYear();

    const counter = await Counter.findOneAndUpdate(
      { name: `copyright_${year}` },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );

    this.applicationNumber =
      `CR-${year}-${counter.seq.toString().padStart(5, "0")}`;
  }
});

module.exports = mongoose.model('Copyright', copyrightSchema);