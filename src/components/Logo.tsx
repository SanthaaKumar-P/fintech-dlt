import { Shield } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { icon: 20, text: 'text-sm', sub: 'text-[10px]' },
    md: { icon: 28, text: 'text-base', sub: 'text-[11px]' },
    lg: { icon: 40, text: 'text-2xl', sub: 'text-xs' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-accent/20 rounded-lg blur-md" />
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-crypto border border-border-light">
          <Shield size={s.icon} className="text-white" strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <div className={`font-bold tracking-tight text-text-primary ${s.text}`}>
          FINSHIELD <span className="text-accent">DLT</span>
        </div>
        <div className={`text-text-muted uppercase tracking-widest ${s.sub}`}>
          Distributed Settlement
        </div>
      </div>
    </div>
  );
}
