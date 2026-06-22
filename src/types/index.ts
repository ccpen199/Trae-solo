export type PropertyStatus = 'rented' | 'vacant' | 'maintenance' | 'sold';
export type MeterType = 'water' | 'electricity' | 'gas';
export type TenantStatus = 'living' | 'moved' | 'pending';
export type VerifyStatus = 'unverified' | 'ocr_done' | 'face_done' | 'verified' | 'failed';
export type BillingCycleType = 'monthly' | 'fixed_day' | 'custom';
export type FeeType = 'rent' | 'water' | 'electricity' | 'gas' | 'property' | 'deposit' | 'penalty' | 'other';
export type BillStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type LogModule = 'property' | 'tenant' | 'bill' | 'meter' | 'lease' | 'system';
export type LogAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'sign'
  | 'pay'
  | 'verify'
  | 'export'
  | 'login'
  | 'generate'
  | 'import'
  | 'warning'
  | 'view'
  | 'unbind';
export type PaymentMethod = 'cash' | 'transfer' | 'wechat' | 'alipay' | 'other';

export interface Tier {
  from: number;
  to?: number;
  price: number;
}

export interface ShareRule {
  mode: 'equal' | 'area' | 'headcount';
  participants: string[];
}

export interface Meter {
  id: string;
  type: MeterType;
  meterNo: string;
  unitPrice: number;
  tieredPricing?: Tier[];
  lastReading: number;
  lastReadingDate: string;
  shareRule?: ShareRule;
}

export interface Property {
  id: string;
  title: string;
  address: string;
  area: number;
  layout: string;
  floor: string;
  decoration: string;
  monthlyRent: number;
  status: PropertyStatus;
  coverImage?: string;
  meters: Meter[];
  landlordPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDCardInfo {
  name: string;
  gender: string;
  nation: string;
  birth: string;
  address: string;
  idNo: string;
  issuingAuthority: string;
  validPeriod: string;
  frontImage?: string;
  backImage?: string;
}

export interface FaceVerifyResult {
  passed: boolean;
  score: number;
  timestamp: string;
  image?: string;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  idCard: IDCardInfo;
  faceVerify: FaceVerifyResult;
  verifyStatus: VerifyStatus;
  status: TenantStatus;
  propertyId?: string;
  moveInDate?: string;
  moveOutDate?: string;
  emergencyContact?: string;
  remark?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeItem {
  id: string;
  type: FeeType;
  name: string;
  amount: number;
  calculation?: string;
  meterId?: string;
  readingStart?: number;
  readingEnd?: number;
  usage?: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  remark?: string;
  operator: string;
}

export interface Bill {
  id: string;
  billNo: string;
  propertyId: string;
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  cycleType: BillingCycleType;
  autoRenew: boolean;
  items: FeeItem[];
  totalAmount: number;
  paidAmount: number;
  status: BillStatus;
  payments: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface LeaseTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: string[];
  category: 'standard' | 'simple' | 'shared';
  createdAt: string;
}

export interface LeaseContract {
  id: string;
  templateId: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  content: string;
  signedAt?: string;
  status: 'draft' | 'signed' | 'terminated';
}

export interface OperationLogEntry {
  id: string;
  timestamp: string;
  module: LogModule;
  action: LogAction;
  operator: string;
  targetId?: string;
  targetName?: string;
  summary: string;
  diff?: Record<string, { before: unknown; after: unknown }>;
  ip?: string;
  userAgent?: string;
}

export type LogEntry = OperationLogEntry;

export const FEE_TYPE_LABEL: Record<FeeType, string> = {
  rent: '房屋租金',
  water: '水费',
  electricity: '电费',
  gas: '燃气费',
  property: '物业费',
  deposit: '押金',
  penalty: '违约金',
  other: '其他费用',
};

export const METER_TYPE_LABEL: Record<MeterType, string> = {
  water: '水表',
  electricity: '电表',
  gas: '燃气表',
};

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  pending: '待支付',
  partial: '部分支付',
  paid: '已结清',
  overdue: '已逾期',
  cancelled: '已取消',
};

export const TENANT_STATUS_LABEL: Record<TenantStatus, string> = {
  living: '在住',
  moved: '已退租',
  pending: '待入住',
};

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  rented: '出租中',
  vacant: '空置',
  maintenance: '维修中',
  sold: '已出售',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: '现金',
  transfer: '银行转账',
  wechat: '微信支付',
  alipay: '支付宝',
  other: '其他',
};

export const LOG_MODULE_LABEL: Record<LogModule, string> = {
  property: '房源管理',
  tenant: '租客管理',
  bill: '账单管理',
  meter: '抄表计费',
  lease: '租约中心',
  system: '系统操作',
};

export const LOG_ACTION_LABEL: Record<LogAction, string> = {
  create: '新建',
  update: '修改',
  delete: '删除',
  sign: '签署',
  pay: '收款',
  verify: '核验',
  export: '导出',
  login: '登录',
  generate: '生成',
  import: '导入',
  warning: '预警',
  view: '查看',
  unbind: '解绑',
};

export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
