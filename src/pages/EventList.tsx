import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, ArrowUpDown, Grid3X3, List, MapPin, CalendarDays, Flame, Coins, Ticket as TicketIcon, TrendingUp, TrendingDown, Minus, ShieldCheck, Languages as LanguagesIcon, CreditCard, Users } from 'lucide-react';
import type { EventSummary, Region, EventType, Currency } from '@/shared/types';
import { api } from '@/utils/api';
import EventCard, { DeltaTag } from '@/components/EventCard';
import { useAppStore } from '@/store/app';
import { REGION_LABEL, EVENT_TYPE_LABEL, CURRENCY_META, classNames, fmtMoney, pickML, pickRegionLabel, pickEventTypeLabel, pickCurrencyName, pickEventStatusLabel } from '@/utils/meta';

const REGIONS: (Region | 'all')[] = ['all', 'mainland', 'HKMT', 'JP_KR', 'SEA'];
const TYPES: (EventType | 'all')[] = ['all', 'concert', 'musical', 'play', 'festival', 'exhibition'];

const SORTS: { id: string; zh: string; en: string; ja: string; ko: string }[] = [
  { id: 'default', zh: '智能推荐', en: 'Recommended', ja: 'おすすめ順', ko: '추천순' },
  { id: 'date_asc', zh: '日期 从近到远', en: 'Date ↑', ja: '日程 近い順', ko: '일정 가까운 순' },
  { id: 'price_asc', zh: '票价 低到高', en: 'Price ↑', ja: '価格 安い順', ko: '가격 낮은 순' },
  { id: 'price_desc', zh: '票价 高到低', en: 'Price ↓', ja: '価格 高い順', ko: '가격 높은 순' },
  { id: 'hot_desc', zh: '热度 高到低', en: 'Heat ↓', ja: '人気度 高い順', ko: '인기도 높은 순' },
  { id: 'remain_desc', zh: '余票 多到少', en: 'Remaining ↓', ja: '残り席 多い順', ko: '잔여석 많은 순' },
];

const ALL_LABEL: Record<string, { zh: string; en: string; ja: string; ko: string }> = {
  filters: { zh: '筛选条件', en: 'Filters', ja: '絞込み条件', ko: '필터 조건' },
  regions: { zh: '区域市场', en: 'Market', ja: '地域市場', ko: '지역 시장' },
  types: { zh: '演出类型', en: 'Type', ja: '公演種別', ko: '공연 타입' },
  currencies: { zh: '结算币种', en: 'Currency', ja: '決済通貨', ko: '결제 통화' },
  results: { zh: '结果', en: 'results', ja: '件', ko: '건' },
  sort: { zh: '排序', en: 'Sort', ja: '並替', ko: '정렬' },
  grid: { zh: '卡片', en: 'Cards', ja: 'カード', ko: '카드' },
  list: { zh: '列表', en: 'List', ja: 'リスト', ko: '리스트' },
  noResult: { zh: '没有匹配的演出，试试更换筛选条件。', en: 'No matching events, try adjusting filters.', ja: '該当する公演がありません。条件を変更してください。', ko: '해당 공연이 없습니다. 필터를 조정해보세요.' },
  hot: { zh: '热度', en: 'Heat', ja: '人気度', ko: '인기도' },
  venue: { zh: '场馆', en: 'Venue', ja: '会場', ko: '장소' },
  date: { zh: '日期', en: 'Date', ja: '日程', ko: '일정' },
  price: { zh: '票价', en: 'Price', ja: '価格', ko: '가격' },
  remaining: { zh: '余票率', en: 'Remaining', ja: '残席率', ko: '잔여율' },
  tiers: { zh: '票档', en: 'Tiers', ja: '席種', ko: '좌석 등급' },
  crossPay: { zh: '跨境支付', en: 'Cross-pay', ja: '越境決済', ko: '크로스보더 결제' },
  title: { zh: '演出票务 · 全球市场', en: 'Global Events & Ticketing', ja: '公演チケット・グローバル市場', ko: '공연 티켓 · 글로벌 마켓' },
  searchPh: { zh: '搜索艺人、演出、场馆……', en: 'Search artists, events, venues...', ja: 'アーティスト・公演・会場を検索……', ko: '아티스트, 공연, 장소 검색...' },
  search: { zh: '搜索', en: 'Search', ja: '検索', ko: '검색' },
  all: { zh: '全部', en: 'All', ja: 'すべて', ko: '전체' },
  reset: { zh: '清空筛选', en: 'Reset', ja: 'リセット', ko: '초기화' },
  hotPick: { zh: '热销推荐 · Sahara 台北', en: 'Hot Pick · Sahara Taipei', ja: '人気No.1・Sahara 台北', ko: '인기 추천 · Sahara 타이베이' },
  buy: { zh: '购票', en: 'Tickets', ja: '購入', ko: '구매' },
  event: { zh: '演出', en: 'Event', ja: '公演', ko: '공연' },
  market: { zh: '市场/语言', en: 'Market/Langs', ja: '市場/言語', ko: '마켓/언어' },
};
const L = (k: keyof typeof ALL_LABEL, lang: string) => (ALL_LABEL[k] as any)[lang] || (ALL_LABEL[k] as any).zh;

