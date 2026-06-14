import type {
  CargoOrder,
  Driver,
  VehicleSensorData,
  CargoStop,
  TempControl,
  LoadingDifficulty,
  OrderStatus,
  VehicleType,
  HeatmapPoint,
  RegionSaturation,
  MatchCandidate,
  UserInfo,
} from '@/types';
import { calculatePrice } from '../pricing';
import { getTopCandidates } from '../matching';
import { runFulfillmentCheck } from '../fulfillment';

const CITY_CENTER = { lat: 31.2304, lng: 121.4737 };

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}
function randid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const AREA_ADDRESSES: { addr: string; lat: number; lng: number; name: string }[] = [
  { addr: '上海市浦东新区陆家嘴环路1000号', lat: 31.2396, lng: 121.4998, name: '陆家嘴' },
  { addr: '上海市黄浦区南京东路300号', lat: 31.2354, lng: 121.4815, name: '南京东路' },
  { addr: '上海市徐汇区漕河泾开发区88号', lat: 31.1773, lng: 121.4008, name: '漕河泾' },
  { addr: '上海市静安区南京西路1788号', lat: 31.2305, lng: 121.4525, name: '静安寺' },
  { addr: '上海市杨浦区五角场万达广场', lat: 31.2984, lng: 121.5135, name: '五角场' },
  { addr: '上海市闵行区莘庄工业区申富路', lat: 31.1083, lng: 121.3790, name: '莘庄' },
  { addr: '上海市宝山区共富新村路', lat: 31.3897, lng: 121.3873, name: '宝山' },
  { addr: '上海市松江区大学城文汇路', lat: 31.0440, lng: 121.2230, name: '松江' },
  { addr: '上海市嘉定区安亭镇墨玉路', lat: 31.2889, lng: 121.2129, name: '嘉定' },
  { addr: '上海市浦东新区张江高科技园区', lat: 31.2050, lng: 121.5970, name: '张江' },
  { addr: '上海市普陀区真北路红星美凯龙', lat: 31.2465, lng: 121.3810, name: '普陀' },
  { addr: '上海市长宁区虹桥开发区', lat: 31.1983, lng: 121.3986, name: '虹桥' },
];

const DRIVER_NAMES = ['张伟', '李强', '王磊', '刘洋', '陈军', '杨斌', '赵刚', '黄磊', '周涛', '吴鹏', '徐峰', '孙浩', '马超', '朱勇', '胡军', '郭伟', '林峰', '何强', '罗斌', '梁辉'];
const SHIPPER_NAMES = ['上海鲜达供应链', '沪上快仓物流', '申城速运', '长三角冷链'];
const CARGO_NAMES = ['生鲜果蔬', '电子配件', '服装鞋帽', '医药冷链', '日用百货', '食品饮料', '家具建材', '工业零部件'];
const VEHICLE_TYPES: { t: VehicleType; name: string; v: number; w: number }[] = [
  { t: 'VAN', name: '面包车', v: 5, w: 1000 },
  { t: 'TRUCK_4M', name: '4.2米厢货', v: 14, w: 3000 },
  { t: 'TRUCK_6M', name: '6.8米厢货', v: 35, w: 8000 },
  { t: 'TRUCK_9M', name: '9.6米重卡', v: 60, w: 18000 },
  { t: 'REEFER', name: '冷藏车', v: 30, w: 6000 },
];

const STATUSES: OrderStatus[] = ['PUBLISHED', 'MATCHING', 'MATCHED', 'ACCEPTED', 'PICKING_UP', 'IN_TRANSIT', 'PARTIAL_DELIVERED', 'DELIVERED', 'FULFILLMENT_CHECKING', 'COMPLETED', 'EXCEPTION'];

function generateStops(count: number): CargoStop[] {
  const shuffled = [...AREA_ADDRESSES].sort(() => Math.random() - 0.5).slice(0, count);
  const stops: CargoStop[] = [
    {
      seq: 1,
      type: 'PICKUP',
      address: shuffled[0].addr,
      lat: shuffled[0].lat + rand(-0.005, 0.005),
      lng: shuffled[0].lng + rand(-0.005, 0.005),
      contactName: '仓库张主管',
      contactPhone: `138${randInt(10000000, 99999999)}`,
      arrivedAt: new Date(Date.now() - randInt(60, 300) * 60000).toISOString(),
      departedAt: new Date(Date.now() - randInt(30, 180) * 60000).toISOString(),
    },
  ];
  for (let i = 1; i < count; i++) {
    const a = shuffled[i];
    stops.push({
      seq: i + 1,
      type: 'DELIVERY',
      address: a.addr,
      lat: a.lat + rand(-0.005, 0.005),
      lng: a.lng + rand(-0.005, 0.005),
      contactName: ['李经理', '王主任', '刘前台', '陈小姐'][randInt(0, 3)],
      contactPhone: `139${randInt(10000000, 99999999)}`,
      arrivedAt: new Date(Date.now() - randInt(5, 200) * 60000).toISOString(),
      departedAt: new Date(Date.now() - randInt(0, 100) * 60000).toISOString(),
    });
  }
  return stops;
}

