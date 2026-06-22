export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(d);
};

export const maskIdCard = (idCard: string): string => {
  if (!idCard || idCard.length < 8) return idCard;
  return idCard.slice(0, 6) + '********' + idCard.slice(-4);
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    confirmed: '已确认',
    cancelled: '已取消',
    completed: '已完成',
    paid: '已支付',
    approved: '已通过',
    rejected: '已拒绝',
    expired: '已过期',
    success: '成功',
    failed: '失败',
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    cancelled: 'badge',
    completed: 'badge-success',
    paid: 'badge-success',
    approved: 'badge-success',
    rejected: 'badge-danger',
    expired: 'badge',
    success: 'badge-success',
    failed: 'badge-danger',
  };
  return colorMap[status] || 'badge-info';
};
