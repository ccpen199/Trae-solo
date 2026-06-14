import type { Currency, Language, MultiLang, Region, TicketGrade, IssueType, IssueStatus, EventType, EventStatus, PaymentChannel } from '@/shared/types';

export const FX: Record<Currency, number> = { CNY: 1, HKD: 0.92, TWD: 0.22, JPY: 0.047, KRW: 0.0054, USD: 7.18, SGD: 5.3, THB: 0.2, MYR: 1.53 };

export const CURRENCY_META: Record<Currency, { sym: string; name: string; nameJa: string; nameKo: string; frac: number; rate: number; cls: string; region: string }> = {
  CNY: { sym: '¥', name: '人民币 (CNY)', nameJa: '人民元 (CNY)', nameKo: '인민폐 (CNY)', frac: 0, rate: 1, cls: 'from-rose-500 to-red-600', region: '内地' },
  HKD: { sym: 'HK$', name: '港币 (HKD)', nameJa: '香港ドル (HKD)', nameKo: '홍콩달러 (HKD)', frac: 0, rate: 0.92, cls: 'from-red-500 to-pink-500', region: '香港' },
  TWD: { sym: 'NT$', name: '新台币 (TWD)', nameJa: '新台湾ドル (TWD)', nameKo: '신대만달러 (TWD)', frac: 0, rate: 0.22, cls: 'from-sky-500 to-blue-600', region: '台湾' },
  JPY: { sym: '¥', name: '日元 (JPY)', nameJa: '日本円 (JPY)', nameKo: '일본엔 (JPY)', frac: 0, rate: 0.047, cls: 'from-pink-500 to-fuchsia-600', region: '日本' },
  KRW: { sym: '₩', name: '韩元 (KRW)', nameJa: '韓国ウォン (KRW)', nameKo: '한국원 (KRW)', frac: 0, rate: 0.0054, cls: 'from-indigo-500 to-purple-600', region: '韩国' },
  USD: { sym: '$', name: '美元 (USD)', nameJa: '米ドル (USD)', nameKo: '미국달러 (USD)', frac: 0, rate: 7.18, cls: 'from-emerald-500 to-teal-600', region: 'Global' },
  SGD: { sym: 'S$', name: '新加坡元 (SGD)', nameJa: 'シンガポールドル (SGD)', nameKo: '싱가포르달러 (SGD)', frac: 0, rate: 5.3, cls: 'from-amber-500 to-orange-600', region: '新加坡' },
  THB: { sym: '฿', name: '泰铢 (THB)', nameJa: 'タイバーツ (THB)', nameKo: '태국바트 (THB)', frac: 0, rate: 0.2, cls: 'from-lime-500 to-green-600', region: '泰国' },
  MYR: { sym: 'RM', name: '林吉特 (MYR)', nameJa: 'マレーシアリンギット (MYR)', nameKo: '말레이시아링기트 (MYR)', frac: 0, rate: 1.53, cls: 'from-cyan-500 to-sky-600', region: '马来西亚' },
};

export const LANGUAGE_META: Record<Language, { zh: string; en: string; native: string; flag: string }> = {
  zh: { zh: '简体中文', en: 'Chinese', native: '简体中文', flag: '🇨🇳' },
  en: { zh: '英文', en: 'English', native: 'English', flag: '🇬🇧' },
  ja: { zh: '日语', en: 'Japanese', native: '日本語', flag: '🇯🇵' },
  ko: { zh: '韩语', en: 'Korean', native: '한국어', flag: '🇰🇷' },
};

export const REGION_LABEL: Record<Region, { zh: string; en: string; ja: string; ko: string; color: string }> = {
  mainland: { zh: '内地', en: 'Mainland', ja: '中国本土', ko: '중국 본토', color: 'text-neon-pink' },
  HKMT: { zh: '港澳台', en: 'HK/Macau/TW', ja: '香港・マカオ・台湾', ko: '홍콩/마카오/대만', color: 'text-neon-amber' },
  JP_KR: { zh: '日韩', en: 'Japan/Korea', ja: '日本・韓国', ko: '일본/한국', color: 'text-neon-violet' },
  SEA: { zh: '东南亚', en: 'Southeast Asia', ja: '東南アジア', ko: '동남아', color: 'text-neon-teal' },
};

export const EVENT_TYPE_LABEL: Record<EventType, { zh: string; en: string; ja: string; ko: string; icon: string; color: string }> = {
  concert: { zh: '演唱会', en: 'Concert', ja: 'コンサート', ko: '콘서트', icon: '🎤', color: 'text-neon-pink' },
  musical: { zh: '音乐剧', en: 'Musical', ja: 'ミュージカル', ko: '뮤지컬', icon: '🎭', color: 'text-neon-violet' },
  play: { zh: '话剧', en: 'Play', ja: '演劇', ko: '연극', icon: '🎬', color: 'text-neon-amber' },
  festival: { zh: '音乐节', en: 'Festival', ja: 'フェスティバル', ko: '페스티벌', icon: '🎶', color: 'text-neon-teal' },
  exhibition: { zh: '展览', en: 'Exhibition', ja: '展示会', ko: '전시회', icon: '🖼️', color: 'text-neon-violet' },
};

