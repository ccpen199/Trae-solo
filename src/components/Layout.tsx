import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  ClipboardList,
  BookOpen,
  Settings,
  User,
  Bell
} from 'lucide-react';
import { useUserStore } from '@/store';

const statusLabels: Record<string, string> = {
  pending: '待处理',
  underwriting: '核保中',
  supplementary: '待补充',
  approved: '已通过',
  rated: '加费通过',
  excluded: '除外通过',
  postponed: '延期处理',
  rejected: '已拒保'
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  underwriting: 'bg-blue-100 text-blue-800',
  supplementary: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  rated: 'bg-purple-100 text-purple-800',
  excluded: 'bg-indigo-100 text-indigo-800',
  postponed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800'
};

const menuItems = [
  { path: '/', label: '工作台', icon: Home },
  { path: '/applications', label: '核保队列', icon: ClipboardList },
  { path: '/rules', label: '核保规则', icon: BookOpen },
];

export default function Layout() {
  const location = useLocation();
  const { currentUser } = useUserStore();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <ShieldIcon className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">保险核保工作台</span>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                  <p className="text-xs text-gray-500">{currentUser?.role === 'underwriter' ? '核保员' : currentUser?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export { statusLabels, statusColors };
