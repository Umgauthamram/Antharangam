

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Key, Users, Eye, Edit, Trash2, Save, Moon, Sun, Settings as SettingsIcon, Bell, FileText, Activity, Server, Shield } from 'lucide-react';
import { useDarkMode } from '/src/hooks/useDarkMode.js'; 

const MOCK_USERS = [
  { id: 1, name: "Investigator A", role: "Admin", email: "admin@offence.click", lastLogin: "1h ago" },
  { id: 2, name: "Investigator B", role: "Investigator", email: "user@offence.click", lastLogin: "5m ago" },
  { id: 3, name: "Analyst C", role: "Analyst", email: "analyst@offence.click", lastLogin: "3h ago" },
];

const MOCK_AUDIT_LOG = [
  { id: 1, user: "Investigator B", action: "Created Case: CASE-005", ip: "10.1.1.2", timestamp: "5m ago" },
  { id: 2, user: "Investigator A", action: "Logged In", ip: "192.168.1.1", timestamp: "1h ago" },
  { id: 3, user: "Investigator A", action: "Stopped Harvester: 'darkweb'", ip: "192.168.1.1", timestamp: "1h ago" },
  { id: 4, user: "System", action: "Detected Critical Alert: #A-1024", ip: "127.0.0.1", timestamp: "2h ago" },
  { id: 5, user: "Analyst C", action: "Viewed Evidence: E-00123", ip: "10.1.1.5", timestamp: "3h ago" },
];

const MOCK_SYSTEM_STATUS = [
  { name: 'MongoDB', status: 'Online' },
  { name: 'RabbitMQ (Queue)', status: 'Online' },
  { name: 'Elasticsearch', status: 'Online' },
  { name: 'Harvester Service', status: 'Online' },
  { name: 'API Server', status: 'Online' },
];

// --- Main Component ---
export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div>
      <h3 className="text-3xl font-medium text-primary">Settings</h3>

      {/* Tab Navigation */}
      <div className="mt-8 border-b border-primary">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          <TabButton name="General" icon={SettingsIcon} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton name="Security" icon={Shield} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton name="Connectors" icon={Key} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton name="Alerting" icon={Bell} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton name="Data & Export" icon={FileText} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton name="Audit Log" icon={Activity} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton name="System Status" icon={Server} activeTab={activeTab} setActiveTab={setActiveTab} />
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'general' && <GeneralSettingsPanel />}
        {activeTab === 'security' && <SecuritySettingsPanel />}
        {activeTab === 'connectors' && <ApiSettingsPanel />}
        {activeTab === 'alerting' && <AlertingSettingsPanel />}
        {activeTab === 'data & export' && <DataSettingsPanel />}
        {activeTab === 'audit log' && <AuditLogPanel />}
        {activeTab === 'system status' && <SystemStatusPanel />}
      </div>
    </div>
  );
}

// --- Tab Components ---

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

// --- Panels for each Tab ---

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