export const EVENT_STATUS_LABEL: Record<EventStatus, { zh: string; en: string; ja: string; ko: string; cls: string }> = {
  on_sale: { zh: '热销中', en: 'On Sale', ja: '販売中', ko: '판매중', cls: 'bg-neon-pink/15 border-neon-pink/40 text-neon-pink' },
  upcoming: { zh: '即将开票', en: 'Upcoming', ja: '発売予定', ko: '예매예정', cls: 'bg-neon-amber/15 border-neon-amber/40 text-neon-amber' },
  ended: { zh: '已结束', en: 'Ended', ja: '終了', ko: '종료', cls: 'bg-white/10 border-white/20 text-white/60' },
};

export const GRADE_LABEL: Record<TicketGrade, { zh: string; en: string; ja: string; ko: string; cls: string; color: string }> = {
  VIP: { zh: 'VIP 尊享', en: 'VIP', ja: 'VIP', ko: 'VIP', cls: 'from-neon-amber via-rose-500 to-pink-500', color: 'text-neon-amber' },
  S: { zh: 'S 区', en: 'S Section', ja: 'S 席', ko: 'S 구역', cls: 'from-neon-pink via-fuchsia-500 to-neon-violet', color: 'text-neon-pink' },
  A: { zh: 'A 区', en: 'A Section', ja: 'A 席', ko: 'A 구역', cls: 'from-neon-teal via-cyan-500 to-blue-500', color: 'text-neon-teal' },
  B: { zh: 'B 区', en: 'B Section', ja: 'B 席', ko: 'B 구역', cls: 'from-neon-violet via-indigo-500 to-blue-500', color: 'text-neon-violet' },
  C: { zh: 'C 区', en: 'C Section', ja: 'C 席', ko: 'C 구역', cls: 'from-slate-400 via-zinc-500 to-zinc-600', color: 'text-white/70' },
};

export const ISSUE_TYPE_LABEL: Record<IssueType, {
  zh: string; en: string; ja: string; ko: string;
  desc: string; descEn: string; descJa: string; descKo: string;
  color: string; cls: string;
}> = {
  FAKE_TICKET: {
    zh: '假票溯源', en: 'Fake Ticket', ja: '偽チケット追跡', ko: '위조티켓 추적',
    desc: '伪造/重复加密串溯源链路',
    descEn: 'Forged/duplicate crypto-tag trace',
    descJa: '偽造・重複暗号タグの追跡',
    descKo: '위조/중복 암호태그 추적',
    color: 'text-rose-300',
    cls: 'from-rose-500/20 to-rose-500/5 border-rose-500/40 text-rose-300',
  },
  VERIFY_FAIL: {
    zh: '线下核验异常', en: 'Verify Fail', ja: '現地検証異常', ko: '오프라인 검증 이상',
    desc: '终端验签失败或二维码异常',
    descEn: 'Terminal verify fail / QR anomaly',
    descJa: '端末検証失敗・QR異常',
    descKo: '단말 검증 실패 / QR 이상',
    color: 'text-amber-300',
    cls: 'from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-300',
  },
  NO_TICKET_COMP: {
    zh: '无票赔付', en: 'No-ticket Compensation', ja: '不発券補償', ko: '미발권 보상',
    desc: '未出票/出票失败，机票+酒店赔付',
    descEn: 'Ticketing failure → flight + hotel comp',
    descJa: 'チケット不発券の場合、航空券・宿泊代を補償',
    descKo: '티켓 미발권 시 항공권 + 호텔 보상',
    color: 'text-emerald-300',
    cls: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/40 text-emerald-300',
  },
  PAYMENT_ANOMALY: {
    zh: '跨境支付异常', en: 'Payment Anomaly', ja: '越境決済異常', ko: '크로스보더 결제 이상',
    desc: '已扣款未入账 / 退款停滞 / 对账不平',
    descEn: 'Charged not booked / refund stuck / rec mismatch',
    descJa: '引落済未計上・返金停滞・照合不一致',
    descKo: '결제완료 미입금 / 환불 지연 / 대조 불일치',
    color: 'text-violet-300',
    cls: 'from-violet-500/20 to-violet-500/5 border-violet-500/40 text-violet-300',
  },
};

