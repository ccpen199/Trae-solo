import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

const mockNotifications = [
  {
    id: '1',
    title: '新的候选人匹配',
    content: '您发布的"前端工程师"职位有3位高匹配度候选人',
    read: false,
    createdAt: new Date(),
    type: 'match' as const,
  },
  {
    id: '2',
    title: '新消息',
    content: '候选人李明回复了您的面试邀请',
    read: false,
    createdAt: new Date(Date.now() - 3600000),
    type: 'message' as const,
  },
  {
    id: '3',
    title: '系统通知',
    content: '您的企业资质已成功更新',
    read: true,
    createdAt: new Date(Date.now() - 86400000),
    type: 'system' as const,
  },
];

export function PageLayout({ children, title, subtitle, rightAction }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userRole={user.role}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            user={user}
            notifications={mockNotifications}
          />

          <main className="flex-1 p-4 lg:p-6 lg:pl-8">
            {title && (
              <div className="mb-6 animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-serif text-2xl lg:text-3xl font-bold text-primary-800">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="mt-1 text-sm lg:text-base text-neutral-500">{subtitle}</p>
                    )}
                  </div>
                  {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
                </div>
                <div className="mt-4 h-1 w-20 bg-gradient-to-r from-primary-500 via-mint-400 to-accent-400 rounded-full" />
              </div>
            )}

            <div
              className={cn(
                'animate-fade-in',
                title && 'animate-slide-up'
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
