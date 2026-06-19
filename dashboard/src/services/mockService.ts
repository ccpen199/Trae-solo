import type {
  AuthUser,
  LoginRequest,
  CouponActivity,
  CouponInstance,
  Inventory,
  InventoryLog,
  VerificationRecord,
  VerificationTrendData,
  DashboardStats,
  RiskEvent,
  Alert,
  Merchant,
  SettlementRecord,
  ProvincialSettlementRecord,
  ProvincialPlatformConfig,
  PaginationRequest,
  PaginationResponse,
  CouponType,
  CouponStatus,
  TerminalType,
  VerificationStatus,
  RiskEventType,
  RiskLevel,
  RiskStatus,
  AlertType,
  AlertLevel,
  SettlementStatus,
  ReplenishmentRecord,
  ReplenishmentStatus,
  ReconciliationRecord,
  ReconciliationStatus,
  InventoryAlert,
  InventoryAlertType,
  InventoryAlertLevel,
  InventoryAlertStatus,
  VerificationSourceDistribution,
  InventoryTrendData,
  InventoryLogDetailType,
  UserRole,
} from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

const mockUsers: AuthUser[] = [
  { id: '1', username: 'admin', role: 'admin', name: '系统管理员', token: 'mock-token-admin-123' },
  { id: '2', username: 'merchant', role: 'merchant', merchantId: 'm001', name: '商户管理员', token: 'mock-token-merchant-456' },
  { id: '3', username: 'cashier', role: 'cashier', merchantId: 'm001', name: '收银员小王', token: 'mock-token-cashier-789' },
  { id: '4', username: 'risk', role: 'risk_officer', name: '风控专员', token: 'mock-token-risk-012' },
];

const mockCoupons: CouponActivity[] = Array.from({ length: 25 }, (_, i) => ({
  id: `coupon-${i + 1}`,
  name: ['满100减30优惠券', '满200减50折扣券', '8折通用券', '新用户专享券', '节日特惠券'][i % 5] + ` #${i + 1}`,
  type: ['fixed', 'discount', 'threshold'][i % 3] as CouponType,
  value: i % 3 === 1 ? 0.8 : [30, 50, 20, 100][i % 4],
  threshold: [100, 200, 50, 0][i % 4],
  totalQuantity: [1000, 500, 2000, 300][i % 4],
  usedQuantity: Math.floor(Math.random() * 800),
  status: ['active', 'active', 'paused', 'expired', 'draft'][i % 5] as CouponStatus,
  startTime: dayjs().subtract(i, 'day').toDate(),
  endTime: dayjs().add(30 - i, 'day').toDate(),
  applicableMerchants: ['m001', 'm002', 'm003'],
  description: '这是一张优惠券的详细描述信息，包含使用规则和注意事项。',
  createdAt: dayjs().subtract(i + 10, 'day').toDate(),
  updatedAt: dayjs().subtract(i, 'day').toDate(),
}));

const mockInventory: Inventory[] = Array.from({ length: 15 }, (_, i) => ({
  id: `inv-${i + 1}`,
  activityId: `coupon-${i + 1}`,
  batchNo: `BATCH-${String(i + 1).padStart(6, '0')}`,
  quantity: [1000, 500, 2000, 800, 1500][i % 5],
  availableQuantity: Math.floor(Math.random() * 500),
  unitCost: [30, 50, 20, 100, 15][i % 5],
  expiryDate: dayjs().add(90 - i * 5, 'day').toDate(),
  createdAt: dayjs().subtract(i + 5, 'day').toDate(),
  activity: mockCoupons[i],
}));

const mockInventoryLogs: InventoryLog[] = Array.from({ length: 50 }, (_, i) => {
  const detailTypes: InventoryLogDetailType[] = ['receive_in', 'verify_out', 'adjust', 'expire_loss', 'system_adjust'];
  const detailType = detailTypes[i % 5];
  const type: 'in' | 'out' | 'adjust' = detailType === 'receive_in' ? 'in' : detailType === 'verify_out' || detailType === 'expire_loss' ? 'out' : 'adjust';
  const terminals: TerminalType[] = ['pos', 'miniapp', 'citycode'];
  const sourceTerminal = detailType === 'verify_out' ? terminals[i % 3] : undefined;
  return {
    id: `log-${i + 1}`,
    inventoryId: `inv-${(i % 15) + 1}`,
    type,
    detailType,
    quantity: [100, -50, 20, -30, 15][i % 5],
    balance: 500 + Math.floor(Math.random() * 1000),
    sourceTerminal,
    relatedOrderNo: detailType === 'verify_out' ? `ORD${dayjs().format('YYYYMMDD')}${String(i + 1).padStart(8, '0')}` : undefined,
    operatorId: 'op-001',
    operatorName: ['管理员', '收银员小王', '商户管理员', '系统', '风控专员'][i % 5],
    operatorRole: ['admin', 'cashier', 'merchant', 'admin', 'risk_officer'][i % 5] as UserRole,
    remark: ['发放入库', '核销扣减', '调账', '过期损耗', '系统调整'][i % 5],
    createdAt: dayjs().subtract(i, 'hour').toDate(),
  };
});

