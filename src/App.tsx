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

  const NAV_LABELS: Record<string, { zh: string; en: string; ja: string; ko: string }> = {
    '/': { zh: '首页仪表板', en: 'Dashboard', ja: 'ダッシュボード', ko: '대시보드' },
    '/events': { zh: '演出票务', en: 'Ticketing', ja: '公演チケット', ko: '공연 티켓' },
    '/tickets': { zh: '工单中心', en: 'Ops Center', ja: '業務センター', ko: '운영 센터' },
    '/schedule': { zh: '排期验票', en: 'Schedule', ja: 'スケジュール', ko: '스케줄' },
    '/admin': { zh: '管理后台', en: 'Admin', ja: '管理画面', ko: '관리자' },
    '/profile': { zh: '个人中心', en: 'Profile', ja: 'プロフィール', ko: '프로필' },
  };
  const pick = (path: string) => {
    const m = NAV_LABELS[path] || NAV_LABELS['/'];
    return m[language] || m.zh;
  };

  const navs = [
    { to: '/', label: pick('/'), icon: LayoutDashboard },
    { to: '/events', label: pick('/events'), icon: Sparkles },
    { to: '/tickets', label: pick('/tickets'), icon: ClipboardList },
    { to: '/schedule', label: pick('/schedule'), icon: CalendarClock },
    { to: '/admin', label: pick('/admin'), icon: LineChartIcon },
    { to: '/profile', label: pick('/profile'), icon: UserCircle },
  ];

  const nav = useNavigate();
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) nav(`/events?keyword=${encodeURIComponent(search.trim())}`);
  };

  const SEARCH_PLACEHOLDER: Record<Language, string> = {
    zh: '搜索艺人 / 演出 / 场馆',
    en: 'Search artist, event, venue',
    ja: 'アーティスト / 公演 / 会場を検索',
    ko: '아티스트 / 공연 / 장소 검색',
  };
  const FOOTER: Record<Language, { title: string; sub: string; l1: string; l2: string }> = {
    zh: { title: 'StarPass · 星程票务', sub: '全国性演出票务基础设施平台 · 内地 / 港澳台 / 日韩 / 东南亚', l1: '跨境支付 · Alipay+ · Visa · 当地钱包', l2: '动态定价 · 假票溯源 · 无票赔付 · IP 图谱 · 跨城轨迹' },
    en: { title: 'StarPass', sub: 'Global Live Ticketing Infrastructure · CN / HK/MO/TW / JP/KR / SEA', l1: 'Cross-border pay · Alipay+ · Visa · Local wallets', l2: 'Dynamic pricing · Fake-ticket trace · Compensation · IP graph · Cross-city' },
    ja: { title: 'StarPass 公演チケット', sub: 'グローバル公演チケット基盤 · 中国本土・港澳台・日韓・東南アジア', l1: '越境決済 · Alipay+ · Visa · 現地ウォレット', l2: '動的価格・偽チケ追跡・不発券補償・IP資産・都市間移動' },
    ko: { title: 'StarPass 티켓', sub: '글로벌 공연 티켓 인프라 · 본토 · 홍콩/대만 · 일본/한국 · 동남아', l1: '크로스보더 결제 · Alipay+ · Visa · 로컬 월렛', l2: '동적가격 · 위조티켓 추적 · 미발권 보상 · IP 그래프 · 도시간 이동' },
  };
  const footer = FOOTER[language];

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
              placeholder={SEARCH_PLACEHOLDER[language]}
            />
            <span className="kbd">⌘K</span>
          </form>

          <LangSwitcher value={language} onChange={setLanguage} />
          <CurrencySwitcher value={currency} onChange={setCurrency} language={language} />

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
            <div className="font-display font-bold text-xl">{footer.title}</div>
            <div className="text-sm text-white/50 mt-1">{footer.sub}</div>
          </div>
          <div className="text-xs text-white/40 space-y-1">
            <div>{footer.l1}</div>
            <div>{footer.l2}</div>
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

function CurrencySwitcher({ value, onChange, language }: { value: Currency; onChange: (c: Currency) => void; language: Language }) {
  const [open, setOpen] = useState(false);
  const currs: Currency[] = ['CNY', 'HKD', 'TWD', 'JPY', 'KRW', 'USD', 'SGD', 'THB', 'MYR'];
  const name = (c: Currency) => {
    const m = CURRENCY_META[c];
    if (language === 'ja') return m.nameJa;
    if (language === 'ko') return m.nameKo;
    return m.name;
  };
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
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-ink-900/95 backdrop-blur-xl shadow-card p-1 z-50">
          {currs.map((c) => (
            <button
              key={c}
              onClick={() => { onChange(c); setOpen(false); }}
              className={classNames(
                'w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-sm transition-colors',
                value === c ? 'bg-neon-amber/15 text-neon-amber' : 'text-white/70 hover:bg-white/5',
              )}
            >
              <span>{name(c)} <span className="opacity-50 text-xs">{c}</span></span>
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
