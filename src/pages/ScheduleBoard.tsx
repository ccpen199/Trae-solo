import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, MapPin, Users, Ticket as TicketIcon,
  Radio, Radar, BarChart3, Clock, RefreshCw, Flame, ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import type { EventScheduleSummary, VerifyTerminal } from '@/shared/types';
import { api } from '@/utils/api';
import { useAppStore } from '@/store/app';
import { REGION_LABEL, classNames, fmtDate, pickML, hashColor } from '@/utils/meta';

const WK_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const WK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleBoard() {
  const { language, currency } = useAppStore();
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [schedules, setSchedules] = useState<EventScheduleSummary[]>([]);
  const [terminals, setTerminals] = useState<VerifyTerminal[]>([]);
  const [sel, setSel] = useState<EventScheduleSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    Promise.all([
      api.get<EventScheduleSummary[]>(`/api/schedule?month=${ym}`),
      api.get<VerifyTerminal[]>('/api/verify-terminals'),
    ]).then(([s, t]) => {
      setSchedules(s); setTerminals(t); setLoading(false);
    }).catch(() => setLoading(false));
  }, [cursor]);

  const monthInfo = useMemo(() => {
    const y = cursor.getFullYear(); const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const firstW = first.getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const cells: { date?: Date; events: EventScheduleSummary[] }[] = [];
    for (let i = 0; i < firstW; i++) cells.push({ events: [] });
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      cells.push({
        date,
        events: schedules.filter((ev) => {
          const sd = ev.startTime.slice(0, 10);
          return sd === date.toISOString().slice(0, 10);
        }),
      });
    }
    while (cells.length % 7 !== 0) cells.push({ events: [] });
    return { y, m, cells };
  }, [cursor, schedules]);

  const capacityData = useMemo(() => {
    return schedules.slice(0, 8).map((ev) => ({
      n: pickML(ev.title, language).slice(0, 8),
      已售: ev.soldSeats,
      剩余: Math.max(0, ev.totalSeats - ev.soldSeats),
    }));
  }, [schedules, language]);

  const regionPie = useMemo(() => {
    const m: Record<string, number> = {};
    for (const ev of schedules) { m[ev.region] = (m[ev.region] || 0) + ev.soldSeats; }
    return Object.entries(m).map(([k, v]) => ({
      name: language === 'zh' ? REGION_LABEL[k as any].zh : REGION_LABEL[k as any].en,
      value: v,
      color: hashColor(k),
    }));
  }, [schedules, language]);

  const totalSell = schedules.reduce((a, b) => a + b.soldSeats, 0);
  const totalCap = schedules.reduce((a, b) => a + b.totalSeats, 0);

  const t = {
    zh: {
      title: '排期与验票',
      sub: '全球演出日历 · 线下核验终端 · 余票与容量监控',
      today: '回到今天',
      sel: '选中日期',
      noEv: '当天无演出',
      capacity: 'Top 演出容量分布',
      region: '区域市场出票占比',
      terminals: '核验终端在线',
      allTerminals: '全部终端',
    },
    en: {
      title: 'Schedule & Verify',
      sub: 'Global event calendar · Offline verify terminals · Remaining seats monitor',
      today: 'Today',
      sel: 'Selected date',
      noEv: 'No performances on this day',
      capacity: 'Top capacity breakdown',
      region: 'Regional ticket share',
      terminals: 'Verify Terminals Online',
      allTerminals: 'All terminals',
    },
    ja: { title: '日程・検証', sub: 'グローバル公演カレンダー・端末・残席モニタ', today: '今日へ', sel: '選択日', noEv: '公演なし', capacity: '上位公演キャパシティ', region: '地域別売上シェア', terminals: '検証端末オンライン', allTerminals: '全端末' },
    ko: { title: '일정 / 검증', sub: '글로벌 공연 캘린더 · 검증 단말 · 잔여석 모니터', today: '오늘', sel: '선택된 날짜', noEv: '공연 없음', capacity: '상위 공연 수용능력', region: '지역별 판매 점유율', terminals: '검증 단말 온라인', allTerminals: '전체 단말' },
  }[language] ?? ({ zh: {} as any }).zh;

  const wk = language === 'ja' || language === 'zh' ? WK_ZH : WK_EN;
  const today = new Date();

  return (
    <div className="space-y-5">
      <section className="card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow"><CalendarDays className="inline w-3.5 h-3.5 mr-1" />Schedule</p>
            <h1 className="font-display font-black text-3xl md:text-4xl">{t.title}</h1>
            <p className="text-white/55 text-sm mt-1">{t.sub}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[360px]">
            <Kpi icon={<CalendarDays className="w-4 h-4" />} value={schedules.length} label={language === 'zh' ? '本月演出' : 'Events this month'} color="text-neon-pink" />
            <Kpi icon={<TicketIcon className="w-4 h-4" />} value={totalSell.toLocaleString()} label={language === 'zh' ? '已出票' : 'Tickets issued'} color="text-neon-amber" />
            <Kpi icon={<Radar className="w-4 h-4" />} value={`${totalCap ? Math.round((totalSell / totalCap) * 100) : 0}%`} label={language === 'zh' ? '本月上座率' : 'Occupancy'} color="text-neon-teal" />
          </div>
        </div>
      </section>

      <div className="grid xl:grid-cols-[1.5fr_1fr] gap-5">
        {/* 日历 */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setCursor(new Date(monthInfo.y, monthInfo.m - 1, 1))}
                className="btn-ghost !p-2"><ChevronLeft className="w-4 h-4" /></button>
              <h2 className="font-display font-bold text-xl min-w-[180px] text-center">
                {monthInfo.y}.{String(monthInfo.m + 1).padStart(2, '0')}
              </h2>
              <button onClick={() => setCursor(new Date(monthInfo.y, monthInfo.m + 1, 1))}
                className="btn-ghost !p-2"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
                className="btn-ghost !py-1.5 !px-3 !text-xs">
                <RefreshCw className="w-3 h-3 mr-1" /> {t.today}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-[11px] uppercase tracking-widest text-white/40 mb-2">
            {wk.map((d, i) => (
              <div key={d} className={classNames('py-2 text-center', i === 0 || i === 6 ? 'text-neon-pink/70' : '')}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthInfo.cells.map((c, i) => {
              const isToday = c.date && c.date.toDateString() === today.toDateString();
              const has = c.events.length > 0;
              return (
                <div
                  key={i}
                  onClick={() => has && setSel(c.events[0])}
                  className={classNames(
                    'min-h-[92px] p-2 rounded-xl border transition-all',
                    c.date ? 'cursor-pointer' : 'opacity-40 pointer-events-none',
                    has ? 'border-neon-pink/20 bg-white/[0.04] hover:bg-neon-pink/5 hover:border-neon-pink/40' : 'border-white/5 bg-white/[0.02]',
                    isToday ? 'ring-2 ring-neon-amber/50' : '',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={classNames(
                      'text-xs font-bold',
                      isToday ? 'text-neon-amber' : 'text-white/70',
                    )}>{c.date?.getDate() || ''}</span>
                    {has && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-pink/15 text-neon-pink font-semibold">{c.events.length}</span>}
                  </div>
                  {c.events.slice(0, 2).map((ev) => {
                    const region = REGION_LABEL[ev.region];
                    return (
                      <div key={ev.id} className="mt-1 rounded-lg bg-white/[0.04] border border-white/10 p-1.5 hover:bg-white/10">
                        <div className="text-[10px] truncate font-medium leading-tight">{pickML(ev.title, language)}</div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[9px] text-white/40 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{ev.startTime.slice(11, 16)}</span>
                          <span className={classNames('text-[9px]', region.color)}>
                            {language === 'zh' ? region.zh : region.en}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {c.events.length > 2 && (
                    <div className="text-[9px] text-white/40 mt-1 text-center">+{c.events.length - 2} {language === 'zh' ? '场演出' : 'more'}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 右侧：选中演出详情 / 图表 */}
        <div className="space-y-5">
          <section className="card p-5">
            <div className="section-head">
              <div>
                <p className="section-eyebrow">{t.sel}</p>
                <h2 className="font-display font-bold text-xl">
                  {sel ? pickML(sel.title, language) : (language === 'zh' ? '点击日历查看详情' : 'Click a date for details')}
                </h2>
              </div>
            </div>
            {sel ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
                  <span className="text-4xl">{sel.poster}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{pickML(sel.title, language)}</div>
                    <div className="text-xs text-white/50 flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{pickML(sel.venueName, language)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{sel.totalSeats.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat icon={<TicketIcon className="w-3 h-3 text-neon-amber" />} value={sel.soldSeats.toLocaleString()} label={language === 'zh' ? '已售' : 'Sold'} />
                  <MiniStat icon={<Users className="w-3 h-3 text-neon-teal" />} value={(sel.totalSeats - sel.soldSeats).toLocaleString()} label={language === 'zh' ? '剩余' : 'Left'} />
                  <MiniStat icon={<Flame className="w-3 h-3 text-neon-pink" />} value={`${sel.hotIndex}`} label={language === 'zh' ? '热度' : 'Heat'} />
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${(sel.soldSeats / Math.max(1, sel.totalSeats)) * 100}%`,
                    background: 'linear-gradient(90deg,#FF2E88,#F5B544,#2DD4BF)',
                  }} />
                </div>
                <div className="text-[11px] text-white/40 flex justify-between">
                  <span>{language === 'zh' ? '上座率' : 'Occupancy'} {Math.round((sel.soldSeats / Math.max(1, sel.totalSeats)) * 100)}%</span>
                  <span>{fmtDate(sel.startTime)} {sel.startTime.slice(11, 16)}</span>
                </div>
              </div>
            ) : (
              <div className="h-40 grid place-items-center text-white/40 text-sm">
                {loading ? 'Loading...' : t.noEv}
              </div>
            )}
          </section>

          <section className="card p-5">
            <div className="section-head">
              <div>
                <p className="section-eyebrow"><BarChart3 className="inline w-3.5 h-3.5 mr-1" />Capacity</p>
                <h2 className="font-display font-bold text-xl">{t.capacity}</h2>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityData} margin={{ left: 0, right: 8, top: 10, bottom: 0 }} stackOffset="expand">
                  <CartesianGrid stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="n" stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 10 }} />
                  <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff80', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 12, color: '#fff' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#ffffffa0' }} />
                  <Bar dataKey={language === 'zh' ? '已售' : 'Sold'} stackId="a" fill="#FF2E88" radius={[6, 0, 0, 6]} />
                  <Bar dataKey={language === 'zh' ? '剩余' : 'Left'} stackId="a" fill="#2DD4BF" fillOpacity={0.5} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card p-5">
            <div className="section-head">
              <div>
                <p className="section-eyebrow"><MapPin className="inline w-3.5 h-3.5 mr-1" />Region</p>
                <h2 className="font-display font-bold text-xl">{t.region}</h2>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={regionPie} dataKey="value" nameKey="name" outerRadius={80} innerRadius={52} paddingAngle={3} stroke="none">
                    {regionPie.map((_, i) => <Cell key={i} fill={regionPie[i].color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 12, color: '#fff' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#ffffffa0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>

      {/* 核验终端列表 */}
      <section className="card p-5">
        <div className="section-head">
          <div>
            <p className="section-eyebrow"><Radio className="inline w-3.5 h-3.5 mr-1" />IoT Terminals</p>
            <h2 className="font-display font-bold text-xl">{t.terminals}</h2>
            <p className="text-sm text-white/50 mt-1">{language === 'zh' ? '双向验签 · 防重放 · 日志实时回传' : 'Two-way verify · Anti-replay · Live logs'}</p>
          </div>
          <span className="cap border-white/20 text-white/70">{t.allTerminals} · {terminals.length}</span>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
          {terminals.map((tm) => (
            <div key={tm.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${tm.online ? 'bg-neon-teal shadow-[0_0_10px_#2DD4BF]' : 'bg-white/25'} animate-pulse`} />
                  <span className="font-mono text-xs text-white/70">{tm.id}</span>
                </span>
                <span className="text-[10px] text-white/40">{tm.terminalType}</span>
              </div>
              <div className="mt-3 text-sm font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neon-violet" />
                {pickML(tm.venueName, language)}
              </div>
              <div className="text-[11px] text-white/40 mt-0.5">· Gate {tm.gateNo}</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="num font-bold text-white text-sm">{tm.todayScans.toLocaleString()}</div>
                  <div className="text-[9px] text-white/40">{language === 'zh' ? '扫描' : 'Scans'}</div>
                </div>
                <div>
                  <div className="num font-bold text-neon-teal text-sm">{(tm.todayScans - tm.todayAnomalies).toLocaleString()}</div>
                  <div className="text-[9px] text-white/40">{language === 'zh' ? '通过' : 'OK'}</div>
                </div>
                <div>
                  <div className="num font-bold text-neon-pink text-sm">{tm.todayAnomalies.toLocaleString()}</div>
                  <div className="text-[9px] text-white/40">{language === 'zh' ? '异常' : 'Anom.'}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px]">
                <span className="text-white/40">{language === 'zh' ? '验签密钥：' : 'Key: '}<span className="font-mono text-white/60">{tm.signKey.slice(0, 8)}···</span></span>
                <span className="flex items-center gap-1 text-neon-teal"><ShieldCheck className="w-3 h-3" /> {language === 'zh' ? '双向' : '2-way'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon, value, label, color }: { icon: React.ReactNode; value: React.ReactNode; label: string; color: string }) {
  return (
    <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
      <div className={classNames('flex items-center gap-1.5 text-xs font-semibold', color)}>
        {icon} {label}
      </div>
      <div className="mt-1 num font-black text-2xl text-white">{value}</div>
    </div>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="p-2.5 rounded-lg border border-white/10 bg-white/[0.04]">
      <div className="flex items-center gap-1 text-[10px] text-white/50">{icon} {label}</div>
      <div className="num font-bold text-white">{value}</div>
    </div>
  );
}
