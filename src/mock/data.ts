import type {
  User,
  EtcCard,
  Vehicle,
  TrafficRecord,
  Outlet,
  OBU,
  ExceptionEvent,
  SettlementRecord,
  TollStation,
  DashboardStats,
  RechargeMethod,
  RechargeOrder,
  RouteOption,
} from '../../shared/types';
import { tollEngine } from '../../shared/engine/TollEngine';

export const mockUser: User = {
  id: 'u001',
  name: '张三',
  phone: '138****8888',
  idCard: '440***********1234',
  verified: true,
  createdAt: '2024-01-15T10:30:00Z',
};

export const mockEtcCard: EtcCard = {
  id: 'c001',
  cardNo: '6222 **** **** 8888',
  type: '储值卡',
  balance: 56.8,
  status: '正常',
  userId: 'u001',
  vehicleId: 'v001',
  expiryDate: '2029-12-31',
};

export const mockVehicle: Vehicle = {
  id: 'v001',
  plateNo: '粤A·88888',
  plateType: '蓝牌',
  vehicleType: 1,
  seats: 5,
  userId: 'u001',
};

const generateGantryPoints = (baseLat: number, baseLng: number, count: number) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push({
      id: `g${String(i + 1).padStart(3, '0')}`,
      gantryNo: `G${String(Math.floor(Math.random() * 1000)).padStart(5, '0')}`,
      location: {
        lat: baseLat + i * 0.05 + Math.random() * 0.02,
        lng: baseLng + i * 0.08 + Math.random() * 0.02,
      },
      passTime: new Date(Date.now() - (count - i) * 300000).toISOString(),
      sectionFee: Math.round(Math.random() * 2000) / 100 + 5,
    });
  }
  return points;
};

