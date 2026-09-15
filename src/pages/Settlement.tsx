import { useState } from 'react';
import {
  ArrowLeftRight,
  Shield,
  CheckCircle2,
  XCircle,
  Users,
  Boxes,
  ScrollText,
  Lock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardBody } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge, StatusBadge } from '@/components/Badge';
import { showToast } from '@/components/Toast';
import { processTransaction, type CreateTxParams, type ProcessResult } from '@/lib/engine';
import { shortHash } from '@/lib/crypto';
import { TransactionDrawer } from '@/components/TransactionDrawer';
import type { TxRow } from '@/lib/engine';

const stepIcons = [
  ArrowLeftRight, Lock, Shield, AlertTriangle, Users, CheckCircle2, Boxes, ScrollText,
];

export function Settlement() {
  const { nodes, accounts, refresh } = useApp();
  const [form, setForm] = useState<CreateTxParams>({
    senderBank: 'BANK-A',
    receiverBank: 'BANK-B',
    senderAccount: 'ACCT-100',
    receiverAccount: 'ACCT-200',
    amount: 25000,
    currency: 'INR',
  });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [selectedTx, setSelectedTx] = useState<TxRow | null>(null);

  const senderAcct = accounts.find((a) => a.id === form.senderAccount);
  const estimatedRisk = form.amount > 100000 ? 'CRITICAL' : form.amount > 50000 ? 'HIGH' : form.amount > 25000 ? 'MEDIUM' : 'LOW';
  const onlineNodes = nodes.filter((n) => n.online).length;

  const handleSubmit = async () => {
    if (form.senderBank === form.receiverBank) {
      showToast('Sender and receiver banks must differ', 'warning');
      return;
    }
    if (form.amount <= 0) {
      showToast('Amount must be positive', 'warning');
      return;
    }
    if (senderAcct && senderAcct.balance < form.amount) {
      showToast(`Insufficient funds — ${form.senderAccount} has ₹${senderAcct.balance.toLocaleString('en-IN')}`, 'error');
      return;
    }

    setProcessing(true);
    setResult(null);
    setActiveStep(-1);

    // Animate steps
    for (let i = 0; i < 8; i++) {
      setActiveStep(i);
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      const res = await processTransaction(form);
      setResult(res);
      setActiveStep(8);
      await refresh();
      if (res.transaction.status === 'COMMITTED') {
        showToast(`Settlement committed — Block #${res.block?.block_number}`, 'success');
      } else {
        showToast(`Settlement rejected — ${res.transaction.rejection_reason}`, 'error');
      }
    } catch (err) {
      showToast(`Processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Create Settlement</h1>
        <p className="text-sm text-text-secondary">
          Initiate a secure distributed financial settlement with cryptographic signing and PBFT consensus.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader
            title="Settlement Details"
            subtitle="Configure transaction parameters"
            icon={<ArrowLeftRight size={16} className="text-accent" />}
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Sender Bank">
                <select
                  value={form.senderBank}
                  onChange={(e) => {
                    const bankId = e.target.value;
                    const acct = accounts.find((a) => a.bank_id === bankId);
                    setForm({ ...form, senderBank: bankId, senderAccount: acct?.id || form.senderAccount });
                  }}
                  className="form-select"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Receiver Bank">
                <select
                  value={form.receiverBank}
                  onChange={(e) => {
                    const bankId = e.target.value;
                    const acct = accounts.find((a) => a.bank_id === bankId);
                    setForm({ ...form, receiverBank: bankId, receiverAccount: acct?.id || form.receiverAccount });
                  }}
                  className="form-select"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Sender Account">
                <select
                  value={form.senderAccount}
                  onChange={(e) => setForm({ ...form, senderAccount: e.target.value })}
                  className="form-select"
                >
                  {accounts.filter((a) => a.bank_id === form.senderBank).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} (₹{a.balance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Receiver Account">
                <select
                  value={form.receiverAccount}
                  onChange={(e) => setForm({ ...form, receiverAccount: e.target.value })}
                  className="form-select"
                >
                  {accounts.filter((a) => a.bank_id === form.receiverBank).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} (₹{a.balance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Amount (INR)">
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="form-input"
                  min="1"
                />
              </FormField>
              <FormField label="Currency">
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="form-select"
                  disabled
                >
                  <option value="INR">INR</option>
                </select>
              </FormField>
            </div>

            {/* Live preview */}
            <div className="glass-panel p-4 space-y-2">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Live Preview</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Transaction Value</span>
                <span className="text-text-primary font-bold">₹{form.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Estimated Risk</span>
                <Badge variant={estimatedRisk === 'CRITICAL' ? 'error' : estimatedRisk === 'HIGH' ? 'warning' : estimatedRisk === 'MEDIUM' ? 'info' : 'success'}>
                  {estimatedRisk}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Estimated Validators</span>
                <span className="text-text-primary font-bold">{onlineNodes}/{nodes.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Consensus Requirement</span>
                <span className="text-text-primary font-bold">3 / 4 (PBFT 2f+1)</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              loading={processing}
              icon={!processing ? <Shield size={18} /> : undefined}
            >
              {processing ? 'PROCESSING SETTLEMENT...' : 'INITIATE SECURE SETTLEMENT'}
            </Button>
          </CardBody>
        </Card>

        {/* Processing Visualization */}
        <Card>
          <CardHeader
            title="Processing Pipeline"
            subtitle="Step-by-step transaction lifecycle"
            icon={<Loader2 size={16} className={processing ? 'text-accent animate-spin' : 'text-text-muted'} />}
          />
          <CardBody className="space-y-2">
            {[
              'TRANSACTION CREATED',
              'CRYPTOGRAPHIC SIGNATURE',
              'SIGNATURE VERIFICATION',
              'SECURITY ANALYSIS',
              'DISTRIBUTED VALIDATION',
              'PBFT CONSENSUS',
              'BLOCK COMMIT',
              'AUDIT TRAIL',
            ].map((label, i) => {
              const Icon = stepIcons[i];
              const isActive = activeStep === i;
              const isDone = result && i < (result.steps.length);
              const stepResult = result?.steps[i];
              const failed = stepResult?.status === 'failed';

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                    isActive
                      ? 'bg-accent/10 border-accent/40 scale-[1.02]'
                      : failed
                        ? 'bg-error/5 border-error/30'
                        : isDone
                          ? 'bg-success/5 border-success/20'
                          : 'bg-bg-tertiary/30 border-border-default/50'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${
                      failed
                        ? 'bg-error/10 text-error'
                        : isDone
                          ? 'bg-success/10 text-success'
                          : isActive
                            ? 'bg-accent/10 text-accent'
                            : 'bg-bg-tertiary text-text-muted'
                    }`}
                  >
                    {isActive && processing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : failed ? (
                      <XCircle size={16} />
                    ) : isDone ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-text-muted font-mono">STEP {String(i + 1).padStart(2, '0')}</div>
                    <div className={`text-sm font-medium ${isActive ? 'text-accent' : failed ? 'text-error' : isDone ? 'text-text-primary' : 'text-text-muted'}`}>
                      {label}
                    </div>
                    {stepResult?.detail && (
                      <div className="text-xs text-text-muted mt-0.5">{stepResult.detail}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* Result */}
      {result && (
        <Card className="animate-scale-in">
          <CardHeader
            title="Settlement Result"
            subtitle={result.transaction.id}
            icon={result.transaction.status === 'COMMITTED' ? <CheckCircle2 size={16} className="text-success" /> : <XCircle size={16} className="text-error" />}
          />
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <StatusBadge status={result.transaction.status} />
              <Button variant="secondary" size="sm" onClick={() => setSelectedTx(result.transaction)}>
                View Details
              </Button>
            </div>
            {result.transaction.status === 'COMMITTED' && result.block && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ResultItem label="Block Number" value={`#${result.block.block_number}`} />
                <ResultItem label="Block Hash" value={shortHash(result.block.block_hash)} mono />
                <ResultItem label="Merkle Root" value={shortHash(result.block.merkle_root)} mono />
                <ResultItem label="Validators" value={`${result.block.validator_count} approved`} />
              </div>
            )}
            {result.transaction.rejection_reason && (
              <div className="p-4 rounded-lg bg-error/5 border border-error/20 mt-4">
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="text-error" />
                  <span className="text-sm font-semibold text-error">{result.transaction.rejection_reason}</span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <TransactionDrawer tx={selectedTx} open={!!selectedTx} onClose={() => setSelectedTx(null)} />

      <style>{`
        .form-select, .form-input {
          width: 100%;
          background: #0f1626;
          border: 1px solid #1e2a45;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          color: #e2e8f0;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-select:focus, .form-input:focus {
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function ResultItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className={`text-sm text-text-primary font-semibold ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
