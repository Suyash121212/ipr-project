import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import { Download, FileText, CheckCircle, Clock, Award, BookOpen, RefreshCw, ChevronRight, X } from 'lucide-react';
const backend_url = import.meta.env.VITE_BACKEND_URL;

const COPYRIGHT_STAGES = [
  {
    id: 1, key: 'filing', title: 'Filing the Application',
    description: 'Your copyright application has been filed with all required documents and fees. The application is assigned a filing number and date.',
    icon: FileText,
    color: { bg: 'bg-teal-500', ring: 'ring-teal-400', text: 'text-teal-400', light: 'bg-teal-500/10 border-teal-500/30' },
  },
  {
    id: 2, key: 'scrutiny', title: 'Scrutiny & Diary Number',
    description: 'The application is scrutinized and a diary number is issued. Basic documents and eligibility are verified by the copyright office.',
    icon: BookOpen,
    color: { bg: 'bg-blue-500', ring: 'ring-blue-400', text: 'text-blue-400', light: 'bg-blue-500/10 border-blue-500/30' },
  },
  {
    id: 3, key: 'examination', title: 'Examination',
    description: 'An examiner reviews the application for completeness and compliance with copyright law. This may take several months.',
    icon: Clock,
    color: { bg: 'bg-purple-500', ring: 'ring-purple-400', text: 'text-purple-400', light: 'bg-purple-500/10 border-purple-500/30' },
  },
  {
    id: 4, key: 'objections', title: 'Response to Objections',
    description: 'Any objections raised by the examiner are addressed. Clarifications and amendments are submitted for further consideration.',
    icon: RefreshCw,
    color: { bg: 'bg-orange-500', ring: 'ring-orange-400', text: 'text-orange-400', light: 'bg-orange-500/10 border-orange-500/30' },
  },
  {
    id: 5, key: 'registration', title: 'Registration',
    description: 'Copyright is registered and an official registration certificate is issued to the applicant by the copyright office.',
    icon: Award,
    color: { bg: 'bg-green-500', ring: 'ring-green-400', text: 'text-green-400', light: 'bg-green-500/10 border-green-500/30' },
  },
  {
    id: 6, key: 'certificate', title: 'Certificate Issued',
    description: 'The official copyright certificate is dispatched to the applicant. Copyright protection is now fully active for the complete term.',
    icon: CheckCircle,
    color: { bg: 'bg-emerald-500', ring: 'ring-emerald-400', text: 'text-emerald-400', light: 'bg-emerald-500/10 border-emerald-500/30' },
  },
];

