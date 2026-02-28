const backend_url = import.meta.env.VITE_BACKEND_URL;
import { useEffect, useState } from "react";
import { FileText, CheckCircle, Clock, Award, BookOpen, RefreshCw, ChevronRight, X } from 'lucide-react';

const COPYRIGHT_STAGES = [
  {
    id: 1, key: 'filing', title: 'Filing the Application',
    description: 'Application filed with all required documents and fees. Assigned a filing number and date.',
    icon: FileText,
    color: { bg: 'bg-teal-500', ring: 'ring-teal-400', text: 'text-teal-400', light: 'bg-teal-500/15 border-teal-500/30' },
  },
  {
    id: 2, key: 'scrutiny', title: 'Scrutiny & Diary Number',
    description: 'Application is scrutinized and a diary number is issued. Basic documents are verified.',
    icon: BookOpen,
    color: { bg: 'bg-blue-500', ring: 'ring-blue-400', text: 'text-blue-400', light: 'bg-blue-500/15 border-blue-500/30' },
  },
  {
    id: 3, key: 'examination', title: 'Examination',
    description: 'Examiner reviews the application for completeness and compliance with copyright law.',
    icon: Clock,
    color: { bg: 'bg-purple-500', ring: 'ring-purple-400', text: 'text-purple-400', light: 'bg-purple-500/15 border-purple-500/30' },
  },
  {
    id: 4, key: 'objections', title: 'Response to Objections',
    description: 'Any objections raised by the examiner are addressed and clarifications submitted.',
    icon: RefreshCw,
    color: { bg: 'bg-orange-500', ring: 'ring-orange-400', text: 'text-orange-400', light: 'bg-orange-500/15 border-orange-500/30' },
  },
  {
    id: 5, key: 'registration', title: 'Registration',
    description: 'Copyright is registered and a registration certificate is issued to the applicant.',
    icon: Award,
    color: { bg: 'bg-green-500', ring: 'ring-green-400', text: 'text-green-400', light: 'bg-green-500/15 border-green-500/30' },
  },
  {
    id: 6, key: 'certificate', title: 'Certificate Issued',
    description: 'Official copyright certificate dispatched. Protection is now active for the full term.',
    icon: CheckCircle,
    color: { bg: 'bg-emerald-500', ring: 'ring-emerald-400', text: 'text-emerald-400', light: 'bg-emerald-500/15 border-emerald-500/30' },
  },
];

const STAGE_TO_STATUS = {
  1: 'submitted',
  2: 'under-review',
  3: 'under-examination',
  4: 'objection',
  5: 'registered',
  6: 'certificate-issued',
};

