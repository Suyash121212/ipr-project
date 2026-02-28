import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
const backend_url = import.meta.env.VITE_BACKEND_URL;

export default function DashboardOverview() {
  const { user, isLoaded } = useUser();
  
  // States for different data types
  const [patents, setPatents] = useState([]);
  const [copyrights, setCopyrights] = useState([]);
  const [consultations, setConsultations] = useState([]);
  
  // Stats states
  const [consultationStats, setConsultationStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data
  const fetchAllData = async () => {
    if (!user || !user.id) {
      console.log('No user or user ID available');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching all data for user:', user.id);
      
      // Fetch consultations
      const consultationsResponse = await fetch(`${backend_url}/api/consultations/user/${user.id}?limit=100`);
      
      if (!consultationsResponse.ok) {
        throw new Error(`Consultations API failed with status: ${consultationsResponse.status}`);
      }
      
      const consultationsResult = await consultationsResponse.json();
      console.log('Consultations API Response:', consultationsResult);
      
      if (consultationsResult.success) {
        const consultationsData = consultationsResult.data;
        setConsultations(consultationsData);
        
        // Calculate consultation stats
        const total = consultationsResult.pagination?.total || consultationsData.length;
        const pending = consultationsData.filter(c => c.status === 'pending').length;
        const confirmed = consultationsData.filter(c => c.status === 'confirmed').length;
        const completed = consultationsData.filter(c => c.status === 'completed').length;
        const cancelled = consultationsData.filter(c => c.status === 'cancelled').length;
        
        setConsultationStats({
          total,
          pending,
          confirmed,
          completed,
          cancelled
        });
      } else {
        throw new Error(consultationsResult.message || 'Failed to fetch consultations');
      }

      // Fetch patents
      try {
        console.log('Fetching patents for user:', user.id);
        const patentsResponse = await fetch(`${backend_url}/api/patents/user/${user.id}`);
        if (patentsResponse.ok) {
          const patentsResult = await patentsResponse.json();
          if (patentsResult.success) {
            setPatents(patentsResult.data || []);
          }
        }
      } catch (patentError) {
        console.error('Error fetching patents:', patentError);
        setPatents([]);
      }

      // Fetch copyrights
      try {
        const copyrightsResponse = await fetch(`${backend_url}/api/copyright/user/${user.id}`);
        if (copyrightsResponse.ok) {
          const copyrightsResult = await copyrightsResponse.json();
          if (copyrightsResult.success) {
            setCopyrights(copyrightsResult.data || []);
          }
        }
      } catch (copyrightError) {
        console.error('Error fetching copyrights:', copyrightError);
        setCopyrights([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchAllData();
    }
  }, [isLoaded, user]);

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryStats = (items) => {
    const applied = items.filter(item => 
      ['submitted', 'applied', 'draft'].includes(item.status)
    ).length;
    
    const pending = items.filter(item => 
      ['pending', 'under-examination', 'under-review'].includes(item.status)
    ).length;
    
    const completed = items.filter(item => 
      ['granted', 'registered', 'completed', 'confirmed'].includes(item.status)
    ).length;

    return { applied, pending, completed };
  };

  // Combine all activities
  const allActivities = [
    ...patents.map(p => ({ ...p, type: 'patent' })),
    ...copyrights.map(c => ({ ...c, type: 'copyright' })),
    ...consultations.map(c => ({ ...c, type: 'consultation' }))
  ].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0);
    const dateB = new Date(b.updatedAt || b.createdAt || 0);
    return dateB - dateA;
  }).slice(0, 10); // Show 10 recent activities

  const totalApplications = patents.length + copyrights.length + consultationStats.total;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-white/20 rounded w-1/3 mb-4"></div>
                <div className="flex gap-4">
                  <div className="h-3 bg-white/20 rounded w-1/4"></div>
                  <div className="h-3 bg-white/20 rounded w-1/4"></div>
                  <div className="h-3 bg-white/20 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Recent Activity Skeleton */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="h-6 bg-white/20 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <h3 className="text-red-400 font-bold mb-2">Error Loading Data</h3>
          <p className="text-red-300">{error}</p>
          <button 
            onClick={fetchAllData}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Patents</p>
              <p className="text-3xl font-bold text-white">{patents.length}</p>
            </div>
            <div className="text-4xl">🔬</div>
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="text-blue-400">
              {getCategoryStats(patents).applied} applied
            </span>
            <span className="text-yellow-400">
              {getCategoryStats(patents).pending} pending
            </span>
            <span className="text-green-400">
              {getCategoryStats(patents).completed} completed
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Copyrights</p>
              <p className="text-3xl font-bold text-white">{copyrights.length}</p>
            </div>
            <div className="text-4xl">©️</div>
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="text-blue-400">
              {getCategoryStats(copyrights).applied} applied
            </span>
            <span className="text-yellow-400">
              {getCategoryStats(copyrights).pending} pending
            </span>
            <span className="text-green-400">
              {getCategoryStats(copyrights).completed} completed
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Consultations</p>
              <p className="text-3xl font-bold text-white">{consultationStats.total}</p>
            </div>
            <div className="text-4xl">💬</div>
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="text-yellow-400">
              {consultationStats.pending} pending
            </span>
            <span className="text-emerald-400">
              {consultationStats.confirmed} confirmed
            </span>
            <span className="text-green-400">
              {consultationStats.completed} completed
            </span>
            {consultationStats.cancelled > 0 && (
              <span className="text-red-400">
                {consultationStats.cancelled} cancelled
              </span>
            )}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Applications</p>
              <p className="text-3xl font-bold text-white">{totalApplications}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
          <div className="mt-4">
            <span className="text-purple-400 text-sm">
              {patents.length} patents • {copyrights.length} copyrights • {consultationStats.total} consultations
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {allActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No recent activity found
            </div>
          ) : (
            allActivities.map((item, index) => {
              // Get appropriate title based on item type
              let title = '';
              if (item.type === 'patent') {
                title = item.inventionTitle || 'Patent Application';
              } else if (item.type === 'copyright') {
                title = item.title || 'Copyright Application';
              } else {
                title = `${item.consultationType || 'Consultation'} ${item.workType ? `- ${item.workType}` : ''}`;
              }

              return (
                <div key={index} className="flex items-center justify-between bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {item.type === 'patent' ? '🔬' : item.type === 'copyright' ? '©️' : '💬'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{title}</p>
                      <p className="text-slate-400 text-sm">
                        {formatDate(item.updatedAt || item.createdAt)} • 
                        <span className="capitalize ml-1">
                          {item.type}
                          {item.applicationNumber && ` • ${item.applicationNumber}`}
                          {item.consultationId && ` • ${item.consultationId}`}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full border capitalize ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)} {item.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Optional: Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <h4 className="text-slate-400 text-sm mb-2">Patent Status</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-blue-400">Applied</span>
              <span className="text-white">{getCategoryStats(patents).applied}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-400">Pending</span>
              <span className="text-white">{getCategoryStats(patents).pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Completed</span>
              <span className="text-white">{getCategoryStats(patents).completed}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <h4 className="text-slate-400 text-sm mb-2">Copyright Status</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-blue-400">Applied</span>
              <span className="text-white">{getCategoryStats(copyrights).applied}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-400">Pending</span>
              <span className="text-white">{getCategoryStats(copyrights).pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Completed</span>
              <span className="text-white">{getCategoryStats(copyrights).completed}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <h4 className="text-slate-400 text-sm mb-2">Consultation Status</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-yellow-400">Pending</span>
              <span className="text-white">{consultationStats.pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-400">Confirmed</span>
              <span className="text-white">{consultationStats.confirmed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Completed</span>
              <span className="text-white">{consultationStats.completed}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}