import { useEffect, useState } from 'react';
import type { NodeRow } from '@/lib/engine';

export function NetworkTopology({ nodes }: { nodes: NodeRow[] }) {
  const [activeFlow, setActiveFlow] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFlow(true);
      setTimeout(() => setActiveFlow(false), 2000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const positions = [
    { x: 50, y: 15, label: 'BANK A' },
    { x: 85, y: 50, label: 'BANK B' },
    { x: 50, y: 85, label: 'BANK C' },
    { x: 15, y: 50, label: 'BANK D' },
  ];

  return (
    <div className="relative w-full" style={{ aspectRatio: '1.2' }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Connection lines from center to each node */}
        {positions.map((pos, i) => {
          const node = nodes[i];
          if (!node) return null;
          const color = !node.online ? '#475569' : node.malicious ? '#ef4444' : '#3b82f6';
          return (
            <line
              key={`line-${i}`}
              x1="50"
              y1="50"
              x2={pos.x}
              y2={pos.y}
              stroke={color}
              strokeWidth="0.4"
              strokeOpacity="0.4"
              strokeDasharray={activeFlow ? '2 2' : 'none'}
              className={activeFlow ? 'animate-pulse' : ''}
            />
          );
        })}

        {/* Cross connections between nodes */}
        {positions.map((pos, i) =>
          positions.slice(i + 1).map((pos2, j) => (
            <line
              key={`cross-${i}-${j}`}
              x1={pos.x}
              y1={pos.y}
              x2={pos2.x}
              y2={pos2.y}
              stroke="#1e2a45"
              strokeWidth="0.2"
              strokeOpacity="0.3"
            />
          )),
        )}

        {/* Center: FINSHIELD */}
        <circle cx="50" cy="50" r="8" fill="#0f1626" stroke="#3b82f6" strokeWidth="0.5" />
        <text x="50" y="49" textAnchor="middle" fontSize="2.5" fill="#3b82f6" fontWeight="bold">
          FINSHIELD
        </text>
        <text x="50" y="53" textAnchor="middle" fontSize="2" fill="#64748b">
          DLT
        </text>

        {/* Nodes */}
        {positions.map((pos, i) => {
          const node = nodes[i];
          if (!node) return null;
          const color = !node.online ? '#475569' : node.malicious ? '#ef4444' : '#10b981';
          return (
            <g key={`node-${i}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="6"
                fill="#0f1626"
                stroke={color}
                strokeWidth="0.5"
                className={node.online && !node.malicious ? 'animate-pulse' : ''}
              />
              <circle cx={pos.x} cy={pos.y} r="1.5" fill={color} />
              <text x={pos.x} y={pos.y - 8} textAnchor="middle" fontSize="2.2" fill="#e2e8f0" fontWeight="bold">
                {pos.label}
              </text>
              <text x={pos.x} y={pos.y + 10} textAnchor="middle" fontSize="1.6" fill={color}>
                {node.online ? (node.malicious ? 'MALICIOUS' : 'ONLINE') : 'OFFLINE'}
              </text>
              <text x={pos.x} y={pos.y + 13} textAnchor="middle" fontSize="1.4" fill="#64748b">
                {node.validations} validations
              </text>
            </g>
          );
        })}

        {/* Animated flow particles */}
        {activeFlow &&
          positions.map((pos, i) => (
            <circle key={`particle-${i}`} r="0.8" fill="#60a5fa">
              <animateMotion dur="2s" path={`M50,50 L${pos.x},${pos.y}`} />
            </circle>
          ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex gap-3 text-xs">
        <span className="flex items-center gap-1 text-text-muted">
          <span className="status-dot online" /> Online
        </span>
        <span className="flex items-center gap-1 text-text-muted">
          <span className="status-dot malicious" /> Malicious
        </span>
        <span className="flex items-center gap-1 text-text-muted">
          <span className="status-dot offline" /> Offline
        </span>
      </div>
    </div>
  );
}