export default function Copyrights() {
  const [copyrights, setCopyrights] = useState([]);
  const [selectedCopyright, setSelectedCopyright] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [stageUpdating, setStageUpdating] = useState(false);
  const [stageUpdateSuccess, setStageUpdateSuccess] = useState(null);

  useEffect(() => { fetchCopyrights(); }, []);

  const fetchCopyrights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backend_url}/api/copyright`);
      const result = await response.json();
      if (result.success) { setCopyrights(result.data); setError(null); }
      else setError(`Failed to fetch copyrights: ${result.message}`);
    } catch (err) {
      setError(`Failed to fetch copyrights: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStage = (copyright) => {
    if (copyright?.currentStage !== undefined && copyright?.currentStage !== null) {
      const stage = parseInt(copyright.currentStage, 10);
      if (!isNaN(stage) && stage >= 1 && stage <= 6) return stage;
    }
    switch (copyright?.status) {
      case 'draft':
      case 'submitted':        return 1;
      case 'under-review':     return 2;
      case 'under-examination':return 3;
      case 'objection':        return 4;
      case 'registered':       return 5;
      case 'certificate-issued': return 6;
      default:                 return 1;
    }
  };

  const handleViewCopyright = (copyright) => {
    const normalizedCopyright = {
      ...copyright,
      currentStage: parseInt(copyright.currentStage, 10) || getCurrentStage(copyright),
    };
    setSelectedCopyright(normalizedCopyright);
    setShowModal(true);
    setStageUpdateSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCopyright(null);
    setStageUpdateSuccess(null);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await fetch(`${backend_url}/api/copyright/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (result.success) {
        setCopyrights(prev => prev.map(c => c._id === id ? { ...c, status } : c));
        if (selectedCopyright?._id === id) setSelectedCopyright(prev => ({ ...prev, status }));
      } else {
        alert('Failed to update copyright status');
      }
    } catch { alert('Error updating copyright status'); }
  };

  const handleUpdateStage = async (copyrightId, stageId) => {
    if (stageUpdating) return;
    setStageUpdating(true);
    setStageUpdateSuccess(null);

    const newStatus = STAGE_TO_STATUS[stageId] || selectedCopyright.status;
    const payload = {
      currentStage: Number(stageId),
      status: newStatus,
    };

    try {
      const response = await fetch(`${backend_url}/api/copyright/${copyrightId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        const updatedCopyright = {
          ...selectedCopyright,
          currentStage: Number(stageId),
          status: newStatus,
        };
        setSelectedCopyright(updatedCopyright);
        setCopyrights(prev => prev.map(c =>
          c._id === copyrightId
            ? { ...c, currentStage: Number(stageId), status: newStatus }
            : c
        ));
        setStageUpdateSuccess(stageId);
        setTimeout(() => setStageUpdateSuccess(null), 2500);
      } else {
        alert(`Failed to update stage: ${result.message || 'Please check the server logs.'}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setStageUpdating(false);
    }
  };

  const handleDeleteCopyright = async (id) => {
    if (!window.confirm('Are you sure you want to delete this copyright application?')) return;
    try {
      const response = await fetch(`${backend_url}/api/copyright/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: true }),
      });
      const result = await response.json();
      if (result.success) {
        setCopyrights(prev => prev.filter(c => c._id !== id));
        if (selectedCopyright?._id === id) handleCloseModal();
        alert('Copyright application deleted successfully');
      } else {
        alert(result.message || 'Failed to delete copyright');
      }
    } catch { alert('Error deleting copyright'); }
  };

  const getStatusColor = (status) => {
    const map = {
      draft: 'bg-gray-500/20 text-gray-300',
      submitted: 'bg-blue-500/20 text-blue-300',
      'under-review': 'bg-yellow-500/20 text-yellow-300',
      'under-examination': 'bg-purple-500/20 text-purple-300',
      objection: 'bg-orange-500/20 text-orange-300',
      registered: 'bg-green-500/20 text-green-300',
      'certificate-issued': 'bg-emerald-500/20 text-emerald-300',
      rejected: 'bg-red-500/20 text-red-300',
    };
    return map[status] || 'bg-gray-500/20 text-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: '📝',
      submitted: '📤',
      'under-review': '👀',
      'under-examination': '🔍',
      objection: '⚠️',
      registered: '✅',
      'certificate-issued': '🏆',
      rejected: '❌',
    };
    return icons[status] || '📄';
  };

  const formatDate = (d) => new Date(d).toLocaleDateString();

  if (error) return (
    <div className="p-6">
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span className="text-red-400 text-xl">⚠️</span>
          <div><h3 className="text-red-300 font-medium">Error</h3><p className="text-red-200 text-sm">{error}</p></div>
        </div>
        <button onClick={fetchCopyrights} className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="p-6 mt-22 ml-65">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white">Copyright Applications</h2>
        <div className="flex space-x-2 flex-wrap gap-y-2">
          <button onClick={fetchCopyrights} disabled={isLoading}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
            {isLoading ? '⟳ Loading...' : '🔄 Refresh'}
          </button>
          <span className="px-3 py-1 bg-blue-600 text-blue-100 rounded-full text-sm">Total: {copyrights.length}</span>
          <span className="px-3 py-1 bg-green-600 text-green-100 rounded-full text-sm">Registered: {copyrights.filter(c => c.status === 'registered').length}</span>
          <span className="px-3 py-1 bg-yellow-600 text-yellow-100 rounded-full text-sm">Pending: {copyrights.filter(c => ['submitted', 'under-review'].includes(c.status)).length}</span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  {['App. No.', 'Title', 'Author', 'Work Type', 'Filing Date', 'Stage', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {copyrights.map((copyright) => {
                  const stage = getCurrentStage(copyright);
                  return (
                    <tr key={copyright._id} className="hover:bg-slate-750">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300">{copyright.applicationNumber || 'Draft'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300 font-medium">{copyright.title}</div>
                        <div className="text-xs text-slate-500">{copyright.language}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">{copyright.authorName}</div>
                        {copyright.applicantName && copyright.applicantName !== copyright.authorName && (
                          <div className="text-xs text-slate-500">App: {copyright.applicantName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">{copyright.workType || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{formatDate(copyright.filingDate || copyright.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                          Stage {stage}/6
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full capitalize flex items-center gap-1 w-fit ${getStatusColor(copyright.status || 'draft')}`}>
                          {getStatusIcon(copyright.status || 'draft')} {(copyright.status || 'draft').replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onClick={() => handleViewCopyright(copyright)} className="text-blue-400 hover:text-blue-300">View</button>
                        <button onClick={() => handleDeleteCopyright(copyright._id)} className="text-red-400 hover:text-red-300">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {copyrights.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-slate-600 text-6xl mb-4">©️</div>
              <div className="text-slate-500 text-lg">No copyright applications found</div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && selectedCopyright && (() => {
        const currentStage = getCurrentStage(selectedCopyright);

        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
            <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-white/10 shadow-2xl">

              {/* Modal Header */}
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">©️</span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">{selectedCopyright.title}</h3>
                    <p className="text-slate-400 text-xs">App No: {selectedCopyright.applicationNumber || 'Not Assigned'}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full flex-shrink-0 ${getStatusColor(selectedCopyright.status || 'draft')}`}>
                    {getStatusIcon(selectedCopyright.status || 'draft')} {(selectedCopyright.status || 'draft').replace(/-/g, ' ')}
                  </span>
                </div>
                <button onClick={handleCloseModal}
                  className="text-slate-400 hover:text-white w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors ml-3 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/70 rounded-xl p-5 border border-white/5 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Work Information</h4>
                    <div>
                      <p className="text-xs text-slate-500">Work Title</p>
                      <p className="text-white font-semibold">{selectedCopyright.title}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-xs text-slate-500">Author</p><p className="text-white text-sm">{selectedCopyright.authorName}</p></div>
                      <div><p className="text-xs text-slate-500">Applicant</p><p className="text-white text-sm">{selectedCopyright.applicantName || 'Same as author'}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-xs text-slate-500">Work Type</p><p className="text-white text-sm capitalize">{selectedCopyright.workType || 'Not specified'}</p></div>
                      <div><p className="text-xs text-slate-500">Language</p><p className="text-white text-sm">{selectedCopyright.language || 'Not specified'}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Published</p>
                        <p className="text-sm">{selectedCopyright.isPublished ? <span className="text-green-400">✅ Yes</span> : <span className="text-slate-400">❌ No</span>}</p>
                      </div>
                      {selectedCopyright.publicationDate && (
                        <div><p className="text-xs text-slate-500">Publication Date</p><p className="text-white text-sm">{formatDate(selectedCopyright.publicationDate)}</p></div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-800/70 rounded-xl p-5 border border-white/5 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Application Details</h4>
                    <div><p className="text-xs text-slate-500">Application Number</p><p className="text-white font-mono text-sm">{selectedCopyright.applicationNumber || 'Not Assigned (Draft)'}</p></div>
                    <div><p className="text-xs text-slate-500">Filing Date</p><p className="text-white text-sm">{formatDate(selectedCopyright.filingDate || selectedCopyright.createdAt)}</p></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-xs text-slate-500">Created</p><p className="text-slate-300 text-sm">{formatDate(selectedCopyright.createdAt)}</p></div>
                      <div><p className="text-xs text-slate-500">Updated</p><p className="text-slate-300 text-sm">{formatDate(selectedCopyright.updatedAt)}</p></div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedCopyright.description && (
                  <div className="bg-slate-800/70 rounded-xl p-5 border border-white/5">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Work Description</h4>
                    <div className="bg-slate-700/50 p-4 rounded-lg text-slate-200 text-sm leading-relaxed max-h-40 overflow-y-auto">{selectedCopyright.description}</div>
                  </div>
                )}

                {/* Files */}
                {selectedCopyright.files?.length > 0 && (
                  <div className="bg-slate-800/70 rounded-xl p-5 border border-white/5">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Uploaded Files ({selectedCopyright.files.length})</h4>
                    <div className="space-y-2">
                      {selectedCopyright.files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400">📎</span>
                            <div>
                              <p className="text-white text-xs">{file.originalName}</p>
                              <p className="text-slate-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.mimetype}</p>
                            </div>
                          </div>
                          <a href={`${backend_url}/${file.path}`} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-blue-500/20 rounded transition-colors">
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 6-Stage Interactive Timeline ── */}
                <div className="bg-slate-800/70 rounded-xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-base font-bold text-white">Copyright Progress Timeline</h4>
                    <span className="text-xs text-slate-400 bg-slate-700/60 border border-white/5 px-3 py-1 rounded-full">Admin Control</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-5">
                    Click any stage to update the applicant's progress. Changes are saved to the database immediately.
                  </p>

                  {/* Progress bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500">Overall Progress</span>
                      <span className="text-xs text-teal-400 font-medium">{Math.round((currentStage / 6) * 100)}% — Stage {currentStage}/6</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${(currentStage / 6) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Stage cards */}
                  <div className="space-y-3">
                    {COPYRIGHT_STAGES.map((stage) => {
                      const isCompleted = stage.id < currentStage;
                      const isCurrent = stage.id === currentStage;
                      const justSaved = stageUpdateSuccess === stage.id;
                      const { color } = stage;

                      return (
                        <div
                          key={stage.id}
                          onClick={() => !stageUpdating && handleUpdateStage(selectedCopyright._id, stage.id)}
                          className={`group flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none
                            ${stageUpdating ? 'cursor-wait' : 'hover:scale-[1.005]'}
                            ${justSaved
                              ? 'bg-green-500/10 border-green-500/40 shadow-md shadow-green-500/10'
                              : isCurrent
                              ? `${color.light} shadow-md`
                              : isCompleted
                              ? 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50'
                              : 'bg-slate-800/40 border-slate-700/20 hover:bg-slate-700/30 opacity-60 hover:opacity-90'
                            }`}
                        >
                          {/* Circle */}
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all
                            ${justSaved
                              ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 ring-2 ring-green-400 ring-offset-2 ring-offset-slate-900'
                              : isCompleted
                              ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                              : isCurrent
                              ? `${color.bg} text-white shadow-lg ring-2 ${color.ring} ring-offset-2 ring-offset-slate-900`
                              : 'bg-slate-700 text-slate-400'
                            }`}>
                            {justSaved
                              ? <CheckCircle className="w-5 h-5" />
                              : isCompleted
                              ? <CheckCircle className="w-5 h-5" />
                              : isCurrent
                              ? <Clock className="w-5 h-5" />
                              : <span>{stage.id}</span>
                            }
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h5 className={`font-semibold text-sm ${isCurrent || isCompleted || justSaved ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                {stage.id}. {stage.title}
                              </h5>
                              {justSaved && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium text-green-400 bg-green-500/15 border border-green-500/30 animate-pulse">
                                  ✅ Saved to DB
                                </span>
                              )}
                              {!justSaved && isCurrent && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color.text} bg-white/5 border border-white/10`}>
                                  ⚡ Current Stage
                                </span>
                              )}
                              {!justSaved && isCompleted && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium text-teal-400 bg-teal-500/10">
                                  ✓ Completed
                                </span>
                              )}
                            </div>
                            <p className={`text-xs leading-relaxed ${isCurrent || justSaved ? 'text-slate-300' : isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                              {stage.description}
                            </p>
                          </div>

                          {/* Right icon */}
                          <div className={`flex-shrink-0 mt-1 transition-all ${
                            justSaved ? 'text-green-400' : isCurrent ? color.text : 'text-slate-600 group-hover:text-slate-400'
                          }`}>
                            {stageUpdating
                              ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              : justSaved
                              ? <CheckCircle className="w-4 h-4" />
                              : <ChevronRight className="w-4 h-4" />
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-500 text-center mt-4">
                    💡 Click any stage to set it as current — saved instantly to database and visible to the user
                  </p>
                </div>

                {/* Status Action Buttons */}
                <div className="bg-slate-800/70 rounded-xl p-5 border border-white/5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Status Actions</h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedCopyright.status === 'submitted' && (
                      <button onClick={() => handleUpdateStatus(selectedCopyright._id, 'under-review')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                        👀 Start Review
                      </button>
                    )}
                    {selectedCopyright.status === 'under-review' && (
                      <>
                        <button onClick={() => handleUpdateStatus(selectedCopyright._id, 'under-examination')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                          🔍 Start Examination
                        </button>
                        <button onClick={() => handleUpdateStatus(selectedCopyright._id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                          ❌ Reject Application
                        </button>
                      </>
                    )}
                    {selectedCopyright.status === 'under-examination' && (
                      <>
                        <button onClick={() => handleUpdateStatus(selectedCopyright._id, 'registered')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                          ✅ Register Copyright
                        </button>
                        <button onClick={() => handleUpdateStatus(selectedCopyright._id, 'objection')}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                          ⚠️ Raise Objection
                        </button>
                        <button onClick={() => handleUpdateStatus(selectedCopyright._id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                          ❌ Reject Application
                        </button>
                      </>
                    )}
                    {selectedCopyright.status === 'registered' && (
                      <button onClick={() => handleUpdateStatus(selectedCopyright._id, 'certificate-issued')}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm">
                        🏆 Issue Certificate
                      </button>
                    )}
                    {selectedCopyright.status === 'rejected' && (
                      <button onClick={() => handleUpdateStatus(selectedCopyright._id, 'submitted')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        🔄 Resubmit for Review
                      </button>
                    )}
                    <button onClick={() => handleDeleteCopyright(selectedCopyright._id)}
                      className="px-4 py-2 bg-red-700/80 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                      🗑️ Delete Application
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}