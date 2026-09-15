import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Lock, Boxes, Network, Activity } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-crypto/10 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-2xl text-center px-6">
        <div className="flex justify-center mb-8 animate-scale-in">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/30 rounded-2xl blur-xl animate-pulse-glow" />
            <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-crypto border border-border-light">
              <Shield size={48} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-text-primary mb-3 animate-slide-up">
          FINSHIELD <span className="text-accent">DLT</span>
        </h1>
        <p className="text-lg text-text-secondary uppercase tracking-widest mb-2 animate-slide-up">
          Secure Distributed Financial Settlement
        </p>
        <p className="text-sm text-text-muted mb-10 max-w-lg mx-auto animate-slide-up">
          Cryptographic trust. Distributed validation. Tamper-evident settlement.
        </p>

        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { icon: Lock, label: 'RSA-2048 Signatures' },
            { icon: Boxes, label: 'Blockchain Ledger' },
            { icon: Network, label: '4-Node PBFT' },
            { icon: Activity, label: 'Real-time Security' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-lg glass-panel text-xs text-text-secondary animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <item.icon size={14} className="text-accent" />
              {item.label}
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/overview')}
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-white font-bold text-base border border-accent/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
        >
          ENTER SECURITY CONSOLE
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="text-xs text-text-muted mt-8 max-w-md mx-auto">
          FinShield DLT is an educational simulation of distributed financial security concepts and is not intended for production financial transactions.
        </p>
      </div>

      <div className="absolute bottom-6 left-6">
        <Logo size="sm" />
      </div>
    </div>
  );
}
