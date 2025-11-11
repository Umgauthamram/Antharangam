// import React from 'react';
// import KpiCard from '/src/components/dashboard/KpiCard.jsx';
// import AlertTable from '/src/components/dashboard/AlertTable.jsx';
// import { AlertTriangle, Briefcase, FileText, Clock } from 'lucide-react';

// const MOCK_ALERTS = [
//   { id: 1, severity: 'High', status: 'New', platform: 'X', content: "Selling illegal items, DM me. #buy #sell", timestamp: "2 mins ago", entities: ["phone", "keyword"] },
//   { id: 2, severity: 'Critical', status: 'New', platform: 'Telegram', content: "Meeting at 5 PM, bring the package. UPI: example@upi", timestamp: "10 mins ago", entities: ["upi", "keyword"] },
//   { id: 3, severity: 'Medium', status: 'New', platform: 'Dark Web', content: "New database for sale, 10 BTC. admin@onion...", timestamp: "45 mins ago", entities: ["crypto", "email"] },
//   { id: 4, severity: 'Low', status: 'In Review', platform: 'X', content: "Just a regular post.", timestamp: "1 hour ago", entities: [] },
//   { id: 5, severity: 'High', status: 'New', platform: 'X', content: "Contact 98XXXXXX10 for details.", timestamp: "2 hours ago", entities: ["phone"] },
// ];

// export default function Dashboard() {
//   const kpiData = [
//     { title: 'New Alerts (24h)', value: MOCK_ALERTS.length, icon: AlertTriangle, color: 'text-red-500' },
//     { title: 'Cases Open', value: 3, icon: Briefcase, color: 'text-blue-500' },
//     { title: 'Evidence Collected', value: 102, icon: FileText, color: 'text-peacock-500' },
//     { title: 'Avg. Triage Time', value: '12m', icon: Clock, color: 'text-yellow-500' },
//   ];

//   return (
//     <div>
//       <h3 className="text-3xl font-medium text-primary">Dashboard</h3>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
//         {kpiData.map((item, index) => (
//           <KpiCard key={index} item={item} />
//         ))}
//       </div>

//       <div className="mt-8">
//         <AlertTable alerts={MOCK_ALERTS} />
//       </div>
//     </div>
//   );
// }

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import AlertTable from '/src/components/dashboard/AlertTable.jsx'; // Make sure this path is correct

// --- Mock Data for Charts & Table ---
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

const MOCK_ALERTS = [
  { id: 1, severity: 'High', status: 'New', platform: 'X', content: "Selling illegal items, DM me. #buy #sell", timestamp: "2 mins ago", entities: ["phone", "keyword"] },
  { id:2, severity: 'Critical', status: 'New', platform: 'Telegram', content: "Meeting at 5 PM, bring the package. UPI: example@upi", timestamp: "10 mins ago", entities: ["upi", "keyword"] },
  { id: 3, severity: 'Medium', status: 'New', platform: 'Dark Web', content: "New database for sale, 10 BTC. admin@onion...", timestamp: "45 mins ago", entities: ["crypto", "email"] },
  { id: 4, severity: 'Low', status: 'In Review', platform: 'X', content: "Just a regular post.", timestamp: "1 hour ago", entities: [] },
  { id: 5, severity: 'High', status: 'New', platform: 'X', content: "Contact 98XXXXXX10 for details.", timestamp: "2 hours ago", entities: ["phone"] },
];

// Colors must match your theme
const SEVERITY_COLORS = {
  'Critical': '#ef4444', // red-500
  'High': '#f97316',     // orange-500
  'Medium': '#3b82f6',    // blue-500
  'Low': '#8b5cf6',      // violet-500
};

const PLATFORM_COLORS = {
  'X (Twitter)': '#0ea5e9', // sky-500
  'Telegram': '#3b82f6',      // blue-500
  'Dark Web': '#4f46e5',      // indigo-600
  'Forums': '#a855f7',      // purple-500
};

// --- Main Component ---
export default function Dashboard() {
  return (
    <div>
      <h3 className="text-3xl font-medium text-primary">Dashboard</h3>
      
      {/* --- Charts Grid --- */}
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
        <AlertTable alerts={MOCK_ALERTS} />
      </div>
    </div>
  );
}

// --- Sub-Components ---

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
  // Custom Tooltip to match theme
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
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          fill="#8884d8"
          paddingAngle={5}
        >
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