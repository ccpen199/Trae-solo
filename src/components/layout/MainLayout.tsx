import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function MainLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-finance-900 text-slate-200">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-grid-pattern bg-gold-glow">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
