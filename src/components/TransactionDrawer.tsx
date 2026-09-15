import { useEffect, useState } from 'react';
import { Drawer } from './Drawer';
import { Badge, StatusBadge } from './Badge';
import { Card } from './Card';
import { shortHash } from '@/lib/crypto';
import { fetchVotes, type TxRow, type VoteRow } from '@/lib/engine';
import {
  Hash,
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  Clock,
} from 'lucide-react';

export function TransactionDrawer({
  tx,
  open,
  onClose,
}: {
  tx: TxRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const [votes, setVotes] = useState<VoteRow[]>([]);

  useEffect(() => {
    if (tx) {
      fetchVotes(tx.id).then(setVotes).catch(() => setVotes([]));
    }
  }, [tx]);

  if (!tx) return null;

  const timeline = [
    { label: 'Created', icon: ArrowLeftRight, done: true, time: tx.created_at },
    { label: 'Signed', icon: Shield, done: true },
    { label: 'Validated', icon: Users, done: tx.status !== 'REJECTED' || !tx.rejection_reason?.includes('SIGNATURE') },
    { label: 'Consensus', icon: CheckCircle2, done: tx.status === 'COMMITTED' },
    { label: 'Committed', icon: CheckCircle2, done: tx.status === 'COMMITTED' },
  ];

  if (tx.status === 'REJECTED') {
    timeline.push({ label: 'Rejected', icon: XCircle, done: true });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Transaction ${shortHash(tx.id, 12)}`}
      subtitle={`${tx.sender_bank} → ${tx.receiver_bank}`}
    >
      <div className="space-y-5">
        {/* Status */}
        <div className="flex items-center justify-between">
          <StatusBadge status={tx.status} />
          <Badge variant={tx.risk_level === 'CRITICAL' ? 'error' : tx.risk_level === 'HIGH' ? 'warning' : tx.risk_level === 'MEDIUM' ? 'info' : 'success'}>
            Risk: {tx.risk_score}/100 ({tx.risk_level})
          </Badge>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Amount" value={`₹${tx.amount.toLocaleString('en-IN')} ${tx.currency}`} />
          <DetailItem label="Sender Account" value={tx.sender_account} />
          <DetailItem label="Receiver Account" value={tx.receiver_account} />
          <DetailItem label="Block Number" value={tx.block_number ? `#${tx.block_number}` : 'N/A'} />
          <DetailItem label="Created" value={new Date(tx.created_at).toLocaleString()} />
          <DetailItem label="Committed" value={tx.committed_at ? new Date(tx.committed_at).toLocaleString() : 'N/A'} />
        </div>

        {/* Rejection reason */}
        {tx.rejection_reason && (
          <div className="p-4 rounded-lg bg-error/5 border border-error/20">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={16} className="text-error" />
              <span className="text-sm font-semibold text-error">Rejection Reason</span>
            </div>
            <p className="text-sm text-text-secondary">{tx.rejection_reason}</p>
          </div>
        )}

        {/* Cryptographic details */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Hash size={16} className="text-crypto" /> Cryptographic Details
          </div>
          <div className="space-y-2">
            <HashRow label="Transaction Hash" value={tx.tx_hash} />
            <HashRow label="Signature" value={tx.signature} />
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Signer</span>
              <span className="text-text-primary font-mono">{tx.signer}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Verification</span>
              <Badge variant={tx.status === 'REJECTED' && tx.rejection_reason?.includes('SIGNATURE') ? 'error' : 'success'}>
                {tx.status === 'REJECTED' && tx.rejection_reason?.includes('SIGNATURE') ? 'INVALID ✕' : 'VERIFIED ✓'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Risk factors */}
        {tx.risk_factors && tx.risk_factors.length > 0 && (
          <Card className="p-4 space-y-2">
            <div className="text-sm font-semibold text-text-primary">Risk Factors</div>
            {tx.risk_factors.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{f.label}</span>
                <span className="text-warning font-semibold">+{f.points}</span>
              </div>
            ))}
          </Card>
        )}

        {/* Validator votes */}
        {votes.length > 0 && (
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Users size={16} className="text-accent" /> Validator Votes
            </div>
            {votes.map((vote) => (
              <div key={vote.id} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-mono">{vote.node_id}</span>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">{vote.reason}</span>
                  <Badge variant={vote.vote === 'APPROVE' ? 'success' : 'error'}>
                    {vote.vote}
                  </Badge>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Timeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Clock size={16} className="text-text-secondary" /> Processing Timeline
          </div>
          {timeline.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step.done
                    ? step.label === 'Rejected'
                      ? 'bg-error/10 text-error'
                      : 'bg-success/10 text-success'
                    : 'bg-bg-tertiary text-text-muted'
                }`}
              >
                <step.icon size={14} />
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${step.done ? 'text-text-primary' : 'text-text-muted'}`}>
                  {step.label}
                </div>
                {step.time && (
                  <div className="text-xs text-text-muted">{new Date(step.time).toLocaleTimeString()}</div>
                )}
              </div>
              {step.done && (
                <CheckCircle2 size={14} className={step.label === 'Rejected' ? 'text-error' : 'text-success'} />
              )}
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-muted mb-0.5">{label}</div>
      <div className="text-sm text-text-primary font-medium">{value}</div>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-muted mb-0.5">{label}</div>
      <div className="text-xs font-mono text-text-secondary break-all bg-bg-tertiary p-2 rounded border border-border-default">
        {value}
      </div>
    </div>
  );
}
