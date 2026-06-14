import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Network, MapPin, Users, Rocket, TrendingUp, Crown, Star,
  Search as SearchIcon, RefreshCw, Radio, Flame, Ticket as TicketIcon, CircleDollarSign,
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell,
  PieChart, Pie, AreaChart, Area,
} from 'recharts';
import type { IpGraph, CityFlow, OrganizerReview } from '@/shared/types';
import { api } from '@/utils/api';
import { useAppStore } from '@/store/app';
import { classNames, fmtCny, fmtDate, hashColor, pickML } from '@/utils/meta';

const VIEWS = [
  { id: 'pricing', zh: '动态定价面板', en: 'Dynamic Pricing', icon: Rocket },
  { id: 'ip', zh: 'IP 关系图谱', en: 'IP Graph', icon: Network },
  { id: 'flows', zh: '跨城观演轨迹', en: 'Cross-City Flows', icon: MapPin },
  { id: 'review', zh: '主办方复盘报表', en: 'Organizer Review', icon: BarChart3 },
] as const;

type ViewId = typeof VIEWS[number]['id'];

export default function AdminConsole() {
  const { language } = useAppStore();
  const [view, setView] = useState<ViewId>('pricing');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [pricing, setPricing] = useState<any[]>([]);
  const [ipGraph, setIpGraph] = useState<IpGraph | null>(null);
  const [flows, setFlows] = useState<CityFlow[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: any }[]>([]);
  const [selOrg, setSelOrg] = useState('org-sahara');
  const [review, setReview] = useState<OrganizerReview | null>(null);
  const [evKw, setEvKw] = useState('');

  useEffect(() => { loadView('pricing'); loadView('ip'); loadView('flows'); loadOrganizers(); }, []);
  useEffect(() => { if (selOrg) loadView('review'); }, [selOrg]);

  const loadOrganizers = async () => {
    const { data } = await fetch('/api/admin/review/-/list').then((r) => r.json()).catch(() => ({ data: [] }));
    // fallback: 手动列几个
    const list = Array.isArray(data) && data.length ? data : [
      { id: 'org-sahara', name: { zh: '撒哈拉音乐', en: 'Sahara Music', ja: 'サハラ・ミュージック', ko: '사하라 뮤직' } },
      { id: 'org-arclight', name: { zh: '弧光演艺', en: 'Arclight Live', ja: 'アークライト', ko: '아크라이트' } },
      { id: 'org-jadewave', name: { zh: '碧浪文旅', en: 'JadeWave', ja: 'ジェイドウェーブ', ko: '제이드웨이브' } },
    ];
    setOrgs(list);
    if (!list.find((x) => x.id === selOrg)) setSelOrg(list[0].id);
  };

  const loadView = async (v: ViewId) => {
    setLoading((l) => ({ ...l, [v]: true }));
    try {
      if (v === 'pricing') {
        const params = new URLSearchParams();
        if (evKw) params.set('keyword', evKw);
        const list = await api.get<any[]>(`/api/events${params.toString() ? '?' + params : ''}`).then((arr) => arr.slice(0, 15));
        const withSeries = await Promise.all(list.map(async (ev) => {
          const ticks = await api.get<any[]>(`/api/events/${ev.id}/pricing`).then((x) => x[0]?.ticks || []);
          return { ...ev, series: ticks };
        }));
        setPricing(withSeries);
      } else if (v === 'ip') {
        setIpGraph(await api.get('/admin/ip-graph'));
      } else if (v === 'flows') {
        setFlows(await api.get('/admin/city-flows'));
      } else if (v === 'review' && selOrg) {
        setReview(await api.get(`/admin/review/${selOrg}`));
      }
    } finally {
      setLoading((l) => ({ ...l, [v]: false }));
    }
  };

  return (
    <div className="space-y-5">
      <section className="card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow"><Users className="inline w-3.5 h-3.5 mr-1" />Admin Console</p>
            <h1 className="font-display font-black text-3xl md:text-4xl">
              {language === 'zh' ? '管理后台 · 决策中心' : 'Admin · Decision Center'}
            </h1>
            <p className="text-white/55 text-sm mt-1">
              {language === 'zh' ? '动态定价 · IP 关系图谱 · 跨城流向 · 主办方复盘多维报表' : 'Dynamic pricing · IP graph · Cross-city flow · Organizer analytics'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {VIEWS.map((vw) => {
              const I = vw.icon;
              return (
                <button
                  key={vw.id}
                  onClick={() => setView(vw.id)}
                  className={classNames(
                    'px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 border transition-all',
                    view === vw.id
                      ? 'bg-neon-pink/20 border-neon-pink/40 text-neon-pink shadow-glow'
                      : 'bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/10',
                  )}
                >
                  <I className="w-4 h-4" /> {language === 'zh' ? vw.zh : vw.en}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {view === 'pricing' && <PricingView list={pricing} loading={!!loading.pricing} onReload={() => loadView('pricing')} language={language} evKw={evKw} setEvKw={setEvKw} />}
      {view === 'ip' && <IpView graph={ipGraph} loading={!!loading.ip} language={language} />}
      {view === 'flows' && <FlowView flows={flows} loading={!!loading.flows} language={language} />}
      {view === 'review' && (
        <ReviewView review={review} loading={!!loading.review} language={language}
          orgs={orgs} selOrg={selOrg} setSelOrg={setSelOrg} />
      )}
    </div>
  );
}

function PricingView({ list, loading, onReload, language, evKw, setEvKw }: any) {
  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-eyebrow"><Rocket className="inline w-3.5 h-3.5 mr-1" />Pricing Engine</p>
            <h2 className="font-display font-bold text-xl">
              {language === 'zh' ? '动态定价面板 · 热度 × 余票 × 扰动' : 'Dynamic Pricing · Heat × Stock × Noise'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input value={evKw} onChange={(e) => setEvKw(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && onReload()}
                className="input pl-10 py-2 text-sm w-64" placeholder={language === 'zh' ? '搜索演出' : 'Search events...'} />
            </div>
            <button onClick={onReload} className="btn-ghost !py-2 !px-3 !text-sm"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { label: language === 'zh' ? '平均加价幅度' : 'Avg markup', v: list.length ? `+${(list.reduce((a: number, b: any) => a + b.hotIndex, 0) / list.length / 20).toFixed(1)}%` : '—', c: 'text-neon-amber' },
            { label: language === 'zh' ? '高热度演出' : 'Hot events', v: list.filter((e: any) => e.hotIndex >= 80).length, c: 'text-neon-pink' },
            { label: language === 'zh' ? '售罄/接近售罄' : 'Sell-out risk', v: list.filter((e: any) => e.hotIndex >= 90).length, c: 'text-neon-violet' },
            { label: language === 'zh' ? '建议降价促销' : 'Suggest promo', v: list.filter((e: any) => e.hotIndex <= 40).length, c: 'text-neon-teal' },
          ].map((k, i) => (
            <div key={i} className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
              <div className={classNames('text-xs font-semibold', k.c)}>{k.label}</div>
              <div className="num font-black text-2xl mt-1">{k.v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-5">
        {loading ? (
          <div className="lg:col-span-2 card h-96 animate-pulse" />
        ) : list.length === 0 ? (
          <div className="lg:col-span-2 card p-10 text-center text-white/50">—</div>
        ) : (
          list.map((ev: any) => <PricingCard key={ev.id} ev={ev} language={language} />)
        )}
      </section>
    </div>
  );
}

function PricingCard({ ev, language }: { ev: any; language: 'zh' | 'en' | 'ja' | 'ko' }) {
  const data = (ev.series || []).map((t: any) => ({
    t: t.ts.slice(5, 13), p: t.price, r: t.remaining, h: t.heat,
  }));
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{ev.poster}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{pickML(ev.title, language)}</div>
          <div className="text-[11px] text-white/50 mt-0.5 flex items-center gap-3">
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-neon-pink" /> {ev.hotIndex}</span>
            <span className="flex items-center gap-1"><TicketIcon className="w-3 h-3 text-neon-amber" /> ¥{ev.priceMin}~{ev.priceMax}</span>
            <span>{ev.startTime.slice(0, 10)}</span>
          </div>
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={`pg-${ev.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5B544" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#FF2E88" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="t" stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 9 }} />
            <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 9 }} width={32} />
            <Tooltip contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 10, color: '#fff', fontSize: 11 }} />
            <Area type="monotone" dataKey="p" stroke="#F5B544" strokeWidth={1.8} fill={`url(#pg-${ev.id})`} />
            <Line type="monotone" dataKey="h" stroke="#FF2E88" strokeWidth={1.2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function IpView({ graph, loading, language }: { graph: IpGraph | null; loading: boolean; language: 'zh' | 'en' | 'ja' | 'ko' }) {
  const [mode, setMode] = useState<'artist' | 'organizer' | 'venue'>('artist');
  if (loading) return <div className="card h-[600px] animate-pulse" />;
  if (!graph) return null;
  const nodes = graph[mode === 'artist' ? 'artists' : mode === 'venue' ? 'venues' : 'organizers'];
  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="section-head">
          <div>
            <p className="section-eyebrow"><Network className="inline w-3.5 h-3.5 mr-1" />Asset Graph</p>
            <h2 className="font-display font-bold text-xl">
              {language === 'zh' ? '演出 IP 关系图谱' : 'IP Relationship Graph'}
            </h2>
          </div>
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            {(['artist', 'organizer', 'venue'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={classNames(
                'px-3 py-1 text-xs rounded-full font-semibold',
                mode === m ? 'bg-neon-teal/20 text-neon-teal' : 'text-white/60 hover:text-white',
              )}>
                {({ artist: language === 'zh' ? '艺人中心' : 'Artists', organizer: language === 'zh' ? '主办方中心' : 'Organizers', venue: language === 'zh' ? '场馆中心' : 'Venues' } as any)[m]}
              </button>
            ))}
          </div>
        </div>

        {/* 节点关系 SVG */}
        <div className="mt-4 relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/50 to-purple-950/30 p-4">
          <SvgGraph graph={graph} mode={mode} language={language} />
        </div>

        {/* 节点列表 */}
        <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {nodes.map((n) => {
            const c = hashColor((n.name as any)?.zh || n.id);
            return (
              <div key={n.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl grid place-items-center font-black text-lg text-white shadow-md shrink-0"
                    style={{ background: `linear-gradient(135deg, ${c}, #0B1A3A)` }}>
                    {pickML(n.name, language).slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate flex items-center gap-1.5">
                      {mode === 'artist' ? <Star className="w-3.5 h-3.5 text-neon-amber" /> : mode === 'organizer' ? <Crown className="w-3.5 h-3.5 text-neon-pink" /> : <MapPin className="w-3.5 h-3.5 text-neon-teal" />}
                      {pickML(n.name, language)}
                    </div>
                    <div className="text-[11px] text-white/45 mt-0.5">
                      {mode === 'artist' ? (language === 'zh' ? `合作主办 ${n.linkedOrganizers?.length || 0} · 驻场 ${n.linkedVenues?.length || 0}` : `With ${n.linkedOrganizers?.length || 0} orgs · ${n.linkedVenues?.length || 0} venues`)
                        : mode === 'organizer' ? (language === 'zh' ? `签约艺人 ${n.linkedArtists?.length || 0} · 场馆 ${n.linkedVenues?.length || 0}` : `${n.linkedArtists?.length || 0} artists · ${n.linkedVenues?.length || 0} venues`)
                          : (language === 'zh' ? `常驻艺人 ${n.linkedArtists?.length || 0} · 合作 ${n.linkedOrganizers?.length || 0}` : `${n.linkedArtists?.length || 0} artists · ${n.linkedOrganizers?.length || 0} orgs`)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {n.avgHotIndex !== undefined && (
                    <span className="chip bg-neon-pink/10 text-neon-pink border border-neon-pink/30 text-[10px]">
                      <Flame className="w-2.5 h-2.5 mr-0.5" /> AVG {n.avgHotIndex}
                    </span>
                  )}
                  {mode !== 'venue' && (
                    <span className="chip bg-neon-amber/10 text-neon-amber border border-neon-amber/30 text-[10px]">
                      <CircleDollarSign className="w-2.5 h-2.5 mr-0.5" />
                      GMV ¥{(n.totalGmv || 0).toLocaleString()}
                    </span>
                  )}
                  {mode === 'venue' && (
                    <span className="chip bg-neon-teal/10 text-neon-teal border border-neon-teal/30 text-[10px]">
                      <Users className="w-2.5 h-2.5 mr-0.5" />
                      {n.totalAttendance?.toLocaleString() || 0}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <div className="section-head">
          <div>
            <p className="section-eyebrow"><TrendingUp className="inline w-3.5 h-3.5 mr-1" />Collaborations</p>
            <h2 className="font-display font-bold text-xl">
              {language === 'zh' ? '合作关系矩阵 Top 关系' : 'Top Collaboration Edges'}
            </h2>
          </div>
        </div>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={graph.edges.slice(0, 10)} layout="vertical" margin={{ left: 110, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid stroke="#ffffff10" horizontal={false} />
              <XAxis type="number" stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 10 }} />
              <YAxis type="category" dataKey="edgeId" stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 10 }} width={100} />
              <Tooltip contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 10, color: '#fff', fontSize: 11 }} />
              <Bar dataKey="strength" radius={[0, 6, 6, 0]}>
                {graph.edges.slice(0, 10).map((_, i) => <Cell key={i} fill={hashColor(graph.edges[i].edgeId + i)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function SvgGraph({ graph, mode, language }: { graph: IpGraph; mode: 'artist' | 'organizer' | 'venue'; language: 'zh' | 'en' | 'ja' | 'ko' }) {
  const W = 800, H = 440;
  const centerX = W / 2, centerY = H / 2;
  const hubs: any[] = mode === 'artist' ? graph.artists : mode === 'venue' ? graph.venues : graph.organizers;
  const hubNodes = hubs.slice(0, 6).map((h, i, arr) => {
    const ang = (i / Math.max(arr.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return {
      id: h.id, name: pickML(h.name, language), x: centerX + Math.cos(ang) * 120, y: centerY + Math.sin(ang) * 110,
      color: hashColor((h.name as any).zh || h.id), hot: h.avgHotIndex || 70,
    };
  });
  const satelliteCount = 12;
  const sats = Array.from({ length: satelliteCount }).map((_, i) => {
    const hub = hubNodes[i % hubNodes.length];
    const ang = (i / satelliteCount) * Math.PI * 2;
    const R = 180 + (i % 3) * 20;
    return {
      x: centerX + Math.cos(ang) * R,
      y: centerY + Math.sin(ang) * R,
      r: 3 + (i % 4),
      c: hub.color,
      hubIdx: i % hubNodes.length,
    };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[420px]">
      <defs>
        <radialGradient id="bgG" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#8B5CF630" />
          <stop offset="100%" stopColor="#00000000" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#bgG)" />
      {/* 同心圆 */}
      {[80, 140, 200, 260].map((r) => (
        <circle key={r} cx={centerX} cy={centerY} r={r} fill="none" stroke="#ffffff0a" strokeWidth={1} strokeDasharray="3 6" />
      ))}
      {/* 连线 */}
      {hubNodes.map((h, i) => (
        <line key={`h-${i}`} x1={centerX} y1={centerY} x2={h.x} y2={h.y} stroke="#ffffff20" strokeWidth={1} />
      ))}
      {sats.map((s, i) => (
        <line key={`s-${i}`} x1={hubNodes[s.hubIdx].x} y1={hubNodes[s.hubIdx].y} x2={s.x} y2={s.y} stroke={`${s.c}55`} strokeWidth={1} strokeDasharray="2 3" />
      ))}
      {/* 中心 */}
      <circle cx={centerX} cy={centerY} r={26} fill="#FF2E88" opacity={0.15} className="animate-pulse" />
      <circle cx={centerX} cy={centerY} r={18} fill="#FF2E8830" stroke="#FF2E88" strokeWidth={1.5} />
      <text x={centerX} y={centerY + 5} textAnchor="middle" fontSize={14} fill="#fff" fontWeight={700}>
        {({ artist: 'IP', organizer: 'ORG', venue: 'VENUE' } as any)[mode]}
      </text>
      {/* hub */}
      {hubNodes.map((h, i) => (
        <g key={h.id}>
          <circle cx={h.x} cy={h.y} r={36} fill={`${h.color}18`} />
          <circle cx={h.x} cy={h.y} r={22} fill={h.color} opacity={0.85} />
          <text x={h.x} y={h.y + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill="#0B1A3A">
            {h.name.slice(0, 1)}
          </text>
          <text x={h.x} y={h.y + 52} textAnchor="middle" fontSize={11} fill="#ffffffc0">
            {h.name.slice(0, 8)}
          </text>
          <text x={h.x} y={h.y - 32} textAnchor="middle" fontSize={9} fill="#F5B544" fontWeight={600}>
            ★ {h.hot}
          </text>
        </g>
      ))}
      {/* 卫星 */}
      {sats.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c} opacity={0.85}>
          <animate attributeName="opacity" values="0.5;1;0.5" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

function FlowView({ flows, loading, language }: { flows: CityFlow[]; loading: boolean; language: 'zh' | 'en' | 'ja' | 'ko' }) {
  const [citySel, setCitySel] = useState<string>('all');
  const cities = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of flows) {
      m.set(f.fromCity, (m.get(f.fromCity) || 0) + f.count);
      m.set(f.toCity, (m.get(f.toCity) || 0) + f.count);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [flows]);
  const filtered = useMemo(() => flows.filter((f) => citySel === 'all' || f.fromCity === citySel || f.toCity === citySel), [flows, citySel]);
  const total = filtered.reduce((a, b) => a + b.count, 0);
  const totalDist = filtered.reduce((a, b) => a + b.count * b.distanceKm, 0);

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="section-head">
          <div>
            <p className="section-eyebrow"><MapPin className="inline w-3.5 h-3.5 mr-1" />Mobility</p>
            <h2 className="font-display font-bold text-xl">
              {language === 'zh' ? '观众跨城观演轨迹' : 'Cross-City Audience Flows'}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Radio className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <select value={citySel} onChange={(e) => setCitySel(e.target.value)} className="select pl-10 !w-56">
                <option value="all">{language === 'zh' ? '全部城市' : 'All cities'}</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          <Stat label={language === 'zh' ? '总跨城人数' : 'Total travelers'} v={total.toLocaleString()} color="text-neon-pink" />
          <Stat label={language === 'zh' ? '总里程 (km)' : 'Total KM'} v={(totalDist / 1000).toFixed(1) + 'k'} color="text-neon-amber" />
          <Stat label={language === 'zh' ? 'OD 线路数' : 'OD pairs'} v={filtered.length} color="text-neon-violet" />
          <Stat label={language === 'zh' ? '人均距离' : 'Avg distance'} v={total ? Math.round(totalDist / total) + ' km' : '—'} color="text-neon-teal" />
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
        <div className="card p-5">
          <div className="section-head">
            <div>
              <h2 className="font-display font-bold text-xl">{language === 'zh' ? '跨城流向弦图 (模拟)' : 'Flow Chord (Simulated)'}</h2>
            </div>
          </div>
          <FlowSvg cities={cities.slice(0, 8)} flows={filtered} />
        </div>
        <div className="card p-5">
          <div className="section-head">
            <div>
              <h2 className="font-display font-bold text-xl">{language === 'zh' ? 'Top 流向' : 'Top Routes'}</h2>
            </div>
          </div>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filtered.slice(0, 8)} layout="vertical" margin={{ left: 100, right: 12, top: 4, bottom: 4 }}>
                <CartesianGrid stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 10 }} />
                <YAxis type="category" dataKey="fromCity" stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 10, color: '#fff', fontSize: 11 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {filtered.slice(0, 8).map((f, i) => <Cell key={i} fill={hashColor(f.fromCity + f.toCity + i)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_0.9fr_0.9fr_1.2fr] px-5 py-3 border-b border-white/10 text-[11px] uppercase tracking-widest text-white/40">
          <span>{language === 'zh' ? '出发' : 'From'}</span>
          <span>{language === 'zh' ? '到达' : 'To'}</span>
          <span>{language === 'zh' ? '观演人数' : 'Travelers'}</span>
          <span>{language === 'zh' ? '距离' : 'Distance'}</span>
          <span>{language === 'zh' ? '对应演出' : 'For Event'}</span>
        </div>
        {filtered.map((f, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_0.9fr_0.9fr_1.2fr] gap-4 px-5 py-3.5 border-b border-white/5 last:border-0 text-sm items-center">
            <span className="font-semibold text-neon-amber">{f.fromCity}</span>
            <span className="font-semibold text-neon-teal">→ {f.toCity}</span>
            <span className="num font-bold text-neon-pink">{f.count.toLocaleString()}</span>
            <span className="text-white/70">{f.distanceKm.toLocaleString()} km</span>
            <span className="truncate text-white/75">
              <span className="mr-2">{f.eventPoster}</span>
              {pickML(f.eventTitle, language)}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

function FlowSvg({ cities, flows }: { cities: string[]; flows: CityFlow[] }) {
  const W = 560, H = 420;
  const cx = W / 2, cy = H / 2, R = 160;
  const colors = cities.map((c) => hashColor(c));
  const cityIdx = new Map(cities.map((c, i) => [c, i]));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[380px]">
      {cities.map((_, i) => {
        const a = (i / Math.max(cities.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={42} fill={`${colors[i]}18`} />
            <circle cx={x} cy={y} r={16} fill={colors[i]} opacity={0.85} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fill="#0B1A3A" fontWeight={800}>{i + 1}</text>
            <text x={x} y={y + 60} textAnchor="middle" fontSize={11} fill="#ffffffc0">{cities[i]}</text>
          </g>
        );
      })}
      {flows.slice(0, 24).map((f, i) => {
        const si = cityIdx.get(f.fromCity), ti = cityIdx.get(f.toCity);
        if (si === undefined || ti === undefined || si === ti) return null;
        const a1 = (si / Math.max(cities.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const a2 = (ti / Math.max(cities.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
        const x2 = cx + Math.cos(a2) * R, y2 = cy + Math.sin(a2) * R;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 40 - (i % 5) * 8;
        return (
          <path key={i} d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke={colors[si]} strokeWidth={1 + Math.min(3, f.count / 800)} opacity={0.45}>
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur={`${2 + (i % 4)}s`} repeatCount="indefinite" />
          </path>
        );
      })}
    </svg>
  );
}

function ReviewView({ review, loading, language, orgs, selOrg, setSelOrg }: any) {
  if (loading) return <div className="card h-[500px] animate-pulse" />;
  if (!review) return <div className="card p-10 text-center text-white/50">{language === 'zh' ? '暂无数据' : 'No data'}</div>;
  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow"><Crown className="inline w-3.5 h-3.5 mr-1" />Organizer Review</p>
            <h2 className="font-display font-bold text-2xl">
              {pickML(review.organizerName, language)}
            </h2>
            <p className="text-white/55 text-sm mt-1">{language === 'zh' ? `复盘周期：${review.period}` : `Period: ${review.period}`}</p>
          </div>
          <div className="flex gap-2">
            <select value={selOrg} onChange={(e) => setSelOrg(e.target.value)} className="select !w-56">
              {orgs.map((o: any) => <option key={o.id} value={o.id}>{pickML(o.name, language)}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label={language === 'zh' ? '演出场数' : 'Shows'} v={review.shows} color="text-neon-pink" />
          <Stat label={language === 'zh' ? '总票量' : 'Tickets'} v={review.ticketsTotal.toLocaleString()} color="text-neon-amber" />
          <Stat label={language === 'zh' ? '售出率' : 'Sell-out'} v={`${review.selloutRate.toFixed(1)}%`} color="text-neon-violet" />
          <Stat label={language === 'zh' ? 'GMV' : 'GMV'} v={`¥${fmtCny(review.gmv)}`} color="text-neon-teal" />
          <Stat label={language === 'zh' ? '客诉率' : 'Complaints'} v={`${(review.complaintRate * 100).toFixed(2)}%`} color="text-warn" />
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
        <section className="card p-5">
          <div className="section-head">
            <div>
              <p className="section-eyebrow">Radar</p>
              <h2 className="font-display font-bold text-xl">{language === 'zh' ? '能力雷达图' : 'Capability Radar'}</h2>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={review.radar}>
                <PolarGrid stroke="#ffffff20" />
                <PolarAngleAxis dataKey="dim" stroke="#ffffff80" tick={{ fill: '#ffffffcc', fontSize: 11 }} />
                <PolarRadiusAxis stroke="#ffffff40" tick={{ fill: '#ffffff80', fontSize: 9 }} />
                <Radar name={language === 'zh' ? '本期' : 'Current'} dataKey="current" stroke="#FF2E88" fill="#FF2E88" fillOpacity={0.35} />
                <Radar name={language === 'zh' ? '上期' : 'Previous'} dataKey="baseline" stroke="#2DD4BF" fill="#2DD4BF" fillOpacity={0.2} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#ffffffa0' }} />
                <Tooltip contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 10, color: '#fff', fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card p-5">
          <div className="section-head">
            <div>
              <p className="section-eyebrow"><TrendingUp className="inline w-3.5 h-3.5 mr-1" />Sell-out Curves</p>
              <h2 className="font-display font-bold text-xl">{language === 'zh' ? '各场售罄曲线' : 'Show Sell-out Curves'}</h2>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={review.series} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="x" stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 10 }} />
                <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 10, color: '#fff', fontSize: 11 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#ffffffa0' }} />
                {Object.keys(review.series[0] || {}).filter((k) => k !== 'x').map((k, i) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={['#FF2E88', '#F5B544', '#8B5CF6', '#2DD4BF', '#60A5FA'][i % 5]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="card p-5">
        <div className="section-head">
          <div>
            <p className="section-eyebrow"><CircleDollarSign className="inline w-3.5 h-3.5 mr-1" />Revenue</p>
            <h2 className="font-display font-bold text-xl">{language === 'zh' ? '分票档收入堆叠' : 'Revenue by Tier (Stacked)'}</h2>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={review.revenue} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="show" stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 10 }} />
              <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 10, color: '#fff', fontSize: 11 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#ffffffa0' }} />
              {(['VIP', 'A', 'B', 'C'] as const).map((g, i) => (
                <Bar key={g} stackId="a" dataKey={g} fill={['#FF2E88', '#F5B544', '#8B5CF6', '#2DD4BF'][i]} radius={i === 0 ? [6, 6, 0, 0] : undefined} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card p-5">
        <div className="section-head">
          <div>
            <p className="section-eyebrow"><Users className="inline w-3.5 h-3.5 mr-1" />Shows</p>
            <h2 className="font-display font-bold text-xl">{language === 'zh' ? '演出明细' : 'Show Breakdown'}</h2>
          </div>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.9fr_0.9fr] px-4 py-2.5 bg-white/[0.03] text-[11px] uppercase tracking-widest text-white/40">
            <span>{language === 'zh' ? '演出' : 'Show'}</span>
            <span>{language === 'zh' ? '日期' : 'Date'}</span>
            <span>{language === 'zh' ? '出票/总量' : 'Tickets'}</span>
            <span>{language === 'zh' ? '售罄率' : 'Sell-out'}</span>
            <span>{language === 'zh' ? '收入' : 'Revenue'}</span>
            <span>{language === 'zh' ? '热度' : 'Heat'}</span>
          </div>
          {review.showsList?.map((s: any, i: number) => (
            <div key={i} className="grid grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.9fr_0.9fr] items-center gap-4 px-4 py-3 border-b border-white/5 last:border-0 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{s.poster}</span>
                <span className="truncate font-medium">{pickML(s.title, language)}</span>
              </div>
              <span className="text-white/70 text-xs">{fmtDate(s.date)}</span>
              <span className="num">{s.sold.toLocaleString()} / {s.total.toLocaleString()}</span>
              <div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden max-w-[120px]">
                  <div className="h-full bg-gradient-to-r from-neon-pink to-neon-amber" style={{ width: `${(s.sold / s.total) * 100}%` }} />
                </div>
                <span className="text-[10px] text-white/50 mt-0.5">{Math.round(s.sold / s.total * 100)}%</span>
              </div>
              <span className="num font-bold text-neon-amber">¥{fmtCny(s.revenue)}</span>
              <span className="flex items-center gap-1 text-neon-pink"><Flame className="w-3.5 h-3.5" /> {s.heat}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, v, color }: { label: string; v: React.ReactNode; color: string }) {
  return (
    <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
      <div className={classNames('text-xs font-semibold', color)}>{label}</div>
      <div className="num font-black text-2xl mt-1">{v}</div>
    </div>
  );
}
