export interface User {
  id: string;
  name: string;
  phone: string;
  idCard: string;
  verified: boolean;
  createdAt: string;
}

export interface EtcCard {
  id: string;
  cardNo: string;
  type: '记账卡' | '储值卡';
  balance: number;
  status: '正常' | '挂失' | '冻结' | '过期';
  userId: string;
  vehicleId: string;
  expiryDate: string;
  autoPayEnabled?: boolean;
}

export interface Vehicle {
  id: string;
  plateNo: string;
  plateType: string;
  vehicleType: number;
  seats: number;
  userId: string;
}

export interface GantryPoint {
  id: string;
  gantryNo: string;
  location: { lat: number; lng: number };
  passTime: string;
  sectionFee: number;
}

export interface TrafficRecord {
  id: string;
  cardId: string;
  vehicleId: string;
  entryStation: string;
  exitStation: string;
  entryTime: string;
  exitTime: string;
  distance: number;
  gantryPoints: GantryPoint[];
  totalFee: number;
  discountFee: number;
  actualFee: number;
  discountType: '95折' | '85折' | '无折扣';
  status: '已完成' | '待扣费' | '异常';
  paymentRetryCount?: number;
  lastPaymentAttempt?: string | null;
  paymentMethod?: 'balance' | 'autopay' | 'wechat' | 'alipay';
  autoPayEnabled?: boolean;
  isHolidayFree?: boolean;
  holidayName?: string;
  paymentFailureReason?: string;
  paymentFailureCode?: string;
  autoPayTriggered?: boolean;
  autoPayTriggeredAt?: string | null;
  autoPayResult?: 'success' | 'failed' | 'pending' | null;
  lowBalanceWarning?: boolean;
  lowBalanceWarningAt?: string | null;
}

export interface AutoPayConfig {
  enabled: boolean;
  threshold: number;
  rechargeAmount: number;
  payChannel: 'wechat' | 'alipay' | 'bank';
  wechatAuthorized: boolean;
  alipayAuthorized: boolean;
  bankAuthorized: boolean;
  lastTriggeredAt?: string | null;
  totalAutoRechargeCount: number;
  totalAutoRechargeAmount: number;
}

export interface TollCalculateRequest {
  startStationId: string;
  endStationId: string;
  vehicleType: number;
  travelDate: string;
}

export interface RouteOption {
  id: string;
  name: string;
  distance: number;
  estimatedTime: number;
  totalFee: number;
  discountFee: number;
  actualFee: number;
  isShortest: boolean;
  tollGates: number;
  description: string;
  pathPoints: { lat: number; lng: number }[];
}

export interface TollCalculateResponse {
  routes: RouteOption[];
  holidayInfo: {
    isFree: boolean;
    holidayName: string;
    freePeriod: string;
  } | null;
}

export interface TollResult {
  baseFee: number;
  discount: number;
  discountFee: number;
  actualFee: number;
  isHolidayFree: boolean;
  holidayName: string | null;
  discountType?: string;
}

export interface RechargeMethod {
  id: string;
  name: string;
  type: 'nfc' | 'bluetooth' | 'online';
  description: string;
  icon: string;
  available: boolean;
}

export interface RechargeOrder {
  id: string;
  cardId: string;
  amount: number;
  method: string;
  payChannel: 'wechat' | 'alipay' | 'bank';
  status: '待支付' | '支付中' | '已完成' | '已失败';
  createdAt: string;
  completedAt: string | null;
}

export interface Outlet {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  businessTypes: ('新办' | '充值' | '故障处理' | '激活')[];
  businessHours: {
    weekday: string;
    weekend: string;
  };
  currentQueue: number;
  avgWaitTime: number;
  rating: number;
  phone: string;
  distance?: number;
}

export interface Appointment {
  id: string;
  outletId: string;
  userId: string;
  businessType: string;
  queueNo: string;
  appointmentTime: string;
  status: '等待中' | '叫号中' | '已完成' | '已取消';
  currentNumber: number;
  aheadCount: number;
}

export interface SettlementRecord {
  id: string;
  settleDate: string;
  totalTransactions: number;
  totalAmount: number;
  centerAmount: number;
  merchantAmount: number;
  status: '待对账' | '对账中' | '已完成' | '有差异';
  diffAmount: number;
}

export interface OBU {
  id: string;
  deviceNo: string;
  model: string;
  status: '库存' | '已激活' | '挂失' | '故障' | '已报废';
  userId: string | null;
  vehicleId: string | null;
  activateTime: string | null;
  expiryDate: string;
  lastCheckTime: string | null;
}

export interface ExceptionEvent {
  id: string;
  eventType: '跟车干扰' | '标签失效' | '交易失败' | '路径异常' | '其他';
  severity: '低' | '中' | '高';
  description: string;
  trafficRecordId: string | null;
  userId: string | null;
  attribution: string;
  status: '待处理' | '处理中' | '已解决' | '已关闭';
  workOrderId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface WorkOrder {
  id: string;
  eventId: string;
  handlerId: string;
  priority: '紧急' | '高' | '中' | '低';
  status: '待分配' | '处理中' | '待复核' | '已完成';
  operationLog: {
    time: string;
    operator: string;
    action: string;
  }[];
}

export interface FittedPath {
  points: { lat: number; lng: number }[];
  distance: number;
  segments?: { from: GantryPoint; to: GantryPoint; distance: number; fee: number }[];
}

export interface TollStation {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  highway: string;
  gantryCount: number;
}

export interface DashboardStats {
  todayTransactions: number;
  todayAmount: number;
  todayVehicles: number;
  activeCards: number;
  abnormalEvents: number;
  systemHealth: number;
}
