import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { db } from '../services/db';
import { Home, PlusCircle, List, FileText, Settings, LogOut, Scissors, Users, TrendingDown, Image } from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AutoLock } from './AutoLock';
import { AuthUser } from '../types';

export const Layout: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>({ shopName: '', pin: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    db.config.get().then(setConfig);
    db.auth.getSession().then(setUser);
  }, []);

  const handleLogout = async () => {
    await db.auth.signOut();
    navigate('/');
  };

  const isActivePath = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const NavItem = ({ path, icon: Icon, label, mobileOnly = false }: { path: string; icon: any; label: string, mobileOnly?: boolean }) => {
    const isActive = isActivePath(path);

    // Mobile Tab Bar Item
    if (mobileOnly) {
      return (
        <button
          onClick={() => navigate(path)}
          className={`flex flex - col items - center justify - center w - full h - full space - y - 1.5 transition - all duration - 200 ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            } `}
        >
          <div className={`p - 1.5 rounded - xl transition - all ${isActive ? 'bg-indigo-50' : ''} `}>
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
          </div>
          <span className={`text - [10px] font - bold ${isActive ? 'opacity-100' : 'opacity-70'} `}>{label}</span>
        </button>
      );
    }

    // Desktop Sidebar Item
    return (
      <button
        onClick={() => navigate(path)}
        className={`w - full flex items - center space - x - 3 px - 4 py - 3.5 rounded - xl transition - all duration - 200 group ${isActive
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          } `}
      >
        <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'} strokeWidth={2} />
        <span className={`text - sm font - semibold tracking - wide ${isActive ? 'text-white' : ''} `}>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <AutoLock />

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
            <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate leading-tight">{config.shopName || 'Tailor Master'}</h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          <div className="mb-6 px-2">
            <button
              onClick={() => navigate('/orders/new')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200/50 transition-all p-4 rounded-2xl flex items-center justify-center space-x-2 font-bold transform hover:-translate-y-0.5 active:translate-y-0 group"
            >
              <PlusCircle size={20} className="group-hover:rotate-90 transition-transform" />
              <span>New Order</span>
            </button>
          </div>

          <p className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-80">Overview</p>
          <NavItem path="/dashboard" icon={Home} label="Home" />
          <NavItem path="/orders" icon={List} label="Orders" />
          <NavItem path="/customers" icon={Users} label="Customers" />

          <p className="px-4 py-2 mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-80">Management</p>
          <NavItem path="/expenses" icon={TrendingDown} label="Expenses" />
          <NavItem path="/catalog" icon={Image} label="Design Catalog" />
          <NavItem path="/reports" icon={FileText} label="Reports" />

          <div className="mt-8">
            <p className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-80">Configuration</p>
            <NavItem path="/settings" icon={Settings} label="Settings" />
          </div>
        </nav>

        <div className="p-4 m-4 mt-0 bg-slate-50 rounded-2xl border border-slate-100">
          <button
            onClick={handleLogout}
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
            <h1 className="text-lg font-bold text-slate-900 truncate">{config.shopName || 'Tailor Master'}</h1>
          </div>
          <button onClick={handleLogout} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={20} />
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="w-full min-h-full">
            <div className="max-w-7xl mx-auto h-full flex flex-col p-0 md:p-8">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden bg-white border-t border-slate-200/60 flex justify-around items-center px-1 pb-safe pt-1 w-full z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] h-[84px]">
          <NavItem path="/dashboard" icon={Home} label="Home" mobileOnly />
          <NavItem path="/expenses" icon={TrendingDown} label="Expenses" mobileOnly />
          <div className="relative -top-8 px-2">
            <button
              onClick={() => navigate('/orders/new')}
              className="bg-indigo-600 text-white rounded-[20px] p-4 shadow-xl shadow-indigo-300 transform transition-transform active:scale-95 border-[6px] border-slate-50"
            >
              <PlusCircle size={28} />
            </button>
          </div>
          <NavItem path="/catalog" icon={Image} label="Catalog" mobileOnly />
          <NavItem path="/settings" icon={Settings} label="Settings" mobileOnly />
        </nav>
      </div>
    </div>
  );
};
