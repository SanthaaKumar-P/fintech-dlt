import { useMemo, useState } from 'react';
import {
  Activity,
  Users,
  ArrowLeftRight,
  Boxes,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Network,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardBody } from '@/components/Card';
import { Badge, StatusBadge } from '@/components/Badge';
import { NetworkTopology } from '@/components/NetworkTopology';
import { TransactionDrawer } from '@/components/TransactionDrawer';
import { shortHash } from '@/lib/crypto';
import type { TxRow } from '@/lib/engine';
import { useNavigate } from 'react-router-dom';

function KpiCard({
  icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}) {
  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-text-primary mb-1">{value}</div>
      <div className="text-xs text-text-muted uppercase tracking-wider">{label}</div>
      {sublabel && <div className="text-xs text-text-secondary mt-1">{sublabel}</div>}
    </Card>
  );
}

export function Overview() {
  const { nodes, transactions, blocks, securityEvents, loading } = useApp();
  const [selectedTx, setSelectedTx] = useState<TxRow | null>(null);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const onlineCount = nodes.filter((n) => n.online).length;
    const healthPercent = nodes.length > 0 ? ((onlineCount / nodes.length) * 100).toFixed(1) : '0';
    const committedCount = transactions.filter((t) => t.status === 'COMMITTED').length;
    const rejectedCount = transactions.filter((t) => t.status === 'REJECTED').length;
    const blockHeight = blocks.length > 0 ? blocks[blocks.length - 1].block_number : 0;
    const securityEventCount = securityEvents.length;
    const consensusAttempts = transactions.filter((t) =>
      ['COMMITTED', 'REJECTED'].includes(t.status),
    ).length;
    const consensusSuccess = consensusAttempts > 0
      ? ((committedCount / consensusAttempts) * 100).toFixed(1)
      : '100.0';

    return {
      healthPercent,
      onlineCount,
      committedCount,
      rejectedCount,
      blockHeight,
      securityEventCount,
      consensusSuccess,
    };
  }, [nodes, transactions, blocks, securityEvents]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-text-primary mb-1">FINSHIELD DLT</h1>
        <p className="text-text-secondary text-sm">
          Secure Distributed Financial Settlement Network
        </p>
        <p className="text-text-muted text-xs mt-1">
          Cryptographic trust. Distributed validation. Tamper-evident settlement.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={<Activity size={20} className="text-success" />}
          label="Network Health"
          value={`${stats.healthPercent}%`}
          sublabel={`${stats.onlineCount}/${nodes.length} nodes online`}
          color="bg-success/10"
        />
        <KpiCard
          icon={<Users size={20} className="text-accent" />}
          label="Active Validators"
          value={`${stats.onlineCount}/${nodes.length}`}
          sublabel="PBFT quorum: 3"
          color="bg-accent/10"
        />
        <KpiCard
          icon={<ArrowLeftRight size={20} className="text-crypto" />}
          label="Settled Transactions"
          value={stats.committedCount}
          sublabel={`${stats.rejectedCount} rejected`}
          color="bg-crypto/10"
        />
        <KpiCard
          icon={<Boxes size={20} className="text-accent-glow" />}
          label="Block Height"
          value={`#${stats.blockHeight}`}
          sublabel={`${blocks.length} blocks`}
          color="bg-accent/10"
        />
        <KpiCard
          icon={<ShieldAlert size={20} className="text-warning" />}
          label="Security Events"
          value={stats.securityEventCount}
          sublabel={
            securityEvents.filter((e) => e.severity === 'CRITICAL').length > 0
              ? `${securityEvents.filter((e) => e.severity === 'CRITICAL').length} critical`
              : 'No critical events'
          }
          color="bg-warning/10"
        />
        <KpiCard
          icon={<TrendingUp size={20} className="text-success" />}
          label="Consensus Success"
          value={`${stats.consensusSuccess}%`}
          sublabel={`${stats.committedCount} of ${stats.committedCount + stats.rejectedCount} rounds`}
          color="bg-success/10"
        />
      </div>

      {/* Network Topology + Transaction Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Network Topology"
            subtitle="Distributed validator nodes"
            icon={<Network size={16} className="text-accent" />}
          />
          <CardBody>
            <NetworkTopology nodes={nodes} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Live Transaction Feed"
            subtitle="Real-time settlement stream"
            icon={<ArrowLeftRight size={16} className="text-crypto" />}
            action={
              <button
                onClick={() => navigate('/settlement')}
                className="text-xs text-accent hover:text-accent-glow flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </button>
            }
          />
          <CardBody className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-12 px-5">
                <ArrowLeftRight size={32} className="text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Awaiting first settlement...</p>
                <p className="text-xs text-text-muted mt-1">
                  Create a transaction from the Settlement page to begin.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-text-muted uppercase tracking-wider border-b border-border-default">
                      <th className="text-left px-4 py-2 font-medium">Transaction ID</th>
                      <th className="text-left px-4 py-2 font-medium">Sender → Receiver</th>
                      <th className="text-right px-4 py-2 font-medium">Amount</th>
                      <th className="text-center px-4 py-2 font-medium">Risk</th>
                      <th className="text-center px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 10).map((tx) => (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="border-b border-border-default/50 hover:bg-bg-tertiary/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-accent">
                          {shortHash(tx.id, 10)}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-text-secondary">
                          {tx.sender_bank} → {tx.receiver_bank}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-text-primary">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge
                            variant={
                              tx.risk_level === 'CRITICAL'
                                ? 'error'
                                : tx.risk_level === 'HIGH'
                                  ? 'warning'
                                  : tx.risk_level === 'MEDIUM'
                                    ? 'info'
                                    : 'success'
                            }
                          >
                            {tx.risk_level}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <StatusBadge status={tx.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Infographic: How a transaction becomes a block */}
      <Card>
        <CardHeader
          title="Transaction Lifecycle"
          subtitle="How a settlement becomes an immutable block"
          icon={<CheckCircle2 size={16} className="text-success" />}
        />
        <CardBody>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
            {[
              { label: 'Transaction', icon: ArrowLeftRight, color: 'text-accent' },
              { label: 'Signature', icon: ShieldAlert, color: 'text-crypto' },
              { label: 'Validation', icon: Users, color: 'text-accent-glow' },
              { label: 'Consensus', icon: CheckCircle2, color: 'text-success' },
              { label: 'Block', icon: Boxes, color: 'text-accent' },
              { label: 'Audit', icon: Activity, color: 'text-text-secondary' },
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center gap-2 md:gap-4">
                <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl glass-panel-hover min-w-[100px]">
                  <step.icon size={24} className={step.color} />
                  <span className="text-xs font-medium text-text-secondary">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight size={16} className="text-text-muted" />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <TransactionDrawer
        tx={selectedTx}
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