export const ISSUE_STATUS_LABEL: Record<IssueStatus, { zh: string; en: string; ja: string; ko: string; cls: string }> = {
  OPEN: { zh: '待受理', en: 'Open', ja: '受付待ち', ko: '접수대기', cls: 'bg-rose-500/15 text-rose-300 border border-rose-500/40' },
  INVESTIGATING: { zh: '调查中', en: 'Investigating', ja: '調査中', ko: '조사중', cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/40' },
  RESOLVED: { zh: '已解决', en: 'Resolved', ja: '解決済', ko: '해결완료', cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40' },
  CLOSED: { zh: '已关闭', en: 'Closed', ja: 'クローズ済', ko: '종료', cls: 'bg-white/10 text-white/60 border border-white/20' },
};

export const CHANNEL_LABEL: Record<PaymentChannel, { zh: string; en: string; ja: string; ko: string; logo: string; cls: string }> = {
  ALIPAY_PLUS: { zh: '支付宝 Alipay+ 国际版', en: 'Alipay+ Global', ja: 'Alipay+ 国際版', ko: 'Alipay+ 글로벌', logo: '🅰️', cls: 'bg-sky-500/20 border-sky-500/40' },
  VISA: { zh: 'Visa 信用卡', en: 'Visa', ja: 'Visa クレジット', ko: 'Visa 카드', logo: 'V', cls: 'bg-blue-500/20 border-blue-500/40' },
  MASTERCARD: { zh: 'Mastercard 万事达', en: 'Mastercard', ja: 'Mastercard', ko: 'Mastercard', logo: 'MC', cls: 'bg-orange-500/20 border-orange-500/40' },
  GCASH: { zh: 'GCash (菲律宾)', en: 'GCash PH', ja: 'GCash (フィリピン)', ko: 'GCash (필리핀)', logo: '💙', cls: 'bg-indigo-500/20 border-indigo-500/40' },
  PAYME: { zh: 'PayMe (香港)', en: 'PayMe HK', ja: 'PayMe (香港)', ko: 'PayMe (홍콩)', logo: '💚', cls: 'bg-emerald-500/20 border-emerald-500/40' },
  LINEPAY: { zh: 'LINE Pay (日韩台)', en: 'LINE Pay', ja: 'LINE Pay (日・韓・台)', ko: 'LINE Pay (일한대)', logo: 'L', cls: 'bg-green-500/20 border-green-500/40' },
  PAYNOW: { zh: 'PayNow (新加坡)', en: 'PayNow SG', ja: 'PayNow (シンガポール)', ko: 'PayNow (싱가포르)', logo: '💛', cls: 'bg-yellow-500/20 border-yellow-500/40' },
  PROMPTPAY: { zh: 'PromptPay (泰国)', en: 'PromptPay TH', ja: 'PromptPay (タイ)', ko: 'PromptPay (태국)', logo: '🧡', cls: 'bg-amber-500/20 border-amber-500/40' },
};

export const LANGUAGE_LABEL: Record<Language, string> = {
  zh: '中文', en: 'EN', ja: '日本語', ko: '한국어',
};

export function pickML<T extends MultiLang>(m: T | undefined | null, lang: Language): string {
  if (!m) return '';
  return (m[lang] || m.zh || m.en || '') as string;
}

export function pickCurrencyName(c: Currency, lang: Language): string {
  const m = CURRENCY_META[c];
  if (lang === 'ja') return m.nameJa;
  if (lang === 'ko') return m.nameKo;
  if (lang === 'en') return m.name;
  return m.name;
}

export function pickRegionLabel(r: Region, lang: Language): string {
  const m = REGION_LABEL[r];
  if (lang === 'ja') return m.ja;
  if (lang === 'ko') return m.ko;
  if (lang === 'en') return m.en;
  return m.zh;
}

export function pickEventTypeLabel(t: EventType, lang: Language): string {
  const m = EVENT_TYPE_LABEL[t];
  if (lang === 'ja') return m.ja;
  if (lang === 'ko') return m.ko;
  if (lang === 'en') return m.en;
  return m.zh;
}

export function pickEventStatusLabel(s: EventStatus, lang: Language): string {
  const m = EVENT_STATUS_LABEL[s];
  if (lang === 'ja') return m.ja;
  if (lang === 'ko') return m.ko;
  if (lang === 'en') return m.en;
  return m.zh;
}

export function pickGradeLabel(g: TicketGrade, lang: Language): string {
  const m = GRADE_LABEL[g];
  if (lang === 'ja') return m.ja;
  if (lang === 'ko') return m.ko;
  if (lang === 'en') return m.en;
  return m.zh;
}

export function pickIssueTypeLabel(t: IssueType, lang: Language): string {
  const m = ISSUE_TYPE_LABEL[t];
  if (lang === 'ja') return m.ja;
  if (lang === 'ko') return m.ko;
  if (lang === 'en') return m.en;
  return m.zh;
}

export function pickIssueTypeDesc(t: IssueType, lang: Language): string {
  const m = ISSUE_TYPE_LABEL[t];
  if (lang === 'ja') return m.descJa;
  if (lang === 'ko') return m.descKo;
  if (lang === 'en') return m.descEn;
  return m.desc;
}

export function pickIssueStatusLabel(s: IssueStatus, lang: Language): string {
  const m = ISSUE_STATUS_LABEL[s];
  if (lang === 'ja') return m.ja;
  if (lang === 'ko') return m.ko;
  if (lang === 'en') return m.en;
  return m.zh;
}

export function pickChannelLabel(c: PaymentChannel, lang: Language): string {
  const m = CHANNEL_LABEL[c];
  if (lang === 'ja') return m.ja;
  if (lang === 'ko') return m.ko;
  if (lang === 'en') return m.en;
  return m.zh;
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
