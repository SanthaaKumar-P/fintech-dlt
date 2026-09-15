import { Cpu, ArrowRight, ArrowDown, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardBody } from '@/components/Card';

const layers = [
  { label: 'USER', icon: 'User', color: 'text-text-primary', bg: 'bg-bg-tertiary' },
  { label: 'REACT FRONTEND', icon: 'Monitor', color: 'text-accent', bg: 'bg-accent/10' },
  { label: 'API GATEWAY', icon: 'Server', color: 'text-accent-glow', bg: 'bg-accent/10' },
  { label: 'BANK A / B / C / D', icon: 'Network', color: 'text-success', bg: 'bg-success/10' },
  { label: 'CONSENSUS ENGINE', icon: 'Users', color: 'text-crypto', bg: 'bg-crypto/10' },
  { label: 'BLOCKCHAIN LEDGER', icon: 'Boxes', color: 'text-crypto', bg: 'bg-crypto/10' },
  { label: 'DATABASE', icon: 'Database', color: 'text-warning', bg: 'bg-warning/10' },
  { label: 'SECURITY + AUDIT', icon: 'ShieldCheck', color: 'text-error', bg: 'bg-error/10' },
];

const components = [
  { label: 'REST API', desc: 'Clean modular endpoints for transactions, blocks, nodes, and attacks', icon: 'Server' },
  { label: 'Cryptography', desc: 'RSA-2048 key pairs, SHA-256 hashing, digital signatures', icon: 'Lock' },
  { label: 'Consensus', desc: 'PBFT-style quorum with 2f+1 fault tolerance (f=1)', icon: 'Users' },
  { label: 'Database', desc: 'Supabase/PostgreSQL with RLS policies', icon: 'Database' },
  { label: 'Audit', desc: 'Immutable audit trail for every significant action', icon: 'ScrollText' },
];

export function Architecture() {
  const { explainMode } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">System Architecture</h1>
        <p className="text-sm text-text-secondary">
          End-to-end flow of the FinShield DLT distributed settlement network
        </p>
      </div>

      {explainMode && (
        <Card className="p-4 border-crypto/30 bg-crypto/5">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-crypto flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-crypto">Architecture:</span> The system follows a layered design where each layer has a single responsibility. The frontend never directly modifies blockchain state — all mutations flow through the engine, which enforces cryptographic verification, consensus, and audit logging.
            </p>
          </div>
        </Card>
      )}

      {/* Architecture flow */}
      <Card>
        <CardHeader
          title="System Flow"
          subtitle="Request path through the distributed network"
          icon={<Cpu size={16} className="text-accent" />}
        />
        <CardBody>
          <div className="flex flex-col items-center gap-2 py-4">
            {layers.map((layer, i) => (
              <div key={i} className="flex flex-col items-center gap-2 w-full max-w-md">
                <div className={`flex items-center gap-3 px-6 py-4 rounded-xl border border-border-default ${layer.bg} w-full`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-bg-secondary ${layer.color}`}>
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                  <span className={`text-sm font-bold ${layer.color}`}>{layer.label}</span>
                </div>
                {i < layers.length - 1 && (
                  <ArrowDown size={18} className="text-text-muted" />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Component breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((comp, i) => (
          <Card key={i} hover className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-tertiary flex-shrink-0">
                <Cpu size={18} className="text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1">{comp.label}</h3>
                <p className="text-xs text-text-secondary">{comp.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Data flow infographic */}
      <Card>
        <CardHeader
          title="Why Distributed Validation Matters"
          subtitle="Single node vs. multiple validators"
          icon={<Info size={16} className="text-accent" />}
        />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-error/5 border border-error/20">
              <h4 className="text-sm font-bold text-error mb-3">ONE NODE</h4>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-error/10 border border-error/30">
                  <span className="text-error font-bold">1</span>
                </div>
                <ArrowRight size={16} className="text-error" />
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-error/10 border border-error/30">
                  <span className="text-error font-bold">✓</span>
                </div>
              </div>
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• Single point of failure</li>
                <li>• No Byzantine fault tolerance</li>
                <li>• Cannot detect malicious behavior</li>
                <li>• No distributed trust</li>
              </ul>
            </div>
            <div className="p-5 rounded-xl bg-success/5 border border-success/20">
              <h4 className="text-sm font-bold text-success mb-3">MULTIPLE VALIDATORS</h4>
              <div className="flex items-center gap-2 mb-3">
                {['A', 'B', 'C', 'D'].map((n) => (
                  <div key={n} className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10 border border-success/30">
                    <span className="text-success font-bold text-xs">{n}</span>
                  </div>
                ))}
                <ArrowRight size={16} className="text-success" />
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-success/10 border border-success/30">
                  <span className="text-success font-bold">✓</span>
                </div>
              </div>
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• Tolerates f=1 faulty node (PBFT 2f+1)</li>
                <li>• Byzantine fault tolerance</li>
                <li>• Detects malicious validators</li>
                <li>• Distributed cryptographic trust</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Disclaimer */}
      <Card className="p-4 border-border-default/50">
        <p className="text-xs text-text-muted text-center">
          FinShield DLT is an educational simulation of distributed financial security concepts and is not intended for production financial transactions.
        </p>
      </Card>
    </div>
  );
}