export function generateDrivers(): Driver[] {
  return DRIVER_NAMES.map((name, idx) => {
    const vt = VEHICLE_TYPES[idx % VEHICLE_TYPES.length];
    const pos = AREA_ADDRESSES[idx % AREA_ADDRESSES.length];
    const isReefer = vt.t === 'REEFER';
    return {
      id: randid('drv'),
      name,
      phone: `138${String(10000000 + idx * 137).slice(-8)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      licensePlate: `沪${['A', 'B', 'D', 'E', 'F'][idx % 5]}·${String.fromCharCode(65 + (idx % 26))}${String(10000 + idx * 17).padStart(5, '0').slice(-5)}`,
      vehicleType: vt.t,
      vehicleTypeName: vt.name,
      maxVolume: vt.v,
      maxWeight: vt.w,
      tempCapability: isReefer ? ['NORMAL', 'FRESH', 'REFRIGERATED', 'DEEP_FREEZE'] : ['NORMAL'],
      historyFulfillmentRate: +rand(0.82, 0.99).toFixed(3),
      currentLat: pos.lat + rand(-0.02, 0.02),
      currentLng: pos.lng + rand(-0.02, 0.02),
      currentStatus: (['IDLE', 'IDLE', 'ON_DUTY', 'IN_TRANSIT'] as const)[randInt(0, 3)],
      saturation: +rand(0.3, 0.95).toFixed(2),
      totalOrders: randInt(120, 1800),
      rating: +rand(4.2, 5).toFixed(1),
      region: pos.name,
      todayEarnings: +rand(200, 1600).toFixed(2),
    };
  });
}

export function generateOrders(drivers: Driver[]): CargoOrder[] {
  const orders: CargoOrder[] = [];
  for (let i = 0; i < 30; i++) {
    const status = STATUSES[i % STATUSES.length];
    const stopCount = randInt(2, 5);
    const stops = generateStops(stopCount);
    const tempControl = (['NORMAL', 'NORMAL', 'NORMAL', 'FRESH', 'REFRIGERATED', 'DEEP_FREEZE'] as TempControl[])[randInt(0, 5)];
    const loadingDifficulty = (['LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH'] as LoadingDifficulty[])[randInt(0, 4)];
    const volume = +rand(1, 30).toFixed(1);
    const weight = randInt(100, 8000);
    const cargoValue = randInt(3000, 120000);
    const insuranceEnabled = Math.random() < 0.55;

    const orderBase: Partial<CargoOrder> = {
      id: randid('ord'),
      orderNo: `HY202606${String(1400 + i).padStart(4, '0')}${randInt(100, 999)}`,
      shipperId: 'shipper_demo',
      shipperName: SHIPPER_NAMES[i % SHIPPER_NAMES.length],
      cargoName: CARGO_NAMES[i % CARGO_NAMES.length],
      volume,
      weight,
      tempControl,
      tempRange: tempControl === 'FRESH' ? [2, 8] : tempControl === 'REFRIGERATED' ? [-22, -14] : tempControl === 'DEEP_FREEZE' ? [-35, -25] : undefined,
      loadingDifficulty,
      cargoValue,
      stops,
      pickupTimeWindow: [
        new Date(Date.now() + randInt(0, 120) * 60000).toISOString(),
        new Date(Date.now() + randInt(180, 480) * 60000).toISOString(),
      ],
      insurance: {
        enabled: insuranceEnabled,
        policyNo: insuranceEnabled ? `PICC${Date.now()}${randInt(1000, 9999)}` : undefined,
        premium: insuranceEnabled ? +(cargoValue * 0.003).toFixed(2) : 0,
        coverage: insuranceEnabled ? cargoValue : 0,
        insurer: 'PICC',
        status: insuranceEnabled ? (['PENDING', 'ISSUED', 'SETTLED'] as const)[randInt(0, 2)] : 'PENDING',
      },
      status,
      createdAt: new Date(Date.now() - randInt(5, 600) * 60000).toISOString(),
    };

    const price = calculatePrice(orderBase as CargoOrder);
    const order: CargoOrder = {
      ...(orderBase as CargoOrder),
      priceBreakdown: price,
      totalPrice: price.total,
    };

    const assigned =
      status !== 'PUBLISHED' && status !== 'MATCHING' && status !== 'CANCELLED'
        ? drivers[randInt(0, drivers.length - 1)]
        : undefined;
    if (assigned) {
      order.driverId = assigned.id;
      order.matchedAt = new Date(Date.now() - randInt(5, 200) * 60000).toISOString();
      order.currentLat = assigned.currentLat;
      order.currentLng = assigned.currentLng;
    }

    if (status === 'COMPLETED' || status === 'FULFILLMENT_CHECKING' || status === 'EXCEPTION') {
      const sensor = generateSensorHistory(order, 80);
      order.fulfillment = runFulfillmentCheck(order, sensor);
    }

    if (status === 'PUBLISHED' || status === 'MATCHING') {
      order.matchCandidates = getTopCandidates(order, drivers, 3);
    }

    orders.push(order);
  }
  return orders;
}

export function generateSensorHistory(order: CargoOrder, count: number): VehicleSensorData[] {
  const history: VehicleSensorData[] = [];
  const driverId = order.driverId ?? 'mock_drv';
  const targetLoad = order.weight;
  const stops = order.stops;
  const tempBase =
    order.tempControl === 'NORMAL'
      ? 22
      : order.tempControl === 'FRESH'
        ? 5
        : order.tempControl === 'REFRIGERATED'
          ? -18
          : -30;

  const startLat = stops[0].lat;
  const startLng = stops[0].lng;
  const endLat = stops[stops.length - 1].lat;
  const endLng = stops[stops.length - 1].lng;

  let load = 0;
  let doorCount = 0;
  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const phase = progress < 0.05 ? 'loading' : progress > 0.95 ? 'unloading' : 'transit';

    if (phase === 'loading') {
      load = targetLoad * (i / Math.max(1, Math.floor(count * 0.05)));
      if (i === 2) doorCount++;
      if (i === Math.floor(count * 0.04)) doorCount++;
    } else if (phase === 'transit') {
      load = targetLoad + rand(-targetLoad * 0.03, targetLoad * 0.03);
      const stopCheckpoints = stops.map((_, idx) => idx / stops.length).slice(1);
      for (const cp of stopCheckpoints) {
        if (Math.abs(progress - cp) < 0.04 && Math.random() < 0.5) {
          doorCount += 2;
        }
      }
    } else {
      load = targetLoad * (1 - (i - Math.floor(count * 0.95)) / Math.max(1, count - Math.floor(count * 0.95)));
      if (i === count - 5) doorCount++;
    }

    const tempJitter =
      order.tempControl === 'NORMAL' ? rand(-2, 5) : rand(-4, 3) + (Math.random() < 0.08 ? rand(3, 8) : 0);
    history.push({
      driverId,
      orderId: order.id,
      timestamp: new Date(Date.now() - (count - i) * 2000).toISOString(),
      loadWeight: +load.toFixed(1),
      temperature: +(tempBase + tempJitter).toFixed(1),
      doorOpenCount: doorCount,
      doorEvents: [],
      location: {
        lat: +(startLat + (endLat - startLat) * progress + rand(-0.002, 0.002)).toFixed(6),
        lng: +(startLng + (endLng - startLng) * progress + rand(-0.002, 0.002)).toFixed(6),
        speed: phase === 'transit' ? +rand(15, 60).toFixed(1) : 0,
      },
    });
  }
  return history;
}

export function generateHeatmapData(): HeatmapPoint[] {
  const data: HeatmapPoint[] = [];
  AREA_ADDRESSES.forEach((area) => {
    for (let i = 0; i < 4; i++) {
      data.push({
        lat: area.lat + rand(-0.02, 0.02),
        lng: area.lng + rand(-0.02, 0.02),
        value: randInt(3, 30),
        count: randInt(5, 80),
        regionName: area.name,
      });
    }
  });
  return data;
}

export function generateRegionSaturation(): RegionSaturation[] {
  return AREA_ADDRESSES.map((area, idx) => {
    const baseSat = rand(0.4, 0.98);
    const saturation = idx % 4 === 0 ? Math.max(0.86, baseSat) : baseSat;
    return {
      code: `REG_${idx}`,
      name: area.name,
      lat: area.lat,
      lng: area.lng,
      saturation: +saturation.toFixed(2),
      idleDrivers: randInt(1, 18),
      inTransitDrivers: randInt(3, 28),
      pendingOrders: randInt(2, 30),
    };
  });
}

export const defaultUser: Record<'SHIPPER' | 'DRIVER' | 'ADMIN', UserInfo> = {
  SHIPPER: {
    id: 'shipper_demo',
    role: 'SHIPPER',
    name: '张经理',
    phone: '13800000001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shipper',
    company: '上海鲜达供应链管理有限公司',
  },
  DRIVER: {
    id: 'drv_demo',
    role: 'DRIVER',
    name: '李师傅',
    phone: '13800000002',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=driver',
    company: '沪A·D8823F',
  },
  ADMIN: {
    id: 'admin_demo',
    role: 'ADMIN',
    name: '调度中心',
    phone: '021-88880000',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    company: '运联智能平台',
  },
};

export const CITY_CENTER_EXPORT = CITY_CENTER;
export const AREA_ADDRESSES_EXPORT = AREA_ADDRESSES;
