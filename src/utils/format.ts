import dayjs from 'dayjs';

export const formatMoney = (amount: number | undefined | null, decimals = 2): string => {
  return `¥${(amount ?? 0).toFixed(decimals)}`;
};

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format);
};

export const serviceTypeMap = {
  water: { name: '水费', color: '#00B8D9', key: 'water' },
  electricity: { name: '电费', color: '#FF8800', key: 'electricity' },
  gas: { name: '燃气费', color: '#00B42A', key: 'gas' },
  all: { name: '全部', color: '#165DFF', key: 'all' },
};

export const billStatusMap = {
  0: { text: '未缴费', color: '#F53F3F' },
  1: { text: '已缴费', color: '#00B42A' },
  2: { text: '已逾期', color: '#FF7D00' },
  3: { text: '已作废', color: '#86909C' },
};

export const paymentStatusMap = {
  0: { text: '待支付', color: '#FF7D00' },
  1: { text: '支付成功', color: '#00B42A' },
  2: { text: '支付失败', color: '#F53F3F' },
  3: { text: '已退款', color: '#86909C' },
};

export const announcementTypeMap = {
  outage: { text: '停供公告', color: '#F53F3F' },
  repair: { text: '抢修公告', color: '#FF7D00' },
  notice: { text: '通知公告', color: '#165DFF' },
};

export const announcementStatusMap = {
  0: { text: '草稿', color: '#86909C' },
  1: { text: '待审核', color: '#FF7D00' },
  2: { text: '已发布', color: '#00B42A' },
  3: { text: '已驳回', color: '#F53F3F' },
  4: { text: '已下架', color: '#86909C' },
};

export const workOrderStatusMap = {
  0: { text: '待受理', color: '#FF7D00' },
  1: { text: '处理中', color: '#165DFF' },
  2: { text: '待确认', color: '#722ED1' },
  3: { text: '已完成', color: '#00B42A' },
  4: { text: '已关闭', color: '#86909C' },
};

export const workOrderTypeMap = {
  consultation: { text: '咨询', color: '#165DFF' },
  complaint: { text: '投诉', color: '#F53F3F' },
  suggestion: { text: '建议', color: '#00B42A' },
  repair: { text: '报修', color: '#FF7D00' },
  other: { text: '其他', color: '#86909C' },
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

export const maskIdCard = (idCard: string): string => {
  if (!idCard || idCard.length < 8) return idCard;
  return idCard.replace(/(\d{6})\d+(\d{2})/, '$1********$2');
};

export const getStatusColor = (statusMap: Record<number | string, { color: string }>, status: number | string): string => {
  return statusMap[status]?.color || '#86909C';
};

export const getStatusText = (statusMap: Record<number | string, { text: string }>, status: number | string): string => {
  return statusMap[status]?.text || '未知';
};
