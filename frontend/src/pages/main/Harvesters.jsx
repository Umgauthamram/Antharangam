

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, Send, Facebook, Instagram, MessageSquare, ShieldOff, Globe 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import HarvesterCard from '/src/components/harvesters/HarvesterCard.jsx'; // Correct import path

const MOCK_HARVESTER_STATE = [
  { 
    id: 'x', 
    name: 'X (Twitter)', 
    icon: X, 
    status: 'Active', 
    collected: 1247, 
    description: 'Scrapes public posts via snscrape.' 
  },
  { 
    id: 'telegram', 
    name: 'Telegram', 
    icon: Send, 
    status: 'Active', 
    collected: 856,
    description: 'Monitors public channels via telethon.'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: Facebook, 
    status: 'Stopped', 
    collected: 3421,
    description: 'Scrapes public groups via Playwright.'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: Instagram, 
    status: 'Stopped', 
    collected: 1024,
    description: 'Scrapes public profiles via Playwright.'
  },

  { 
    id: 'darkweb', 
    name: 'Dark Web Monitor', 
    icon: ShieldOff, 
    status: 'Stopped', 
    collected: 210,
    description: 'Crawls specific .onion forums via torspy.'
  },
  { 
    id: 'forums', 
    name: 'Public Forums', 
    icon: Globe, 
    status: 'Active', 
    collected: 612,
    description: 'Monitors public classifieds/forums.'
  },
];

// Updated data for the bar chart
const collectionData = [
  { source: 'X', today: 342, week: 1247, month: 5432 },
  { source: 'Telegram', today: 198, week: 856, month: 3241 },
  { source: 'Facebook', today: 0, week: 3421, month: 12384 },
  { source: 'Instagram', today: 0, week: 1024, month: 4096 },
  { source: 'Forums', today: 89, week: 612, month: 2456 },
  { source: 'Dark Web', today: 0, week: 210, month: 840 },
];

// --- Main Component ---
export default function Harvesters() {
  const [harvesters, setHarvesters] = useState(MOCK_HARVESTER_STATE);

  // Logic from your "old" file
  const toggleStatus = (id) => {
    setHarvesters(harvesters.map(h => {
      if (h.id === id) {
        const newStatus = h.status === 'Active' ? 'Stopped' : 'Active';
        toast.success(`${h.name} has been ${newStatus.toLowerCase()}.`);
        return { ...h, status: newStatus };
      }
      return h;
    }));
  };

  // Custom Tooltip to match our theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary p-3 rounded-lg shadow-lg border border-primary">
          <p className="text-sm text-secondary font-bold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.fill }} className="text-sm">
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
        <h1 className="text-3xl font-bold mb-1 text-primary">Harvesters</h1>
        <p className="text-secondary">Manage your data collection sources</p>
      </div>

      {/* Collection Stats Chart */}
      <div className="bg-subtle rounded-lg shadow-lg p-6 border border-primary">
        <h4 className="text-lg font-semibold text-primary mb-4">Collection Statistics</h4>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collectionData}>
              <XAxis dataKey="source" stroke="var(--color-text-secondary)" fontSize={12} />
              <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {/* Using our Peacock theme colors */}
              <Bar dataKey="today" fill="#14b8a6" name="Today" />
              <Bar dataKey="week" fill="#0d9488" name="This Week" /> 
              <Bar dataKey="month" fill="#115e59" name="This Month" /> 
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Harvester Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {harvesters.map((harvester) => (
          <HarvesterCard 
            key={harvester.id}
            icon={harvester.icon}
            name={harvester.name}
            description={harvester.description}
            status={harvester.status}
            collected={harvester.collected}
            onToggle={() => toggleStatus(harvester.id)} 
          />
        ))}
      </div>
    </div>
  );
}