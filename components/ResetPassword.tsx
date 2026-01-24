import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { useToast } from './ToastContext';
import { Lock, Eye, EyeOff, Check, Loader2 } from 'lucide-react';

export const ResetPassword = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Password Strength
    const [criteria, setCriteria] = useState({
        length: false,
        upper: false,
        number: false,
        special: false
    });

    useEffect(() => {
        setCriteria({
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        });
    }, [password]);

    const isPasswordValid = Object.values(criteria).every(Boolean);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (!isPasswordValid) {
            setError("Password doesn't meet requirements");
            return;
        }

        setLoading(true);

        try {
            const { error } = await db.auth.updateUser({ password });
            if (error) throw error;

            showToast('Password updated successfully! Please login.', 'success');
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
            showToast(err.message || 'Failed to update password', 'error');
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
                    <div className="relative z-10 mt-2">
                        <h2 className="text-3xl font-black tracking-tight">Set New Password</h2>
                        <p className="text-slate-400 mt-2 text-sm font-medium">
                            Create a strong password for your account
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5 -mt-8 bg-white rounded-t-[2rem] relative z-10">

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-4 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400 ${password && !isPasswordValid ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'}`}
                                placeholder="••••••"
                            />
                            <Lock size={18} className="absolute left-4 top-4 text-slate-400" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-indigo-600 transition-colors">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 pl-1">
                            <CriteriaItem met={criteria.length} label="8+ Characters" />
                            <CriteriaItem met={criteria.upper} label="Uppercase (A-Z)" />
                            <CriteriaItem met={criteria.number} label="Number (0-9)" />
                            <CriteriaItem met={criteria.special} label="Symbol (@#$%)" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400`}
                                placeholder="••••••"
                            />
                            <Lock size={18} className="absolute left-4 top-4 text-slate-400" />
                        </div>
                    </div>

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
                        {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};
