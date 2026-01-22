import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CriticalSpotlight({ criticalCases, onViewProject }) {
    if (!criticalCases || criticalCases.length === 0) {
        return (
            <div className="bg-subtle rounded-xl p-6 border border-gray-800 shadow-sm relative overflow-hidden h-full flex flex-col justify-center items-center text-center">
                <ShieldAlert className="w-12 h-12 text-gray-700 mb-2" />
                <h4 className="text-gray-400 font-bold">No Critical Threats</h4>
                <p className="text-xs text-gray-500">System is clear of high-risk vulnerabilities.</p>
            </div>
        );
    }

    return (
        <div className="bg-subtle rounded-xl p-6 border border-gray-800 shadow-sm relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                        <ShieldAlert className="w-5 h-5 text-red-500" /> Critical Case Spotlight
                    </h4>
                    <p className="text-xs text-secondary mt-1">Cases with the highest volume of identified vulnerabilities.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center h-[calc(100%-4rem)]">
                {/* Chart */}
                <div className="h-[200px] w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={criticalCases} layout="vertical" margin={{ left: 0, right: 20 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#fff' }} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} cursor={{ fill: '#ffffff10' }} />
                            <Bar dataKey="highRiskCount" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} name="High Risk Items" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* List Actions */}
                <div className="w-full md:w-1/2 space-y-3 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                    {criticalCases.map((c, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-red-500/30 transition-all group">
                            <div className="min-w-0 flex-1 mr-3">
                                <h5 className="text-sm font-bold text-white truncate" title={c.name}>{c.name}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-gray-500 font-mono">ID: {c.projectId?.substr(0, 6)}</span>
                                    <span className="text-[10px] font-bold text-red-500 bg-red-900/10 px-1.5 rounded">{c.highRiskCount} THREATS</span>
                                </div>
                            </div>
                            <button
                                onClick={() => onViewProject(c)}
                                className="text-[10px] bg-white text-black font-bold px-3 py-1.5 rounded hover:bg-gray-200 transition-colors shrink-0"
                                aria-label={`Inspect case ${c.name}`}
                            >
                                INSPECT
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