export default function EventList() {
  const { language, currency } = useAppStore();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const [list, setList] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const q = useMemo(() => ({
    region: (sp.get('region') || 'all') as Region | 'all',
    type: (sp.get('type') || 'all') as EventType | 'all',
    keyword: sp.get('keyword') || '',
    currency: (sp.get('currency') || 'all') as Currency | 'all',
    sort: sp.get('sort') || 'default',
  }), [sp]);
  const [kwLocal, setKwLocal] = useState(q.keyword);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.region !== 'all') params.set('region', q.region);
    if (q.type !== 'all') params.set('type', q.type);
    if (q.keyword) params.set('keyword', q.keyword);
    if (q.currency !== 'all') params.set('currency', q.currency);
    if (q.sort !== 'default') params.set('sort', q.sort);
    const s = params.toString();
    api.get<EventSummary[]>(`/api/events${s ? `?${s}` : ''}`).then((data) => {
      setList(data);
      setLoading(false);
    }).catch((e) => { setErr(e.message); setLoading(false); });
  }, [q.region, q.type, q.keyword, q.currency, q.sort]);

  const patch = (p: Partial<typeof q>) => {
    const next = { ...q, ...p } as any;
    const o: Record<string, string> = {};
    for (const k of Object.keys(next)) if (next[k] && next[k] !== 'all') o[k] = String(next[k]);
    setSp(o);
  };

  const sorted = useMemo(() => {
    const a = [...list];
    if (q.sort === 'date_asc') a.sort((x, y) => x.startTime.localeCompare(y.startTime));
    if (q.sort === 'price_asc') a.sort((x, y) => x.priceMin - y.priceMin);
    if (q.sort === 'price_desc') a.sort((x, y) => y.priceMax - x.priceMax);
    if (q.sort === 'hot_desc') a.sort((x, y) => y.hotIndex - x.hotIndex);
    if (q.sort === 'remain_desc') a.sort((x, y) => y.remainingPct - x.remainingPct);
    return a;
  }, [list, q.sort]);

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="section-head">
          <div>
            <p className="section-eyebrow"><Filter className="inline w-3.5 h-3.5 mr-1" />{L('filters', language)}</p>
            <h2 className="font-display font-bold text-2xl">{L('title', language)}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
              <button onClick={() => setView('grid')} className={classNames('px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1', view === 'grid' ? 'bg-neon-pink/20 text-neon-pink' : 'text-white/60 hover:text-white')}>
                <Grid3X3 className="w-3.5 h-3.5" />{L('grid', language)}
              </button>
              <button onClick={() => setView('list')} className={classNames('px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1', view === 'list' ? 'bg-neon-pink/20 text-neon-pink' : 'text-white/60 hover:text-white')}>
                <List className="w-3.5 h-3.5" />{L('list', language)}
              </button>
            </div>
            <div className="relative">
              <select
                value={q.sort}
                onChange={(e) => patch({ sort: e.target.value })}
                className="select pr-8 pl-10 appearance-none cursor-pointer text-sm"
              >
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s[language as 'zh' | 'en' | 'ja' | 'ko']}</option>)}
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={kwLocal}
              onChange={(e) => setKwLocal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') patch({ keyword: kwLocal.trim() }); }}
              placeholder={L('searchPh', language)}
              className="input pl-11 pr-24 text-sm"
            />
            <button
              onClick={() => patch({ keyword: kwLocal.trim() })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold px-3 py-1.5 rounded-full btn-primary !py-1.5 !px-3 !text-xs"
            >{L('search', language)}</button>
          </div>
          <div className="text-sm text-white/50">
            {loading ? '...' : sorted.length} {L('results', language)}
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-4">
          <FilterGroup title={L('regions', language)}>
            {REGIONS.map((r) => {
              const label = r === 'all' ? L('all', language) : pickRegionLabel(r as Region, language);
              return (
                <Chip
                  key={r}
                  active={q.region === r}
                  onClick={() => patch({ region: r })}
                  color={r === 'all' ? undefined : REGION_LABEL[r as Region].color}
                >{label}</Chip>
              );
            })}
          </FilterGroup>
          <FilterGroup title={L('types', language)}>
            {TYPES.map((r) => {
              const label = r === 'all' ? L('all', language) : pickEventTypeLabel(r as EventType, language);
              const icon = r === 'all' ? '✨' : EVENT_TYPE_LABEL[r as EventType].icon;
              return (
                <Chip key={r} active={q.type === r} onClick={() => patch({ type: r })}>
                  <span className="mr-1">{icon}</span>{label}
                </Chip>
              );
            })}
          </FilterGroup>
          <FilterGroup title={L('currencies', language)}>
            <Chip active={q.currency === 'all'} onClick={() => patch({ currency: 'all' })}>{L('all', language)}</Chip>
            {(['CNY', 'HKD', 'TWD', 'JPY', 'KRW', 'USD', 'SGD', 'THB', 'MYR'] as Currency[]).map((c) => (
              <Chip key={c} active={q.currency === c} onClick={() => patch({ currency: c })} color="text-neon-amber">
                <Coins className="w-3 h-3 mr-1" />{c} · {pickCurrencyName(c, language)}
              </Chip>
            ))}
          </FilterGroup>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => { setKwLocal(''); setSp({}); }} className="btn-ghost !py-1.5 !px-3 !text-xs">
              {L('reset', language)}
            </button>
            <button onClick={() => nav('/events/ev-sahara-tp')} className="btn-amber !py-1.5 !px-3 !text-xs">
              {L('hotPick', language)}
            </button>
          </div>
        </div>
      </section>

      {err && <div className="text-warn text-sm card p-4">加载失败：{err}</div>}

      {!loading && sorted.length === 0 && (
        <div className="card p-10 text-center text-white/50">{L('noResult', language)}</div>
      )}

      {view === 'grid' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {sorted.map((ev) => <EventCard key={ev.id} ev={ev} />)}
        </div>
      ) : (
        <ListTable list={sorted} language={language} currency={currency} />
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-white/40 uppercase tracking-widest mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'chip transition-all border',
        active
          ? 'bg-neon-pink/15 border-neon-pink/50 text-neon-pink shadow-glow/30'
          : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/10 hover:text-white',
      )}
    >
      <span className={color || ''}>{children}</span>
    </button>
  );
}

