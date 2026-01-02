
import React, { useState, useEffect } from 'react';
import { ViewState, AppConfig } from '../types';
import { db } from '../services/db';
import { Home, PlusCircle, List, FileText, Settings, LogOut, Scissors, Users, TrendingDown, Image } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  view: ViewState;
  onNavigate: (view: ViewState) => void;
  shopName: string;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, view, onNavigate, shopName, onLogout }) => {
  const [config, setConfig] = useState<AppConfig>({ shopName: '', pin: '' });

  useEffect(() => {
    db.config.get().then(setConfig);
  }, []);

  const NavItem = ({ target, icon: Icon, label, mobileOnly = false }: { target: ViewState; icon: any; label: string, mobileOnly?: boolean }) => {
    const isActive = view === target;
    
    // Mobile Tab Bar Item
    if (mobileOnly) {
       return (
        <button
          onClick={() => onNavigate(target)}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-all duration-200 ${
            isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50' : ''}`}>
             <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
        </button>
       );
    }

    // Desktop Sidebar Item
    return (
      <button
        onClick={() => onNavigate(target)}
        className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
          isActive 
            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'} strokeWidth={2} />
        <span className={`text-sm font-semibold tracking-wide ${isActive ? 'text-white' : ''}`}>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200/60 z-20">
        <div className="p-8 pb-6 flex items-center space-x-4">
             {config.logo ? (
                <img src={config.logo} alt="Logo" className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-100" />
             ) : (
                <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                    <Scissors size={24} />
                </div>
             )}
             <div>
                 <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate leading-tight">{shopName || 'Tailor Master'}</h1>
                 <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dashboard</p>
             </div>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
            <div className="mb-6 px-2">
                <button
                    onClick={() => onNavigate('NEW_ORDER')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200/50 transition-all p-4 rounded-2xl flex items-center justify-center space-x-2 font-bold transform hover:-translate-y-0.5 active:translate-y-0 group"
                >
                    <PlusCircle size={20} className="group-hover:rotate-90 transition-transform" />
                    <span>New Order</span>
                </button>
            </div>

            <p className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-80">Overview</p>
            <NavItem target="DASHBOARD" icon={Home} label="Home" />
            <NavItem target="ORDER_LIST" icon={List} label="Orders" />
            <NavItem target="CUSTOMER_LIST" icon={Users} label="Customers" />
            
            <p className="px-4 py-2 mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-80">Management</p>
            <NavItem target="EXPENSES" icon={TrendingDown} label="Expenses" />
            <NavItem target="CATALOG" icon={Image} label="Design Catalog" />
            <NavItem target="REPORTS" icon={FileText} label="Reports" />
            
            <div className="mt-8">
                <p className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-80">Configuration</p>
                <NavItem target="SETTINGS" icon={Settings} label="Settings" />
            </div>
        </nav>

        <div className="p-4 m-4 mt-0 bg-slate-50 rounded-2xl border border-slate-100">
            <button 
                onClick={onLogout} 
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-500 hover:text-red-600 transition-colors group"
            >
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:shadow group-hover:text-red-500 transition-all"><LogOut size={18} /></div>
                <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-red-600">Sign Out</p>
                    <p className="text-[10px] font-medium opacity-60">End Session</p>
                </div>
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50/50">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white/80 backdrop-blur-xl px-4 py-3 flex justify-between items-center border-b border-slate-200/60 sticky top-0 z-30">
            <div className="flex items-center space-x-3">
                {config.logo ? (
                    <img src={config.logo} alt="Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm border border-slate-100" />
                ) : (
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-100">
                        <Scissors size={20} />
                    </div>
                )}
                <h1 className="text-lg font-bold text-slate-900 truncate">{shopName}</h1>
            </div>
            <button onClick={onLogout} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={20} />
            </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
             <div className="w-full min-h-full">
                <div className="max-w-7xl mx-auto h-full flex flex-col p-0 md:p-8">
                    {children}
                </div>
             </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden bg-white border-t border-slate-200/60 flex justify-around items-center px-1 pb-safe pt-1 w-full z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] h-[84px]">
            <NavItem target="DASHBOARD" icon={Home} label="Home" mobileOnly />
            <NavItem target="EXPENSES" icon={TrendingDown} label="Expenses" mobileOnly />
            <div className="relative -top-8 px-2">
                <button
                    onClick={() => onNavigate('NEW_ORDER')}
                    className="bg-indigo-600 text-white rounded-[20px] p-4 shadow-xl shadow-indigo-300 transform transition-transform active:scale-95 border-[6px] border-slate-50"
                >
                    <PlusCircle size={28} />
                </button>
            </div>
            <NavItem target="CATALOG" icon={Image} label="Catalog" mobileOnly />
            <NavItem target="SETTINGS" icon={Settings} label="Settings" mobileOnly />
        </nav>
      </div>
    </div>
  );
};