export const mockTrafficRecords: TrafficRecord[] = [
  {
    id: 't001',
    cardId: 'c001',
    vehicleId: 'v001',
    entryStation: '广州北站',
    exitStation: '深圳南站',
    entryTime: '2026-06-11T08:30:00Z',
    exitTime: '2026-06-11T10:45:00Z',
    distance: 128.5,
    gantryPoints: generateGantryPoints(23.2, 113.3, 8),
    totalFee: 78.5,
    discountFee: 3.93,
    actualFee: 74.57,
    discountType: '95折',
    status: '已完成',
  },
  {
    id: 't002',
    cardId: 'c001',
    vehicleId: 'v001',
    entryStation: '深圳南站',
    exitStation: '东莞站',
    entryTime: '2026-06-10T14:20:00Z',
    exitTime: '2026-06-10T15:10:00Z',
    distance: 65.2,
    gantryPoints: generateGantryPoints(22.5, 114.1, 5),
    totalFee: 39.8,
    discountFee: 1.99,
    actualFee: 37.81,
    discountType: '95折',
    status: '已完成',
  },
  {
    id: 't003',
    cardId: 'c001',
    vehicleId: 'v001',
    entryStation: '佛山东站',
    exitStation: '广州西站',
    entryTime: '2026-06-09T09:15:00Z',
    exitTime: '2026-06-09T09:50:00Z',
    distance: 35.8,
    gantryPoints: generateGantryPoints(23.0, 113.1, 4),
    totalFee: 21.8,
    discountFee: 1.09,
    actualFee: 20.71,
    discountType: '95折',
    status: '已完成',
  },
  {
    id: 't004',
    cardId: 'c001',
    vehicleId: 'v001',
    entryStation: '珠海北站',
    exitStation: '中山站',
    entryTime: '2026-06-08T16:40:00Z',
    exitTime: '2026-06-08T17:20:00Z',
    distance: 42.3,
    gantryPoints: generateGantryPoints(22.3, 113.5, 4),
    totalFee: 25.6,
    discountFee: 1.28,
    actualFee: 24.32,
    discountType: '95折',
    status: '已完成',
  },
  {
    id: 't005',
    cardId: 'c001',
    vehicleId: 'v001',
    entryStation: '惠州南站',
    exitStation: '深圳东站',
    entryTime: '2026-06-07T11:00:00Z',
    exitTime: '2026-06-07T12:15:00Z',
    distance: 58.7,
    gantryPoints: generateGantryPoints(22.9, 114.4, 5),
    totalFee: 35.8,
    discountFee: 1.79,
    actualFee: 34.01,
    discountType: '95折',
    status: '异常',
  },
  {
    id: 't006',
    cardId: 'c001',
    vehicleId: 'v001',
    entryStation: '广州北站',
    exitStation: '佛山东站',
    entryTime: '2026-06-12T07:30:00Z',
    exitTime: '2026-06-12T08:15:00Z',
    distance: 45.2,
    gantryPoints: generateGantryPoints(23.3, 113.2, 5),
    totalFee: 27.5,
    discountFee: 1.38,
    actualFee: 26.12,
    discountType: '95折',
    status: '待扣费',
    paymentRetryCount: 2,
    lastPaymentAttempt: '2026-06-12T08:16:00Z',
    paymentMethod: 'autopay',
    autoPayEnabled: true,
    paymentFailureReason: '余额不足，自动代扣已触发但账户余额低于本笔通行费',
    paymentFailureCode: 'E_INSUFFICIENT_BALANCE',
    autoPayTriggered: true,
    autoPayTriggeredAt: '2026-06-12T08:16:00Z',
    autoPayResult: 'failed',
    lowBalanceWarning: true,
    lowBalanceWarningAt: '2026-06-12T08:16:00Z',
  },
  {
    id: 't007',
    cardId: 'c001',
    vehicleId: 'v001',
    entryStation: '东莞站',
    exitStation: '深圳北站',
    entryTime: '2026-06-11T18:00:00Z',
    exitTime: '2026-06-11T19:00:00Z',
    distance: 52.3,
    gantryPoints: generateGantryPoints(23.0, 113.8, 6),
    totalFee: 32.8,
    discountFee: 1.64,
    actualFee: 31.16,
    discountType: '95折',
    status: '待扣费',
    paymentRetryCount: 3,
    lastPaymentAttempt: '2026-06-12T06:00:00Z',
    paymentMethod: 'balance',
    autoPayEnabled: false,
    paymentFailureReason: '微信代扣授权已过期，需重新授权后自动补缴',
    paymentFailureCode: 'E_AUTH_EXPIRED',
    autoPayTriggered: true,
    autoPayTriggeredAt: '2026-06-12T06:00:00Z',
    autoPayResult: 'failed',
  },
  {
    id: 't008',
    cardId: 'c001',
    vehicleId: 'v001',
    entryStation: '中山站',
    exitStation: '珠海北站',
    entryTime: '2026-06-12T09:00:00Z',
    exitTime: '2026-06-12T09:45:00Z',
    distance: 38.6,
    gantryPoints: generateGantryPoints(22.5, 113.4, 4),
    totalFee: 23.5,
    discountFee: 0,
    actualFee: 0,
    discountType: '无折扣',
    status: '待扣费',
    paymentRetryCount: 0,
    lastPaymentAttempt: null,
    paymentMethod: 'balance',
    autoPayEnabled: false,
    isHolidayFree: true,
    holidayName: '劳动节',
  },
];

export const mockTollStations: TollStation[] = [
  { id: 's001', name: '广州北站', location: { lat: 23.3, lng: 113.2 }, highway: '广清高速', gantryCount: 12 },
  { id: 's002', name: '广州南站', location: { lat: 22.9, lng: 113.3 }, highway: '广珠西线', gantryCount: 15 },
  { id: 's003', name: '深圳北站', location: { lat: 22.6, lng: 114.0 }, highway: '广深高速', gantryCount: 18 },
  { id: 's004', name: '深圳南站', location: { lat: 22.5, lng: 114.1 }, highway: '机荷高速', gantryCount: 16 },
  { id: 's005', name: '东莞站', location: { lat: 23.0, lng: 113.8 }, highway: '莞深高速', gantryCount: 14 },
  { id: 's006', name: '佛山东站', location: { lat: 23.0, lng: 113.1 }, highway: '广佛高速', gantryCount: 11 },
  { id: 's007', name: '珠海北站', location: { lat: 22.3, lng: 113.5 }, highway: '京珠高速', gantryCount: 13 },
  { id: 's008', name: '中山站', location: { lat: 22.5, lng: 113.4 }, highway: '中江高速', gantryCount: 10 },
  { id: 's009', name: '惠州南站', location: { lat: 22.9, lng: 114.4 }, highway: '惠盐高速', gantryCount: 9 },
  { id: 's010', name: '肇庆东站', location: { lat: 23.1, lng: 112.5 }, highway: '广肇高速', gantryCount: 12 },
];

