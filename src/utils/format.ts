export function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(decimals) + '亿';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(decimals) + '万';
  }
  return num.toLocaleString('zh-CN', { maximumFractionDigits: decimals });
}

export function formatMoney(num: number, decimals: number = 2): string {
  if (num >= 100000000) {
    return '¥' + (num / 100000000).toFixed(decimals) + '亿';
  }
  if (num >= 10000) {
    return '¥' + (num / 10000).toFixed(decimals) + '万';
  }
  return '¥' + num.toLocaleString('zh-CN', { maximumFractionDigits: decimals });
}

export function formatPercent(num: number, decimals: number = 2): string {
  return (num * 100).toFixed(decimals) + '%';
}

export function formatRate(num: number, decimals: number = 2): string {
  return num.toFixed(decimals) + '%';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getGrowthColor(value: number): string {
  if (value > 0) return 'text-success-500';
  if (value < 0) return 'text-danger-500';
  return 'text-dark-400';
}

export function getGrowthText(value: number): string {
  if (value > 0) return `+${(value * 100).toFixed(2)}%`;
  return `${(value * 100).toFixed(2)}%`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
