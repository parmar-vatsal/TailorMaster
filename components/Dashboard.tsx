
import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../services/db';
import { OrderStatus, ViewState, Order, Customer, AppConfig } from '../types';
import { TrendingUp, Scissors, Wallet, Plus, ChevronRight, Calendar, Clock, ShoppingBag } from 'lucide-react';
import { STATUS_COLORS } from '../constants';

import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const onNavigate = (view: ViewState) => {
        // Map legacy view state to new paths
        switch (view) {
            case 'NEW_ORDER': navigate('/orders/new'); break;
            case 'ORDER_LIST': navigate('/orders'); break;
            case 'REPORTS': navigate('/reports'); break;
            default: navigate('/dashboard');
        }
    };
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [config, setConfig] = useState<AppConfig>({ shopName: '', pin: '' });
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [o, c, conf, u] = await Promise.all([
                    db.orders.list(),
                    db.customers.list(),
                    db.config.get(),
                    db.auth.getSession()
                ]);
                setOrders(o);
                setCustomers(c);
                setConfig(conf);
                setUser(u);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const todayStr = new Date().toISOString().split('T')[0];

    const customerMap = useMemo(() => {
        return customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, typeof customers[0]>);
    }, [customers]);

    const stats = useMemo(() => {
        const todayOrders = orders.filter(o =>
            new Date(o.createdAt).toISOString().split('T')[0] === todayStr
        );

        const pendingDeliveries = orders.filter(o =>
            o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.COMPLETED
        );

        const pendingPaymentAmount = orders.reduce((acc, order) => {
            const remaining = order.totalAmount - order.advanceAmount;
            return acc + (remaining > 0 ? remaining : 0);
        }, 0);

        return {
            todayCount: todayOrders.length,
            pendingDeliveryCount: pendingDeliveries.length,
            pendingPayment: pendingPaymentAmount
        };
    }, [orders, todayStr]);

    const recentOrders = useMemo(() => {
        return [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
    }, [orders]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-0 space-y-8 animate-fade-in pb-28 md:pb-12">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        {getGreeting()}, <br /><span className="text-indigo-600">{user?.name?.split(' ')[0] || 'Master'}</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse"></span>
                        Ready for business at <span className="font-bold text-slate-700">{config.shopName}</span>
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 self-start md:self-end">
                    <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
                        <Calendar size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Today</p>
                        <p className="font-bold text-slate-800 text-lg leading-none mt-0.5">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- ACTION GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                <button
                    onClick={() => onNavigate('NEW_ORDER')}
                    className="md:col-span-2 relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 text-left group shadow-2xl shadow-slate-200 hover:shadow-xl transition-all duration-300"
                >
                    {/* Abstract bg shape */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:opacity-10 transition-opacity duration-500"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between items-start">
                        <div className="flex justify-between items-center w-full mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-90 transition-all duration-300">
                                <Plus size={28} strokeWidth={3} />
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wider border border-white/10">
                                New Order
                            </div>
                        </div>

                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Order</h2>
                            <p className="text-slate-400 font-medium max-w-sm leading-relaxed text-sm">
                                Start a new measurement, select garments, and generate an invoice instantly.
                            </p>
                        </div>
                    </div>
                </button>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-5">
                    <div
                        onClick={() => onNavigate('ORDER_LIST')}
                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <div className="bg-orange-50 text-orange-600 p-3.5 rounded-2xl group-hover:bg-orange-100 transition-colors">
                                <Scissors size={24} />
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="mt-4">
                            <p className="text-4xl font-black text-slate-800 tracking-tight">{stats.pendingDeliveryCount}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Work</p>
                        </div>
                    </div>

                    <div
                        onClick={() => onNavigate('REPORTS')}
                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl group-hover:bg-emerald-100 transition-colors">
                                <Wallet size={24} />
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-black text-emerald-600 tracking-tight">₹{stats.pendingPayment.toLocaleString()}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">To Collect</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RECENT ORDERS LIST --- */}
            <div className="pt-2">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
                        <Clock size={22} className="text-slate-400" strokeWidth={2.5} /> Recent Activity
                    </h3>
                    <button
                        onClick={() => onNavigate('ORDER_LIST')}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all"
                    >
                        View All
                    </button>
                </div>

                <div className="space-y-3">
                    {recentOrders.length > 0 ? (
                        recentOrders.map((order) => {
                            const customer = customerMap[order.customerId];
                            return (
                                <div
                                    key={order.id}
                                    onClick={() => onNavigate('ORDER_LIST')}
                                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 transition-colors ${order.status === OrderStatus.DELIVERED
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                        }`}>
                                        {customer?.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 truncate text-lg">{customer?.name}</h4>
                                        <div className="flex items-center gap-2.5 mt-1">
                                            <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200">
                                                {order.items && order.items.length > 0
                                                    ? order.items.map(i => i.garmentType).join(', ')
                                                    : 'Order'}
                                            </span>
                                            <span className="text-xs text-slate-400 font-semibold">
                                                {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${STATUS_COLORS[order.status]}`}>
                                            {order.status}
                                        </span>
                                        <p className="font-bold text-slate-900">₹{order.totalAmount}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-16 text-center text-slate-400">
                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag size={32} className="opacity-40" />
                            </div>
                            <p className="font-bold text-lg text-slate-600">No orders yet</p>
                            <p className="text-sm font-medium mt-1">Start by creating a new order above.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
