/**
 * communicationController.js
 *
 * Handles all communication thread operations:
 *  - POST   /api/communications          — send a message (text, file, or both)
 *  - GET    /api/communications          — get thread for an application
 *  - PATCH  /api/communications/read     — mark messages as read
 *  - DELETE /api/communications/:id      — soft-delete a message (admin only)
 *  - GET    /api/communications/unread-count — unread count for a user
 *
 * Auth model (no JWT middleware — same pattern as rest of project):
 *   clerkUserId / isAdmin passed via query or x- headers.
 */

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const Communication = require("../models/Communication");
const Notification = require("../models/Notification");
const Patent = require("../models/Patent");
const Copyright = require("../models/Copyright");
const { buildFileMeta } = require("../middleware/upload");

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function getIdentity(req) {
  // Body may be undefined on GET requests — guard with optional chaining
  const clerkUserId =
    req.query.clerkUserId ||
    req.headers["x-clerk-user-id"] ||
    req.body?.clerkUserId ||
    null;
  const isAdmin =
    req.query.isAdmin === "true" ||
    req.headers["x-is-admin"] === "true" ||
    req.body?.isAdmin === true ||
    req.body?.isAdmin === "true" ||
    false;
  return { clerkUserId, isAdmin };
}

/**
 * Verify the caller owns (or is admin for) the given application.
 * Returns { ok, clerkUserId } where clerkUserId is the application owner.
 */
async function verifyApplicationOwnership(applicationId, applicationType, callerClerkId, isAdmin) {
  let doc = null;
  if (applicationType === "PATENT") {
    doc = await Patent.findById(applicationId).select("clerkUserId").lean();
  } else if (applicationType === "COPYRIGHT") {
    doc = await Copyright.findById(applicationId).select("clerkUserId").lean();
  }

  if (!doc) return { ok: false, reason: "Application not found" };

  if (!isAdmin && callerClerkId && doc.clerkUserId !== callerClerkId) {
    return { ok: false, reason: "Access denied" };
  }

  return { ok: true, ownerClerkUserId: doc.clerkUserId };
}

// ─────────────────────────────────────────────────
// POST /api/communications  — send message
// ─────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { clerkUserId, isAdmin } = getIdentity(req);
    const { applicationId, applicationType, message, senderName } = req.body;

    // Validate application type
    if (!["PATENT", "COPYRIGHT"].includes(applicationType)) {
      // clean up any uploaded files
      req.files?.forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
      return res.status(400).json({ success: false, message: "Invalid applicationType. Must be PATENT or COPYRIGHT." });
    }

    // Validate applicationId
    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
      req.files?.forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
      return res.status(400).json({ success: false, message: "Invalid applicationId." });
    }

    // Must have message OR at least one file
    const hasMessage = message && message.trim().length > 0;
    const hasFiles = req.files && req.files.length > 0;
    if (!hasMessage && !hasFiles) {
      return res.status(400).json({ success: false, message: "Please provide a message or attach a file." });
    }

    // Verify ownership
    const ownership = await verifyApplicationOwnership(applicationId, applicationType, clerkUserId, isAdmin);
    if (!ownership.ok) {
      req.files?.forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
      return res.status(ownership.reason === "Application not found" ? 404 : 403)
        .json({ success: false, message: ownership.reason });
    }

    // Build attachment metadata
    const attachments = (req.files || []).map((f) => buildFileMeta(f, "communications"));

    // Determine sender
    const senderRole = isAdmin ? "ADMIN" : "USER";
    const senderId = isAdmin ? "ADMIN" : clerkUserId;

    const comm = await Communication.create({
      applicationId,
      applicationType,
      clerkUserId: ownership.ownerClerkUserId,
      senderId,
      senderRole,
      senderName: senderName || (isAdmin ? "Admin" : "Applicant"),
      message: hasMessage ? message.trim() : "",
      attachments,
    });

    // ── Create notification for the OTHER party ──
    try {
      if (isAdmin) {
        // Admin sent → notify the user
        await Notification.create({
          clerkUserId: ownership.ownerClerkUserId,
          title: "New message from Admin",
          message: hasMessage
            ? message.trim().slice(0, 100)
            : `Admin shared ${attachments.length} file(s)`,
          applicationId,
          applicationType,
          communicationId: comm._id,
        });
      }
      // User-sent notifications (for admin) are not stored per-user
      // since admin is not a Clerk user. Admin sees all messages on refresh.
    } catch (notifErr) {
      console.error("Notification creation error (non-fatal):", notifErr.message);
    }

    return res.status(201).json({ success: true, data: comm });
  } catch (err) {
    console.error("sendMessage error:", err);
    req.files?.forEach((f) => { try { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch {} });
    return res.status(500).json({ success: false, message: "Failed to send message." });
  }
};

