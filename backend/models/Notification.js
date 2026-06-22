const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // The user who should see this notification
    clerkUserId: {
      type: String,
      required: true,
      index: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    // Link back to the application
    applicationId: { type: mongoose.Schema.Types.ObjectId },
    applicationType: { type: String, enum: ["PATENT", "COPYRIGHT"] },

    // Which communication message triggered this
    communicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Communication" },

    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ clerkUserId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
