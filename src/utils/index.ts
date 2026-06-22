import type {
  GeoPoint,
  RiderProfile,
  Order,
  OrderRiderScore,
  OrderStatus,
  OrderType,
} from '../types';

export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatCurrency(n: number): string {
  return `¥${n.toFixed(2)}`;
}

export function formatDuration(secs: number): string {
  if (secs < 0) secs = 0;
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = Math.floor(secs % 60);
  if (hours > 0) {
    return `${hours}小时${minutes}分${seconds}秒`;
  }
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`;
  }
  return `${seconds}秒`;
}

export function formatDateTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

export function computeRiderScore(
  rider: RiderProfile,
  order: Order,
): OrderRiderScore {
  const distanceM = haversineDistance(rider.location, order.pickup);
  const maxDistance = 3000;
  const distanceScore = Math.max(0, 40 * (1 - distanceM / maxDistance));
  const creditScore = 0.3 * rider.creditScore;
  const fulfillScore = 30 * rider.fulfillRate;
  const totalScore = distanceScore + creditScore + fulfillScore;
  const estimatedArrivalSecs = Math.round(distanceM / 4);
  return {
    riderId: rider.userId,
    totalScore,
    distanceScore,
    creditScore,
    fulfillScore,
    distanceM,
    estimatedArrivalSecs,
  };
}

export function checkRiderAvailability(
  rider: RiderProfile,
  newOrder: Order,
  activeOrders: Order[],
): boolean {
  if (rider.status !== 'idle') {
    return false;
  }
  const riderActiveOrders = activeOrders.filter(
    (o) =>
      o.riderId === rider.userId &&
      (o.status === 'picking' ||
        o.status === 'delivering' ||
        o.status === 'pending_accept'),
  );
  for (const existing of riderActiveOrders) {
    const existingStart = existing.expectedPickupAt.getTime();
    const existingEnd = existing.expectedDeliverAt.getTime();
    const newStart = newOrder.expectedPickupAt.getTime();
    const newEnd = newOrder.expectedDeliverAt.getTime();
    if (newStart < existingEnd && newEnd > existingStart) {
      return false;
    }
  }
  return true;
}

const orderStatusTextMap: Record<OrderStatus, string> = {
  pending_pay: '待支付',
  pending_accept: '待接单',
  picking: '取件中',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消',
  fused: '已融合',
};

export function getOrderStatusText(s: OrderStatus): string {
  return orderStatusTextMap[s] ?? s;
}

const orderTypeTextMap: Record<OrderType, string> = {
  buy: '代买',
  deliver: '代送',
  errand: '代办',
};

export function getOrderTypeText(t: OrderType): string {
  return orderTypeTextMap[t] ?? t;
}

type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

function toVal(mix: ClassValue): string {
  let k: number;
  let y: string;
  let str = '';
  if (typeof mix === 'string' || typeof mix === 'number') {
    str += mix;
  } else if (typeof mix === 'object') {
    if (Array.isArray(mix)) {
      for (k = 0; k < mix.length; k++) {
        if (mix[k]) {
          if ((y = toVal(mix[k] as ClassValue))) {
            str && (str += ' ');
            str += y;
          }
        }
      }
    } else {
      for (const k in mix as Record<string, boolean | null | undefined>) {
        if (mix && (mix as Record<string, boolean | null | undefined>)[k]) {
          str && (str += ' ');
          str += k;
        }
      }
    }
  }
  return str;
}

function clsx(...inputs: ClassValue[]): string {
  let i = 0;
  let tmp: ClassValue;
  let x: string;
  let out = '';
  while (i < inputs.length) {
    if ((tmp = inputs[i++])) {
      if ((x = toVal(tmp))) {
        out && (out += ' ');
        out += x;
      }
    }
  }
  return out;
}

function twMerge(...classLists: string[]): string {
  const classes = classLists.filter(Boolean).join(' ').split(/\s+/);
  const map = new Map<string, string>();
  for (const cls of classes) {
    if (!cls) continue;
    const variantMatch = cls.match(/^(sm:|md:|lg:|xl:|2xl:|hover:|focus:|active:|disabled:|dark:|light:)+/);
    let variant = '';
    let baseClass = cls;
    if (variantMatch) {
      variant = variantMatch[0];
      baseClass = cls.slice(variant.length);
    }
    let basePrefix = baseClass;
    const baseDashIdx = baseClass.indexOf('-');
    if (baseDashIdx > 0) {
      basePrefix = baseClass.slice(0, baseDashIdx);
    }
    const key = `${variant}${basePrefix}`;
    map.set(key, cls);
  }
  return Array.from(map.values()).join(' ');
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}

export const CITY_CENTER: GeoPoint = { lat: 31.2304, lng: 121.4737, address: '上海市人民广场' };
