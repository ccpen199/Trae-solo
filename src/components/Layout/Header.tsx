import { useState } from 'react';
import {
  Bell,
  Wifi,
  WifiOff,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/types';

interface HeaderProps {
  user: UserType;
  todoCount?: number;
  onLogout: () => void;
}

export function Header({ user, todoCount = 0, onLogout }: HeaderProps) {
  const [isOnline] = useState(navigator.onLine);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleLabels: Record<UserType['role'], string> = {
    admin: '系统管理员',
    operator: '运营人员',
    auditor: '审核员',
    courier: '快递员',
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-800">欢迎回来，{user.realName}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
            {isOnline ? '在线' : '离线'}
          </span>
        </div>

        <button className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
          {todoCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
              {todoCount > 99 ? '99+' : todoCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <User className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-800">{user.realName}</div>
              <div className="text-xs text-gray-500">{roleLabels[user.role]}</div>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-gray-500 transition-transform', showUserMenu && 'rotate-180')} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
