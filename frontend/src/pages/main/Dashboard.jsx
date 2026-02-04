import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiService';


import StatCards from '../../components/dashboard/StatCards';
import CriticalSpotlight from '../../components/dashboard/CriticalSpotlight';
import RecentActivity from '../../components/dashboard/RecentActivity';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    automated: [],
    totalPosts: 0,
    recentPosts: [],
    riskStats: [],
    activityStats: [],
    criticalCases: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiClient.get('/projects/main-projects')
      .then(res => {
        setData({
          automated: res.data.automated || [],
          totalPosts: res.data.totalPosts || 0,
          recentPosts: res.data.recentPosts || [],
          riskStats: res.data.riskStats || [],
          activityStats: res.data.activityStats || [],
          criticalCases: res.data.criticalCases || []
        });
      })
      .catch(err => {
        console.error(err);

      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleViewProject = (p) => {
    const id = p.projectId || p._id || p.id;
    navigate(`/Case/${id}`);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center text-peacock-500"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-[1600px] -mt-9 mx-auto space-y-6 animate-in fade-in duration-500">

      {/* 1. Safety Banner */}
      {data.automated.some(p => p.status === 'Running') && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="text-sm font-bold text-red-500">Active Investigation in Progress</h3>
              <p className="text-xs text-red-500/80">
                System is currently locked. You must wait for the current case to complete or stop it manually before starting a new one.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/Case')} // Redirect to Case Management
            className="px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/50 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-red-500 hover:text-white transition-all"
          >
            Manage Case
          </button>
        </div>
      )}

      {/* 2. Key Metrics & Health */}
      <StatCards data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[400px]">
        {/* 4. Critical Spotlight */}
        <div className="lg:col-span-12 h-full">
          <CriticalSpotlight criticalCases={data.criticalCases} onViewProject={handleViewProject} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 5. Recent Activity */}
        <div className="lg:col-span-12">
          <RecentActivity recentPosts={data.recentPosts} />
        </div>
      </div>

    </div>
  );
}
