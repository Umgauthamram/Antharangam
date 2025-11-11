import React from 'react';
import { ShieldCheck, User, Mail, Lock, IdCard} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Signup({ onNavigateToLogin }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Request submitted for approval.");
    onNavigateToLogin();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-subtle">
      <div className="w-full max-w-md p-8 space-y-8 bg-primary rounded-xl shadow-2xl border border-primary">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-peacock-600" />
          <h2 className="mt-4 text-2xl font-bold text-primary">Request Access</h2>
          <p className="mt-2 text-sm text-secondary">For authorized Law Enforcement personnel only.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
             <div className="relative">
              <IdCard className="absolute left-3 top-3 h-5 w-5 text-secondary" />
              <input type="text" required className="w-full px-10 py-3 border border-primary rounded-lg bg-subtle text-primary focus:border-peacock-500 focus:outline-none" placeholder="Badge / ID Number" />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-secondary" />
              <input type="text" required className="w-full px-10 py-3 border border-primary rounded-lg bg-subtle text-primary focus:border-peacock-500 focus:outline-none" placeholder="Full Name" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-secondary" />
              <input type="email" required className="w-full px-10 py-3 border border-primary rounded-lg bg-subtle text-primary focus:border-peacock-500 focus:outline-none" placeholder="Official Email" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-secondary" />
              <input type="password" required className="w-full px-10 py-3 border border-primary rounded-lg bg-subtle text-primary focus:border-peacock-500 focus:outline-none" placeholder="Password" />
            </div>
          </div>

          <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-peacock-600 hover:bg-peacock-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-peacock-500">
            Submit Request
          </button>
        </form>

        <div className="text-center">
          <button onClick={onNavigateToLogin} className="text-sm font-medium text-peacock-600 hover:text-peacock-500">
             Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}