import type { ReactNode } from 'react';

type Variant = 'success' | 'warning' | 'error' | 'info' | 'crypto' | 'neutral';

const variants: Record<Variant, string> = {
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  error: 'bg-error/10 text-error border-error/30',
  info: 'bg-accent/10 text-accent border-accent/30',
  crypto: 'bg-crypto/10 text-crypto border-crypto/30',
  neutral: 'bg-bg-tertiary text-text-secondary border-border-default',
};

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: Variant; label: string }> = {
    PROCESSING: { variant: 'info', label: 'PROCESSING' },
    VERIFIED: { variant: 'info', label: 'VERIFIED' },
    CONSENSUS: { variant: 'crypto', label: 'CONSENSUS' },
    COMMITTED: { variant: 'success', label: 'COMMITTED' },
    REJECTED: { variant: 'error', label: 'REJECTED' },
    'HIGH RISK': { variant: 'warning', label: 'HIGH RISK' },
  };
  const cfg = map[status] || { variant: 'neutral' as Variant, label: status };
  return (
    <Badge variant={cfg.variant}>
      <span className={`status-dot ${cfg.variant === 'success' ? 'online' : cfg.variant === 'error' ? 'malicious' : cfg.variant === 'warning' ? 'warning' : ''}`} />
      {cfg.label}
    </Badge>
  );
}
