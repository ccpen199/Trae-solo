import dayjs from 'dayjs';
import type { CreditDimensions } from '@/types';

/**
 * 计算两点间的地球表面距离(Haversine公式)
 * @param lat1 点1纬度(十进制度)
 * @param lng1 点1经度(十进制度)
 * @param lat2 点2纬度(十进制度)
 * @param lng2 点2经度(十进制度)
 * @returns 距离(公里，保留2位小数)
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * 根据距离与出行方式换算通勤时间(含±20%随机扰动)
 * @param distance 距离(公里)
 * @param mode 出行方式：walk步行 / bike骑行 / drive驾车 / metro地铁
 * @returns 预估时间(分钟)
 */
export function calcCommuteTime(
  distance: number,
  mode: 'walk' | 'bike' | 'drive' | 'metro'
): number {
  let baseSpeed: number;
  switch (mode) {
    case 'walk':
      baseSpeed = 5;
      break;
    case 'bike':
      baseSpeed = 15;
      break;
    case 'drive':
      baseSpeed = 30;
      break;
    case 'metro':
      baseSpeed = 35;
      break;
    default:
      baseSpeed = 5;
  }
  const baseMinutes = (distance / baseSpeed) * 60;
  let extraMinutes = 0;
  if (mode === 'metro') {
    extraMinutes = 8 + Math.random() * 6;
  } else if (mode === 'drive') {
    extraMinutes = Math.random() * 10;
  }
  const jitter = 0.8 + Math.random() * 0.4;
  const total = (baseMinutes + extraMinutes) * jitter;
  return Math.max(1, Math.round(total));
}

/**
 * 信用分维度加权计算总分
 * @param dimensions 各维度得分(每项0-100)
 * @param weights 各维度权重(可选，默认值 identity25%/behavior20%/performance30%/reputation15%/social10%)
 * @returns 总分(0-1000)
 */
export function calcCreditScore(
  dimensions: CreditDimensions,
  weights?: Partial<CreditDimensions>
): number {
  const defaultWeights: CreditDimensions = {
    identity: 0.25,
    behavior: 0.2,
    performance: 0.3,
    reputation: 0.15,
    social: 0.1,
  };
  const finalWeights: CreditDimensions = { ...defaultWeights, ...weights };
  const keys: (keyof CreditDimensions)[] = [
    'identity',
    'behavior',
    'performance',
    'reputation',
    'social',
  ];
  let total = 0;
  for (const key of keys) {
    const dim = Math.max(0, Math.min(100, dimensions[key] || 0));
    total += dim * (finalWeights[key] || 0) * 10;
  }
  return Math.round(Math.max(0, Math.min(1000, total)));
}

/**
 * 信用分→押金减免比例映射
 * @param creditScore 信用总分(0-1000)
 * @returns 减免比例(0~1，0表示不减免，1表示全免)
 */
export function calcDepositReduction(creditScore: number): number {
  const score = Math.max(0, Math.min(1000, creditScore));
  if (score >= 900) return 1;
  if (score >= 850) return 0.85;
  if (score >= 800) return 0.7;
  if (score >= 750) return 0.5;
  if (score >= 700) return 0.3;
  if (score >= 650) return 0.15;
  if (score >= 600) return 0.05;
  return 0;
}

/**
 * 工程师对象接口（供GPS就近派单使用）
 */
export interface DispatchableEngineer {
  /** 工程师ID */
  id: string;
  /** 工程师姓名 */
  name: string;
  /** 当前所在位置纬度 */
  lat: number;
  /** 当前所在位置经度 */
  lng: number;
  /** 当日已接单数量(用于负载均衡) */
  todayOrders?: number;
  /** 工程师技能标签(用于匹配工单类型) */
  skills?: string[];
  /** 是否在岗(离线不参与派单) */
  online?: boolean;
  /** 当前状态：空闲/忙碌/休息 */
  status?: 'idle' | 'busy' | 'rest';
}

/**
 * GPS就近派单算法：按距离升序+负载均衡综合排序
 * @param orderLat 工单位置纬度
 * @param orderLng 工单位置经度
 * @param engineers 候选工程师列表
 * @returns 排序后工程师列表(距离优先，附加当日接单量作为次排序因子)
 */
export function gpsDispatch<T extends DispatchableEngineer>(
  orderLat: number,
  orderLng: number,
  engineers: T[]
): (T & { distance: number; dispatchScore: number })[] {
  const withDistance = engineers
    .filter((e) => (e.online === undefined ? true : e.online))
    .filter((e) => (e.status === undefined ? true : e.status !== 'rest'))
    .map((e) => {
      const distance = haversineDistance(orderLat, orderLng, e.lat, e.lng);
      const todayOrders = e.todayOrders ?? 0;
      const loadFactor = 1 + todayOrders * 0.05;
      const dispatchScore = distance * loadFactor;
      return {
        ...e,
        distance,
        dispatchScore,
      };
    });
  return withDistance.sort((a, b) => {
    if (a.status !== b.status) {
      const order: Record<string, number> = { idle: 0, busy: 1, rest: 2 };
      return (order[a.status || 'idle'] ?? 0) - (order[b.status || 'idle'] ?? 0);
    }
    return a.dispatchScore - b.dispatchScore;
  });
}

/**
 * 货币金额格式化
 * @param n 金额数值(元)
 * @param options 配置项：decimals小数位数、symbol货币符号、withGrouping是否千分位
 * @returns 格式化后字符串，如 "¥12,345.68"
 */
export function formatMoney(
  n: number,
  options?: {
    decimals?: number;
    symbol?: string;
    withGrouping?: boolean;
  }
): string {
  const { decimals = 2, symbol = '¥', withGrouping = true } = options ?? {};
  const num = Number(n) || 0;
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const grouped = withGrouping
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : intPart;
  return decimals > 0 ? `${symbol}${grouped}.${decPart}` : `${symbol}${grouped}`;
}

/**
 * 身份证号脱敏：保留前6位与后4位，中间用*替代
 * @param id 身份证号(15或18位)
 * @returns 脱敏后字符串，如 "310101********1234"
 */
export function maskIdCard(id: string): string {
  if (!id) return '';
  const s = String(id).trim();
  if (s.length <= 10) return s;
  const prefix = s.slice(0, 6);
  const suffix = s.slice(-4);
  const midLength = s.length - 10;
  const mask = '*'.repeat(Math.max(midLength, 8));
  return `${prefix}${mask}${suffix}`;
}

/**
 * 手机号脱敏：保留前3位与后4位，中间用*替代
 * @param phone 手机号
 * @returns 脱敏后字符串，如 "138****1234"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const s = String(phone).trim();
  if (s.length < 7) return s;
  const prefix = s.slice(0, 3);
  const suffix = s.slice(-4);
  const midLength = s.length - 7;
  const mask = '*'.repeat(Math.max(midLength, 4));
  return `${prefix}${mask}${suffix}`;
}

/**
 * 业务编号生成
 * @param prefix 业务前缀，如 FD(房东) / FY(房源) / HT(合同) / GD(工单) / YZ(安置)
 * @returns 前缀+年月日时分秒+4位随机数，如 "FD20240615143025A1B2"
 */
export function generateRandomId(prefix: string = ''): string {
  const datePart = dayjs().format('YYYYMMDDHHmmss');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randPart = '';
  for (let i = 0; i < 4; i++) {
    randPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${datePart}${randPart}`;
}
