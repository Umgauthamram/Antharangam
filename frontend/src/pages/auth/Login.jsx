import React, { useState } from 'react';
import { ShieldCheck, Key, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Login({ onLogin, onNavigateToSignup }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Secure connection established.");
      onLogin(); // Triggers state change in App.jsx
    }, 1000);
  };

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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-10 py-3 border border-primary placeholder-gray-500 text-primary rounded-lg focus:outline-none focus:ring-peacock-500 focus:border-peacock-500 focus:z-10 sm:text-sm bg-subtle"
                placeholder="Secure Password"
              />
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
            <button onClick={onNavigateToSignup} className="font-medium text-peacock-600 hover:text-peacock-500">
              Request Investigator Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}