import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calculator, Database, Upload, History, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '税费计算', icon: Calculator },
  { path: '/hs-codes', label: 'HS编码管理', icon: Database },
  { path: '/tax-rules', label: '税率规则', icon: Database },
  { path: '/batch', label: '批量导入', icon: Upload },
  { path: '/history', label: '计算历史', icon: History },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-blue-600">跨境税费计算器</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
