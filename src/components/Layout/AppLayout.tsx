import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '@/store/auth';

export function AppLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} todoCount={0} onLogout={logout} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
