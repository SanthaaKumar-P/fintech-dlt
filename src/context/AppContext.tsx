import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  initializeNetwork,
  fetchNodes,
  fetchTransactions,
  fetchBlocks,
  fetchSecurityEvents,
  fetchAccounts,
  fetchAuditLogs,
  type NodeRow,
  type TxRow,
  type BlockRow,
  type SecurityEventRow,
  type AccountRow,
  type AuditLogRow,
} from '@/lib/engine';

interface AppContextValue {
  initialized: boolean;
  loading: boolean;
  nodes: NodeRow[];
  transactions: TxRow[];
  blocks: BlockRow[];
  securityEvents: SecurityEventRow[];
  accounts: AccountRow[];
  auditLogs: AuditLogRow[];
  explainMode: boolean;
  refresh: () => Promise<void>;
  setExplainMode: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<NodeRow[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEventRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [explainMode, setExplainMode] = useState(false);

  const refresh = async () => {
    const [n, t, b, s, a, al] = await Promise.all([
      fetchNodes(),
      fetchTransactions(200),
      fetchBlocks(),
      fetchSecurityEvents(200),
      fetchAccounts(),
      fetchAuditLogs(300),
    ]);
    setNodes(n);
    setTransactions(t);
    setBlocks(b);
    setSecurityEvents(s);
    setAccounts(a);
    setAuditLogs(al);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await initializeNetwork();
        setInitialized(true);
        await refresh();
      } catch (err) {
        console.error('Initialization failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppContext.Provider
      value={{
        initialized,
        loading,
        nodes,
        transactions,
        blocks,
        securityEvents,
        accounts,
        auditLogs,
        explainMode,
        refresh,
        setExplainMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
