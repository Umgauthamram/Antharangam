import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { toast } from 'react-hot-toast';
import { Loader2, FileText, ExternalLink, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiService';

// --- MOCK DATA FOR CHARTS (Connect to Backend Aggregation API later) ---
const alertSeverityData = [
  { name: 'Critical', value: 12 },
  { name: 'High', value: 38 },
  { name: 'Medium', value: 89 },
  { name: 'Low', value: 140 },
];

const alertPlatformData = [
  { name: 'X (Twitter)', value: 156 },
  { name: 'Telegram', value: 84 },
  { name: 'Dark Web', value: 12 },
  { name: 'Facebook', value: 27 },
  { name: 'Reddit', value: 50 },

];

const SEVERITY_COLORS = { 'Critical': '#dc2626', 'High': '#ea580c', 'Medium': '#2563eb', 'Low': '#8b5cf6' };
const PLATFORM_COLORS = { 'X (Twitter)': '#585858ff', 'Telegram': '#229ED9', 'Dark Web': '#05631fff', 'Facebook': '#1877F2', 'Reddit': '#e33900ff' };

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-black rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col">
      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        {title}
      </h4>
      <div className="h-64 w-full flex-grow">{children}</div>
    </div>
  );
}

function DonutChart({ data, colors }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 text-sm">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">{payload[0].name}</p>
          <p className="text-gray-500 dark:text-gray-400">
            Count: <span className="font-mono font-bold text-gray-900 dark:text-white">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={85}
          paddingAngle={4}
          cornerRadius={4}
        >
          {data.map((entry) => (
            <Cell 
              key={entry.name} 
              fill={colors[entry.name] || '#cbd5e1'} 
              strokeWidth={0}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          iconType="circle"
          formatter={(value) => <span className="text-gray-600 dark:text-gray-400 font-medium ml-1">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ProjectListCard({ title, projects, onViewProject, emptyMessage }) {
  const listItems = projects.slice(0, 5);

  return (
    <div className="bg-white dark:bg-black rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h4>
      </div>
      <div className="flex-grow p-0">
        {listItems.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {listItems.map((p) => (
              <div key={p._id} className="group flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {p.keyword}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {p.postCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      {p.postCount} Items
                    </span>
                  )}
                  
                  <button
                    onClick={() => onViewProject(p)}
                    className="p-2 text-gray-400 hover:text-peacock-600 dark:hover:text-peacock-400 hover:bg-peacock-50 dark:hover:bg-peacock-900/20 rounded-lg transition-all"
                    title="View Analysis"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    manual: [],
    automated: [],
    totalPosts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const handleViewProject = async (project) => {
    const toastId = toast.loading("Loading case data...");
    try {
      const sourceIdentifier = project.type === 'Automated' ? project.projectId : project.sourceTag;

      // 🔥 FIX: apiClient returns an Axios response object. 
      // Use `res.data` directly. Do NOT use `await res.json()`.
      const res = await apiClient.get(`/posts/by_source?source=${encodeURIComponent(sourceIdentifier)}`);
      
      const posts = res.data; // <--- CORRECTED LINE

      const formattedPosts = posts.map(p => ({
        ...p,
        id: p._id,
        timestamp: new Date(p.timestamp).toLocaleString('en-IN')
      }));

      toast.dismiss(toastId);
      navigate('/case', {
        state: {
          view: 'analysis',
          currentProject: project,
          analysisData: {
            posts: formattedPosts,
            summary: project.summary
          }
        }
      });

    } catch (err) {
      toast.dismiss(toastId);
      console.error("Could not open project analysis:", err);
      toast.error("Failed to load case data.");
    }
  };

  useEffect(() => {
    setIsLoading(true);
    apiClient.get('/projects/main-projects')
      .then(res => {
        const data = res.data;
        setDashboardData({
          manual: data.manual || [],
          automated: data.automated || [],
          totalPosts: data.totalPosts || 0
        });
      })
      .catch((error) => {
        console.error("Error fetching dashboard data:", error);
        toast.error("Could not load dashboard stats");
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-10 h-10 text-peacock-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading Intelligence Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Command Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of active intelligence operations</p>
        </div>
        <div className="bg-peacock-50 dark:bg-peacock-900/20 px-4 py-2 rounded-lg border border-peacock-100 dark:border-peacock-800">
          <span className="text-sm text-peacock-800 dark:text-peacock-200 font-medium">
            Total Evidence Items: <span className="text-lg font-bold ml-1">{dashboardData.totalPosts}</span>
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Threat Severity Distribution">
          <DonutChart data={alertSeverityData} colors={SEVERITY_COLORS} />
        </ChartCard>
        <ChartCard title="Platform Coverage">
          <DonutChart data={alertPlatformData} colors={PLATFORM_COLORS} />
        </ChartCard>
      </div>

      {/* Projects Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectListCard
          title="Recent Manual Strikes"
          projects={dashboardData.manual}
          onViewProject={handleViewProject}
          emptyMessage="No manual search operations found."
        />
        <ProjectListCard
          title="Active Automated Harvesters"
          projects={dashboardData.automated}
          onViewProject={handleViewProject}
          emptyMessage="No automated monitoring jobs running."
        />
      </div>
    </div>
  );
}