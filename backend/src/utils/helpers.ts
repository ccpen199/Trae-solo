import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';

export const generateTransactionNo = (type: string = 'DISP'): string => {
  const dateStr = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${type}${dateStr}${random}`;
};

export const generateOrderNo = (): string => {
  return generateTransactionNo('PAY');
};

export const generateDeviceId = (model: string = 'WD'): string => {
  const dateStr = dayjs().format('YYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${model}-${dateStr}-${random}`;
};

export const generateQrCode = (deviceId: string): string => {
  return Buffer.from(`${deviceId}:${Date.now()}`).toString('base64').replace(/=/g, '').substring(0, 32);
};

export const generateWorkOrderNo = (): string => {
  return generateTransactionNo('WO');
};

export const generateProjectCode = (): string => {
  const dateStr = dayjs().format('YYMM');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRJ-${dateStr}-${random}`;
};

export const formatMoney = (amount: number, decimals: number = 2): string => {
  return amount.toFixed(decimals);
};

export const parseMoney = (amountStr: string): number => {
  const amount = parseFloat(amountStr);
  return isNaN(amount) ? 0 : Math.round(amount * 100) / 100;
};

export const formatVolume = (volume: number, decimals: number = 2): string => {
  return `${volume.toFixed(decimals)} L`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}时${mins}分`;
};

export const formatDateTime = (date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format);
};

export const formatDate = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatTime = (date: Date | string): string => {
  return dayjs(date).format('HH:mm:ss');
};

export const calculateDuration = (start: Date | string, end: Date | string): number => {
  return Math.floor((dayjs(end).valueOf() - dayjs(start).valueOf()) / 1000);
};

export const uuid = (): string => {
  return uuidv4();
};

export const objectIdToString = (id: Types.ObjectId | string): string => {
  return typeof id === 'string' ? id : id.toString();
};

export const stringToObjectId = (id: string): Types.ObjectId => {
  return new Types.ObjectId(id);
};

export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

export const generateRandomCode = (length: number = 6): string => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(7);
};

export const calculateROI = (
  dailyWaterUsage: number,
  pricePerLiter: number,
  maintenanceCostPerDay: number,
  totalInvestment: number
): { roi: number; paybackDays: number; dailyProfit: number } => {
  const dailyRevenue = dailyWaterUsage * pricePerLiter;
  const dailyProfit = dailyRevenue - maintenanceCostPerDay;
  const roi = totalInvestment > 0 ? (dailyProfit * 365) / totalInvestment : 0;
  const paybackDays = dailyProfit > 0 ? Math.ceil(totalInvestment / dailyProfit) : -1;
  return {
    roi: Math.round(roi * 10000) / 100,
    paybackDays,
    dailyProfit: Math.round(dailyProfit * 100) / 100,
  };
};

export const calculateWaterBill = (
  volumeLiters: number,
  pricePerLiter: number,
  tieredPricing?: Array<{ threshold: number; price: number }>
): { amount: number; breakdown: Array<{ volume: number; price: number; subtotal: number }> } => {
  const breakdown: Array<{ volume: number; price: number; subtotal: number }> = [];
  let totalAmount = 0;
  let remainingVolume = volumeLiters;

  if (tieredPricing && tieredPricing.length > 0) {
    let previousThreshold = 0;
    for (const tier of tieredPricing) {
      const tierVolume = Math.min(
        Math.max(0, remainingVolume),
        tier.threshold - previousThreshold
      );
      if (tierVolume > 0) {
        const subtotal = tierVolume * tier.price;
        breakdown.push({
          volume: tierVolume,
          price: tier.price,
          subtotal: Math.round(subtotal * 100) / 100,
        });
        totalAmount += subtotal;
        remainingVolume -= tierVolume;
      }
      previousThreshold = tier.threshold;
      if (remainingVolume <= 0) break;
    }
    if (remainingVolume > 0) {
      const lastTier = tieredPricing[tieredPricing.length - 1];
      const subtotal = remainingVolume * lastTier.price;
      breakdown.push({
        volume: remainingVolume,
        price: lastTier.price,
        subtotal: Math.round(subtotal * 100) / 100,
      });
      totalAmount += subtotal;
    }
  } else {
    const amount = volumeLiters * pricePerLiter;
    breakdown.push({
      volume: volumeLiters,
      price: pricePerLiter,
      subtotal: Math.round(amount * 100) / 100,
    });
    totalAmount = amount;
  }

  return {
    amount: Math.round(totalAmount * 100) / 100,
    breakdown,
  };
};

export const getDateRange = (range: 'today' | 'week' | 'month' | 'quarter' | 'year'): { start: Date; end: Date } => {
  const now = dayjs();
  let start: dayjs.Dayjs;
  switch (range) {
    case 'today':
      start = now.startOf('day');
      break;
    case 'week':
      start = now.startOf('week');
      break;
    case 'month':
      start = now.startOf('month');
      break;
    case 'quarter': {
      const month = now.month();
      const quarterStartMonth = Math.floor(month / 3) * 3;
      start = now.month(quarterStartMonth).startOf('month');
      break;
    }
    case 'year':
      start = now.startOf('year');
      break;
    default:
      start = now.startOf('day');
  }
  return {
    start: start.toDate(),
    end: now.endOf('day').toDate(),
  };
};

export const getTimeSlots = (granularity: 'hour' | 'day' = 'hour'): string[] => {
  const slots: string[] = [];
  if (granularity === 'hour') {
    for (let i = 0; i < 24; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
  } else {
    const daysInMonth = dayjs().daysInMonth();
    for (let i = 1; i <= daysInMonth; i++) {
      slots.push(`${i}日`);
    }
  }
  return slots;
};

export const paginate = (page: number = 1, pageSize: number = 20): { skip: number; limit: number } => {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  return {
    skip: (safePage - 1) * safePageSize,
    limit: safePageSize,
  };
};

export const buildPaginationResult = <T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} => {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const totalPages = Math.ceil(total / safePageSize);
  return {
    items,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
};
