import { create } from 'zustand'
import type {
  CouponActivity,
  VerifyRecord,
  RiskEvent,
  Merchant,
  CitizenCoupon,
  DashboardMetrics,
  SettlementRecord,
  SubsidyRecord,
  AuditMerchant,
  AuditLog,
  StrategyConfig,
} from '@/types'

interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  currentPortal: 'admin' | 'merchant' | 'citizen'
  setCurrentPortal: (portal: 'admin' | 'merchant' | 'citizen') => void

  dashboardMetrics: DashboardMetrics
  couponActivities: CouponActivity[]
  verifyRecords: VerifyRecord[]
  riskEvents: RiskEvent[]
  merchants: Merchant[]
  citizenCoupons: CitizenCoupon[]
  settlementRecords: SettlementRecord[]
  subsidyRecords: SubsidyRecord[]
  auditMerchants: AuditMerchant[]
  auditLogs: AuditLog[]
  toasts: ToastItem[]

  addCouponActivity: (activity: CouponActivity) => void
  updateCouponActivity: (id: string, updates: Partial<CouponActivity>) => void
  changeCouponStatus: (id: string, newStatus: CouponActivity['status'], operator: string, detail: string) => void
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void
  showToast: (type: ToastItem['type'], message: string) => void
  dismissToast: (id: string) => void
}

