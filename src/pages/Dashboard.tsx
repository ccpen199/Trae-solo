import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, TrendingUp, ShieldAlert, Wallet, Ticket as TicketIcon, CircleCheck, ArrowRight,
  MapPin, CalendarDays, Flame, Globe2, Banknote, Star, Zap, Gauge,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Area, XAxis, YAxis, Tooltip, CartesianGrid, Cell, BarChart, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import { api } from '@/utils/api';
import type { DashboardKpi, EventSummary } from '@/shared/types';
import EventCard, { DeltaTag } from '@/components/EventCard';
import { useAppStore } from '@/store/app';
import {
  CURRENCY_META, classNames, fmtCny, fmtMoney, pickML, REGION_LABEL,
} from '@/utils/meta';
import type { Currency } from '@/shared/types';

const FX_RATES: Record<Currency, number> = { CNY: 1, HKD: 0.92, TWD: 0.22, JPY: 0.047, KRW: 0.0054, USD: 7.18, SGD: 5.3, THB: 0.2, MYR: 1.53 };
function fxRate(c: Currency) { return FX_RATES[c] || 1; }

const PAGE_I18N = {
  zh: {
    eyebrow: '覆盖内地 · 港澳台 · 日韩 · 东南亚',
    title: '跨境演出票务基础设施',
    sub: '动态定价 · 假票溯源 · 无票赔付 · IP 资产图谱 · 跨城轨迹',
    cta1: '浏览在售演出',
    cta2: '工单中心',
    stageTitle: '今日动态定价指数',
    gmvTitle: '跨境 GMV 分币种',
    trendingTitle: '热搜艺人榜',
    hotShow: '热门在售演出',
    kpi: [
      { icon: Sparkles, label: '在售演出' },
      { icon: TicketIcon, label: '在售票档' },
      { icon: Wallet, label: '跨境 GMV' },
      { icon: Star, label: '已售座位' },
      { icon: ShieldAlert, label: '累计赔付' },
      { icon: CircleCheck, label: '核验通过' },
    ],
  },
  en: {
    eyebrow: 'CN · HK/MO/TW · JP/KR · SEA',
    title: 'Global Ticketing Infrastructure',
    sub: 'Dynamic Pricing · Fake-ticket Tracing · Compensation · IP Graph · Cross-city',
    cta1: 'Explore Events',
    cta2: 'Ticket Center',
    stageTitle: 'Dynamic Pricing Index',
    gmvTitle: 'Cross-border GMV by Currency',
    trendingTitle: 'Trending Artists',
    hotShow: 'Top On-sale Events',
    kpi: [
      { icon: Sparkles, label: 'On-sale Events' },
      { icon: TicketIcon, label: 'Active Tiers' },
      { icon: Wallet, label: 'Cross GMV' },
      { icon: Star, label: 'Seats Sold' },
      { icon: ShieldAlert, label: 'Compensation' },
      { icon: CircleCheck, label: 'Verified' },
    ],
  },
  ja: {
    eyebrow: '中国本土・港澳台・日韓・東南アジア',
    title: 'グローバル公演チケット基盤',
    sub: '動的価格・偽チケ追跡・補償・IP資産グラフ・都市間移動',
    cta1: '公演を探す',
    cta2: 'チケットセンター',
    stageTitle: 'ダイナミックプライシング指数',
    gmvTitle: '通貨別越境GMV',
    trendingTitle: 'トレンドアーティスト',
    hotShow: '人気公演',
    kpi: [
      { icon: Sparkles, label: '販売中公演' },
      { icon: TicketIcon, label: 'アクティブ席種' },
      { icon: Wallet, label: '越境GMV' },
      { icon: Star, label: '販売座席' },
      { icon: ShieldAlert, label: '補償累計' },
      { icon: CircleCheck, label: '検証通過' },
    ],
  },
  ko: {
    eyebrow: '본토 · 홍콩/대만 · 일본/한국 · 동남아',
    title: '글로벌 공연 티켓 인프라',
    sub: '동적가격 · 위조티켓 추적 · 보상 · IP 자산그래프 · 도시간 이동',
    cta1: '공연 둘러보기',
    cta2: '티켓 센터',
    stageTitle: '동적가격 지표',
    gmvTitle: '통화별 크로스 GMV',
    trendingTitle: '인기 아티스트',
    hotShow: '인기 공연',
    kpi: [
      { icon: Sparkles, label: '판매중 공연' },
      { icon: TicketIcon, label: '활성 좌석' },
      { icon: Wallet, label: '크로스 GMV' },
      { icon: Star, label: '판매좌석' },
      { icon: ShieldAlert, label: '누적보상' },
      { icon: CircleCheck, label: '검증통과' },
    ],
  },
} as const;

