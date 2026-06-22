const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const communicationSchema = new mongoose.Schema(
  {
    // Which application this message belongs to
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    applicationType: {
      type: String,
      enum: ["PATENT", "COPYRIGHT"],
      required: true,
    },

    // The clerkUserId of the application owner (always set, used for ownership checks)
    clerkUserId: {
      type: String,
      required: true,
      index: true,
    },

    // Who sent this message
    senderId: {
      type: String, // clerkUserId for USER, "ADMIN" for admin
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["USER", "ADMIN"],
      required: true,
    },
    senderName: {
      type: String,
      default: "",
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    attachments: [attachmentSchema],

    // Read tracking
    isRead: {
      type: Boolean,
      default: false,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast thread loading
communicationSchema.index({ applicationId: 1, applicationType: 1, createdAt: 1 });
// Index for unread count queries
communicationSchema.index({ clerkUserId: 1, isRead: 1, isDeleted: 1 });

module.exports = mongoose.model("Communication", communicationSchema);
