
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Design } from '../types';
import { Plus, Trash2, Image as ImageIcon, Loader2, X, Filter } from 'lucide-react';
import { useToast } from './ToastContext';

export const DesignCatalog: React.FC = () => {
    const [designs, setDesigns] = useState<Design[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingState, setUploadingState] = useState(false);
    const { showToast } = useToast();

    // Form
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Shirt');
    const [filterCat, setFilterCat] = useState('All');

    useEffect(() => {
        loadDesigns();
    }, []);

    const loadDesigns = async () => {
        try {
            const data = await db.designs.list();
            setDesigns(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selected);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;
        setUploadingState(true);
        try {
            const newDesign = await db.designs.upload({
                file,
                category,
                title
            });
            if (newDesign) {
                setDesigns(prev => [newDesign, ...prev]);
                showToast('Design uploaded successfully', 'success');
            } else {
                throw new Error("Upload returned no data");
            }
            setIsUploading(false);
            setFile(null);
            setPreview('');
            setTitle('');
        } catch (err: any) {
            console.error(err);
            showToast('Upload failed: ' + err.message, 'error');
        } finally {
            setUploadingState(false);
        }
    };

    const handleDelete = async (id: string, url: string) => {
        if (!window.confirm("Delete this design?")) return;
        try {
            await db.designs.delete(id);
            setDesigns(prev => prev.filter(d => d.id !== id));
            showToast('Design deleted', 'info');
        } catch (e) {
            showToast('Delete failed', 'error');
        }
    };

    const categories = ['Shirt', 'Pant', 'Kurta', 'Suit', 'Other'];
    const filteredDesigns = filterCat === 'All' ? designs : designs.filter(d => d.category === filterCat);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading Catalog...</div>;

    return (
        <div className="p-4 md:p-0 space-y-6 pb-24 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Design Catalog</h2>
                    <p className="text-slate-500 font-medium">Showcase for customers</p>
                </div>
                <button
                    onClick={() => setIsUploading(!isUploading)}
                    className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                >
                    <Plus size={24} className={isUploading ? 'rotate-45 transition-transform' : 'transition-transform'} />
                </button>
            </div>

            {isUploading && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={handleUpload} className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative">
                        <button
                            type="button"
                            onClick={() => setIsUploading(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="font-bold text-xl text-slate-900 mb-6">Upload Design</h3>

                        <div className="space-y-4">
                            <div className="w-full h-48 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
                                {preview ? (
                                    <img src={preview} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                                        <span className="text-xs font-bold uppercase">Tap to Select Photo</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. Mandarin Collar Shirt"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200 focus:border-indigo-500 outline-none"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={uploadingState || !file}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {uploadingState ? <Loader2 className="animate-spin" /> : 'Upload Photo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => setFilterCat('All')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filterCat === 'All' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}
                >
                    All Designs
                </button>
                {categories.map(c => (
                    <button
                        key={c}
                        onClick={() => setFilterCat(c)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filterCat === c ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredDesigns.map(design => (
                    <div key={design.id} className="bg-white rounded-2xl p-2 border border-slate-100 shadow-sm group relative">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-3 relative">
                            <img src={design.imageUrl} alt={design.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => handleDelete(design.id, design.imageUrl)} className="bg-white p-2 rounded-full text-rose-500 hover:bg-rose-50 transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="px-1">
                            <h3 className="font-bold text-slate-900 text-sm truncate">{design.title}</h3>
                            <p className="text-xs font-medium text-slate-400">{design.category}</p>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDesigns.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                    <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No designs in this category.</p>
                </div>
            )}
        </div>
    );
};
