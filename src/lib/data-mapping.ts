export const categoryMap: Record<string, string> = {
  identity: '身份类',
  household: '户籍类',
  education: '教育类',
  employment: '就业类',
  social: '社保类',
  medical: '医疗类',
  housing: '住房类',
  vehicle: '车辆类',
  business: '经营类',
  tax: '税务类',
  finance: '金融类',
  other: '其他类',
};

export const providerMap: Record<string, { label: string; color: string }> = {
  minzhengtong: { label: '闽政通', color: 'bg-red-100 text-red-700 border-red-200' },
  wechat: { label: '微信', color: 'bg-green-100 text-green-700 border-green-200' },
  alipay: { label: '支付宝', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  password: { label: '账号密码', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export const idTypeToRoleLabel: Record<string, string> = {
  personal: '个人用户',
  enterprise: '企业用户',
  government: '治理人员',
};

export const categoryToChinese = (category: string): string => {
  return categoryMap[category] || category;
};

export const providerToLabel = (providerKey?: string): string => {
  if (!providerKey) return '账号密码';
  return providerMap[providerKey]?.label || providerKey;
};

export const providerToColor = (providerKey?: string): string => {
  if (!providerKey) return providerMap.password.color;
  return providerMap[providerKey]?.color || providerMap.password.color;
};

export const idTypeToRole = (idType?: string): string => {
  if (!idType) return '个人用户';
  return idTypeToRoleLabel[idType] || idType;
};

export const formatDateTime = (isoString?: string): string => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export const formatDate = (isoString?: string): string => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export const statusTextMap: Record<string, string> = {
  active: '已授权',
  expired: '已过期',
  revoked: '已撤销',
  pending: '待办理',
  processing: '办理中',
  completed: '已完成',
  rejected: '已驳回',
  running: '运行中',
  failed: '失败',
  valid: '有效',
  invalid: '无效',
};

export const statusColorMap: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-600',
  revoked: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-800',
  processing: 'bg-primary/10 text-primary',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  running: 'bg-primary/10 text-primary',
  failed: 'bg-red-100 text-red-800',
  valid: 'bg-green-100 text-green-800',
  invalid: 'bg-gray-100 text-gray-600',
};
