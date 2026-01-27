
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Key, User, Shield, Save, Building, Code, Copy, Trash2, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import apiClient from '../../services/apiService';

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
          {/* <TabButton name="Developer API" icon={Code} activeTab={activeTab} setActiveTab={setActiveTab} /> */}
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'profile' && <ProfileSettingsPanel />}
        {activeTab === 'security' && <SecuritySettingsPanel />}
        {activeTab === 'developer api' && <ApiSettingsPanel />}
      </div>
    </div>
  );
}



function ApiSettingsPanel() {
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Key Form State
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', period: 'days', duration: '30', quota: '1000', email: '', allowedPlatforms: ['all'] });

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = () => {
    apiClient.get('/keys')
      .then(res => setKeys(res.data))
      .catch(err => console.error("Failed to fetch keys", err))
      .finally(() => setLoading(false));
  };

  const handleCreateKey = (e) => {
    e.preventDefault();

    // Calculate days based on period
    let expiresInDays = parseInt(form.duration);
    if (form.period === 'months') expiresInDays *= 30;
    if (form.period === 'years') expiresInDays *= 365;

    apiClient.post('/keys', {
      name: form.name,
      expiresInDays: expiresInDays,
      quota: form.quota,
      email: form.email,
      allowedPlatforms: form.allowedPlatforms || ['all']
    })
      .then(res => {
        setNewKey(res.data.key);
        fetchKeys();
        toast.success(res.data.message || "API Key generated successfully!");
        setShowForm(false);
        setForm({ name: '', period: 'days', duration: '30', quota: '1000', email: '', allowedPlatforms: ['all'] });
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to generate key.");
      });
  };

  const handleRevoke = (id) => {
    if (!window.confirm("Are you sure? This action cannot be undone and will immediately block all access using this key.")) return;

    apiClient.delete(`/keys/${id}`)
      .then(() => {
        toast.success("Key revoked.");
        fetchKeys();
      })
      .catch((e) => toast.error("Revocation failed."));
  };

  return (
    <div className="space-y-6">
      <SettingsCard title="Developer API Access">
        <div className="mb-6">
          <p className="text-secondary mb-4 text-sm">
            Generate API keys to programmatically access the Antharangam Threat Intelligence Platform.
            Keep these keys secure.
          </p>

          {newKey && (
            <div className="mb-6 bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-yellow-500 mb-1">Save your Secret Key</h5>
                  <p className="text-xs text-yellow-200/70 mb-2">This is the only time this key will be displayed. If you lose it, you will need to generate a new one.</p>
                  <div className="flex items-center gap-2 bg-black/50 p-2 rounded border border-yellow-900/50">
                    <code className="text-sm font-mono text-white flex-1 truncate">{newKey}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copied to clipboard"); }}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors text-yellow-500"
                      title="Copy Key"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> A copy has been emailed to the recipient.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-peacock-600 hover:bg-peacock-700 text-white rounded-lg text-sm font-bold transition-all"
            >
              <Plus className="w-4 h-4" /> Generate New Key
            </button>
          ) : (
            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700 mb-6">
              <h5 className="text-sm font-bold text-white mb-3">New API Credential</h5>
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Key Name</label>
                    <input required type="text" placeholder="e.g. Mobile App Prod" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-2 bg-black/40 border border-gray-600 rounded text-sm text-white focus:border-peacock-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Recipient Email</label>
                    <input type="email" placeholder="dev@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-2 bg-black/40 border border-gray-600 rounded text-sm text-white focus:border-peacock-500 focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Expiration</label>
                    <div className="flex gap-2">
                      <input type="number" min="1" required value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-20 p-2 bg-black/40 border border-gray-600 rounded text-sm text-white focus:border-peacock-500 focus:outline-none" />
                      <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} className="flex-1 p-2 bg-black/40 border border-gray-600 rounded text-sm text-white focus:border-peacock-500 focus:outline-none">
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Daily Quota (Requests)</label>
                    <input type="number" required value={form.quota} onChange={e => setForm({ ...form, quota: e.target.value })} className="w-full p-2 bg-black/40 border border-gray-600 rounded text-sm text-white focus:border-peacock-500 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase text-gray-500 font-bold mb-2">Platform Scope</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['all', 'twitter', 'facebook', 'github', 'reddit', 'telegram', 'google', 'linkedin'].map(p => (
                      <label key={p} className="flex items-center gap-2 p-2 rounded bg-black/40 border border-gray-600 cursor-pointer hover:bg-gray-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={form.allowedPlatforms ? form.allowedPlatforms.includes(p) : (p === 'all')}
                          onChange={() => {
                            const current = new Set(form.allowedPlatforms || ['all']);
                            if (p === 'all') {
                              setForm({ ...form, allowedPlatforms: ['all'] });
                            } else {
                              if (current.has('all')) current.delete('all');
                              if (current.has(p)) current.delete(p);
                              else current.add(p);
                              setForm({ ...form, allowedPlatforms: Array.from(current).length ? Array.from(current) : ['all'] });
                            }
                          }}
                          className="rounded border-gray-500 text-peacock-500 bg-black focus:ring-0"
                        />
                        <span className="text-xs text-gray-300 capitalize">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-peacock-600 hover:bg-peacock-700 text-white rounded text-xs font-bold">Create & Email Key</button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-primary/50 text-gray-400 uppercase font-mono text-xs border-b border-gray-800">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Expiry</th>
                <th className="p-3">Quota</th>
                <th className="p-3">Last Used</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {keys.map(key => (
                <tr key={key._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3">
                    <div className="font-medium text-white">{key.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{key.prefix}</div>
                  </td>
                  <td className="p-3 text-gray-400 text-xs">
                    {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="p-3 text-gray-400 text-xs text-mono">
                    {key.usage || 0} / {key.quota || '∞'}
                  </td>
                  <td className="p-3 text-gray-400 text-xs">{key.lastUsed ? new Date(key.lastUsed).toLocaleString() : 'Never'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${key.isActive ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'}`}>
                      {key.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {key.isActive && (
                      <button onClick={() => handleRevoke(key._id)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/20 transition-colors" title="Revoke Key">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {keys.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No API keys found. Generate one to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SettingsCard>
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

