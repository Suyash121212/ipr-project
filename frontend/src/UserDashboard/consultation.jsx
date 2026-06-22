import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import { FileText, Download, X, Eye } from 'lucide-react';
const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function DashboardConsultation() {
  const { user } = useUser();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchConsultations = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${backend_url}/api/consultations/user/${user.id}`
      );
      const result = await response.json();
      if (result.success) {
        setConsultations(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error fetching consultations:', err);
      setError('Failed to fetch consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchConsultations();
  }, [user]);

  // ── Fetch single consultation (with uploadedFiles) when opening modal ──────
  const handleView = async (consultation) => {
    // Show immediately with cached data (files may be excluded), then refresh
    setSelectedConsultation(consultation);
    try {
      const res = await fetch(
        `${backend_url}/api/consultations/user/${user.id}/${consultation._id}`
      );
      const result = await res.json();
      if (result.success && result.data) {
        setSelectedConsultation(result.data);
      }
    } catch {
      /* keep cached */
    }
  };

  // ── File actions ───────────────────────────────────────────────────────────
  const handleDownloadFile = (file) => {
    window.open(
      `${backend_url}/api/files/download/${file._id}?clerkUserId=${encodeURIComponent(user.id)}`,
      '_blank'
    );
  };

  const handleViewFile = (file) => {
    const viewUrl = `${backend_url}/api/files/view/${file._id}?clerkUserId=${encodeURIComponent(user.id)}`;
    const ext = (file.originalName || '').split('.').pop()?.toLowerCase();
    if (['doc', 'docx'].includes(ext)) {
      window.open(
        `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(viewUrl)}`,
        '_blank'
      );
    } else {
      window.open(viewUrl, '_blank');
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':   return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'confirmed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:          return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':   return '🔍';
      case 'confirmed': return '🎯';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default:          return '📄';
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Your Consultation Requests</h3>
          <button
            onClick={() => window.location.href = '/consultation'}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all"
          >
            + Book New Consultation
          </button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-slate-400">Loading consultations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Your Consultation Requests</h3>
          <button
            onClick={() => window.location.href = '/consultation'}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all"
          >
            + Book New Consultation
          </button>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={fetchConsultations}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Your Consultation Requests</h3>
            <p className="text-slate-400 text-sm mt-1">
              {consultations.length} consultation{consultations.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchConsultations}
              className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
              title="Refresh"
            >
              🔄
            </button>
            <button
              onClick={() => window.location.href = '/consultation'}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all"
            >
              + Book New Consultation
            </button>
          </div>
        </div>

        {/* Empty state */}
        {consultations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-slate-400 mb-4">No consultation requests yet</p>
            <button
              onClick={() => window.location.href = '/consultation'}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all"
            >
              Book Your First Consultation
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {consultations.map((c) => (
              <div
                key={c._id}
                className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors border border-white/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-2xl mt-0.5">💬</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium">
                        {c.consultationType?.charAt(0).toUpperCase() + c.consultationType?.slice(1)} Consultation
                        {c.workType && ` — ${c.workType.charAt(0).toUpperCase() + c.workType.slice(1)}`}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                        <span>ID: {c.consultationId}</span>
                        {c.preferredDate && (
                          <span>{formatDate(c.preferredDate)} at {c.preferredTime}</span>
                        )}
                      </div>

                      {/* Files pill */}
                      {c.uploadedFiles?.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                          <span>📎</span>
                          <span className="bg-blue-500/20 px-2 py-0.5 rounded">
                            {c.uploadedFiles.length} file{c.uploadedFiles.length !== 1 ? 's' : ''} attached
                          </span>
                        </div>
                      )}

                      {c.description && (
                        <p className="text-slate-300 text-sm bg-white/5 p-3 rounded-lg mt-3">
                          {c.description.length > 180
                            ? `${c.description.substring(0, 180)}…`
                            : c.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <span className={`px-2.5 py-1 text-xs rounded-full border capitalize ${getStatusColor(c.status)}`}>
                      {getStatusIcon(c.status)} {c.status}
                    </span>
                    <button
                      onClick={() => handleView(c)}
                      className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                <div className="mt-3 pl-10 flex gap-4 text-xs text-slate-400">
                  <span>Created: {formatDate(c.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────────────── */}
      {selectedConsultation && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedConsultation(null); }}
        >
          <div className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-white/10 shadow-2xl">

            {/* Modal header */}
            <div className="sticky top-0 bg-slate-900/98 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl">💬</span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white capitalize">
                    {selectedConsultation.consultationType} Consultation
                  </h3>
                  <p className="text-slate-400 text-xs">ID: {selectedConsultation.consultationId}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs rounded-full border flex-shrink-0 capitalize ${getStatusColor(selectedConsultation.status)}`}>
                  {getStatusIcon(selectedConsultation.status)} {selectedConsultation.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="text-slate-400 hover:text-white w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors ml-3 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Contact info */}
              <div className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Full Name</p>
                    <p className="text-white text-sm">{selectedConsultation.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-white text-sm break-all">{selectedConsultation.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-white text-sm">{selectedConsultation.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Work Type</p>
                    <p className="text-white text-sm capitalize">{selectedConsultation.workType}</p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Schedule</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Consultation Type</p>
                    <p className="text-white text-sm capitalize">{selectedConsultation.consultationType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Preferred Date</p>
                    <p className="text-white text-sm">{formatDate(selectedConsultation.preferredDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Preferred Time</p>
                    <p className="text-white text-sm">{selectedConsultation.preferredTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Submitted On</p>
                    <p className="text-white text-sm">{formatDate(selectedConsultation.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedConsultation.description && (
                <div className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Description</h4>
                  <p className="text-slate-200 text-sm leading-relaxed">{selectedConsultation.description}</p>
                </div>
              )}

              {/* Uploaded files */}
              {selectedConsultation.uploadedFiles?.length > 0 && (
                <div className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Attached Documents ({selectedConsultation.uploadedFiles.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedConsultation.uploadedFiles.map((file, i) => (
                      <div
                        key={file._id || i}
                        className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-white text-xs truncate">
                              {file.originalName || file.fileName}
                            </p>
                            {(file.fileSize || file.size) && (
                              <p className="text-slate-500 text-xs">
                                {formatSize(file.fileSize || file.size)}
                                {file.mimeType && ` • ${file.mimeType.split('/')[1]?.toUpperCase()}`}
                              </p>
                            )}
                          </div>
                        </div>
                        {file._id && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleViewFile(file)}
                              className="text-green-400 hover:text-green-300 p-1.5 rounded transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadFile(file)}
                              className="text-blue-400 hover:text-blue-300 p-1.5 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin notes (read-only for user) */}
              {selectedConsultation.consultationNotes && (
                <div className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Notes from Attorney</h4>
                  <p className="text-slate-200 text-sm leading-relaxed">{selectedConsultation.consultationNotes}</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