const mockReplenishments: ReplenishmentRecord[] = Array.from({ length: 20 }, (_, i) => {
  const statuses: ReplenishmentStatus[] = ['pending', 'approved', 'completed', 'cancelled'];
  const status = statuses[i % 4];
  return {
    id: `repl-${i + 1}`,
    inventoryId: `inv-${(i % 15) + 1}`,
    batchNo: `BATCH-${String((i % 15) + 1).padStart(6, '0')}`,
    quantity: [100, 200, 500, 300, 150][i % 5],
    unitCost: [30, 50, 20, 100, 15][i % 5],
    supplier: ['供应商A', '供应商B', '供应商C', '供应商D', '供应商E'][i % 5],
    operatorId: 'op-001',
    operatorName: ['商户管理员', '采购员小李', '库存管理员', '系统', '财务'][i % 5],
    operatorRole: ['merchant', 'merchant', 'admin', 'admin', 'admin'][i % 5] as UserRole,
    status,
    approverId: status !== 'pending' ? 'app-001' : undefined,
    approverName: status !== 'pending' ? '审批人王经理' : undefined,
    approvedAt: status !== 'pending' ? dayjs().subtract(i, 'day').add(2, 'hour').toDate() : undefined,
    remark: ['常规补货', '紧急补货', '活动备货', '调整库存', '季度补货'][i % 5],
    createdAt: dayjs().subtract(i, 'day').toDate(),
    updatedAt: dayjs().subtract(i, 'day').add(1, 'hour').toDate(),
  };
});

const mockReconciliations: ReconciliationRecord[] = Array.from({ length: 15 }, (_, i) => {
  const statuses: ReconciliationStatus[] = ['reconciled', 'pending', 'reconciling', 'abnormal'];
  const status = statuses[i % 4];
  const expected = 800 + Math.floor(Math.random() * 500);
  const actual = expected + (status === 'abnormal' ? -Math.floor(Math.random() * 50) : Math.floor(Math.random() * 10) - 5);
  return {
    id: `recon-${i + 1}`,
    inventoryId: `inv-${(i % 15) + 1}`,
    batchNo: `BATCH-${String((i % 15) + 1).padStart(6, '0')}`,
    periodStart: dayjs().subtract(i + 1, 'month').startOf('month').toDate(),
    periodEnd: dayjs().subtract(i + 1, 'month').endOf('month').toDate(),
    status,
    expectedQuantity: expected,
    actualQuantity: actual,
    diffQuantity: actual - expected,
    diffAmount: (actual - expected) * [30, 50, 20, 100, 15][i % 5],
    lastReconciledAt: status === 'reconciled' ? dayjs().subtract(i, 'day').toDate() : undefined,
    reconciledBy: status === 'reconciled' ? '财务专员' : undefined,
    remark: status === 'abnormal' ? '存在差异，需进一步核查' : undefined,
    createdAt: dayjs().subtract(i, 'day').toDate(),
  };
});

