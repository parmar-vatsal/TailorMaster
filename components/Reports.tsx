
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Order, Customer, Expense } from '../types';
import { Users, ShoppingBag, CreditCard, AlertOctagon, TrendingDown, Coins } from 'lucide-react';

export const Reports: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            db.orders.list(),
            db.customers.list(),
            db.expenses.list()
        ]).then(([o, c, e]) => {
            setOrders(o);
            setCustomers(c);
            setExpenses(e);
            setLoading(false);
        });
    }, []);

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPending = orders.reduce((sum, o) => sum + Math.max(0, o.totalAmount - o.advanceAmount), 0);
    const totalCollected = totalRevenue - totalPending;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalCollected - totalExpenses; // Cash in hand profit

    const ReportCard = ({ label, value, color, icon: Icon, subValue }: any) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">{label}</p>
                <p className={`text-2xl font-black ${color} tracking-tight`}>{value}</p>
                {subValue && <p className="text-xs font-bold text-slate-400 mt-1">{subValue}</p>}
            </div>
            <div className={`p-4 rounded-2xl opacity-10 ${color.replace('text-', 'bg-').replace('600', '500').replace('800', '500')}`}>
                <Icon size={24} className={color} />
            </div>
        </div>
    );

    if (loading) return <div className="p-12 text-center text-slate-400 font-medium">Generating Report...</div>;

    return (
        <div className="p-4 md:p-0 space-y-8 animate-fade-in pb-20">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Business Reports</h2>
                <p className="text-slate-500 font-medium mt-1">Overview of your shop's financial health.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                <ReportCard label="Net Profit (Cash)" value={`₹${netProfit.toLocaleString()}`} color="text-slate-900" icon={Coins} subValue="Collected - Expenses" />
                <ReportCard label="Revenue Collected" value={`₹${totalCollected.toLocaleString()}`} color="text-emerald-600" icon={CreditCard} />
                <ReportCard label="Total Expenses" value={`₹${totalExpenses.toLocaleString()}`} color="text-rose-600" icon={TrendingDown} />
                <ReportCard label="Payment Pending" value={`₹${totalPending.toLocaleString()}`} color="text-amber-500" icon={AlertOctagon} />
                <ReportCard label="Total Orders" value={orders.length} color="text-indigo-600" icon={ShoppingBag} />
                <ReportCard label="Total Customers" value={customers.length} color="text-blue-600" icon={Users} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                {/* Pending Payments */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-xl">Pending Payments</h3>
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
                            {orders.filter(o => (o.totalAmount - o.advanceAmount) > 0).length} Orders
                        </span>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 border-b border-slate-100 sticky top-0 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Customer</th>
                                    <th className="px-6 py-4 font-bold text-right text-slate-400 uppercase text-xs">Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {orders
                                    .filter(o => (o.totalAmount - o.advanceAmount) > 0)
                                    .map(o => {
                                        const c = customers.find(cus => cus.id === o.customerId);
                                        return (
                                            <tr key={o.id}>
                                                <td className="px-6 py-4 font-bold text-slate-900">{c?.name || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-right font-black text-amber-500">₹{o.totalAmount - o.advanceAmount}</td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-xl">Recent Expenses</h3>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 border-b border-slate-100 sticky top-0 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-400 uppercase text-xs">Category</th>
                                    <th className="px-6 py-4 font-bold text-right text-slate-400 uppercase text-xs">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {expenses.slice(0, 10).map(e => (
                                    <tr key={e.id}>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {e.category}
                                            <span className="block text-xs text-slate-400 font-normal">{new Date(e.date).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-600">₹{e.amount}</td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr><td colSpan={2} className="p-6 text-center text-slate-400">No expenses recorded.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
