import { Link, useLocation } from 'react-router-dom';
import { QrCode, Package, Calendar, RefreshCw, BarChart3, Home } from 'lucide-react';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/verification', label: '核销台', icon: QrCode },
  { path: '/packages', label: '券包管理', icon: Package },
  { path: '/appointments', label: '预约管理', icon: Calendar },
  { path: '/refunds', label: '退款处理', icon: RefreshCw },
  { path: '/merchant', label: '商家后台', icon: BarChart3 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">团购券核销系统</h1>
            </div>
            <div className="ml-8 flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
