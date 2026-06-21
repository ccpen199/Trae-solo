import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore, useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const { isLoggedIn } = useAuthStore();
  const { sidebarCollapsed } = useAppStore();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-dark-950 bg-grid">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300 min-h-screen',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