const mockInventoryAlerts: InventoryAlert[] = Array.from({ length: 12 }, (_, i) => {
  const types: InventoryAlertType[] = ['low_stock', 'expiring_soon', 'abnormal_consumption'];
  const levels: InventoryAlertLevel[] = ['attention', 'warning', 'critical'];
  const statuses: InventoryAlertStatus[] = ['pending', 'processing', 'resolved', 'ignored'];
  const type = types[i % 3];
  const level = levels[i % 3];
  const status = statuses[i % 4];
  return {
    id: `inv-alert-${i + 1}`,
    inventoryId: `inv-${(i % 15) + 1}`,
    batchNo: `BATCH-${String((i % 15) + 1).padStart(6, '0')}`,
    type,
    level,
    title: [
      '库存不足预警',
      '即将过期提醒',
      '异常消耗预警',
      '库存偏低通知',
      '30天内过期',
    ][i % 5],
    message: [
      '当前库存已低于安全阈值，请及时补货。',
      '该批次优惠券将在7天内过期，请关注核销情况。',
      '近7天消耗速度异常，远超正常水平，请核查。',
      '库存已降至警戒线以下，建议安排补货。',
      '库存批次即将过期，请尽快安排使用或促销。',
    ][i % 5],
    status,
    threshold: type === 'low_stock' ? 100 : type === 'expiring_soon' ? 30 : undefined,
    currentValue: type === 'low_stock' ? 50 + Math.floor(Math.random() * 50) : type === 'expiring_soon' ? 7 + Math.floor(Math.random() * 23) : 150 + Math.floor(Math.random() * 100),
    handlerId: status !== 'pending' ? 'handler-001' : undefined,
    handlerName: status !== 'pending' ? '库存管理员' : undefined,
    handledAt: status !== 'pending' ? dayjs().subtract(i, 'day').toDate() : undefined,
    handlerNotes: status !== 'pending' ? ['已安排补货', '已启动促销活动', '正常波动，已确认', '误报，已忽略'][i % 4] : undefined,
    createdAt: dayjs().subtract(i, 'day').toDate(),
  };
});

const mockVerificationRecords: VerificationRecord[] = Array.from({ length: 100 }, (_, i) => ({
  id: `ver-${i + 1}`,
  couponInstanceId: `inst-${i + 1}`,
  activityId: `coupon-${(i % 25) + 1}`,
  userId: `user-${(i % 50) + 1}`,
  merchantId: 'm001',
  storeId: 's001',
  terminalId: `pos-${(i % 10) + 1}`,
  terminalType: ['pos', 'miniapp', 'citycode'][i % 3] as TerminalType,
  originalAmount: [150, 280, 99, 350, 180][i % 5],
  discountAmount: [30, 50, 20, 70, 45][i % 5],
  amount: [120, 230, 79, 280, 135][i % 5],
  status: ['success', 'success', 'success', 'failed', 'reversed'][i % 5] as VerificationStatus,
  verifiedAt: dayjs().subtract(i, 'hour').toDate(),
  orderNo: `ORD${dayjs().format('YYYYMMDD')}${String(i + 1).padStart(8, '0')}`,
}));

const mockRiskEvents: RiskEvent[] = Array.from({ length: 30 }, (_, i) => ({
  id: `risk-${i + 1}`,
  type: ['multi_account', 'bulk_hoarding', 'abnormal_path'][i % 3] as RiskEventType,
  level: ['low', 'medium', 'high'][i % 3] as RiskLevel,
  userId: `user-${(i % 50) + 1}`,
  deviceId: `dev-${(i % 20) + 1}`,
  relatedAccounts: Array.from({ length: (i % 5) + 2 }, (_, j) => `user-${(i + j) % 50 + 1}`),
  evidence: {
    deviceId: `dev-${(i % 20) + 1}`,
    accountCount: (i % 5) + 2,
    timeWindow: '24小时',
    couponCount: (i % 10) + 3,
    anomalyScore: 0.6 + Math.random() * 0.4,
    ipAddresses: [`192.168.${(i % 255)}.${(i % 255)}`],
    timestamps: [dayjs().subtract(i, 'hour').toDate()],
  },
  status: ['pending', 'reviewing', 'resolved', 'ignored'][i % 4] as RiskStatus,
  handlerId: i % 4 >= 2 ? 'handler-001' : undefined,
  handledAt: i % 4 >= 2 ? dayjs().subtract(i, 'day').toDate() : undefined,
  handlerNotes: i % 4 >= 2 ? ['已冻结账户', '已解除冻结', '正常操作，忽略'][i % 3] : undefined,
  detectedAt: dayjs().subtract(i, 'day').toDate(),
}));

