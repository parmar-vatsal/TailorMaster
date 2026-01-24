
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { AppConfig } from '../types';
import { Lock, LogOut, ShieldCheck } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const onSuccess = () => navigate('/dashboard');
  const onLogout = async () => {
    await db.auth.signOut();
    navigate('/');
  };
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [config, setConfig] = useState<AppConfig>({ shopName: '', pin: '' });

  useEffect(() => {
    db.config.get().then(setConfig);
  }, []);

  const handleNumClick = (num: number) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pin === config.pin) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 relative overflow-hidden">

      {/* Abstract Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px]"></div>

      <button
        onClick={onLogout}
        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors z-20"
      >
        <LogOut size={16} /> Switch User
      </button>

      {/* Container */}
      <div className="w-full max-w-sm mx-auto flex flex-col items-center relative z-10">

        <div className="mb-12 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl mb-2">
            <ShieldCheck size={40} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">{config.shopName || 'Tailor Master'}</h1>
            <p className="text-slate-400 mt-2 font-medium text-sm">Security PIN Required</p>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="flex gap-6 mb-12">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length
                ? 'bg-indigo-500 scale-125 shadow-[0_0_15px_rgba(99,102,241,0.8)]'
                : 'bg-slate-700/50 border border-slate-600'
                } ${error ? 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]' : ''}`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumClick(num)}
              className="h-20 w-20 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-3xl font-medium flex items-center justify-center transition-all active:scale-95 active:bg-indigo-600 active:border-indigo-500 active:text-white backdrop-blur-sm"
            >
              {num}
            </button>
          ))}
          <div className="h-20 w-20"></div> {/* Spacer */}
          <button
            onClick={() => handleNumClick(0)}
            className="h-20 w-20 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-3xl font-medium flex items-center justify-center transition-all active:scale-95 active:bg-indigo-600 active:border-indigo-500 active:text-white backdrop-blur-sm"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-20 w-20 rounded-full text-slate-500 hover:text-white flex items-center justify-center transition-colors"
          >
            ⌫
          </button>
        </div>

      </div>

      <div className="mt-16 text-slate-500 text-xs font-bold uppercase tracking-widest opacity-50">
        TailorMaster v2.0
      </div>
    </div>
  );
};
