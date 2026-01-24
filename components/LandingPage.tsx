
import React from 'react';
import { Scissors, Ruler, Smartphone, ShieldCheck, ArrowRight, Star } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const onLogin = () => navigate('/login');
  const onRegister = () => navigate('/register');
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-lg shadow-slate-200">
              <Scissors size={20} />
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">TailorMaster</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onLogin}
              className="text-slate-600 font-bold hover:text-indigo-600 transition-colors hidden sm:block"
            >
              Log In
            </button>
            <button
              onClick={onRegister}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-24 text-center max-w-5xl mx-auto relative overflow-hidden">

        {/* Abstract Background Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] -z-10"></div>

        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wide mb-10 animate-fade-in shadow-sm hover:scale-105 transition-transform cursor-default">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          The #1 App for Professional Tailors
        </div>

        <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">
          Master Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Tailoring Business</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed font-medium">
          The complete digital solution for modern shops. Track orders, manage measurements, and invoice customers with <span className="text-slate-900 font-bold">zero paperwork</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto animate-fade-in">
          <button
            onClick={onRegister}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl shadow-slate-300 flex items-center justify-center gap-3 transform hover:-translate-y-1 active:scale-[0.98]"
          >
            Create Free Account <ArrowRight size={20} />
          </button>
          <button
            onClick={onLogin}
            className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center"
          >
            Login to Shop
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="bg-slate-50 py-24 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-10 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group">
            <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-8 group-hover:scale-110 transition-transform">
              <Ruler size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Digital Measurements</h3>
            <p className="text-slate-500 leading-relaxed font-medium">Save detailed measurements for Shirts, Pants, Suits, and Kurtas. Never lose a size again.</p>
          </div>
          <div className="p-10 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 transition-transform">
              <Smartphone size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">WhatsApp Invoicing</h3>
            <p className="text-slate-500 leading-relaxed font-medium">Send professional PDF invoices directly to your customer's WhatsApp with a single click.</p>
          </div>
          <div className="p-10 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all group">
            <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-600 mb-8 group-hover:scale-110 transition-transform">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Secure & Private</h3>
            <p className="text-slate-500 leading-relaxed font-medium">Your data is stored securely. Set a PIN lock to prevent unauthorized access to your shop data.</p>
          </div>
        </div>
      </div>

      <footer className="py-10 text-center text-slate-400 text-sm bg-slate-50 border-t border-slate-200 font-bold">
        &copy; {new Date().getFullYear()} TailorMaster. All rights reserved.
      </footer>
    </div>
  );
};
