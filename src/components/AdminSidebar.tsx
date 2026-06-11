import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Radio,
  AlertTriangle,
  Users,
  BarChart3,
  Shield,
} from 'lucide-react';

export default function AdminSidebar() {
  const navItems = [
    { path: '/admin', label: '数据概览', icon: LayoutDashboard },
    { path: '/admin/settlement', label: '清分结算', icon: Receipt },
    { path: '/admin/obu', label: 'OBU管理', icon: Radio },
    { path: '/admin/exception', label: '异常事件', icon: AlertTriangle },
    { path: '/admin/users', label: '用户管理', icon: Users },
    { path: '/admin/reports', label: '数据报表', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-dark-800 min-h-screen hidden lg:block">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">管理后台</h1>
            <p className="text-xs text-dark-400">运营管理中心</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 p-4 bg-dark-700 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-dark-300">系统运行正常</span>
          </div>
          <p className="text-xs text-dark-400">
            当前处理交易 <span className="text-white font-medium">12,568</span> 笔/小时
          </p>
        </div>
      </div>
    </aside>
  );
}
