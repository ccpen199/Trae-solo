import type {
  GeoPoint,
  User,
  UserWallet,
  RiderProfile,
  Order,
  OrderEvidence,
  FinanceLedger,
  OrderStatus,
  OrderType,
  RiderStatus,
  UserRole,
} from '../types';
import { generateId, haversineDistance, CITY_CENTER } from './index';

class SeededRandom {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

const rng = new SeededRandom(42);

function randomOffsetFromCenter(maxDistanceM: number): GeoPoint {
  const angle = rng.range(0, Math.PI * 2);
  const distance = rng.range(0, maxDistanceM);
  const R = 6371000;
  const latRad = (CITY_CENTER.lat * Math.PI) / 180;
  const dLat = (distance * Math.cos(angle)) / R;
  const dLng =
    (distance * Math.sin(angle)) / (R * Math.cos(latRad));
  return {
    lat: CITY_CENTER.lat + (dLat * 180) / Math.PI,
    lng: CITY_CENTER.lng + (dLng * 180) / Math.PI,
  };
}

const VEHICLE_TYPES = ['电动自行车', '摩托车', '汽车'];
const AVATAR_URLS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zane',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivy',
];
const NICKNAMES = [
  '小明', '张三', '李四', '王五', '赵六', '骑行侠', '飞毛腿', '闪电客',
  '跑腿哥', '外卖侠', '顺风车', '急先锋', '快递员', '送货郎', '行者',
  '云端漫步', '追风少年', '逐梦人', '晨曦', '黄昏', '夜行者', '独行侠',
];
const ORDER_TITLES: Record<OrderType, string[]> = {
  buy: ['帮买一杯星巴克咖啡', '代买感冒药', '买份肯德基套餐', '代购化妆品', '买一束鲜花', '买生日蛋糕'],
  deliver: ['同城快递文件', '寄送生日礼物', '送钥匙到公司', '送证件材料', '配送午餐', '送衣物到家'],
  errand: ['帮忙排队取号', '代办手机充值', '代取快递', '帮遛狗', '帮忙搬家小件', '代办缴费'],
};
const STREET_NAMES = [
  '南京东路', '淮海中路', '西藏中路', '人民大道', '福州路', '延安东路',
  '四川北路', '愚园路', '衡山路', '华山路', '巨鹿路', '陕西南路',
];

function randomPhone(): string {
  return `1${rng.int(3, 9)}${rng.int(100000000, 999999999)}`;
}

function randomAddress(): string {
  const num = rng.int(1, 999);
  const street = rng.pick(STREET_NAMES);
  return `${street}${num}号`;
}

function randomDate(daysBack: number = 7, daysForward: number = 2): Date {
  const now = Date.now();
  const msPerDay = 86400000;
  const offset = rng.range(-daysBack * msPerDay, daysForward * msPerDay);
  return new Date(now + offset);
}

export function generateMockUsers(count: number = 25): User[] {
  const users: User[] = [];
  const roles: UserRole[] = ['user', 'user', 'user', 'user', 'user', 'user', 'rider', 'rider', 'rider', 'dispatcher', 'finance'];
  for (let i = 0; i < count; i++) {
    const role = roles[i % roles.length];
    users.push({
      id: generateId('usr'),
      phone: randomPhone(),
      nickname: rng.pick(NICKNAMES) + rng.int(1, 999),
      avatarUrl: rng.pick(AVATAR_URLS),
      role,
      isVerified: rng.next() > 0.15,
      createdAt: randomDate(30, 0),
    });
  }
  return users;
}

export function generateMockWallets(users: User[]): UserWallet[] {
  return users.map((user) => ({
    id: generateId('wlt'),
    userId: user.id,
    balance: Math.round(rng.range(0, 5000) * 100) / 100,
    frozen: Math.round(rng.range(0, 500) * 100) / 100,
    currency: 'CNY',
  }));
}

export function generateMockRiders(count: number = 20): RiderProfile[] {
  const riders: RiderProfile[] = [];
  const statuses: RiderStatus[] = ['idle', 'idle', 'idle', 'idle', 'on_order', 'on_order', 'break', 'offline'];
  for (let i = 0; i < count; i++) {
    const status = statuses[i % statuses.length];
    const location = randomOffsetFromCenter(3000);
    location.address = randomAddress();
    riders.push({
      userId: generateId('rdr'),
      creditScore: rng.int(80, 98),
      fulfillRate: Math.round(rng.range(0.9, 0.99) * 100) / 100,
      completedOrders: rng.int(100, 2000),
      avgRating: Math.round(rng.range(4.2, 5.0) * 10) / 10,
      vehicleType: rng.pick(VEHICLE_TYPES),
      isVerified: rng.next() > 0.2,
      location,
      status,
      lastActiveAt: randomDate(1, 0),
    });
  }
  return riders;
}

