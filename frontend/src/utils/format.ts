import dayjs from 'dayjs';

export const formatPrice = (price: number, type: 'sale' | 'rent' = 'sale'): string => {
  if (type === 'sale') {
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(2)}亿`;
    } else if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`;
    }
    return `${price}元`;
  } else {
    return `${price}元/月`;
  }
};

export const formatArea = (area: number): string => {
  return `${area}㎡`;
};

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatPhone = (phone: string): string => {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
};

export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const getCustomerTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    buyer: '购房客户',
    seller: '售房业主',
    tenant: '租房客户',
    landlord: '出租业主',
  };
  return labels[type] || type;
};

export const getCustomerTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    buyer: 'tag-primary',
    seller: 'tag-gold',
    tenant: 'tag-info',
    landlord: 'tag-success',
  };
  return colors[type] || 'tag';
};

export const getDemandStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    open: '可抢单',
    taken: '已承接',
    deal: '已成交',
    expired: '已过期',
  };
  return labels[status] || status;
};

export const getDemandStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    open: 'tag-success',
    taken: 'tag-warning',
    deal: 'tag-gold',
    expired: 'tag',
  };
  return colors[status] || 'tag';
};

export const getCommissionStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待结算',
    approved: '已审核',
    paid: '已支付',
  };
  return labels[status] || status;
};

export const getCommissionStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'tag-warning',
    approved: 'tag-primary',
    paid: 'tag-success',
  };
  return colors[status] || 'tag';
};

export const getAuditStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
  };
  return labels[status] || status;
};

export const getAuditStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'tag-warning',
    approved: 'tag-success',
    rejected: 'tag-danger',
  };
  return colors[status] || 'tag';
};

export const getPropertyStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: '有效',
    inactive: '无效',
    pending: '待审核',
    duplicate: '重复',
  };
  return labels[status] || status;
};

export const getPropertyStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'tag-success',
    inactive: 'tag',
    pending: 'tag-warning',
    duplicate: 'tag-danger',
  };
  return colors[status] || 'tag';
};

export const getAuthenticityScoreColor = (score: number): string => {
  if (score >= 80) return 'text-success-600';
  if (score >= 60) return 'text-gold-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-danger-600';
};

export const getAuthenticityScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-success-500';
  if (score >= 60) return 'bg-gold-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-danger-500';
};

export const timeAgo = (date: string | Date): string => {
  const now = dayjs();
  const target = dayjs(date);
  const diffDays = now.diff(target, 'day');
  const diffHours = now.diff(target, 'hour');
  const diffMinutes = now.diff(target, 'minute');

  if (diffDays > 30) {
    return formatDate(date);
  } else if (diffDays > 0) {
    return `${diffDays}天前`;
  } else if (diffHours > 0) {
    return `${diffHours}小时前`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟前`;
  }
  return '刚刚';
};

export const generateSerialNumber = (): string => {
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}${random}`;
};
