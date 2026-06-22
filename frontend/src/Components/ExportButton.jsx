/**
 * ExportButton.jsx
 *
 * Reusable Excel export button for admin pages.
 *
 * Props:
 *   type        — "patents" | "copyrights" | "consultations"
 *   status      — optional status filter (passed as query param)
 *   showDeleted — boolean, if true exports deleted records too
 *   label       — optional custom label (defaults to "Export Excel")
 *
 * Triggers a browser download of the .xlsx file generated server-side.
 */

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function ExportButton({
  type,
  status = "",
  showDeleted = false,
  label = "Export Excel",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query string
      const params = new URLSearchParams({ isAdmin: "true" });
      if (status)      params.set("status", status);
      if (showDeleted) params.set("showDeleted", "true");

      const url = `${backend_url}/api/export/${type}?${params}`;

      // Use fetch so we can handle errors; then trigger download via blob URL
      const res = await fetch(url);

      if (!res.ok) {
        // Try to parse error JSON
        let msg = `Export failed (${res.status})`;
        try {
          const data = await res.json();
          msg = data.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Derive filename from Content-Disposition header, or fall back to a default
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `${type}_export.xlsx`;

      // Trigger download
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Export error:", err);
      setError(err.message || "Export failed");
      // Auto-clear error after 4 seconds
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex flex-col items-end gap-1">
      <button
        onClick={handleExport}
        disabled={loading}
        title={`Export ${type} to Excel`}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {loading ? "Exporting…" : label}
      </button>

      {/* Inline error tooltip */}
      {error && (
        <span className="absolute top-full mt-1 right-0 z-50 bg-red-900/90 text-red-200 text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
          ⚠ {error}
        </span>
      )}
    </div>
  );
}
