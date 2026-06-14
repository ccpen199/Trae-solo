import { useState } from 'react';
import Sidebar, { TopBar } from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Repair from '@/pages/Repair';
import Worker from '@/pages/Worker';
import Tracking from '@/pages/Tracking';
import Escrow from '@/pages/Escrow';
import Quality from '@/pages/Quality';
import AdminSettings from '@/pages/AdminSettings';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'repair': return <Repair />;
      case 'worker': return <Worker />;
      case 'tracking': return <Tracking />;
      case 'escrow': return <Escrow />;
      case 'quality': return <Quality />;
      case 'admin': return <AdminSettings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
