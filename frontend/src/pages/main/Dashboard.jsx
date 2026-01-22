import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiService';

// Sub-components
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatCards from '../../components/dashboard/StatCards';
import QuickActions from '../../components/dashboard/QuickActions';
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
        // Don't toast error on simple load failure if it's just auth or something minor, 
        // but for dashboard data missing it might be useful. 
        // Keeping silent for now to avoid spamming if backend is restarting.
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleViewProject = (p) => {
    const toastId = toast.loading("Loading case workspace...");
    const id = p.projectId || p._id || p.id;
    apiClient.get(`/posts/by_source?source=${id}`)
      .then(res => {
        toast.dismiss(toastId);
        const posts = res.data.map(post => ({ ...post, id: post._id, timestamp: new Date(post.timestamp).toLocaleString() }));
        const projectObj = p.projectObj || p;
        navigate('/case', { state: { view: 'analysis', currentProject: projectObj, analysisData: { posts, summary: projectObj.summary } } });
      })
      .catch((e) => {
        console.error(e);
        toast.dismiss(toastId);
        toast.error("Failed to load case. " + e.message);
      });
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center text-peacock-500"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-[1600px] -mt-9 mx-auto space-y-6 animate-in fade-in duration-500">

      {/* 1. Header & Search */}
      <DashboardHeader />

      {/* 2. Key Metrics & Health */}
      <StatCards data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[400px]">
        {/* 3. Critical Spotlight (8 cols) */}
        <div className="lg:col-span-8 h-full">
          <CriticalSpotlight criticalCases={data.criticalCases} onViewProject={handleViewProject} />
        </div>

        {/* 4. Quick Actions (4 cols) */}
        <div className="lg:col-span-4 h-full">
          <QuickActions />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 5. Recent Activity (Full width or split) */}
        {/* For V2 plan, we put Recent Activity at bottom left and maybe a distribution chart bottom right?
            Let's make Recent Activity full width or large for now as it's useful.
            Actually, let's keep it simple: Recent Activity takes full width nicely.
        */}
        <div className="lg:col-span-12">
          <RecentActivity recentPosts={data.recentPosts} />
        </div>
      </div>

    </div>
  );
}
