import React from 'react';
import { Search } from 'lucide-react';

export default function DashboardHeader() {
    return (
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h2>
                <p className="text-gray-400 text-sm mt-1">
                    Welcome back, <span className="text-peacock-400 font-bold">Investigator</span>. Here is your operational status.
                </p>
            </div>

            <div className="w-full md:w-auto relative">
                {/* Global Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-peacock-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search cases, entities, or IDs..."
                        className="w-full md:w-64 pl-9 pr-4 py-2 bg-black/20 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-peacock-500 focus:ring-1 focus:ring-peacock-500/50 transition-all placeholder:text-gray-600"
                        aria-label="Global Search"
                    />
                    <div className="absolute right-2 top-2 p-0.5 px-1.5 rounded bg-gray-800 border border-gray-700 text-[10px] text-gray-400 font-mono hidden md:block">
                        CTRL+K
                    </div>
                </div>
            </div>
        </div>
    );
}
