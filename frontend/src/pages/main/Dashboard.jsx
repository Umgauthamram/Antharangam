import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { toast } from 'react-hot-toast';
import {
  Loader2, ShieldAlert, Users, Search, AlertTriangle, Cpu,
  Activity, Fingerprint, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiService';

const SEVERITY_COLORS = { 'Critical': '#ef4444', 'High': '#f97316', 'Medium': '#3b82f6', 'Low': '#10b981', 'Unknown': '#6b7280' };

const StatCard = ({ title, value, subtext, icon: Icon, trend }) => (
  <div className="bg-subtle p-5 rounded-xl relative overflow-hidden group transition-all border border-gray-800 hover:border-peacock-500/50">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className="w-16 h-16 text-peacock-500" />
    </div>
    <div className="relative z-10">
      <p className="text-secondary text-xs uppercase tracking-wider font-bold">{title}</p>
      <h3 className="text-2xl font-bold text-primary mt-1">{value}</h3>
      <p className="text-xs text-gray-500 mt-2 flex items-center">
        {trend && <span className="text-green-500 mr-1">▲ {trend}%</span>}
        {subtext}
      </p>
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    automated: [],
    totalPosts: 0,
    recentPosts: [],
    riskStats: [],
    activityStats: []
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
          activityStats: res.data.activityStats || []
        });
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleViewProject = (p) => {
    const toastId = toast.loading("Loading case workspace...");
    apiClient.get(`/posts/by_source?source=${p.projectId || p._id}`)
      .then(res => {
        toast.dismiss(toastId);
        const posts = res.data.map(post => ({ ...post, id: post._id, timestamp: new Date(post.timestamp).toLocaleString() }));
        navigate('/case', { state: { view: 'analysis', currentProject: p, analysisData: { posts, summary: p.summary } } });
      })
      .catch(() => { toast.dismiss(toastId); toast.error("Failed to load case."); });
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center text-peacock-500"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-[1600px] -mt-9 mx-auto space-y-6 animate-in fade-in duration-500">

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Evidence" value={data.totalPosts} subtext="Items Processed" icon={Fingerprint} trend={12} />
        <StatCard title="Active Investigations" value={data.automated.length} subtext="Ongoing Cases" icon={Search} />
        <StatCard title="Threats Flagged" value={data.riskStats.reduce((acc, curr) => curr.name !== 'Low' ? acc + curr.value : acc, 0)} subtext="Med/High Risks" icon={AlertTriangle} trend={5} />
        <StatCard title="Node Status" value="ONLINE" subtext="Harvester Matrix Active" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN (8 cols): Activity Graph + Operations Table */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* ACTIVITY GRAPH */}
          <div className="bg-subtle rounded-xl p-6 border border-gray-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                <Activity className="w-4 h-4 text-peacock-500" /> Intelligence Velocity
              </h4>
              <span className="text-xs text-secondary bg-primary/20 px-2 py-1 rounded">Last 14 Days</span>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.activityStats}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#0f766e' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ACTIVE OPERATIONS TABLE */}
          <div className="bg-subtle rounded-xl overflow-hidden border border-gray-800 flex-1">
            <div className="p-4 border-b border-gray-800 bg-primary/20 flex justify-between items-center">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                <Users className="w-4 h-4 text-peacock-500" /> Active Operations
              </h4>
              <button onClick={() => navigate('/case')} className="text-xs text-peacock-400 hover:text-white font-bold transition-colors">VIEW ALL</button>
            </div>
            <div className="overflow-auto bg-gray-900/50">
              <table className="w-full text-left border-collapse">
                <thead className="bg-primary/50 text-xs text-gray-400 border-b border-gray-800 uppercase font-mono">
                  <tr>
                    <th className="p-4">Case ID</th>
                    <th className="p-4">Investigator</th>
                    <th className="p-4">Evidence</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm">
                  {data.automated.length > 0 ? data.automated.slice(0, 5).map(p => (
                    <tr key={p._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-white">
                        {p.name}
                        <div className="text-[10px] text-gray-500 font-mono">{p.projectId?.substr(0, 8)}</div>
                      </td>
                      <td className="p-4 text-gray-400">{p.investigator || 'Internal'}</td>
                      <td className="p-4 font-mono text-gray-300">{p.postCount} Items</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleViewProject(p)} className="text-peacock-400 hover:text-white text-xs font-bold border border-peacock-900/50 hover:border-peacock-500 px-3 py-1 rounded bg-peacock-900/10 transition-all">
                          ACCESS
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">No active cases found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols): Threat Pie + Recent Feed */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* THREAT PIE CHART */}
          <div className="bg-subtle rounded-xl p-6 border border-gray-800">
            <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-peacock-500" /> Threat Landscape
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.riskStats}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.riskStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECENT FEED */}
          <div className="bg-subtle rounded-xl border border-gray-800 flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-800 bg-primary/20">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-peacock-500" /> Incoming Intel
              </h4>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[400px]">
              {data.recentPosts.length > 0 ? data.recentPosts.slice(0, 6).map((post, i) => (
                <div key={i} className="flex gap-3 items-start p-3 rounded bg-gray-900/50 border border-gray-800 hover:border-peacock-500/30 transition-colors group">
                  <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${SEVERITY_COLORS[post.risk] || 'bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-gray-300 truncate">{post.author || post.username || 'Unknown'}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{new Date(post.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed group-hover:text-gray-400">
                      {post.content}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-peacock-600 bg-peacock-900/10 px-1.5 py-0.5 rounded">{post.platform}</span>
                      {post.risk === 'High' && <span className="text-[10px] font-bold text-red-500 bg-red-900/10 px-1.5 py-0.5 rounded">THREAT</span>}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 text-xs py-10">No recent intelligence found.</div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
