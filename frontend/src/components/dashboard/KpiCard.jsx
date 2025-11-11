import React from 'react';

export default function KpiCard({ item }) {
  return (
    <div className="p-6 bg-subtle rounded-lg shadow-lg">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${item.color} bg-opacity-10`}>
          <item.icon className={`w-6 h-6 ${item.color}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-secondary">{item.title}</p>
          <p className="text-2xl font-semibold text-primary">{item.value}</p>
        </div>
      </div>
    </div>
  );
}