// ─────────────────────────────────────────────────
// GET /api/communications  — fetch thread
// Query: applicationId, applicationType, clerkUserId / isAdmin
// ─────────────────────────────────────────────────
const getThread = async (req, res) => {
  try {
    const { clerkUserId, isAdmin } = getIdentity(req);
    const { applicationId, applicationType } = req.query;

    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, message: "Invalid applicationId." });
    }
    if (!["PATENT", "COPYRIGHT"].includes(applicationType)) {
      return res.status(400).json({ success: false, message: "Invalid applicationType." });
    }

    // Verify ownership
    const ownership = await verifyApplicationOwnership(applicationId, applicationType, clerkUserId, isAdmin);
    if (!ownership.ok) {
      return res.status(ownership.reason === "Application not found" ? 404 : 403)
        .json({ success: false, message: ownership.reason });
    }

    const messages = await Communication.find({
      applicationId,
      applicationType,
      isDeleted: false,
    }).sort({ createdAt: 1 }).lean();

    // Summary stats
    const totalFiles = messages.reduce((sum, m) => sum + (m.attachments?.length || 0), 0);
    const lastMsg = messages[messages.length - 1] || null;

    return res.json({
      success: true,
      data: messages,
      summary: {
        totalMessages: messages.length,
        totalFiles,
        lastMessageAt: lastMsg?.createdAt || null,
        lastSender: lastMsg?.senderRole || null,
      },
    });
  } catch (err) {
    console.error("getThread error:", err);
    return res.status(500).json({ success: false, message: "Failed to load thread." });
  }
};

// ─────────────────────────────────────────────────
// PATCH /api/communications/read  — mark as read
// Body: { applicationId, applicationType, clerkUserId / isAdmin }
// ─────────────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const { clerkUserId, isAdmin } = getIdentity(req);
    const { applicationId, applicationType } = req.body;

    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, message: "Invalid applicationId." });
    }

    const ownership = await verifyApplicationOwnership(applicationId, applicationType, clerkUserId, isAdmin);
    if (!ownership.ok) {
      return res.status(403).json({ success: false, message: ownership.reason });
    }

    // Mark messages sent by the OTHER role as read
    // (user opens thread → mark ADMIN messages as read; admin opens → mark USER messages)
    const callerRole = isAdmin ? "ADMIN" : "USER";
    const otherRole = isAdmin ? "USER" : "ADMIN";

    await Communication.updateMany(
      {
        applicationId,
        applicationType,
        senderRole: otherRole, // messages the caller received
        isRead: false,
        isDeleted: false,
      },
      { $set: { isRead: true } }
    );

    // Also mark notifications as read for this user
    if (!isAdmin && clerkUserId) {
      await Notification.updateMany(
        { clerkUserId, applicationId: new mongoose.Types.ObjectId(applicationId), isRead: false },
        { $set: { isRead: true } }
      );
    }

    return res.json({ success: true, message: "Messages marked as read." });
  } catch (err) {
    console.error("markAsRead error:", err);
    return res.status(500).json({ success: false, message: "Failed to mark as read." });
  }
};

// ─────────────────────────────────────────────────
// DELETE /api/communications/:id  — soft delete (admin only)
// ─────────────────────────────────────────────────
const softDeleteMessage = async (req, res) => {
  try {
    const { isAdmin } = getIdentity(req);

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Only admins can delete messages." });
    }

    const comm = await Communication.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!comm) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    return res.json({ success: true, message: "Message deleted." });
  } catch (err) {
    console.error("softDeleteMessage error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete message." });
  }
};

// ─────────────────────────────────────────────────
// GET /api/communications/unread-count
// Query: clerkUserId  — unread notifications for a user
// ─────────────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const { clerkUserId } = getIdentity(req);

    if (!clerkUserId) {
      return res.status(400).json({ success: false, message: "clerkUserId required." });
    }

    const count = await Notification.countDocuments({
      clerkUserId,
      isRead: false,
    });

    return res.json({ success: true, unreadCount: count });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    return res.status(500).json({ success: false, message: "Failed to get unread count." });
  }
};

// ─────────────────────────────────────────────────
// GET /api/communications/notifications
// Query: clerkUserId  — list notifications for a user
// ─────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const { clerkUserId } = getIdentity(req);

    if (!clerkUserId) {
      return res.status(400).json({ success: false, message: "clerkUserId required." });
    }

    const notifications = await Notification.find({ clerkUserId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("getNotifications error:", err);
    return res.status(500).json({ success: false, message: "Failed to get notifications." });
  }
};

module.exports = {
  sendMessage,
  getThread,
  markAsRead,
  softDeleteMessage,
  getUnreadCount,
  getNotifications,
};
