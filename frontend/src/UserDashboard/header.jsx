import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, RefreshCw, User, Calendar, Clock } from "lucide-react";
import NotificationBell from "../Components/NotificationBell";

export default function DashboardHeader({ user, fetchUserData }) {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const goHome = () => {
    // Add loading state for better UX
    setIsRefreshing(true);
    
    // Use window.location for a complete page refresh to ensure proper state reset
    window.location.href = "/";
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (fetchUserData) {
        await fetchUserData();
      }
      // Also refresh the current page data
      window.location.reload();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000); // Keep loading state for better UX
    }
  };

  const getTimeOfDay = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Enhanced User Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl group-hover:scale-105 transition-all duration-300 border-2 border-white/20">
                {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || 'U'}
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 -z-10"></div>
            </div>
            
            {/* Welcome Text */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 floating">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  {getTimeOfDay()}, {user?.firstName || 'User'}! 👋
                </h1>
              </div>
              <p className="text-slate-300 text-lg font-medium">Track and manage your intellectual property applications</p>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{user?.emailAddresses[0]?.emailAddress}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(currentTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(currentTime)}</span>
                </div>
              </div>
            </div>
          </div>
          
         

            {/* Notification Bell */}
            <NotificationBell clerkUserId={user?.id} />

            {/* Home Button */}
            <button
              onClick={goHome}
              disabled={isRefreshing}
              className="group relative bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-teal-500/25 font-medium flex items-center gap-2 border border-white/20"
            >
              <Home className={`h-5 w-5 ${isRefreshing ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform duration-300`} />
              <span>Home</span>
              {!isRefreshing && (
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-white/10 to-teal-400/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="group relative bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 backdrop-blur-sm border border-white/20 hover:border-white/30 hover:shadow-lg"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
              <span className="font-medium">
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
              {!isRefreshing && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats Bar - Mobile Responsive */}
        <div className="lg:hidden mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-4 border border-white/10 text-center">
            <p className="text-xl font-bold text-white">0</p>
            <p className="text-xs text-slate-400">Active</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-4 border border-white/10 text-center">
            <p className="text-xl font-bold text-green-400">0</p>
            <p className="text-xs text-slate-400">Approved</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-4 border border-white/10 text-center">
            <p className="text-xl font-bold text-yellow-400">0</p>
            <p className="text-xs text-slate-400">Pending</p>
          </div>
        </div>
      </div>
    
  );
}