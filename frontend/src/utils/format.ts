import dayjs from 'dayjs';

export const formatIdCard = (idCard: string): string => {
  if (!idCard || idCard.length < 8) return idCard;
  return idCard.substring(0, 6) + '********' + idCard.substring(idCard.length - 4);
};

export const formatPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
};

export const maskPhone = formatPhone;

export const maskIdCard = formatIdCard;

export const formatName = (name: string): string => {
  if (!name || name.length <= 1) return name;
  if (name.length === 2) {
    return name.charAt(0) + '*';
  }
  return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
};

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return '';
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return formatDate(date);
};

export const formatMoney = (amount: number, unit: string = '¥'): string => {
  if (amount === null || amount === undefined) return '';
  return `${unit}${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)}${units[unitIndex]}`;
};

export const formatBytes = formatFileSize;

export const formatNumber = (value: number | string): string => {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  return num.toLocaleString('zh-CN');
};

export const formatLicenseNumber = (licenseNumber: string): string => {
  if (!licenseNumber || licenseNumber.length <= 8) return licenseNumber;
  return `${licenseNumber.slice(0, 4)} ${licenseNumber.slice(4, 8)} ${licenseNumber.slice(8)}`;
};

export const getLicenseStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    valid: '有效',
    expiring: '即将到期',
    expired: '已过期',
    revoked: '已吊销',
    pending: '待签发'
  };
  return statusMap[status] || status;
};

export const getMatterStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    accepting: '受理中',
    accepted: '已受理',
    reviewing: '审核中',
    approved: '已通过',
    rejected: '已驳回',
    completed: '已完成',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
};

export const getMatterStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    draft: '#86909C',
    submitted: '#FA8C16',
    accepting: '#1890FF',
    accepted: '#1890FF',
    reviewing: '#1890FF',
    approved: '#52C41A',
    rejected: '#F5222D',
    completed: '#52C41A',
    cancelled: '#86909C'
  };
  return colorMap[status] || '#86909C';
};

export const getCrossProvinceStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    source_submitted: '源地已提交',
    source_reviewing: '源地审核中',
    source_approved: '源地已通过',
    data_transferring: '数据传输中',
    target_received: '目标地已接收',
    target_reviewing: '目标地审核中',
    target_approved: '目标地已通过',
    result_transferring: '结果回传中',
    completed: '已完成',
    failed: '办理失败',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
};

export const getMessageTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    system_notice: '系统通知',
    matter_progress: '办件进度',
    license_reminder: '证照提醒',
    policy_update: '政策更新',
    service_recommend: '服务推荐',
    payment_reminder: '缴费提醒',
    verification_result: '核验结果'
  };
  return typeMap[type] || type;
};

export const getRecommendReasonText = (reasonType: string): string => {
  const reasonMap: Record<string, string> = {
    user_profile: '根据您的个人信息推荐',
    behavior: '根据您的浏览行为推荐',
    hot: '热门服务推荐',
    similar: '相似服务推荐',
    location: '根据您的位置推荐'
  };
  return reasonMap[reasonType] || reasonType;
};

export const getLicenseTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    social_security_card: '社会保障卡',
    professional_qualification: '职业资格证书',
    title_certificate: '职称证书',
    pension_certificate: '养老待遇证',
    unemployment_certificate: '失业证',
    labor_contract: '劳动合同',
    other: '其他证照'
  };
  return typeMap[type] || type;
};

export const getMatterTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    pension_certification: '养老待遇资格认证',
    unemployment_registration: '失业登记',
    title_declaration: '职称申报',
    social_security_transfer: '社保关系转移',
    labor_rights_protection: '劳动维权',
    ecard_apply: '电子社保卡申领',
    other: '其他业务'
  };
  return typeMap[type] || type;
};
