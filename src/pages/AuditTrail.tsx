import { useMemo, useState } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardBody } from '@/components/Card';
import { Badge } from '@/components/Badge';

export function AuditTrail() {
  const { auditLogs, loading } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch = !search ||
        log.event.toLowerCase().includes(search.toLowerCase()) ||
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        (log.details?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (log.transaction_id?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesFilter = filter === 'ALL' || log.severity === filter;
      return matchesSearch && matchesFilter;
    });
  }, [auditLogs, search, filter]);

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Audit Trail</h1>
        <p className="text-sm text-text-secondary">
          Immutable log of every significant network action — {auditLogs.length} entries
        </p>
      </div>

      <Card>
        <CardHeader
          title="Audit Log"
          subtitle="Searchable, filterable event history"
          icon={<ScrollText size={16} className="text-accent" />}
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:border-accent outline-none w-48"
                />
              </div>
              <div className="flex gap-1">
                {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map((f) => (
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
            </div>
          }
        />
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-5">
              <ScrollText size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No audit entries found.</p>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {filtered.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-4 border-b border-border-default/50 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-tertiary flex-shrink-0 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${
                      log.severity === 'CRITICAL' ? 'bg-error' :
                      log.severity === 'WARNING' ? 'bg-warning' :
                      'bg-accent'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary font-mono">
                        {log.event}
                      </span>
                      <Badge variant={
                        log.severity === 'CRITICAL' ? 'error' :
                        log.severity === 'WARNING' ? 'warning' : 'info'
                      }>
                        {log.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-text-secondary mt-1">{log.details}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                      <span>·</span>
                      <span>Actor: {log.actor}</span>
                      {log.transaction_id && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-accent">{log.transaction_id.slice(0, 14)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
