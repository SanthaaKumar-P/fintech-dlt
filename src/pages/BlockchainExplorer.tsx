import { useState } from 'react';
import { Boxes, Link2, CheckCircle2, XCircle, Copy, Hash } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardBody } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { showToast } from '@/components/Toast';
import { shortHash } from '@/lib/crypto';
import type { BlockRow } from '@/lib/engine';

export function BlockchainExplorer() {
  const { blocks, transactions } = useApp();
  const [selectedBlock, setSelectedBlock] = useState<BlockRow | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Blockchain Explorer</h1>
        <p className="text-sm text-text-secondary">
          Immutable ledger of committed settlement blocks — {blocks.length} blocks
        </p>
      </div>

      {/* Chain visualization */}
      <Card>
        <CardHeader
          title="Blockchain Visualization"
          subtitle="Hash-linked block chain"
          icon={<Link2 size={16} className="text-crypto" />}
        />
        <CardBody>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {blocks.map((block, i) => (
              <div key={block.block_number} className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSelectedBlock(block)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border min-w-[140px] transition-all ${
                    block.tampered
                      ? 'border-error/50 bg-error/5 hover:bg-error/10'
                      : block.integrity_status === 'COMPROMISED'
                        ? 'border-warning/50 bg-warning/5 hover:bg-warning/10'
                        : 'border-border-default bg-bg-tertiary/50 hover:border-accent/40 hover:bg-accent/5'
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${block.tampered ? 'bg-error/10' : 'bg-crypto/10'}`}>
                    {block.tampered ? <XCircle size={18} className="text-error" /> : <Boxes size={18} className="text-crypto" />}
                  </div>
                  <div className="text-xs font-bold text-text-primary">BLOCK {String(block.block_number).padStart(3, '0')}</div>
                  <div className="text-[10px] font-mono text-text-muted">{shortHash(block.block_hash, 8)}</div>
                  {block.tampered && <div className="text-[10px] text-error font-semibold">⚠ HASH MISMATCH</div>}
                  {block.integrity_status === 'COMPROMISED' && !block.tampered && (
                    <div className="text-[10px] text-warning font-semibold">⚠ CHAIN BROKEN</div>
                  )}
                </button>
                {i < blocks.length - 1 && (
                  <div className={`w-6 h-px ${blocks[i + 1].prev_hash === block.block_hash ? 'bg-crypto/40' : 'bg-error/60'}`} />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Block table */}
      <Card>
        <CardHeader
          title="Block Registry"
          subtitle="All blocks on the chain"
          icon={<Boxes size={16} className="text-accent" />}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-text-muted uppercase tracking-wider border-b border-border-default">
                  <th className="text-left px-4 py-3 font-medium">Block #</th>
                  <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium">Previous Hash</th>
                  <th className="text-left px-4 py-3 font-medium">Current Hash</th>
                  <th className="text-left px-4 py-3 font-medium">Merkle Root</th>
                  <th className="text-center px-4 py-3 font-medium">TXs</th>
                  <th className="text-center px-4 py-3 font-medium">Validators</th>
                  <th className="text-center px-4 py-3 font-medium">Integrity</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr
                    key={block.block_number}
                    onClick={() => setSelectedBlock(block)}
                    className="border-b border-border-default/50 hover:bg-bg-tertiary/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-text-primary">#{block.block_number}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {new Date(block.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">
                      <button onClick={(e) => { e.stopPropagation(); copyToClipboard(block.prev_hash, 'Previous hash'); }}>
                        {shortHash(block.prev_hash, 10)} <Copy size={10} className="inline" />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-accent">
                      <button onClick={(e) => { e.stopPropagation(); copyToClipboard(block.block_hash, 'Block hash'); }}>
                        {shortHash(block.block_hash, 10)} <Copy size={10} className="inline" />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-crypto">
                      {shortHash(block.merkle_root, 10)}
                    </td>
                    <td className="px-4 py-3 text-center text-text-primary">{block.tx_count}</td>
                    <td className="px-4 py-3 text-center text-text-primary">{block.validator_count}</td>
                    <td className="px-4 py-3 text-center">
                      {block.tampered ? (
                        <Badge variant="error">✕ COMPROMISED</Badge>
                      ) : block.integrity_status === 'COMPROMISED' ? (
                        <Badge variant="warning">⚠ BROKEN</Badge>
                      ) : (
                        <Badge variant="success">✓ VERIFIED</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Block detail modal */}
      <Modal
        open={!!selectedBlock}
        onClose={() => setSelectedBlock(null)}
        title={selectedBlock ? `Block #${selectedBlock.block_number}` : ''}
        subtitle="Block details and integrity verification"
        maxWidth="max-w-3xl"
      >
        {selectedBlock && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Block Number" value={`#${selectedBlock.block_number}`} />
              <DetailField label="Timestamp" value={new Date(selectedBlock.timestamp).toLocaleString()} />
              <DetailField label="Transaction Count" value={String(selectedBlock.tx_count)} />
              <DetailField label="Validator Count" value={String(selectedBlock.validator_count)} />
              <DetailField label="Consensus Status" value={selectedBlock.consensus_status} />
              <DetailField
                label="Integrity Status"
                value={selectedBlock.tampered ? 'COMPROMISED' : selectedBlock.integrity_status}
                color={selectedBlock.tampered ? 'text-error' : 'text-success'}
              />
            </div>

            <HashField label="Previous Hash" value={selectedBlock.prev_hash} onCopy={() => copyToClipboard(selectedBlock.prev_hash, 'Previous hash')} />
            <HashField label="Current Hash" value={selectedBlock.block_hash} onCopy={() => copyToClipboard(selectedBlock.block_hash, 'Current hash')} />
            <HashField label="Merkle Root" value={selectedBlock.merkle_root} onCopy={() => copyToClipboard(selectedBlock.merkle_root, 'Merkle root')} />

            {/* Transactions in block */}
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Transactions in Block</div>
              {transactions.filter((t) => t.block_number === selectedBlock.block_number).length === 0 ? (
                <p className="text-sm text-text-muted">No transactions (genesis block)</p>
              ) : (
                <div className="space-y-2">
                  {transactions
                    .filter((t) => t.block_number === selectedBlock.block_number)
                    .map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg glass-panel">
                        <div>
                          <div className="text-xs font-mono text-accent">{tx.id}</div>
                          <div className="text-xs text-text-muted">{tx.sender_bank} → {tx.receiver_bank} · ₹{tx.amount.toLocaleString('en-IN')}</div>
                        </div>
                        <Badge variant="success">COMMITTED</Badge>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Validator signatures */}
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Validator Signatures</div>
              <div className="flex flex-wrap gap-2">
                {(selectedBlock.validator_signatures as string[]).map((sig) => (
                  <Badge key={sig} variant="crypto">
                    <Hash size={10} /> {sig}
                  </Badge>
                ))}
                {selectedBlock.consensus_status === 'GENESIS' && (
                  <span className="text-sm text-text-muted">Genesis block — no validator signatures</span>
                )}
              </div>
            </div>

            {/* Integrity check */}
            <div className={`p-4 rounded-lg border ${selectedBlock.tampered ? 'bg-error/5 border-error/20' : 'bg-success/5 border-success/20'}`}>
              <div className="flex items-center gap-2">
                {selectedBlock.tampered ? (
                  <>
                    <XCircle size={18} className="text-error" />
                    <span className="text-sm font-semibold text-error">INTEGRITY VIOLATION — Block hash has been tampered</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} className="text-success" />
                    <span className="text-sm font-semibold text-success">INTEGRITY VERIFIED — Block hash chain is valid</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailField({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className={`text-sm font-semibold ${color || 'text-text-primary'}`}>{value}</div>
    </div>
  );
}

function HashField({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div>
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-xs font-mono text-text-secondary break-all bg-bg-tertiary p-2.5 rounded border border-border-default">
          {value}
        </div>
        <button onClick={onCopy} className="p-2.5 rounded-lg glass-panel-hover text-text-muted hover:text-accent">
          <Copy size={14} />
        </button>
      </div>
    </div>
  );
}
