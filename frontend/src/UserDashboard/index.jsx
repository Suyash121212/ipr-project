import { useEffect, useState } from 'react';
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
const backend_url = import.meta.env.VITE_BACKEND_URL;
// Import components from the UserDashboard folder
import DashboardHeader from './header';
import DashboardOverview from './overview';
import DashboardPatent from './patent';
import DashboardCopyright from './copyright';
import DashboardConsultation from './consultation';

export default function UserDashboard() {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState({
    patents: [],
    copyrights: [],
    consultations: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewModalData, setViewModalData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch user's patents with detailed status information
      const patentsResponse = await fetch(`${backend_url}/api/patents/user/${user.id}`);
      const patentsResult = await patentsResponse.json();
      
      // Fetch user's copyrights with detailed status information
      const copyrightsResponse = await fetch(`${backend_url}/api/copyright/user/${user.id}`);
      const copyrightsResult = await copyrightsResponse.json();
      
      // Fetch user's consultations with detailed status information
      const consultationsResponse = await fetch(`${backend_url}/api/consultations/user/${user.id}`);
      const consultationsResult = await consultationsResponse.json();
      
      setDashboardData({
        patents: patentsResult.success ? patentsResult.data : [],
        copyrights: copyrightsResult.success ? copyrightsResult.data : [],
        consultations: consultationsResult.success ? consultationsResult.data : []
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (item, type) => {
    setViewModalData({ ...item, type });
    setShowModal(true);
  };

  const handleDelete = async (id, type) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${backend_url}/api/user/${user.id}/${type}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUserData(); // Refresh data
        alert('Item deleted successfully');
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const handleDownload = async (id, type) => {
    try {
      const response = await fetch(`${backend_url}/api/user/${user.id}/${type}/${id}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Download failed');
      }
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Download error');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-4">Access Restricted</h2>
          <p className="text-slate-300 mb-6">Please log in to view your dashboard</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header Component */}
      <DashboardHeader user={user} fetchUserData={fetchUserData} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-2xl p-1 mb-8">
          {['overview', 'patents', 'copyrights', 'consultations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 capitalize ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-red-400 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="text-red-300 font-medium">Error</h3>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <DashboardOverview 
                dashboardData={dashboardData}
              />
            )}

            {/* Patents Tab */}
            {activeTab === 'patents' && (
              <DashboardPatent 
                patents={dashboardData.patents}
                handleView={handleView}
                handleDelete={handleDelete}
                handleDownload={handleDownload}
              />
            )}

            {/* Copyrights Tab */}
            {activeTab === 'copyrights' && (
              <DashboardCopyright 
                copyrights={dashboardData.copyrights}
                handleView={handleView}
                handleDelete={handleDelete}
                handleDownload={handleDownload}
              />
            )}

            {/* Consultations Tab */}
            {activeTab === 'consultations' && (
              <DashboardConsultation 
                consultations={dashboardData.consultations}
                handleView={handleView}
                handleDelete={handleDelete}
              />
            )}
          </>
        )}
      </div>

      {/* Modal Component (can be moved to separate component if needed) */}
      {showModal && viewModalData && (
        <ViewModal 
          viewModalData={viewModalData}
          setShowModal={setShowModal}
        />
      )}
    </div>
  );
}

// Modal Component (you can move this to a separate file if needed)
function ViewModal({ viewModalData, setShowModal }) {
  const { type, ...data } = viewModalData;
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'submitted': 
      case 'applied': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'under-examination':
      case 'under-review': 
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'granted':
      case 'registered': 
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected': 
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'published': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'confirmed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return '📝';
      case 'submitted': 
      case 'applied': return '📤';
      case 'under-examination':
      case 'under-review': 
      case 'pending': return '🔍';
      case 'granted':
      case 'registered': 
      case 'completed': return '✅';
      case 'rejected': 
      case 'cancelled': return '❌';
      case 'published': return '📖';
      case 'confirmed': return '🎯';
      default: return '📄';
    }
  };

  const getPatentStages = (status, currentStage = 1) => {
    const stages = [
      { name: 'Application Filed', status: 'completed' },
      { name: 'Formal Examination', status: currentStage >= 2 ? 'completed' : 'pending' },
      { name: 'Publication', status: currentStage >= 3 ? 'completed' : 'pending' },
      { name: 'Substantive Examination', status: currentStage >= 4 ? 'completed' : 'pending' },
      { name: 'Grant/Rejection', status: currentStage >= 5 ? 'completed' : 'pending' }
    ];

    if (status === 'rejected') {
      stages[4] = { name: 'Rejected', status: 'rejected' };
    } else if (status === 'granted') {
      stages[4] = { name: 'Granted', status: 'completed' };
    }

    return stages;
  };

  const getCopyrightStages = (status, currentStage = 1) => {
    const stages = [
      { name: 'Application Submitted', status: 'completed' },
      { name: 'Initial Review', status: currentStage >= 2 ? 'completed' : 'pending' },
      { name: 'Examination', status: currentStage >= 3 ? 'completed' : 'pending' },
      { name: 'Publication', status: currentStage >= 4 ? 'completed' : 'pending' },
      { name: 'Registration', status: currentStage >= 5 ? 'completed' : 'pending' }
    ];

    if (status === 'rejected') {
      stages[4] = { name: 'Rejected', status: 'rejected' };
    } else if (status === 'registered') {
      stages[4] = { name: 'Registered', status: 'completed' };
    }

    return stages;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/20 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white capitalize">
              {type} Details
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {type === 'patents' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Patent Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-400">Title</label>
                      <p className="text-white">{data.inventionTitle}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Application Number</label>
                      <p className="text-white font-mono">{data.applicationNumber || 'Pending'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Patent Type</label>
                      <p className="text-white">{data.patentType || 'Utility Patent'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Filing Date</label>
                      <p className="text-white">{formatDate(data.filingDate || data.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Status</label>
                      <span className={`inline-block px-3 py-1 text-xs rounded-full border capitalize ${getStatusColor(data.status)}`}>
                        {getStatusIcon(data.status)} {data.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Processing Stages</h3>
                  <div className="space-y-3">
                    {getPatentStages(data.status, data.currentStage).map((stage, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                          stage.status === 'completed' ? 'bg-green-500 text-white' :
                          stage.status === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {stage.status === 'completed' ? '✓' : 
                           stage.status === 'rejected' ? '✕' : index + 1}
                        </div>
                        <span className={`text-sm ${
                          stage.status === 'completed' ? 'text-green-300' :
                          stage.status === 'rejected' ? 'text-red-300' :
                          'text-slate-400'
                        }`}>
                          {stage.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {data.description && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                  <p className="text-slate-300 bg-white/5 p-4 rounded-lg">{data.description}</p>
                </div>
              )}
            </div>
          )}

          {type === 'copyrights' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Copyright Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-400">Title</label>
                      <p className="text-white">{data.title}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Application Number</label>
                      <p className="text-white font-mono">{data.applicationNumber || 'Pending'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Work Type</label>
                      <p className="text-white">{data.workType}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Filing Date</label>
                      <p className="text-white">{formatDate(data.filingDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Status</label>
                      <span className={`inline-block px-3 py-1 text-xs rounded-full border capitalize ${getStatusColor(data.status)}`}>
                        {getStatusIcon(data.status)} {data.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Processing Stages</h3>
                  <div className="space-y-3">
                    {getCopyrightStages(data.status, data.currentStage).map((stage, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                          stage.status === 'completed' ? 'bg-green-500 text-white' :
                          stage.status === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {stage.status === 'completed' ? '✓' : 
                           stage.status === 'rejected' ? '✕' : index + 1}
                        </div>
                        <span className={`text-sm ${
                          stage.status === 'completed' ? 'text-green-300' :
                          stage.status === 'rejected' ? 'text-red-300' :
                          'text-slate-400'
                        }`}>
                          {stage.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {data.description && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                  <p className="text-slate-300 bg-white/5 p-4 rounded-lg">{data.description}</p>
                </div>
              )}
            </div>
          )}

          {type === 'consultations' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Consultation Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-400">Consultation ID</label>
                      <p className="text-white font-mono">{data.consultationId}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Type</label>
                      <p className="text-white">{data.consultationType}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Work Type</label>
                      <p className="text-white">{data.workType}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Preferred Date</label>
                      <p className="text-white">{formatDate(data.preferredDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Preferred Time</label>
                      <p className="text-white">{data.preferredTime}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Status</label>
                      <span className={`inline-block px-3 py-1 text-xs rounded-full border capitalize ${getStatusColor(data.status)}`}>
                        {getStatusIcon(data.status)} {data.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-400">Full Name</label>
                      <p className="text-white">{data.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Email</label>
                      <p className="text-white">{data.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Phone</label>
                      <p className="text-white">{data.phone}</p>
                    </div>
                    {data.alternatePhone && (
                      <div>
                        <label className="text-sm text-slate-400">Alternate Phone</label>
                        <p className="text-white">{data.alternatePhone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {data.description && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                  <p className="text-slate-300 bg-white/5 p-4 rounded-lg">{data.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}