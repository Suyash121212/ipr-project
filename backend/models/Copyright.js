const mongoose = require('mongoose');
const Counter = require("../models/counterModel");

const documentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  cloudinaryUrl: String,
  download_url: String,
  publicId: String,
  resourceType: String,
  size: Number,
  mimetype: String,
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const applicantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  phone: {
    type: String
  },
  address: {
    type: String
  }
}, { _id: false });

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

  // Primary applicant fields
  applicantName: String,
  applicantEmail: String,
  applicantPhone: String,
  applicantAddress: String,

  // Additional applicants
  additionalApplicants: [applicantSchema],

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
  currentStage: {
    type: Number,
    default: 1,
    min: 1,
    max: 6
  },
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
    sparse: true
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
