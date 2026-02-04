import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { ShieldAlert, ShieldCheck, Activity, Filter, RefreshCw, Flag, Search, Loader2, AlertTriangle, Image as ImageIcon, Zap, Bot, ArrowLeft, ExternalLink, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../services/apiService';
import { toast } from 'react-hot-toast';

const SEVERITY_COLORS = { 'Critical': '#ef4444', 'High': '#f97316', 'Medium': '#3b82f6', 'Low': '#10b981', 'Manual': '#8b5cf6' };

const PLATFORM_COLORS = {
    'twitter': '#1CA1F2',
    'facebook': '#1877F2',
    'reddit': '#FF4500',
    'instagram': '#E4405F',
    'linkedin': '#0A66C2',
    'telegram': '#0088CC',
    'google': '#4285F4',
    'duckduckgo': '#DE5833',
    'github': '#ffffffff',
    'Unknown': '#6B7280'
};

export default function IntelCenter() {
    const [activeTab, setActiveTab] = useState('system'); // 'system' or 'manual'
    const [stats, setStats] = useState(null);
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State (Magic Search)
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        highRiskOnly: false,
        hasMedia: false,
        sources: new Set()
    });

    useEffect(() => {
        fetchData();
    }, [activeTab, searchQuery, filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const platformList = Array.from(filters.sources).join(',');
            const params = {
                platform: platformList || undefined,
                search: searchQuery || undefined,
                risk: filters.highRiskOnly ? 'high' : undefined
            };

            const [statsRes, feedRes] = await Promise.all([
                apiClient.get('/intel/stats', { params }),
                apiClient.get('/intel/feed', {
                    params: { ...params, type: activeTab }
                })
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

    if (!stats) return <div className="p-8 text-center text-gray-500 font-mono tracking-tighter">Initializing Intelligence Engine...</div>;

    return (
        <div className="p-6 max-w-[1600px] -mt-9 mx-auto space-y-6 animate-in fade-in duration-500">

            {/* Header & Global Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">


                <div className="flex flex-1 justify-end items-center gap-4">
                    <MagicSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} filters={filters} setFilters={setFilters} />
                    <button onClick={fetchData} className="p-2 bg-gray-900 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors border border-gray-800">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
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
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PLATFORM_COLORS[entry.platform] || PLATFORM_COLORS['Unknown']}
                                        />
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
                        AI Watchlist <span className="ml-2 bg-gray-800 px-2 py-0.5 rounded text-xs text-white">
                            {activeTab === 'system' ? feed.length : stats.counts.system}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'manual' ? 'border-purple-500 text-purple-500 bg-purple-900/10' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Flag className="w-4 h-4" />
                        Officer Flagged <span className="ml-2 bg-gray-800 px-2 py-0.5 rounded text-xs text-white">
                            {activeTab === 'manual' ? feed.length : stats.counts.manual}
                        </span>
                    </button>
                </div>

                {/* List Content */}
                <div className="p-0">
                    {feed.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex p-4 rounded-full bg-gray-900 mb-4 text-gray-600"><ShieldCheck className="w-12 h-12" /></div>
                            <h3 className="text-xl font-bold text-gray-300">All Clear</h3>
                            <p className="text-gray-500 mt-2">No threats match your filters.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {feed.map(post => (
                                <div key={post.id} className="p-4 hover:bg-white/5 transition-colors flex gap-4 group">
                                    <div className={`w-1 h-auto rounded-full ${post.isManuallyFlagged ? 'bg-purple-500' : 'bg-red-500'}`}></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white">
                                                    {post.author && !post.author.includes('User') ? post.author : (post.username || post.author || 'Unknown')}
                                                </span>
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
                                        <ExpandableText content={post.content} />

                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {post.sourceUrl ? (
                                                <a
                                                    href={post.sourceUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded text-xs font-bold text-peacock-500 hover:bg-gray-800 hover:text-peacock-400 transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    View Post
                                                </a>
                                            ) : post.screenshotPath && (
                                                <a
                                                    href={post.screenshotPath}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded text-xs font-bold text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                                                >
                                                    <ImageIcon className="w-3 h-3" />
                                                    View Capture
                                                </a>
                                            )}
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

function ExpandableText({ content }) {
    const [expanded, setExpanded] = useState(false);
    // Heuristic: Show button if content length > 150 chars 
    const isLong = content && content.length > 150;

    return (
        <div className="mb-3">
            <div className={`text-gray-300 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
                {content}
            </div>
            {isLong && (
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="text-xs text-peacock-500 font-bold mt-1 hover:text-peacock-400 focus:outline-none transition-colors"
                >
                    {expanded ? 'Show Less' : 'Show More'}
                </button>
            )}
        </div>
    );
}

function MagicSearch({ searchQuery, setSearchQuery, filters, setFilters }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = React.useRef(null);
    const inputRef = React.useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                if (!searchQuery && filters.sources.size === 0 && !filters.highRiskOnly && !filters.hasMedia) {
                    setIsExpanded(false);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchQuery, filters]);

    // Hotkey Ctrl+K to open
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsExpanded(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
            if (e.key === 'Escape') {
                setIsExpanded(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleRisk = () => setFilters(prev => ({ ...prev, highRiskOnly: !prev.highRiskOnly }));
    const toggleSource = (source) => {
        setFilters(prev => {
            const newSet = new Set(prev.sources);
            if (newSet.has(source)) newSet.delete(source);
            else newSet.add(source);
            return { ...prev, sources: newSet };
        });
    };

    return (
        <div className="relative z-50 flex justify-end" ref={containerRef}>
            <AnimatePresence mode='wait'>
                {!isExpanded ? (
                    <motion.button
                        layoutId="search-container"
                        onClick={() => { setIsExpanded(true); setTimeout(() => inputRef.current?.focus(), 100); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800  text-secondary rounded-full hover:border-peacock-500 hover:text-primary transition-colors shadow-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Search className="w-4 h-4" />
                        <span className="text-xs font-semibold pr-2">Advanced Search</span>
                        <div className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-500 font-mono">⌘</div>
                    </motion.button>
                ) : (
                    <motion.div
                        layoutId="search-container"
                        className="absolute right-0 top-0 w-[500px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-peacock-500/30 overflow-hidden z-50"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    >
                        <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                            <Search className="w-5 h-5 text-peacock-500 mr-3" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search usernames, content, or flags..."
                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400"
                                autoFocus
                            />
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <span className="text-[10px] font-bold">ESC</span>
                            </button>
                        </div>

                        <div className="p-3 bg-gray-50/50 dark:bg-black/20">
                            <div className="flex flex-wrap gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleRisk}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filters.highRiskOnly
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                        : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <AlertTriangle className="w-3.5 h-3.5" /> High Risk Only
                                </motion.button>

                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setFilters(prev => ({ ...prev, sources: new Set() }))}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filters.sources.size === 0
                                        ? 'bg-peacock-50 dark:bg-peacock-900/20 text-peacock-600 border-peacock-200 dark:border-peacock-800'
                                        : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    All
                                </motion.button>

                                {['twitter', 'facebook', 'instagram', 'telegram', 'reddit', 'linkedin', 'google', 'duckduckgo', 'github'].map(platform => (
                                    <motion.button
                                        key={platform}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleSource(platform)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${filters.sources.has(platform)
                                            ? 'bg-peacock-50 dark:bg-peacock-900/20 text-peacock-600 border-peacock-200 dark:border-peacock-800'
                                            : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        {platform}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {(searchQuery || filters.sources.size > 0 || filters.highRiskOnly) && (
                            <div className="px-4 py-2 bg-peacock-50/50 dark:bg-peacock-900/10 text-[10px] text-peacock-600 dark:text-peacock-400 font-medium flex justify-between items-center">
                                <span>Active Filters Applied</span>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilters({ highRiskOnly: false, hasMedia: false, sources: new Set() });
                                    }}
                                    className="hover:underline"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
