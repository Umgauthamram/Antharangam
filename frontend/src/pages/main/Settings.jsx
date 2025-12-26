

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Key, Users, Eye, Edit, Trash2, Save, Moon, Sun, Settings as SettingsIcon, Bell, FileText, Activity, Server, Shield } from 'lucide-react';
import { useDarkMode } from '/src/hooks/useDarkMode.js'; 


 

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div>
      <h3 className="text-3xl font-medium text-primary">Settings</h3>

      {/* Tab Navigation */}
      <div className="mt-8 border-b border-primary">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          <TabButton name="General" icon={SettingsIcon} activeTab={activeTab} setActiveTab={setActiveTab} />

        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'general' && <GeneralSettingsPanel />}
      
      </div>
    </div>
  );
}


function TabButton({ name, icon: Icon, activeTab, setActiveTab }) {
  const isActive = activeTab === name.toLowerCase();
  return (
    <button
      onClick={() => setActiveTab(name.toLowerCase())}
      className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 whitespace-nowrap
        ${isActive
          ? 'border-peacock-500 text-peacock-500'
          : 'border-transparent text-secondary hover:text-primary hover:border-gray-300'
        }
      `}
    >
      <Icon className="w-5 h-5 mr-2" />
      {name}
    </button>
  );
}

function SettingsCard({ title, children }) {
  return (
    <div className="bg-subtle rounded-lg shadow-lg overflow-hidden border border-primary">
      <div className="p-6 border-b border-primary">
        <h4 className="text-lg font-semibold text-primary">{title}</h4>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}


function GeneralSettingsPanel() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  return (
    <SettingsCard title="General Preferences">
      <h5 className="text-md font-medium text-primary mb-2">Theme</h5>
      <p className="text-sm text-secondary mb-4">Choose your preferred interface theme.</p>
      <div className="flex rounded-lg border border-primary p-1 max-w-xs">
        <button
          onClick={() => isDarkMode && toggleDarkMode()}
          className={`w-1/2 flex items-center justify-center p-2 rounded-md ${
            !isDarkMode ? 'bg-peacock-600 text-white' : 'text-secondary'
          }`}
        >
          <Sun className="w-5 h-5 mr-2" /> Light
        </button>
        <button
          onClick={() => !isDarkMode && toggleDarkMode()}
          className={`w-1/2 flex items-center justify-center p-2 rounded-md ${
            isDarkMode ? 'bg-peacock-600 text-white' : 'text-secondary'
          }`}
        >
          <Moon className="w-5 h-5 mr-2" /> Dark
        </button>
      </div>
    </SettingsCard>
  );
}

