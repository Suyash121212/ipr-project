const backend_url = import.meta.env.VITE_BACKEND_URL;
import { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, Award, BookOpen, RefreshCw, ChevronRight, X } from 'lucide-react';

const PATENT_STAGES = [
  {
    id: 1, key: 'filing', title: 'Filing the Application',
    description: 'Application filed with all required documents and fees. Assigned a filing number and date.',
    icon: FileText,
    color: { bg: 'bg-teal-500', ring: 'ring-teal-400', text: 'text-teal-400', light: 'bg-teal-500/15 border-teal-500/30' },
  },
  {
    id: 2, key: 'publication', title: 'Publication',
    description: 'Application published in the Official Journal after 18 months from the filing/priority date.',
    icon: BookOpen,
    color: { bg: 'bg-blue-500', ring: 'ring-blue-400', text: 'text-blue-400', light: 'bg-blue-500/15 border-blue-500/30' },
  },
  {
    id: 3, key: 'examination', title: 'Request for Examination',
    description: 'Formal request for examination filed. Examiner reviews for patentability, novelty and inventive step.',
    icon: Clock,
    color: { bg: 'bg-purple-500', ring: 'ring-purple-400', text: 'text-purple-400', light: 'bg-purple-500/15 border-purple-500/30' },
  },
  {
    id: 4, key: 'objections', title: 'Response to Objections',
    description: 'Office actions and objections from the examiner are addressed. Amendments submitted for review.',
    icon: RefreshCw,
    color: { bg: 'bg-orange-500', ring: 'ring-orange-400', text: 'text-orange-400', light: 'bg-orange-500/15 border-orange-500/30' },
  },
  {
    id: 5, key: 'grant', title: 'Grant of Patent',
    description: 'Patent granted after successful examination. Certificate of patent issued and published.',
    icon: Award,
    color: { bg: 'bg-green-500', ring: 'ring-green-400', text: 'text-green-400', light: 'bg-green-500/15 border-green-500/30' },
  },
  {
    id: 6, key: 'renewal', title: 'Renewal',
    description: 'Annual renewal fees paid to keep the patent in force for up to 20 years from the filing date.',
    icon: CheckCircle,
    color: { bg: 'bg-emerald-500', ring: 'ring-emerald-400', text: 'text-emerald-400', light: 'bg-emerald-500/15 border-emerald-500/30' },
  },
];

// FIX 1: Each stage now has a unique status string
const STAGE_TO_STATUS = {
  1: 'submitted',
  2: 'published',
  3: 'under-examination',
  4: 'objection',       // ← was duplicate 'under-examination', now unique
  5: 'granted',
  6: 'renewal',
};