const generateRoutePoints = (start: TollStation, end: TollStation, points: number) => {
  const result = [{ lat: start.location.lat, lng: start.location.lng }];
  const latStep = (end.location.lat - start.location.lat) / (points + 1);
  const lngStep = (end.location.lng - start.location.lng) / (points + 1);
  for (let i = 1; i <= points; i++) {
    result.push({
      lat: start.location.lat + latStep * i + (Math.random() - 0.5) * 0.05,
      lng: start.location.lng + lngStep * i + (Math.random() - 0.5) * 0.05,
    });
  }
  result.push({ lat: end.location.lat, lng: end.location.lng });
  return result;
};

export const generateRoutes = (startId: string, endId: string, vehicleType: number, travelDate: Date): RouteOption[] => {
  const start = mockTollStations.find(s => s.id === startId)!;
  const end = mockTollStations.find(s => s.id === endId)!;
  
  const directDistance = Math.sqrt(
    Math.pow(end.location.lat - start.location.lat, 2) + 
    Math.pow(end.location.lng - start.location.lng, 2)
  ) * 111;

  const holidayInfo = tollEngine.getHolidayInfo(travelDate);
  
  const routes: RouteOption[] = [
    {
      id: 'r1',
      name: '最短路径',
      distance: Math.round(directDistance * 100) / 100,
      estimatedTime: Math.round(directDistance / 1.2),
      totalFee: 0,
      discountFee: 0,
      actualFee: 0,
      isShortest: true,
      tollGates: 6,
      description: '途经广深高速，收费站点少',
      pathPoints: generateRoutePoints(start, end, 6),
    },
    {
      id: 'r2',
      name: '高速优先',
      distance: Math.round(directDistance * 1.15 * 100) / 100,
      estimatedTime: Math.round(directDistance / 1.3),
      totalFee: 0,
      discountFee: 0,
      actualFee: 0,
      isShortest: false,
      tollGates: 8,
      description: '途经沈海高速，路况更好',
      pathPoints: generateRoutePoints(start, end, 8),
    },
    {
      id: 'r3',
      name: '费用最少',
      distance: Math.round(directDistance * 1.08 * 100) / 100,
      estimatedTime: Math.round(directDistance / 1.0),
      totalFee: 0,
      discountFee: 0,
      actualFee: 0,
      isShortest: false,
      tollGates: 4,
      description: '途经部分国道，费用更低',
      pathPoints: generateRoutePoints(start, end, 5),
    },
  ];

  return routes.map(route => {
    const tollResult = tollEngine.calculateToll(route.distance, vehicleType, '储值卡', travelDate);
    return {
      ...route,
      totalFee: tollResult.baseFee,
      discountFee: tollResult.discountFee,
      actualFee: holidayInfo?.isFree ? 0 : tollResult.actualFee,
    };
  });
};

export const mockRechargeMethods: RechargeMethod[] = [
  {
    id: 'm1',
    name: 'NFC手机闪充',
    type: 'nfc',
    description: '将粤通卡贴近手机NFC区域，快速充值写卡',
    icon: 'smartphone',
    available: true,
  },
  {
    id: 'm2',
    name: '蓝牙OBU远程充值',
    type: 'bluetooth',
    description: '连接车载OBU设备，远程完成圈存',
    icon: 'bluetooth',
    available: true,
  },
  {
    id: 'm3',
    name: '在线充值',
    type: 'online',
    description: '在线支付充值，需到网点或使用设备圈存',
    icon: 'credit-card',
    available: true,
  },
];

export const mockRechargeOrders: RechargeOrder[] = [
  {
    id: 'o001',
    cardId: 'c001',
    amount: 200,
    method: '在线充值',
    payChannel: 'wechat',
    status: '已完成',
    createdAt: '2026-06-10T15:30:00Z',
    completedAt: '2026-06-10T15:30:25Z',
  },
  {
    id: 'o002',
    cardId: 'c001',
    amount: 500,
    method: 'NFC手机闪充',
    payChannel: 'alipay',
    status: '已完成',
    createdAt: '2026-06-05T10:15:00Z',
    completedAt: '2026-06-05T10:15:40Z',
  },
  {
    id: 'o003',
    cardId: 'c001',
    amount: 300,
    method: '蓝牙OBU充值',
    payChannel: 'bank',
    status: '已完成',
    createdAt: '2026-05-28T18:45:00Z',
    completedAt: '2026-05-28T18:46:10Z',
  },
];

