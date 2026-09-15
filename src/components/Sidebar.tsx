import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Network,
  Users,
  Boxes,
  ShieldCheck,
  Bug,
  ScrollText,
  BarChart3,
  Cpu,
  Activity,
  CircleDot,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Logo } from './Logo';

const navItems = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/settlement', label: 'Settlement', icon: ArrowLeftRight },
  { to: '/network', label: 'Network', icon: Network },
  { to: '/consensus', label: 'Consensus', icon: Users },
  { to: '/blockchain', label: 'Blockchain Explorer', icon: Boxes },
  { to: '/security', label: 'Security Center', icon: ShieldCheck },
  { to: '/attacks', label: 'Attack Simulator', icon: Bug },
  { to: '/audit', label: 'Audit Trail', icon: ScrollText },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/architecture', label: 'Architecture', icon: Cpu },
];

export function Sidebar() {
  const { nodes, blocks } = useApp();
  const location = useLocation();

  const onlineCount = nodes.filter((n) => n.online).length;
  const totalNodes = nodes.length;
  const blockHeight = blocks.length > 0 ? blocks[blocks.length - 1].block_number : 0;

  const healthPercent = totalNodes > 0 ? Math.round((onlineCount / totalNodes) * 100) : 0;
  const healthColor = healthPercent >= 75 ? 'text-success' : healthPercent >= 50 ? 'text-warning' : 'text-error';

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col border-r border-border-default bg-bg-secondary/80 backdrop-blur-md">
      <div className="p-5 border-b border-border-default">
        <Logo size="md" />
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-accent/10 text-accent border border-accent/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-transparent'
              }`}
            >
              <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-default space-y-3">
        <div className="glass-panel p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted flex items-center gap-1.5">
              <Activity size={12} /> Network Health
            </span>
            <span className={`font-bold ${healthColor}`}>{healthPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                healthPercent >= 75 ? 'bg-success' : healthPercent >= 50 ? 'bg-warning' : 'bg-error'
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted flex items-center gap-1.5">
              <CircleDot size={12} /> Connected Nodes
            </span>
            <span className="text-text-primary font-semibold">{onlineCount}/{totalNodes}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Block Height</span>
            <span className="text-text-primary font-semibold">#{blockHeight}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Environment</span>
            <span className="text-crypto font-semibold">Simulation</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">API Status</span>
            <span className="flex items-center gap-1 text-success font-semibold">
              <span className="status-dot online" /> Operational
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
