import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyWithDecimal = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd', { locale: zhCN });
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

export const formatArea = (area: number): string => {
  return `${area}㎡`;
};

export const getCreditLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    S: 'text-gold-600',
    A: 'text-success-600',
    B: 'text-info-600',
    C: 'text-amber-600',
    D: 'text-danger-600',
  };
  return colors[level] || 'text-gray-600';
};

export const getCreditLevelBg = (level: string): string => {
  const colors: Record<string, string> = {
    S: 'bg-gold-100 text-gold-700',
    A: 'bg-success-100 text-success-700',
    B: 'bg-info-100 text-info-700',
    C: 'bg-amber-100 text-amber-700',
    D: 'bg-danger-100 text-danger-700',
  };
  return colors[level] || 'bg-gray-100 text-gray-700';
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待开始',
    'in-progress': '进行中',
    completed: '已完成',
    delayed: '已延误',
    submitted: '已提交',
    'evidence-collecting': '证据收集中',
    evaluating: '第三方评估中',
    mediating: '调解中',
    resolved: '已解决',
    closed: '已关闭',
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    'in-progress': 'bg-info-100 text-info-700',
    completed: 'bg-success-100 text-success-700',
    delayed: 'bg-danger-100 text-danger-700',
    submitted: 'bg-info-100 text-info-700',
    'evidence-collecting': 'bg-amber-100 text-amber-700',
    evaluating: 'bg-purple-100 text-purple-700',
    mediating: 'bg-blue-100 text-blue-700',
    resolved: 'bg-success-100 text-success-700',
    closed: 'bg-gray-100 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
};

export const getEvidenceTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    contract: '合同',
    photo: '照片',
    video: '视频',
    chat: '聊天记录',
    invoice: '票据',
    other: '其他',
  };
  return typeMap[type] || type;
};

export const getEvidenceTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    contract: '📄',
    photo: '🖼️',
    video: '🎬',
    chat: '💬',
    invoice: '🧾',
    other: '📎',
  };
  return iconMap[type] || '📎';
};

export const truncateHash = (hash: string): string => {
  if (!hash) return '';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

export const calculateProgressColor = (progress: number): string => {
  if (progress >= 80) return 'bg-success-500';
  if (progress >= 50) return 'bg-info-500';
  if (progress >= 20) return 'bg-amber-500';
  return 'bg-danger-500';
};
