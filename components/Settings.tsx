
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { AppConfig } from '../types';
import { Save, Store, Lock, Monitor, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from './ToastContext';

export const Settings: React.FC = () => {
    const [config, setConfig] = useState<AppConfig>({ shopName: '', pin: '' });
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        db.config.get().then(data => {
            setConfig(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        try {
            await db.config.update(config);
            showToast('Settings saved successfully', 'success');
        } catch (e) {
            showToast('Failed to save settings', 'error');
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500 * 1024) {
                showToast("File too large. Max 500KB", 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setConfig(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading settings...</div>;

    return (
        <div className="p-4 md:p-0 space-y-8 max-w-2xl mx-auto pb-24 animate-fade-in">
            <div className="text-center md:text-left">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h2>
                <p className="text-slate-500 font-medium mt-1">Manage your shop profile and security preferences.</p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                {/* Logo Section */}
                <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative group cursor-pointer shrink-0">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-28 h-28 rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-300 ${config.logo ? 'border-indigo-500 shadow-md' : 'border-slate-300 bg-slate-50 group-hover:bg-slate-100'}`}>
                            {config.logo ? (
                                <img src={config.logo} alt="Shop Logo" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="text-slate-300" size={32} />
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-full shadow-lg transform transition-transform group-hover:scale-110">
                            <Upload size={14} />
                        </div>
                    </div>
                    <div className="text-center sm:text-left">
                        <h3 className="font-bold text-slate-900 text-lg">Shop Logo</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
                            Upload your shop's logo. This will appear on your dashboard and generated invoices.
                        </p>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Form Fields */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase tracking-wider">
                            <Store size={16} className="text-indigo-500" /> Shop Name
                        </label>
                        <input
                            type="text"
                            value={config.shopName}
                            onChange={e => setConfig({ ...config, shopName: e.target.value })}
                            className="w-full bg-slate-50 border-slate-200 rounded-xl h-14 px-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg text-slate-900 placeholder:text-slate-300"
                            placeholder="e.g. Royal Tailors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase tracking-wider">
                            <Lock size={16} className="text-indigo-500" /> Security PIN
                        </label>
                        <input
                            type="tel"
                            maxLength={4}
                            value={config.pin}
                            onChange={e => setConfig({ ...config, pin: e.target.value })}
                            className="w-full bg-slate-50 border-slate-200 rounded-xl h-14 px-4 font-mono tracking-[1em] text-center text-2xl font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-300"
                            placeholder="••••"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold h-16 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-slate-200 hover:shadow-2xl transition-all active:scale-[0.98] text-lg"
            >
                <Save size={24} /> Save Changes
            </button>

            <div className="text-center pt-8 pb-4 text-slate-300">
                <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-60">
                    <Monitor size={12} />
                    <span>TailorMaster v2.0 System</span>
                </div>
            </div>
        </div>
    );
};
