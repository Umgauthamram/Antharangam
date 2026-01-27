import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
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
