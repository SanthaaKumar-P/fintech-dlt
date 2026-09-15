import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ToastContainer } from '@/components/Toast';
import { Landing } from '@/pages/Landing';
import { Overview } from '@/pages/Overview';
import { Settlement } from '@/pages/Settlement';
import { NetworkPage } from '@/pages/Network';
import { Consensus } from '@/pages/Consensus';
import { BlockchainExplorer } from '@/pages/BlockchainExplorer';
import { SecurityCenter } from '@/pages/SecurityCenter';
import { AttackSimulator } from '@/pages/AttackSimulator';
import { AuditTrail } from '@/pages/AuditTrail';
import { Analytics } from '@/pages/Analytics';
import { Architecture } from '@/pages/Architecture';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/overview"
            element={
              <DashboardLayout>
                <Overview />
              </DashboardLayout>
            }
          />
          <Route
            path="/settlement"
            element={
              <DashboardLayout>
                <Settlement />
              </DashboardLayout>
            }
          />
          <Route
            path="/network"
            element={
              <DashboardLayout>
                <NetworkPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/consensus"
            element={
              <DashboardLayout>
                <Consensus />
              </DashboardLayout>
            }
          />
          <Route
            path="/blockchain"
            element={
              <DashboardLayout>
                <BlockchainExplorer />
              </DashboardLayout>
            }
          />
          <Route
            path="/security"
            element={
              <DashboardLayout>
                <SecurityCenter />
              </DashboardLayout>
            }
          />
          <Route
            path="/attacks"
            element={
              <DashboardLayout>
                <AttackSimulator />
              </DashboardLayout>
            }
          />
          <Route
            path="/audit"
            element={
              <DashboardLayout>
                <AuditTrail />
              </DashboardLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            }
          />
          <Route
            path="/architecture"
            element={
              <DashboardLayout>
                <Architecture />
              </DashboardLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
