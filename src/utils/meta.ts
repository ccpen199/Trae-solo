import type { Currency, Language, MultiLang, Region, TicketGrade, IssueType, IssueStatus, EventType, EventStatus, PaymentChannel } from '@/shared/types';

export const FX: Record<Currency, number> = { CNY: 1, HKD: 0.92, TWD: 0.22, JPY: 0.047, KRW: 0.0054, USD: 7.18, SGD: 5.3 };

export const CURRENCY_META: Record<Currency, { sym: string; name: string; frac: number; rate: number; cls: string; region: string }> = {
  CNY: { sym: '¥', name: '人民币 (CNY)', frac: 0, rate: 1, cls: 'from-rose-500 to-red-600', region: '内地' },
  HKD: { sym: 'HK$', name: '港币 (HKD)', frac: 0, rate: 0.92, cls: 'from-red-500 to-pink-500', region: '香港' },
  TWD: { sym: 'NT$', name: '新台币 (TWD)', frac: 0, rate: 0.22, cls: 'from-sky-500 to-blue-600', region: '台湾' },
  JPY: { sym: '¥', name: '日元 (JPY)', frac: 0, rate: 0.047, cls: 'from-pink-500 to-fuchsia-600', region: '日本' },
  KRW: { sym: '₩', name: '韩元 (KRW)', frac: 0, rate: 0.0054, cls: 'from-indigo-500 to-purple-600', region: '韩国' },
  USD: { sym: '$', name: '美元 (USD)', frac: 0, rate: 7.18, cls: 'from-emerald-500 to-teal-600', region: 'Global' },
  SGD: { sym: 'S$', name: '新加坡元 (SGD)', frac: 0, rate: 5.3, cls: 'from-amber-500 to-orange-600', region: '新加坡' },
};

export const LANGUAGE_META: Record<Language, { zh: string; en: string; native: string; flag: string }> = {
  zh: { zh: '简体中文', en: 'Chinese', native: '简体中文', flag: '🇨🇳' },
  en: { zh: '英文', en: 'English', native: 'English', flag: '🇬🇧' },
  ja: { zh: '日语', en: 'Japanese', native: '日本語', flag: '🇯🇵' },
  ko: { zh: '韩语', en: 'Korean', native: '한국어', flag: '🇰🇷' },
};

export const REGION_LABEL: Record<Region, { zh: string; en: string; color: string }> = {
  mainland: { zh: '内地', en: 'Mainland', color: 'text-neon-pink' },
  HKMT: { zh: '港澳台', en: 'HK/Macau/TW', color: 'text-neon-amber' },
  JP_KR: { zh: '日韩', en: 'Japan/Korea', color: 'text-neon-violet' },
  SEA: { zh: '东南亚', en: 'Southeast Asia', color: 'text-neon-teal' },
};

export const EVENT_TYPE_LABEL: Record<EventType, { zh: string; en: string; icon: string; color: string }> = {
  concert: { zh: '演唱会', en: 'Concert', icon: '🎤', color: 'text-neon-pink' },
  musical: { zh: '音乐剧', en: 'Musical', icon: '🎭', color: 'text-neon-violet' },
  play: { zh: '话剧', en: 'Play', icon: '🎬', color: 'text-neon-amber' },
  festival: { zh: '音乐节', en: 'Festival', icon: '🎶', color: 'text-neon-teal' },
  exhibition: { zh: '展览', en: 'Exhibition', icon: '🖼️', color: 'text-neon-violet' },
};

export const EVENT_STATUS_LABEL: Record<EventStatus, { zh: string; en: string; cls: string }> = {
  on_sale: { zh: '热销中', en: 'On Sale', cls: 'bg-neon-pink/15 border-neon-pink/40 text-neon-pink' },
  upcoming: { zh: '即将开票', en: 'Upcoming', cls: 'bg-neon-amber/15 border-neon-amber/40 text-neon-amber' },
  ended: { zh: '已结束', en: 'Ended', cls: 'bg-white/10 border-white/20 text-white/60' },
};

export const GRADE_LABEL: Record<TicketGrade, { zh: string; en: string; cls: string; color: string }> = {
  VIP: { zh: 'VIP 尊享', en: 'VIP', cls: 'from-neon-amber via-rose-500 to-pink-500', color: 'text-neon-amber' },
  S: { zh: 'S 区', en: 'S Section', cls: 'from-neon-pink via-fuchsia-500 to-neon-violet', color: 'text-neon-pink' },
  A: { zh: 'A 区', en: 'A Section', cls: 'from-neon-teal via-cyan-500 to-blue-500', color: 'text-neon-teal' },
  B: { zh: 'B 区', en: 'B Section', cls: 'from-neon-violet via-indigo-500 to-blue-500', color: 'text-neon-violet' },
  C: { zh: 'C 区', en: 'C Section', cls: 'from-slate-400 via-zinc-500 to-zinc-600', color: 'text-white/70' },
};