export default function Patents() {
  const [patents, setPatents] = useState([]);
  const [selectedPatent, setSelectedPatent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [stageUpdating, setStageUpdating] = useState(false);
  const [stageUpdateSuccess, setStageUpdateSuccess] = useState(null);

  useEffect(() => { fetchPatents(); }, []);

  const fetchPatents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backend_url}/api/patents`);
      const result = await response.json();
      if (result.success) { setPatents(result.data); setError(null); }
      else setError(`Failed to fetch patents: ${result.message}`);
    } catch (err) {
      setError(`Failed to fetch patents: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // FIX 2: Normalize currentStage to Number when opening modal so it persists correctly
  const handleViewPatent = (patent) => {
    const normalizedPatent = {
      ...patent,
      currentStage: parseInt(patent.currentStage, 10) || getCurrentStage(patent),
    };
    setSelectedPatent(normalizedPatent);
    setShowModal(true);
    setStageUpdateSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPatent(null);
    setStageUpdateSuccess(null);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await fetch(`${backend_url}/api/patents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (result.success) {
        setPatents(prev => prev.map(p => p._id === id ? { ...p, status } : p));
        if (selectedPatent?._id === id) setSelectedPatent(prev => ({ ...prev, status }));
      } else {
        alert('Failed to update patent status');
      }
    } catch { alert('Error updating patent status'); }
  };

  // FIX 3: Save currentStage as Number, update both table + modal state on success
  const handleUpdateStage = async (patentId, stageId) => {
    if (stageUpdating) return;
    setStageUpdating(true);
    setStageUpdateSuccess(null);

    const newStatus = STAGE_TO_STATUS[stageId] || selectedPatent.status;
    const payload = {
      currentStage: Number(stageId),  // ← ensure Number, not string
      status: newStatus,
    };

    //console.log('📤 Saving stage to DB:', payload);

    try {
      const response = await fetch(`${backend_url}/api/patents/${patentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      //console.log('📥 DB response:', result);

      if (result.success) {
        // Update both modal state and table row so stage persists without refresh
        const updatedPatent = {
          ...selectedPatent,
          currentStage: Number(stageId),   // ← Number in local state
          status: newStatus,
        };
        setSelectedPatent(updatedPatent);
        setPatents(prev => prev.map(p =>
          p._id === patentId
            ? { ...p, currentStage: Number(stageId), status: newStatus }
            : p
        ));
        setStageUpdateSuccess(stageId);
        setTimeout(() => setStageUpdateSuccess(null), 2500);
      } else {
        //console.error('DB update failed:', result);
        alert(`Failed to update stage: ${result.message || 'Please check the server logs.'}`);
      }
    } catch (err) {
      //console.error('Network error:', err);
      alert(`Network error: ${err.message}`);
    } finally {
      setStageUpdating(false);
    }
  };

  const handleDeletePatent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patent application?')) return;
    try {
      const response = await fetch(`${backend_url}/api/patents/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: true }),
      });
      const result = await response.json();
      if (result.success) {
        setPatents(prev => prev.filter(p => p._id !== id));
        if (selectedPatent?._id === id) handleCloseModal();
        alert('Patent deleted successfully');
      } else {
        alert(result.message || 'Failed to delete patent');
      }
    } catch { alert('Error deleting patent'); }
  };

  // FIX 4: parseInt to handle string values coming from MongoDB
  const getCurrentStage = (patent) => {
    if (patent?.currentStage !== undefined && patent?.currentStage !== null) {
      const stage = parseInt(patent.currentStage, 10);
      if (!isNaN(stage) && stage >= 1 && stage <= 6) return stage;
    }
    // Fallback: derive stage from status string
    switch (patent?.status) {
      case 'draft':
      case 'submitted':
      case 'applied':          return 1;
      case 'published':        return 2;
      case 'under-examination':
      case 'under-review':
      case 'pending':          return 3;
      case 'objection':        return 4;
      case 'granted':
      case 'approved':         return 5;
      case 'renewal':          return 6;
      default:                 return 1;
    }
  };

  const getStatusColor = (status) => {
    const map = {
      draft: 'bg-gray-500/20 text-gray-300',
      submitted: 'bg-blue-500/20 text-blue-300',
      'under-examination': 'bg-yellow-500/20 text-yellow-300',
      granted: 'bg-green-500/20 text-green-300',
      rejected: 'bg-red-500/20 text-red-300',
      published: 'bg-purple-500/20 text-purple-300',
      expired: 'bg-orange-500/20 text-orange-300',
      renewal: 'bg-emerald-500/20 text-emerald-300',
      objection: 'bg-orange-500/20 text-orange-300',
    };
    return map[status] || 'bg-gray-500/20 text-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: '📝',
      submitted: '📤',
      'under-examination': '🔍',
      granted: '✅',
      rejected: '❌',
      published: '📖',
      expired: '⏰',
      renewal: '🔄',
      objection: '⚠️',
    };
    return icons[status] || '📄';
  };

  const formatDate = (d) => new Date(d).toLocaleDateString();

  const handleDownloadFile = (patent, file) => {
    if (file?._id) window.open(`${backend_url}/api/patents/${patent._id}/download/${file._id}`, '_blank');
    else alert('File not available for download');
  };

  if (error) return (
    <div className="p-6">
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span className="text-red-400 text-xl">⚠️</span>
          <div><h3 className="text-red-300 font-medium">Error</h3><p className="text-red-200 text-sm">{error}</p></div>
        </div>
        <button onClick={fetchPatents} className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="p-6 mt-22 ml-65">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white">Patent Applications</h2>
        <div className="flex space-x-2 flex-wrap gap-y-2">
          <button onClick={fetchPatents} disabled={isLoading}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
            {isLoading ? '⟳ Loading...' : '🔄 Refresh'}
          </button>
          <span className="px-3 py-1 bg-blue-600 text-blue-100 rounded-full text-sm">Total: {patents.length}</span>
          <span className="px-3 py-1 bg-green-600 text-green-100 rounded-full text-sm">Granted: {patents.filter(p => p.status === 'granted').length}</span>
          <span className="px-3 py-1 bg-yellow-600 text-yellow-100 rounded-full text-sm">Under Review: {patents.filter(p => ['submitted', 'under-examination'].includes(p.status)).length}</span>
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
                  {['App. No.', 'Invention Title', 'Inventor', 'Type', 'Filing Date', 'Stage', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {patents.map((patent) => {
                  // FIX 5: Use updated getCurrentStage with parseInt so table reflects saved stage
                  const stage = getCurrentStage(patent);
                  return (
                    <tr key={patent._id} className="hover:bg-slate-750">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300">{patent.applicationNumber || 'Draft'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300 font-medium">{patent.inventionTitle}</div>
                        {patent.abstractDescription && (
                          <div className="text-xs text-slate-500 truncate max-w-xs">{patent.abstractDescription.substring(0, 50)}...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">{patent.inventorName}</div>
                        {patent.applicantName && patent.applicantName !== patent.inventorName && (
                          <div className="text-xs text-slate-500">App: {patent.applicantName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">{patent.patentType || patent.inventionType || 'Utility'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{formatDate(patent.filingDate || patent.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* FIX 6: Stage badge now shows correct saved stage number */}
                        <span className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                          Stage {stage}/6
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full capitalize flex items-center gap-1 w-fit ${getStatusColor(patent.status || 'draft')}`}>
                          {getStatusIcon(patent.status || 'draft')} {(patent.status || 'draft').replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onClick={() => handleViewPatent(patent)} className="text-blue-400 hover:text-blue-300">View</button>
                        <button onClick={() => { const f = patent.supportingDocuments?.[0] || patent.technicalDrawings?.[0]; handleDownloadFile(patent, f); }} className="text-green-400 hover:text-green-300">Download</button>
                        <button onClick={() => handleDeletePatent(patent._id)} className="text-red-400 hover:text-red-300">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {patents.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-slate-600 text-6xl mb-4">🔬</div>
              <div className="text-slate-500 text-lg">No patent applications found</div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && selectedPatent && (() => {
        // FIX 7: currentStage in modal always reads from normalized selectedPatent (Number)
        const currentStage = getCurrentStage(selectedPatent);

        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
            <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-white/10 shadow-2xl">

              {/* Header */}
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">🔬</span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">{selectedPatent.inventionTitle}</h3>
                    <p className="text-slate-400 text-xs">App No: {selectedPatent.applicationNumber || 'Not Assigned'}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full flex-shrink-0 ${getStatusColor(selectedPatent.status || 'draft')}`}>
                    {getStatusIcon(selectedPatent.status || 'draft')} {(selectedPatent.status || 'draft').replace('-', ' ')}
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
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Basic Information</h4>
                    <div>
                      <p className="text-xs text-slate-500">Invention Title</p>
                      <p className="text-white font-semibold">{selectedPatent.inventionTitle}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-xs text-slate-500">Inventor</p><p className="text-white text-sm">{selectedPatent.inventorName}</p></div>
                      <div><p className="text-xs text-slate-500">Applicant</p><p className="text-white text-sm">{selectedPatent.applicantName || 'Same as inventor'}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-xs text-slate-500">Patent Type</p><p className="text-white text-sm capitalize">{selectedPatent.patentType || 'Utility Patent'}</p></div>
                      <div><p className="text-xs text-slate-500">Filing Date</p><p className="text-white text-sm">{formatDate(selectedPatent.filingDate || selectedPatent.createdAt)}</p></div>
                    </div>
                  </div>
                  <div className="bg-slate-800/70 rounded-xl p-5 border border-white/5 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact & Dates</h4>
                    {selectedPatent.email && <div><p className="text-xs text-slate-500">Email</p><p className="text-white text-sm">{selectedPatent.email}</p></div>}
                    {selectedPatent.phone && <div><p className="text-xs text-slate-500">Phone</p><p className="text-white text-sm">{selectedPatent.phone}</p></div>}
                    <div><p className="text-xs text-slate-500">Priority Date</p><p className="text-white text-sm">{selectedPatent.priorityDate ? formatDate(selectedPatent.priorityDate) : 'Not Claimed'}</p></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-xs text-slate-500">Created</p><p className="text-slate-300 text-sm">{formatDate(selectedPatent.createdAt)}</p></div>
                      <div><p className="text-xs text-slate-500">Updated</p><p className="text-slate-300 text-sm">{formatDate(selectedPatent.updatedAt)}</p></div>
                    </div>
                  </div>
                </div>

                {/* Technical Description */}
                {selectedPatent.technicalDescription && (
                  <div className="bg-slate-800/70 rounded-xl p-5 border border-white/5">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Technical Description</h4>
                    <div className="bg-slate-700/50 p-4 rounded-lg text-slate-200 text-sm leading-relaxed max-h-40 overflow-y-auto">{selectedPatent.technicalDescription}</div>
                  </div>
                )}

                {/* Claims */}
                {selectedPatent.claims && (
                  <div className="bg-slate-800/70 rounded-xl p-5 border border-white/5">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Patent Claims</h4>
                    <div className="bg-slate-700/50 p-4 rounded-lg text-slate-200 text-sm max-h-40 overflow-y-auto">{selectedPatent.claims}</div>
                  </div>
                )}

                {/* Documents */}
                {((selectedPatent.supportingDocuments?.length > 0) || (selectedPatent.technicalDrawings?.length > 0)) && (
                  <div className="bg-slate-800/70 rounded-xl p-5 border border-white/5">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Uploaded Documents</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedPatent.technicalDrawings?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Technical Drawings ({selectedPatent.technicalDrawings.length})</p>
                          {selectedPatent.technicalDrawings.map((file, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg mb-2">
                              <div className="flex items-center gap-2"><span className="text-purple-400">🖼️</span>
                                <div><p className="text-white text-xs">{file.originalName || file.filename}</p><p className="text-slate-500 text-xs">{Math.round((file.size || 0) / 1024)} KB</p></div>
                              </div>
                              <button onClick={() => handleDownloadFile(selectedPatent, file)} className="text-purple-400 hover:text-purple-300 text-xs px-2 py-1 bg-purple-500/20 rounded">Download</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedPatent.supportingDocuments?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Supporting Documents ({selectedPatent.supportingDocuments.length})</p>
                          {selectedPatent.supportingDocuments.map((file, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg mb-2">
                              <div className="flex items-center gap-2"><span className="text-blue-400">📎</span>
                                <div><p className="text-white text-xs">{file.originalName || file.filename}</p><p className="text-slate-500 text-xs">{Math.round((file.size || 0) / 1024)} KB</p></div>
                              </div>
                              <button onClick={() => handleDownloadFile(selectedPatent, file)} className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-blue-500/20 rounded">Download</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── 6-Stage Interactive Timeline ── */}
                <div className="bg-slate-800/70 rounded-xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-base font-bold text-white">Patent Progress Timeline</h4>
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
                    {PATENT_STAGES.map((stage) => {
                      const isCompleted = stage.id < currentStage;
                      const isCurrent = stage.id === currentStage;
                      const justSaved = stageUpdateSuccess === stage.id;
                      const { color } = stage;

                      return (
                        <div
                          key={stage.id}
                          onClick={() => !stageUpdating && handleUpdateStage(selectedPatent._id, stage.id)}
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
                    {selectedPatent.status === 'submitted' && (
                      <button onClick={() => handleUpdateStatus(selectedPatent._id, 'under-examination')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                        🔍 Start Examination
                      </button>
                    )}
                    {selectedPatent.status === 'under-examination' && (
                      <>
                        <button onClick={() => handleUpdateStatus(selectedPatent._id, 'granted')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                          ✅ Grant Patent
                        </button>
                        <button onClick={() => handleUpdateStatus(selectedPatent._id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                          ❌ Reject Application
                        </button>
                        <button onClick={() => handleUpdateStatus(selectedPatent._id, 'published')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                          📖 Publish Application
                        </button>
                      </>
                    )}
                    {selectedPatent.status === 'granted' && (
                      <button onClick={() => handleUpdateStatus(selectedPatent._id, 'published')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                        📖 Publish Patent
                      </button>
                    )}
                    <button onClick={() => handleDeletePatent(selectedPatent._id)}
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