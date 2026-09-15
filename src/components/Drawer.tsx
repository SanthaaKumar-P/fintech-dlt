import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative w-full max-w-xl glass-panel animate-slide-in-right h-full overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-start justify-between p-5 border-b border-border-default bg-bg-secondary/95 backdrop-blur-md">
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
            <div className="p-5">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
