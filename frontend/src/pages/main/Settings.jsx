
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Key, User, Shield, Save, Building } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div>
      <h3 className="text-3xl font-medium text-primary">Settings</h3>

      {/* Tab Navigation */}
      <div className="mt-8 border-b border-primary">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          <TabButton name="Profile" icon={User} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton name="Security" icon={Shield} activeTab={activeTab} setActiveTab={setActiveTab} />
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'profile' && <ProfileSettingsPanel />}
        {activeTab === 'security' && <SecuritySettingsPanel />}
      </div>
    </div>
  );
}

function TabButton({ name, icon: Icon, activeTab, setActiveTab }) {
  const isActive = activeTab === name.toLowerCase();
  return (
    <button
      onClick={() => setActiveTab(name.toLowerCase())}
      className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
        ${isActive
          ? 'border-peacock-500 text-peacock-500'
          : 'border-transparent text-secondary hover:text-primary hover:border-gray-500'
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

function ProfileSettingsPanel() {
  const [profile, setProfile] = useState({
    name: localStorage.getItem('user_name') || 'Investigator',
    email: localStorage.getItem('user_email') || 'user@agency.gov.in',
    department: localStorage.getItem('user_dept') || '',
    designation: localStorage.getItem('user_role') || 'Senior Analyst'
  });

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('user_name', profile.name);
    localStorage.setItem('user_email', profile.email);
    localStorage.setItem('user_dept', profile.department);
    localStorage.setItem('user_role', profile.designation);
    toast.success("Profile updated successfully.");
  };

  return (
    <SettingsCard title="Officer Profile">
      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg border bg-primary border-primary focus:border-peacock-500 focus:outline-none text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Designation</label>
            <input
              type="text"
              name="designation"
              value={profile.designation}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg border bg-primary border-primary focus:border-peacock-500 focus:outline-none text-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Official Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            disabled
            className="w-full p-2.5 rounded-lg border bg-primary border-primary opacity-50 cursor-not-allowed text-primary"
          />
          <p className="text-xs text-gray-500 mt-1">Contact IT admin to change registered email.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">State Police Department / Agency</label>
          <div className="relative">
            <Building className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="department"
              value={profile.department}
              onChange={handleChange}
              placeholder="e.g. Karnataka State Police - Cyber Crime Division"
              className="w-full p-2.5 pl-10 rounded-lg border bg-primary border-primary focus:border-peacock-500 focus:outline-none text-primary"
            />
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" className="flex items-center px-4 py-2 bg-peacock-600 hover:bg-peacock-700 text-white rounded-lg font-medium transition-colors">
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}

function SecuritySettingsPanel() {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Password updated successfully.");
    e.target.reset();
  };

  return (
    <SettingsCard title="Security & Authentication">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Current Password</label>
          <div className="relative">
            <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="password" required className="w-full p-2.5 pl-9 rounded-lg border bg-primary border-primary focus:border-peacock-500 focus:outline-none text-primary" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">New Password</label>
          <div className="relative">
            <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="password" required className="w-full p-2.5 pl-9 rounded-lg border bg-primary border-primary focus:border-peacock-500 focus:outline-none text-primary" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Confirm New Password</label>
          <div className="relative">
            <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="password" required className="w-full p-2.5 pl-9 rounded-lg border bg-primary border-primary focus:border-peacock-500 focus:outline-none text-primary" />
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" className="flex items-center px-4 py-2 bg-peacock-600 hover:bg-peacock-700 text-white rounded-lg font-medium transition-colors">
            <Shield className="w-4 h-4 mr-2" /> Update Password
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}

