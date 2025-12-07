
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CheckCircle, LogOut, Headphones, Loader2 } from 'lucide-react';
import { UserRole, Promoter } from './types';
import { getPromoters } from './services/storageService';
import LogoUploader from './components/LogoUploader';
import LeadDashboard from './components/LeadDashboard';
import PromoterView from './components/PromoterView';
import SalesVerifier from './components/SalesVerifier';
import CustomerServiceView from './components/CustomerServiceView';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('LEAD');
  const [isLeadAuthenticated, setIsLeadAuthenticated] = useState(false);
  const [isCSAuthenticated, setIsCSAuthenticated] = useState(false);
  
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(true);
  const [currentPromoterId, setCurrentPromoterId] = useState<string>('');
  
  useEffect(() => {
    const fetchPromoters = async () => {
      try {
        const data = await getPromoters();
        setPromoters(data);

        if (data.length > 0 && !currentPromoterId) {
          // Only set default if not already set, or if current selection is invalid
          const currentExists = data.some(p => p.id === currentPromoterId);
          if (!currentPromoterId || !currentExists) {
             setCurrentPromoterId(data[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load promoters", e);
      } finally {
        setLoadingPromoters(false);
      }
    };
    
    fetchPromoters();
    // Poll for updates (e.g., floor assignments) every 10 seconds
    const interval = setInterval(fetchPromoters, 10000);
    return () => clearInterval(interval);
  }, [currentPromoterId]);

  const activePromoter = promoters.find(p => p.id === currentPromoterId);

  const handleLeadLogin = () => {
    setIsLeadAuthenticated(true);
  };
  
  const handleCSLogin = () => {
    setIsCSAuthenticated(true);
  };

  const handleLogout = () => {
    if (currentRole === 'LEAD') setIsLeadAuthenticated(false);
    if (currentRole === 'CUSTOMER_SERVICE') setIsCSAuthenticated(false);
  };

  const renderContent = () => {
    switch (currentRole) {
      case 'LEAD':
        if (!isLeadAuthenticated) {
          return <LoginPage onLogin={handleLeadLogin} title="Team Lead Access" subtitle="Secure dashboard for Operations Management." demoCredentials="admin / admin" />;
        }
        return <LeadDashboard />;
      case 'PROMOTER':
        if (loadingPromoters) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>;
        if (!activePromoter) return <div className="p-8 text-center text-slate-500">No promoters found. Please ask Team Lead to create a promoter account.</div>;
        return <PromoterView promoter={activePromoter} />;
      case 'VERIFIER':
        return <SalesVerifier />;
      case 'CUSTOMER_SERVICE':
        if (!isCSAuthenticated) {
            return <LoginPage onLogin={handleCSLogin} title="Customer Service Access" subtitle="Please login to access the Complaint Portal." demoCredentials="user / password" />;
        }
        return <CustomerServiceView />;
      default:
        return <div>Select a role</div>;
    }
  };

  const navItems = [
    { role: 'LEAD', label: 'Team Lead', icon: LayoutDashboard },
    { role: 'PROMOTER', label: 'Brand Promoter', icon: Users },
    { role: 'VERIFIER', label: 'Sales Concern', icon: CheckCircle },
    { role: 'CUSTOMER_SERVICE', label: 'Customer Service', icon: Headphones },
  ];

  const getSubHeaderText = () => {
    if (currentRole === 'LEAD' && !isLeadAuthenticated) return 'Please verify your identity.';
    if (currentRole === 'CUSTOMER_SERVICE' && !isCSAuthenticated) return 'Please verify your identity.';
    if (currentRole === 'PROMOTER') return 'Track your sales and performance.';
    if (currentRole === 'VERIFIER') return 'Verify incoming sales entries.';
    if (currentRole === 'CUSTOMER_SERVICE') return 'Log and manage customer complaints.';
    return 'Welcome back, verified user.';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shadow-2xl relative z-20">
        <div className="p-6 border-b border-slate-800 flex flex-col items-center">
           <LogoUploader />
           <h1 className="text-white font-bold text-xl text-center tracking-tight mt-2 leading-tight">
             Brand Promoter <span className="text-indigo-500 whitespace-nowrap">KPI Tracker</span>
           </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.role}
              onClick={() => setCurrentRole(item.role as UserRole)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentRole === item.role 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {currentRole === 'PROMOTER' && !loadingPromoters && (
           <div className="p-4 bg-slate-800/50 border-t border-slate-800">
             <label className="block text-xs font-medium text-slate-400 mb-2">Select BP:</label>
             <select 
               className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white outline-none focus:border-indigo-500"
               value={currentPromoterId}
               onChange={(e) => setCurrentPromoterId(e.target.value)}
             >
                {promoters.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           </div>
        )}

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Nav Header (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 p-4 flex justify-between items-center shadow-md">
         <div className="font-bold flex items-center gap-2">
            <span>KPI Tracker</span>
         </div>
         <select 
            value={currentRole} 
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="bg-slate-800 text-sm rounded p-1 outline-none border border-slate-700"
          >
            <option value="LEAD">Lead</option>
            <option value="PROMOTER">Promoter</option>
            <option value="VERIFIER">Verifier</option>
            <option value="CUSTOMER_SERVICE">CS</option>
         </select>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-white relative">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30 px-8 py-4 flex justify-between items-center shadow-sm">
           <div>
             <h2 className="text-xl font-bold text-slate-800">
               {navItems.find(i => i.role === currentRole)?.label} Dashboard
             </h2>
             <p className="text-sm text-slate-500">{getSubHeaderText()}</p>
           </div>
           <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm transition-colors ${
             (currentRole === 'LEAD' && !isLeadAuthenticated) || (currentRole === 'CUSTOMER_SERVICE' && !isCSAuthenticated)
              ? 'bg-slate-200 text-slate-500' 
              : 'bg-indigo-100 text-indigo-700'
           }`}>
              {currentRole[0]}
           </div>
        </header>

        <div className="p-2 md:p-6 min-h-[calc(100vh-80px)]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
