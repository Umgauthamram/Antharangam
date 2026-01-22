import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { ShieldAlert, ShieldCheck, Activity, Filter, RefreshCw, Flag } from 'lucide-react';
import apiClient from '../../services/apiService';
import { toast } from 'react-hot-toast';

const SEVERITY_COLORS = { 'Critical': '#ef4444', 'High': '#f97316', 'Medium': '#3b82f6', 'Low': '#10b981', 'Manual': '#8b5cf6' };

export default function IntelCenter() {
    const [activeTab, setActiveTab] = useState('system'); // 'system' or 'manual'
    const [stats, setStats] = useState(null);
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, feedRes] = await Promise.all([
                apiClient.get('/intel/stats'),
                apiClient.get(`/intel/feed?type=${activeTab}`)
            ]);
            setStats(statsRes.data);
            setFeed(feedRes.data);
        } catch (error) {
            console.error("Intel fetch failed", error);
            toast.error("Failed to load Intel Center");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFlag = async (postId) => {
        try {
            const res = await apiClient.post(`/intel/flag/${postId}`);
            toast.success(res.data.message);
            fetchData(); // Refresh to move item between tabs if needed
        } catch (e) {
            toast.error("Flag operation failed");
        }
    };

    if (!stats) return <div className="p-8 text-center text-gray-500">Loading Intelligence...</div>;

    return (
        <div className="p-6 max-w-[1600px] -mt-9 mx-auto space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-peacock-500" /> Crystal Intelligence Center
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Advanced threat monitoring and officer intervention workspace.
                    </p>
                </div>
                <button onClick={fetchData} className="p-2 bg-gray-900 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Trend Graph */}
                <div className="lg:col-span-2 bg-subtle rounded-xl p-6 border border-gray-800">
                    <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Activity className="w-4 h-4 text-peacock-500" /> Threat Timeline (7 Days)
                    </h4>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.trends}>
                                <defs>
                                    <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMan" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(str) => str.slice(5)} />
                                <YAxis stroke="#666" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                <Area type="monotone" dataKey="system" stroke="#ef4444" fillOpacity={1} fill="url(#colorSys)" name="AI Detected" />
                                <Area type="monotone" dataKey="manual" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMan)" name="Officer Flagged" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Platform Distribution */}
                <div className="bg-subtle rounded-xl p-6 border border-gray-800">
                    <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Filter className="w-4 h-4 text-peacock-500" /> Platform Sources
                    </h4>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.distribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="platform">
                                    {stats.distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ec4899'][index % 4]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-subtle rounded-xl border border-gray-800 overflow-hidden min-h-[500px]">
                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'system' ? 'border-red-500 text-red-500 bg-red-900/10' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        AI Watchlist <span className="ml-2 bg-gray-800 px-2 py-0.5 rounded text-xs text-white">{stats.counts.system}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'manual' ? 'border-purple-500 text-purple-500 bg-purple-900/10' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Flag className="w-4 h-4" />
                        Officer Flagged <span className="ml-2 bg-gray-800 px-2 py-0.5 rounded text-xs text-white">{stats.counts.manual}</span>
                    </button>
                </div>

                {/* List Content */}
                <div className="p-0">
                    {feed.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex p-4 rounded-full bg-gray-900 mb-4 text-gray-600"><ShieldCheck className="w-12 h-12" /></div>
                            <h3 className="text-xl font-bold text-gray-300">All Clear</h3>
                            <p className="text-gray-500 mt-2">No threats found in this category.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {feed.map(post => (
                                <div key={post.id} className="p-4 hover:bg-white/5 transition-colors flex gap-4 group">
                                    <div className={`w-1 h-auto rounded-full ${post.isManuallyFlagged ? 'bg-purple-500' : 'bg-red-500'}`}></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white">{post.author || 'Unknown'}</span>
                                                <span className="text-xs text-gray-500">on {post.platform}</span>
                                                <span className="text-[10px] text-gray-600 px-1.5 border border-gray-700 rounded">{post.timestamp}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {post.isManuallyFlagged && <span className="text-[10px] font-bold bg-purple-900/30 text-purple-400 px-2 py-1 rounded border border-purple-500/30">OFFICER FLAGGED</span>}
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${post.risk === 'Critical' ? 'bg-red-900/30 text-red-500 border-red-500/30' : 'bg-orange-900/30 text-orange-500 border-orange-500/30'}`}>
                                                    {post.risk?.toUpperCase() || 'UNKNOWN'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed mb-3">{post.content}</p>

                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleToggleFlag(post.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-colors ${post.isManuallyFlagged ? 'border-gray-600 text-gray-400 hover:bg-gray-800' : 'border-purple-500/50 text-purple-400 hover:bg-purple-900/20'}`}
                                            >
                                                <Flag className="w-3 h-3" />
                                                {post.isManuallyFlagged ? 'Remove Flag' : 'Flag Suspicious'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
