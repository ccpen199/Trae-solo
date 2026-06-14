import { Bell, Search, User, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-40 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-bold text-secondary-800">{title}</h1>
        {subtitle && <p className="text-xs text-secondary-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="搜索订单、阿姨、客户..."
            className="w-64 pl-10 pr-4 py-2 bg-secondary-50 border border-transparent rounded-xl text-sm focus:outline-none focus:border-secondary-300 focus:bg-white transition-all"
          />
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl hover:bg-secondary-50 transition-colors"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-secondary-600" />
          ) : (
            <Moon className="w-5 h-5 text-secondary-600" />
          )}
        </button>

        <button className="relative p-2 rounded-xl hover:bg-secondary-50 transition-colors">
          <Bell className="w-5 h-5 text-secondary-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-secondary-800 leading-tight">管理员</p>
            <p className="text-xs text-secondary-500">admin@nuanxin.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}
