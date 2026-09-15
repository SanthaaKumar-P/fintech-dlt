import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-scale-in"
        onClick={onClose}
      />
      <div className={`relative w-full ${maxWidth} glass-panel animate-scale-in max-h-[85vh] overflow-hidden flex flex-col`}>
        <div className="flex items-start justify-between p-5 border-b border-border-default">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
