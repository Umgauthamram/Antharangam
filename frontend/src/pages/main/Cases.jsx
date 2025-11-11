import React from 'react';
import { toast } from 'react-hot-toast'; // Using react-hot-toast
import CaseTable from '/src/components/cases/CaseTable.jsx'; // Make sure this path is correct
import { Plus, Briefcase } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis 
} from 'recharts';

// --- Mock Data ---
// Our existing MOCK_CASES data to pass to the table
const MOCK_CASES = [
  { id: "CASE-001", title: "Illegal Arms Sale (X)", status: "Open", assignee: "Investigator A", priority: "High", lastUpdate: "1 day ago" },
  { id: "CASE-002", title: "UPI Fraud Ring (Telegram)", status: "Open", assignee: "Investigator B", priority: "Critical", lastUpdate: "4 hours ago" },
  { id: "CASE-003", title: "Data Breach Sale (Dark Web)", status: "In Review", assignee: "Investigator A", priority: "High", lastUpdate: "2 days ago" },
  { id: "CASE-004", title: "Phishing Campaign", status: "Closed", assignee: "Investigator B", priority: "Medium", lastUpdate: "5 days ago" },
  { id: "CASE-005", title: "New Fraud Scheme", status: "Open", assignee: "Investigator A", priority: "Medium", lastUpdate: "1 day ago" },
];

// Data from your new example, but with OUR colors
const priorityData = [
  { name: 'Critical', value: 8, color: '#ef4444' }, // red-500
  { name: 'High', value: 12, color: '#f97316' },     // orange-500
  { name: 'Medium', value: 15, color: '#3b82f6' },    // blue-500
  { name: 'Low', value: 6, color: '#00d67dff' },      // gray-500
];

// Data from your new example
const monthlyData = [
  { month: 'Jan', opened: 12, closed: 8 },
  { month: 'Feb', opened: 15, closed: 10 },
  { month: 'Mar', opened: 18, closed: 14 },
  { month: 'Apr', opened: 22, closed: 16 },
  { month: 'May', opened: 19, closed: 20 },
  { month: 'Jun', opened: 24, closed: 18 },
];

// --- Main Component ---
export default function Cases() {
  const handleCreateCase = () => {
    toast.success('Creating new case...');
  };

  // Custom Tooltip to match our theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary p-3 rounded-lg shadow-lg border border-primary">
          <p className="text-sm text-secondary font-bold mb-1">{label || payload[0].name}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
              {`${entry.name} : ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-primary">Cases</h1>
          <p className="text-secondary">Manage your active investigations</p>
        </div>
        <button 
          onClick={handleCreateCase} 
          className="flex items-center px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none focus:ring focus:ring-peacock-300 focus:ring-opacity-80"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Case
        </button>
      </div>

      {/* 2-Column Graph Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Card 1: Priority Pie Chart */}
        <div className="bg-subtle rounded-lg shadow-lg p-6 border border-primary">
          <h4 className="text-lg font-semibold text-primary mb-4">Cases by Priority</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Monthly Bar Chart */}
        <div className="bg-subtle rounded-lg shadow-lg p-6 border border-primary">
          <h4 className="text-lg font-semibold text-primary mb-4">Monthly Case Activity</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" stroke="var(--color-text-secondary)" fontSize={12} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar cla dataKey="opened" fill="#0d9488" name="Opened" /> 
                <Bar dataKey="closed" fill="#4f89ffff" name="Closed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <CaseTable cases={MOCK_CASES} />
    </div>
  );
}