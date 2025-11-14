import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import AlertTable from '/src/components/dashboard/AlertTable.jsx'; 
import { toast } from 'react-hot-toast';

const alertSeverityData = [
  { name: 'Critical', value: 12 },
  { name: 'High', value: 38 },
  { name: 'Medium', value: 89 },
  { name: 'Low', value: 140 },
];
const alertPlatformData = [
  { name: 'X (Twitter)', value: 94 },
  { name: 'Telegram', value: 121 },
  { name: 'Dark Web', value: 18 },
  { name: 'Forums', value: 46 },
];

const SEVERITY_COLORS = { 'Critical': '#ef4444', 'High': '#f97316', 'Medium': '#3b82f6', 'Low': '#8b5cf6' };
const PLATFORM_COLORS = { 'X (Twitter)': '#0ea5e9', 'Telegram': '#3b82f6', 'Dark Web': '#4f46e5', 'Forums': '#a855f7' };


// --- Main Component ---
export default function Dashboard() {
  const [alerts, setAlerts] = useState([]); // Start with an empty array
  const [isLoading, setIsLoading] = useState(true);

  // --- NEW: Live Data Fetching ---
  useEffect(() => {
    setIsLoading(true);
    fetch('http://localhost:5001/api/alerts')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // --- THIS IS THE FIX ---
        // The new Node.js backend sends simple JSON, not BSON
        const formattedData = data.map(alert => ({
          ...alert,
          // Convert the simple ISO string to a readable date
          timestamp: new Date(alert.timestamp).toLocaleString(),
          // Use 'New' as default if 'severity' isn't set
          severity: alert.severity || 'New',
          // The ID is now just _id, not _id.$oid
          id: alert._id 
        }));
        // --- END OF FIX ---
        
        setAlerts(formattedData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching alerts:", error);
        toast.error("Failed to connect to backend. Is it running?");
        setIsLoading(false);
      });
  }, []); 

  return (
    <div>
    
    
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ChartCard title="Alerts by Severity">
          <DonutChart data={alertSeverityData} colors={SEVERITY_COLORS} />
        </ChartCard>
        
        <ChartCard title="Alerts by Platform">
          <DonutChart data={alertPlatformData} colors={PLATFORM_COLORS} />
        </ChartCard>
      </div>

      {/* --- Recent Alerts Table --- */}
      <div className="mt-8">
        {/* We pass the LIVE data and loading state to the AlertTable */}
        <AlertTable alerts={alerts} isLoading={isLoading} />
      </div>
    </div>
  );
}

// --- Sub-Components (ChartCard, DonutChart) ---
// (These are unchanged)
function ChartCard({ title, children }) {
  return (
    <div className="bg-subtle rounded-lg shadow-lg p-6 border border-primary">
      <h4 className="text-lg font-semibold text-primary mb-4">{title}</h4>
      <div className="h-64 w-full">
        {children}
      </div>
    </div>
  );
}

function DonutChart({ data, colors }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary p-3 rounded-lg shadow-lg border border-primary">
          <p className="text-sm text-secondary">{`${payload[0].name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" paddingAngle={5}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[entry.name]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}