export function generateMockOrders(
  count: number = 15,
  riders: RiderProfile[],
  users?: User[],
): Order[] {
  const orders: Order[] = [];
  const statuses: OrderStatus[] = [
    'pending_pay',
    'pending_accept',
    'pending_accept',
    'picking',
    'delivering',
    'delivering',
    'completed',
    'completed',
    'completed',
    'completed',
    'cancelled',
    'fused',
  ];
  const types: OrderType[] = ['buy', 'deliver', 'errand', 'deliver', 'buy', 'deliver'];
  const idleRiders = riders.filter((r) => r.status === 'idle');

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const status = statuses[i % statuses.length];
    const pickup = randomOffsetFromCenter(3000);
    pickup.address = randomAddress();
    const deliver = randomOffsetFromCenter(3000);
    deliver.address = randomAddress();
    const distanceM = haversineDistance(pickup, deliver);
    const baseFee = 5;
    const mileageFee = Math.round((distanceM / 1000) * 2 * 100) / 100;
    const surgeFee = rng.next() > 0.7 ? Math.round(rng.range(1, 5) * 100) / 100 : 0;
    const platformFee = Math.round((baseFee + mileageFee + surgeFee) * 0.2 * 100) / 100;
    const totalAmount = Math.round((baseFee + mileageFee + surgeFee + platformFee) * 100) / 100;

    const createdAt = randomDate(7, 0);
    const expectedPickupAt = new Date(createdAt.getTime() + rng.int(15, 60) * 60000);
    const expectedDeliverAt = new Date(expectedPickupAt.getTime() + rng.int(20, 90) * 60000);

    let riderId: string | undefined;
    let acceptedAt: Date | undefined;
    let pickedAt: Date | undefined;
    let deliveredAt: Date | undefined;

    if (
      status === 'picking' ||
      status === 'delivering' ||
      status === 'completed' ||
      status === 'fused'
    ) {
      if (idleRiders.length > 0 || riders.length > 0) {
        const rider = riders[i % riders.length];
        riderId = rider.userId;
        acceptedAt = new Date(createdAt.getTime() + rng.int(1, 15) * 60000);
      }
    }
    if (status === 'picking' || status === 'delivering' || status === 'completed') {
      pickedAt = new Date((acceptedAt ?? createdAt).getTime() + rng.int(5, 40) * 60000);
    }
    if (status === 'completed') {
      deliveredAt = new Date((pickedAt ?? expectedPickupAt).getTime() + rng.int(15, 60) * 60000);
    }

    const userId = users && users.length > 0
      ? users[i % users.length].id
      : generateId('usr');

    orders.push({
      id: generateId('ord'),
      userId,
      riderId,
      type,
      title: rng.pick(ORDER_TITLES[type]),
      description: `请尽快处理，联系电话：${randomPhone()}`,
      pickup,
      deliver,
      expectedPickupAt,
      expectedDeliverAt,
      surgeFee,
      baseFee,
      mileageFee,
      platformFee,
      totalAmount,
      status,
      fusionCount: status === 'fused' ? rng.int(2, 4) : 0,
      createdAt,
      acceptedAt,
      pickedAt,
      deliveredAt,
    });
  }
  return orders;
}

export function generateMockEvidences(orders?: Order[]): OrderEvidence[] {
  const evidences: OrderEvidence[] = [];
  const types: Array<'receipt' | 'signature' | 'other'> = ['receipt', 'signature', 'other'];
  const targetOrders = orders?.filter((o) => o.status === 'completed' || o.status === 'delivering') ?? [];
  const count = targetOrders.length > 0 ? targetOrders.length * 2 : 10;
  for (let i = 0; i < count; i++) {
    const orderId = targetOrders.length > 0
      ? targetOrders[i % targetOrders.length].id
      : generateId('ord');
    evidences.push({
      id: generateId('evd'),
      orderId,
      type: types[i % types.length],
      imageUrl: `https://picsum.photos/seed/evidence${i}/400/300`,
      uploadedAt: randomDate(7, 0),
    });
  }
  return evidences;
}

export function generateMockFinanceLedgers(orders?: Order[]): FinanceLedger[] {
  const ledgers: FinanceLedger[] = [];
  const types: Array<'pay' | 'refund' | 'payout' | 'commission' | 'fee'> = [
    'pay', 'pay', 'pay', 'payout', 'commission', 'fee', 'refund',
  ];
  const channels: Array<'wechat' | 'alipay' | 'unionpay' | 'balance'> = [
    'wechat', 'alipay', 'wechat', 'balance', 'alipay', 'unionpay',
  ];
  const statuses: Array<'pending' | 'success' | 'failed'> = [
    'success', 'success', 'success', 'success', 'pending', 'failed',
  ];
  const count = orders && orders.length > 0 ? orders.length * 2 : 20;

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const isDebit = type === 'pay' || type === 'fee' || type === 'commission';
    const amount = Math.round(
      (type === 'refund' || type === 'payout' ? rng.range(10, 100) : rng.range(5, 80)) * 100
    ) / 100;
    const createdAt = randomDate(7, 0);
    const status = statuses[i % statuses.length];
    const orderId = orders && orders.length > 0
      ? orders[i % orders.length].id
      : undefined;

    ledgers.push({
      id: generateId('fnc'),
      orderId,
      accountType: isDebit ? 'user' : 'platform',
      direction: isDebit ? 'debit' : 'credit',
      amount,
      type,
      channel: channels[i % channels.length],
      status,
      createdAt,
      settledAt: status === 'success' ? new Date(createdAt.getTime() + rng.int(1, 3600) * 1000) : undefined,
    });
  }
  return ledgers;
}
