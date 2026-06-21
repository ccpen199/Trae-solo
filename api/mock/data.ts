import type {
  User,
  DriverProfile,
  ShipperProfile,
  FreightOrder,
  PrepayOrder,
  SettlementBatch,
  SettlementDetail,
  FuelStation,
  FuelPrice,
  TrackPoint,
  TrackAlert,
  Wallet,
  AddressPoint,
  FuelRedeem,
  Transaction,
  DriverAuthDocs,
  ShipperAuthDocs,
  OrderStatus,
  FuelBrand,
  FuelType,
  TrackAlertType,
  SettlementCycle,
  MatchResult,
} from '../../shared/types';

export type CycleType = 'monthly_1' | 'monthly_11' | 'monthly_21';

export type VerifyPurpose = 'login' | 'register' | 'reset' | 'withdraw';

export interface VerifyCode {
  id: string;
  phone: string;
  code: string;
  purpose: VerifyPurpose;
  createdAt: string;
  expiredAt: string;
  used: boolean;
  usedAt?: string;
}

export type WithdrawStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface WithdrawRequest {
  id: string;
  withdrawNo: string;
  userId: string;
  walletId: string;
  amount: number;
  fee: number;
  actualAmount: number;
  bankCardId: string;
  bankName: string;
  cardNo: string;
  cardHolder: string;
  status: WithdrawStatus;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  failedReason?: string;
}

export type MatchingAction = 'recommend' | 'view' | 'accept' | 'reject' | 'match';

export interface MatchingLog {
  id: string;
  orderId: string;
  driverId: string;
  score: number;
  action: MatchingAction;
  createdAt: string;
}

export interface FuelPlanSegment {
  segmentIndex: number;
  startPoint: { lng: number; lat: number };
  endPoint: { lng: number; lat: number };
  distanceKm: number;
  stationId: string;
  stationName: string;
  fuelType: FuelType;
  liters: number;
  unitPrice: number;
  cost: number;
  saving: number;
  detourKm: number;
}

