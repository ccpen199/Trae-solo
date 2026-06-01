export function formatCurrency(amount: number, currency: string = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number, digits: number = 2): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num);
}

export function formatPercent(value: number, digits: number = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getAccountTypeColor(type: string): string {
  const colors: Record<string, string> = {
    cash: 'bg-emerald-500',
    bank_card: 'bg-blue-500',
    fund: 'bg-purple-500',
    stock: 'bg-orange-500',
    real_estate: 'bg-amber-700',
    vehicle: 'bg-gray-500',
    other_asset: 'bg-teal-500',
    loan: 'bg-rose-500',
    credit_card: 'bg-red-500',
    other_liability: 'bg-pink-500',
  };
  return colors[type] || 'bg-slate-500';
}

export function getAccountTypeTextColor(type: string): string {
  const colors: Record<string, string> = {
    cash: 'text-emerald-600',
    bank_card: 'text-blue-600',
    fund: 'text-purple-600',
    stock: 'text-orange-600',
    real_estate: 'text-amber-700',
    vehicle: 'text-gray-600',
    other_asset: 'text-teal-600',
    loan: 'text-rose-600',
    credit_card: 'text-red-600',
    other_liability: 'text-pink-600',
  };
  return colors[type] || 'text-slate-600';
}

export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    cash: '现金',
    bank_card: '银行卡',
    fund: '基金',
    stock: '股票',
    real_estate: '房产',
    vehicle: '车辆',
    other_asset: '其他资产',
    loan: '贷款',
    credit_card: '信用卡',
    other_liability: '其他负债',
  };
  return labels[type] || type;
}

export function isAssetAccount(type: string): boolean {
  return ['cash', 'bank_card', 'fund', 'stock', 'real_estate', 'vehicle', 'other_asset'].includes(type);
}

export function isLiabilityAccount(type: string): boolean {
  return ['loan', 'credit_card', 'other_liability'].includes(type);
}
