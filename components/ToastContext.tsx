
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md animate-fade-in
              min-w-[300px] max-w-md w-full transform transition-all duration-300
              ${toast.type === 'success' ? 'bg-white/95 border-emerald-100 text-emerald-800' : ''}
              ${toast.type === 'error' ? 'bg-white/95 border-rose-100 text-rose-800' : ''}
              ${toast.type === 'info' ? 'bg-white/95 border-slate-100 text-slate-800' : ''}
            `}
          >
            <div className={`
              p-1.5 rounded-full shrink-0
              ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : ''}
              ${toast.type === 'error' ? 'bg-rose-100 text-rose-600' : ''}
              ${toast.type === 'info' ? 'bg-slate-100 text-slate-600' : ''}
            `}>
              {toast.type === 'success' && <CheckCircle2 size={16} strokeWidth={3} />}
              {toast.type === 'error' && <AlertCircle size={16} strokeWidth={3} />}
              {toast.type === 'info' && <AlertCircle size={16} strokeWidth={3} />}
            </div>
            
            <p className="flex-1 text-sm font-bold leading-tight">{toast.message}</p>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors opacity-50 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
