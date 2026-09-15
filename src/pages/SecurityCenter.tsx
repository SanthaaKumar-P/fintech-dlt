import { useMemo, useState } from 'react';
import { ShieldAlert, ShieldCheck, ShieldOff, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardBody } from '@/components/Card';
import { Badge } from '@/components/Badge';

export function SecurityCenter() {
  const { securityEvents, loading } = useApp();
  const [filter, setFilter] = useState<string>('ALL');

  const stats = useMemo(() => {
    const threats = securityEvents.length;
    const blocked = securityEvents.filter((e) => e.action.includes('REJECTED') || e.action.includes('BLOCKED') || e.action.includes('QUARANTINED') || e.action.includes('OFFLINE') || e.action.includes('VIOLATION')).length;
    const critical = securityEvents.filter((e) => e.severity === 'CRITICAL').length;
    const integrity = securityEvents.some((e) => e.event_type === 'LEDGER_TAMPERING') ? 'COMPROMISED' : 'VERIFIED';
    return { threats, blocked, critical, integrity };
  }, [securityEvents]);

  const filteredEvents = filter === 'ALL'
    ? securityEvents
    : securityEvents.filter((e) => e.severity === filter);

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Security Center</h1>
        <p className="text-sm text-text-secondary">
          Cybersecurity command center — threat detection and response monitoring
        </p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card hover className="p-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10 mb-3">
            <ShieldAlert size={20} className="text-warning" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{stats.threats}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Threats Detected</div>
        </Card>
        <Card hover className="p-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10 mb-3">
            <ShieldCheck size={20} className="text-success" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{stats.blocked}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Threats Blocked</div>
        </Card>
        <Card hover className="p-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-error/10 mb-3">
            <ShieldOff size={20} className="text-error" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{stats.critical}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Critical Events</div>
        </Card>
        <Card hover className="p-5">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${stats.integrity === 'VERIFIED' ? 'bg-success/10' : 'bg-error/10'}`}>
            <Lock size={20} className={stats.integrity === 'VERIFIED' ? 'text-success' : 'text-error'} />
          </div>
          <div className={`text-lg font-bold ${stats.integrity === 'VERIFIED' ? 'text-success' : 'text-error'}`}>{stats.integrity}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Integrity Status</div>
        </Card>
      </div>

      {/* Security event table */}
      <Card>
        <CardHeader
          title="Security Event Log"
          subtitle={`${securityEvents.length} security events recorded`}
          icon={<ShieldAlert size={16} className="text-warning" />}
          action={
            <div className="flex gap-1">
              {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-accent/10 text-accent border border-accent/30'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        />
        <CardBody className="p-0">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 px-5">
              <ShieldCheck size={32} className="text-success mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No security events detected.</p>
              <p className="text-xs text-text-muted mt-1">All validators are healthy.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-text-muted uppercase tracking-wider border-b border-border-default">
                    <th className="text-left px-4 py-3 font-medium">Time</th>
                    <th className="text-left px-4 py-3 font-medium">Threat</th>
                    <th className="text-left px-4 py-3 font-medium">Transaction</th>
                    <th className="text-left px-4 py-3 font-medium">Node</th>
                    <th className="text-center px-4 py-3 font-medium">Severity</th>
                    <th className="text-left px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b border-border-default/50 hover:bg-bg-tertiary/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {new Date(event.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-primary font-medium">
                          {event.event_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-accent">
                        {event.transaction_id ? event.transaction_id.slice(0, 14) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {event.node_id || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          event.severity === 'CRITICAL' ? 'error' :
                          event.severity === 'HIGH' ? 'warning' :
                          event.severity === 'MEDIUM' ? 'info' : 'neutral'
                        }>
                          {event.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {event.action}
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
  );
}
