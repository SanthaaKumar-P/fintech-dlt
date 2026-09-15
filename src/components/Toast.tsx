import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

let toastId = 0;
const listeners: ((toast: Toast) => void)[] = [];

export function showToast(message: string, type: Toast['type'] = 'info') {
  const toast: Toast = { id: `toast-${++toastId}`, message, type };
  listeners.forEach((l) => l(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    };
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  const icons = {
    success: <CheckCircle2 size={18} className="text-success" />,
    warning: <AlertTriangle size={18} className="text-warning" />,
    error: <XCircle size={18} className="text-error" />,
    info: <Info size={18} className="text-accent" />,
  };

  const borders = {
    success: 'border-success/40',
    warning: 'border-warning/40',
    error: 'border-error/40',
    info: 'border-accent/40',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass-panel animate-slide-up p-4 flex items-start gap-3 ${borders[toast.type]}`}
        >
          {icons[toast.type]}
          <p className="text-sm text-text-primary flex-1">{toast.message}</p>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-text-muted hover:text-text-primary"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