const mockAlerts: Alert[] = Array.from({ length: 20 }, (_, i) => ({
  id: `alert-${i + 1}`,
  type: ['inventory', 'verification_rate', 'risk', 'system'][i % 4] as AlertType,
  level: ['info', 'warning', 'critical'][i % 3] as AlertLevel,
  title: [
    '库存不足预警',
    '核销率异常下降',
    '检测到高风险操作',
    '系统维护通知',
    '优惠券即将过期',
  ][i % 5],
  message: [
    '优惠券库存已低于安全阈值，请及时补货。',
    '今日核销率较昨日下降超过30%，请关注。',
    '检测到可疑的多账户关联操作，请及时处理。',
    '系统将于今晚22:00-24:00进行维护升级。',
    '有一批优惠券将在7天后过期，请提醒用户使用。',
  ][i % 5],
  relatedId: `coupon-${(i % 25) + 1}`,
  merchantId: 'm001',
  read: i % 3 === 0,
  createdAt: dayjs().subtract(i, 'hour').toDate(),
}));

const mockMerchants: Merchant[] = [
  { id: 'm001', name: '沈阳商业城有限公司', licenseNo: '91210100MA0XXXXXX1', contactName: '张经理', contactPhone: '13800138001', address: '沈阳市沈河区中街路1号', district: '沈河区', category: '百货零售', status: 'active', createdAt: dayjs().subtract(365, 'day').toDate() },
  { id: 'm002', name: '兴隆大家庭', licenseNo: '91210100MA0XXXXXX2', contactName: '李总', contactPhone: '13800138002', address: '沈阳市沈河区中街路2号', district: '沈河区', category: '百货零售', status: 'active', createdAt: dayjs().subtract(300, 'day').toDate() },
  { id: 'm003', name: '华润万家超市', licenseNo: '91210100MA0XXXXXX3', contactName: '王店长', contactPhone: '13800138003', address: '沈阳市和平区南京北街1号', district: '和平区', category: '超市', status: 'active', createdAt: dayjs().subtract(200, 'day').toDate() },
  { id: 'm004', name: '沈阳大悦城', licenseNo: '91210100MA0XXXXXX4', contactName: '赵经理', contactPhone: '13800138004', address: '沈阳市大东区小东路1号', district: '大东区', category: '购物中心', status: 'pending', createdAt: dayjs().subtract(100, 'day').toDate() },
  { id: 'm005', name: '家乐福超市', licenseNo: '91210100MA0XXXXXX5', contactName: '孙店长', contactPhone: '13800138005', address: '沈阳市皇姑区黄河大街1号', district: '皇姑区', category: '超市', status: 'inactive', createdAt: dayjs().subtract(150, 'day').toDate() },
];

const mockSettlements: SettlementRecord[] = Array.from({ length: 12 }, (_, i) => ({
  id: `settle-${i + 1}`,
  merchantId: `m00${(i % 5) + 1}`,
  periodStart: dayjs().subtract(i + 1, 'month').startOf('month').toDate(),
  periodEnd: dayjs().subtract(i + 1, 'month').endOf('month').toDate(),
  totalVerifications: 1000 + Math.floor(Math.random() * 5000),
  totalAmount: 50000 + Math.floor(Math.random() * 200000),
  subsidyAmount: 10000 + Math.floor(Math.random() * 50000),
  actualAmount: 40000 + Math.floor(Math.random() * 150000),
  status: ['pending', 'approved', 'rejected', 'transferred'][i % 4] as SettlementStatus,
  provincialBatchId: i % 4 === 3 ? `batch-${i + 1}` : undefined,
  transferTime: i % 4 === 3 ? dayjs().subtract(i, 'day').toDate() : undefined,
  createdAt: dayjs().subtract(i, 'month').toDate(),
  merchant: mockMerchants[i % 5],
}));

const mockProvincialSettlements: ProvincialSettlementRecord[] = Array.from({ length: 6 }, (_, i) => ({
  id: `prov-settle-${i + 1}`,
  batchId: `BATCH-PROV-${String(i + 1).padStart(4, '0')}`,
  cityCode: '210100',
  totalAmount: 500000 + Math.floor(Math.random() * 1000000),
  subsidyAmount: 100000 + Math.floor(Math.random() * 300000),
  merchantCount: 10 + Math.floor(Math.random() * 20),
  status: ['pending', 'synced', 'confirmed', 'paid'][i % 4] as ProvincialSettlementRecord['status'],
  syncTime: i % 4 >= 1 ? dayjs().subtract(i, 'day').toDate() : undefined,
  confirmTime: i % 4 >= 2 ? dayjs().subtract(i - 1, 'day').toDate() : undefined,
  paidTime: i % 4 >= 3 ? dayjs().subtract(i - 2, 'day').toDate() : undefined,
  createdAt: dayjs().subtract(i * 7, 'day').toDate(),
}));