export default function DashboardCopyright() {
  const { user } = useUser();
  const [copyrights, setCopyrights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCopyright, setSelectedCopyright] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchCopyrights = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backend_url}/api/copyright/user/${user.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success) setCopyrights(result.data);
      else setError(result.message);
    } catch (err) {
      setError('Failed to fetch copyright applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchCopyrights(); }, [user]);

  // Fetch fresh data from server when opening modal so stage is always current
  const handleViewCopyright = async (copyright) => {
    setSelectedCopyright(copyright); // show immediately with cached data
    setModalLoading(true);
    try {
      const res = await fetch(`${backend_url}/api/copyright/${copyright._id}`);
      const result = await res.json();
      if (result.success && result.data) {
        setSelectedCopyright(result.data);
        setCopyrights(prev => prev.map(c => c._id === result.data._id ? result.data : c));
      }
    } catch { /* keep cached */ } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => setSelectedCopyright(null);

  // FIX: parseInt to handle string values from MongoDB
  const getStageFromCopyright = (copyright) => {
    if (copyright?.currentStage !== undefined && copyright?.currentStage !== null) {
      const stage = parseInt(copyright.currentStage, 10);
      if (!isNaN(stage) && stage >= 1 && stage <= 6) return stage;
    }
    switch (copyright?.status) {
      case 'draft':
      case 'submitted':          return 1;
      case 'under-review':       return 2;
      case 'under-examination':  return 3;
      case 'objection':          return 4;
      case 'registered':         return 5;
      case 'certificate-issued': return 6;
      case 'rejected':
      case 'cancelled':          return 0;
      default:                   return 1;
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      draft:               { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',          label: '📝 Draft' },
      submitted:           { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',          label: '📤 Submitted' },
      'under-review':      { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',    label: '👀 Under Review' },
      'under-examination': { color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',    label: '🔍 Under Examination' },
      objection:           { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',    label: '⚠️ Objection' },
      registered:          { color: 'bg-green-500/20 text-green-300 border-green-500/30',       label: '✅ Registered' },
      'certificate-issued':{ color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: '🏆 Certificate Issued' },
      rejected:            { color: 'bg-red-500/20 text-red-300 border-red-500/30',             label: '❌ Rejected' },
      cancelled:           { color: 'bg-red-500/20 text-red-300 border-red-500/30',             label: '❌ Cancelled' },
    };
    return map[status] || { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', label: '📄 Pending' };
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleDownloadCertificate = async (copyrightId) => {
    try {
      const res = await fetch(`${backend_url}/api/copyright/${copyrightId}/certificate`);
      const data = await res.json();
      if (data.success && data.certificateUrl) window.open(data.certificateUrl, '_blank');
      else alert('Certificate not available yet or still processing');
    } catch { alert('Error downloading certificate'); }
  };

  const handleDeleteCopyright = async (copyrightId) => {
    if (!window.confirm('Are you sure you want to delete this copyright application?')) return;
    try {
      const res = await fetch(`${backend_url}/api/copyright/${copyrightId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setCopyrights(prev => prev.filter(c => c._id !== copyrightId));
        if (selectedCopyright?._id === copyrightId) closeModal();
      } else alert(data.message || 'Failed to delete');
    } catch { alert('Error deleting copyright application'); }
  };

  // ── Loading ──
  if (loading) return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Your Copyright Applications</h3>
        <button onClick={() => window.location.href = '/copyright'}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all">
          + Register New Copyright
        </button>
      </div>
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
        <p className="text-slate-400">Loading copyright applications...</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchCopyrights}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Copyright List ── */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Your Copyright Applications</h3>
            <p className="text-slate-400 text-sm mt-1">{copyrights.length} application{copyrights.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchCopyrights} title="Refresh"
              className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">🔄</button>
            <button onClick={() => window.location.href = '/copyright'}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all">
              + Register New Copyright
            </button>
          </div>
        </div>

        {copyrights.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">©️</div>
            <p className="text-slate-400 mb-4">No copyright applications yet</p>
            <button onClick={() => window.location.href = '/copyright'}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-all">
              Register Your First Copyright
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {copyrights.map((copyright) => {
              const badge = getStatusBadge(copyright.status);
              const currentStage = getStageFromCopyright(copyright);
              return (
                <div key={copyright._id}
                  className="bg-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors border border-white/5 hover:border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-2xl mt-0.5">©️</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold truncate">{copyright.title}</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                          <span>App No: {copyright.applicationNumber || 'Pending'}</span>
                          <span>By: {copyright.authorName}</span>
                          <span>Type: {copyright.workType?.charAt(0).toUpperCase() + copyright.workType?.slice(1) || 'N/A'}</span>
                          {copyright.filingDate && <span>Filed: {formatDate(copyright.filingDate)}</span>}
                        </div>

                        {/* Mini stage dots — same pattern as UserPatents */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            {COPYRIGHT_STAGES.map((stage, idx) => {
                              const done = stage.id < currentStage;
                              const active = stage.id === currentStage;
                              const { color } = stage;
                              return (
                                <React.Fragment key={stage.id}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                    ${done
                                      ? `${color.bg} text-white`
                                      : active
                                      ? `${color.bg} text-white ring-2 ${color.ring} ring-offset-1 ring-offset-slate-900`
                                      : 'bg-slate-700 text-slate-500'
                                    }`}>
                                    {done ? '✓' : stage.id}
                                  </div>
                                  {idx < COPYRIGHT_STAGES.length - 1 && (
                                    <div className={`h-0.5 w-3 rounded-full ${done ? 'bg-teal-500' : 'bg-slate-700'}`} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                          <span className="text-xs text-slate-400">
                            Stage {currentStage}/6 — <span className="text-white">{COPYRIGHT_STAGES[currentStage - 1]?.title}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                      <span className={`px-2.5 py-1 text-xs rounded-full border ${badge.color}`}>{badge.label}</span>
                      <button onClick={() => handleViewCopyright(copyright)}
                        className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition-colors">
                        View Details
                      </button>
                      {['registered', 'certificate-issued'].includes(copyright.status) && (
                        <button onClick={() => handleDownloadCertificate(copyright._id)}
                          className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs font-medium transition-colors">
                          Certificate
                        </button>
                      )}
                      {copyright.status === 'draft' && (
                        <button onClick={() => handleDeleteCopyright(copyright._id)}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Attached files pill */}
                  {copyright.files?.length > 0 && (
                    <div className="mt-3 pl-10 flex items-center gap-2 text-xs text-slate-400">
                      <span>📎</span>
                      <span className="bg-blue-500/20 px-2 py-0.5 rounded">
                        {copyright.files.length} file{copyright.files.length !== 1 ? 's' : ''} attached
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {selectedCopyright && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-white/10 shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900/98 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl">©️</span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{selectedCopyright.title}</h3>
                  <p className="text-slate-400 text-xs">App No: {selectedCopyright.applicationNumber || 'Pending Assignment'}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs rounded-full border flex-shrink-0 ${getStatusBadge(selectedCopyright.status).color}`}>
                  {getStatusBadge(selectedCopyright.status).label}
                </span>
              </div>
              <button onClick={closeModal}
                className="text-slate-400 hover:text-white w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors ml-3 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Fetching indicator */}
              {modalLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg border border-white/5">
                  <div className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  Fetching latest data...
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/60 rounded-xl p-4 border border-white/5 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Work Information</h4>
                  <div>
                    <p className="text-xs text-slate-500">Work Title</p>
                    <p className="text-white font-semibold text-sm">{selectedCopyright.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Author</p>
                      <p className="text-white text-sm">{selectedCopyright.authorName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Applicant</p>
                      <p className="text-white text-sm">{selectedCopyright.applicantName || '—'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Work Type</p>
                      <p className="text-white text-sm capitalize">{selectedCopyright.workType || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Language</p>
                      <p className="text-white text-sm">{selectedCopyright.language || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Published</p>
                      <p className="text-sm">
                        {selectedCopyright.isPublished
                          ? <span className="text-green-400">✅ Yes</span>
                          : <span className="text-slate-400">❌ No</span>}
                      </p>
                    </div>
                    {selectedCopyright.publicationDate && (
                      <div>
                        <p className="text-xs text-slate-500">Publication Date</p>
                        <p className="text-white text-sm">{formatDate(selectedCopyright.publicationDate)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-4 border border-white/5 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Application Details</h4>
                  <div>
                    <p className="text-xs text-slate-500">Application Number</p>
                    <p className="text-white font-mono text-sm">{selectedCopyright.applicationNumber || 'Pending Assignment'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Filing Date</p>
                    <p className="text-white text-sm">{formatDate(selectedCopyright.filingDate || selectedCopyright.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Submitted On</p>
                    <p className="text-white text-sm">{formatDate(selectedCopyright.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Last Updated</p>
                    <p className="text-white text-sm">{formatDate(selectedCopyright.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedCopyright.description && (
                <div className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Work Description</h4>
                  <div className="bg-slate-700/50 p-4 rounded-lg text-slate-200 text-sm leading-relaxed max-h-36 overflow-y-auto">
                    {selectedCopyright.description}
                  </div>
                </div>
              )}

              {/* Uploaded Files */}
              {selectedCopyright.files?.length > 0 && (
                <div className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Uploaded Files ({selectedCopyright.files.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedCopyright.files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-white text-xs truncate">{file.originalName}</p>
                            <p className="text-slate-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.mimetype}</p>
                          </div>
                        </div>
                        <a href={`${backend_url}/${file.path}`} target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 p-1.5 rounded transition-colors flex-shrink-0">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 6-Stage Timeline ── */}
              {(() => {
                const currentStage = getStageFromCopyright(selectedCopyright);
                const isRejected = ['rejected', 'cancelled'].includes(selectedCopyright.status);
                return (
                  <div className="bg-slate-800/60 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-bold text-white">Application Progress</h4>
                      {isRejected
                        ? <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">❌ Rejected</span>
                        : <span className="text-xs text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full">Stage {currentStage}/6</span>
                      }
                    </div>

                    {!isRejected && (
                      <div className="mb-5">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-500">Progress</span>
                          <span className="text-teal-400 font-medium">{Math.round((currentStage / 6) * 100)}% Complete</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${(currentStage / 6) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {COPYRIGHT_STAGES.map((stage) => {
                        const isCompleted = !isRejected && stage.id < currentStage;
                        const isCurrent = !isRejected && stage.id === currentStage;
                        const { color } = stage;

                        return (
                          <div key={stage.id} className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                            isCurrent   ? color.light :
                            isCompleted ? 'bg-slate-700/30 border-slate-600/30' :
                            'bg-slate-800/30 border-slate-700/20 opacity-50'
                          }`}>
                            {/* Circle */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                              isCompleted
                                ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                                : isCurrent
                                ? `${color.bg} text-white shadow-md ring-2 ${color.ring} ring-offset-2 ring-offset-slate-900`
                                : 'bg-slate-700 text-slate-500'
                            }`}>
                              {isCompleted
                                ? <CheckCircle className="w-5 h-5" />
                                : isCurrent
                                ? <Clock className="w-5 h-5" />
                                : <span>{stage.id}</span>
                              }
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h5 className={`font-semibold text-sm ${isCurrent || isCompleted ? 'text-white' : 'text-slate-500'}`}>
                                  {stage.id}. {stage.title}
                                </h5>
                                {isCurrent && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color.text} bg-white/5 border border-white/10`}>
                                    ⚡ In Progress
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium text-teal-400 bg-teal-500/10">
                                    ✓ Completed
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs leading-relaxed ${
                                isCurrent ? 'text-slate-300' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {stage.description}
                              </p>
                            </div>

                            {isCompleted && <ChevronRight className="w-4 h-4 text-teal-500 flex-shrink-0 mt-1" />}
                          </div>
                        );
                      })}
                    </div>

                    {isRejected && (
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <p className="text-red-300 text-sm">
                          This application has been rejected. Please contact our support team for further assistance.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Certificate Download */}
              {['registered', 'certificate-issued'].includes(selectedCopyright.status) && (
                <div className="flex justify-center">
                  <button onClick={() => handleDownloadCertificate(selectedCopyright._id)}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 font-semibold shadow-lg shadow-green-500/20">
                    <Download className="w-5 h-5" />
                    Download Copyright Certificate
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}