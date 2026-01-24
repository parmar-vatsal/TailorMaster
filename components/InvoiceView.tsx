
import React, { useState, useEffect, useRef } from 'react';
import { Order, Customer, Measurement, AppConfig, GarmentType } from '../types';
import { db } from '../services/db';
import { ArrowLeft, Printer, Scissors, AlertTriangle, Ruler, FileText, Loader2, Share2, Download, CheckCircle2, Phone, MapPin } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useToast } from './ToastContext';

import { useNavigate } from 'react-router-dom';

interface InvoiceViewProps {
    orderId: string;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ orderId }) => {
    const navigate = useNavigate();
    const onBack = () => navigate('/orders');
    const [order, setOrder] = useState<Order | undefined>(undefined);
    const [customer, setCustomer] = useState<Customer | undefined>(undefined);
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [config, setConfig] = useState<AppConfig>({ shopName: '', pin: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showInstruction, setShowInstruction] = useState(false);
    const invoiceRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            try {
                const o = await db.orders.get(orderId);
                if (o) {
                    const [c, conf] = await Promise.all([
                        db.customers.get(o.customerId),
                        db.config.get()
                    ]);

                    // Fetch measurements using the robust query logic or items snapshot if available
                    // New schema has measurement_snapshot in items, but we might also fetch current.
                    // For Invoice, we usually want current or the ones used. 
                    // Let's assume fetching current by customer for now.
                    const measList: Measurement[] = await db.measurements.getForCustomer(o.customerId);

                    setOrder(o);
                    setCustomer(c || undefined);
                    setMeasurements(measList);
                    setConfig(conf);
                } else {
                    setError(true);
                }
            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [orderId]);

    const handleWhatsAppShare = async () => {
        if (!invoiceRef.current || !customer || !order) return;
        setGenerating(true);
        showToast('Starting PDF generation...', 'info');

        try {
            // --- PREPARE DATE-BASED PATH ---
            const orderDate = new Date(order.createdAt);
            const dateStr = orderDate.toISOString().split('T')[0];

            // --- 1. CHECK EXISTING INVOICE IN STORAGE ---
            const existingPath = await db.storage.findExistingInvoice(dateStr, order.id);

            if (existingPath) {
                showToast('Invoice found, opening WhatsApp...', 'success');
                const publicUrl = db.storage.getPublicUrl(existingPath);

                // Open WhatsApp with Existing Link
                const remaining = order.totalAmount - order.advanceAmount;
                let waNumber = customer.mobile.replace(/\D/g, '');
                if (waNumber.length === 10) waNumber = `91${waNumber}`;

                const message = `*INVOICE: ${config.shopName}*\n\n` +
                    `Hello ${customer.name},\n` +
                    `Here is your receipt #${order.id.slice(-5)}.\n` +
                    `Amount Due: ₹${Math.max(0, remaining)}\n\n` +
                    `📄 *View Invoice:* \n${publicUrl}`;

                const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

                setTimeout(() => {
                    window.open(waUrl, '_blank');
                    setGenerating(false);
                }, 800);
                return;
            }

            // --- 2. GENERATE NEW IF NOT FOUND ---
            await document.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 300));

            const element = invoiceRef.current;

            // Capture High Quality Image
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: 1200,
                scrollY: -window.scrollY,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('invoice-card-content');
                    if (clonedElement) {
                        const fixedWidth = '794px';
                        clonedElement.style.width = fixedWidth;
                        clonedElement.style.minWidth = fixedWidth;
                        clonedElement.style.maxWidth = fixedWidth;
                        clonedElement.style.height = 'auto';
                        clonedElement.style.minHeight = '0';
                        clonedElement.style.margin = '0';
                        clonedElement.style.padding = '0';
                        clonedElement.style.border = 'none';
                        clonedElement.style.boxShadow = 'none';
                        clonedElement.style.overflow = 'visible';
                        clonedElement.style.position = 'relative';
                        (clonedElement.style as any).webkitFontSmoothing = 'antialiased';
                    }
                }
            });

            // Generate PDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const pdfWidth = 210;
            const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            // Filename
            const cleanName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `Invoice_${order.id.slice(-5)}_${cleanName}.pdf`;
            const pdfBlob = pdf.output('blob');

            // 3. Upload to Supabase Storage
            const path = `${dateStr}/${order.id}.pdf`;

            const { error: uploadError } = await db.storage.uploadInvoice(pdfBlob, path);

            // --- ERROR HANDLING & FALLBACK ---
            if (uploadError) {
                console.warn("Upload failed, falling back.", uploadError);
                showToast('Cloud upload failed. Downloading file instead.', 'info');

                // A) Download the file immediately
                pdf.save(fileName);

                // B) Prepare WhatsApp Text
                let waNumber = customer.mobile.replace(/\D/g, '');
                if (waNumber.length === 10) waNumber = `91${waNumber}`;

                const message = `*INVOICE: ${config.shopName}*\n\n` +
                    `Hello ${customer.name},\n` +
                    `Please find your invoice attached.\n` +
                    `Receipt #${order.id.slice(-5)}`;

                const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

                // C) Show Instruction Overlay
                setShowInstruction(true);

                setTimeout(() => {
                    window.open(waUrl, '_blank');
                    setGenerating(false);
                    setTimeout(() => setShowInstruction(false), 15000);
                }, 1000);
                return;
            }

            // 4. Get Public Link
            const publicUrl = db.storage.getPublicUrl(path);

            // 5. Open WhatsApp with Link
            const remaining = order.totalAmount - order.advanceAmount;
            let waNumber = customer.mobile.replace(/\D/g, '');
            if (waNumber.length === 10) waNumber = `91${waNumber}`;

            const message = `*INVOICE: ${config.shopName}*\n\n` +
                `Hello ${customer.name},\n` +
                `Here is your receipt #${order.id.slice(-5)}.\n` +
                `Amount Due: ₹${Math.max(0, remaining)}\n\n` +
                `📄 *View Invoice:* \n${publicUrl}`;

            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

            showToast('PDF Generated! Opening WhatsApp...', 'success');
            setTimeout(() => {
                window.open(waUrl, '_blank');
                setGenerating(false);
            }, 800);

        } catch (e: any) {
            console.error("Share failed", e);
            showToast(`Error: ${e.message}`, 'error');
            setGenerating(false);
        }
    };

    const handlePrint = () => window.print();

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div></div>;

    if (error || !order) return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="bg-red-50 p-4 rounded-full text-red-500 mb-4"><AlertTriangle size={32} /></div>
            <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
            <button onClick={onBack} className="bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold mt-4">Go Back</button>
        </div>
    );

    const remaining = order.totalAmount - order.advanceAmount;
    const isPaid = remaining <= 0;

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">

            {/* Fallback Instruction Overlay */}
            {showInstruction && (
                <div className="fixed inset-0 z-[60] bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl transform scale-100 md:scale-105">
                        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-orange-50">
                            <Download size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">PDF Downloaded</h3>
                        <p className="text-slate-500 mb-6 text-sm font-medium leading-relaxed">
                            We couldn't generate a public link.<br />
                            <span className="text-slate-800 font-bold">Please attach the downloaded PDF manually in WhatsApp.</span>
                        </p>
                        <button onClick={() => setShowInstruction(false)} className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl active:scale-95 transition-transform">
                            I Understand
                        </button>
                    </div>
                </div>
            )}

            {/* Top Bar - Simplified for cleaner look */}
            <div className="bg-white px-4 py-4 shadow-sm border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors">
                    <div className="bg-slate-50 p-2.5 rounded-xl"><ArrowLeft size={18} /></div>
                    <span className="hidden md:inline">Back</span>
                </button>
                <h2 className="text-base font-bold text-slate-500 uppercase tracking-widest hidden md:block">Invoice View</h2>
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="p-3 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="Print Invoice">
                        <Printer size={20} />
                    </button>
                    <button
                        onClick={handleWhatsAppShare}
                        disabled={generating}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all min-w-[140px] justify-center"
                    >
                        {generating ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
                        <span>{generating ? 'Sending...' : 'Share PDF'}</span>
                    </button>
                </div>
            </div>

            {/* Invoice View Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-12 flex justify-center bg-slate-50">

                {/* Container - Constrained width on screen, but scales in PDF via capture settings */}
                <div className="w-full max-w-[750px] mx-auto">

                    {/* INVOICE CARD */}
                    <div
                        ref={invoiceRef}
                        id="invoice-card-content"
                        className="bg-white shadow-xl text-slate-900 mx-auto relative overflow-hidden flex flex-col min-h-[900px]"
                        style={{ borderRadius: '0' }} // Sharp corners for professional look
                    >
                        {/* 1. BRAND HEADER */}
                        <div className="bg-slate-900 text-white p-12 pb-16 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <h1 className="text-3xl font-black uppercase tracking-tight mb-2">{config.shopName || "TAILOR MASTER"}</h1>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">Professional Tailoring Service</p>

                                    {/* Decorative line */}
                                    <div className="w-12 h-1 bg-indigo-500 rounded-full"></div>
                                </div>

                                {/* Logo Box */}
                                <div className="w-20 h-20 bg-white p-1 rounded-2xl shadow-lg transform rotate-3">
                                    <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100">
                                        {config.logo ? (
                                            <img src={config.logo} className="w-full h-full object-cover" />
                                        ) : (
                                            <Scissors size={32} className="text-slate-800" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. INVOICE INFO STRIP */}
                        <div className="mx-8 -mt-8 relative z-20 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-wrap gap-y-4">
                            <div className="w-1/2 md:w-1/3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt No.</p>
                                <p className="font-mono font-bold text-lg text-slate-800">#{order.id.slice(-5)}</p>
                            </div>
                            <div className="w-1/2 md:w-1/3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                <p className="font-bold text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="w-full md:w-1/3 flex items-center md:justify-end gap-2 text-indigo-600">
                                <CheckCircle2 size={16} />
                                <span className="text-xs font-bold uppercase tracking-wide">Verified Order</span>
                            </div>
                        </div>

                        {/* 3. CUSTOMER & ORDER DETAILS */}
                        <div className="p-10 pb-6">
                            <div className="flex flex-col md:flex-row gap-8 mb-10">
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FileText size={14} /> Billed To
                                    </h3>
                                    <div className="pl-4 border-l-2 border-indigo-100">
                                        <p className="text-xl font-bold text-slate-900 mb-1">{customer?.name}</p>
                                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                            <Phone size={14} /> {customer?.mobile}
                                        </p>
                                        {customer?.address && (
                                            <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-1">
                                                <MapPin size={14} /> {customer.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Scissors size={14} /> Order Items
                                    </h3>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-slate-800 text-lg">
                                                {order.items?.map(i => i.garmentType).join(', ') || 'Custom Order'}
                                            </span>
                                            <span className="font-bold text-slate-900">₹{order.totalAmount}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. MEASUREMENTS */}
                            {measurements.length > 0 && (
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-px flex-1 bg-slate-100"></div>
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                            <Ruler size={14} /> Measurement Details
                                        </span>
                                        <div className="h-px flex-1 bg-slate-100"></div>
                                    </div>

                                    <div className="grid gap-4">
                                        {measurements.map((m) => (
                                            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-0 overflow-hidden">
                                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                                    <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">{m.garmentType}</span>
                                                </div>
                                                <div className="p-4 flex flex-wrap gap-2">
                                                    {Object.entries(m.values).map(([key, val]) => val && (
                                                        <div key={key} className="border border-slate-100 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px] bg-white">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">{key}</span>
                                                            <span className="text-sm font-bold text-slate-900 leading-none">{val as React.ReactNode}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 5. FOOTER FINANCIALS */}
                        <div className="mt-auto bg-slate-50 p-10 pt-8 border-t border-slate-100">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-6">

                                <div className="text-left w-full md:w-auto">
                                    <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed mb-4">
                                        Thank you for your business. Please keep this receipt for delivery.
                                    </p>
                                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                        Authorized Signature
                                    </div>
                                </div>

                                <div className="w-full md:w-auto min-w-[240px]">
                                    <div className="flex justify-between items-center mb-3 text-sm">
                                        <span className="font-semibold text-slate-500">Subtotal</span>
                                        <span className="font-bold text-slate-800">₹{order.totalAmount}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4 text-sm">
                                        <span className="font-semibold text-emerald-600">Advance</span>
                                        <span className="font-bold text-emerald-600">- ₹{order.advanceAmount}</span>
                                    </div>

                                    <div className="border-t-2 border-dashed border-slate-200 pt-3 flex justify-between items-center relative">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Due</p>
                                            <p className="text-3xl font-black text-slate-900 tracking-tight">₹{Math.max(0, remaining)}</p>
                                        </div>

                                        {/* REFINED PAID/UNPAID STAMP */}
                                        <div className={`border-2 rounded-lg px-3 py-1 flex items-center justify-center transform -rotate-6 ${isPaid
                                            ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                                            : 'border-rose-500 text-rose-600 bg-rose-50'
                                            }`}>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                                                {isPaid ? 'PAID FULL' : 'PAYMENT DUE'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. BOTTOM BAR */}
                        <div className="bg-slate-900 text-slate-600 p-3 text-center text-[10px] font-mono uppercase tracking-widest">
                            Powered by TailorMaster App
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};