export default function Dashboard() {
  // #region debug-point H1H3H4:dash-entry
  (() => {
    const _u = 'http://127.0.0.1:7777/event', _s = 'dashboard-blank-crash';
    const _dbg = (hypothesisId: string, msg: string, data: any = {}) => { try { fetch(_u, { method: 'POST', body: JSON.stringify({ sessionId: _s, runId: 'pre', hypothesisId, location: 'src/pages/Dashboard.tsx:101', msg: `[DEBUG] ${msg}`, data, ts: Date.now() }) }).catch(() => {}); } catch {} };
    _dbg('H3', 'dash_component_entry', {});
    try {
      const s = (window as any).__STORE_SNAPSHOT__;
      _dbg('H3', 'store_state_checked', { hasStore: !!s, dashboard: s?.dashboard ? 'exists' : 'null', dashboardKeys: s?.dashboard ? Object.keys(s.dashboard) : [] });
    } catch (e) { _dbg('H3', 'store_access_error', { err: String(e) }); }
  })();
  // #endregion
  const { language, currency } = useAppStore();
  const t = PAGE_I18N[language] || PAGE_I18N.zh;
  const nav = useNavigate();
  const [data, setData] = useState<DashboardKpi | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // #region debug-point H2:dash-api-fetch
    (() => {
      const _u = 'http://127.0.0.1:7777/event', _s = 'dashboard-blank-crash';
      const _dbg = (hypothesisId: string, msg: string, data: any = {}) => { try { fetch(_u, { method: 'POST', body: JSON.stringify({ sessionId: _s, runId: 'pre', hypothesisId, location: 'src/pages/Dashboard.tsx:108', msg: `[DEBUG] ${msg}`, data, ts: Date.now() }) }).catch(() => {}); } catch {} };
      _dbg('H2', 'dash_useEffect_start', { url: '/api/dashboard' });
    })();
    // #endregion
    api.get<DashboardKpi>('/api/dashboard')
      .then((d) => {
        // #region debug-point H2:dash-api-ok
        (() => {
          const _u = 'http://127.0.0.1:7777/event', _s = 'dashboard-blank-crash';
          const _dbg = (hypothesisId: string, msg: string, data: any = {}) => { try { fetch(_u, { method: 'POST', body: JSON.stringify({ sessionId: _s, runId: 'pre', hypothesisId, location: 'src/pages/Dashboard.tsx:110', msg: `[DEBUG] ${msg}`, data, ts: Date.now() }) }).catch(() => {}); } catch {} };
          _dbg('H2', 'dash_api_success', { dataKeys: d ? Object.keys(d) : null, null: d === null, undefined: d === undefined, onSaleEvents: d?.onSaleEvents, pricingHeatLen: d?.pricingHeat?.length, currencyBreakdownLen: d?.currencyBreakdown?.length, trendingArtistsLen: d?.trendingArtists?.length, topEventsLen: d?.topEvents?.length });
        })();
        // #endregion
        setData(d);
      })
      .catch((e) => {
        // #region debug-point H2:dash-api-err
        (() => {
          const _u = 'http://127.0.0.1:7777/event', _s = 'dashboard-blank-crash';
          const _dbg = (hypothesisId: string, msg: string, data: any = {}) => { try { fetch(_u, { method: 'POST', body: JSON.stringify({ sessionId: _s, runId: 'pre', hypothesisId, location: 'src/pages/Dashboard.tsx:110', msg: `[DEBUG] ${msg}`, data, ts: Date.now() }) }).catch(() => {}); } catch {} };
          _dbg('H2', 'dash_api_error', { message: e.message, stack: e.stack });
        })();
        // #endregion
        setErr(e.message);
      });
  }, []);

  const kpis = data ? [
    { icon: Sparkles, label: t.kpi[0].label, value: String(data.onSaleEvents), unit: '', color: 'text-neon-pink' },
    { icon: TicketIcon, label: t.kpi[1].label, value: String(data.activeTiers), unit: '', color: 'text-neon-violet' },
    { icon: Wallet, label: t.kpi[2].label, value: fmtCny(data.crossGMV), unit: '', color: 'text-neon-amber' },
    { icon: Star, label: t.kpi[3].label, value: data.seatsSold.toLocaleString(), unit: '', color: 'text-neon-teal' },
    { icon: ShieldAlert, label: t.kpi[4].label, value: fmtCny(data.compensation), unit: '', color: 'text-rose-300' },
    { icon: CircleCheck, label: t.kpi[5].label, value: data.verifiedEntries.toLocaleString(), unit: '', color: 'text-emerald-300' },
  ] : [];

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="relative card p-6 lg:p-10 overflow-hidden star-noise">
        {/* 装饰光束 */}
        <div className="absolute inset-0 pointer-events-none bg-stage-grad" />
        <div className="absolute inset-x-0 top-0 flex justify-around pointer-events-none opacity-50 h-48">
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className="w-16 h-full origin-top animate-beam"
              style={{
                background: `linear-gradient(180deg, ${['#FF2E88', '#F5B544', '#8B5CF6', '#2DD4BF', '#60A5FA', '#FF2E88', '#F5B544'][i]}55, transparent)`,
                transform: `rotate(${(i - 3) * 4}deg)`,
                animationDelay: `${i * 0.22}s`,
              }}
            />
          ))}
        </div>

        <div className="relative grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          <div>
            <span className="cap border-neon-pink/40 text-neon-pink">
              <Globe2 className="w-3.5 h-3.5" /> {t.eyebrow}
            </span>
            <h1 className="hero-title font-black text-4xl md:text-6xl mt-4">
              StarPass 星程<br />
              <span className="text-white/85">{t.title}</span>
            </h1>
            <p className="mt-5 text-white/60 text-lg max-w-2xl leading-relaxed">
              {t.sub}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/events" className="btn-primary">
                <Sparkles className="w-4 h-4" /> {t.cta1} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/tickets" className="btn-ghost">
                <ShieldAlert className="w-4 h-4" /> {t.cta2}
              </Link>
              <Link to="/admin" className="btn-ghost">
                <Gauge className="w-4 h-4" /> 运营后台
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                { icon: Zap, label: language === 'zh' ? '动态定价引擎' : 'Dynamic Pricing' },
                { icon: ShieldAlert, label: language === 'zh' ? '假票双向验签' : 'Two-way Sign' },
                { icon: Banknote, label: language === 'zh' ? '无票自动赔付' : 'Auto Compensation' },
                { icon: Flame, label: language === 'zh' ? '艺人/场馆热度' : 'Heat Index' },
                { icon: MapPin, label: language === 'zh' ? '跨城观演轨迹' : 'City Flow' },
              ].map(({ icon: I, label }) => (
                <span key={label} className="chip border-white/15 bg-white/[0.04] text-white/80 px-3 py-1">
                  <I className="w-3.5 h-3.5 text-neon-pink" /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Hero 右侧：状态/指标小卡 */}
          <div className="relative space-y-3">
            {data ? (
              <div className="grid grid-cols-2 gap-3">
                {kpis.slice(0, 4).map(({ icon: I, label, value, color }, i) => (
                  <div key={i} className="card p-4 glow-border relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-widest text-white/40">{label}</span>
                      <I className={classNames('w-4 h-4', color)} />
                    </div>
                    <div className={classNames('num font-black text-2xl md:text-3xl mt-2', color)}>{value}</div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-30" style={{ background: `radial-gradient(circle, currentColor, transparent 60%)`, color: ['#FF2E88', '#8B5CF6', '#F5B544', '#2DD4BF'][i] }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card p-4 h-28 animate-pulse bg-white/5" />
                ))}
              </div>
            )}
            {err && <div className="text-warn text-sm">加载失败：{err}</div>}
          </div>
        </div>
      </section>

      {/* KPI 全量 */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpis.map(({ icon: I, label, value, color }, i) => (
            <div key={i} className="card p-4 relative overflow-hidden glow-border">
              <div className="flex items-center justify-between">
                <I className={classNames('w-5 h-5', color)} />
                <span className="text-[10px] text-white/30 tracking-widest uppercase">{i + 1}</span>
              </div>
              <div className="mt-4 text-[11px] text-white/45 uppercase tracking-widest">{label}</div>
              <div className={classNames('num font-black text-2xl mt-1', color)}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 动态定价 + 跨境 GMV + 热搜艺人 */}
      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
        <div className="card p-5">
          <div className="section-head">
            <div>
              <p className="section-eyebrow"><Zap className="inline w-3.5 h-3.5 mr-1" />Dynamic Pricing Engine</p>
              <h2 className="font-display font-bold text-2xl">{t.stageTitle}</h2>
              <p className="text-sm text-white/50 mt-1">{language === 'zh' ? '余票 × 热搜 × 艺人热度 → 票价实时波动' : 'Remaining × Search-heat × Artist-heat → Real-time Price'}</p>
            </div>
            <span className="cap border-neon-amber/40 text-neon-amber">
              <Flame className="w-3.5 h-3.5" /> {language === 'zh' ? '最近 72 小时' : 'Last 72h'}
            </span>
          </div>
          {data ? <PricingHeatChart heat={data.pricingHeat} language={language} /> : <div className="h-64 animate-pulse rounded-xl bg-white/5" />}
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="section-head">
              <div>
                <p className="section-eyebrow"><Banknote className="inline w-3.5 h-3.5 mr-1" />Cross-border GMV</p>
                <h2 className="font-display font-bold text-2xl">{t.gmvTitle}</h2>
              </div>
            </div>
            {data ? <GMVChart bd={data.currencyBreakdown} currency={currency} language={language} /> : <div className="h-48 animate-pulse rounded-xl bg-white/5" />}
          </div>
          <div className="card p-5">
            <div className="section-head">
              <div>
                <p className="section-eyebrow"><TrendingUp className="inline w-3.5 h-3.5 mr-1" />Trending Artists</p>
                <h2 className="font-display font-bold text-2xl">{t.trendingTitle}</h2>
              </div>
            </div>
            {data ? <ArtistRanking artists={data.trendingArtists} language={language} /> : <div className="h-40 animate-pulse rounded-xl bg-white/5" />}
          </div>
        </div>
      </section>

      {/* 活跃演出 */}
      <section>
        <div className="section-head">
          <div>
            <p className="section-eyebrow"><CalendarDays className="inline w-3.5 h-3.5 mr-1" />Top On-sale Events</p>
            <h2 className="font-display font-bold text-2xl">{t.hotShow}</h2>
            <p className="text-sm text-white/50 mt-1">{language === 'zh' ? '基于实时余票热度与热搜指数排序' : 'Ranked by real-time remaining and search heat'}</p>
          </div>
          <button onClick={() => nav('/events')} className="btn-ghost text-sm">
            {language === 'zh' ? '查看全部' : 'See All'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {data ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {data.topEvents.map((ev) => <EventCard key={ev.id} ev={ev as EventSummary} />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-[340px] animate-pulse bg-white/5" />)}
          </div>
        )}
      </section>
    </div>
  );
}

function PricingHeatChart({ heat, language }: { heat: DashboardKpi['pricingHeat']; language: 'zh' | 'en' | 'ja' | 'ko' }) {
  const data = heat.map((h) => ({
    name: pickML(h.title, language).slice(0, 8),
    delta: Number(h.deltaPct.toFixed(1)),
    heat: h.heatIndex,
    remain: h.remainingPct,
  }));
  // #region debug-point H2H5:chart-data
  (() => {
    const _u = 'http://127.0.0.1:7777/event', _s = 'dashboard-blank-crash';
    const _dbg = (hypothesisId: string, msg: string, data: any = {}) => { try { fetch(_u, { method: 'POST', body: JSON.stringify({ sessionId: _s, runId: 'pre', hypothesisId, location: 'src/pages/Dashboard.tsx:PricingHeatChart', msg: `[DEBUG] ${msg}`, data, ts: Date.now() }) }).catch(() => {}); } catch {} };
    _dbg('H5', 'pricing_chart_data', { len: data.length, firstItem: data[0] || null, isArray: Array.isArray(data) });
  })();
  // #endregion
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ left: 8, right: 16, top: 10, bottom: 8 }}>
        <defs>
          <linearGradient id="gdHeat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5B544" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#FF2E88" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" stroke="#ffffff55" tick={{ fill: '#ffffff99', fontSize: 11 }} />
        <YAxis yAxisId="l" stroke="#ffffff55" tick={{ fill: '#ffffff99', fontSize: 11 }} label={{ value: language === 'zh' ? '涨跌幅%' : 'Δ%', angle: -90, position: 'insideLeft', fill: '#ffffff99', fontSize: 11 }} />
        <YAxis yAxisId="r" orientation="right" stroke="#ffffff55" tick={{ fill: '#ffffff99', fontSize: 11 }} label={{ value: language === 'zh' ? '热度/余票%' : 'Heat/Remain', angle: 90, position: 'insideRight', fill: '#ffffff99', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 12, color: '#fff' }}
          cursor={{ stroke: '#ffffff30' }}
        />
        <Area yAxisId="r" type="monotone" dataKey="heat" stroke="#F5B544" fill="url(#gdHeat)" strokeWidth={2} />
        <Bar yAxisId="l" dataKey="delta" barSize={22} radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.delta >= 0 ? 'url(#barGrad1)' : '#2DD4BF'} />
          ))}
          <defs>
            <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF2E88" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </Bar>
        <Area yAxisId="r" type="monotone" dataKey="remain" stroke="#2DD4BF" fill="#2DD4BF22" strokeWidth={1.5} strokeDasharray="3 3" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function GMVChart({ bd, currency, language }: { bd: DashboardKpi['currencyBreakdown']; currency: Currency; language: 'zh' | 'en' | 'ja' | 'ko' }) {
  // #region debug-point H2H5:gmv-chart
  (() => {
    const _u = 'http://127.0.0.1:7777/event', _s = 'dashboard-blank-crash';
    const _dbg = (hypothesisId: string, msg: string, data: any = {}) => { try { fetch(_u, { method: 'POST', body: JSON.stringify({ sessionId: _s, runId: 'pre', hypothesisId, location: 'src/pages/Dashboard.tsx:GMVChart', msg: `[DEBUG] ${msg}`, data, ts: Date.now() }) }).catch(() => {}); } catch {} };
    _dbg('H5', 'gmv_chart_data', { len: bd.length, isArray: Array.isArray(bd), firstItem: bd[0] || null });
  })();
  // #endregion
  const palette = ['#FF2E88', '#F5B544', '#8B5CF6', '#2DD4BF', '#60A5FA', '#F472B6', '#22D3EE'];
  const rows = bd.map((b, i) => ({
    ...b,
    color: palette[i % palette.length],
    display: fmtMoney(b.amount, b.c),
    cname: CURRENCY_META[b.c].name,
  }));
  const total = bd.reduce((s, b) => s + b.amount / FX_RATES[b.c], 0);
  return (
    <div className="grid md:grid-cols-2 gap-4 items-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={bd.map((b, i) => ({ name: b.c, value: b.amount / FX_RATES[b.c], fill: palette[i % palette.length] }))}
            innerRadius={48} outerRadius={76} paddingAngle={2} dataKey="value" stroke="none"
          >
          </Pie>
          <Tooltip contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 12, color: '#fff' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-white/40">{CURRENCY_META[currency].name} {language === 'zh' ? '基准合计' : 'Total base'}</span>
          <span className="num font-bold text-neon-amber">{fmtCny(Math.round(total))}</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-white/80">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                {r.cname} <span className="text-white/40">{r.c}</span>
              </span>
              <span className="num font-semibold text-white">{r.display}</span>
            </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (r.amount / fxRate(r.c as Currency) / total) * 100)}%`,
                    background: r.color,
                  }}
                />
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtistRanking({ artists, language }: { artists: DashboardKpi['trendingArtists']; language: 'zh' | 'en' | 'ja' | 'ko' }) {
  // #region debug-point H2H5:artist-ranking
  (() => {
    const _u = 'http://127.0.0.1:7777/event', _s = 'dashboard-blank-crash';
    const _dbg = (hypothesisId: string, msg: string, data: any = {}) => { try { fetch(_u, { method: 'POST', body: JSON.stringify({ sessionId: _s, runId: 'pre', hypothesisId, location: 'src/pages/Dashboard.tsx:ArtistRanking', msg: `[DEBUG] ${msg}`, data, ts: Date.now() }) }).catch(() => {}); } catch {} };
    _dbg('H5', 'artist_ranking_data', { len: artists.length, isArray: Array.isArray(artists), firstItem: artists[0] || null });
  })();
  // #endregion
  return (
    <ul className="space-y-2">
      {artists.map((a, i) => {
        const color = ['#FF2E88', '#F5B544', '#8B5CF6', '#2DD4BF', '#60A5FA', '#F472B6'][i % 6];
        return (
          <li key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
            <div className="num font-black text-lg w-7" style={{ color: i < 3 ? color : '#ffffff66' }}>#{i + 1}</div>
            <div className="w-10 h-10 rounded-xl grid place-items-center font-bold text-white shadow-md shrink-0" style={{ background: `linear-gradient(135deg, ${color}, #0B1A3A)` }}>
              {pickML(a.name, language).slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{pickML(a.name, language)}</div>
              <div className="flex items-center gap-3 text-[11px] text-white/50 mt-0.5">
                <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-neon-amber" /> {a.heatIndex}</span>
                <DeltaTag pct={a.delta * 2} />
              </div>
            </div>
            <div className="flex-1 max-w-[140px]">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${a.heatIndex}%`, background: `linear-gradient(90deg, ${color}, #F5B544)` }} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
