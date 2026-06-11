import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  ArrowLeft,
  Settings,
} from 'lucide-react';

const adminNavItems = [
  { path: '/admin/city-service', label: '地市服务配置', icon: Settings },
  { path: '/admin/knowledge', label: '政策问答知识图谱', icon: BookOpen },
  { path: '/admin/fund-monitor', label: '基金运行监测', icon: BarChart3 },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-gov-red" />
            <div>
              <h2 className="text-base font-bold">后台管理中心</h2>
              <p className="text-xs text-gray-500">Admin Console</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition ${
                      isActive
                        ? 'bg-gov-red text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            返回服务大厅
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              河北省人社综合服务平台 · 管理后台
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">地市管理员：石家庄市 · admin_sjz</p>
          </div>
          <LayoutDashboard className="w-5 h-5 text-gray-400" />
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