export interface DataStore {
  users: User[];
  driverProfiles: DriverProfile[];
  shipperProfiles: ShipperProfile[];
  wallets: Wallet[];
  transactions: Transaction[];
  orders: FreightOrder[];
  prepayOrders: PrepayOrder[];
  settlementBatches: SettlementBatch[];
  settlementDetails: SettlementDetail[];
  fuelStations: FuelStation[];
  trackPoints: TrackPoint[];
  trackAlerts: TrackAlert[];
  fuelRedeems: FuelRedeem[];
  withdrawRequests: WithdrawRequest[];
  verifyCodes: VerifyCode[];
  matchingLogs: MatchingLog[];
  counters: {
    order: number;
    batch: number;
    prepay: number;
    withdraw: number;
    tx: number;
  };
}

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(daysAgo: number, daysAfter = 0): string {
  const now = Date.now();
  const start = now - daysAgo * 24 * 60 * 60 * 1000;
  const end = now + daysAfter * 24 * 60 * 60 * 1000;
  return new Date(start + Math.random() * (end - start)).toISOString();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createAddress(
  province: string,
  city: string,
  district: string,
  address: string,
  longitude: number,
  latitude: number,
  contactName?: string,
  contactPhone?: string,
): AddressPoint {
  return {
    id: uuidv4(),
    province,
    city,
    district,
    address,
    longitude,
    latitude,
    contactName,
    contactPhone,
  };
}

const DRIVER_NAMES = ['张伟', '李强', '王磊', '刘洋', '陈建国', '杨军'];
const PLATE_PREFIXES = ['京A', '沪B', '粤C', '川D', '苏E', '浙F'];
const PLATE_SUFFIXES = ['88888', '66666', '99999', '55555', '77777', '33333'];
const VEHICLE_TYPES: Array<{ type: DriverProfile['vehicleType']; length: number; weight: number; volume: number }> = [
  { type: 'truck_4_2', length: 4.2, weight: 5, volume: 18 },
  { type: 'truck_6_8', length: 6.8, weight: 10, volume: 38 },
  { type: 'truck_9_6', length: 9.6, weight: 18, volume: 55 },
  { type: 'truck_13', length: 13, weight: 32, volume: 85 },
  { type: 'truck_17_5', length: 17.5, weight: 40, volume: 120 },
];

const SHIPPER_COMPANIES = [
  { name: '北京鑫通达物流有限公司', uscc: '91110000MA001A1B2C', industry: 'logistics' as const, legalPerson: '赵德胜' },
  { name: '上海恒盛制造集团', uscc: '91310000MA1FL2D3E4', industry: 'manufacturing' as const, legalPerson: '孙丽华' },
  { name: '广州优品汇电子商务有限公司', uscc: '91440101MA59F5G6H7', industry: 'ecommerce' as const, legalPerson: '周文杰' },
  { name: '深圳万家家零售连锁', uscc: '91440300MA5DJ8K9L0', industry: 'retail' as const, legalPerson: '吴海燕' },
  { name: '成都天府绿色农业发展有限公司', uscc: '91510100MA61M2N3P4', industry: 'agriculture' as const, legalPerson: '郑建华' },
  { name: '重庆建工建材有限公司', uscc: '91500000MA5U5Q6R7S', industry: 'construction' as const, legalPerson: '马国富' },
];

const CITIES_DATA: Record<string, { lng: number; lat: number }> = {
  北京: { lng: 116.4074, lat: 39.9042 },
  上海: { lng: 121.4737, lat: 31.2304 },
  广州: { lng: 113.2644, lat: 23.1291 },
  深圳: { lng: 114.0859, lat: 22.547 },
  成都: { lng: 104.0668, lat: 30.5728 },
  重庆: { lng: 106.5516, lat: 29.5628 },
  天津: { lng: 117.2009, lat: 39.0842 },
  杭州: { lng: 120.1551, lat: 30.2741 },
  南京: { lng: 118.7969, lat: 32.0603 },
  武汉: { lng: 114.3054, lat: 30.5931 },
  西安: { lng: 108.9398, lat: 34.3416 },
  济南: { lng: 117.0009, lat: 36.6758 },
  郑州: { lng: 113.6654, lat: 34.7579 },
  长沙: { lng: 112.9823, lat: 28.1941 },
  合肥: { lng: 117.2272, lat: 31.8206 },
  苏州: { lng: 120.6195, lat: 31.299 },
  青岛: { lng: 120.3826, lat: 36.0671 },
  大连: { lng: 121.6186, lat: 38.914 },
  厦门: { lng: 118.0894, lat: 24.4798 },
  昆明: { lng: 102.7123, lat: 25.0406 },
  哈尔滨: { lng: 126.5358, lat: 45.8024 },
  沈阳: { lng: 123.4291, lat: 41.7968 },
  石家庄: { lng: 114.5149, lat: 38.0428 },
  太原: { lng: 112.5489, lat: 37.8706 },
  呼和浩特: { lng: 111.7519, lat: 40.8426 },
};

const ROUTES = [
  { from: '北京', to: '上海', distance: 1200, duration: 14 },
  { from: '广州', to: '深圳', distance: 140, duration: 2 },
  { from: '成都', to: '重庆', distance: 340, duration: 4 },
  { from: '北京', to: '天津', distance: 130, duration: 2 },
  { from: '上海', to: '杭州', distance: 180, duration: 2.5 },
  { from: '南京', to: '上海', distance: 300, duration: 3.5 },
  { from: '北京', to: '济南', distance: 420, duration: 5 },
  { from: '广州', to: '长沙', distance: 700, duration: 8 },
  { from: '武汉', to: '郑州', distance: 520, duration: 6 },
  { from: '西安', to: '成都', distance: 720, duration: 9 },
];

const CARGO_TYPES = ['电子产品', '服装鞋帽', '食品饮料', '日用百货', '建材钢材', '机械设备', '医药冷链', '农副产品', '化工原料', '家具家电'];
const DISTRICTS: Record<string, string[]> = {
  北京: ['朝阳区', '海淀区', '丰台区', '大兴区', '通州区'],
  上海: ['浦东新区', '闵行区', '宝山区', '嘉定区', '松江区'],
  广州: ['天河区', '白云区', '黄埔区', '番禺区', '花都区'],
  深圳: ['南山区', '福田区', '宝安区', '龙岗区', '龙华区'],
  成都: ['武侯区', '锦江区', '青羊区', '金牛区', '高新区'],
  重庆: ['渝北区', '江北区', '南岸区', '九龙坡区', '沙坪坝区'],
  天津: ['滨海新区', '南开区', '河西区', '东丽区', '西青区'],
  杭州: ['西湖区', '余杭区', '萧山区', '拱墅区', '滨江区'],
  南京: ['江宁区', '鼓楼区', '玄武区', '建邺区', '栖霞区'],
  武汉: ['洪山区', '武昌区', '汉阳区', '江岸区', '东西湖区'],
  西安: ['雁塔区', '未央区', '莲湖区', '碑林区', '长安区'],
  济南: ['历下区', '历城区', '天桥区', '槐荫区', '长清区'],
  郑州: ['金水区', '二七区', '管城回族区', '中原区', '惠济区'],
  长沙: ['岳麓区', '雨花区', '芙蓉区', '天心区', '开福区'],
  合肥: ['蜀山区', '包河区', '庐阳区', '瑶海区', '高新区'],
  苏州: ['工业园区', '姑苏区', '吴中区', '相城区', '昆山市'],
  青岛: ['崂山区', '市南区', '市北区', '黄岛区', '城阳区'],
  大连: ['中山区', '西岗区', '沙河口区', '甘井子区', '金州区'],
  厦门: ['思明区', '湖里区', '集美区', '海沧区', '同安区'],
  昆明: ['官渡区', '五华区', '盘龙区', '西山区', '呈贡区'],
  哈尔滨: ['南岗区', '道里区', '道外区', '香坊区', '松北区'],
  沈阳: ['和平区', '沈河区', '铁西区', '皇姑区', '大东区'],
  石家庄: ['长安区', '桥西区', '新华区', '裕华区', '藁城区'],
  太原: ['小店区', '迎泽区', '杏花岭区', '尖草坪区', '万柏林区'],
  呼和浩特: ['新城区', '回民区', '玉泉区', '赛罕区', '金桥开发区'],
};

function generateRandomAddress(city: string): AddressPoint {
  const coords = CITIES_DATA[city] || { lng: 116.4, lat: 39.9 };
  const districts = DISTRICTS[city] || ['市区'];
  const district = pick(districts);
  const streets = ['某某路', '某某大道', '某某街', '某某工业园区', '某某物流园'];
  const streetNo = randomInt(1, 999);
  return createAddress(
    city,
    city,
    district,
    `${district}${pick(streets)}${streetNo}号`,
    coords.lng + randomFloat(-0.15, 0.15, 6),
    coords.lat + randomFloat(-0.15, 0.15, 6),
    pick(['王经理', '李主任', '张主管', '刘总', '陈科长']),
    `138${randomInt(10000000, 99999999)}`,
  );
}

function generateDriverAuthDocs(): DriverAuthDocs {
  const submitted = randomDate(180, 0);
  const audited = new Date(new Date(submitted).getTime() + randomInt(1, 5) * 24 * 60 * 60 * 1000).toISOString();
  return {
    idCardFront: `/uploads/idcard_front_${uuidv4()}.jpg`,
    idCardBack: `/uploads/idcard_back_${uuidv4()}.jpg`,
    driverLicense: `/uploads/driver_license_${uuidv4()}.jpg`,
    qualificationLicense: `/uploads/qualification_${uuidv4()}.jpg`,
    vehicleLicense: `/uploads/vehicle_license_${uuidv4()}.jpg`,
    roadTransportPermit: `/uploads/road_transport_${uuidv4()}.jpg`,
    submittedAt: submitted,
    auditedAt: audited,
    status: 'approved',
    auditRemark: '证件齐全，审核通过',
  };
}

function generateShipperAuthDocs(company: (typeof SHIPPER_COMPANIES)[0]): ShipperAuthDocs {
  const submitted = randomDate(365, 0);
  const audited = new Date(new Date(submitted).getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000).toISOString();
  return {
    businessLicense: `/uploads/business_license_${uuidv4()}.jpg`,
    legalPersonIdFront: `/uploads/legal_id_front_${uuidv4()}.jpg`,
    legalPersonIdBack: `/uploads/legal_id_back_${uuidv4()}.jpg`,
    companyName: company.name,
    unifiedSocialCreditCode: company.uscc,
    submittedAt: submitted,
    auditedAt: audited,
    status: 'approved',
    auditRemark: '资质审核通过',
  };
}

const users: User[] = [];
const driverProfiles: DriverProfile[] = [];
const shipperProfiles: ShipperProfile[] = [];
const wallets: Wallet[] = [];
const transactions: Transaction[] = [];

for (let i = 0; i < 6; i++) {
  const userId = uuidv4();
  const walletId = uuidv4();
  const vehicleInfo = pick(VEHICLE_TYPES);
  const driverName = DRIVER_NAMES[i];
  const creditScore = randomInt(600, 850);
  const driverDocs = generateDriverAuthDocs();
  const homeCity = pick(Object.keys(CITIES_DATA));

  const user: User = {
    id: userId,
    role: 'driver',
    phone: `1390000${String(i + 1).padStart(4, '0')}`,
    nickname: `老${driverName.charAt(0)}师傅`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    realName: driverName,
    idCardNo: `110101${randomInt(1975, 1990)}${String(randomInt(101, 1231)).padStart(4, '0')}${String(randomInt(100, 9999)).padStart(4, '0')}`,
    creditScore,
    createdAt: randomDate(730, 0),
    lastLoginAt: randomDate(0, 0),
    driverDocs,
    walletId,
  };
  users.push(user);

  const totalOrders = randomInt(80, 350);
  const completedOrders = Math.floor(totalOrders * randomFloat(0.88, 0.98, 2));
  const profile: DriverProfile = {
    userId,
    realName: driverName,
    idCardNo: user.idCardNo!,
    driverLicenseNo: `A1${randomInt(100000, 999999)}`,
    qualificationLicenseNo: `交运资字第${randomInt(100000, 999999)}号`,
    vehiclePlateNo: `${PLATE_PREFIXES[i % PLATE_PREFIXES.length]}${PLATE_SUFFIXES[i % PLATE_SUFFIXES.length]}`,
    vehicleType: vehicleInfo.type,
    vehicleLength: vehicleInfo.length,
    vehicleWeight: vehicleInfo.weight,
    vehicleVolume: vehicleInfo.volume,
    totalOrders,
    completedOrders,
    totalMileage: randomInt(50000, 500000),
    drivingYears: randomInt(5, 20),
    preferredRoutes: ['京沪线', '沪蓉线', '京深线', '成渝线', '沪昆线'].slice(0, randomInt(2, 4)),
    preferredCargoTypes: CARGO_TYPES.slice(0, randomInt(3, 6)),
    homeAddress: generateRandomAddress(homeCity),
    currentLocation: generateRandomAddress(pick(Object.keys(CITIES_DATA))),
    rating: randomFloat(4.2, 5.0, 1),
  };
  driverProfiles.push(profile);

  const balance = randomFloat(2000, 58000, 2);
  const wallet: Wallet = {
    id: walletId,
    userId,
    balance,
    frozenAmount: randomFloat(0, 5000, 2),
    availableCredit: randomInt(10000, 80000),
    usedCredit: randomInt(0, 20000),
    totalIncome: randomFloat(50000, 500000, 2),
    totalExpense: randomFloat(20000, 200000, 2),
    lastUpdatedAt: randomDate(0, 0),
    bankCards: [
      {
        id: uuidv4(),
        bankName: pick(['中国工商银行', '中国建设银行', '中国农业银行', '招商银行', '交通银行']),
        cardNo: `6222${randomInt(1000, 9999)}${randomInt(1000, 9999)}${randomInt(1000, 9999)}`,
        cardHolder: driverName,
        isDefault: true,
        bindTime: randomDate(700, 0),
      },
    ],
  };
  wallets.push(wallet);
}

for (let i = 0; i < 6; i++) {
  const userId = uuidv4();
  const walletId = uuidv4();
  const company = SHIPPER_COMPANIES[i];
  const creditScore = randomInt(650, 880);
  const baseCity = pick(Object.keys(CITIES_DATA));
  const shipperDocs = generateShipperAuthDocs(company);

  const user: User = {
    id: userId,
    role: 'shipper',
    phone: `1860000${String(i + 1).padStart(4, '0')}`,
    nickname: company.name.substring(0, 6),
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${userId}`,
    realName: company.legalPerson,
    idCardNo: `110101${randomInt(1965, 1985)}${String(randomInt(101, 1231)).padStart(4, '0')}${String(randomInt(100, 9999)).padStart(4, '0')}`,
    creditScore,
    createdAt: randomDate(730, 0),
    lastLoginAt: randomDate(0, 0),
    shipperDocs,
    walletId,
  };
  users.push(user);

  const totalOrders = randomInt(120, 800);
  const profile: ShipperProfile = {
    userId,
    companyName: company.name,
    unifiedSocialCreditCode: company.uscc,
    legalPersonName: company.legalPerson,
    industry: company.industry,
    companyAddress: generateRandomAddress(baseCity),
    contactName: pick(['张经理', '李总', '王主任', '刘主管', '陈总']),
    contactPosition: pick(['物流经理', '运营总监', '采购主管', '供应链经理', '副总经理']),
    contactPhone: `186${randomInt(10000000, 99999999)}`,
    totalOrders,
    totalFreightAmount: randomFloat(500000, 5000000, 2),
    rating: randomFloat(4.0, 5.0, 1),
    settlementCycle: pick(['daily', 'weekly', 'monthly'] as const),
    contractStartDate: randomDate(730, 0),
    contractEndDate: randomDate(0, 365),
  };
  shipperProfiles.push(profile);

  const balance = randomFloat(5000, 350000, 2);
  const wallet: Wallet = {
    id: walletId,
    userId,
    balance,
    frozenAmount: randomFloat(0, 50000, 2),
    availableCredit: randomInt(50000, 500000),
    usedCredit: randomInt(0, 100000),
    totalIncome: 0,
    totalExpense: randomFloat(200000, 5000000, 2),
    lastUpdatedAt: randomDate(0, 0),
    bankCards: [
      {
        id: uuidv4(),
        bankName: pick(['中国工商银行', '中国建设银行', '招商银行', '浦发银行', '民生银行']),
        cardNo: `6228${randomInt(1000, 9999)}${randomInt(1000, 9999)}${randomInt(1000, 9999)}`,
        cardHolder: company.name,
        isDefault: true,
        bindTime: randomDate(700, 0),
      },
    ],
  };
  wallets.push(wallet);
}

for (let i = 0; i < 2; i++) {
  const userId = uuidv4();
  const walletId = uuidv4();
  const adminNames = ['系统管理员', '运营主管'];
  const name = adminNames[i];

  const user: User = {
    id: userId,
    role: 'admin',
    phone: `180${String(10000000 + i * 1234567).padStart(8, '0')}`,
    nickname: name,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=admin${i}`,
    realName: name,
    idCardNo: `110101198${5 + i}0101${String(1000 + i * 123).padStart(4, '0')}`,
    creditScore: 900 + i * 20,
    createdAt: randomDate(1000, 0),
    lastLoginAt: randomDate(0, 0),
    walletId,
  };
  users.push(user);

  const wallet: Wallet = {
    id: walletId,
    userId,
    balance: 0,
    frozenAmount: 0,
    availableCredit: 0,
    usedCredit: 0,
    totalIncome: 0,
    totalExpense: 0,
    lastUpdatedAt: randomDate(0, 0),
    bankCards: [],
  };
  wallets.push(wallet);
}

const driverUsers = users.filter((u) => u.role === 'driver');
const shipperUsers = users.filter((u) => u.role === 'shipper');

const orders: FreightOrder[] = [];
const orderStatuses: OrderStatus[] = [
  'published',
  'published',
  'matched',
  'loading',
  'in_transit',
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
];

for (let i = 0; i < 20; i++) {
  const route = pick(ROUTES);
  const shipper = pick(shipperUsers);
  const status = orderStatuses[i % orderStatuses.length];
  const driver = status === 'published' ? undefined : pick(driverUsers);
  const cargoType = pick(CARGO_TYPES);
  const freightAmount = route.distance * randomFloat(3.5, 7.0, 2);
  const prepayRatio = pick([0.2, 0.25, 0.3, 0.35, 0.4]);
  const prepayMaxAmount = Math.min(freightAmount * prepayRatio, 30000);
  const vehicleReq = pick(VEHICLE_TYPES);
  const pickupPoint = generateRandomAddress(route.from);
  const deliveryPoint = generateRandomAddress(route.to);

  const publishedAt = randomDate(status === 'completed' ? 60 : 7, status === 'published' ? 0 : 0);
  const publishedDate = new Date(publishedAt);
  const matchedAt = status !== 'published' ? new Date(publishedDate.getTime() + randomInt(1, 24) * 60 * 60 * 1000).toISOString() : undefined;
  const loadedAt = ['loading', 'in_transit', 'completed'].includes(status) ? new Date(publishedDate.getTime() + randomInt(24, 48) * 60 * 60 * 1000).toISOString() : undefined;
  const departedAt = ['in_transit', 'completed'].includes(status) ? new Date(publishedDate.getTime() + randomInt(26, 52) * 60 * 60 * 1000).toISOString() : undefined;
  const arrivedAtDate = status === 'completed' ? new Date(publishedDate.getTime() + (route.duration + randomInt(2, 10)) * 60 * 60 * 1000) : undefined;
  const arrivedAt = arrivedAtDate ? arrivedAtDate.toISOString() : undefined;
  const completedAt = status === 'completed' ? new Date((arrivedAtDate ?? publishedDate).getTime() + randomInt(1, 6) * 60 * 60 * 1000).toISOString() : undefined;

  orders.push({
    id: uuidv4(),
    orderNo: `FY${new Date().getFullYear()}${String(randomInt(10000000, 99999999))}`,
    shipperId: shipper.id,
    driverId: driver?.id,
    title: `${route.from}→${route.to} ${cargoType}运输`,
    cargoType,
    cargoWeight: randomFloat(vehicleReq.weight * 0.6, vehicleReq.weight * 0.95, 2),
    cargoVolume: randomFloat(vehicleReq.volume * 0.5, vehicleReq.volume * 0.9, 2),
    vehicleTypeRequired: vehicleReq.type,
    pickupPoint,
    deliveryPoint,
    pickupStartTime: new Date(publishedDate.getTime() + randomInt(12, 36) * 60 * 60 * 1000).toISOString(),
    pickupEndTime: new Date(publishedDate.getTime() + randomInt(36, 60) * 60 * 60 * 1000).toISOString(),
    deliveryDeadline: new Date(publishedDate.getTime() + (route.duration + randomInt(12, 36)) * 60 * 60 * 1000).toISOString(),
    freightAmount: parseFloat(freightAmount.toFixed(2)),
    prepayRatio,
    prepayMaxAmount: parseFloat(prepayMaxAmount.toFixed(2)),
    insuranceRequired: Math.random() > 0.5,
    insuranceAmount: Math.random() > 0.5 ? parseFloat((freightAmount * 0.003).toFixed(2)) : undefined,
    status,
    distanceKm: route.distance,
    estimatedDurationHours: route.duration,
    remark: pick(['需冷藏运输', '需防雨', '易碎品', '准时送达', '需夜间卸货', '']),
    publishedAt,
    matchedAt,
    loadedAt,
    departedAt,
    arrivedAt,
    completedAt,
  });
}

const completedOrders = orders.filter((o) => o.status === 'completed' && o.driverId);
const prepayOrders: PrepayOrder[] = [];

for (let i = 0; i < 12; i++) {
  const order = completedOrders[i % completedOrders.length] || orders[i % orders.length];
  const driver = driverUsers.find((u) => u.id === order.driverId) || driverUsers[0];
  const shipper = shipperUsers.find((u) => u.id === order.shipperId) || shipperUsers[0];
  const driverProfile = driverProfiles.find((p) => p.userId === driver.id)!;
  const completionRate = driverProfile.completedOrders / driverProfile.totalOrders;

  let riskScore = Math.round(
    driver.creditScore * 0.4 +
      completionRate * 100 * 0.3 +
      (order.distanceKm < 500 ? 90 : order.distanceKm < 1000 ? 75 : 60) * 0.2 +
      shipper.creditScore * 0.1,
  );
  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel: PrepayOrder['riskLevel'];
  const riskReasons: string[] = [];
  if (riskScore >= 85) {
    riskLevel = 'low';
    riskReasons.push('司机信用良好', '历史完成率高', '货主资质优质');
  } else if (riskScore >= 70) {
    riskLevel = 'medium';
    riskReasons.push('司机信用正常', '需关注运单时效');
  } else if (riskScore >= 55) {
    riskLevel = 'high';
    riskReasons.push('司机信用分偏低', '建议人工审核');
  } else {
    riskLevel = 'reject';
    riskReasons.push('司机信用不足', '运单风险过高');
  }

  const requestedAmount = Math.min(order.prepayMaxAmount, order.freightAmount * 0.4);
  const approvedAmount = riskLevel === 'reject' ? 0 : requestedAmount * (riskScore / 100);
  const statusMap: Record<PrepayOrder['riskLevel'], PrepayOrder['status']> = {
    low: randomInt(0, 1) === 0 ? 'disbursed' : 'settled',
    medium: randomInt(0, 1) === 0 ? 'approved' : 'risk_approved',
    high: 'pending',
    reject: 'rejected',
  };
  const status = statusMap[riskLevel];
  const requestedAt = order.publishedAt;
  const riskEvaluatedAt = new Date(new Date(requestedAt).getTime() + randomInt(10, 120) * 60 * 1000).toISOString();
  const approvedAt = ['risk_approved', 'approved', 'disbursed', 'settled'].includes(status) ? riskEvaluatedAt : undefined;
  const disbursedAt = ['disbursed', 'settled'].includes(status) ? new Date(new Date(approvedAt!).getTime() + randomInt(30, 240) * 60 * 1000).toISOString() : undefined;
  const settledAt = status === 'settled' ? (order.completedAt || disbursedAt) : undefined;

  prepayOrders.push({
    id: uuidv4(),
    prepayNo: `YZ${new Date().getFullYear()}${String(randomInt(10000000, 99999999))}`,
    orderId: order.id,
    driverId: driver.id,
    shipperId: shipper.id,
    requestedAmount: parseFloat(requestedAmount.toFixed(2)),
    approvedAmount: parseFloat(approvedAmount.toFixed(2)),
    disbursedAmount: parseFloat((status === 'disbursed' || status === 'settled' ? approvedAmount : 0).toFixed(2)),
    riskScore,
    riskLevel,
    riskReasons,
    status,
    requestedAt,
    riskEvaluatedAt,
    approvedAt,
    disbursedAt,
    settledAt,
    rejectReason: status === 'rejected' ? '综合风险评分不足，未通过审批' : undefined,
  });
}

const settlementBatches: SettlementBatch[] = [];
const settlementDetails: SettlementDetail[] = [];
const cycles: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

for (let i = 0; i < 3; i++) {
  const cycle = cycles[i];
  const now = new Date();
  let cycleDays: number;
  switch (cycle) {
    case 'daily':
      cycleDays = 1;
      break;
    case 'weekly':
      cycleDays = 7;
      break;
    case 'monthly':
      cycleDays = 30;
      break;
  }
  const cycleEndDate = new Date(now.getTime() - i * cycleDays * 24 * 60 * 60 * 1000);
  const cycleStartDate = new Date(cycleEndDate.getTime() - cycleDays * 24 * 60 * 60 * 1000);

  const batchId = uuidv4();
  const batchDetailCount = i === 0 ? 20 : i === 1 ? 18 : 12;

  let totalFreight = 0;
  let totalFuel = 0;
  let totalEtc = 0;
  let totalPrepay = 0;
  let totalNet = 0;

  for (let j = 0; j < batchDetailCount; j++) {
    const order = completedOrders[j % completedOrders.length] || orders[j % orders.length];
    const driver = driverUsers.find((u) => u.id === order.driverId) || driverUsers[j % driverUsers.length];
    const shipper = shipperUsers.find((u) => u.id === order.shipperId) || shipperUsers[j % shipperUsers.length];
    const freightAmount = order.freightAmount;
    const fuelAmount = parseFloat((freightAmount * randomFloat(0.15, 0.3, 2)).toFixed(2));
    const etcAmount = parseFloat((randomInt(50, 800)).toFixed(2));
    const prepayDeduction = parseFloat((prepayOrders.find((p) => p.orderId === order.id)?.disbursedAmount || 0).toFixed(2));
    const insuranceAmount = order.insuranceAmount || 0;
    const platformFee = parseFloat((freightAmount * 0.02).toFixed(2));
    const netAmount = parseFloat((freightAmount - fuelAmount - etcAmount - prepayDeduction - insuranceAmount - platformFee).toFixed(2));

    totalFreight += freightAmount;
    totalFuel += fuelAmount;
    totalEtc += etcAmount;
    totalPrepay += prepayDeduction;
    totalNet += netAmount;

    settlementDetails.push({
      id: uuidv4(),
      batchId,
      orderId: order.id,
      orderNo: order.orderNo,
      driverId: driver.id,
      driverName: driver.realName || driver.nickname,
      shipperId: shipper.id,
      shipperName: shipper.realName || shipper.nickname,
      freightAmount,
      fuelAmount,
      etcAmount,
      prepayDeduction,
      insuranceAmount,
      platformFee,
      netAmount,
      remark: j % 5 === 0 ? '正常结算' : undefined,
    });
  }

  settlementBatches.push({
    id: batchId,
    batchNo: `JS${cycle.substring(0, 1).toUpperCase()}${String(randomInt(100000, 999999))}`,
    cycle,
    cycleStartDate: cycleStartDate.toISOString(),
    cycleEndDate: cycleEndDate.toISOString(),
    status: i === 0 ? 'processing' : 'completed',
    totalOrders: batchDetailCount,
    totalFreightAmount: parseFloat(totalFreight.toFixed(2)),
    totalFuelAmount: parseFloat(totalFuel.toFixed(2)),
    totalEtcAmount: parseFloat(totalEtc.toFixed(2)),
    totalPrepayDeduction: parseFloat(totalPrepay.toFixed(2)),
    totalNetAmount: parseFloat(totalNet.toFixed(2)),
    generatedAt: cycleEndDate.toISOString(),
    processedAt: i !== 0 ? new Date(cycleEndDate.getTime() + randomInt(2, 8) * 60 * 60 * 1000).toISOString() : undefined,
    completedAt: i !== 0 ? new Date(cycleEndDate.getTime() + randomInt(12, 24) * 60 * 60 * 1000).toISOString() : undefined,
    processedBy: i !== 0 ? 'system' : undefined,
  });
}

const fuelBrands: FuelBrand[] = ['sinopec', 'cnpc', 'shell'];
const brandNames: Record<FuelBrand, string> = {
  sinopec: '中国石化',
  cnpc: '中国石油',
  shell: '壳牌',
};
const fuelTypes: FuelType[] = ['gasoline_92', 'gasoline_95', 'gasoline_98', 'diesel_0', 'diesel_-10'];
const fuelBasePrices: Record<FuelType, number> = Object.fromEntries([
  ['gasoline_92', 7.5],
  ['gasoline_95', 8.0],
  ['gasoline_98', 8.9],
  ['diesel_0', 7.2],
  ['diesel_-10', 7.8],
] as Array<[FuelType, number]>) as Record<FuelType, number>;

const fuelStations: FuelStation[] = [];
const allCities = Object.keys(CITIES_DATA);

for (let i = 0; i < 50; i++) {
  const brand = fuelBrands[i % fuelBrands.length];
  const city = allCities[i % allCities.length];
  const coords = CITIES_DATA[city];
  const districts = DISTRICTS[city] || ['市区'];
  const district = pick(districts);
  const stationId = uuidv4();
  const stationNo = String(randomInt(1, 999)).padStart(3, '0');

  const prices: FuelPrice[] = fuelTypes.map((ft) => {
    const basePrice = fuelBasePrices[ft];
    const original = parseFloat((basePrice + randomFloat(-0.3, 0.5, 2)).toFixed(2));
    return {
      stationId,
      fuelType: ft,
      price: parseFloat((original * randomFloat(0.92, 0.98, 4)).toFixed(2)),
      originalPrice: original,
      updatedAt: randomDate(7, 0),
      effectiveDate: randomDate(0, 30),
    };
  });

  fuelStations.push({
    id: stationId,
    name: `${brandNames[brand]}${city}${district}第${stationNo}站`,
    brand,
    address: {
      id: uuidv4(),
      province: city,
      city,
      district,
      address: `${district}${pick(['交通路', '环城路', '国道', '高速口', '开发区'])}${randomInt(1, 999)}号`,
      longitude: coords.lng + randomFloat(-0.2, 0.2, 6),
      latitude: coords.lat + randomFloat(-0.2, 0.2, 6),
    },
    phone: `0${randomInt(10, 99)}-${randomInt(1000000, 9999999)}`,
    openHours: pick(['24小时营业', '06:00-24:00', '全天营业']),
    services: pick([
      ['便利店', '洗车', '卫生间', 'ETC充值', '餐厅'],
      ['便利店', '卫生间', 'ETC充值'],
      ['便利店', '洗车', '卫生间', '充电桩'],
      ['便利店', '卫生间', 'ATM', 'ETC充值'],
    ]),
    rating: randomFloat(4.0, 5.0, 1),
    isRecommended: i % 5 === 0,
    prices,
  });
}

const trackPoints: TrackPoint[] = [];
const trackAlerts: TrackAlert[] = [];

const jinghuStart = CITIES_DATA['北京'];
const jinghuEnd = CITIES_DATA['上海'];
const trackingOrder = orders.find((o) => o.status === 'in_transit') || orders[0];
const trackingDriver = driverUsers.find((u) => u.id === trackingOrder.driverId) || driverUsers[0];

for (let i = 0; i < 300; i++) {
  const progress = i / 300;
  const baseTime = new Date(trackingOrder.departedAt || trackingOrder.publishedAt);
  const timestamp = new Date(baseTime.getTime() + i * 3 * 60 * 1000).toISOString();
  const lng = jinghuStart.lng + (jinghuEnd.lng - jinghuStart.lng) * progress + randomFloat(-0.05, 0.05, 6);
  const lat = jinghuStart.lat + (jinghuEnd.lat - jinghuStart.lat) * progress + randomFloat(-0.05, 0.05, 6);

  trackPoints.push({
    id: uuidv4(),
    orderId: trackingOrder.id,
    driverId: trackingDriver.id,
    timestamp,
    longitude: lng,
    latitude: lat,
    speed: parseFloat(randomFloat(40, 95, 1).toFixed(1)),
    heading: randomInt(0, 360),
    altitude: randomInt(10, 200),
  });
}

const alertTypes: { type: TrackAlertType; level: TrackAlert['level']; titles: string[]; descs: string[] }[] = [
  {
    type: 'speeding',
    level: 'warning',
    titles: ['超速行驶告警', '车辆超过限速'],
    descs: ['当前时速超过限速20%，请减速慢行', '路段限速80km/h，实际速度98km/h'],
  },
  {
    type: 'fatigue',
    level: 'danger',
    titles: ['疲劳驾驶预警', '连续驾驶超时'],
    descs: ['已连续驾驶4.5小时，建议立即休息', '超过法定连续驾驶时间，请就近休息20分钟以上'],
  },
  {
    type: 'deviation',
    level: 'warning',
    titles: ['路线偏离提醒', '偏离规划路线'],
    descs: ['当前位置偏离规划路线3.2公里，建议确认路线', '疑似偏离最优路径，请核查是否绕行'],
  },
  {
    type: 'geofence_exit',
    level: 'info',
    titles: ['电子围栏驶出', '离开指定区域'],
    descs: ['车辆已驶出装货区域电子围栏', '正常离开指定区域，如非计划请关注'],
  },
  {
    type: 'emergency',
    level: 'danger',
    titles: ['紧急求助警报', 'SOS紧急信号'],
    descs: ['司机触发SOS紧急按钮，请立即联系确认', '收到紧急求助信号，请启动应急预案'],
  },
  {
    type: 'sensor_abnormal',
    level: 'warning',
    titles: ['传感器异常', '车辆状态告警'],
    descs: ['检测到胎压异常，请尽快检查', '水温传感器读数偏高，建议停车检查'],
  },
];

for (let i = 0; i < 20; i++) {
  const alertInfo = alertTypes[i % alertTypes.length];
  const progress = randomFloat(0.1, 0.9, 2);
  const baseTime = new Date(trackingOrder.departedAt || trackingOrder.publishedAt);
  trackAlerts.push({
    id: uuidv4(),
    orderId: trackingOrder.id,
    driverId: trackingDriver.id,
    type: alertInfo.type,
    level: alertInfo.level,
    title: pick(alertInfo.titles),
    description: pick(alertInfo.descs),
    longitude: jinghuStart.lng + (jinghuEnd.lng - jinghuStart.lng) * progress,
    latitude: jinghuStart.lat + (jinghuEnd.lat - jinghuStart.lat) * progress,
    timestamp: new Date(baseTime.getTime() + progress * 14 * 60 * 60 * 1000).toISOString(),
    acknowledged: i % 3 !== 0,
    acknowledgedAt: i % 3 !== 0 ? new Date(baseTime.getTime() + progress * 14 * 60 * 60 * 1000 + randomInt(5, 30) * 60 * 1000).toISOString() : undefined,
    acknowledgedBy: i % 3 !== 0 ? pick(['dispatcher01', 'monitor02', 'admin']) : undefined,
  });
}

const fuelRedeems: FuelRedeem[] = [];
for (let i = 0; i < 10; i++) {
  const order = orders[i % orders.length];
  const driver = driverUsers[i % driverUsers.length];
  const station = fuelStations[i % fuelStations.length];
  const fuelType: FuelType = pick(['diesel_0', 'diesel_-10']);
  const price = station.prices.find((p) => p.fuelType === fuelType) || station.prices[0];
  const liters = randomInt(100, 600);
  const issuedAt = order.publishedAt;
  const redeemed = i % 3 !== 2;

  fuelRedeems.push({
    id: uuidv4(),
    orderId: order.id,
    driverId: driver.id,
    stationId: station.id,
    stationName: station.name,
    fuelType,
    liters,
    unitPrice: price.price,
    totalAmount: parseFloat((liters * price.price).toFixed(2)),
    redeemCode: `FR${randomInt(100000, 999999)}`,
    status: redeemed ? (i % 3 === 0 ? 'redeemed' : 'issued') : 'expired',
    issuedAt,
    redeemedAt: redeemed ? new Date(new Date(issuedAt).getTime() + randomInt(6, 72) * 60 * 60 * 1000).toISOString() : undefined,
    expiredAt: new Date(new Date(issuedAt).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

export const mockUsers: User[] = users;
export const mockDriverProfiles: DriverProfile[] = driverProfiles;
export const mockShipperProfiles: ShipperProfile[] = shipperProfiles;
export const mockOrders: FreightOrder[] = orders;
export const mockPrepayOrders: PrepayOrder[] = prepayOrders;
export const mockSettlementBatches: SettlementBatch[] = settlementBatches;
export const mockSettlementDetails: SettlementDetail[] = settlementDetails;
export const mockFuelStations: FuelStation[] = fuelStations;
export const mockTrackPoints: TrackPoint[] = trackPoints;
export const mockTrackAlerts: TrackAlert[] = trackAlerts;
export const mockWallets: Wallet[] = wallets;
export const mockTransactions: Transaction[] = transactions;
export const mockFuelRedeems: FuelRedeem[] = fuelRedeems;

export function getDriverUserById(id: string): User | undefined {
  return users.find((u) => u.id === id && u.role === 'driver');
}

export function getShipperUserById(id: string): User | undefined {
  return users.find((u) => u.id === id && u.role === 'shipper');
}

export function getDriverProfile(userId: string): DriverProfile | undefined {
  return driverProfiles.find((p) => p.userId === userId);
}

export function getShipperProfile(userId: string): ShipperProfile | undefined {
  return shipperProfiles.find((p) => p.userId === userId);
}

export function getWalletByUserId(userId: string): Wallet | undefined {
  return wallets.find((w) => w.userId === userId);
}

export function getOrdersByDriver(driverId: string): FreightOrder[] {
  return orders.filter((o) => o.driverId === driverId);
}

export function getOrdersByShipper(shipperId: string): FreightOrder[] {
  return orders.filter((o) => o.shipperId === shipperId);
}

export function getCompletedOrders(): FreightOrder[] {
  return orders.filter((o) => o.status === 'completed');
}

const withdrawRequests: WithdrawRequest[] = (() => {
  const list: WithdrawRequest[] = [];
  for (let i = 0; i < 5; i++) {
    const driver = driverUsers[i % driverUsers.length];
    const wallet = wallets.find(w => w.userId === driver.id)!;
    const card = wallet.bankCards[0];
    const amount = randomInt(500, 15000);
    const fee = parseFloat((amount * 0.001).toFixed(2));
    list.push({
      id: uuidv4(),
      withdrawNo: `TX${new Date().getFullYear()}${String(randomInt(100000, 999999))}`,
      userId: driver.id,
      walletId: wallet.id,
      amount,
      fee,
      actualAmount: parseFloat((amount - fee).toFixed(2)),
      bankCardId: card?.id || uuidv4(),
      bankName: card?.bankName || '中国工商银行',
      cardNo: card?.cardNo || '6222****8888',
      cardHolder: card?.cardHolder || driver.realName || '',
      status: (['pending', 'processing', 'completed', 'completed', 'failed'] as const)[i],
      requestedAt: randomDate(30, 0),
      processedAt: i > 0 ? randomDate(20, 0) : undefined,
      completedAt: i >= 2 ? randomDate(20, 0) : undefined,
      failedReason: i === 4 ? '银行卡信息有误，提现失败' : undefined,
    });
  }
  return list;
})();

const verifyCodes: VerifyCode[] = [];
const matchingLogs: MatchingLog[] = (() => {
  const list: MatchingLog[] = [];
  const actions: MatchingLog['action'][] = ['recommend', 'view', 'accept', 'reject', 'match'];
  for (let i = 0; i < 30; i++) {
    const order = orders[i % orders.length];
    const driver = driverUsers[i % driverUsers.length];
    list.push({
      id: uuidv4(),
      orderId: order.id,
      driverId: driver.id,
      score: randomInt(60, 98),
      action: actions[i % actions.length],
      createdAt: randomDate(15, 0),
    });
  }
  return list;
})();

const counters = {
  order: 10000000,
  batch: 1000,
  prepay: 1000,
  withdraw: 1000,
  tx: 10000000,
};

export const db: DataStore = {
  users,
  driverProfiles,
  shipperProfiles,
  wallets,
  transactions,
  orders,
  prepayOrders,
  settlementBatches,
  settlementDetails,
  fuelStations,
  trackPoints,
  trackAlerts,
  fuelRedeems,
  withdrawRequests,
  verifyCodes,
  matchingLogs,
  counters,
};

export function genOrderNo(): string {
  counters.order += 1;
  return `FY${new Date().getFullYear()}${String(counters.order).padStart(8, '0')}`;
}

export function genBatchNo(cycle: CycleType = 'monthly_1'): string {
  counters.batch += 1;
  const cycleSuffix = cycle === 'monthly_1' ? '01' : cycle === 'monthly_11' ? '11' : '21';
  const yyyymm = new Date().toISOString().slice(0, 7).replace('-', '');
  return `SB${yyyymm}${cycleSuffix}${String(counters.batch).padStart(4, '0')}`;
}

export function genPrepayNo(): string {
  counters.prepay += 1;
  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `PP${yyyymmdd}${String(counters.prepay).padStart(6, '0')}`;
}

export function genTxNo(): string {
  counters.tx += 1;
  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `TX${yyyymmdd}${String(counters.tx).padStart(8, '0')}`;
}