export const mockOutlets: Outlet[] = [
  {
    id: 'o1',
    name: '粤通卡广州天河服务中心',
    address: '广州市天河区天河东路155号',
    location: { lat: 23.13, lng: 113.35 },
    businessTypes: ['新办', '充值', '故障处理', '激活'],
    businessHours: { weekday: '09:00-18:00', weekend: '09:00-17:00' },
    currentQueue: 8,
    avgWaitTime: 25,
    rating: 4.8,
    phone: '020-88888888',
    distance: 5.2,
  },
  {
    id: 'o2',
    name: '粤通卡深圳福田营业厅',
    address: '深圳市福田区深南大道6011号',
    location: { lat: 22.54, lng: 114.05 },
    businessTypes: ['新办', '充值', '激活'],
    businessHours: { weekday: '09:00-18:00', weekend: '10:00-16:00' },
    currentQueue: 12,
    avgWaitTime: 35,
    rating: 4.6,
    phone: '0755-66666666',
    distance: 8.7,
  },
  {
    id: 'o3',
    name: '粤通卡东莞南城服务点',
    address: '东莞市南城区东莞大道11号',
    location: { lat: 23.02, lng: 113.75 },
    businessTypes: ['充值', '故障处理'],
    businessHours: { weekday: '08:30-17:30', weekend: '09:00-16:00' },
    currentQueue: 3,
    avgWaitTime: 15,
    rating: 4.9,
    phone: '0769-77777777',
    distance: 12.5,
  },
  {
    id: 'o4',
    name: '粤通卡佛山禅城营业厅',
    address: '佛山市禅城区季华五路28号',
    location: { lat: 23.02, lng: 113.12 },
    businessTypes: ['新办', '充值', '故障处理', '激活'],
    businessHours: { weekday: '09:00-18:00', weekend: '休息' },
    currentQueue: 5,
    avgWaitTime: 20,
    rating: 4.7,
    phone: '0757-55555555',
    distance: 18.3,
  },
];

export const mockOBUs: OBU[] = [
  {
    id: 'obu001',
    deviceNo: 'OBU-GD-2024-001234',
    model: '金溢科技-Q8',
    status: '已激活',
    userId: 'u001',
    vehicleId: 'v001',
    activateTime: '2024-03-15T10:30:00Z',
    expiryDate: '2029-03-14',
    lastCheckTime: '2026-06-01T08:00:00Z',
  },
  {
    id: 'obu002',
    deviceNo: 'OBU-GD-2024-001235',
    model: '万集科技-W-115',
    status: '库存',
    userId: null,
    vehicleId: null,
    activateTime: null,
    expiryDate: '2029-12-31',
    lastCheckTime: null,
  },
  {
    id: 'obu003',
    deviceNo: 'OBU-GD-2023-000897',
    model: '金溢科技-Q8',
    status: '故障',
    userId: 'u002',
    vehicleId: 'v002',
    activateTime: '2023-08-20T14:00:00Z',
    expiryDate: '2028-08-19',
    lastCheckTime: '2026-05-28T10:00:00Z',
  },
  {
    id: 'obu004',
    deviceNo: 'OBU-GD-2022-000456',
    model: '聚利科技-JL-108',
    status: '挂失',
    userId: 'u003',
    vehicleId: 'v003',
    activateTime: '2022-05-10T09:30:00Z',
    expiryDate: '2027-05-09',
    lastCheckTime: '2026-04-15T16:00:00Z',
  },
];

