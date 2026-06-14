import { useEffect, useState } from 'react';
import {
  UserRound, Wallet as WalletIcon, ShieldCheck, Plane, Hotel as HotelIcon,
  Ticket as TicketIcon, Languages, Banknote, LogOut, QrCode, FileCheck, BadgeCheck, AlertTriangle,
} from 'lucide-react';
import type { Profile, Wallet } from '@/shared/types';
import { api } from '@/utils/api';
import { useAppStore } from '@/store/app';
import { CURRENCY_META, LANGUAGE_META, classNames, fmtCny, fmtMoney } from '@/utils/meta';

export default function ProfileCenter() {
  const { language, currency, setCurrency, setLanguage } = useAppStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [tab, setTab] = useState<'tickets' | 'wallet' | 'claims' | 'prefs'>('tickets');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get<Profile>('/api/profile'), api.get<Wallet>('/profile/wallet')]).then(([p, w]) => {
      setProfile(p); setWallet(w); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const t = {
    zh: {
      hello: '你好',
      sub: '星程会员 · 全球观演无忧',
      tickets: '我的票夹',
      wallet: '多币种钱包',
      claims: '赔付与申诉',
      prefs: '偏好设置',
      level: '会员等级',
      points: '积分',
      totalSpend: '累计消费',
      empty: '暂无记录',
    },
    en: {
      hello: 'Welcome back',
      sub: 'StarPass Member · Worry-free global attendance',
      tickets: 'My Tickets',
      wallet: 'Multi-currency Wallet',
      claims: 'Compensation',
      prefs: 'Preferences',
      level: 'Level',
      points: 'Points',
      totalSpend: 'Total spend',
      empty: 'Nothing yet',
    },
    ja: { hello: 'おかえりなさい', sub: 'StarPass会員・グローバル安心観戦', tickets: 'マイチケット', wallet: '多通貨ウォレット', claims: '補償・申し立て', prefs: '設定', level: 'レベル', points: 'ポイント', totalSpend: '累計消費', empty: 'まだありません' },
    ko: { hello: '돌아오신 것을 환영합니다', sub: 'StarPass 멤버 · 글로벌 안심 관람', tickets: '내 티켓', wallet: '다중 통화 지갑', claims: '보상 / 이의제기', prefs: '설정', level: '등급', points: '포인트', totalSpend: '누적 소비', empty: '내역 없음' },
  }[language] ?? ({ zh: {} as any }).zh;

  return (
    <div className="space-y-5">
      <section className="card p-6 relative overflow-hidden star-noise">
        <div className="absolute right-[-100px] top-[-100px] w-80 h-80 rounded-full bg-gradient-to-br from-neon-pink/30 via-neon-violet/30 to-neon-amber/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-pink via-neon-violet to-neon-amber grid place-items-center text-3xl font-black text-white shadow-glow">
            {profile?.displayName?.[0] || '★'}
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm text-white/60">{t.hello}</p>
            <h1 className="font-display font-black text-2xl md:text-3xl text-white">{profile?.displayName || '—'}</h1>
            <p className="text-white/55 text-sm mt-0.5">{t.sub} · {profile?.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="cap border-neon-amber/40 text-neon-amber"><BadgeCheck className="w-3.5 h-3.5" /> {t.level} · {profile?.memberLevel?.toUpperCase()}</span>
              <span className="cap border-neon-pink/40 text-neon-pink"><TicketIcon className="w-3.5 h-3.5" /> {t.points} {profile?.memberPoints?.toLocaleString()}</span>
              <span className="cap border-neon-teal/40 text-neon-teal"><WalletIcon className="w-3.5 h-3.5" /> {t.totalSpend} ¥{fmtCny(profile?.totalSpent || 0)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tab active={tab === 'tickets'} onClick={() => setTab('tickets')}><TicketIcon className="w-4 h-4" />{t.tickets}</Tab>
            <Tab active={tab === 'wallet'} onClick={() => setTab('wallet')}><WalletIcon className="w-4 h-4" />{t.wallet}</Tab>
            <Tab active={tab === 'claims'} onClick={() => setTab('claims')}><AlertTriangle className="w-4 h-4" />{t.claims}</Tab>
            <Tab active={tab === 'prefs'} onClick={() => setTab('prefs')}><Languages className="w-4 h-4" />{t.prefs}</Tab>
          </div>
        </div>
      </section>

      {loading ? <div className="card h-96 animate-pulse" /> : null}

      {tab === 'tickets' && !loading && (
        <section className="space-y-4">
          <div className="card p-5">
            <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><TicketIcon className="w-5 h-5 text-neon-amber" />{t.tickets}</h2>
            {!profile?.tickets?.length ? <Empty t={t} /> : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {profile.tickets.map((tk) => (
                  <div key={tk.id} className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-neon-pink/[0.08] via-ink-900 to-neon-violet/[0.08] hover:shadow-glow transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <span className="cap border-neon-pink/40 text-neon-pink">{tk.status}</span>
                        <span className="text-4xl">{tk.eventPoster}</span>
                      </div>
                      <h3 className="font-display font-bold text-lg mt-3 leading-tight">{tk.eventTitle}</h3>
                      <p className="text-xs text-white/50 mt-1">{tk.venue} · {tk.time}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="chip bg-neon-amber/10 text-neon-amber border border-neon-amber/30">{tk.tierGrade}</span>
                        <span className="num font-bold">Sect {tk.section} · Row {tk.row} · Seat {tk.seat}</span>
                      </div>
                    </div>
                    <div className="border-t-2 border-dashed border-white/10 px-5 py-4 flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-xl bg-white grid place-items-center overflow-hidden">
                          <QrCode className="w-16 h-16 text-black" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">{language === 'zh' ? '唯一加密串' : 'Crypto-tag'}</div>
                        <div className="font-mono text-[11px] break-all text-neon-teal mt-0.5 leading-snug">{tk.cryptoTag}</div>
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-neon-amber">
                          <ShieldCheck className="w-3 h-3" />
                          {language === 'zh' ? '线下终端双向验签' : 'Two-way terminal verify'}
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/30 px-5 py-2 text-[10px] text-white/40 font-mono flex items-center justify-between">
                      <span>TK.{tk.id.slice(-6).toUpperCase()}</span>
                      <span>{tk.issueTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'wallet' && !loading && wallet && (
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
          <section className="card p-5">
            <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><WalletIcon className="w-5 h-5 text-neon-teal" />{t.wallet}</h2>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-neon-teal/15 via-neon-violet/10 to-neon-pink/15 border border-white/10">
              <div className="flex items-start justify-between">
                <span className="cap border-white/20 text-white/70">{language === 'zh' ? '多币种余额' : 'Balances'}</span>
                <span className="text-xs text-white/40 font-mono">{wallet.walletId}</span>
              </div>
              <div className="mt-4 space-y-3">
                {wallet.balances.map((b) => (
                  <div key={b.currency} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${CURRENCY_META[b.currency as any]?.cls || 'from-indigo-500 to-purple-500'} grid place-items-center text-xs font-black text-white`}>
                        {CURRENCY_META[b.currency as any]?.sym || '$'}
                      </div>
                      <div>
                        <div className="font-semibold">{b.currency}</div>
                        <div className="text-[11px] text-white/45">{CURRENCY_META[b.currency as any]?.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num font-black text-xl text-white">{fmtMoney(b.amount, b.currency as any)}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">≈ ¥{fmtCny(b.cnyEquivalent)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {wallet.tx.map((tx, i) => (
                <div key={i} className="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                  <div className={classNames('text-[10px] font-semibold uppercase tracking-wider',
                    tx.type === 'deposit' ? 'text-neon-teal' : tx.type === 'withdraw' ? 'text-warn' : 'text-white/60')}>{tx.type}</div>
                  <div className="num font-bold text-sm mt-1" style={{ color: tx.positive ? '#F5B544' : '#FF2E88' }}>
                    {tx.positive ? '+' : '−'}{fmtMoney(Math.abs(tx.amount), tx.currency as any)}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">{tx.date.slice(0, 10)}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="card p-5">
            <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><Banknote className="w-5 h-5 text-neon-amber" />
              {language === 'zh' ? '交易流水' : 'Transactions'}
            </h2>
            <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
              {wallet.tx.concat(wallet.tx.slice().reverse()).map((tx, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 p-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className={classNames('w-10 h-10 rounded-xl grid place-items-center shrink-0',
                    tx.type === 'deposit' ? 'bg-neon-teal/15 text-neon-teal' :
                      tx.type === 'withdraw' ? 'bg-warn/15 text-warn' : 'bg-neon-pink/15 text-neon-pink')}>
                    {tx.type === 'deposit' ? <Banknote className="w-4 h-4" /> : tx.type === 'withdraw' ? <WalletIcon className="w-4 h-4" /> : <TicketIcon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{tx.desc}</div>
                    <div className="text-[11px] text-white/40 mt-0.5">{tx.date} · {tx.channel}</div>
                  </div>
                  <span className="num font-bold text-sm" style={{ color: tx.positive ? '#F5B544' : '#FF2E88' }}>
                    {tx.positive ? '+' : '−'}{fmtMoney(Math.abs(tx.amount), tx.currency as any)}
                  </span>
                  <span className="text-[11px] text-white/40 font-mono min-w-[70px] text-right">{tx.txId?.slice(-6) || '—'}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'claims' && !loading && profile && (
        <section className="card p-5">
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warn" />{t.claims}</h2>
          {!profile?.claims?.length ? <Empty t={t} /> : (
            <div className="space-y-3">
              {profile.claims.map((c, i) => (
                <div key={i} className="p-5 rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className={classNames('cap', c.status === 'paid' ? 'border-neon-teal/40 text-neon-teal' : c.status === 'approved' ? 'border-neon-amber/40 text-neon-amber' : 'border-white/20 text-white/60')}>
                        {c.status === 'paid' ? <FileCheck className="w-3 h-3 mr-1" /> : c.status === 'approved' ? <BadgeCheck className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                        {c.status.toUpperCase()}
                      </span>
                      <h3 className="font-display font-bold text-lg mt-2">{c.reason}</h3>
                      <p className="text-sm text-white/55 mt-1">{language === 'zh' ? `关联演出：${c.eventName}` : `For: ${c.eventName}`}</p>
                    </div>
                    <div className="text-right">
                      <div className="num font-black text-2xl text-neon-amber">¥{fmtCny(c.amount)}</div>
                      <div className="text-[11px] text-white/40 mt-1">{c.createdAt.slice(0, 10)}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/15 grid place-items-center text-sky-400"><Plane className="w-5 h-5" /></div>
                      <div>
                        <div className="text-[11px] text-white/40">{language === 'zh' ? '机票赔付' : 'Flight'}</div>
                        <div className="num font-bold text-sm text-sky-300">¥{fmtCny(c.flightAmount)}</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/15 grid place-items-center text-rose-400"><HotelIcon className="w-5 h-5" /></div>
                      <div>
                        <div className="text-[11px] text-white/40">{language === 'zh' ? '酒店赔付' : 'Hotel'}</div>
                        <div className="num font-bold text-sm text-rose-300">¥{fmtCny(c.hotelAmount)}</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 grid place-items-center text-emerald-400"><FileCheck className="w-5 h-5" /></div>
                      <div>
                        <div className="text-[11px] text-white/40">{language === 'zh' ? '其他补偿' : 'Other'}</div>
                        <div className="num font-bold text-sm text-emerald-300">¥{fmtCny(c.amount - c.flightAmount - c.hotelAmount)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'prefs' && !loading && (
        <div className="grid lg:grid-cols-2 gap-5">
          <section className="card p-5">
            <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><Languages className="w-5 h-5 text-neon-teal" />{language === 'zh' ? '语言偏好' : 'Language'}</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(LANGUAGE_META) as any[]).map(([k, v]) => (
                <button key={k} onClick={() => setLanguage(k)}
                  className={classNames(
                    'p-4 rounded-xl border text-left transition-all',
                    language === k ? 'border-neon-pink/50 bg-neon-pink/5 shadow-glow' : 'border-white/10 bg-white/[0.03] hover:bg-white/5',
                  )}>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-xl">{v.flag}</span> {v.zh}
                  </div>
                  <div className="text-xs text-white/45 mt-1">{v.native}</div>
                </button>
              ))}
            </div>
          </section>
          <section className="card p-5">
            <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><Banknote className="w-5 h-5 text-neon-amber" />{language === 'zh' ? '默认结算币种' : 'Default Currency'}</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(CURRENCY_META) as any[]).map(([k, v]) => (
                <button key={k} onClick={() => setCurrency(k)}
                  className={classNames(
                    'p-4 rounded-xl border text-left transition-all',
                    currency === k ? 'border-neon-amber/50 bg-neon-amber/5 shadow-glowT' : 'border-white/10 bg-white/[0.03] hover:bg-white/5',
                  )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${v.cls} grid place-items-center text-sm font-black text-white`}>{v.sym}</span>
                      <div className="font-semibold">{k}</div>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">fx {v.rate}</span>
                  </div>
                  <div className="text-xs text-white/45 mt-2">{v.name} · {v.region}</div>
                </button>
              ))}
            </div>
          </section>
          <section className="card p-5 lg:col-span-2">
            <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><UserRound className="w-5 h-5 text-neon-violet" />{language === 'zh' ? '账号信息' : 'Account'}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Info label={language === 'zh' ? '昵称' : 'Name'} value={profile?.displayName} />
              <Info label={language === 'zh' ? '邮箱' : 'Email'} value={profile?.email} />
              <Info label={language === 'zh' ? '手机' : 'Phone'} value={profile?.phone} />
              <Info label={language === 'zh' ? '实名认证' : 'KYC'} value={profile?.kycStatus?.toUpperCase()} ok={profile?.kycStatus === 'passed'} />
              <Info label={language === 'zh' ? '注册时间' : 'Joined'} value={profile?.joinedAt?.slice(0, 10)} />
              <button className="p-4 rounded-xl border border-red-400/20 bg-red-400/5 text-red-300 hover:bg-red-400/10 transition-colors flex items-center justify-center gap-2 font-semibold">
                <LogOut className="w-4 h-4" /> {language === 'zh' ? '退出登录' : 'Sign out'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={classNames(
      'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all',
      active ? 'bg-neon-pink/15 border-neon-pink/40 text-neon-pink shadow-glow' : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.06]',
    )}>{children}</button>
  );
}

function Info({ label, value, ok }: { label: string; value?: string; ok?: boolean }) {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="text-[11px] uppercase tracking-widest text-white/40">{label}</div>
      <div className={classNames('mt-1 font-semibold', ok ? 'text-neon-teal' : value ? 'text-white' : 'text-white/30')}>{value || '—'}</div>
    </div>
  );
}

function Empty({ t }: { t: any }) {
  return (
    <div className="p-16 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] grid place-items-center mb-3">
        <ShieldCheck className="w-8 h-8 text-white/30" />
      </div>
      <div className="text-white/40">{t.empty}</div>
    </div>
  );
}
