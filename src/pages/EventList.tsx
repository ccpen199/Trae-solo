import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, ArrowUpDown, Grid3X3, List, MapPin, CalendarDays, Flame, Coins } from 'lucide-react';
import type { EventSummary, Region, EventType, Currency } from '@/shared/types';
import { api } from '@/utils/api';
import EventCard from '@/components/EventCard';
import { useAppStore } from '@/store/app';
import { REGION_LABEL, EVENT_TYPE_LABEL, CURRENCY_META, classNames, fmtMoney, pickML } from '@/utils/meta';

const REGIONS: (Region | 'all')[] = ['all', 'mainland', 'HKMT', 'JP_KR', 'SEA'];
const TYPES: (EventType | 'all')[] = ['all', 'concert', 'musical', 'play', 'festival', 'exhibition'];
const SORTS: { id: string; zh: string; en: string }[] = [
  { id: 'default', zh: '智能推荐', en: 'Recommended' },
  { id: 'date_asc', zh: '日期 从近到远', en: 'Date ↑' },
  { id: 'price_asc', zh: '票价 低到高', en: 'Price ↑' },
  { id: 'price_desc', zh: '票价 高到低', en: 'Price ↓' },
];

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

  const t = {
    zh: {
      filters: '筛选条件', regions: '区域市场', types: '演出类型', currencies: '结算币种',
      results: '结果', sort: '排序', grid: '卡片', list: '列表',
      noResult: '没有匹配的演出，试试更换筛选条件。',
      hot: '热度', venue: '场馆', date: '日期', price: '票价',
    },
    en: {
      filters: 'Filters', regions: 'Market', types: 'Type', currencies: 'Currency',
      results: 'results', sort: 'Sort', grid: 'Cards', list: 'List',
      noResult: 'No matching events, try adjusting filters.',
      hot: 'Heat', venue: 'Venue', date: 'Date', price: 'Price',
    },
    ja: { filters: '絞込み', regions: '地域', types: '種別', currencies: '通貨', results: '件', sort: '並替', grid: 'カード', list: 'リスト', noResult: '該当公演なし', hot: '人気度', venue: '会場', date: '日程', price: '価格' },
    ko: { filters: '필터', regions: '지역', types: '타입', currencies: '통화', results: '건', sort: '정렬', grid: '카드', list: '리스트', noResult: '해당 공연이 없습니다', hot: '인기도', venue: '장소', date: '일정', price: '가격' },
  }[language] ?? ({ zh: {} as any }).zh;

  return (
    <div className="space-y-6">
      {/* 顶部筛选 */}
      <section className="card p-5">
        <div className="section-head">
          <div>
            <p className="section-eyebrow"><Filter className="inline w-3.5 h-3.5 mr-1" />Filters</p>
            <h2 className="font-display font-bold text-2xl">{language === 'zh' ? '演出票务 · 全球市场' : 'Global Events & Ticketing'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
              <button onClick={() => setView('grid')} className={classNames('px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1', view === 'grid' ? 'bg-neon-pink/20 text-neon-pink' : 'text-white/60 hover:text-white')}>
                <Grid3X3 className="w-3.5 h-3.5" />{t.grid}
              </button>
              <button onClick={() => setView('list')} className={classNames('px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1', view === 'list' ? 'bg-neon-pink/20 text-neon-pink' : 'text-white/60 hover:text-white')}>
                <List className="w-3.5 h-3.5" />{t.list}
              </button>
            </div>
            <div className="relative">
              <select
                value={q.sort}
                onChange={(e) => patch({ sort: e.target.value })}
                className="select pr-8 pl-10 appearance-none cursor-pointer text-sm"
              >
                {SORTS.map((s) => <option key={s.id} value={s.id}>{language === 'zh' ? s.zh : s.en}</option>)}
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
              placeholder={language === 'zh' ? '搜索艺人、演出、场馆……' : 'Search artists, events, venues...'}
              className="input pl-11 pr-24 text-sm"
            />
            <button
              onClick={() => patch({ keyword: kwLocal.trim() })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold px-3 py-1.5 rounded-full btn-primary !py-1.5 !px-3 !text-xs"
            >{language === 'zh' ? '搜索' : 'Search'}</button>
          </div>
          <div className="text-sm text-white/50">
            {loading ? '...' : list.length} {t.results}
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-4">
          <FilterGroup title={t.regions}>
            {REGIONS.map((r) => {
              const label = r === 'all' ? (language === 'zh' ? '全部' : 'All') : language === 'zh' ? REGION_LABEL[r].zh : REGION_LABEL[r].en;
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
          <FilterGroup title={t.types}>
            {TYPES.map((r) => {
              const label = r === 'all' ? (language === 'zh' ? '全部' : 'All') : language === 'zh' ? EVENT_TYPE_LABEL[r].zh : EVENT_TYPE_LABEL[r].en;
              const icon = r === 'all' ? '✨' : EVENT_TYPE_LABEL[r as EventType].icon;
              return (
                <Chip key={r} active={q.type === r} onClick={() => patch({ type: r })}>
                  <span className="mr-1">{icon}</span>{label}
                </Chip>
              );
            })}
          </FilterGroup>
          <FilterGroup title={t.currencies}>
            <Chip active={q.currency === 'all'} onClick={() => patch({ currency: 'all' })}>{language === 'zh' ? '全部' : 'All'}</Chip>
            {(['CNY', 'HKD', 'TWD', 'JPY', 'KRW', 'USD', 'SGD'] as Currency[]).map((c) => (
              <Chip key={c} active={q.currency === c} onClick={() => patch({ currency: c })} color="text-neon-amber">
                <Coins className="w-3 h-3 mr-1" />{c} · {CURRENCY_META[c].name}
              </Chip>
            ))}
          </FilterGroup>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => { setKwLocal(''); setSp({}); }} className="btn-ghost !py-1.5 !px-3 !text-xs">
              {language === 'zh' ? '清空筛选' : 'Reset'}
            </button>
            <button onClick={() => nav('/events/ev-sahara-tp')} className="btn-amber !py-1.5 !px-3 !text-xs">
              {language === 'zh' ? '热销推荐 · Sahara 台北' : 'Hot Pick · Sahara Taipei'}
            </button>
          </div>
        </div>
      </section>

      {err && <div className="text-warn text-sm card p-4">加载失败：{err}</div>}

      {!loading && list.length === 0 && (
        <div className="card p-10 text-center text-white/50">{t.noResult}</div>
      )}

      {view === 'grid' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {list.map((ev) => <EventCard key={ev.id} ev={ev} />)}
        </div>
      ) : (
        <ListTable list={list} language={language} currency={currency} t={t} />
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

function ListTable({ list, language, currency, t }: { list: EventSummary[]; language: 'zh' | 'en' | 'ja' | 'ko'; currency: Currency; t: any }) {
  const nav = useNavigate();
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[auto_2fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] items-center px-5 py-3 border-b border-white/10 text-[11px] uppercase tracking-widest text-white/40">
        <span></span>
        <span>{language === 'zh' ? '演出' : 'Event'}</span>
        <span>{t.venue}</span>
        <span>{t.date}</span>
        <span>{t.price}</span>
        <span>{t.hot}</span>
        <span>{language === 'zh' ? '市场/语言' : 'Market/Langs'}</span>
        <span></span>
      </div>
      {list.map((ev) => {
        const region = REGION_LABEL[ev.region];
        return (
          <button
            key={ev.id}
            onClick={() => nav(`/events/${ev.id}`)}
            className="grid grid-cols-[auto_2fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] items-center gap-4 w-full text-left px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors"
          >
            <span className="text-3xl">{ev.poster}</span>
            <div>
              <div className="font-semibold truncate">{pickML(ev.title, language)}</div>
              <div className="text-xs text-white/40 mt-0.5">{ev.artistNames.map((n) => pickML(n, language)).join(' · ')}</div>
            </div>
            <div className="text-sm text-white/80 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neon-teal" />
              <span className="truncate">{pickML(ev.venueName, language)} · {pickML(ev.city, language)}</span>
            </div>
            <div className="text-sm text-white/75 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-neon-violet" />
              <span>{ev.startTime.slice(0, 10)}</span>
            </div>
            <div className="num font-bold text-neon-amber">
              {fmtMoney(ev.priceMin, currency)}<span className="text-white/30 mx-1 text-xs">~</span>{fmtMoney(ev.priceMax, currency)}
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-neon-pink" />
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-[90px]">
                <div className="h-full rounded-full" style={{ width: `${ev.hotIndex}%`, background: 'linear-gradient(90deg,#FF2E88,#F5B544)' }} />
              </div>
              <span className="text-xs num font-semibold text-white/70">{ev.hotIndex}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className={classNames('chip border-white/20', region.color)}>{language === 'zh' ? region.zh : region.en}</span>
              {ev.languages.slice(0, 2).map((l) => <span key={l} className="chip border-white/10 bg-white/5 text-white/70 text-[10px]">{l.toUpperCase()}</span>)}
            </div>
            <span className="text-xs text-neon-pink font-semibold text-right hover:underline">{language === 'zh' ? '购票' : 'Tickets'} →</span>
          </button>
        );
      })}
    </div>
  );
}
