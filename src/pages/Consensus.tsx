import { useState, useMemo } from 'react';
import { Users, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardBody } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { fetchVotes, type TxRow, type VoteRow } from '@/lib/engine';
import { TransactionDrawer } from '@/components/TransactionDrawer';

const PHASES = ['PROPOSAL', 'PRE-PREPARE', 'PREPARE', 'COMMIT', 'FINALITY'];

export function Consensus() {
  const { transactions, nodes, explainMode } = useApp();
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [selectedTx, setSelectedTx] = useState<TxRow | null>(null);

  const consensusTxs = useMemo(
    () => transactions.filter((t) => ['COMMITTED', 'REJECTED'].includes(t.status)),
    [transactions],
  );

  const loadVotes = async (txId: string) => {
    setSelectedTxId(txId);
    const v = await fetchVotes(txId);
    setVotes(v);
  };

  const currentTx = consensusTxs.find((t) => t.id === selectedTxId) || consensusTxs[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">PBFT Consensus</h1>
        <p className="text-sm text-text-secondary">
          Practical Byzantine Fault Tolerance — distributed validator agreement
        </p>
      </div>

      {explainMode && (
        <Card className="p-4 border-crypto/30 bg-crypto/5">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-crypto flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-crypto">PBFT Consensus:</span> PBFT-style consensus allows distributed validators to reach agreement even when a limited number of nodes behave incorrectly or become unavailable. It requires 2f+1 votes (where f is the number of faulty nodes) to achieve finality.
            </p>
          </div>
        </Card>
      )}

      {/* PBFT Flow */}
      <Card>
        <CardHeader
          title="Consensus Protocol Flow"
          subtitle="Five-phase PBFT agreement"
          icon={<Users size={16} className="text-crypto" />}
        />
        <CardBody>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {PHASES.map((phase, i) => (
              <div key={phase} className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-crypto/10 border border-crypto/30">
                    <span className="text-crypto font-bold text-sm">{i + 1}</span>
                  </div>
                  <span className="text-xs font-medium text-text-secondary">{phase}</span>
                </div>
                {i < PHASES.length - 1 && (
                  <div className="w-8 h-px bg-crypto/30" />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction list */}
        <Card>
          <CardHeader
            title="Consensus Rounds"
            subtitle={`${consensusTxs.length} consensus attempts`}
            icon={<CheckCircle2 size={16} className="text-success" />}
          />
          <CardBody className="p-0">
            {consensusTxs.length === 0 ? (
              <div className="text-center py-12 px-5">
                <Users size={32} className="text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-secondary">No consensus rounds yet.</p>
                <p className="text-xs text-text-muted mt-1">Create a transaction to see consensus in action.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {consensusTxs.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => loadVotes(tx.id)}
                    className={`w-full flex items-center justify-between p-3 border-b border-border-default/50 hover:bg-bg-tertiary/50 transition-colors text-left ${
                      selectedTxId === tx.id ? 'bg-accent/5' : ''
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono text-accent">{tx.id.slice(0, 16)}</div>
                      <div className="text-xs text-text-muted">{tx.sender_bank} → {tx.receiver_bank}</div>
                    </div>
                    <Badge variant={tx.status === 'COMMITTED' ? 'success' : 'error'}>
                      {tx.status === 'COMMITTED' ? 'ACHIEVED' : 'FAILED'}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Vote details */}
        <Card>
          <CardHeader
            title="Validator Votes"
            subtitle={currentTx ? currentTx.id.slice(0, 16) : 'Select a transaction'}
            icon={<Users size={16} className="text-accent" />}
          />
          <CardBody>
            {!currentTx ? (
              <div className="text-center py-12">
                <Users size={32} className="text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Select a consensus round to view votes.</p>
              </div>
            ) : votes.length === 0 && selectedTxId ? (
              <div className="text-center py-12">
                <p className="text-sm text-text-muted">No votes recorded for this transaction.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {votes.map((vote) => {
                  const node = nodes.find((n) => n.id === vote.node_id);
                  return (
                    <div key={vote.id} className="flex items-center justify-between p-3 rounded-lg glass-panel">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${node?.malicious ? 'bg-error/10' : 'bg-accent/10'}`}>
                          <Users size={14} className={node?.malicious ? 'text-error' : 'text-accent'} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{vote.node_id}</div>
                          <div className="text-xs text-text-muted">{vote.reason}</div>
                        </div>
                      </div>
                      <Badge variant={vote.vote === 'APPROVE' ? 'success' : 'error'}>
                        {vote.vote === 'APPROVE' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {vote.vote}
                      </Badge>
                    </div>
                  );
                })}

                {/* Quorum progress */}
                {votes.length > 0 && (
                  <div className="mt-4 p-4 rounded-lg glass-panel">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-muted uppercase tracking-wider">Quorum Progress</span>
                      <span className="text-sm font-bold text-text-primary">
                        {votes.filter((v) => v.vote === 'APPROVE').length} / {votes.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          votes.filter((v) => v.vote === 'APPROVE').length >= 3 ? 'bg-success' : 'bg-error'
                        }`}
                        style={{
                          width: `${(votes.filter((v) => v.vote === 'APPROVE').length / Math.max(votes.length, 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 text-xs">
                      {votes.filter((v) => v.vote === 'APPROVE').length >= 3 ? (
                        <span className="text-success font-semibold">CONSENSUS ACHIEVED</span>
                      ) : (
                        <span className="text-error font-semibold">CONSENSUS FAILED — INSUFFICIENT QUORUM</span>
                      )}
                    </div>
                  </div>
                )}

                {currentTx && (
                  <button
                    onClick={() => setSelectedTx(currentTx)}
                    className="text-xs text-accent hover:text-accent-glow"
                  >
                    View full transaction details →
                  </button>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <TransactionDrawer tx={selectedTx} open={!!selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
