import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Shield, Key, Mail, BarChart2, Calendar, Trash2, Loader2, Globe, Activity, Terminal, Plus, X, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../services/apiService';

export default function DeveloperPortal() {
    const [keys, setKeys] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAllKeys = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/keys/internal/all');
            setKeys(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Access Denied or Server Error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllKeys();
    }, []);

    // Create Key State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyData, setNewKeyData] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        quota: 1000,
        days: 30,
        allowedPlatforms: ['all']
    });

    const togglePlatform = (p) => {
        setFormData(prev => {
            const current = new Set(prev.allowedPlatforms);
            if (p === 'all') {
                // If selecting all, clear others? Or just set to ['all']
                if (current.has('all')) return { ...prev, allowedPlatforms: [] }; // Toggle off? No, maybe enforce at least one?
                return { ...prev, allowedPlatforms: ['all'] };
            } else {
                // If selecting a specific one, remove 'all'
                if (current.has('all')) current.delete('all');

                if (current.has(p)) current.delete(p);
                else current.add(p);

                // If empty, revert to all? Or allow empty (no access)? Let's default to all if empty for UX or just handle in UI
                return { ...prev, allowedPlatforms: Array.from(current) };
            }
        });
    };

    const handleCreateKey = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await apiClient.post('/keys', {
                name: formData.name,
                email: formData.email,
                quota: formData.quota,
                expiresInDays: formData.days,
                allowedPlatforms: formData.allowedPlatforms.length === 0 ? ['all'] : formData.allowedPlatforms
            });
            setNewKeyData(res.data.key);
            toast.success("New access node established");
            fetchAllKeys(); // Refresh list background
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate key");
        } finally {
            setIsCreating(false);
        }
    };

    const handleRevoke = async (id) => {
        if (!window.confirm("CRITICAL: Revoke this API key globally? This cannot be undone.")) return;

        try {
            await apiClient.delete(`/keys/internal/${id}`);
            toast.success("Key successfully voided");
            fetchAllKeys();
        } catch (error) {
            toast.error("Revocation failed");
        }
    };

    const getDuration = (createdAt) => {
        const start = new Date(createdAt);
        const now = new Date();
        const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `${diffDays} days` : 'Created today';
    };

    if (isLoading) return (
        <div className="h-screen bg-black flex flex-col items-center justify-center text-peacock-500 gap-4">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="font-mono text-sm tracking-widest uppercase">Initializing Master Access...</p>
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 bg-black min-h-screen text-white">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter flex items-center gap-4">
                        <Terminal className="w-10 h-10 text-peacock-500" />
                        MASTER API REGISTRY
                    </h1>
                    <p className="text-zinc-500 font-mono text-xs mt-2 uppercase tracking-wide">
                        Internal Oversight & Intelligence Distribution Management
                    </p>
                </div>
                <div className="flex gap-8 items-end">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-peacock-600 hover:bg-peacock-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow-lg shadow-peacock-900/20"
                    >
                        <Plus className="w-4 h-4" /> Issue Node
                    </button>
                    <div className="text-right">
                        <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Total Active Nodes</p>
                        <p className="text-2xl font-bold text-peacock-400">{keys.length}</p>
                    </div>
                </div>
            </div>

            {/* Registry List */}
            <div className="grid grid-cols-1 gap-4">
                {keys.length === 0 ? (
                    <div className="p-20 border border-dashed border-zinc-800 rounded-3xl text-center">
                        <Key className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-600 font-mono italic">No active intelligence keys found in global registry.</p>
                    </div>
                ) : (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-900 border-b border-zinc-800">
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Identify / Alias</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Owner Distribution</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Data Retrieval Count</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Duration / Age</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Operational Status</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 font-mono">
                                {keys.map((key) => (
                                    <tr key={key._id} className="hover:bg-zinc-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded bg-peacock-500/10 text-peacock-500">
                                                    <Key className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{key.name}</p>
                                                    <p className="text-[10px] text-zinc-600">{key.prefix}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-zinc-300">
                                                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                                                <span className="text-xs">{key.email || 'System Default'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-peacock-500 shadow-[0_0_10px_rgba(5,150,105,0.5)]"
                                                        style={{ width: `${Math.min((key.usage || 0) / 10, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-peacock-400">{key.usage || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-zinc-300">{getDuration(key.createdAt)}</span>
                                                <span className="text-[9px] text-zinc-600 uppercase">Since {new Date(key.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-green-900/20 text-green-500 border border-green-900/30 uppercase tracking-tighter">
                                                <Activity className="w-2.5 h-2.5 mr-1 animate-pulse" /> Encrypted Transmission Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRevoke(key._id)}
                                                className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Void Transmission Key"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Warning Footer */}
            <div className="bg-red-900/10 border border-red-900/20 p-4 rounded-xl flex items-center gap-4">
                <Shield className="w-5 h-5 text-red-500" />
                <p className="text-[10px] text-red-500 uppercase font-bold tracking-widest">
                    Authorized Master Access Only. All revocation actions are logged and permanently affect system integration nodes.
                </p>
            </div>

            {/* Create Key Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>

                            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-white">
                                <Key className="w-5 h-5 text-peacock-500" /> Issue New Access Node
                            </h3>

                            {!newKeyData ? (
                                <form onSubmit={handleCreateKey} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Node Identifier (Name)</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-peacock-500 focus:outline-none transition-colors"
                                            placeholder="e.g. Field Operations Unit A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Authorized Owner (Email)</label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-peacock-500 focus:outline-none transition-colors"
                                            placeholder="officer@agency.gov"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Quota Limit</label>
                                            <input
                                                type="number"
                                                value={formData.quota}
                                                onChange={e => setFormData({ ...formData, quota: Number(e.target.value) })}
                                                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-peacock-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Validity (Days)</label>
                                            <input
                                                type="number"
                                                value={formData.days}
                                                onChange={e => setFormData({ ...formData, days: Number(e.target.value) })}
                                                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-peacock-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Platform Scope</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['all', 'twitter', 'facebook', 'github', 'reddit', 'telegram', 'google', 'linkedin'].map(p => (
                                                <label key={p} className="flex items-center gap-2 p-2 rounded bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.allowedPlatforms.includes(p)}
                                                        onChange={() => togglePlatform(p)}
                                                        className="rounded border-zinc-600 text-peacock-500 focus:ring-peacock-500 bg-black"
                                                    />
                                                    <span className="text-xs text-zinc-300 capitalize">{p}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isCreating}
                                            className="bg-peacock-600 hover:bg-peacock-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                            Generate Key
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-4 bg-yellow-900/10 border border-yellow-900/30 rounded-lg">
                                        <p className="text-sm text-yellow-500 font-bold mb-2 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> SECURE COPY REQUIRED
                                        </p>
                                        <p className="text-xs text-yellow-500/80">This key will only be displayed once. If lost, it cannot be recovered.</p>
                                    </div>

                                    <div className="bg-black p-4 rounded-xl border border-zinc-800 flex items-center justify-between group">
                                        <code className="font-mono text-peacock-400 text-sm break-all">{newKeyData}</code>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(newKeyData); toast.success("Copied to clipboard"); }}
                                            className="p-2 text-zinc-500 hover:text-white transition-colors"
                                        >
                                            Copy
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => { setShowCreateModal(false); setNewKeyData(null); setFormData({ name: '', email: '', quota: 1000, days: 30 }); }}
                                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg transition-colors border border-zinc-700"
                                    >
                                        Done & Close
                                    </button>
                                </div>
                            )}

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Add to imports: import { motion, AnimatePresence } from 'framer-motion'; existing imports need checking
