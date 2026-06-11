import { NavLink } from 'react-router-dom';
import {
  Network,
  FileSearch,
  Bell,
  Users,
  GitBranch,
  ShieldCheck,
  ScrollText,
  ChevronDown,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: Network, label: '知识图谱' },
  { to: '/extraction', icon: FileSearch, label: '信息抽取' },
  { to: '/subscriptions', icon: Bell, label: '订阅推送' },
  { to: '/workspace', icon: Users, label: '协作空间' },
];

const adminItems = [
  { to: '/admin/lineage', icon: GitBranch, label: '数据血缘' },
  { to: '/admin/sources', icon: ShieldCheck, label: '信源评分' },
  { to: '/admin/summaries', icon: ScrollText, label: '摘要审核' },
];

export default function Sidebar() {
  const [adminOpen, setAdminOpen] = useState(true);

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gold-500/10 bg-finance-800/80 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 border-b border-gold-500/10 px-5 py-4.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-gold-400 to-gold-700 shadow-gold">
          <TrendingUp className="h-5 w-5 text-finance-900" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-base font-semibold text-gold-300">FinanceGraph</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Research Platform</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          主功能
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                isActive
                  ? 'bg-gold-500/15 text-gold-300 shadow-inner'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <button
          onClick={() => setAdminOpen(!adminOpen)}
          className="mt-5 mb-2 flex w-full items-center justify-between px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500 hover:text-slate-300"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            后台管理
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${adminOpen ? '' : '-rotate-90'}`}
          />
        </button>

        {adminOpen && (
          <div className="space-y-1 pl-1">
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                    isActive
                      ? 'bg-gold-500/15 text-gold-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-gold-500/10 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-finance-500 to-finance-700 text-xs font-semibold text-gold-300">
            李
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm text-slate-200">李明远</span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              高级分析师
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
