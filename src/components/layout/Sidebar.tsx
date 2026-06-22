import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  ReceiptText,
  Calendar as CalendarIcon,
  FileSignature,
  ScrollText,
  Home,
} from 'lucide-react';
import { classNames } from '@/utils/formatters';
import { useAppStore } from '@/store';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
}

export default function Sidebar() {
  const location = useLocation();
  const bills = useAppStore((s) => s.bills);
  const overdue = bills.filter((b) => b.status === 'overdue').length;

  const items: NavItem[] = [
    { to: '/', label: '收支仪表盘', icon: LayoutDashboard },
    { to: '/properties', label: '房源管理', icon: Building2 },
    { to: '/tenants', label: '租客管理', icon: Users },
    { to: '/meter-reading', label: '集中抄表', icon: ClipboardList },
    { to: '/bills', label: '账单中心', icon: ReceiptText, badge: overdue || undefined },
    { to: '/calendar', label: '收租日历', icon: CalendarIcon },
    { to: '/lease', label: '租约中心', icon: FileSignature },
    { to: '/logs', label: '操作日志', icon: ScrollText },
  ];

  return (
    <aside className="w-60 shrink-0 bg-slate-900 text-slate-200 flex flex-col">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-900/30">
          <Home className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="font-serif text-base font-bold text-white">房掌柜</div>
          <div className="text-[10px] text-slate-400 tracking-wide">PROPERTY · SaaS</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active =
            it.to === '/' ? location.pathname === '/' : location.pathname.startsWith(it.to);
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={classNames(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'bg-gradient-to-r from-brand-700/80 to-brand-600/40 text-white shadow-inner'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-400 rounded-r-full" />
              )}
              <it.icon
                className={classNames(
                  'w-4.5 h-4.5 transition-transform group-hover:scale-110',
                  active ? 'text-brand-200' : 'text-slate-400 group-hover:text-slate-200'
                )}
                style={{ width: 18, height: 18 }}
              />
              <span className="flex-1">{it.label}</span>
              {it.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse-soft">
                  {it.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-brand-900/40 to-slate-800/40 border border-slate-700/60">
        <div className="text-[11px] text-slate-400 mb-1">💡 今日提示</div>
        <div className="text-xs text-slate-200 leading-relaxed">
          根据《民法典》第705条，租赁期限不得超过 <b className="text-brand-300">20年</b>。
        </div>
      </div>
    </aside>
  );
}
