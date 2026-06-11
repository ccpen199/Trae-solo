import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currency: string = "CNY") {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string | number, format?: string) {
  const d = new Date(date);
  if (format) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return format
      .replace("YYYY", String(d.getFullYear()))
      .replace("MM", pad(d.getMonth() + 1))
      .replace("DD", pad(d.getDate()))
      .replace("HH", pad(d.getHours()))
      .replace("mm", pad(d.getMinutes()))
      .replace("ss", pad(d.getSeconds()));
  }
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function calculatePercentile(values: number[], percentile: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const fraction = index - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
}

export function generateId() {
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  const maskedName = name.length > 2
    ? name[0] + "*".repeat(name.length - 2) + name[name.length - 1]
    : "*".repeat(name.length);
  return `${maskedName}@${domain}`;
}

export function maskPhone(phone: string) {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + "*".repeat(phone.length - 7) + phone.slice(-4);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
) {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getYearsOfExperience(startDate: Date | string): number {
  const start = new Date(startDate);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear();
  const monthDiff = now.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) {
    return years - 1;
  }
  return Math.max(0, years);
}

export function matchScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 80;
  const chars1 = new Set(s1.split(""));
  const chars2 = new Set(s2.split(""));
  let common = 0;
  chars1.forEach((c) => {
    if (chars2.has(c)) common++;
  });
  return Math.round((common / Math.max(chars1.size, chars2.size)) * 50);
}
