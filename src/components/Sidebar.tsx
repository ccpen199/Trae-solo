import { useState } from 'react';
import { LayoutDashboard, Wrench, UserCog, MapPin, Wallet, FileCheck, Settings, Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', name: '调度大屏', icon: LayoutDashboard },
  { id: 'repair', name: '业主报修', icon: Wrench },
  { id: 'worker', name: '师傅工作台', icon: UserCog },
  { id: 'tracking', name: '服务追踪', icon: MapPin },
  { id: 'escrow', name: '资金担保', icon: Wallet },
  { id: 'quality', name: '质量回溯', icon: FileCheck },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen">
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">维修调度中台</h1>
            <p className="text-xs text-slate-400">Home Repair Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 px-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            系统
          </div>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => onNavigate('admin')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  currentPage === 'admin'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Settings className="w-5 h-5" />
                <span>后台管理</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="p-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold">
            管
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">系统管理员</p>
            <p className="text-xs text-slate-400">admin@repair.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function TopBar() {
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索订单号、师傅姓名、业主信息..."
            className="w-80 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
          />
          {trimmedQuery && (
            <div className="absolute left-0 top-11 z-30 w-[28rem] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
              <div className="text-sm font-semibold text-slate-800">
                搜索结果：{trimmedQuery}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="rounded-lg bg-orange-50 p-2 text-orange-700">匹配订单 ORD20240614002</div>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-700">匹配师傅 张师傅</div>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">筛选故障 插座故障</div>
                <div className="rounded-lg bg-slate-50 p-2 text-slate-700">后台搜索已同步</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">上海运营中心</p>
            <p className="text-xs text-slate-400">今日在线 18 位师傅</p>
          </div>
        </div>
      </div>
    </header>
  );
}
