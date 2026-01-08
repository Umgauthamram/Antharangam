import React, { useState } from 'react';
import { ShieldCheck, Key, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState('login');
  const [tempEmail, setTempEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Regex: 8+ chars, 1 uppercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Login failed');

      if (data.mustChangePassword) {
        setTempEmail(email);
        setView('change-password');
        toast('Security Requirement: Please update your password.', { icon: '🔒' });
      } else {
        completeLogin(data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (!passwordRegex.test(newPassword)) {
      toast.error("Password too weak. Must be 8+ chars, uppercase, lowercase, number & special char.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tempEmail, newPassword })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Update failed');

      completeLogin(data);
      toast.success("Password updated!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = (data) => {
    sessionStorage.setItem('user_email', data.email);
    sessionStorage.setItem('token', data.token);
    toast.success("Secure session established.");
    navigate('/dashboard');
  };

  if (view === 'change-password') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-subtle">
        <div className="w-full max-w-md p-8 space-y-8 bg-primary rounded-xl shadow-2xl border border-primary border-yellow-500/50">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-yellow-500" />
            <h2 className="mt-4 text-2xl font-bold text-primary">Setup Password</h2>
            <p className="mt-2 text-sm text-secondary">This is a new account. Please set a secure password.</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div className="relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-secondary" />
                <input
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-10 py-3 border border-primary rounded-lg bg-subtle text-primary focus:border-peacock-500 focus:outline-none"
                  placeholder="New Password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-secondary hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-secondary" />
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-10 py-3 border border-primary rounded-lg bg-subtle text-primary focus:border-peacock-500 focus:outline-none"
                  placeholder="Confirm Password"
                />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-peacock-600 hover:bg-peacock-700 text-white rounded-lg font-bold transition-colors">
              {isLoading ? 'Updating...' : 'Set Password & Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-subtle">
      <div className="w-full max-w-md p-8 space-y-8 bg-primary rounded-xl shadow-2xl border border-primary">
        <div className="text-center">
          <div className="flex justify-center">
            <ShieldCheck className="w-16 h-16 text-peacock-600" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-primary">Antharangam</h2>
          <p className="mt-2 text-sm text-secondary">Decentralized Intelligence Platform</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
              <label htmlFor="email" className="sr-only">Email address</label>
              <Mail className="absolute left-3 top-3 h-5 w-5 text-secondary" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-10 py-3 border border-primary placeholder-gray-500 text-primary rounded-lg focus:outline-none focus:ring-peacock-500 focus:border-peacock-500 focus:z-10 sm:text-sm bg-subtle"
                placeholder="Investigator Email"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <Key className="absolute left-3 top-3 h-5 w-5 text-secondary" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-10 py-3 border border-primary placeholder-gray-500 text-primary rounded-lg focus:outline-none focus:ring-peacock-500 focus:border-peacock-500 focus:z-10 sm:text-sm bg-subtle"
                placeholder="Secure Password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-secondary hover:text-white transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${isLoading ? 'bg-peacock-400' : 'bg-peacock-600 hover:bg-peacock-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-peacock-500 transition-colors duration-200`}
            >
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-secondary">
            Need access?{' '}
            <button onClick={() => navigate('/signup')} className="font-medium text-peacock-600 hover:text-peacock-500">
              Request Investigator Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}