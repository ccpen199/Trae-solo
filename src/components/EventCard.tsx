import { MapPin, CalendarDays, Flame, Languages, Coins, TrendingUp, TrendingDown, Minus, Ticket as TicketIcon, CreditCard, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EventSummary, TicketGrade } from '@/shared/types';
import { useAppStore } from '@/store/app';
import {
  EVENT_STATUS_LABEL, EVENT_TYPE_LABEL, GRADE_LABEL, REGION_LABEL,
  classNames, fmtDate, fmtMoney, pickML, pickRegionLabel, pickEventTypeLabel, pickEventStatusLabel,
} from '@/utils/meta';

const REMAIN_LABEL: Record<string, { zh: string; en: string; ja: string; ko: string }> = {
  remaining: { zh: '余票率', en: 'Remaining', ja: '残席率', ko: '잔여율' },
  tiers: { zh: '票档', en: 'Tiers', ja: '席種', ko: '좌석 등급' },
  price: { zh: '票价区间', en: 'Ticket Range', ja: '価格帯', ko: '가격대' },
};
const RL = (k: keyof typeof REMAIN_LABEL, l: string) => (REMAIN_LABEL[k] as any)[l] || (REMAIN_LABEL[k] as any).zh;

export default function EventCard({ ev }: { ev: EventSummary }) {
  const { language, currency } = useAppStore();
  const region = REGION_LABEL[ev.region];
  const st = EVENT_STATUS_LABEL[ev.status];
  const tp = EVENT_TYPE_LABEL[ev.type];
  const gradColors: Record<TicketGrade, string> = {
    VIP: 'from-[#F5B544] to-[#FF2E88]',
    S: 'from-[#FF2E88] to-[#8B5CF6]',
    A: 'from-[#2DD4BF] to-[#60A5FA]',
    B: 'from-[#8B5CF6] to-[#60A5FA]',
    C: 'from-[#94a3b8] to-[#475569]',
  };
  const remainColor = ev.remainingPct < 20 ? '#FF2E88' : ev.remainingPct < 50 ? '#F5B544' : '#2EE8B3';
  return (
    <Link
      to={`/events/${ev.id}`}
      className={classNames('card-hl glow-border group block overflow-hidden relative')}
    >
      {/* 海报 */}
      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 bg-cover"
          style={{
            background: `linear-gradient(135deg, rgba(255,46,136,0.35), rgba(139,92,246,0.35) 45%, rgba(45,212,191,0.25)), radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), transparent 60%), #0B1A3A`,
          }}
        />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-[56px] drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500">{ev.poster}</div>
        </div>
        {/* 舞台光束 */}
        <div className="absolute inset-x-0 top-0 flex justify-around pointer-events-none opacity-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="w-14 h-full origin-top animate-beam"
              style={{
                background: `linear-gradient(180deg, ${['#FF2E88', '#F5B544', '#8B5CF6', '#2DD4BF', '#60A5FA'][i % 5]}55, transparent)`,
                transform: `rotate(${(i - 2) * 5}deg)`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className={classNames('chip border-white/20 bg-ink-900/70', region.color)}>
            {pickRegionLabel(ev.region, language)}
          </span>
          <span className="chip border-white/10 bg-white/5 text-white/75">{tp.icon} {pickEventTypeLabel(ev.type, language)}</span>
          {ev.hasCrossBorderPay && <span className="chip border-neon-teal/30 bg-neon-teal/10 text-neon-teal"><CreditCard className="w-3 h-3" /></span>}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <DeltaTag delta={ev.peakDeltaPct} small />
          <span className={classNames('chip border', st.cls)}>{pickEventStatusLabel(ev.status, language)}</span>
        </div>
        {/* 艺人小头像行 */}
        <div className="absolute bottom-3 left-3 flex -space-x-2">
          {ev.artistNames.slice(0, 4).map((n, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-ink-900 grid place-items-center text-[11px] font-bold text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${['#FF2E88', '#F5B544', '#8B5CF6', '#2DD4BF'][i % 4]}, #0B1A3A)` }}
              title={pickML(n, language)}
            >
              {pickML(n, language).slice(0, 1)}
            </div>
          ))}
          {ev.artistNames.length > 4 && (
            <div className="w-8 h-8 rounded-full border-2 border-ink-900 grid place-items-center text-[10px] font-bold bg-white/10 text-white">
              +{ev.artistNames.length - 4}
            </div>
          )}
        </div>
        {/* 热度 */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-ink-900/70 border border-white/10 text-[11px] font-semibold text-neon-amber">
          <Flame className="w-3 h-3" />{ev.hotIndex}
        </div>
      </div>

      {/* 信息 */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display font-bold text-[17px] leading-snug group-hover:text-neon-pink transition-colors line-clamp-2">
            {pickML(ev.title, language)}
          </h3>
        </div>
        <div className="mt-2 space-y-1 text-sm text-white/60">
          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-neon-teal" /> {pickML(ev.venueName, language)} · <span>{pickML(ev.city, language)}</span></div>
          <div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-neon-violet" /> {fmtDate(ev.startTime)}</div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {ev.languages.slice(0, 3).map((l) => (
            <span key={l} className="chip border-neon-teal/30 bg-neon-teal/10 text-neon-teal">
              <Languages className="w-3 h-3" /> {l.toUpperCase()}
            </span>
          ))}
          {ev.currencies.slice(0, 3).map((c) => (
            <span key={c} className="chip border-neon-amber/30 bg-neon-amber/10 text-neon-amber">
              <Coins className="w-3 h-3" /> {c}
            </span>
          ))}
          <span className="chip border-neon-violet/30 bg-neon-violet/10 text-neon-violet">
            <Users className="w-3 h-3" /> {ev.activeTierCount} {RL('tiers', language)}
          </span>
        </div>

        {/* 余票进度条 */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
            <span className="inline-flex items-center gap-1"><TicketIcon className="w-3 h-3" />{RL('remaining', language)}</span>
            <span className="num font-semibold" style={{ color: remainColor }}>{ev.remainingPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ev.remainingPct}%`, background: `linear-gradient(90deg, ${remainColor}, #F5B544)` }} />
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-[11px] text-white/40 uppercase tracking-wider">{RL('price', language)}</div>
            <div className="num font-bold text-lg text-white">
              {fmtMoney(ev.priceMin, currency)} <span className="text-white/30 font-normal text-sm mx-1">~</span> {fmtMoney(ev.priceMax, currency)}
            </div>
          </div>
          <div className="flex gap-0.5">
            {(['VIP', 'A', 'B', 'C'] as TicketGrade[]).map((g, i) => (
              <div
                key={g}
                className={classNames(
                  'w-5 h-8 rounded-t-md bg-gradient-to-t opacity-80',
                  gradColors[g],
                )}
                style={{ height: `${24 + (3 - i) * 6}px` }}
                title={GRADE_LABEL[g].zh}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function DeltaTag({ delta, small }: { delta: number; small?: boolean }) {
  const up = delta > 1;
  const flat = Math.abs(delta) <= 1;
  return (
    <span className={classNames(
      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-bold',
      small ? 'text-[10px]' : 'text-[11px]',
      flat ? 'bg-white/5 text-white/60' :
        up ? 'bg-neon-pink/15 text-neon-pink border border-neon-pink/30' : 'bg-neon-teal/15 text-neon-teal border border-neon-teal/30',
    )}>
      {flat ? <Minus className="w-3 h-3" /> : up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
    </span>
  );
}