const dailyTrend = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`
  return {
    date: dateStr,
    issued: Math.floor(Math.random() * 800 + 200),
    verified: Math.floor(Math.random() * 600 + 150),
  }
})

const districtData = [
  { name: '和平区', value: 2850 },
  { name: '沈河区', value: 2340 },
  { name: '皇姑区', value: 1980 },
  { name: '大东区', value: 1760 },
  { name: '铁西区', value: 3120 },
  { name: '苏家屯区', value: 890 },
  { name: '浑南区', value: 1560 },
  { name: '沈北新区', value: 720 },
  { name: '于洪区', value: 1120 },
  { name: '辽中区', value: 450 },
  { name: '康平县', value: 280 },
  { name: '法库县', value: 310 },
  { name: '新民市', value: 390 },
]

const categoryDistribution = [
  { name: '餐饮美食', value: 35 },
  { name: '零售购物', value: 25 },
  { name: '生活服务', value: 18 },
  { name: '文旅休闲', value: 12 },
  { name: '医疗健康', value: 10 },
]

const initialCouponActivities: CouponActivity[] = [
  {
    id: 'ca001', name: '2026春季惠民消费券', type: '政务补贴', faceValue: 50, totalCount: 50000, usedCount: 38520, status: 'active', strategy: '人群包', startDate: '2026-03-01', endDate: '2026-06-30', budget: 2500000, budgetUsed: 1926000, createdAt: '2026-02-25',
    strategyConfig: { groupIds: ['grp-low-income', 'grp-senior'] },
  },
  {
    id: 'ca002', name: '铁西商圈地理围栏券', type: '商业促销', faceValue: 30, totalCount: 20000, usedCount: 12800, status: 'active', strategy: '地理围栏', startDate: '2026-04-01', endDate: '2026-08-31', budget: 600000, budgetUsed: 384000, createdAt: '2026-03-20',
    strategyConfig: { geoFence: { lat: 41.7956, lng: 123.3784, radius: 3000 } },
  },
  {
    id: 'ca003', name: '满100减20餐饮券', type: '民生优惠', faceValue: 20, totalCount: 100000, usedCount: 67500, status: 'active', strategy: '满减触发', startDate: '2026-01-01', endDate: '2026-12-31', budget: 2000000, budgetUsed: 1350000, createdAt: '2025-12-20',
    strategyConfig: { thresholdAmount: 100 },
  },
  {
    id: 'ca004', name: '文旅消费专项补贴', type: '政务补贴', faceValue: 100, totalCount: 10000, usedCount: 8900, status: 'active', strategy: '人群包', startDate: '2026-05-01', endDate: '2026-07-31', budget: 1000000, budgetUsed: 890000, createdAt: '2026-04-15',
    strategyConfig: { groupIds: ['grp-culture-tour'] },
  },
  {
    id: 'ca005', name: '社区便民服务券', type: '民生优惠', faceValue: 15, totalCount: 80000, usedCount: 52000, status: 'paused', strategy: '人群包', startDate: '2026-02-01', endDate: '2026-05-31', budget: 1200000, budgetUsed: 780000, createdAt: '2026-01-20',
    strategyConfig: { groupIds: ['grp-community'] },
  },
  {
    id: 'ca006', name: '浑南新区购物节券', type: '商业促销', faceValue: 80, totalCount: 5000, usedCount: 4350, status: 'active', strategy: '地理围栏', startDate: '2026-05-15', endDate: '2026-08-15', budget: 400000, budgetUsed: 348000, createdAt: '2026-05-01',
    strategyConfig: { geoFence: { lat: 41.7186, lng: 123.4589, radius: 5000 } },
  },
  {
    id: 'ca007', name: '冬季取暖补贴券', type: '政务补贴', faceValue: 200, totalCount: 3000, usedCount: 3000, status: 'expired', strategy: '人群包', startDate: '2025-11-01', endDate: '2026-02-28', budget: 600000, budgetUsed: 600000, createdAt: '2025-10-15',
    strategyConfig: { groupIds: ['grp-heating'] },
  },
  {
    id: 'ca008', name: '医疗健康满减券', type: '民生优惠', faceValue: 50, totalCount: 15000, usedCount: 3200, status: 'draft', strategy: '满减触发', startDate: '2026-07-01', endDate: '2026-12-31', budget: 750000, budgetUsed: 0, createdAt: '2026-06-01',
    strategyConfig: { thresholdAmount: 200 },
  },
]

const verifyRecords: VerifyRecord[] = Array.from({ length: 50 }, (_, i) => {
  const terminals: VerifyRecord['terminal'][] = ['POS机具', '小程序码', '城市码']
  const statuses: VerifyRecord['status'][] = ['success', 'success', 'success', 'success', 'failed']
  const couponNames = ['2026春季惠民消费券', '铁西商圈地理围栏券', '满100减20餐饮券', '文旅消费专项补贴']
  const merchants = ['中兴商厦', '万达广场', '华润万家', '老边饺子馆', '刘一锅', '中街大悦城', '太原街万达', '铁西百货']
  const citizens = ['张伟', '王芳', '李明', '赵丽', '刘洋', '陈静', '杨帆', '黄磊']
  const d = new Date()
  d.setMinutes(d.getMinutes() - i * 12)
  return {
    id: `vr${String(i + 1).padStart(4, '0')}`,
    couponId: `ca00${Math.floor(Math.random() * 4) + 1}`,
    couponName: couponNames[Math.floor(Math.random() * couponNames.length)],
    citizenName: citizens[Math.floor(Math.random() * citizens.length)],
    merchantName: merchants[Math.floor(Math.random() * merchants.length)],
    terminal: terminals[Math.floor(Math.random() * terminals.length)],
    amount: [15, 20, 30, 50, 80, 100][Math.floor(Math.random() * 6)],
    verifyTime: d.toISOString().replace('T', ' ').slice(0, 19),
    status: statuses[Math.floor(Math.random() * statuses.length)],
  }
})

const riskEvents: RiskEvent[] = [
  { id: 're001', type: 'device_multi_account', level: 'critical', description: '设备IMEI-890123在同一小时内使用5个不同账户领券并核销，疑似套利行为', detectedAt: '2026-06-09 14:23:15', accounts: ['user_0291', 'user_0292', 'user_0293', 'user_0294', 'user_0295'], status: 'pending' },
  { id: 're002', type: 'hoarding', level: 'high', description: '账户user_1583在3天内领取不同活动券87张，远超正常领券频次', detectedAt: '2026-06-09 11:45:30', accounts: ['user_1583'], status: 'processing' },
  { id: 're003', type: 'abnormal_path', level: 'high', description: '发现3位市民在同一商户同一时段集中核销，核销路径高度相似，疑似黄牛操作', detectedAt: '2026-06-09 09:12:44', accounts: ['user_0771', 'user_0772', 'user_0773'], status: 'pending' },
  { id: 're004', type: 'device_multi_account', level: 'medium', description: '设备IMEI-445678在2小时内使用3个账户领券，需关注后续行为', detectedAt: '2026-06-08 20:30:00', accounts: ['user_3310', 'user_3311', 'user_3312'], status: 'resolved' },
  { id: 're005', type: 'hoarding', level: 'medium', description: 'IP地址192.168.45.12下多个账户批量领取社区便民服务券', detectedAt: '2026-06-08 16:55:20', accounts: ['user_2201', 'user_2202', 'user_2203', 'user_2204'], status: 'processing' },
  { id: 're006', type: 'abnormal_path', level: 'low', description: '市民user_5521连续3天在相同时段同一商户核销不同类型券', detectedAt: '2026-06-08 10:20:33', accounts: ['user_5521'], status: 'resolved' },
  { id: 're007', type: 'device_multi_account', level: 'high', description: '设备IMEI-778899关联8个账户，累计核销金额达6400元', detectedAt: '2026-06-07 22:15:00', accounts: ['user_4101', 'user_4102', 'user_4103', 'user_4104', 'user_4105', 'user_4106', 'user_4107', 'user_4108'], status: 'pending' },
  { id: 're008', type: 'hoarding', level: 'critical', description: '检测到组织化批量领券行为，涉及12个关联账户，领取总量超过300张', detectedAt: '2026-06-07 18:40:55', accounts: ['user_6001', 'user_6002', 'user_6003', 'user_6004', 'user_6005', 'user_6006'], status: 'pending' },
]

const merchants: Merchant[] = [
  { id: 'm001', name: '中兴商厦', category: '零售购物', district: '和平区', status: 'active', verifyCount: 2850, verifyAmount: 142500, verifyRate: 0.82 },
  { id: 'm002', name: '万达广场（铁西店）', category: '综合商业', district: '铁西区', status: 'active', verifyCount: 3200, verifyAmount: 160000, verifyRate: 0.78 },
  { id: 'm003', name: '华润万家（皇姑店）', category: '零售购物', district: '皇姑区', status: 'active', verifyCount: 1560, verifyAmount: 78000, verifyRate: 0.85 },
  { id: 'm004', name: '老边饺子馆', category: '餐饮美食', district: '沈河区', status: 'active', verifyCount: 890, verifyAmount: 26700, verifyRate: 0.91 },
  { id: 'm005', name: '中街大悦城', category: '综合商业', district: '大东区', status: 'active', verifyCount: 2100, verifyAmount: 105000, verifyRate: 0.76 },
  { id: 'm006', name: '沈阳市第一人民医院', category: '医疗健康', district: '沈河区', status: 'active', verifyCount: 430, verifyAmount: 43000, verifyRate: 0.95 },
  { id: 'm007', name: '刘一锅（浑南店）', category: '餐饮美食', district: '浑南区', status: 'active', verifyCount: 670, verifyAmount: 20100, verifyRate: 0.88 },
  { id: 'm008', name: '太原街地下商场', category: '零售购物', district: '和平区', status: 'suspended', verifyCount: 320, verifyAmount: 9600, verifyRate: 0.45 },
  { id: 'm009', name: '沈阳故宫文创店', category: '文旅休闲', district: '沈河区', status: 'active', verifyCount: 1200, verifyAmount: 60000, verifyRate: 0.87 },
  { id: 'm010', name: '苏家屯便民超市', category: '零售购物', district: '苏家屯区', status: 'pending_audit', verifyCount: 0, verifyAmount: 0, verifyRate: 0 },
]

const citizenCoupons: CitizenCoupon[] = [
  { id: 'cc001', activityName: '2026春季惠民消费券', faceValue: 50, type: '政务补贴', status: 'unused', receivedAt: '2026-03-15', expiredAt: '2026-06-30' },
  { id: 'cc002', activityName: '满100减20餐饮券', faceValue: 20, type: '民生优惠', status: 'unused', receivedAt: '2026-04-02', expiredAt: '2026-12-31' },
  { id: 'cc003', activityName: '文旅消费专项补贴', faceValue: 100, type: '政务补贴', status: 'unused', receivedAt: '2026-05-10', expiredAt: '2026-07-31' },
  { id: 'cc004', activityName: '铁西商圈地理围栏券', faceValue: 30, type: '商业促销', status: 'used', receivedAt: '2026-04-20', expiredAt: '2026-08-31', merchantName: '万达广场（铁西店）', usedAt: '2026-05-15 14:30:22' },
  { id: 'cc005', activityName: '社区便民服务券', faceValue: 15, type: '民生优惠', status: 'used', receivedAt: '2026-02-15', expiredAt: '2026-05-31', merchantName: '华润万家（皇姑店）', usedAt: '2026-03-08 10:15:33' },
  { id: 'cc006', activityName: '冬季取暖补贴券', faceValue: 200, type: '政务补贴', status: 'used', receivedAt: '2025-11-05', expiredAt: '2026-02-28', merchantName: '沈阳供热集团', usedAt: '2025-12-01 09:00:00' },
  { id: 'cc007', activityName: '2025夏季惠民消费券', faceValue: 30, type: '政务补贴', status: 'expired', receivedAt: '2025-06-01', expiredAt: '2025-09-30' },
  { id: 'cc008', activityName: '社区便民服务券', faceValue: 15, type: '民生优惠', status: 'expired', receivedAt: '2025-08-10', expiredAt: '2025-12-31' },
]

const settlementRecords: SettlementRecord[] = [
  { id: 'st001', city: '大连市', amount: 1250000, status: 'completed', createdAt: '2026-05-28' },
  { id: 'st002', city: '鞍山市', amount: 680000, status: 'processing', createdAt: '2026-06-01' },
  { id: 'st003', city: '抚顺市', amount: 450000, status: 'processing', createdAt: '2026-06-03' },
  { id: 'st004', city: '本溪市', amount: 320000, status: 'pending', createdAt: '2026-06-05' },
  { id: 'st005', city: '丹东市', amount: 560000, status: 'completed', createdAt: '2026-05-20' },
]

const subsidyRecords: SubsidyRecord[] = [
  { id: 'sb001', department: '市商务局', amount: 5000000, purpose: '春季惠民消费券补贴', status: 'disbursed', createdAt: '2026-02-20' },
  { id: 'sb002', department: '市民政局', amount: 2000000, purpose: '社区便民服务专项', status: 'approved', createdAt: '2026-03-15' },
  { id: 'sb003', department: '市文旅局', amount: 1500000, purpose: '文旅消费专项补贴', status: 'disbursed', createdAt: '2026-04-10' },
  { id: 'sb004', department: '市卫健委', amount: 800000, purpose: '医疗健康消费补贴', status: 'draft', createdAt: '2026-06-01' },
  { id: 'sb005', department: '市商务局', amount: 3000000, purpose: '夏季惠民消费券补贴', status: 'draft', createdAt: '2026-06-05' },
]

const auditMerchants: AuditMerchant[] = [
  { id: 'am001', name: '苏家屯便民超市', category: '零售购物', legalPerson: '王建国', licenseNo: '91210106MA0X1Y2Z3A', status: 'pending', submittedAt: '2026-06-07' },
  { id: 'am002', name: '沈北新区农家乐', category: '餐饮美食', legalPerson: '李秀英', licenseNo: '91210113MA0X4A5B6C', status: 'pending', submittedAt: '2026-06-06' },
  { id: 'am003', name: '于洪区健康药房', category: '医疗健康', legalPerson: '张丽华', licenseNo: '91210114MA0X7C8D9E', status: 'approved', submittedAt: '2026-06-03' },
  { id: 'am004', name: '辽中生鲜超市', category: '零售购物', legalPerson: '陈明远', licenseNo: '91210115MA0X0E1F2G', status: 'rejected', submittedAt: '2026-05-28' },
]

const initialAuditLogs: AuditLog[] = [
  { id: 'al001', targetId: 'ca001', targetType: 'coupon_activity', action: 'create', operator: '管理员张明', operatorRole: 'admin', detail: '创建活动「2026春季惠民消费券」，策略：人群包投放', timestamp: '2026-02-25 09:30:00' },
  { id: 'al002', targetId: 'ca005', targetType: 'coupon_activity', action: 'pause', operator: '管理员张明', operatorRole: 'admin', detail: '暂停活动「社区便民服务券」，原因：核销率偏低需调整', timestamp: '2026-04-15 14:20:00' },
  { id: 'al003', targetId: 'ca008', targetType: 'coupon_activity', action: 'save_draft', operator: '管理员张明', operatorRole: 'admin', detail: '保存草稿「医疗健康满减券」，策略：满减触发(满200元)', timestamp: '2026-06-01 16:45:00' },
  { id: 'al004', targetId: 'ca002', targetType: 'coupon_activity', action: 'edit', operator: '管理员李华', operatorRole: 'admin', detail: '编辑活动「铁西商圈地理围栏券」，围栏半径由2000米调整为3000米', timestamp: '2026-05-10 11:00:00' },
]

export const useStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  currentPortal: 'admin',
  setCurrentPortal: (portal) => set({ currentPortal: portal }),

  dashboardMetrics: {
    totalIssued: 283000,
    totalVerified: 186970,
    verifyRate: 66.1,
    activeMerchants: 8,
    totalBenefit: 9348500,
    dailyTrend,
    districtData,
    categoryDistribution,
  },
  couponActivities: initialCouponActivities,
  verifyRecords,
  riskEvents,
  merchants,
  citizenCoupons,
  settlementRecords,
  subsidyRecords,
  auditMerchants,
  auditLogs: initialAuditLogs,
  toasts: [],

  addCouponActivity: (activity) => set((s) => ({
    couponActivities: [...s.couponActivities, activity],
  })),

  updateCouponActivity: (id, updates) => set((s) => ({
    couponActivities: s.couponActivities.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    ),
  })),

  changeCouponStatus: (id, newStatus, operator, detail) => set((s) => {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const prev = s.couponActivities.find((a) => a.id === id)
    const actionMap: Record<string, AuditLog['action']> = {
      draft: 'save_draft',
      paused: 'pause',
    }
    let action = actionMap[newStatus]
    if (!action && newStatus === 'active' && prev?.status === 'paused') {
      action = 'resume'
    }
    if (!action && newStatus === 'active') {
      action = 'submit'
    }
    if (!action) action = 'edit'
    const log: AuditLog = {
      id: `al${Date.now()}`,
      targetId: id,
      targetType: 'coupon_activity',
      action,
      operator,
      operatorRole: 'admin',
      detail,
      timestamp: ts,
    }
    return {
      couponActivities: s.couponActivities.map((a) =>
        a.id === id ? { ...a, status: newStatus } : a
      ),
      auditLogs: [log, ...s.auditLogs],
    }
  }),

  addAuditLog: (log) => set((s) => ({
    auditLogs: [{
      ...log,
      id: `al${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }, ...s.auditLogs],
  })),

  showToast: (type, message) => {
    const id = `toast_${Date.now()}`
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },

  dismissToast: (id) => set((s) => ({
    toasts: s.toasts.filter((t) => t.id !== id),
  })),
}))
