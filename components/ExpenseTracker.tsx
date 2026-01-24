
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Expense } from '../types';
import { Plus, Trash2, Calendar, TrendingDown, IndianRupee } from 'lucide-react';

export const ExpenseTracker: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Material');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            const data = await db.expenses.list();
            setExpenses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !date) return;

        try {
            const newExpense = await db.expenses.save({
                category: category as any,
                amount: parseFloat(amount),
                date,
                note
            });
            if (newExpense) {
                setExpenses(prev => [newExpense, ...prev]);
            }
            setIsAdding(false);
            setAmount('');
            setNote('');
        } catch (e) {
            alert('Failed to save expense');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this expense?")) return;
        try {
            await db.expenses.delete(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (e) {
            alert('Delete failed');
        }
    };

    const categories = ['Material', 'Rent', 'Electricity', 'Salary', 'Maintenance', 'Other'];
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading Expenses...</div>;

    return (
        <div className="p-4 md:p-0 space-y-6 pb-24 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Expenses</h2>
                    <p className="text-slate-500 font-medium">Track shop spending</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-rose-600 text-white p-3 rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
                >
                    <Plus size={24} className={isAdding ? 'rotate-45 transition-transform' : 'transition-transform'} />
                </button>
            </div>

            {/* Stats Card */}
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Total Spent</p>
                    <p className="text-3xl font-black text-rose-600">₹{totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-white p-3 rounded-xl text-rose-500 shadow-sm">
                    <TrendingDown size={28} />
                </div>
            </div>

            {isAdding && (
                <form onSubmit={handleSave} className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 animate-fade-in space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 mb-2">Add New Expense</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200 focus:border-rose-500 outline-none"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200 focus:border-rose-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200 focus:border-rose-500 outline-none"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Note (Optional)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="w-full p-3 bg-slate-50 rounded-xl font-medium border border-slate-200 focus:border-rose-500 outline-none"
                            placeholder="e.g. Thread bundle"
                        />
                    </div>
                    <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg mt-2">
                        Save Expense
                    </button>
                </form>
            )}

            <div className="space-y-3">
                {expenses.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <IndianRupee size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No expenses recorded yet.</p>
                    </div>
                ) : (
                    expenses.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl font-bold text-xs uppercase w-12 h-12 flex items-center justify-center text-center leading-none">
                                    {item.category.slice(0, 3)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{item.category}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                        <Calendar size={10} /> {new Date(item.date).toLocaleDateString()}
                                        {item.note && <span className="text-slate-300">• {item.note}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-black text-slate-800 text-lg">₹{item.amount}</span>
                                <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
