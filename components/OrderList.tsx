
import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../services/db';
import { Order, OrderStatus, Customer } from '../types';
import { STATUS_COLORS } from '../constants';
import { Search, Phone, ChevronDown, Calendar, User, Trash2, Loader2, RefreshCw, Filter } from 'lucide-react';
import { useToast } from './ToastContext';

import { useNavigate } from 'react-router-dom';

export const OrderList: React.FC = () => {
    const navigate = useNavigate();
    const onSelectOrder = (orderId: string) => navigate(`/orders/${orderId}`);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'DELIVERED'>('ALL');
    const [search, setSearch] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);
    const { showToast } = useToast();

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const [o, c] = await Promise.all([db.orders.list(), db.customers.list()]);
            setOrders(o);
            setCustomers(c);
            if (isRefresh) showToast("Orders updated", 'success');
        } catch (err) {
            console.error("Fetch failed", err);
            showToast("Failed to load data", 'error');
        } finally {
            setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const customerMap = useMemo(() => {
        return customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, Customer>);
    }, [customers]);

    const filteredOrders = useMemo(() => {
        return orders
            .filter(o => {
                const c = customerMap[o.customerId];
                if (!c) return false;
                const searchLower = search.toLowerCase();
                const matchesSearch = c.name.toLowerCase().includes(searchLower) || c.mobile.includes(searchLower);
                if (!matchesSearch) return false;
                if (filter === 'PENDING') return o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.COMPLETED;
                if (filter === 'DELIVERED') return o.status === OrderStatus.DELIVERED;
                return true;
            })
            .sort((a, b) => b.createdAt - a.createdAt);
    }, [orders, customerMap, search, filter]);

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, order: Order) => {
        e.preventDefault();
        e.stopPropagation();

        const newStatus = e.target.value as OrderStatus;
        if (newStatus === order.status) return;

        let updatedOrder = { ...order, status: newStatus };

        if (newStatus === OrderStatus.DELIVERED) {
            const remaining = order.totalAmount - order.advanceAmount;
            if (remaining > 0) {
                const msg = `Collecting remaining balance of ₹${remaining}?\n\nConfirm to mark as FULLY PAID and DELIVERED.`;
                if (window.confirm(msg)) {
                    updatedOrder.advanceAmount = order.totalAmount;
                } else {
                    return;
                }
            }
        }

        setActionId(order.id);
        try {
            await db.orders.updateStatus(order.id, newStatus);
            setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
            showToast(`Order marked as ${newStatus}`, 'success');
        } catch (err) {
            showToast("Update failed. Check your internet.", 'error');
        } finally {
            setActionId(null);
        }
    };

    const handleDeleteOrder = async (e: React.MouseEvent, orderId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (window.confirm("Permanently delete this order record?")) {
            setActionId(orderId);
            try {
                const result = await db.orders.delete(orderId);
                if (!result.error) {
                    setOrders(prev => prev.filter(o => o.id !== orderId));
                    showToast("Order deleted successfully", 'info');
                } else {
                    showToast("Database error during delete.", 'error');
                }
            } catch (err) {
                showToast("Unexpected error.", 'error');
            } finally {
                setActionId(null);
            }
        }
    };

    if (loading) return <div className="p-12 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-indigo-600" size={40} /> <p className="text-slate-400 font-medium">Loading Shop Orders...</p></div>;

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="p-4 md:p-0 bg-slate-50/95 sticky top-0 z-10 space-y-5 mb-2 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Orders</h2>
                        <button
                            onClick={() => fetchData(true)}
                            className={`p-2 rounded-full hover:bg-white hover:shadow-sm transition-all ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}
                            title="Refresh Data"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative flex-1 sm:w-72 group">
                            <input
                                type="text"
                                placeholder="Search name or mobile..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl h-12 pl-11 pr-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                            />
                            <Search size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl">
                            {['ALL', 'PENDING', 'DELIVERED'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-0 pb-32">
                {filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100"><Filter size={40} opacity={0.5} /></div>
                        <p className="font-bold text-lg text-slate-500">No orders found</p>
                        <p className="text-sm font-medium opacity-70">Try adjusting your filters or search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredOrders.map(order => {
                            const customer = customerMap[order.customerId];
                            const remaining = order.totalAmount - order.advanceAmount;
                            const isPaid = remaining <= 0;
                            const isWorking = actionId === order.id;

                            return (
                                <div
                                    key={order.id}
                                    onClick={() => onSelectOrder(order.id)}
                                    className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 cursor-pointer flex flex-col justify-between h-full relative group ${isWorking ? 'opacity-60 pointer-events-none' : ''}`}
                                >
                                    {isWorking && (
                                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 rounded-3xl backdrop-blur-sm">
                                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex justify-between items-start mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-lg font-bold">
                                                    {customer?.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{customer?.name}</h3>
                                                    <div className="flex items-center text-slate-500 text-xs font-semibold mt-1 bg-slate-50 px-2 py-0.5 rounded-md w-fit">
                                                        <Phone size={10} className="mr-1" />{customer?.mobile}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Type</span>
                                                <span className="font-bold text-slate-800">
                                                    {/* Since list() doesn't fetch items by default in our simple impl, we might not have items populated.
                                            We need to adjust db.orders.list to join items or display 'View Details' */
                                                        order.items ? order.items.map(i => i.garmentType).join(', ') : 'Order #' + order.id.slice(-4)
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-1"><Calendar size={10} /> Due</span>
                                                <span className="font-bold text-slate-900 font-mono text-xs">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-100/60">
                                        <div className="flex justify-between items-end mb-5">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Amount</p>
                                                <p className="text-2xl font-black text-slate-900 tracking-tight">₹{order.totalAmount}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-[10px] font-black px-3 py-1.5 rounded-lg border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {isPaid ? 'PAID' : `DUE ₹${remaining}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => handleDeleteOrder(e, order.id)}
                                                className="h-11 w-11 flex items-center justify-center rounded-xl bg-white text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all z-20"
                                                title="Delete Order"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                            <div className="flex-1 relative z-20 group/select" onClick={e => e.stopPropagation()}>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(e, order)}
                                                    className={`w-full appearance-none pl-4 pr-10 h-11 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all outline-none cursor-pointer ${STATUS_COLORS[order.status]} focus:ring-4 focus:ring-slate-100`}
                                                >
                                                    {Object.values(OrderStatus).map(s => (
                                                        <option key={s} value={s} className="bg-white text-slate-900 font-medium py-2">{s}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-current opacity-70" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
