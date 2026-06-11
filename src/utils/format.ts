export const formatCurrency = (amount: number): string => {
  return '¥ ' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatIdNumber = (id: string): string => {
  if (id.length < 8) return id;
  return id.slice(0, 6) + '********' + id.slice(-4);
};

export const formatPhone = (phone: string): string => {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    normal: '正常',
    lost: '已挂失',
    frozen: '已冻结',
    expired: '已过期',
    pending: '制卡中',
    stopped: '已停保',
  };
  return map[status] || status;
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    normal: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
    frozen: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-gray-100 text-gray-700',
    pending: 'bg-blue-100 text-blue-700',
    stopped: 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

export const getAlertLevelColor = (level: string): string => {
  const map: Record<string, string> = {
    danger: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return map[level] || 'bg-gray-50 text-gray-700 border-gray-200';
};

export const getAlertLevelText = (level: string): string => {
  const map: Record<string, string> = {
    danger: '严重',
    warning: '警告',
    info: '提示',
  };
  return map[level] || level;
};

export const getInsuranceIcon = (type: string): string => {
  const map: Record<string, string> = {
    pension: '👴',
    medical: '🏥',
    injury: '🛡️',
    unemployment: '📋',
  };
  return map[type] || '📄';
};

export const generateRandomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
