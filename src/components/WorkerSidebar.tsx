import { LayoutDashboard, FileCheck, BarChart3, ClipboardList, Wallet, Settings, LogOut, Star, Clock } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useWorkerStore } from '@/store/useWorkerStore';
import { cn } from '@/lib/utils';

interface WorkerSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function WorkerSidebar({ open, onClose }: WorkerSidebarProps) {
  const location = useLocation();
  const worker = useWorkerStore((state) => state.worker);
  const score = useWorkerStore((state) => state.score);

  const menuItems = [
    { path: '/worker/dashboard', label: '工作台', icon: LayoutDashboard },
    { path: '/worker/profile', label: '资质管理', icon: FileCheck },
    { path: '/worker/scoring', label: '评分看板', icon: BarChart3 },
    { path: '/worker/orders', label: '订单记录', icon: ClipboardList },
    { path: '/worker/wallet', label: '我的钱包', icon: Wallet },
    { path: '/worker/settings', label: '设置', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-gradient-to-b from-secondary-700 to-secondary-800 text-white transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-secondary-600">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={worker?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt={worker?.real_name || '阿姨'}
                className="w-14 h-14 rounded-full border-3 border-primary-400 object-cover"
              />
              <div>
                <h3 className="font-bold text-lg">{worker?.real_name || '阿姨'}</h3>
                <p className="text-secondary-300 text-sm">工号 #{worker?.id || '000'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary-600/50 rounded-xl p-3">
                <div className="flex items-center gap-1 text-primary-300 mb-1">
                  <Star className="w-4 h-4 fill-primary-400 text-primary-400" />
                  <span className="text-sm">综合评分</span>
                </div>
                <p className="text-2xl font-bold">{score?.overall_score || '--'}</p>
              </div>
              <div className="bg-secondary-600/50 rounded-xl p-3">
                <div className="flex items-center gap-1 text-primary-300 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">完成订单</span>
                </div>
                <p className="text-2xl font-bold">{score?.total_orders || 0}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
            <p className="px-6 text-secondary-400 text-xs font-medium uppercase tracking-wider mb-2">
              导航菜单
            </p>
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                        isActive(item.path)
                          ? 'bg-primary-500 text-white shadow-soft'
                          : 'text-secondary-200 hover:bg-secondary-600/50 hover:text-white'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', isActive(item.path) && 'animate-pulse-slow')} />
                      <span className="font-medium">{item.label}</span>
                      {item.path === '/worker/dashboard' && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-primary-300 animate-pulse" />
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-secondary-600">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-secondary-300 hover:bg-secondary-600/50 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">退出登录</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
