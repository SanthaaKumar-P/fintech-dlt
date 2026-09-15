import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardBody } from '@/components/Card';

const COLORS = {
  committed: '#10b981',
  rejected: '#ef4444',
  processing: '#3b82f6',
  replay: '#f59e0b',
  signature: '#8b5cf6',
  doubleSpend: '#ef4444',
  tampering: '#ec4899',
  nodeFailure: '#06b6d4',
  success: '#10b981',
  failed: '#ef4444',
};

export function Analytics() {
  const { transactions, securityEvents, nodes, blocks } = useApp();

  const txOverTime = useMemo(() => {
    const byHour: Record<string, { time: string; committed: number; rejected: number }> = {};
    transactions.forEach((tx) => {
      const hour = new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      if (!byHour[hour]) byHour[hour] = { time: hour, committed: 0, rejected: 0 };
      if (tx.status === 'COMMITTED') byHour[hour].committed++;
      if (tx.status === 'REJECTED') byHour[hour].rejected++;
    });
    return Object.values(byHour).slice(-20);
  }, [transactions]);

  const txStatusData = useMemo(() => {
    const committed = transactions.filter((t) => t.status === 'COMMITTED').length;
    const rejected = transactions.filter((t) => t.status === 'REJECTED').length;
    const processing = transactions.filter((t) => t.status === 'PROCESSING').length;
    return [
      { name: 'Committed', value: committed, color: COLORS.committed },
      { name: 'Rejected', value: rejected, color: COLORS.rejected },
      { name: 'Processing', value: processing, color: COLORS.processing },
    ].filter((d) => d.value > 0);
  }, [transactions]);

  const threatData = useMemo(() => {
    const types: Record<string, number> = {};
    securityEvents.forEach((e) => {
      const key = e.event_type.replace(/_/g, ' ');
      types[key] = (types[key] || 0) + 1;
    });
    return Object.entries(types).map(([name, count]) => ({ name, count }));
  }, [securityEvents]);

  const consensusData = useMemo(() => {
    const committed = transactions.filter((t) => t.status === 'COMMITTED').length;
    const rejected = transactions.filter((t) => t.status === 'REJECTED').length;
    return [
      { name: 'Successful', value: committed, color: COLORS.success },
      { name: 'Failed', value: rejected, color: COLORS.failed },
    ].filter((d) => d.value > 0);
  }, [transactions]);

  const nodeHealthData = useMemo(() => {
    return nodes.map((n) => ({
      name: n.id,
      validations: n.validations,
      approvals: n.approvals,
      rejections: n.rejections,
    }));
  }, [nodes]);

  const hasData = transactions.length > 0 || securityEvents.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Analytics</h1>
        <p className="text-sm text-text-secondary">
          Network performance, security metrics, and consensus analytics
        </p>
      </div>

      {!hasData ? (
        <Card className="p-12 text-center">
          <BarChart3 size={40} className="text-text-muted mx-auto mb-4" />
          <p className="text-sm text-text-secondary">No analytics data yet.</p>
          <p className="text-xs text-text-muted mt-1">Create transactions and run attacks to populate charts.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transactions Over Time */}
            <Card>
              <CardHeader title="Transactions Over Time" subtitle="Committed vs rejected" icon={<TrendingUp size={16} className="text-accent" />} />
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={txOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f1626', border: '1px solid #1e2a45', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="committed" stroke={COLORS.committed} strokeWidth={2} name="Committed" />
                    <Line type="monotone" dataKey="rejected" stroke={COLORS.rejected} strokeWidth={2} name="Rejected" />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Transaction Status */}
            <Card>
              <CardHeader title="Transaction Status" subtitle="Distribution by status" icon={<PieIcon size={16} className="text-crypto" />} />
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={txStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {txStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f1626', border: '1px solid #1e2a45', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Threat Distribution */}
            <Card>
              <CardHeader title="Threat Distribution" subtitle="Security events by type" icon={<Activity size={16} className="text-error" />} />
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={threatData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-15} textAnchor="end" height={50} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f1626', border: '1px solid #1e2a45', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Consensus Performance */}
            <Card>
              <CardHeader title="Consensus Performance" subtitle="Successful vs failed rounds" icon={<Activity size={16} className="text-success" />} />
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={consensusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {consensusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f1626', border: '1px solid #1e2a45', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          {/* Node Health */}
          <Card>
            <CardHeader title="Node Performance" subtitle="Validations, approvals, and rejections per node" icon={<BarChart3 size={16} className="text-accent" />} />
            <CardBody>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={nodeHealthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a45" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0f1626', border: '1px solid #1e2a45', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="validations" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Validations" />
                  <Bar dataKey="approvals" fill="#10b981" radius={[4, 4, 0, 0]} name="Approvals" />
                  <Bar dataKey="rejections" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rejections" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