const mockProvincialConfig: ProvincialPlatformConfig = {
  apiUrl: 'https://api.liaoning.gov.cn/welfare',
  appId: 'SY_WELFARE_001',
  cityCode: '210100',
  publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr...\n-----END PUBLIC KEY-----',
  enabled: true,
};

export const mockAuthService = {
  login: async (credentials: LoginRequest): Promise<AuthUser> => {
    await delay();
    const user = mockUsers.find(
      (u) => u.username === credentials.username && credentials.password === '123456'
    );
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    localStorage.setItem('token', user.token);
    return user;
  },
  logout: async (): Promise<void> => {
    await delay();
    localStorage.removeItem('token');
  },
};

export const mockCouponService = {
  getCoupons: async (params?: PaginationRequest & { status?: string; type?: string }): Promise<PaginationResponse<CouponActivity>> => {
    await delay();
    let data = [...mockCoupons];
    if (params?.status) {
      data = data.filter((c) => c.status === params.status);
    }
    if (params?.type) {
      data = data.filter((c) => c.type === params.type);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize,
    };
  },
  getCouponById: async (id: string): Promise<CouponActivity | null> => {
    await delay();
    return mockCoupons.find((c) => c.id === id) || null;
  },
  createCoupon: async (data: Partial<CouponActivity>): Promise<CouponActivity> => {
    await delay();
    const coupon: CouponActivity = {
      id: `coupon-${mockCoupons.length + 1}`,
      name: data.name || '新优惠券',
      type: data.type || 'fixed',
      value: data.value || 30,
      threshold: data.threshold || 100,
      totalQuantity: data.totalQuantity || 1000,
      usedQuantity: 0,
      status: data.status || 'draft',
      startTime: data.startTime || new Date(),
      endTime: data.endTime || dayjs().add(30, 'day').toDate(),
      applicableMerchants: data.applicableMerchants || ['m001'],
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCoupons.unshift(coupon);
    return coupon;
  },
  updateCoupon: async (id: string, data: Partial<CouponActivity>): Promise<CouponActivity> => {
    await delay();
    const index = mockCoupons.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('优惠券不存在');
    }
    mockCoupons[index] = { ...mockCoupons[index], ...data, updatedAt: new Date() };
    return mockCoupons[index];
  },
  deleteCoupon: async (id: string): Promise<void> => {
    await delay();
    const index = mockCoupons.findIndex((c) => c.id === id);
    if (index !== -1) {
      mockCoupons.splice(index, 1);
    }
  },
};

