import React, { useState } from 'react';
import { ShieldCheck, Key, Mail, Eye, EyeOff, ArrowRight, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
      <div className="flex items-center justify-center min-h-screen bg-[#050608] relative overflow-hidden font-sans selection:bg-peacock-500/30">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-peacock-900/20 via-slate-900 to-black pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 relative z-10"
        >
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="text-center mb-10">
              <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-yellow-500/30">
                <Lock className="h-8 w-8 text-yellow-500" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Setup Password</h2>
              <p className="mt-3 text-slate-400">Secure your new account to continue.</p>
            </div>

            <form className="space-y-6" onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div className="relative group/input">
                  <Key className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within/input:text-yellow-500 transition-colors" />
                  <input
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-yellow-500/50 focus:bg-white/10 focus:ring-4 focus:ring-yellow-500/10 transition-all outline-none"
                    placeholder="New Password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="relative group/input">
                  <Key className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within/input:text-yellow-500 transition-colors" />
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-yellow-500/50 focus:bg-white/10 focus:ring-4 focus:ring-yellow-500/10 transition-all outline-none"
                    placeholder="Confirm Password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white rounded-xl font-bold shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? 'Updating...' : 'Set Password & Login'}
                {!isLoading && <ArrowRight size={20} />}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050608] relative overflow-hidden font-sans selection:bg-peacock-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-peacock-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-6 relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-12 relative overflow-hidden group">
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="text-center mb-10">
           
            <h2 className="text-4xl font-black text-white tracking-tight">Antharangam</h2>
            <p className="mt-3 text-slate-400 font-medium tracking-wide">Decentralized Intelligence</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="relative group/input">
                <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within/input:text-peacock-400 transition-colors" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-peacock-500/50 focus:bg-white/10 focus:ring-4 focus:ring-peacock-500/10 transition-all outline-none"
                  placeholder="Investigator Email"
                />
              </div>
              <div className="relative group/input">
                <Key className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within/input:text-peacock-400 transition-colors" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-peacock-500/50 focus:bg-white/10 focus:ring-4 focus:ring-peacock-500/10 transition-all outline-none"
                  placeholder="Secure Password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex items-center justify-center py-4 px-4 border border-transparent text-base font-bold rounded-xl text-white ${isLoading ? 'bg-peacock-800' : 'bg-gradient-to-r from-peacock-600 to-peacock-500 hover:from-peacock-500 hover:to-peacock-400'} shadow-lg shadow-peacock-500/30 active:scale-[0.98] transition-all duration-200`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  'Secure Login'
                )}
              </button>
            </div>
          </form>

        </div>
      </motion.div>
    </div>
  );
}