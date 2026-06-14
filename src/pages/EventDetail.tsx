import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, CalendarDays, Clock, Users, Ticket as TicketIcon, ShieldCheck, BadgeCheck,
  Languages, Banknote, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, ArrowLeft, Sparkles, CreditCard, Plane, Hotel as HotelIcon,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, BarChart, Bar, Cell,
} from 'recharts';
import { api } from '@/utils/api';
import type { EventDetail, Language, Currency, PaymentChannel } from '@/shared/types';
import { useAppStore } from '@/store/app';
import {
  CHANNEL_LABEL, CURRENCY_META, EVENT_STATUS_LABEL, EVENT_TYPE_LABEL, GRADE_LABEL, REGION_LABEL,
  classNames, fmtCny, fmtDate, fmtMoney, fmtRelative, pickML, hashColor,
} from '@/utils/meta';

export default function EventDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { language, currency, setCurrency, setLanguage } = useAppStore();
  const [ev, setEv] = useState<EventDetail | null>(null);
  const [pricing, setPricing] = useState<{ tierId: string; grade: string; ticks: any[] }[]>([]);
  const [tierId, setTierId] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [pay, setPay] = useState<PaymentChannel>('ALIPAY_PLUS');
  const [orderResult, setOrderResult] = useState<{ id: string; cryptoTag: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get<EventDetail>(`/api/events/${id}`),
      api.get<any[]>(`/api/events/${id}/pricing`),
    ]).then(([d, p]) => {
      setEv(d);
      setPricing(p);
      setTierId(p[0]?.tierId || '');
      setSelectedTier(d.tiers[0]?.id ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const priceChartData = useMemo(() => {
    const t = pricing.find((x) => x.tierId === tierId);
    if (!t) return [] as any[];
    return t.ticks.map((tk) => ({
      t: tk.ts.slice(5, 13),
      price: tk.price,
      remaining: tk.remaining,
      heat: tk.heat,
    }));
  }, [pricing, tierId]);

  const selected = selectedTier ? ev?.tiers.find((t) => t.id === selectedTier) : null;

  const doOrder = async () => {
    if (!selected || !ev) return;
    try {
      const r = await api.post<{ id: string; cryptoTag: string }>('/api/orders', {
        eventId: ev.id, tierId: selected.id, quantity: qty, currency, channel: pay,
      });
      setOrderResult(r);
      setToast(language === 'zh' ? '下单成功！已绑定唯一加密串 ✓' : 'Order placed! Crypto-tag bound ✓');
      setTimeout(() => setToast(null), 3500);
    } catch (e: any) {
      setToast(e.message);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const t = {
    zh: {
      back: '返回演出列表',
      multiLang: '多语言介绍',
      notice: '购票须知',
      price: '票档与定价',
      pay: '跨境支付方式',
      buy: '立即购票',
      curConv: '当前币种换算',
      hot: '热度',
      remaining: '剩余率',
      dynamics: '票价动态曲线',
      artists: '出演艺人',
      organizer: '主办方',
      venue: '场馆信息',
      crypto: '加密串与验签',
      guarantee: '异地无忧保障',
      guaranteeDesc: '如演出取消或出票失败，平台自动赔付机票与酒店费用。',
      tagline: '每张票绑定唯一加密串 · 线下终端双向验签 · 溯源有据可查',
    },
    en: {
      back: 'Back to events',
      multiLang: 'Multi-Language Info',
      notice: 'Notice',
      price: 'Ticket Tiers & Dynamic Pricing',
      pay: 'Cross-border Payment',
      buy: 'Buy Tickets',
      curConv: 'Currency Converted',
      hot: 'Heat Index',
      remaining: 'Remaining %',
      dynamics: 'Price Dynamics',
      artists: 'Artists',
      organizer: 'Organizer',
      venue: 'Venue',
      crypto: 'Crypto-tag & Verification',
      guarantee: 'Cross-city Guarantee',
      guaranteeDesc: 'Automated flight + hotel compensation if event is canceled or ticket issues occur.',
      tagline: 'Unique crypto-tag per ticket · Two-way terminal verification · Fully traceable.',
    },
    ja: { back: '公演一覧へ', multiLang: '多言語紹介', notice: '購入注意', price: '席種・動的価格', pay: '越境決済', buy: '購入する', curConv: '通貨換算', hot: '人気度', remaining: '残り率', dynamics: '価格推移', artists: '出演者', organizer: '主催', venue: '会場', crypto: '暗号タグ・検証', guarantee: '異都市保証', guaranteeDesc: '公演中止の場合、航空券・宿泊代を自動補償。', tagline: 'チケット毎に一意な暗号タグ・双方向検証・完全トレーサブル' },
    ko: { back: '공연 목록', multiLang: '다국어 소개', notice: '유의사항', price: '등급 / 동적가격', pay: '크로스보더 결제', buy: '구매하기', curConv: '통화 환산', hot: '인기도', remaining: '잔여율', dynamics: '가격 동향', artists: '아티스트', organizer: '주최측', venue: '장소', crypto: '암호태그 검증', guarantee: '타도시 보장', guaranteeDesc: '공연 취소 시 항공권/호텔 자동 보상', tagline: '티켓별 유일 암호태그 · 양방향 검증 · 완전 추적 가능' },
  }[language] ?? ({ zh: {} as any }).zh;

  if (loading) return <div className="card h-[500px] animate-pulse" />;
  if (!ev) return <div className="card p-10 text-center text-white/50">{language === 'zh' ? '未找到演出。' : 'Event not found.'}</div>;

  const status = EVENT_STATUS_LABEL[ev.status];
  const region = REGION_LABEL[ev.region];
  const tp = EVENT_TYPE_LABEL[ev.type];

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed top-24 right-6 z-50 card p-4 border-neon-pink/40 shadow-glow max-w-sm animate-float">
          {toast}
        </div>
      )}

      <button onClick={() => nav(-1)} className="btn-ghost !py-2 !px-3 !text-sm">
        <ArrowLeft className="w-4 h-4" /> {t.back}
      </button>

      {/* 头部海报横幅 */}
      <section className="relative card overflow-hidden star-noise">
        <div className="relative h-56 md:h-72 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,46,136,0.45), rgba(139,92,246,0.3) 40%, rgba(45,212,191,0.3) 80%), radial-gradient(circle at 20% 30%, rgba(245,181,68,0.35), transparent 55%), #0B1A3A',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-grid-fade pointer-events-none" />
          <div className="absolute inset-x-0 top-0 flex justify-around pointer-events-none opacity-50 h-40">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="w-14 h-full origin-top animate-beam"
                style={{
                  background: `linear-gradient(180deg, ${['#FF2E88', '#F5B544', '#8B5CF6', '#2DD4BF', '#60A5FA', '#F472B6'][i]}55, transparent)`,
                  transform: `rotate(${(i - 2.5) * 5}deg)`, animationDelay: `${i * 0.25}s`,
                }}
              />
            ))}
          </div>
          <div className="absolute left-6 md:left-10 bottom-6 right-6 md:right-10 flex items-end gap-6 flex-wrap">
            <div className="text-7xl md:text-8xl drop-shadow-2xl">{ev.poster}</div>
            <div className="flex-1 min-w-[280px]">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={classNames('chip border', region.color, 'bg-ink-900/60')}>{language === 'zh' ? region.zh : region.en}</span>
                <span className="chip border-white/10 bg-ink-900/60 text-white/80">{tp.icon} {language === 'zh' ? tp.zh : tp.en}</span>
                <span className={classNames('chip border', status.cls)}>{language === 'zh' ? status.zh : status.en}</span>
                <span className="chip border-neon-amber/30 bg-ink-900/60 text-neon-amber flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> HOT #{Math.max(1, Math.round(100 - ev.hotIndex / 2))}
                </span>
              </div>
              <h1 className="font-display font-black text-3xl md:text-5xl leading-tight">
                {pickML(ev.title, language)}
              </h1>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-neon-violet" /> {fmtDate(ev.startTime)}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-neon-violet" /> {ev.startTime.slice(11, 16)}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-neon-teal" /> {pickML(ev.venueName, language)} · {pickML(ev.city, language)}</span>
                <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4 text-neon-pink" /> {language === 'zh' ? `主办方 · ${pickML(ev.organizerName, language)}` : `Organizer · ${pickML(ev.organizerName, language)}`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 多语言切换条 */}
        <div className="border-t border-white/10 p-4 md:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="cap border-white/20 text-white/70"><Languages className="w-3.5 h-3.5" /> {t.multiLang}</span>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
              {ev.languages.map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l as Language)}
                  className={classNames(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                    language === l ? 'bg-neon-teal/20 text-neon-teal' : 'text-white/60 hover:text-white',
                  )}
                >{({ zh: '中文', en: 'EN', ja: '日本語', ko: '한국어' } as any)[l]}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="cap border-white/20 text-white/70"><Banknote className="w-3.5 h-3.5" /> {t.curConv}</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="select !w-auto !py-1.5 text-xs">
              {ev.currencies.map((c) => (
                <option key={c} value={c}>{CURRENCY_META[c].sym} {c} · {CURRENCY_META[c].name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <div className="space-y-5">
          {/* 艺人卡 */}
          <section className="card p-5">
            <div className="section-head">
              <div>
                <p className="section-eyebrow">Artists</p>
                <h2 className="font-display font-bold text-xl">{t.artists}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ev.artistNames.map((n, i) => {
                const c = hashColor(pickML(n, language));
                return (
                  <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/[0.03] text-center">
                    <div className="w-16 h-16 rounded-2xl grid place-items-center mx-auto text-2xl font-bold text-white shadow-md mb-3"
                      style={{ background: `linear-gradient(135deg, ${c}, #0B1A3A)` }}>
                      {pickML(n, language).slice(0, 1)}
                    </div>
                    <div className="font-semibold truncate">{pickML(n, language)}</div>
                    <div className="text-[11px] text-white/40 mt-1">
                      {language === 'zh' ? `热搜指数 ${ev.hotIndex}` : `Heat ${ev.hotIndex}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 介绍 / 须知 */}
          <section className="grid md:grid-cols-2 gap-5">
            <InfoCard title={t.multiLang} icon={<Languages className="w-4 h-4 text-neon-teal" />} body={pickML(ev.description, language)} />
            <InfoCard title={t.notice} icon={<ShieldCheck className="w-4 h-4 text-neon-amber" />} body={pickML(ev.notice, language)} warning />
          </section>

          {/* 动态定价曲线 */}
          <section className="card p-5">
            <div className="section-head">
              <div>
                <p className="section-eyebrow"><TrendingUp className="inline w-3.5 h-3.5 mr-1" />Dynamic Pricing Engine</p>
                <h2 className="font-display font-bold text-xl">{t.dynamics}</h2>
                <p className="text-sm text-white/50 mt-1">
                  {language === 'zh' ? '选定票档：热度 × 余票 → 实时价格' : 'Selected tier: Heat × Remaining → Real-time price'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pricing.map((p) => (
                  <button
                    key={p.tierId}
                    onClick={() => setTierId(p.tierId)}
                    className={classNames(
                      'chip text-xs border transition-all',
                      tierId === p.tierId
                        ? 'bg-neon-pink/20 text-neon-pink border-neon-pink/40'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10',
                    )}
                  >{p.grade} {GRADE_LABEL[(p.grade || 'VIP') as any]?.zh ? '· ' + GRADE_LABEL[(p.grade || 'VIP') as any].zh : ''}</button>
                ))}
              </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceChartData} margin={{ left: 8, right: 16, top: 10, bottom: 8 }}>
                    <defs>
                      <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF2E88" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="t" stroke="#ffffff55" tick={{ fill: '#ffffff99', fontSize: 10 }} />
                    <YAxis stroke="#ffffff55" tick={{ fill: '#ffffff99', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 12, color: '#fff' }} cursor={{ stroke: '#ffffff30' }} />
                    <Area type="monotone" dataKey="price" stroke="#FF2E88" strokeWidth={2} fill="url(#gP)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceChartData} margin={{ left: 8, right: 12, top: 10, bottom: 8 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="t" stroke="#ffffff55" tick={{ fill: '#ffffff99', fontSize: 10 }} />
                    <YAxis stroke="#ffffff55" tick={{ fill: '#ffffff99', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#111F4A', border: '1px solid #ffffff20', borderRadius: 12, color: '#fff' }} />
                    <Line type="monotone" dataKey="heat" stroke="#F5B544" strokeWidth={2} dot={false} name={t.hot} />
                    <Line type="monotone" dataKey="remaining" stroke="#2DD4BF" strokeWidth={2} dot={false} strokeDasharray="4 4" name={t.remaining} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* 异地无忧保障 */}
          <section className="card p-5 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-teal-500/[0.04]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl grid place-items-center bg-emerald-500/15 border border-emerald-500/30 shrink-0">
                <BadgeCheck className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="flex-1">
                <h2 className="font-display font-bold text-xl text-emerald-300">{t.guarantee}</h2>
                <p className="text-sm text-white/60 mt-1">{t.guaranteeDesc}</p>
                <div className="mt-3 grid md:grid-cols-3 gap-3">
                  {[
                    { icon: Plane, title: language === 'zh' ? '机票赔付上限 ¥4,000' : 'Flight up to ¥4,000', c: 'from-sky-500 to-indigo-500' },
                    { icon: HotelIcon, title: language === 'zh' ? '酒店赔付上限 ¥2,500' : 'Hotel up to ¥2,500', c: 'from-rose-500 to-amber-500' },
                    { icon: CheckCircle2, title: language === 'zh' ? '自动触发 30 分钟到账' : 'Auto trigger, paid in 30m', c: 'from-emerald-500 to-teal-500' },
                  ].map(({ icon: I, title, c }, i) => (
                    <div key={i} className="p-3 rounded-xl border border-white/10 bg-white/5 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg grid place-items-center bg-gradient-to-br ${c}`}>
                        <I className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div className="text-sm font-semibold">{title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 右侧：票档 + 支付 + 加密串 */}
        <div className="space-y-5">
          <section className="card p-5 sticky top-24">
            <div className="section-head">
              <div>
                <p className="section-eyebrow"><TicketIcon className="inline w-3.5 h-3.5 mr-1" />Ticket Tiers</p>
                <h2 className="font-display font-bold text-xl">{t.price}</h2>
              </div>
            </div>
            <div className="space-y-2.5">
              {ev.tiers.map((tier) => {
                const active = selectedTier === tier.id;
                const remainPct = Math.round((1 - tier.soldSeats / tier.totalSeats) * 100);
                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={classNames(
                      'w-full rounded-2xl p-4 border text-left transition-all',
                      active
                        ? 'border-neon-pink/60 bg-neon-pink/5 shadow-glow'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${GRADE_LABEL[tier.grade as any]?.cls || 'from-neon-pink to-violet-500'} text-white grid place-items-center font-black text-sm shadow-md shrink-0`}>
                          {tier.grade}
                        </div>
                        <div>
                          <div className="font-semibold">{tier.grade === 'VIP' ? 'VIP 尊享内场' : `${GRADE_LABEL[tier.grade as any]?.zh || tier.grade + ' 区'}`}</div>
                          <div className="text-[11px] text-white/50 mt-0.5">
                            {language === 'zh' ? `已售 ${tier.soldSeats.toLocaleString()} / ${tier.totalSeats.toLocaleString()}` : `Sold ${tier.soldSeats}/${tier.totalSeats}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="num font-black text-xl text-white">{fmtMoney(tier.currentPrice, currency)}</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <span className="text-[10px] text-white/40 line-through">{fmtMoney(tier.basePrice, currency)}</span>
                          <DeltaMini pct={tier.deltaPct} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${100 - remainPct}%`,
                          background: `linear-gradient(90deg, ${['#FF2E88', '#F5B544', '#8B5CF6', '#2DD4BF'][['VIP', 'A', 'B', 'C'].indexOf(tier.grade) % 4]}, #8B5CF6)`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-white/45">
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-neon-amber" /> 热度 {tier.hotIndex}</span>
                      <span className="flex items-center gap-1"><TicketIcon className="w-3 h-3 text-neon-teal" /> 剩余 {remainPct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 数量 */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <div className="label">数量</div>
                <div className="flex items-center gap-2 select !p-0 h-[42px]">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 h-full text-white/70 hover:text-white">−</button>
                  <div className="flex-1 text-center num font-bold">{qty}</div>
                  <button onClick={() => setQty(Math.min(8, qty + 1))} className="px-3 h-full text-white/70 hover:text-white">+</button>
                </div>
              </div>
              <div>
                <div className="label">合计</div>
                <div className="num font-black text-xl text-neon-amber">
                  {selected ? fmtMoney(selected.currentPrice * qty, currency) : '—'}
                </div>
              </div>
            </div>

            {/* 支付通道 */}
            <div className="mt-5">
              <div className="label flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> {t.pay}</div>
              <div className="grid grid-cols-2 gap-2">
                {(['ALIPAY_PLUS', 'VISA', 'MASTERCARD', 'LINEPAY', 'PAYME', 'GCASH'] as PaymentChannel[]).map((c) => {
                  const info = CHANNEL_LABEL[c];
                  return (
                    <button
                      key={c}
                      onClick={() => setPay(c)}
                      className={classNames(
                        'rounded-xl border p-3 flex items-center gap-2 text-sm text-left transition-all',
                        pay === c ? 'border-neon-pink/50 bg-neon-pink/10 shadow-glow' : 'border-white/10 bg-white/[0.03] hover:bg-white/5',
                      )}
                    >
                      <span className="w-8 h-8 rounded-lg grid place-items-center text-xs border">{info.logo}</span>
                      <span className="font-semibold">{info.zh.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={doOrder}
              disabled={!selected || ev.status === 'ended'}
              className="btn-primary w-full mt-5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" /> {t.buy}
            </button>

            {orderResult && (
              <div className="mt-4 p-4 rounded-2xl border border-neon-teal/30 bg-neon-teal/5 space-y-2">
                <div className="flex items-center gap-2 text-neon-teal font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> {language === 'zh' ? '下单成功 · 已绑定唯一加密串' : 'Order placed · Crypto-tag bound'}
                </div>
                <div className="space-y-1.5 font-mono text-[11px] break-all">
                  <div><span className="text-white/40">订单：</span><span className="text-white">{orderResult.id}</span></div>
                  <div><span className="text-white/40">加密串：</span><span className="text-neon-amber">{orderResult.cryptoTag}</span></div>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed">{t.tagline}</p>
              </div>
            )}

            <div className="mt-4 flex items-start gap-2 text-[11px] text-white/50">
              <AlertTriangle className="w-3.5 h-3.5 text-neon-amber shrink-0 mt-0.5" />
              <span>{language === 'zh' ? '请妥善保管加密串，入场时将进行终端双向验签。重复使用将自动触发假票溯源工单。' : 'Keep the crypto-tag safe. Two-way verification at entrance. Re-use triggers fake-ticket tracing.'}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, icon, body, warning }: { title: string; icon: React.ReactNode; body: string; warning?: boolean }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="cap border-white/20">{icon} {title}</span>
      </div>
      <p className={classNames('text-sm leading-relaxed whitespace-pre-line', warning ? 'text-amber-200/90' : 'text-white/75')}>{body || '—'}</p>
    </div>
  );
}

function DeltaMini({ pct }: { pct: number }) {
  const up = pct > 1; const flat = Math.abs(pct) <= 1;
  return (
    <span className={classNames(
      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold',
      flat ? 'bg-white/5 text-white/60' : up ? 'bg-neon-pink/15 text-neon-pink' : 'bg-neon-teal/15 text-neon-teal',
    )}>
      {flat ? <Minus className="w-3 h-3" /> : up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}
