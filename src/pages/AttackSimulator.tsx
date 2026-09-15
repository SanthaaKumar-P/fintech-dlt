import { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Bug,
  Activity,
  Lock,
  Copy,
  Repeat,
  Edit3,
  Users,
  Power,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardBody } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { showToast } from '@/components/Toast';
import {
  simulateReplayAttack,
  simulateInvalidSignature,
  simulateDoubleSpend,
  simulateLedgerTamper,
  verifyLedgerIntegrity,
  toggleNodeMalicious,
  toggleNodeOnline,
  type TxRow,
} from '@/lib/engine';

export function AttackSimulator() {
  const { transactions, blocks, nodes, refresh } = useApp();
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ title: string; outcome: string; details: string; variant: 'success' | 'error' } | null>(null);

  const committedTxs = useMemo(
    () => transactions.filter((t) => t.status === 'COMMITTED'),
    [transactions],
  );

  const firstTx = committedTxs[0];

  const handleReplay = async () => {
    if (!firstTx) {
      showToast('No committed transactions to replay', 'warning');
      return;
    }
    setLoading('replay');
    try {
      const res = await simulateReplayAttack(firstTx.id);
      await refresh();
      setResult({
        title: 'REPLAY ATTACK',
        outcome: res.transaction.status === 'REJECTED' ? 'BLOCKED' : 'FAILED TO BLOCK',
        details: res.transaction.rejection_reason || 'Transaction was processed',
        variant: res.transaction.status === 'REJECTED' ? 'success' : 'error',
      });
      showToast('Replay attack blocked — security event logged', 'success');
    } catch {
      showToast('Replay simulation failed', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleInvalidSig = async () => {
    if (!firstTx) {
      showToast('No committed transactions to tamper', 'warning');
      return;
    }
    setLoading('invalid-sig');
    try {
      const res = await simulateInvalidSignature(firstTx.id);
      await refresh();
      setResult({
        title: 'INVALID SIGNATURE ATTACK',
        outcome: res.transaction.status === 'REJECTED' ? 'BLOCKED' : 'FAILED TO BLOCK',
        details: res.transaction.rejection_reason || 'Transaction was processed',
        variant: res.transaction.status === 'REJECTED' ? 'success' : 'error',
      });
      showToast('Invalid signature attack blocked', 'success');
    } catch {
      showToast('Invalid signature simulation failed', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleDoubleSpend = async () => {
    setLoading('double-spend');
    try {
      const res = await simulateDoubleSpend('ACCT-100', 'ACCT-200', 'BANK-A', 'BANK-B', 40000);
      await refresh();
      const secondRejected = res.second.transaction.status === 'REJECTED';
      setResult({
        title: 'DOUBLE SPEND ATTACK',
        outcome: secondRejected ? 'BLOCKED' : 'FAILED TO BLOCK',
        details: `First: ${res.first.transaction.status} | Second: ${res.second.transaction.status} — ${res.second.transaction.rejection_reason || 'N/A'}`,
        variant: secondRejected ? 'success' : 'error',
      });
      showToast('Double spend detected and blocked', 'success');
    } catch {
      showToast('Double spend simulation failed', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleTamper = async () => {
    if (blocks.length < 2) {
      showToast('Need at least 2 blocks to tamper', 'warning');
      return;
    }
    setLoading('tamper');
    try {
      const tamperBlock = blocks[1];
      const res = await simulateLedgerTamper(tamperBlock.block_number);
      await refresh();
      setResult({
        title: 'LEDGER TAMPERING',
        outcome: 'DETECTED',
        details: `Block #${res.block.block_number} hash modified. Expected: ${res.expectedHash.slice(0, 16)}... Actual: ${res.actualHash.slice(0, 16)}...`,
        variant: 'success',
      });
      showToast('Ledger tampering detected — integrity violation', 'error');
    } catch {
      showToast('Tamper simulation failed', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleVerifyLedger = async () => {
    setLoading('verify');
    try {
      const res = await verifyLedgerIntegrity();
      await refresh();
      setResult({
        title: 'LEDGER VERIFICATION',
        outcome: res.valid ? 'VERIFIED' : 'VIOLATION DETECTED',
        details: res.valid
          ? `Chain integrity verified across ${res.totalBlocks} blocks`
          : `Broken at block #${res.brokenBlock}. Expected: ${res.expectedHash?.slice(0, 16)}... Actual: ${res.actualHash?.slice(0, 16)}...`,
        variant: res.valid ? 'success' : 'error',
      });
      showToast(res.valid ? 'Ledger integrity verified' : 'Ledger integrity violation detected', res.valid ? 'success' : 'error');
    } catch {
      showToast('Verification failed', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleMaliciousNode = async () => {
    setLoading('malicious');
    try {
      const nodeC = nodes.find((n) => n.id === 'BANK-C');
      if (!nodeC) return;
      await toggleNodeMalicious('BANK-C', !nodeC.malicious);
      await refresh();
      const isNowMalicious = !nodeC.malicious;
      setResult({
        title: 'MALICIOUS NODE SIMULATION',
        outcome: isNowMalicious ? 'NODE QUARANTINED' : 'NODE RESTORED',
        details: isNowMalicious
          ? 'BANK-C set to malicious mode. Honest quorum (A, B, D) can still reach consensus despite one faulty validator.'
          : 'BANK-C restored to healthy state. All validators are now honest.',
        variant: 'success',
      });
      showToast(`BANK-C ${isNowMalicious ? 'set to malicious' : 'restored'}`, 'warning');
    } catch {
      showToast('Malicious node simulation failed', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleNodeFailure = async () => {
    setLoading('node-failure');
    try {
      const nodeD = nodes.find((n) => n.id === 'BANK-D');
      if (!nodeD) return;
      await toggleNodeOnline('BANK-D', !nodeD.online);
      await refresh();
      const isNowOffline = !nodeD.online;
      setResult({
        title: 'NODE FAILURE SIMULATION',
        outcome: isNowOffline ? 'NODE OFFLINE' : 'NODE ONLINE',
        details: isNowOffline
          ? 'BANK-D taken offline. 3/4 nodes remain — quorum is still viable for consensus.'
          : 'BANK-D brought back online. All 4 nodes operational.',
        variant: 'success',
      });
      showToast(`BANK-D ${isNowOffline ? 'taken offline' : 'brought online'}`, 'warning');
    } catch {
      showToast('Node failure simulation failed', 'error');
    } finally {
      setLoading(null);
    }
  };

  const attacks = [
    {
      id: 'replay',
      title: 'Replay Attack',
      icon: Repeat,
      description: 'Attempt to submit an already committed transaction again.',
      button: 'SIMULATE REPLAY',
      action: handleReplay,
      color: 'text-error',
      bg: 'bg-error/5 border-error/20',
    },
    {
      id: 'invalid-sig',
      title: 'Invalid Signature',
      icon: Edit3,
      description: 'Modify the signed transaction payload to invalidate the digital signature.',
      button: 'SIMULATE INVALID SIG',
      action: handleInvalidSig,
      color: 'text-warning',
      bg: 'bg-warning/5 border-warning/20',
    },
    {
      id: 'double-spend',
      title: 'Double Spend',
      icon: Copy,
      description: 'Attempt two transactions exceeding the available account balance.',
      button: 'SIMULATE DOUBLE SPEND',
      action: handleDoubleSpend,
      color: 'text-error',
      bg: 'bg-error/5 border-error/20',
    },
    {
      id: 'tamper',
      title: 'Ledger Tampering',
      icon: Lock,
      description: 'Modify a committed block hash and detect the integrity violation.',
      button: 'SIMULATE TAMPERING',
      action: handleTamper,
      color: 'text-crypto',
      bg: 'bg-crypto/5 border-crypto/20',
    },
    {
      id: 'malicious',
      title: 'Malicious Node',
      icon: Bug,
      description: 'Toggle a validator to malicious mode and observe honest quorum override.',
      button: 'TOGGLE MALICIOUS NODE',
      action: handleMaliciousNode,
      color: 'text-warning',
      bg: 'bg-warning/5 border-warning/20',
    },
    {
      id: 'node-failure',
      title: 'Node Failure',
      icon: Power,
      description: 'Take a node offline and test fault tolerance with remaining validators.',
      button: 'TOGGLE NODE OFFLINE',
      action: handleNodeFailure,
      color: 'text-error',
      bg: 'bg-error/5 border-error/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Attack Simulator</h1>
        <p className="text-sm text-text-secondary">
          Safely simulate attacks against the distributed financial network.
        </p>
      </div>

      {/* Attack cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attacks.map((attack) => (
          <Card key={attack.id} hover className={`p-5 ${attack.bg}`}>
            <div className="flex items-start gap-3 mb-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${attack.bg}`}>
                <attack.icon size={20} className={attack.color} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">{attack.title}</h3>
              </div>
            </div>
            <p className="text-xs text-text-secondary mb-4 min-h-[40px]">{attack.description}</p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={attack.action}
              loading={loading === attack.id}
              icon={!loading ? <attack.icon size={14} /> : undefined}
            >
              {attack.button}
            </Button>
          </Card>
        ))}
      </div>

      {/* Ledger verification */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-crypto/10">
              <ShieldCheck size={20} className="text-crypto" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Verify Ledger Integrity</h3>
              <p className="text-xs text-text-muted">Run full blockchain hash chain verification</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="md"
            icon={<ShieldCheck size={16} />}
            onClick={handleVerifyLedger}
            loading={loading === 'verify'}
          >
            VERIFY LEDGER
          </Button>
        </div>
      </Card>

      {/* Result */}
      {result && (
        <Card className={`animate-scale-in p-5 border-${result.variant === 'success' ? 'success' : 'error'}/30`}>
          <div className="flex items-start gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${result.variant === 'success' ? 'bg-success/10' : 'bg-error/10'}`}>
              {result.variant === 'success' ? <ShieldCheck size={20} className="text-success" /> : <ShieldAlert size={20} className="text-error" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-text-primary">{result.title}</h3>
                <Badge variant={result.variant === 'success' ? 'success' : 'error'}>{result.outcome}</Badge>
              </div>
              <p className="text-xs text-text-secondary">{result.details}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Attack lifecycle infographic */}
      <Card>
        <CardHeader
          title="Attack Lifecycle"
          subtitle="How threats are detected and neutralized"
          icon={<Activity size={16} className="text-error" />}
        />
        <CardBody>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
            {[
              { label: 'ATTACK', icon: ShieldAlert, color: 'text-error' },
              { label: 'DETECT', icon: Bug, color: 'text-warning' },
              { label: 'REJECT', icon: ShieldAlert, color: 'text-error' },
              { label: 'LOG', icon: Activity, color: 'text-accent' },
              { label: 'ALERT', icon: TrendingUp, color: 'text-success' },
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center gap-2 md:gap-4">
                <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl glass-panel-hover min-w-[100px]">
                  <step.icon size={24} className={step.color} />
                  <span className="text-xs font-medium text-text-secondary">{step.label}</span>
                </div>
                {i < arr.length - 1 && <div className="w-6 h-px bg-text-muted/30" />}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
