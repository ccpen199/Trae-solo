
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value);
}

export function truncateHash(hash: string, start = 6, end = 4): string {
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export function getLevelColorClass(level: string): string {
  const colorMap: Record<string, string> = {
    '橙色': '橙色',
    '黄色': '黄色',
    '蓝色': '蓝色',
    '红色': '红色',
  };
  return colorMap[level] || '蓝色';
}

export function getToneColor(tone: string): string {
  const colorMap: Record<string, string> = {
    green: '#0f8f67',
    blue: '#1e40af',
    amber: '#c47a09',
    slate: '#475569',
  };
  return colorMap[tone] || '#475569';
}
