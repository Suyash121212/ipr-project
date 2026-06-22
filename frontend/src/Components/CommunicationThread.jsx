/**
 * CommunicationThread.jsx
 *
 * Reusable communication panel embedded inside Patent / Copyright detail modals.
 *
 * Props:
 *   applicationId   — MongoDB _id of the application
 *   applicationType — "PATENT" | "COPYRIGHT"
 *   clerkUserId     — current user's Clerk ID (null if admin)
 *   isAdmin         — boolean
 *   senderName      — display name of the sender
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Paperclip, Download, Eye, X, FileText, Loader2, MessageSquare } from "lucide-react";

const backend_url = import.meta.env.VITE_BACKEND_URL;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(d) {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getFileIcon(mimetype) {
  if (!mimetype) return "📄";
  if (mimetype.includes("pdf")) return "📕";
  if (mimetype.includes("word") || mimetype.includes("document")) return "📘";
  if (mimetype.startsWith("image/")) return "🖼️";
  return "📎";
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CommunicationThread({
  applicationId,
  applicationType,
  clerkUserId,
  isAdmin = false,
  senderName = "",
}) {
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const [messageText, setMessageText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Fetch thread ────────────────────────────────────────────────────────────
  const fetchThread = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ applicationId, applicationType });
      if (isAdmin) params.set("isAdmin", "true");
      else if (clerkUserId) params.set("clerkUserId", clerkUserId);

      const res = await fetch(`${backend_url}/api/communications?${params}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        setSummary(data.summary);
        // Mark as read after fetching
        markRead();
      } else {
        setError(data.message || "Failed to load messages");
      }
    } catch (err) {
      setError("Network error while loading messages");
    } finally {
      setLoading(false);
    }
  }, [applicationId, applicationType, clerkUserId, isAdmin]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Mark as read ────────────────────────────────────────────────────────────
  const markRead = async () => {
    try {
      const body = { applicationId, applicationType };
      if (isAdmin) body.isAdmin = true;
      else if (clerkUserId) body.clerkUserId = clerkUserId;

      await fetch(`${backend_url}/api/communications/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // non-fatal
    }
  };

  // ── File input ──────────────────────────────────────────────────────────────
  const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpg",
    "image/jpeg",
  ];
  const MAX_SIZE = 20 * 1024 * 1024;

  const handleFileSelect = (fileList) => {
    const files = Array.from(fileList);
    const valid = files.filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        alert(`"${f.name}" is not an allowed file type.`);
        return false;
      }
      if (f.size > MAX_SIZE) {
        alert(`"${f.name}" exceeds the 20 MB limit.`);
        return false;
      }
      return true;
    });
    setSelectedFiles((prev) => {
      const combined = [...prev, ...valid];
      return combined.slice(0, 5); // max 5 files per message
    });
  };

  const removeFile = (idx) => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const hasMsg = messageText.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;
    if (!hasMsg && !hasFiles) return;

    setSending(true);
    setSendError(null);
    try {
      const fd = new FormData();
      fd.append("applicationId", applicationId);
      fd.append("applicationType", applicationType);
      fd.append("message", messageText.trim());
      fd.append("senderName", senderName || (isAdmin ? "Admin" : "Applicant"));
      if (isAdmin) fd.append("isAdmin", "true");
      else if (clerkUserId) fd.append("clerkUserId", clerkUserId);

      selectedFiles.forEach((f) => fd.append("files", f));

      const res = await fetch(`${backend_url}/api/communications`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setMessageText("");
        setSelectedFiles([]);
        textareaRef.current?.focus();
      } else {
        setSendError(data.message || "Failed to send message");
      }
    } catch {
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Soft delete (admin) ─────────────────────────────────────────────────────
  const handleDelete = async (msgId) => {
    if (!isAdmin) return;
    if (!window.confirm("Hide this message?")) return;
    try {
      const res = await fetch(`${backend_url}/api/communications/${msgId}?isAdmin=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch {
      alert("Failed to delete message");
    }
  };

  // ── File actions ────────────────────────────────────────────────────────────
  const handleDownloadAttachment = (fileId) => {
    const params = isAdmin
      ? "isAdmin=true"
      : `clerkUserId=${encodeURIComponent(clerkUserId || "")}`;
    window.open(`${backend_url}/api/files/download/${fileId}?${params}`, "_blank");
  };

  const handleViewAttachment = (file) => {
    const params = isAdmin
      ? "isAdmin=true"
      : `clerkUserId=${encodeURIComponent(clerkUserId || "")}`;
    const viewUrl = `${backend_url}/api/files/view/${file._id}?${params}`;
    const ext = (file.originalName || "").split(".").pop()?.toLowerCase();

    if (["doc", "docx"].includes(ext)) {
      window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(viewUrl)}`, "_blank");
    } else {
      window.open(viewUrl, "_blank");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[560px] bg-slate-900 rounded-xl border border-white/10 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-slate-800/70 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-white">Application Communication</span>
        </div>
        {summary && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{summary.totalMessages} message{summary.totalMessages !== 1 ? "s" : ""}</span>
            {summary.totalFiles > 0 && <span>• {summary.totalFiles} file{summary.totalFiles !== 1 ? "s" : ""}</span>}
            {summary.lastMessageAt && (
              <span>• Last: {formatDateTime(summary.lastMessageAt)}</span>
            )}
          </div>
        )}
        <button
          onClick={fetchThread}
          title="Refresh"
          className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
        >
          🔄
        </button>
      </div>

      {/* ── Message list ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mr-2" />
            <span className="text-slate-400 text-sm">Loading messages…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <span className="text-red-400 text-sm">{error}</span>
            <button onClick={fetchThread} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdminMsg = msg.senderRole === "ADMIN";
            const isOwn = isAdmin ? isAdminMsg : !isAdminMsg;

            return (
              <div
                key={msg._id}
                className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
              >
                {/* Sender label */}
                <div className={`flex items-center gap-2 text-xs ${isOwn ? "flex-row-reverse" : ""}`}>
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      isAdminMsg
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    {isAdminMsg ? "👤 Admin" : "🧑 Applicant"}
                  </span>
                  <span className="text-slate-500">{msg.senderName}</span>
                  <span className="text-slate-600">{formatDateTime(msg.createdAt)}</span>
                </div>

                {/* Bubble */}
                <div
                  className={`group relative max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed border ${
                    isAdminMsg
                      ? "bg-purple-900/40 border-purple-700/40 text-slate-100 border-l-2 border-l-purple-500"
                      : "bg-slate-800/80 border-slate-700/50 text-slate-100"
                  }`}
                >
                  {/* Admin delete btn */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(msg._id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                      title="Hide message"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {/* Message text */}
                  {msg.message && (
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  )}

                  {/* Attachments */}
                  {msg.attachments?.length > 0 && (
                    <div className={`${msg.message ? "mt-3" : ""} space-y-2`}>
                      {msg.attachments.map((att) => (
                        <div
                          key={att._id}
                          className="flex items-center gap-2 bg-black/20 rounded-lg p-2.5 group/att"
                        >
                          <span className="text-lg flex-shrink-0">{getFileIcon(att.mimetype)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{att.originalName}</p>
                            <p className="text-xs text-slate-500">{formatSize(att.size)}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleViewAttachment(att)}
                              className="p-1 text-slate-400 hover:text-green-400 transition-colors"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownloadAttachment(att._id)}
                              className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Read indicator */}
                  {isOwn && (
                    <p className={`text-right text-xs mt-1 ${msg.isRead ? "text-indigo-400" : "text-slate-600"}`}>
                      {msg.isRead ? "✓✓ Read" : "✓ Sent"}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Selected files preview ── */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-white/5 bg-slate-800/40 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 border border-white/10"
              >
                <span>{getFileIcon(f.type)}</span>
                <span className="max-w-[120px] truncate">{f.name}</span>
                <span className="text-slate-500">({formatSize(f.size)})</span>
                <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {sendError && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 flex-shrink-0">
          <p className="text-red-400 text-xs">{sendError}</p>
        </div>
      )}

      {/* ── Compose area ── */}
      <div
        className={`flex-shrink-0 border-t border-white/10 px-4 py-3 bg-slate-800/50 transition-colors ${
          dragOver ? "bg-indigo-900/30 border-indigo-500/40" : ""
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files); }}
      >
        <div className="flex items-end gap-2">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dragOver ? "Drop files here…" : "Type a message… (Enter to send, Shift+Enter for newline)"}
            rows={2}
            className="flex-1 resize-none bg-slate-700/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
            disabled={sending}
          />

          {/* Attach file button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            title="Attach files (PDF, DOC, PNG, JPG — max 20 MB each, up to 5)"
            className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || (!messageText.trim() && selectedFiles.length === 0)}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-colors flex items-center justify-center"
            title="Send (Enter)"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="text-xs text-slate-600 mt-1.5 pl-1">
          PDF, DOC, DOCX, PNG, JPG up to 20 MB • Max 5 files per message • Drag & drop supported
        </p>
      </div>
    </div>
  );
}
