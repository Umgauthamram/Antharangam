import React from 'react';
import { AlertTriangle, Search, Activity, Server, Clock } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, trend, color, isHealth }) => (
    <div className={`bg-subtle p-5 rounded-xl relative overflow-hidden group transition-all border border-gray-800 hover:border-${color}-500/50 flex-1`}>
        {isHealth ? (
            // System Health Variant
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-${color}-900/20`}>
                    <Icon className={`w-6 h-6 text-${color}-500`} />
                </div>
                <div>
                    <p className="text-secondary text-[10px] uppercase tracking-wider font-bold">{title}</p>
                    <h3 className="text-lg font-bold text-primary mt-0.5">{value}</h3>
                    <p className="text-[10px] text-gray-500">{subtext}</p>
                </div>
            </div>
        ) : (
            // Standard KPI Variant
            <>
                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
                    <Icon className={`w-16 h-16 text-${color}-500`} />
                </div>
                <div className="relative z-10">
                    <p className="text-secondary text-xs uppercase tracking-wider font-bold">{title}</p>
                    <h3 className="text-2xl font-bold text-primary mt-1">{value}</h3>
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                        {trend && <span className="text-green-500 mr-1">▲ {trend}%</span>}
                        {subtext}
                    </p>
                </div>
            </>
        )}
    </div>
);

export default function StatCards({ data }) {
    // Mock Health Data for now - in production this would come from a real health check endpoint
    const healthData = {
        latency: '45ms',
        dbStatus: 'Connected',
        uptime: '99.9%'
    };

    const riskCount = data.riskStats?.reduce((acc, curr) => curr.name !== 'Low' ? acc + curr.value : acc, 0) || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {/* KPI Cards */}
            <StatCard
                title="Active Investigations"
                value={data.automated?.length || 0}
                subtext="Ongoing Cases"
                icon={Search}
                color="peacock"
            />

            <StatCard
                title="Threats Flagged"
                value={riskCount}
                subtext="Med/High Risks"
                icon={AlertTriangle}
                trend={5}
                color="red"
            />

            {/* System Health Cards */}
            <StatCard
                title="System Latency"
                value={healthData.latency}
                subtext="Optimal Performance"
                icon={Activity}
                color="green"
                isHealth={true}
            />

        </div>
    );
}
