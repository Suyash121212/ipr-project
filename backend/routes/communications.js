/**
 * routes/communications.js
 *
 * POST   /api/communications           — send message (text + optional files)
 * GET    /api/communications           — get thread (query: applicationId, applicationType)
 * PATCH  /api/communications/read      — mark thread as read
 * DELETE /api/communications/:id       — soft-delete a message (admin only)
 * GET    /api/communications/unread-count  — unread notification count
 * GET    /api/communications/notifications — list notifications
 */

const express = require("express");
const router = express.Router();
const { uploadCommunications, handleMulterError } = require("../middleware/upload");
const {
  sendMessage,
  getThread,
  markAsRead,
  softDeleteMessage,
  getUnreadCount,
  getNotifications,
} = require("../controllers/communicationController");

// Specific routes BEFORE parameterised :id
router.get("/unread-count", getUnreadCount);
router.get("/notifications", getNotifications);

// Thread routes
router.post("/", uploadCommunications.array("files", 5), sendMessage);
router.get("/", getThread);
router.patch("/read", markAsRead);

// Soft delete (admin only)
router.delete("/:id", softDeleteMessage);

router.use(handleMulterError);

module.exports = router;
