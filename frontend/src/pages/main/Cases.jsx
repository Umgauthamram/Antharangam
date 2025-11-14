import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import CaseTable from '/src/components/cases/CaseTable.jsx'; // Make sure this path is correct
import { Plus, Search, Loader2 } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis 
} from 'recharts';

// --- Mock Data (for table and charts) ---
// We still use MOCK_CASES for the table until we build that API
const MOCK_CASES = [
  { id: "CASE-001", title: "Illegal Arms Sale (X)", status: "Open", assignee: "Investigator A", priority: "High", lastUpdate: "1 day ago" },
  { id: "CASE-002", title: "UPI Fraud Ring (Telegram)", status: "Open", assignee: "Investigator B", priority: "Critical", lastUpdate: "4 hours ago" },
];

const priorityData = [
  { name: 'Critical', value: 8, color: '#ef4444' }, // red-500
  { name: 'High', value: 12, color: '#f97316' },     // orange-500
  { name: 'Medium', value: 15, color: '#3b82f6' },    // blue-500
  { name: 'Low', value: 6, color: '#6b7280' },      // gray-500
];

const monthlyData = [
  { month: 'Jan', opened: 12, closed: 8 },
  { month: 'Feb', opened: 15, closed: 10 },
  { month: 'Mar', opened: 18, closed: 14 },
];

// --- Main Component ---
export default function Cases() {
  const [keyword, setKeyword] = useState(''); // State for the input field
  const [isStriking, setIsStriking] = useState(false); // State for loading spinner

  // --- NEW: Handle Live Strike ---
  const handleLiveStrike = async () => {
    if (!keyword) {
      toast.error('Please enter a keyword to run a strike.');
      return;
    }

    setIsStriking(true);
    toast('Sending scrape job to backend...', { icon: '🚀' });

    try {
      // This calls the '/api/strike/twitter' endpoint we built
      const response = await fetch('http://localhost:5001/api/strike/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword,
          limit: 50 // We can set the scrape limit here
        }),
      });

      const result = await response.json();

      if (response.status === 202) { // "Accepted"
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Failed to start job.');
      }

    } catch (error) {
      console.error("Error running strike:", error);
      toast.error('Failed to connect to backend.');
    } finally {
      setIsStriking(false);
      setKeyword(''); // Clear the input
    }
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
      <div>
        <h1 className="text-3xl font-bold mb-1 text-primary">Cases</h1>
        <p className="text-secondary">Manage your active investigations</p>
      </div>

      {/* 2-Column Graph Grid (Your new layout) */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Card 1: Priority Pie Chart */}
        <div className="bg-subtle rounded-lg shadow-lg p-6 border border-primary">
          <h4 className="text-lg font-semibold text-primary mb-4">Cases by Priority</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
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
                <Bar dataKey="opened" fill="#0d9488" name="Opened" /> {/* Peacock-600 */}
                <Bar dataKey="closed" fill="#6b7280" name="Closed" /> {/* Gray-500 */}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- NEW: Live Strike Feature --- */}
      <div className="bg-subtle rounded-lg shadow-lg p-6 border border-primary">
        <h4 className="text-lg font-semibold text-primary">Create Case & Run Live Strike (Twitter)</h4>
        <p className="text-secondary mt-2 mb-4">
          Enter a keyword to create a new case and immediately scrape the 50 most recent posts from X.
        </p>
        <div className="flex w-full max-w-lg">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder='e.g., "Red Fort" or "#threat"'
            className="flex-1 p-3 text-primary bg-primary border border-primary rounded-l-md focus:outline-none focus:border-peacock-500"
          />
          <button 
            onClick={handleLiveStrike}
            disabled={isStriking}
            className="flex items-center justify-center w-40 px-4 py-3 font-medium text-white capitalize transition-colors duration-300 transform bg-peacock-600 rounded-r-md hover:bg-peacock-500 focus:outline-none focus:ring focus:ring-peacock-300 focus:ring-opacity-80"
          >
            {isStriking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Run Strike
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full-Width Case Table */}
      <CaseTable cases={MOCK_CASES} />
    </div>
  );
}