import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Currency, MemberTier } from '@shared/types';
import { format, differenceInDays } from 'date-fns';
import { zhCN, enUS, ja, fr, de } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    [Currency.CNY]: '¥',
    [Currency.USD]: '$',
    [Currency.EUR]: '€',
    [Currency.GBP]: '£',
    [Currency.JPY]: '¥',
    [Currency.AED]: 'AED ',
    [Currency.SGD]: 'S$',
    [Currency.THB]: '฿',
  };
  return `${symbols[currency] || ''}${amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateStr: string, lang: string = 'zh-CN'): string {
  const locales: Record<string, Locale> = {
    'zh-CN': zhCN,
    'en-US': enUS,
    'ja-JP': ja,
    'fr-FR': fr,
    'de-DE': de,
  };
  
  const locale = locales[lang] || zhCN;
  return format(new Date(dateStr), 'yyyy年MM月dd日', { locale });
}

export function formatDateRange(checkIn: string, checkOut: string, lang: string = 'zh-CN'): string {
  const start = formatDate(checkIn, lang);
  const end = formatDate(checkOut, lang);
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  return `${start} - ${end} (${nights}晚)`;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  return differenceInDays(new Date(checkOut), new Date(checkIn));
}

export function getMemberTierColor(tier: MemberTier): string {
  const colors: Record<MemberTier, string> = {
    [MemberTier.BRONZE]: 'text-amber-700 bg-amber-50',
    [MemberTier.SILVER]: 'text-slate-600 bg-slate-50',
    [MemberTier.GOLD]: 'text-gold-foil bg-gold-foil/10',
  };
  return colors[tier] || colors[MemberTier.BRONZE];
}

export function getMemberTierLabel(tier: MemberTier): string {
  const labels: Record<MemberTier, string> = {
    [MemberTier.BRONZE]: '青铜会员',
    [MemberTier.SILVER]: '白银会员',
    [MemberTier.GOLD]: '黄金会员',
    [MemberTier.PLATINUM]: '铂金会员',
  };
  return labels[tier] || '普通会员';
}

export function getMemberTierBenefits(tier: MemberTier): string[] {
  const baseBenefits = ['免费取消', '专属客服', '生日礼遇'];
  const tierBenefits: Record<MemberTier, string[]> = {
    [MemberTier.BRONZE]: [...baseBenefits],
    [MemberTier.SILVER]: [...baseBenefits, '房价95折', '提前入住', '延迟退房1小时', '积分1.2倍'],
    [MemberTier.GOLD]: [...baseBenefits, '房价9折', '免费早餐', '延迟退房2小时', '积分1.5倍', 'VIP房型锁定', '行政酒廊'],
    [MemberTier.PLATINUM]: [...baseBenefits, '房价85折', '免费套房升级', '24小时入住', '积分2倍', '私人管家', '机场接送'],
  };
  return tierBenefits[tier] || tierBenefits[MemberTier.BRONZE];
}

export function getNextTier(tier: MemberTier): MemberTier | null {
  const order = [MemberTier.BRONZE, MemberTier.SILVER, MemberTier.GOLD];
  const currentIndex = order.indexOf(tier);
  return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
}

export function getProgressToNextTier(points: number, tier: MemberTier): { current: number; required: number; percent: number } {
  const thresholds: Record<MemberTier, number> = {
    [MemberTier.BRONZE]: 0,
    [MemberTier.SILVER]: 10000,
    [MemberTier.GOLD]: 50000,
  };
  
  const current = thresholds[tier];
  const next = getNextTier(tier);
  const required = next ? thresholds[next] : current;
  const percent = required > current ? Math.min(100, ((points - current) / (required - current)) * 100) : 100;
  
  return { current: points, required, percent };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^[\d\s\-+()]{8,}$/.test(phone);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
