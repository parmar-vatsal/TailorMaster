
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { ArrowLeft, User, Lock, Store, Phone, Eye, EyeOff, Upload, Image as ImageIcon, Loader2, Mail, Check, X } from 'lucide-react';
import { useToast } from './ToastContext';

import { useNavigate } from 'react-router-dom';

interface AuthFlowProps {
    mode: 'LOGIN' | 'REGISTER';
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ mode }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const onBack = () => navigate('/');
    const onSwitchMode = () => navigate(mode === 'LOGIN' ? '/register' : '/login');
    const onSuccess = () => navigate('/unlock');
    const [formData, setFormData] = useState({
        name: '',
        shopName: '',
        mobile: '',
        email: '',
        password: '',
        pin: '',
        logo: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Password Strength State
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        upper: false,
        number: false,
        special: false
    });

    useEffect(() => {
        const p = formData.password;
        setPasswordCriteria({
            length: p.length >= 8,
            upper: /[A-Z]/.test(p),
            number: /[0-9]/.test(p),
            special: /[^A-Za-z0-9]/.test(p)
        });
    }, [formData.password]);

    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500 * 1024) {
                setError('Logo file too large. Max 500KB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'REGISTER') {
                if (!formData.email || !formData.password) {
                    setError('Email and password required for registration');
                    setLoading(false);
                    return;
                }
                const { error } = await db.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    shopName: formData.shopName || 'My Shop',
                    mobile: formData.mobile,
                    pin: formData.pin || '0000',
                    logoUrl: formData.logo
                });

                if (error) {
                    setError(error.message);
                    showToast(error.message, 'error');
                } else if (data.session) {
                    showToast('Registration successful! Welcome.', 'success');
                    onSuccess();
                } else {
                    showToast('Registration successful! Please check your email to confirm.', 'info');
                    onSuccess();
                }
            } else {
                // LOGIN Mode
                const identifier = formData.mobile || formData.email; // We only support email really for now in db, but let's see
                // Revisit: db.auth.signIn expects email.
                if (!formData.email) {
                    setError('Please enter your email to login.');
                    setLoading(false);
                    return;
                }

                const { error } = await db.auth.signIn(formData.email, formData.password);

                if (error) {
                    setError(error.message);
                    showToast(error.message, 'error');
                } else {
                    showToast('Welcome back!', 'success');
                    onSuccess();
                }
            }

        } catch (err: unknown) {
            const msg = (err as Error).message || 'An error occurred';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const CriteriaItem = ({ met, label }: { met: boolean, label: string }) => (
        <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${met ? 'text-emerald-600' : 'text-slate-400'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${met ? 'bg-emerald-100 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                {met ? <Check size={10} /> : <div className="w-1 h-1 rounded-full bg-slate-300"></div>}
            </div>
            {label}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-white/50 overflow-hidden animate-fade-in">

                <div className="bg-slate-900 p-8 pb-12 text-white relative">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="relative z-10 mt-6">
                        <h2 className="text-3xl font-black tracking-tight">{mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}</h2>
                        <p className="text-slate-400 mt-2 text-sm font-medium">
                            {mode === 'LOGIN' ? 'Enter your details to access your dashboard' : 'Setup your professional tailoring profile'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5 -mt-8 bg-white rounded-t-[2rem] relative z-10">

                    {mode === 'REGISTER' && (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="relative group cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    />
                                    <div className={`w-28 h-28 rounded-3xl border-2 border-dashed flex items-center justify-center transition-all ${formData.logo ? 'border-indigo-500 bg-white shadow-md' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                                        {formData.logo ? (
                                            <img src={formData.logo} alt="Logo" className="w-full h-full object-cover rounded-3xl" />
                                        ) : (
                                            <div className="text-center text-slate-400">
                                                <ImageIcon size={28} className="mx-auto mb-2" />
                                                <span className="text-[10px] font-bold uppercase tracking-wide">Upload Logo</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg z-10 pointer-events-none">
                                        <Upload size={14} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Your Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => handleChange('name', e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                        placeholder="John Doe"
                                    />
                                    <User size={18} className="absolute left-4 top-4 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Shop Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.shopName}
                                        onChange={e => handleChange('shopName', e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                        placeholder="Royal Tailors"
                                    />
                                    <Store size={18} className="absolute left-4 top-4 text-slate-400" />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">
                            {mode === 'LOGIN' ? 'Mobile Number or Email' : 'Mobile Number'}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.mobile}
                                onChange={e => handleChange('mobile', e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400 tracking-wide"
                                placeholder={mode === 'LOGIN' ? "9876543210 or email" : "9876543210"}
                            />
                            <Phone size={18} className="absolute left-4 top-4 text-slate-400" />
                        </div>
                    </div>

                    {mode === 'REGISTER' && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Email Address <span className="text-red-500">*</span></label>
                            </div>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                    placeholder="you@example.com"
                                />
                                <Mail size={18} className="absolute left-4 top-4 text-slate-400" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={e => handleChange('password', e.target.value)}
                                className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-4 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400 ${mode === 'REGISTER' && formData.password && !isPasswordValid ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
                                placeholder="••••••"
                            />
                            <Lock size={18} className="absolute left-4 top-4 text-slate-400" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-indigo-600 transition-colors">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {mode === 'REGISTER' && (
                            <div className="grid grid-cols-2 gap-2 pt-2 pl-1 animate-fade-in">
                                <CriteriaItem met={passwordCriteria.length} label="8+ Characters" />
                                <CriteriaItem met={passwordCriteria.upper} label="Uppercase (A-Z)" />
                                <CriteriaItem met={passwordCriteria.number} label="Number (0-9)" />
                                <CriteriaItem met={passwordCriteria.special} label="Symbol (@#$%)" />
                            </div>
                        )}
                    </div>

                    {mode === 'REGISTER' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Set App Lock PIN (4 Digits)</label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    maxLength={4}
                                    value={formData.pin}
                                    onChange={e => handleChange('pin', e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold font-mono tracking-[0.5em] text-center text-slate-900 placeholder:text-slate-300"
                                    placeholder="1234"
                                />
                                <Lock size={18} className="absolute left-4 top-4 text-slate-400" />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl text-center border border-red-100 flex items-center justify-center gap-2 animate-fade-in">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-[0.98] text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (mode === 'LOGIN' ? 'Login' : 'Create Account')}
                    </button>
                </form>

                <div className="p-6 bg-slate-50 text-center border-t border-slate-200/60">
                    <p className="text-slate-500 text-sm font-semibold">
                        {mode === 'LOGIN' ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button onClick={onSwitchMode} className="text-indigo-600 font-bold hover:underline">
                            {mode === 'LOGIN' ? 'Register' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
