import dayjs from 'dayjs';

export const formatMoney = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '¥0.00';
  return `¥${Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatIdCard = (idCard) => {
  if (!idCard) return '';
  if (idCard.length === 18) {
    return `${idCard.slice(0, 6)}********${idCard.slice(-4)}`;
  }
  return idCard;
};

export const formatPhone = (phone) => {
  if (!phone) return '';
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  }
  return phone;
};

export const getInsuranceTypeName = (typeId) => {
  const typeMap = {
    1: '养老保险',
    2: '医疗保险',
    3: '失业保险',
    4: '工伤保险',
    5: '生育保险',
  };
  return typeMap[typeId] || '未知类型';
};

export const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成',
    cancelled: '已取消',
  };
  return statusMap[status] || status || '未知';
};
