import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Settings, FileText, Key, Shield } from 'lucide-react';

export default function QuickActions() {
    const navigate = useNavigate();

    const actions = [
        { label: 'New Analysis', icon: Plus, path: '/case', color: 'peacock' },
        { label: 'View Reports', icon: FileText, path: '/reports', color: 'blue' }, // Assuming /reports exists or placeholder
        { label: 'API Keys', icon: Key, path: '/settings', color: 'purple' }, // Direct link to settings for API
        { label: 'System Settings', icon: Settings, path: '/settings', color: 'gray' },
    ];

    return (
        <div className="bg-subtle rounded-xl p-6 border border-gray-800 h-full flex flex-col justify-center">
            <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Shield className="w-4 h-4 text-peacock-500" /> Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={() => navigate(action.path)}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border border-gray-800 bg-gray-900/50 hover:bg-white/5 hover:border-${action.color}-500/50 transition-all group`}
                        aria-label={action.label}
                    >
                        <action.icon className={`w-6 h-6 mb-2 text-gray-400 group-hover:text-${action.color}-400 transition-colors`} />
                        <span className="text-xs font-bold text-gray-300 group-hover:text-white">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
