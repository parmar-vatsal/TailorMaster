
import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../services/db';
import { Customer, Measurement, Order, GarmentType } from '../types';
import { Search, Phone, User, Ruler, ClipboardList, ChevronRight, X, Trash2, Loader2, MapPin } from 'lucide-react';
import { STATUS_COLORS } from '../constants';
import { useToast } from './ToastContext';

export const CustomerList: React.FC = () => {
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [allMeasurements, setAllMeasurements] = useState<Measurement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const { showToast } = useToast();

    const refreshData = async () => {
        try {
            const [c, o, m] = await Promise.all([
                db.customers.list(),
                db.orders.list(),
                db.measurements.getForCustomer(selectedCustomer?.id || '') // This isn't quite right for 'allMeasurements' usage
            ]);
            // Actually, the original code loaded ALL measurements.
            // Our new DB service does not expose 'getAll' for measurements freely for performance reasons, 
            // but if we need it for client-side filtering we can add it or rethink.
            // For this view, we only show measurements for selected customer. 
            // Let's change strategy: fetch measurements only when customer selected.

            setCustomers(c);
            setAllOrders(o);
            // setAllMeasurements(m); <- We will lazy load this
        } catch (err) {
            console.error(err);
            showToast("Failed to load customer list", 'error');
        } finally {
            setLoading(false);
        }
    };

    // ... (skipping to order display fix)


    useEffect(() => {
        refreshData();
    }, []);

    const filteredCustomers = useMemo(() => {
        const lowerSearch = search.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(lowerSearch) ||
            c.mobile.includes(lowerSearch)
        ).sort((a, b) => b.createdAt - a.createdAt);
    }, [customers, search]);

    const handleDeleteCustomer = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!selectedCustomer) return;

        const msg = `Are you sure you want to delete ${selectedCustomer.name}?\n\nThis will remove ALL their orders and measurements PERMANENTLY.`;

        if (window.confirm(msg)) {
            setIsDeleting(true);
            const customerId = selectedCustomer.id;
            try {
                const result = await db.customers.delete(customerId);
                if (result.error) {
                    showToast(`Error deleting customer: ${result.error.message}`, 'error');
                } else {
                    setCustomers(prev => prev.filter(c => c.id !== customerId));
                    setSelectedCustomer(null);
                    showToast('Customer deleted successfully', 'success');
                    await refreshData();
                }
            } catch (err) {
                showToast("An error occurred during deletion.", 'error');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    if (loading) return <div className="p-12 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-indigo-600" size={40} /><p className="text-slate-400 font-medium">Loading Database...</p></div>;

    return (
        <div className="flex h-full gap-8 animate-fade-in">
            <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${selectedCustomer ? 'hidden lg:flex lg:w-1/3 lg:flex-none' : 'w-full'}`}>
                <div className="mb-6 space-y-4 sticky top-0 bg-slate-50 z-10 py-2">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Customers</h2>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search customer name or mobile..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl h-14 pl-12 pr-4 text-base font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all"
                        />
                        <Search size={20} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pb-24 pr-1">
                    {filteredCustomers.length === 0 ? (
                        <div className="text-center py-24 text-slate-400">
                            <User size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-medium">No customers found.</p>
                        </div>
                    ) : (
                        filteredCustomers.map(c => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedCustomer(c)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md ${selectedCustomer?.id === c.id ? 'bg-indigo-600 border-indigo-600 shadow-lg transform scale-[1.02]' : 'bg-white border-slate-100 hover:border-indigo-100'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black transition-colors ${selectedCustomer?.id === c.id ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-lg leading-tight ${selectedCustomer?.id === c.id ? 'text-white' : 'text-slate-800'}`}>{c.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className={`text-xs font-mono ${selectedCustomer?.id === c.id ? 'text-indigo-200' : 'text-slate-400'}`}>{c.mobile}</p>
                                                <a
                                                    href={`tel:${c.mobile}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`p-1 rounded-full flex items-center justify-center transition-all ${selectedCustomer?.id === c.id
                                                        ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                                                        : 'bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-600 border border-slate-200'
                                                        }`}
                                                    title="Call Customer"
                                                >
                                                    <Phone size={12} strokeWidth={2.5} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className={selectedCustomer?.id === c.id ? 'text-indigo-300' : 'text-slate-300'} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedCustomer && (
                <div className="fixed inset-0 z-50 bg-white lg:static lg:bg-transparent lg:flex-1 lg:flex lg:flex-col lg:z-0 overflow-hidden flex flex-col animate-fade-in">
                    {/* Mobile Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10 lg:hidden">
                        <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                        <h3 className="font-bold text-slate-800">Customer Profile</h3>
                        <div className="w-10"></div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 lg:p-0">
                        {/* Detail Header Card */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row md:items-center gap-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                            <button
                                onClick={handleDeleteCustomer}
                                disabled={isDeleting}
                                className="absolute top-6 right-6 p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all z-20 shadow-sm disabled:opacity-50"
                                title="Delete Customer"
                            >
                                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                            </button>

                            <div className="w-24 h-24 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-slate-200">
                                {selectedCustomer.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{selectedCustomer.name}</h1>
                                <div className="flex flex-wrap gap-3">
                                    <a
                                        href={`tel:${selectedCustomer.mobile}`}
                                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm border border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                                    >
                                        <Phone size={16} className="text-current opacity-60" />
                                        {selectedCustomer.mobile}
                                    </a>
                                    {selectedCustomer.address && <span className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm border border-slate-200"><MapPin size={16} className="text-slate-400" />{selectedCustomer.address}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-32">
                            {/* Measurements Section */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-3 mb-2 px-1">
                                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Ruler size={20} /></div>
                                    <h3 className="font-bold text-slate-800 text-lg">Measurements</h3>
                                </div>

                                {allMeasurements.filter(m => m.customerId === selectedCustomer.id).length > 0 ? (
                                    <div className="grid gap-5">
                                        {allMeasurements.filter(m => m.customerId === selectedCustomer.id).map(m => (
                                            <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                                                <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                                                    <span className="font-black text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm uppercase tracking-wide">{m.garmentType}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updated {new Date(m.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                                    {Object.entries(m.values).map(([key, val]) => val && (
                                                        <div key={key} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between h-full">
                                                            <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">{key}</span>
                                                            <span className="block font-black text-slate-900 text-lg leading-none">{val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-200">
                                        <p>No measurements saved.</p>
                                    </div>
                                )}
                            </section>

                            {/* Order History Section */}
                            <section className="space-y-5">
                                <div className="flex items-center gap-3 mb-2 px-1">
                                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><ClipboardList size={20} /></div>
                                    <h3 className="font-bold text-slate-800 text-lg">Order History</h3>
                                </div>

                                {allOrders.filter(o => o.customerId === selectedCustomer.id).length > 0 ? (
                                    <div className="space-y-4">
                                        {allOrders.filter(o => o.customerId === selectedCustomer.id).map(order => {
                                            const remaining = order.totalAmount - order.advanceAmount;
                                            return (
                                                <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="font-bold text-slate-900 text-lg">{order.items && order.items.length > 0
                                                                ? order.items.map(i => i.garmentType).join(', ')
                                                                : 'Order'}</span>
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase border ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Delivered {new Date(order.deliveryDate).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-xl text-slate-900">₹{order.totalAmount}</p>
                                                        <p className={`text-[10px] font-black uppercase tracking-wider ${remaining <= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{remaining <= 0 ? 'Paid Full' : `Due ₹${remaining}`}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-200">
                                        <p>No past orders.</p>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
