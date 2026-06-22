/**
 * NotificationBell.jsx
 *
 * Displays unread message count for a Clerk user.
 * Polls on mount and whenever the component re-renders.
 * No Socket.IO — updates on page refresh / tab focus.
 *
 * Usage:
 *   <NotificationBell clerkUserId={user.id} />
 */

import { useState, useEffect, useRef } from "react";
import { Bell, X, MessageSquare } from "lucide-react";

const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function NotificationBell({ clerkUserId }) {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // Fetch unread count
  const fetchCount = async () => {
    if (!clerkUserId) return;
    try {
      const res = await fetch(
        `${backend_url}/api/communications/unread-count?clerkUserId=${encodeURIComponent(clerkUserId)}`
      );
      const data = await res.json();
      if (data.success) setUnread(data.unreadCount);
    } catch {}
  };

  // Fetch notification list
  const fetchNotifications = async () => {
    if (!clerkUserId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${backend_url}/api/communications/notifications?clerkUserId=${encodeURIComponent(clerkUserId)}`
      );
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchCount();
    // Re-fetch when tab becomes visible
    const handleFocus = () => fetchCount();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [clerkUserId]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) {
      fetchNotifications();
      // Reset local unread count optimistically
      setUnread(0);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">Notifications</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                <Bell className="w-8 h-8 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    !n.isRead ? "bg-indigo-500/5 border-l-2 border-l-indigo-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        !n.isRead ? "bg-indigo-500" : "bg-slate-600"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-slate-600 mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-white/5">
              <p className="text-xs text-slate-500 text-center">
                Go to your Patent or Copyright details to view and reply
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