function ListTable({ list, language, currency }: { list: EventSummary[]; language: 'zh' | 'en' | 'ja' | 'ko'; currency: Currency }) {
  const nav = useNavigate();
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[auto_2fr_1.4fr_1fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr_0.6fr] items-center px-5 py-3 border-b border-white/10 text-[11px] uppercase tracking-widest text-white/40 min-w-[1280px]">
        <span></span>
        <span>{L('event', language)}</span>
        <span>{L('venue', language)}</span>
        <span>{L('date', language)}</span>
        <span>{L('price', language)}</span>
        <span>{L('hot', language)}</span>
        <span>{L('remaining', language)}</span>
        <span>{L('tiers', language)}</span>
        <span>{L('market', language)}</span>
        <span></span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1280px]">
          {list.map((ev) => {
            const region = REGION_LABEL[ev.region];
            return (
              <button
                key={ev.id}
                onClick={() => nav(`/events/${ev.id}`)}
                className="grid grid-cols-[auto_2fr_1.4fr_1fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr_0.6fr] items-center gap-4 w-full text-left px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-3xl">{ev.poster}</span>
                <div>
                  <div className="font-semibold truncate flex items-center gap-2">
                    <span>{pickML(ev.title, language)}</span>
                    <DeltaTag delta={ev.peakDeltaPct} small />
                    {ev.hasCrossBorderPay && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neon-teal/15 text-neon-teal border border-neon-teal/30 inline-flex items-center gap-1"><CreditCard className="w-2.5 h-2.5" />{L('crossPay', language)}</span>}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">{ev.artistNames.map((n) => pickML(n, language)).join(' · ')}</div>
                </div>
                <div className="text-sm text-white/80 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neon-teal shrink-0" />
                  <span className="truncate">{pickML(ev.venueName, language)} · {pickML(ev.city, language)}</span>
                </div>
                <div className="text-sm text-white/75 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-neon-violet shrink-0" />
                  <span>{ev.startTime.slice(0, 10)}</span>
                </div>
                <div className="num font-bold text-neon-amber">
                  {fmtMoney(ev.priceMin, currency)}<span className="text-white/30 mx-1 text-xs">~</span>{fmtMoney(ev.priceMax, currency)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-neon-pink shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-[70px]">
                    <div className="h-full rounded-full" style={{ width: `${ev.hotIndex}%`, background: 'linear-gradient(90deg,#FF2E88,#F5B544)' }} />
                  </div>
                  <span className="text-xs num font-semibold text-white/70 w-8">{ev.hotIndex}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TicketIcon className="w-3.5 h-3.5 text-neon-teal shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-[70px]">
                    <div className="h-full rounded-full" style={{ width: `${ev.remainingPct}%`, background: ev.remainingPct < 20 ? '#FF2E88' : ev.remainingPct < 50 ? '#F5B544' : '#2EE8B3' }} />
                  </div>
                  <span className="text-xs num font-semibold text-white/70 w-8">{ev.remainingPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-neon-violet shrink-0" />
                  <span className="text-sm num font-semibold text-white/80">{ev.activeTierCount} <span className="text-[10px] text-white/40">{L('tiers', language)}</span></span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className={classNames('chip border-white/20 text-[10px]', region.color)}>{pickRegionLabel(ev.region, language)}</span>
                  {ev.languages.slice(0, 2).map((l) => <span key={l} className="chip border-white/10 bg-white/5 text-white/70 text-[10px]">{l.toUpperCase()}</span>)}
                </div>
                <span className="text-xs text-neon-pink font-semibold text-right hover:underline">{L('buy', language)} →</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
