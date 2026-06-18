import { Bell, Search, User } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const roleMap: Record<string, string> = {
    sales: '直销员',
    store_owner: '生活馆店主',
    operator: '运营专员',
    admin: '系统管理员',
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索..."
            className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors" onClick={() => navigate('/profile')}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-brand-600 flex items-center justify-center text-white font-medium">
            {user?.realName?.[0] || <User className="w-5 h-5" />}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">{user?.realName}</p>
            <p className="text-xs text-gray-500">{roleMap[user?.role || '']}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
