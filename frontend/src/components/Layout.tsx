import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, AlertTriangle, BarChart3, Plane } from 'lucide-react';

const navItems = [
  { path: '/', label: '运营概览', icon: LayoutDashboard },
  { path: '/tickets', label: '工单列表', icon: FileText },
  { path: '/tickets/new', label: '创建工单', icon: PlusCircle },
  { path: '/exceptions', label: '异常队列', icon: AlertTriangle },
  { path: '/reports', label: '运营报表', icon: BarChart3 },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">机场旅客服务工单系统</h1>
                <p className="text-xs text-slate-300">航站楼服务请求与投诉处理平台</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">当前用户：<span className="text-white font-medium">值班经理</span></p>
              <p className="text-xs text-slate-400">{new Date().toLocaleString('zh-CN')}</p>
            </div>
          </div>
        </div>
        
        <nav className="border-t border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                      isActive
                        ? 'border-blue-400 text-white bg-slate-700/30'
                        : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-700/20'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
