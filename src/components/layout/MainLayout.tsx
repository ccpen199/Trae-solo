import { Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/app';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen w-full bg-space-900">
      <Sidebar />
      <Topbar />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          sidebarCollapsed ? 'ml-[76px]' : 'ml-[248px]'
        )}
      >
        <div className="h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