function SecuritySettingsPanel() {
  const handleUserAction = (action, userName) => {
    toast(`${action} user: ${userName} (demo)`);
  };

  return (
    <SettingsCard title="Security & User Management">
       <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary">
          <thead className="bg-primary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-subtle divide-y divide-primary">
            {MOCK_USERS.map((user) => (
              <tr key={user.id} className="hover:bg-primary">
                <td className="px-6 py-4 text-sm font-medium text-primary">{user.name}</td>
                <td className="px-6 py-4 text-sm text-secondary">{user.email}</td>
                <td className="px-6 py-4 text-sm text-secondary">{user.role}</td>
                <td className="px-6 py-4 text-sm text-secondary">{user.lastLogin}</td>
                <td className="px-6 py-4 text-sm">
                  <button onClick={() => handleUserAction('View', user.name)} className="text-peacock-500 hover:text-peacock-700 p-1">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleUserAction('Edit', user.name)} className="text-blue-500 hover:text-blue-700 p-1 ml-2">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleUserAction('Delete', user.name)} className="text-red-500 hover:text-red-700 p-1 ml-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsCard>
  );
}

function ApiSettingsPanel() {
  const handleApiSave = (service) => {
    toast.success(`${service} API key saved successfully!`);
  };
  return (
    <SettingsCard title="API Keys & Connectors">
      <div className="space-y-6">
        <div>
          <label htmlFor="pinataKey" className="block text-sm font-medium text-secondary mb-1">
            Pinata (IPFS) API Key
          </label>
          <div className="flex">
            <input type="password" id="pinataKey" defaultValue="••••••••••••••••••••" className="flex-1 p-2 text-primary bg-primary border border-primary rounded-l-md focus:outline-none focus:border-peacock-500"/>
            <button onClick={() => handleApiSave('Pinata')} className="flex items-center px-4 bg-peacock-600 text-white rounded-r-md hover:bg-peacock-500">
              <Save className="w-4 h-4 mr-2" /> Save
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="alchemyKey" className="block text-sm font-medium text-secondary mb-1">
            Alchemy (Blockchain Node) API Key
          </label>
          <div className="flex">
            <input type="password" id="alchemyKey" defaultValue="••••••••••••••••••••" className="flex-1 p-2 text-primary bg-primary border border-primary rounded-l-md focus:outline-none focus:border-peacock-500"/>
            <button onClick={() => handleApiSave('Alchemy')} className="flex items-center px-4 bg-peacock-600 text-white rounded-r-md hover:bg-peacock-500">
              <Save className="w-4 h-4 mr-2" /> Save
            </button>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

function AlertingSettingsPanel() {
  return (
    <SettingsCard title="Alerting & Notifications">
      <div className="space-y-4">
        <p className="text-sm text-secondary">Notify me for new alerts with severity:</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center"><input type="checkbox" defaultChecked className="h-4 w-4 text-peacock-600 border-primary rounded focus:ring-peacock-500"/> <span className="ml-2 text-primary">Critical</span></label>
          <label className="flex items-center"><input type="checkbox" defaultChecked className="h-4 w-4 text-peacock-600 border-primary rounded focus:ring-peacock-500"/> <span className="ml-2 text-primary">High</span></label>
          <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-peacock-600 border-primary rounded focus:ring-peacock-500"/> <span className="ml-2 text-primary">Medium</span></label>
        </div>
        <hr className="border-primary"/>
        <p className="text-sm text-secondary">Notification Channels:</p>
        <div className="space-y-2">
          <label className="flex items-center"><input type="checkbox" defaultChecked className="h-4 w-4 text-peacock-600 border-primary rounded focus:ring-peacock-500"/> <span className="ml-2 text-primary">In-App Notification</span></label>
          <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-peacock-600 border-primary rounded focus:ring-peacock-500"/> <span className="ml-2 text-primary">Send Email</span></label>
        </div>
      </div>
    </SettingsCard>
  );
}

function DataSettingsPanel() {
  return (
    <SettingsCard title="Data & Export Settings">
      <div className="space-y-4">
        <div>
          <label htmlFor="retention" className="block text-sm font-medium text-secondary mb-1">
            Data Retention Policy
          </label>
          <select id="retention" className="w-full md:w-1/2 p-2 text-primary bg-primary border border-primary rounded-md focus:outline-none focus:border-peacock-500">
            <option>Delete non-cased evidence after 30 days</option>
            <option>Delete non-cased evidence after 90 days</option>
            <option>Keep all evidence indefinitely</option>
          </select>
          [cite_start]<p className="text-xs text-secondary mt-1">Set how long to keep raw data that is not part of a formal case. (Legal Requirement) [cite: 114, 115, 151]</p>
        </div>
        <hr className="border-primary"/>
        <div>
          <label htmlFor="exportFormat" className="block text-sm font-medium text-secondary mb-1">
            Default Export Format
          </label>
          <select id="exportFormat" className="w-full md:w-1/2 p-2 text-primary bg-primary border border-primary rounded-md focus:outline-none focus:border-peacock-500">
            [cite_start]<option>PDF Report [cite: 112]</option>
            [cite_start]<option>Encrypted ZIP (with JSON, media, and logs) [cite: 26, 104-111]</option>
            <option>CSV Summary</option>
          </select>
        </div>
      </div>
    </SettingsCard>
  );
}

function AuditLogPanel() {
  return (
    <SettingsCard title="System Audit Log (Chain of Custody)">
      [cite_start]<p className="text-sm text-secondary mb-4">Read-only log of all significant actions taken by users and the system. [cite: 111, 115, 116, 151, 185]</p>
      <div className="overflow-y-auto h-96 border border-primary rounded-lg">
        <table className="min-w-full divide-y divide-primary">
          <thead className="bg-primary sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Timestamp</th>
            </tr>
          </thead>
          <tbody className="bg-subtle divide-y divide-primary">
            {MOCK_AUDIT_LOG.map((log) => (
              <tr key={log.id} className="hover:bg-primary">
                <td className="px-6 py-4 text-sm font-medium text-primary">{log.user}</td>
                <td className="px-6 py-4 text-sm text-primary">{log.action}</td>
                <td className="px-6 py-4 text-sm text-secondary">{log.ip}</td>
                <td className="px-6 py-4 text-sm text-secondary">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsCard>
  );
}

function SystemStatusPanel() {
  return (
    <SettingsCard title="System & Service Status">
      <ul className="divide-y divide-primary">
        {MOCK_SYSTEM_STATUS.map((service) => (
          <li key={service.name} className="flex justify-between items-center py-3">
            <span className="text-md font-medium text-primary">{service.name}</span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              service.status === 'Online' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {service.status}
            </span>
          </li>
        ))}
      </ul>
    </SettingsCard>
  );
}