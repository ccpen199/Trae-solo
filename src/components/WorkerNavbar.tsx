import { Bell, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkerStore } from '@/store/useWorkerStore';

interface WorkerNavbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function WorkerNavbar({ onToggleSidebar, sidebarOpen }: WorkerNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const worker = useWorkerStore((state) => state.worker);

  const statusMap = {
    pending: { label: '待审核', className: 'badge-gray' },
    verified: { label: '已认证', className: 'badge-green' },
    rejected: { label: '已拒绝', className: 'badge-red' },
    blacklisted: { label: '黑名单', className: 'badge-red' },
  };

  const status = worker ? statusMap[worker.status] : statusMap.pending;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-secondary-50 transition-colors"
              onClick={onToggleSidebar}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/worker/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">暖</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-secondary-800 leading-tight">阿姨工作台</h1>
                <p className="text-xs text-secondary-500">暖心到家服务端</p>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-secondary-50 transition-colors">
              <Bell className="w-5 h-5 text-secondary-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <img
                src={worker?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt={worker?.real_name || '阿姨'}
                className="w-10 h-10 rounded-full border-2 border-primary-200 object-cover"
              />
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-secondary-800">{worker?.real_name || '阿姨'}</p>
                  <span className={status.className}>{status.label}</span>
                </div>
                <p className="text-xs text-secondary-500">{worker?.phone}</p>
              </div>
            </div>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary-50"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <User className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-3 animate-fade-up">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary-50">
              <Bell className="w-5 h-5 text-secondary-600" />
              <span className="text-secondary-700">消息通知</span>
              <span className="ml-auto w-2 h-2 bg-primary-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50">
              <img
                src={worker?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt={worker?.real_name || '阿姨'}
                className="w-12 h-12 rounded-full border-2 border-primary-200 object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-secondary-800">{worker?.real_name || '阿姨'}</p>
                  <span className={status.className}>{status.label}</span>
                </div>
                <p className="text-sm text-secondary-500">{worker?.phone}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