export const ISSUE_TYPE_LABEL: Record<IssueType, {
  zh: string; en: string; desc: string; descEn: string;
  color: string; cls: string;
}> = {
  FAKE_TICKET: {
    zh: '假票溯源', en: 'Fake Ticket',
    desc: '伪造/重复加密串溯源链路',
    descEn: 'Forged/duplicate crypto-tag trace',
    color: 'text-rose-300',
    cls: 'from-rose-500/20 to-rose-500/5 border-rose-500/40 text-rose-300',
  },
  VERIFY_FAIL: {
    zh: '线下核验异常', en: 'Verify Fail',
    desc: '终端验签失败或二维码异常',
    descEn: 'Terminal verify fail / QR anomaly',
    color: 'text-amber-300',
    cls: 'from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-300',
  },
  NO_TICKET_COMP: {
    zh: '无票赔付', en: 'No-ticket Compensation',
    desc: '未出票/出票失败，机票+酒店赔付',
    descEn: 'Ticketing failure → flight + hotel comp',
    color: 'text-emerald-300',
    cls: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/40 text-emerald-300',
  },
  PAYMENT_ANOMALY: {
    zh: '跨境支付异常', en: 'Payment Anomaly',
    desc: '已扣款未入账 / 退款停滞 / 对账不平',
    descEn: 'Charged not booked / refund stuck / rec mismatch',
    color: 'text-violet-300',
    cls: 'from-violet-500/20 to-violet-500/5 border-violet-500/40 text-violet-300',
  },
};

export const ISSUE_STATUS_LABEL: Record<IssueStatus, { zh: string; en: string; cls: string }> = {
  OPEN: { zh: '待受理', en: 'Open', cls: 'bg-rose-500/15 text-rose-300 border border-rose-500/40' },
  INVESTIGATING: { zh: '调查中', en: 'Investigating', cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/40' },
  RESOLVED: { zh: '已解决', en: 'Resolved', cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40' },
  CLOSED: { zh: '已关闭', en: 'Closed', cls: 'bg-white/10 text-white/60 border border-white/20' },
};

export const CHANNEL_LABEL: Record<PaymentChannel, { zh: string; en: string; logo: string; cls: string }> = {
  ALIPAY_PLUS: { zh: '支付宝 Alipay+ 国际版', en: 'Alipay+ Global', logo: '🅰️', cls: 'bg-sky-500/20 border-sky-500/40' },
  VISA: { zh: 'Visa 信用卡', en: 'Visa', logo: 'V', cls: 'bg-blue-500/20 border-blue-500/40' },
  MASTERCARD: { zh: 'Mastercard 万事达', en: 'Mastercard', logo: 'MC', cls: 'bg-orange-500/20 border-orange-500/40' },
  GCASH: { zh: 'GCash (菲律宾)', en: 'GCash PH', logo: '💙', cls: 'bg-indigo-500/20 border-indigo-500/40' },
  PAYME: { zh: 'PayMe (香港)', en: 'PayMe HK', logo: '💚', cls: 'bg-emerald-500/20 border-emerald-500/40' },
  LINEPAY: { zh: 'LINE Pay (日韩台)', en: 'LINE Pay', logo: 'L', cls: 'bg-green-500/20 border-green-500/40' },
  PAYNOW: { zh: 'PayNow (新加坡)', en: 'PayNow SG', logo: '💛', cls: 'bg-yellow-500/20 border-yellow-500/40' },
  PROMPTPAY: { zh: 'PromptPay (泰国)', en: 'PromptPay TH', logo: '🧡', cls: 'bg-amber-500/20 border-amber-500/40' },
};

export const LANGUAGE_LABEL: Record<Language, string> = {
  zh: '中文', en: 'EN', ja: '日本語', ko: '한국어',
};

export function pickML<T extends MultiLang>(m: T | undefined | null, lang: Language): string {
  if (!m) return '';
  return (m[lang] || m.zh || m.en || '') as string;
}

export function fmtMoney(amountCny: number, currency: Currency): string {
  const meta = CURRENCY_META[currency];
  const { sym, frac, rate } = meta;
  const v = Math.round(amountCny / (rate || 1));
  const n = new Intl.NumberFormat('en-US', { maximumFractionDigits: frac }).format(v);
  return `${sym} ${n}`;
}

export function fmtCny(n: number): string {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(n);
}

export function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch { return iso?.slice?.(0, 10) ?? iso; }
}

export function fmtDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return iso; }
}

export function fmtRelative(iso: string, lang: Language): string {
  try {
    const diff = (new Date(iso).getTime() - Date.now()) / 3600000;
    const abs = Math.abs(diff);
    const unit = abs < 1
      ? `${Math.max(1, Math.round(abs * 60))}${lang === 'zh' ? '分' : 'm'}`
      : abs < 24
        ? `${Math.round(abs)}${lang === 'zh' ? '小时' : 'h'}`
        : `${Math.round(abs / 24)}${lang === 'zh' ? '天' : 'd'}`;
    return (diff >= 0 ? (lang === 'zh' ? '剩余 ' : 'in ') : (lang === 'zh' ? '已过 ' : '-')) + unit;
  } catch { return iso; }
}

export function classNames(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(' ');
}

export function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const palette = ['#FF2E88', '#F5B544', '#2DD4BF', '#8B5CF6', '#10B981', '#60A5FA', '#F472B6', '#22D3EE', '#F97316', '#A855F7'];
  return palette[h % palette.length];
}