export const mockInventoryService = {
  getInventoryList: async (params?: PaginationRequest & { lowStock?: boolean }): Promise<PaginationResponse<Inventory>> => {
    await delay();
    let data = [...mockInventory];
    if (params?.lowStock) {
      data = data.filter((i) => i.availableQuantity < 100);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize,
    };
  },
  getInventoryLogs: async (inventoryId: string): Promise<InventoryLog[]> => {
    await delay();
    return mockInventoryLogs.filter((l) => l.inventoryId === inventoryId);
  },
  replenish: async (inventoryId: string, quantity: number, remark?: string): Promise<void> => {
    await delay();
    const inventory = mockInventory.find((i) => i.id === inventoryId);
    if (inventory) {
      inventory.availableQuantity += quantity;
      mockInventoryLogs.unshift({
        id: `log-${mockInventoryLogs.length + 1}`,
        inventoryId,
        type: 'in',
        quantity,
        balance: inventory.availableQuantity,
        operatorId: 'op-001',
        operatorName: '管理员',
        remark: remark || '补货入库',
        createdAt: new Date(),
      });
    }
  },
  adjust: async (inventoryId: string, quantity: number, remark?: string): Promise<void> => {
    await delay();
    const inventory = mockInventory.find((i) => i.id === inventoryId);
    if (inventory) {
      inventory.availableQuantity += quantity;
      mockInventoryLogs.unshift({
        id: `log-${mockInventoryLogs.length + 1}`,
        inventoryId,
        type: 'adjust',
        detailType: 'adjust',
        quantity,
        balance: inventory.availableQuantity,
        operatorId: 'op-001',
        operatorName: '管理员',
        operatorRole: 'admin',
        remark: remark || '库存调整',
        createdAt: new Date(),
      });
    }
  },
  getVerificationSourceDistribution: async (inventoryId: string): Promise<VerificationSourceDistribution> => {
    await delay();
    return {
      pos: 350 + Math.floor(Math.random() * 200),
      miniapp: 200 + Math.floor(Math.random() * 150),
      citycode: 100 + Math.floor(Math.random() * 100),
    };
  },
  getInventoryTrend: async (inventoryId: string, days: number = 7): Promise<InventoryTrendData[]> => {
    await delay();
    return Array.from({ length: days }, (_, i) => {
      const date = dayjs().subtract(days - i, 'day');
      const outQty = 30 + Math.floor(Math.random() * 50);
      const inQty = i % 3 === 0 ? 100 + Math.floor(Math.random() * 100) : 0;
      return {
        date: date.format('MM-DD'),
        quantity: 500 + i * 20 - outQty + inQty,
        inQuantity: inQty,
        outQuantity: outQty,
      };
    });
  },
  getReplenishmentRecords: async (params?: PaginationRequest & { inventoryId?: string; status?: string }): Promise<PaginationResponse<ReplenishmentRecord>> => {
    await delay();
    let data = [...mockReplenishments];
    if (params?.inventoryId) {
      data = data.filter((r) => r.inventoryId === params.inventoryId);
    }
    if (params?.status) {
      data = data.filter((r) => r.status === params.status);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize,
    };
  },
  createReplenishment: async (data: Partial<ReplenishmentRecord>): Promise<ReplenishmentRecord> => {
    await delay();
    const record: ReplenishmentRecord = {
      id: `repl-${mockReplenishments.length + 1}`,
      inventoryId: data.inventoryId || '',
      batchNo: data.batchNo || '',
      quantity: data.quantity || 0,
      unitCost: data.unitCost || 0,
      supplier: data.supplier || '',
      operatorId: 'op-001',
      operatorName: '当前用户',
      operatorRole: 'admin',
      status: 'pending',
      remark: data.remark,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockReplenishments.unshift(record);
    return record;
  },
  approveReplenishment: async (id: string): Promise<void> => {
    await delay();
    const record = mockReplenishments.find((r) => r.id === id);
    if (record) {
      record.status = 'approved';
      record.approverId = 'app-001';
      record.approverName = '审批人王经理';
      record.approvedAt = new Date();
      record.updatedAt = new Date();
    }
  },
  cancelReplenishment: async (id: string): Promise<void> => {
    await delay();
    const record = mockReplenishments.find((r) => r.id === id);
    if (record) {
      record.status = 'cancelled';
      record.updatedAt = new Date();
    }
  },
  getReconciliationRecords: async (params?: PaginationRequest & { inventoryId?: string; status?: string }): Promise<PaginationResponse<ReconciliationRecord>> => {
    await delay();
    let data = [...mockReconciliations];
    if (params?.inventoryId) {
      data = data.filter((r) => r.inventoryId === params.inventoryId);
    }
    if (params?.status) {
      data = data.filter((r) => r.status === params.status);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize,
    };
  },
  getInventoryAlerts: async (params?: PaginationRequest & { inventoryId?: string; level?: string; status?: string }): Promise<PaginationResponse<InventoryAlert>> => {
    await delay();
    let data = [...mockInventoryAlerts];
    if (params?.inventoryId) {
      data = data.filter((a) => a.inventoryId === params.inventoryId);
    }
    if (params?.level) {
      data = data.filter((a) => a.level === params.level);
    }
    if (params?.status) {
      data = data.filter((a) => a.status === params.status);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize,
    };
  },
  handleInventoryAlert: async (id: string, status: InventoryAlertStatus, notes?: string): Promise<void> => {
    await delay();
    const alert = mockInventoryAlerts.find((a) => a.id === id);
    if (alert) {
      alert.status = status;
      alert.handlerId = 'handler-001';
      alert.handlerName = '库存管理员';
      alert.handledAt = new Date();
      alert.handlerNotes = notes;
    }
  },
};

export const mockVerificationService = {
  getRecords: async (params?: PaginationRequest & { startDate?: string; endDate?: string; status?: string }): Promise<PaginationResponse<VerificationRecord>> => {
    await delay();
    let data = [...mockVerificationRecords];
    if (params?.status) {
      data = data.filter((r) => r.status === params.status);
    }
    if (params?.startDate) {
      data = data.filter((r) => dayjs(r.verifiedAt).isAfter(dayjs(params.startDate)));
    }
    if (params?.endDate) {
      data = data.filter((r) => dayjs(r.verifiedAt).isBefore(dayjs(params.endDate).endOf('day')));
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize,
    };
  },
  getTrendData: async (days: number = 30): Promise<VerificationTrendData[]> => {
    await delay();
    return Array.from({ length: days }, (_, i) => {
      const date = dayjs().subtract(days - i, 'day');
      return {
        date: date.format('YYYY-MM-DD'),
        count: 100 + Math.floor(Math.random() * 400),
        amount: 20000 + Math.floor(Math.random() * 80000),
        discountAmount: 4000 + Math.floor(Math.random() * 16000),
      };
    });
  },
  getStats: async (): Promise<DashboardStats> => {
    await delay();
    return {
      totalCoupons: 50000,
      usedCoupons: 32560,
      verificationRate: 65.12,
      totalAmount: 1256800,
      totalSubsidy: 352400,
      activeActivities: 8,
      activeMerchants: 156,
      todayVerifications: 1256,
      todayAmount: 28560,
    };
  },
  getCouponDistribution: async (): Promise<{ name: string; value: number }[]> => {
    await delay();
    return [
      { name: '满减券', value: 45 },
      { name: '折扣券', value: 30 },
      { name: '门槛券', value: 15 },
      { name: '新用户券', value: 10 },
    ];
  },
  exportRecords: async (params?: { startDate?: string; endDate?: string }): Promise<Blob> => {
    await delay();
    const csvContent = `核销记录导出\n导出时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n时间范围: ${params?.startDate || '全部'} - ${params?.endDate || '全部'}\n\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return blob;
  },
  reverse: async (id: string, reason: string): Promise<void> => {
    await delay();
    const record = mockVerificationRecords.find((r) => r.id === id);
    if (record) {
      record.status = 'reversed';
    }
  },
};

export const mockRiskService = {
  getEvents: async (params?: PaginationRequest & { level?: string; status?: string; type?: string }): Promise<PaginationResponse<RiskEvent>> => {
    await delay();
    let data = [...mockRiskEvents];
    if (params?.level) {
      data = data.filter((e) => e.level === params.level);
    }
    if (params?.status) {
      data = data.filter((e) => e.status === params.status);
    }
    if (params?.type) {
      data = data.filter((e) => e.type === params.type);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize,
    };
  },
  getEventById: async (id: string): Promise<RiskEvent | null> => {
    await delay();
    return mockRiskEvents.find((e) => e.id === id) || null;
  },
  getRiskDistribution: async (): Promise<{ level: string; count: number }[]> => {
    await delay();
    return [
      { level: '低风险', count: 45 },
      { level: '中风险', count: 30 },
      { level: '高风险', count: 15 },
    ];
  },
  getDeviceAccountGraph: async (deviceId?: string): Promise<{ nodes: any[]; edges: any[] }> => {
    await delay();
    const nodes = [
      { id: 'dev-001', name: '设备DEV-001', category: 0, symbolSize: 50 },
      { id: 'user-001', name: '用户张三', category: 1, symbolSize: 30 },
      { id: 'user-002', name: '用户李四', category: 1, symbolSize: 30 },
      { id: 'user-003', name: '用户王五', category: 1, symbolSize: 30 },
      { id: 'user-004', name: '用户赵六', category: 1, symbolSize: 30 },
      { id: 'user-005', name: '用户孙七', category: 2, symbolSize: 30 },
    ];
    const edges = [
      { source: 'dev-001', target: 'user-001' },
      { source: 'dev-001', target: 'user-002' },
      { source: 'dev-001', target: 'user-003' },
      { source: 'dev-001', target: 'user-004' },
      { source: 'dev-001', target: 'user-005' },
    ];
    return { nodes, edges };
  },
  handleEvent: async (id: string, status: 'reviewing' | 'resolved' | 'ignored', notes?: string): Promise<void> => {
    await delay();
    const event = mockRiskEvents.find((e) => e.id === id);
    if (event) {
      event.status = status;
      event.handlerId = 'handler-001';
      event.handledAt = new Date();
      event.handlerNotes = notes;
    }
  },
};

export const mockAlertService = {
  getAlerts: async (params?: PaginationRequest & { type?: string; level?: string; read?: boolean }): Promise<PaginationResponse<Alert>> => {
    await delay();
    let data = [...mockAlerts];
    if (params?.type) {
      data = data.filter((a) => a.type === params.type);
    }
    if (params?.level) {
      data = data.filter((a) => a.level === params.level);
    }
    if (params?.read !== undefined) {
      data = data.filter((a) => a.read === params.read);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize,
    };
  },
  getUnreadCount: async (): Promise<number> => {
    await delay(200);
    return mockAlerts.filter((a) => !a.read).length;
  },
  markAsRead: async (id: string): Promise<void> => {
    await delay();
    const alert = mockAlerts.find((a) => a.id === id);
    if (alert) {
      alert.read = true;
    }
  },
  markAllAsRead: async (): Promise<void> => {
    await delay();
    mockAlerts.forEach((a) => (a.read = true));
  },
  dismiss: async (id: string): Promise<void> => {
    await delay();
    const index = mockAlerts.findIndex((a) => a.id === id);
    if (index !== -1) {
      mockAlerts.splice(index, 1);
    }
  },
};

export const mockMerchantService = {
  getMerchants: async (params?: PaginationRequest & { status?: string; district?: string; category?: string }): Promise<PaginationResponse<Merchant>> => {
    await delay();
    let data = [...mockMerchants];
    if (params?.status) {
      data = data.filter((m) => m.status === params.status);
    }
    if (params?.district) {
      data = data.filter((m) => m.district === params.district);
    }
    if (params?.category) {
      data = data.filter((m) => m.category === params.category);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize,
    };
  },
  getMerchantById: async (id: string): Promise<Merchant | null> => {
    await delay();
    return mockMerchants.find((m) => m.id === id) || null;
  },
  createMerchant: async (data: Partial<Merchant>): Promise<Merchant> => {
    await delay();
    const merchant: Merchant = {
      id: `m${String(mockMerchants.length + 1).padStart(3, '0')}`,
      name: data.name || '',
      licenseNo: data.licenseNo || '',
      contactName: data.contactName || '',
      contactPhone: data.contactPhone || '',
      address: data.address || '',
      district: data.district || '',
      category: data.category || '',
      status: data.status || 'pending',
      createdAt: new Date(),
    };
    mockMerchants.unshift(merchant);
    return merchant;
  },
  updateMerchant: async (id: string, data: Partial<Merchant>): Promise<Merchant> => {
    await delay();
    const index = mockMerchants.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('商户不存在');
    }
    mockMerchants[index] = { ...mockMerchants[index], ...data };
    return mockMerchants[index];
  },
  getSettlements: async (params?: PaginationRequest & { status?: string }): Promise<PaginationResponse<SettlementRecord>> => {
    await delay();
    let data = [...mockSettlements];
    if (params?.status) {
      data = data.filter((s) => s.status === params.status);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize,
    };
  },
};

export const mockProvincialService = {
  getSettlements: async (params?: PaginationRequest & { status?: string }): Promise<PaginationResponse<ProvincialSettlementRecord>> => {
    await delay();
    let data = [...mockProvincialSettlements];
    if (params?.status) {
      data = data.filter((s) => s.status === params.status);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: data.slice(start, end),
      total: data.length,
      page,
      pageSize,
    };
  },
  getConfig: async (): Promise<ProvincialPlatformConfig> => {
    await delay();
    return mockProvincialConfig;
  },
  updateConfig: async (config: Partial<ProvincialPlatformConfig>): Promise<ProvincialPlatformConfig> => {
    await delay();
    Object.assign(mockProvincialConfig, config);
    return mockProvincialConfig;
  },
  syncBatch: async (batchId: string): Promise<void> => {
    await delay(1000);
    const settlement = mockProvincialSettlements.find((s) => s.batchId === batchId);
    if (settlement) {
      settlement.status = 'synced';
      settlement.syncTime = new Date();
    }
  },
  confirmBatch: async (batchId: string): Promise<void> => {
    await delay(1000);
    const settlement = mockProvincialSettlements.find((s) => s.batchId === batchId);
    if (settlement) {
      settlement.status = 'confirmed';
      settlement.confirmTime = new Date();
    }
  },
  batchSync: async (): Promise<{ success: number; failed: number }> => {
    await delay(2000);
    return { success: 5, failed: 0 };
  },
};
