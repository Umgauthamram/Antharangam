import React from 'react';
import { Activity, Globe, MessageSquare, Twitter, Instagram, Shield, Search, ArrowRight, Github } from 'lucide-react';

const PlatformIcon = ({ platform }) => {
    switch (platform.toLowerCase()) {
        case 'twitter': return <Twitter className="w-4 h-4" />;
        case 'instagram': return <Instagram className="w-4 h-4" />;
        case 'reddit': return <MessageSquare className="w-4 h-4" />;
        case 'github': return <Github className="w-4 h-4" />;
        default: return <Globe className="w-4 h-4" />;
    }
};

export default function InvestigationGrid({ projects, onViewProject }) {
    const activeProjects = projects?.filter(p => p.status === 'Running') || [];

    if (activeProjects.length === 0) {
        return (
            <div className="bg-subtle/50 rounded-xl p-8 border border-gray-800 flex flex-col items-center text-center justify-center space-y-3">
                <Search className="w-10 h-10 text-gray-700" />
                <div>
                    <h4 className="text-gray-400 font-bold">No Active Investigations</h4>
                    <p className="text-xs text-gray-500">Launch an automated case to see live intelligence metrics here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
                <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-peacock-500" /> Active Case Observation
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase">Live performance metrics per investigation</p>
                </div>
                <div className="text-[10px] text-peacock-500 font-bold bg-peacock-500/10 px-2 py-1 rounded">
                    {activeProjects.length} RUNNING
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.map((project) => (
                    <div
                        key={project._id || project.projectId}
                        className="bg-subtle p-5 rounded-xl border border-gray-800 hover:border-peacock-500/30 transition-all group relative overflow-hidden"
                    >
                        {/* Status Pulse */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-peacock-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-peacock-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-peacock-500 uppercase">Live</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h5 className="text-sm font-bold text-white group-hover:text-peacock-400 transition-colors uppercase truncate pr-16" title={project.name}>
                                    {project.name}
                                </h5>
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {project.projectId?.substring(0, 8)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Captures</p>
                                    <h4 className="text-xl font-bold text-white">{project.postCount?.toLocaleString() || 0}</h4>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Platforms</p>
                                    <div className="flex gap-1.5 mt-1.5">
                                        {project.sources?.filter(s => s.status === 'Active').map((s, idx) => (
                                            <div key={idx} className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400" title={s.id || s.platformKey}>
                                                <PlatformIcon platform={s.id || s.platformKey} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-800/50 flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Shield className="w-3 h-3" />
                                    <span className="text-[10px]">Active Watch</span>
                                </div>
                                <button
                                    onClick={() => onViewProject(project)}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-peacock-500 hover:text-peacock-400 transition-colors group"
                                >
                                    OPEN WORKSPACE <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
