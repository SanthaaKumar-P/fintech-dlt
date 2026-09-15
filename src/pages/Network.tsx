import { useState } from 'react';
import {
  Network,
  Power,
  Bug,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardBody } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { showToast } from '@/components/Toast';
import { NetworkTopology } from '@/components/NetworkTopology';
import { toggleNodeOnline, toggleNodeMalicious, type NodeRow } from '@/lib/engine';

export function NetworkPage() {
  const { nodes, refresh, loading } = useApp();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleToggleOnline = async (node: NodeRow) => {
    setActionLoading(node.id);
    try {
      await toggleNodeOnline(node.id, !node.online);
      await refresh();
      showToast(`Node ${node.id} ${node.online ? 'taken offline' : 'brought online'}`, node.online ? 'warning' : 'success');
    } catch {
      showToast('Failed to toggle node', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMalicious = async (node: NodeRow) => {
    setActionLoading(node.id);
    try {
      await toggleNodeMalicious(node.id, !node.malicious);
      await refresh();
      showToast(`Node ${node.id} ${node.malicious ? 'restored to healthy' : 'set to malicious'}`, node.malicious ? 'success' : 'warning');
    } catch {
      showToast('Failed to toggle malicious mode', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="skeleton h-96 rounded-2xl" />;
  }

  const onlineCount = nodes.filter((n) => n.online).length;
  const maliciousCount = nodes.filter((n) => n.malicious).length;
  const quorumAvailable = onlineCount >= 3;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Network Topology</h1>
        <p className="text-sm text-text-secondary">
          Distributed validator node management — {onlineCount}/{nodes.length} nodes online, {maliciousCount} malicious
        </p>
      </div>

      {/* Fault tolerance status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FaultToleranceCard
          label="4/4 Online"
          desc="Full capacity"
          active={onlineCount === 4}
        />
        <FaultToleranceCard
          label="3/4 Online"
          desc="Quorum viable"
          active={onlineCount === 3}
        />
        <FaultToleranceCard
          label="2/4 Online"
          desc="Quorum at risk"
          active={onlineCount === 2}
          warning
        />
        <FaultToleranceCard
          label="1/4 Online"
          desc="Consensus unavailable"
          active={onlineCount <= 1}
          danger
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topology */}
        <Card>
          <CardHeader
            title="Network Diagram"
            subtitle="Real-time node status"
            icon={<Network size={16} className="text-accent" />}
          />
          <CardBody>
            <NetworkTopology nodes={nodes} />
          </CardBody>
        </Card>

        {/* Node cards */}
        <div className="space-y-4">
          {nodes.map((node) => (
            <Card key={node.id} hover>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                        !node.online
                          ? 'bg-bg-tertiary'
                          : node.malicious
                            ? 'bg-error/10'
                            : 'bg-success/10'
                      }`}
                    >
                      <Network
                        size={20}
                        className={!node.online ? 'text-text-muted' : node.malicious ? 'text-error' : 'text-success'}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-primary">{node.id}</div>
                      <div className="text-xs text-text-muted">{node.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={!node.online ? 'neutral' : node.malicious ? 'error' : 'success'}>
                      <span className={`status-dot ${!node.online ? 'offline' : node.malicious ? 'malicious' : 'online'}`} />
                      {!node.online ? 'OFFLINE' : node.malicious ? 'MALICIOUS' : 'ONLINE'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <NodeStat icon={CheckCircle2} label="Validations" value={node.validations} color="text-accent" />
                  <NodeStat icon={Activity} label="Success" value={node.approvals} color="text-success" />
                  <NodeStat icon={XCircle} label="Rejected" value={node.rejections} color="text-error" />
                  <NodeStat icon={Clock} label="Latency" value={`${node.latency_ms}ms`} color="text-text-secondary" />
                  <NodeStat icon={Activity} label="Heartbeat" value={node.online ? 'Live' : 'Stale'} color={node.online ? 'text-success' : 'text-text-muted'} />
                  <NodeStat icon={Bug} label="Status" value={node.malicious ? 'Faulty' : 'Healthy'} color={node.malicious ? 'text-error' : 'text-success'} />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={node.online ? 'danger' : 'success'}
                    size="sm"
                    icon={<Power size={14} />}
                    onClick={() => handleToggleOnline(node)}
                    loading={actionLoading === node.id}
                    className="flex-1"
                  >
                    {node.online ? 'TAKE OFFLINE' : 'BRING ONLINE'}
                  </Button>
                  <Button
                    variant={node.malicious ? 'success' : 'danger'}
                    size="sm"
                    icon={<Bug size={14} />}
                    onClick={() => handleToggleMalicious(node)}
                    loading={actionLoading === node.id}
                    className="flex-1"
                  >
                    {node.malicious ? 'RESTORE' : 'MALICIOUS'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Consensus viability banner */}
      <Card className={`p-4 ${quorumAvailable ? 'border-success/30' : 'border-error/30'}`}>
        <div className="flex items-center gap-3">
          {quorumAvailable ? (
            <CheckCircle2 size={20} className="text-success" />
          ) : (
            <XCircle size={20} className="text-error" />
          )}
          <div>
            <div className={`text-sm font-semibold ${quorumAvailable ? 'text-success' : 'text-error'}`}>
              {quorumAvailable ? 'Consensus Viable' : 'Consensus Unavailable'}
            </div>
            <div className="text-xs text-text-muted">
              {quorumAvailable
                ? `${onlineCount}/${nodes.length} nodes online — PBFT quorum (3) can be reached`
                : `Only ${onlineCount}/${nodes.length} nodes online — insufficient healthy validators for quorum`}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function NodeStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="glass-panel p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className={color} />
        <span className="text-[10px] text-text-muted uppercase">{label}</span>
      </div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}

function FaultToleranceCard({ label, desc, active, warning, danger }: { label: string; desc: string; active: boolean; warning?: boolean; danger?: boolean }) {
  return (
    <div
      className={`glass-panel p-4 transition-all duration-300 ${
        active ? (danger ? 'border-error/50 bg-error/5' : warning ? 'border-warning/50 bg-warning/5' : 'border-success/50 bg-success/5') : ''
      }`}
    >
      <div className={`text-lg font-bold ${active ? (danger ? 'text-error' : warning ? 'text-warning' : 'text-success') : 'text-text-muted'}`}>
        {label}
      </div>
      <div className="text-xs text-text-muted mt-1">{desc}</div>
    </div>
  );
}
