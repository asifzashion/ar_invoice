import { useStore } from './store/useStore';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { InvoiceList } from './pages/InvoiceList';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { EnterInvoice } from './pages/EnterInvoice';
import { MyAssignments } from './pages/MyAssignments';
import { Analytics } from './pages/Analytics';
import { DataManagement } from './pages/DataManagement';
import { UsersPage } from './pages/UsersPage';
import { cn } from './lib/utils';

function AppContent() {
  const { activeView, sidebarOpen } = useStore();

  const renderView = () => {
    if (activeView === 'dashboard') return <Dashboard />;
    if (activeView === 'invoices') return <InvoiceList />;
    if (activeView === 'assignments') return <MyAssignments />;
    if (activeView === 'enter-invoice') return <EnterInvoice />;
    if (activeView === 'analytics') return <Analytics />;
    if (activeView === 'upload') return <DataManagement />;
    if (activeView === 'users') return <UsersPage />;
    if (activeView.startsWith('invoice-')) {
      const invoiceNumber = activeView.replace('invoice-', '');
      return <InvoiceDetail invoiceNumber={invoiceNumber} />;
    }
    return <Dashboard />;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  const { currentUser } = useStore();

  if (!currentUser) {
    return <LoginPage />;
  }

  return <AppContent />;
}

export default App;
