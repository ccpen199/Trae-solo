export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toLocaleString('zh-CN');
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    draft: 'bg-surface-200 text-surface-600',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-success-50 text-success-600',
    rejected: 'bg-danger-50 text-danger-500',
    ongoing: 'bg-primary-100 text-primary-700',
    completed: 'bg-success-100 text-success-600',
    open: 'bg-primary-100 text-primary-700',
    closed: 'bg-surface-200 text-surface-600',
    recruiting: 'bg-accent-100 text-accent-600',
    reviewing: 'bg-amber-100 text-amber-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    suspended: 'bg-danger-100 text-danger-600',
    registered: 'bg-primary-50 text-primary-700',
  };
  return colorMap[status] || 'bg-surface-200 text-surface-600';
}

export function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    ongoing: '进行中',
    completed: '已完成',
    open: '开放报名',
    closed: '已截止',
    recruiting: '招募中',
    reviewing: '评审中',
    shortlisted: '已入围',
    suspended: '已暂停',
    registered: '已报名',
  };
  return labelMap[status] || status;
}
