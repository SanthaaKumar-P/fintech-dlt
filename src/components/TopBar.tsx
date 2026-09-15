import { useState } from 'react';
import { Bell, RotateCcw, Settings, BookOpen, ShieldAlert } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from './Button';
import { showToast } from './Toast';
import { resetSimulation } from '@/lib/engine';
import { Modal } from './Modal';

export function TopBar() {
  const { nodes, blocks, securityEvents, refresh, explainMode, setExplainMode } = useApp();
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const onlineCount = nodes.filter((n) => n.online).length;
  const blockHeight = blocks.length > 0 ? blocks[blocks.length - 1].block_number : 0;
  const criticalEvents = securityEvents.filter((e) => e.severity === 'CRITICAL').length;
  const tamperedBlocks = blocks.filter((b) => b.tampered).length;

  let statusText = 'ALL SYSTEMS OPERATIONAL';
  let statusColor = 'text-success';
  let statusDotClass = 'online';

  if (tamperedBlocks > 0) {
    statusText = 'SECURITY INCIDENT';
    statusColor = 'text-error';
    statusDotClass = 'malicious';
  } else if (onlineCount < 3) {
    statusText = 'DEGRADED NETWORK';
    statusColor = 'text-warning';
    statusDotClass = 'warning';
  } else if (nodes.some((n) => n.malicious)) {
    statusText = 'MALICIOUS NODE DETECTED';
    statusColor = 'text-warning';
    statusDotClass = 'warning';
  }

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetSimulation();
      await refresh();
      showToast('Simulation reset — network reinitialized', 'success');
    } catch {
      showToast('Reset failed', 'error');
    } finally {
      setResetting(false);
      setShowReset(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 border-b border-border-default bg-bg-primary/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`status-dot ${statusDotClass} animate-pulse-glow`} />
            <span className={`text-sm font-bold tracking-wide ${statusColor}`}>{statusText}</span>
          </div>
          <div className="h-6 w-px bg-border-default" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">Block Height</span>
            <span className="text-text-primary font-bold">#{blockHeight}</span>
          </div>
          <div className="h-6 w-px bg-border-default" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">Validators</span>
            <span className="text-text-primary font-bold">{onlineCount}/{nodes.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<BookOpen size={16} />}
            onClick={() => {
              setExplainMode(!explainMode);
              showToast(explainMode ? 'Explain mode disabled' : 'Explain mode enabled — click concepts for explanations', 'info');
            }}
            className={explainMode ? 'text-accent border-accent/30' : ''}
          >
            Explain
          </Button>
          <button className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all">
            <Bell size={18} />
            {criticalEvents > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                {criticalEvents}
              </span>
            )}
          </button>
          <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all">
            <Settings size={18} />
          </button>
          <div className="h-6 w-px bg-border-default" />
          <Button
            variant="danger"
            size="sm"
            icon={<RotateCcw size={14} />}
            onClick={() => setShowReset(true)}
          >
            Reset
          </Button>
        </div>
      </header>

      <Modal
        open={showReset}
        onClose={() => !resetting && setShowReset(false)}
        title="Reset Simulation"
        subtitle="This will clear all transactions, blocks, security events, audit logs, and reset node states."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-error/5 border border-error/20">
            <ShieldAlert size={20} className="text-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">
              All simulation data will be permanently cleared. The network will be reinitialized with a genesis block and seed accounts. This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="md" onClick={() => setShowReset(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleReset} loading={resetting} icon={!resetting ? <RotateCcw size={16} /> : undefined}>
              Reset All Data
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
