
import React, { useState, useEffect } from 'react';
import { Customer, GarmentType, Measurement, Order, OrderStatus } from '../types';
import { db } from '../services/db';
import { GUJARATI_LABELS } from '../constants';
import { Search, UserPlus, Save, ArrowRight, ArrowLeft, Check, Loader, ShoppingBag, Ruler, FileText, User } from 'lucide-react';
import { useToast } from './ToastContext';

import { useNavigate } from 'react-router-dom';

export const OrderCreation: React.FC = () => {
    const navigate = useNavigate();
    const onCancel = () => navigate('/dashboard');
    const onSuccess = (orderId: string) => navigate(`/orders/${orderId}`);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [currentTab, setCurrentTab] = useState<GarmentType>(GarmentType.SHIRT);
    const { showToast } = useToast();

    const [draftMeasurements, setDraftMeasurements] = useState<Record<GarmentType, Record<string, string>>>({
        [GarmentType.SHIRT]: {},
        [GarmentType.PANT]: {},
        [GarmentType.KURTA]: {},
        [GarmentType.SUIT]: {}
    });

    // No changes needed if OrderCreation logic was generic enough, checking file...
    // Actually, let's verify OrderCreation logic first.
    // The file is not open, but previous edits suggest it used db.orders.save.
    // New db.orders.create expects items structure.
    // WE NEED TO UPDATE OrderCreation.tsx.
    const [selectedItems, setSelectedItems] = useState<GarmentType[]>([]);
    const [deliveryDate, setDeliveryDate] = useState<string>('');
    const [totalAmount, setTotalAmount] = useState<string>('');
    const [advanceAmount, setAdvanceAmount] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    const [mobileSearch, setMobileSearch] = useState('');
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerAddress, setNewCustomerAddress] = useState('');

    useEffect(() => {
        const loadMeasurements = async () => {
            if (customer) {
                const loadedData: any = {
                    [GarmentType.SHIRT]: {},
                    [GarmentType.PANT]: {},
                    [GarmentType.KURTA]: {},
                    [GarmentType.SUIT]: {}
                };

                const allMeasurements = await db.measurements.getForCustomer(customer.id);
                allMeasurements.forEach(m => {
                    loadedData[m.garmentType] = { ...m.values };
                });

                setDraftMeasurements(loadedData);
            }
        };
        loadMeasurements();
    }, [customer]);

    useEffect(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setDeliveryDate(d.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (step === 3 && selectedItems.length === 0) {
            setSelectedItems([currentTab]);
        }
    }, [step, currentTab, selectedItems]);

    const handleCustomerSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMobileSearch(val);
        if (val.length === 10) {
            const found = await db.customers.findByMobile(val);
            if (found) {
                setCustomer(found);
                setIsNewCustomer(false);
                showToast(`Customer Found: ${found.name}`, 'success');
            } else {
                setCustomer(null);
                setIsNewCustomer(true);
                showToast('New customer detected', 'info');
            }
        } else {
            setCustomer(null);
            setIsNewCustomer(false);
        }
    };

    const handleSaveCustomer = async () => {
        if (mobileSearch.length !== 10 || !newCustomerName.trim()) return;

        try {
            const newC = await db.customers.save({
                name: newCustomerName,
                mobile: mobileSearch,
                address: newCustomerAddress
            });
            setCustomer(newC);
            setIsNewCustomer(false);
            showToast('Customer saved successfully!', 'success');
        } catch (e: any) {
            showToast('Could not save customer. Try again.', 'error');
            console.error(e);
        }
    };

    const handleMeasurementChange = (field: string, val: string) => {
        setDraftMeasurements(prev => ({
            ...prev,
            [currentTab]: {
                ...prev[currentTab],
                [field]: val
            }
        }));
    };

    const toggleItemSelection = (type: GarmentType) => {
        setSelectedItems(prev => {
            if (prev.includes(type)) return prev.filter(t => t !== type);
            return [...prev, type];
        });
    };

    const handleSaveOrder = async () => {
        if (!customer) return;
        if (selectedItems.length === 0) {
            showToast("Please select at least one item to order.", 'error');
            return;
        }
        setIsSaving(true);

        try {
            const savePromises = Object.values(GarmentType).map(async (gType) => {
                const data = draftMeasurements[gType];
                const hasData = Object.values(data).some(val => val && String(val).trim().length > 0);

                if (hasData) {
                    return db.measurements.save({
                        customerId: customer.id,
                        garmentType: gType,
                        values: data
                    });
                }
            });

            await Promise.all(savePromises);

            // Calculate generic price or 0 for now (Feature Request: Price List)
            const orderId = await db.orders.create({
                customerId: customer.id,
                deliveryDate,
                items: selectedItems.map(type => ({
                    garmentType: type,
                    qty: 1,
                    price: parseFloat(totalAmount) / selectedItems.length // splitting total across items for now
                })),
                advance: parseFloat(advanceAmount) || 0
            });

            showToast('Order created successfully!', 'success');
            onSuccess(orderId);
        } catch (error) {
            console.error("Failed to save order", error);
            showToast("Failed to save order. Please check your connection.", 'error');
            setIsSaving(false);
        }
    };

    const Stepper = () => (
        <div className="flex items-center justify-center mb-10">
            <div className="flex items-center w-full max-w-xs relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
                <div className="absolute top-1/2 left-0 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>

                <div className="flex justify-between w-full">
                    {[1, 2, 3].map((i) => {
                        const isCompleted = step > i;
                        const isActive = step === i;
                        return (
                            <div key={i} className={`flex flex-col items-center gap-2`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 transition-all duration-300 z-10 bg-white ${isActive
                                    ? 'border-indigo-600 text-indigo-600 scale-110 shadow-lg shadow-indigo-200'
                                    : isCompleted
                                        ? 'border-indigo-600 bg-indigo-600 text-white'
                                        : 'border-slate-200 text-slate-300'
                                    }`}>
                                    {isCompleted ? <Check size={18} strokeWidth={3} /> : i}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 md:bg-transparent animate-fade-in">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-200/60 flex items-center justify-between sticky top-0 z-20">
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-900 font-bold transition-colors text-sm px-2 py-1 hover:bg-slate-100 rounded-lg">Cancel</button>
                <h2 className="font-extrabold text-lg text-slate-900 tracking-tight">New Order</h2>
                <div className="w-16"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-2xl mx-auto">
                    <Stepper />

                    {/* Step 1: Customer */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-8">
                                <h3 className="text-3xl font-extrabold text-slate-900 mb-2">Find Customer</h3>
                                <p className="text-slate-500 font-medium">Search by mobile number to start</p>
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
                                <label className="block mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Mobile Number</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        value={mobileSearch}
                                        onChange={handleCustomerSearch}
                                        placeholder="98765 43210"
                                        className="block w-full rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-0 h-20 px-6 text-3xl tracking-widest font-mono text-slate-900 placeholder:text-slate-300 transition-colors font-bold"
                                        autoFocus
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none text-slate-300">
                                        <Search size={32} />
                                    </div>
                                </div>
                            </div>

                            {customer && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 flex justify-between items-center animate-fade-in shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-xl">{customer.name}</h3>
                                            <p className="text-emerald-700 font-mono font-medium">{customer.mobile}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep(2)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white w-14 h-14 rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                                    >
                                        <ArrowRight size={24} />
                                    </button>
                                </div>
                            )}

                            {isNewCustomer && mobileSearch.length === 10 && (
                                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-xl shadow-slate-200/50 animate-fade-in relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
                                    <div className="flex items-center gap-3 text-indigo-700 font-bold text-xl mb-2">
                                        <UserPlus size={24} />
                                        <span>New Customer</span>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={newCustomerName}
                                                onChange={e => setNewCustomerName(e.target.value)}
                                                className="block w-full rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-14 px-5 font-bold text-lg text-slate-900 transition-all"
                                                placeholder="Enter name"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Address</label>
                                            <input
                                                type="text"
                                                value={newCustomerAddress}
                                                onChange={e => setNewCustomerAddress(e.target.value)}
                                                className="block w-full rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-14 px-5 font-medium text-lg text-slate-900 transition-all"
                                                placeholder="House / Area (Optional)"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveCustomer}
                                        disabled={!newCustomerName}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 hover:shadow-xl transition-all active:scale-95"
                                    >
                                        Save & Continue
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Measurements */}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            <div className="flex items-center justify-between mb-8">
                                <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 transition-colors p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm"><ArrowLeft /></button>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-slate-900">Measurements</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{customer?.name}</p>
                                </div>
                                <button onClick={() => setStep(3)} className="bg-indigo-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">Next <ArrowRight size={18} /></button>
                            </div>

                            {/* Garment Selector */}
                            <div className="grid grid-cols-4 gap-2 mb-8 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                                {Object.values(GarmentType).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setCurrentTab(type)}
                                        className={`py-3 px-1 rounded-xl text-xs sm:text-sm font-bold text-center border transition-all duration-200 ${currentTab === type
                                            ? 'bg-slate-900 text-white shadow-md transform scale-[1.02]'
                                            : 'bg-transparent text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {/* Measurements Form */}
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6 opacity-50">
                                    <Ruler size={20} className="text-slate-400" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Enter Values in Inches</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    {GUJARATI_LABELS[currentTab].map((label) => (
                                        <div key={label} className="flex items-center justify-between group">
                                            <label className="text-slate-600 font-bold text-lg group-hover:text-indigo-600 transition-colors">{label}</label>
                                            <div className="w-32">
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    value={draftMeasurements[currentTab]?.[label] || ''}
                                                    onChange={(e) => handleMeasurementChange(label, e.target.value)}
                                                    className="w-full bg-slate-50 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-12 px-3 text-xl font-mono font-bold text-slate-900 transition-all text-center placeholder:text-slate-300"
                                                    placeholder="-"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Order Details */}
                    {step === 3 && (
                        <div className="animate-fade-in pb-24">
                            <div className="flex items-center justify-between mb-8">
                                <button onClick={() => setStep(2)} className="text-slate-400 hover:text-slate-600 p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm"><ArrowLeft /></button>
                                <h3 className="text-2xl font-black text-slate-900">Finalize Order</h3>
                                <div className="w-10"></div>
                            </div>

                            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-8">

                                {/* ITEM SELECTION CHECKBOXES */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-lg">
                                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><ShoppingBag size={20} /></div>
                                        <span>Select Items</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.values(GarmentType).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => toggleItemSelection(type)}
                                                className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-between ${selectedItems.includes(type)
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <span className="text-base">{type}</span>
                                                {selectedItems.includes(type) && <div className="bg-indigo-600 text-white rounded-full p-0.5"><Check size={14} strokeWidth={3} /></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Delivery Date</label>
                                        <input
                                            type="date"
                                            value={deliveryDate}
                                            onChange={(e) => setDeliveryDate(e.target.value)}
                                            className="block w-full rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-14 px-4 text-lg font-medium text-slate-900 transition-all cursor-pointer"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Total (₹)</label>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={totalAmount}
                                                onChange={(e) => setTotalAmount(e.target.value)}
                                                placeholder="0"
                                                className="block w-full rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-16 px-4 text-3xl font-black text-slate-900 transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Advance (₹)</label>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={advanceAmount}
                                                onChange={(e) => setAdvanceAmount(e.target.value)}
                                                placeholder="0"
                                                className="block w-full rounded-xl bg-emerald-50 border-emerald-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 h-16 px-4 text-3xl font-black text-emerald-600 transition-all placeholder:text-emerald-200/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-2xl p-6 flex justify-between items-center shadow-lg shadow-slate-200">
                                    <span className="text-slate-400 font-bold text-sm uppercase tracking-wider">Balance Due</span>
                                    <span className="text-4xl font-black text-white tracking-tight">
                                        ₹{Math.max(0, (parseFloat(totalAmount) || 0) - (parseFloat(advanceAmount) || 0))}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={handleSaveOrder}
                                    disabled={!totalAmount || !deliveryDate || isSaving}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none text-white font-bold h-16 rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transform transition-all active:scale-[0.99] flex items-center justify-center gap-3 text-lg"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader className="animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={24} /> Confirm Order
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
