import { useEffect } from 'react';
import { Link, NavLink, useLocation, Navigate, Routes, Route, useNavigate } from 'react-router-dom';
import {
  Globe2, Banknote, LayoutDashboard, CalendarClock, ClipboardList, UserCircle, LineChart as LineChartIcon, Search as SearchIcon, Sparkles, X, Menu,
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/app';
import { CURRENCY_META, LANGUAGE_LABEL, classNames } from '@/utils/meta';
import type { Currency, Language } from '@/shared/types';
import Dashboard from '@/pages/Dashboard';
import EventList from '@/pages/EventList';
import EventDetail from '@/pages/EventDetail';
import TicketCenter from '@/pages/TicketCenter';
import ScheduleBoard from '@/pages/ScheduleBoard';
import AdminConsole from '@/pages/AdminConsole';
import ProfileCenter from '@/pages/ProfileCenter';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { language, currency, setLanguage, setCurrency } = useAppStore();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { setMenu(false); }, [location.pathname]);

  const navs = [
    { to: '/', label: '首页仪表板', icon: LayoutDashboard },
    { to: '/events', label: '演出票务', icon: Sparkles },
    { to: '/tickets', label: '工单中心', icon: ClipboardList },
    { to: '/schedule', label: '排期验票', icon: CalendarClock },
    { to: '/admin', label: '管理后台', icon: LineChartIcon },
    { to: '/profile', label: '个人中心', icon: UserCircle },
  ];

  const nav = useNavigate();
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) nav(`/events?keyword=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-ink-950/70">
        <div className="container flex items-center gap-4 py-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-xl grid place-items-center text-white font-display font-black text-lg shadow-glow" style={{ background: 'linear-gradient(135deg,#FF2E88 0%, #8B5CF6 100%)' }}>S</div>
            <div className="leading-tight">
              <div className="font-display font-bold text-lg tracking-tight">StarPass <span className="text-neon-pink">星程</span></div>
              <div className="text-[10px] text-white/50 tracking-widest uppercase">Global Live Ticketing Infra</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {navs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  classNames(
                    'flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all',
                    isActive
                      ? 'bg-white/10 text-white shadow-inner border border-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5',
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={onSearch} className="hidden md:flex items-center gap-2 ml-auto bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 w-[280px] focus-within:border-neon-pink/60">
            <SearchIcon className="w-4 h-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder-white/30"
              placeholder={language === 'zh' ? '搜索艺人 / 演出 / 场馆' : 'Search artist, event, venue'}
            />
            <span className="kbd">⌘K</span>
          </form>

          <LangSwitcher value={language} onChange={setLanguage} />
          <CurrencySwitcher value={currency} onChange={setCurrency} />

          <button className="lg:hidden ml-auto p-2 rounded-lg border border-white/10" onClick={() => setMenu((v) => !v)}>
            {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menu && (
          <div className="lg:hidden border-t border-white/10 px-4 py-3 grid gap-1">
            {navs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => classNames(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                  isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5',
                )}
              >
                <Icon className="w-4 h-4" />{label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="container py-6 lg:py-8">{children}</main>

      <footer className="border-t border-white/10 mt-16">
        <div className="container py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="font-display font-bold text-xl">StarPass · 星程票务</div>
            <div className="text-sm text-white/50 mt-1">全国性演出票务基础设施平台 · 内地 / 港澳台 / 日韩 / 东南亚</div>
          </div>
          <div className="text-xs text-white/40 space-y-1">
            <div>跨境支付 · Alipay+ · Visa · 当地钱包</div>
            <div>动态定价 · 假票溯源 · 无票赔付 · IP 图谱 · 跨城轨迹</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LangSwitcher({ value, onChange }: { value: Language; onChange: (l: Language) => void }) {
  const langs: Language[] = ['zh', 'en', 'ja', 'ko'];
  return (
    <div className="hidden md:inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={classNames(
            'px-3 py-1 rounded-full text-xs font-semibold transition-all',
            value === l ? 'bg-neon-pink/20 text-neon-pink shadow-inner' : 'text-white/60 hover:text-white',
          )}
        >
          <Globe2 className="w-3 h-3 inline mr-1 opacity-70" />{LANGUAGE_LABEL[l]}
        </button>
      ))}
    </div>
  );
}

function CurrencySwitcher({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  const [open, setOpen] = useState(false);
  const currs: Currency[] = ['CNY', 'HKD', 'TWD', 'JPY', 'KRW', 'USD', 'SGD', 'THB', 'MYR'];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/80 hover:bg-white/10"
      >
        <Banknote className="w-3.5 h-3.5 text-neon-amber" />
        {CURRENCY_META[value].sym} {value}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-ink-900/95 backdrop-blur-xl shadow-card p-1 z-50">
          {currs.map((c) => (
            <button
              key={c}
              onClick={() => { onChange(c); setOpen(false); }}
              className={classNames(
                'w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-sm transition-colors',
                value === c ? 'bg-neon-amber/15 text-neon-amber' : 'text-white/70 hover:bg-white/5',
              )}
            >
              <span>{CURRENCY_META[c].name} <span className="opacity-50 text-xs">{c}</span></span>
              <span className="font-semibold">{CURRENCY_META[c].sym}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppRoutes />
  );
}

function AppRoutes() {
  // #region debug-point H1H4:routes-init
  (() => {
    const _u = 'http://127.0.0.1:7777/event', _s = 'dashboard-blank-crash';
    const _dbg = (hypothesisId: string, msg: string, data: any = {}) => { try { fetch(_u, { method: 'POST', body: JSON.stringify({ sessionId: _s, runId: 'pre', hypothesisId, location: 'src/App.tsx:AppRoutes', msg: `[DEBUG] ${msg}`, data, ts: Date.now() }) }).catch(() => {}); } catch {} };
    _dbg('H1', 'app_routes_mounting', { pathname: typeof window !== 'undefined' ? window.location.pathname : 'ssr' });
  })();
  // #endregion
  return (
    <Routes>
      <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
      <Route path="/events" element={<AppLayout><EventList /></AppLayout>} />
      <Route path="/events/:id" element={<AppLayout><EventDetail /></AppLayout>} />
      <Route path="/tickets" element={<AppLayout><TicketCenter /></AppLayout>} />
      <Route path="/schedule" element={<AppLayout><ScheduleBoard /></AppLayout>} />
      <Route path="/admin" element={<AppLayout><AdminConsole /></AppLayout>} />
      <Route path="/profile" element={<AppLayout><ProfileCenter /></AppLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
