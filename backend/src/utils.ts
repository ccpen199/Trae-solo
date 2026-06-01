import crypto from 'crypto';
import dayjs from 'dayjs';

export const generateOrderNo = (prefix: string = 'ORD'): string => {
  const dateStr = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${dateStr}${random}`;
};

export const generateHash = (data: any, prevHash: string = ''): string => {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = crypto.createHash('sha256');
  hash.update(prevHash + str + Date.now().toString());
  return hash.digest('hex');
};

export const formatMoney = (amount: number): string => {
  return amount.toFixed(2);
};

export const parseMoney = (str: string): number => {
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
};

export const getStoreCondition = (storeId: number | null, alias: string = ''): {
  where: string;
  params: any[];
} => {
  if (storeId) {
    return {
      where: alias ? ` AND ${alias}.store_id = ?` : ' AND store_id = ?',
      params: [storeId]
    };
  }
  return { where: '', params: [] };
};

export const buildPagination = (page: number = 1, pageSize: number = 20): {
  limit: number;
  offset: number;
} => {
  const p = Math.max(1, parseInt(page as any) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize as any) || 20));
  return {
    limit: ps,
    offset: (p - 1) * ps
  };
};

export const success = (res: any, data: any = null, message: string = 'success') => {
  res.json({
    code: 0,
    message,
    data
  });
};

export const error = (res: any, message: string = 'error', code: number = 1, status: number = 400) => {
  res.status(status).json({
    code,
    message,
    data: null
  });
};

export const getMethodName = (method: string): string => {
  const map: Record<string, string> = {
    cash: '现金',
    qrcode: '扫码支付',
    bank_card: '银行卡',
    stored_card: '储值卡',
    coupon: '优惠券'
  };
  return map[method] || method;
};

export const getStatusName = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
    partial_refund: '部分退款',
    approved: '已通过',
    rejected: '已拒绝',
    open: '进行中',
    closed: '已结束',
    reconciled: '已对账',
    unmatched: '待核对'
  };
  return map[status] || status;
};
