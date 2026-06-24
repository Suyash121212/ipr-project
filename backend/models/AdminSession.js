/**
 * AdminSession.js
 *
 * Tracks active admin JWT sessions server-side.
 * Each document represents one valid session.
 *
 * On login  → create a document with the token's jti
 * On logout → delete the document (token is immediately dead)
 * TTL index → MongoDB auto-expires documents after 8 hours
 *             (matches JWT expiry — no orphan sessions)
 */

const mongoose = require("mongoose");

const adminSessionSchema = new mongoose.Schema({
  // The JWT ID claim (uuid) — unique per token
  jti: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Admin email — for audit trail
  email: {
    type: String,
    required: true,
  },

  // Optional: fingerprint to detect cross-browser theft
  // Stored as a hash, never the raw value
  userAgentHash: {
    type: String,
    default: null,
  },

  // When the JWT itself expires — used by the TTL index
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // MongoDB TTL — auto-deletes at expiresAt
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AdminSession", adminSessionSchema);
