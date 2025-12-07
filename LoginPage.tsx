import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  title?: string;
  subtitle?: string;
  demoCredentials?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ 
  onLogin, 
  title = "Team Lead Access", 
  subtitle = "Secure dashboard for authorized personnel only.",
  demoCredentials = "admin / admin"
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate network request
    setTimeout(() => {
      const user = email.toLowerCase().trim();
      const pass = password.trim();

      // Mock authentication
      // Admin access
      if (user === 'admin' && pass === 'admin') {
        onLogin();
      } 
      // User access (e.g. for Customer Service)
      else if (user === 'user' && pass === 'password') {
        onLogin();
      }
      else {
        setError('Invalid credentials. Please contact your administrator.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100 max-w-md w-full relative overflow-hidden">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="text-center mb-8 pt-4">
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <p className="text-slate-500 mt-2 text-sm">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                placeholder="Enter ID"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center flex items-center justify-center animate-pulse">
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
               <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : (
               <>
                 Login
                 <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
               </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;