export const mockExceptionEvents: ExceptionEvent[] = [
  {
    id: 'e001',
    eventType: '跟车干扰',
    severity: '中',
    description: '车辆通过ETC车道时跟车过近，导致交易失败',
    trafficRecordId: 't005',
    userId: 'u001',
    attribution: '车辆跟车距离不足2米，邻车OBU信号干扰',
    status: '处理中',
    workOrderId: 'w001',
    createdAt: '2026-06-07T12:15:00Z',
    resolvedAt: null,
  },
  {
    id: 'e002',
    eventType: '标签失效',
    severity: '高',
    description: 'OBU标签读取失败，多次重试无效',
    trafficRecordId: null,
    userId: 'u003',
    attribution: 'OBU设备电池电量耗尽，需更换设备',
    status: '待处理',
    workOrderId: 'w002',
    createdAt: '2026-06-10T08:30:00Z',
    resolvedAt: null,
  },
  {
    id: 'e003',
    eventType: '交易失败',
    severity: '中',
    description: '账户扣费失败，需人工干预',
    trafficRecordId: null,
    userId: 'u004',
    attribution: '绑定银行卡余额不足，代扣失败',
    status: '已解决',
    workOrderId: 'w003',
    createdAt: '2026-06-09T16:45:00Z',
    resolvedAt: '2026-06-09T18:00:00Z',
  },
  {
    id: 'e004',
    eventType: '路径异常',
    severity: '低',
    description: '门架数据缺失，路径拟合不完整',
    trafficRecordId: 't003',
    userId: 'u001',
    attribution: 'G1024号门架设备临时故障，数据上传延迟',
    status: '已解决',
    workOrderId: 'w004',
    createdAt: '2026-06-09T10:00:00Z',
    resolvedAt: '2026-06-09T14:30:00Z',
  },
  {
    id: 'e005',
    eventType: '其他',
    severity: '高',
    description: '车辆信息与OBU绑定信息不匹配',
    trafficRecordId: null,
    userId: 'u005',
    attribution: '用户更换车辆后未更新绑定信息',
    status: '处理中',
    workOrderId: 'w005',
    createdAt: '2026-06-11T09:20:00Z',
    resolvedAt: null,
  },
];

export const mockSettlementRecords: SettlementRecord[] = [
  {
    id: 'set001',
    settleDate: '2026-06-11',
    totalTransactions: 125680,
    totalAmount: 8956420.5,
    centerAmount: 6269494.35,
    merchantAmount: 2686926.15,
    status: '已完成',
    diffAmount: 0,
  },
  {
    id: 'set002',
    settleDate: '2026-06-10',
    totalTransactions: 118450,
    totalAmount: 8423150.8,
    centerAmount: 5896205.56,
    merchantAmount: 2526945.24,
    status: '已完成',
    diffAmount: 0,
  },
  {
    id: 'set003',
    settleDate: '2026-06-09',
    totalTransactions: 132100,
    totalAmount: 9125680.25,
    centerAmount: 6387976.17,
    merchantAmount: 2737704.08,
    status: '有差异',
    diffAmount: 2350.5,
  },
  {
    id: 'set004',
    settleDate: '2026-06-08',
    totalTransactions: 108920,
    totalAmount: 7856230.6,
    centerAmount: 5499361.42,
    merchantAmount: 2356869.18,
    status: '已完成',
    diffAmount: 0,
  },
  {
    id: 'set005',
    settleDate: '2026-06-07',
    totalTransactions: 156230,
    totalAmount: 11256890.4,
    centerAmount: 7879823.28,
    merchantAmount: 3377067.12,
    status: '对账中',
    diffAmount: 0,
  },
];

export const mockDashboardStats: DashboardStats = {
  todayTransactions: 125680,
  todayAmount: 8956420.5,
  todayVehicles: 98560,
  activeCards: 1258640,
  abnormalEvents: 23,
  systemHealth: 99.8,
};

export const mockMonthlyTrafficData = [
  { month: '1月', count: 58, amount: 4280, discount: 214 },
  { month: '2月', count: 45, amount: 3320, discount: 166 },
  { month: '3月', count: 62, amount: 4580, discount: 229 },
  { month: '4月', count: 71, amount: 5240, discount: 262 },
  { month: '5月', count: 68, amount: 4980, discount: 249 },
  { month: '6月', count: 52, amount: 3820, discount: 191 },
];

export const mockDailyTrafficData = Array.from({ length: 7 }, (_, i) => ({
  day: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
  vehicles: Math.floor(Math.random() * 50) + 30,
  revenue: Math.floor(Math.random() * 500) + 200,
}));
