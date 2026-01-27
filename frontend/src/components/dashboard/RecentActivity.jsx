import React from 'react';
import { FileText } from 'lucide-react';

const SEVERITY_COLORS = { 'Critical': 'bg-red-500', 'High': 'bg-orange-500', 'Medium': 'bg-blue-500', 'Low': 'bg-green-500', 'Unknown': 'bg-gray-500' };

export default function RecentActivity({ recentPosts }) {
    return (
        <div className="bg-subtle rounded-xl border border-gray-800 flex-1 flex flex-col h-full max-h-[600px]">
            <div className="p-4 border-b border-gray-800 bg-primary/20">
                <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                    <FileText className="w-4 h-4 text-peacock-500" /> Incoming Intel
                </h4>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {recentPosts && recentPosts.length > 0 ? recentPosts.slice(0, 8).map((post, i) => (
                    <div key={i} className="flex gap-3 items-start p-3 rounded bg-gray-900/50 border border-gray-800 hover:border-peacock-500/30 transition-colors group">
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${SEVERITY_COLORS[post.risk] || 'bg-gray-500'}`} aria-label={`Risk Level: ${post.risk}`} />
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
    );
}
