import { NavLink, Outlet } from 'react-router-dom';
import {
  User,
  Calendar,
  Send,
  Wallet,
  Award,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/student/profile', label: '学籍认证', icon: User },
  { path: '/student/schedule', label: '课程表', icon: Calendar },
  { path: '/student/applications', label: '我的投递', icon: Send },
  { path: '/student/wallet', label: '我的钱包', icon: Wallet },
  { path: '/student/certificate', label: '实习证明', icon: Award },
];

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">学生中心</h1>
              <p className="text-xs text-gray-500">Student Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4">
            <p className="text-xs text-gray-600 mb-2">需要帮助？</p>
            <p className="text-sm font-medium text-gray-900">联系客服</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
