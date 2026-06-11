import type {
  User,
  SocialInsuranceRecord,
  TransferApplication,
  UnemploymentRegistration,
  PensionEstimate,
  DashboardData,
  AuditLogEntry,
  Notification,
  TodoItem,
  CertificationRecord,
  EVoucherRecord,
  MediationCase,
  QualificationCert,
} from '@/types'

export const mockUsers: Record<string, User> = {
  insured: {
    id: 'U001',
    name: '张明',
    idCard: '110101199001011234',
    role: 'insured',
    region: '北京市',
    authLevel: 2,
    avatar: '',
  },
  employed: {
    id: 'U002',
    name: '李芳',
    idCard: '310101199205052345',
    role: 'employed',
    region: '上海市',
    authLevel: 2,
    avatar: '',
  },
  retired: {
    id: 'U003',
    name: '王建国',
    idCard: '440101195808083456',
    role: 'retired',
    region: '广东省',
    authLevel: 2,
    avatar: '',
  },
  agent: {
    id: 'A001',
    name: '赵晓红',
    idCard: '330101198512124567',
    role: 'agent',
    region: '浙江省杭州市',
    authLevel: 2,
    avatar: '',
  },
}

export const mockSocialInsurance: SocialInsuranceRecord[] = [
  {
    type: 'pension',
    status: 'active',
    months: 186,
    baseAmount: 12000,
    personalAmount: 960,
    companyAmount: 1920,
    monthlyDetails: Array.from({ length: 12 }, (_, i) => ({
      month: `2025-${String(i + 1).padStart(2, '0')}`,
      personalPay: 960,
      companyPay: 1920,
      base: 12000,
    })),
  },
  {
    type: 'medical',
    status: 'active',
    months: 186,
    baseAmount: 12000,
    personalAmount: 240,
    companyAmount: 1200,
    monthlyDetails: Array.from({ length: 12 }, (_, i) => ({
      month: `2025-${String(i + 1).padStart(2, '0')}`,
      personalPay: 240,
      companyPay: 1200,
      base: 12000,
    })),
  },
  {
    type: 'unemployment',
    status: 'active',
    months: 186,
    baseAmount: 12000,
    personalAmount: 60,
    companyAmount: 120,
    monthlyDetails: Array.from({ length: 12 }, (_, i) => ({
      month: `2025-${String(i + 1).padStart(2, '0')}`,
      personalPay: 60,
      companyPay: 120,
      base: 12000,
    })),
  },
  {
    type: 'workInjury',
    status: 'active',
    months: 186,
    baseAmount: 12000,
    personalAmount: 0,
    companyAmount: 72,
    monthlyDetails: Array.from({ length: 12 }, (_, i) => ({
      month: `2025-${String(i + 1).padStart(2, '0')}`,
      personalPay: 0,
      companyPay: 72,
      base: 12000,
    })),
  },
  {
    type: 'maternity',
    status: 'active',
    months: 186,
    baseAmount: 12000,
    personalAmount: 0,
    companyAmount: 96,
    monthlyDetails: Array.from({ length: 12 }, (_, i) => ({
      month: `2025-${String(i + 1).padStart(2, '0')}`,
      personalPay: 0,
      companyPay: 96,
      base: 12000,
    })),
  },
]

export const mockTransferApplications: TransferApplication[] = [
  {
    id: 'TF20250001',
    fromProvince: '北京市',
    toProvince: '上海市',
    transferType: 'pension',
    status: 'transferring',
    steps: [
      { name: '提交申请', status: 'done', date: '2025-04-10', note: '申请已提交' },
      { name: '转出地审核', status: 'done', date: '2025-04-15', note: '审核通过' },
      { name: '资金划转', status: 'current', note: '资金划转中' },
      { name: '转入地确认', status: 'pending' },
      { name: '转移完成', status: 'pending' },
    ],
    createdAt: '2025-04-10',
  },
  {
    id: 'TF20250002',
    fromProvince: '广东省',
    toProvince: '浙江省',
    transferType: 'medical',
    status: 'completed',
    steps: [
      { name: '提交申请', status: 'done', date: '2025-01-05', note: '申请已提交' },
      { name: '转出地审核', status: 'done', date: '2025-01-10', note: '审核通过' },
      { name: '资金划转', status: 'done', date: '2025-01-20', note: '资金已划转' },
      { name: '转入地确认', status: 'done', date: '2025-01-25', note: '已确认接收' },
      { name: '转移完成', status: 'done', date: '2025-01-28', note: '转移已完成' },
    ],
    createdAt: '2025-01-05',
  },
]

export const mockUnemploymentRegistration: UnemploymentRegistration = {
  id: 'UE20250001',
  status: 'submitted',
  reason: '企业裁员',
  lastEmployer: '北京某科技有限公司',
  severanceDate: '2025-03-15',
  claimAmount: 2034,
  claimMonths: 18,
}

export const mockPensionEstimate: PensionEstimate = {
  monthlyPension: 4860,
  replacementRate: 0.58,
  totalContribution: 345600,
  projectedPension: Array.from({ length: 20 }, (_, i) => ({
    year: 2026 + i,
    monthlyAmount: Math.round(4860 * Math.pow(1.03, i)),
    cumulative: Math.round(4860 * 12 * Math.pow(1.03, i)),
  })),
}

export const mockDashboardData: DashboardData = {
  totalCalls: 2847563,
  callsTrend: Array.from({ length: 30 }, (_, i) => ({
    date: `2025-05-${String(i + 1).padStart(2, '0')}`,
    count: 80000 + Math.floor(Math.random() * 20000),
  })),
  completionRate: 94.7,
  completionTrend: Array.from({ length: 30 }, (_, i) => ({
    date: `2025-05-${String(i + 1).padStart(2, '0')}`,
    count: 90 + Math.floor(Math.random() * 8),
  })),
  overdueWarnings: [
    { id: 'OW001', service: '社保关系转移', applicant: '张某某', days: 15, level: 'critical' },
    { id: 'OW002', service: '失业金申领', applicant: '李某某', days: 8, level: 'warning' },
    { id: 'OW003', service: '待遇资格认证', applicant: '王某某', days: 12, level: 'critical' },
    { id: 'OW004', service: '养老金测算', applicant: '赵某某', days: 5, level: 'warning' },
    { id: 'OW005', service: '劳动争议调解', applicant: '孙某某', days: 10, level: 'critical' },
  ],
  provinceHotspots: [
    { province: '广东', count: 385000, growth: 12.3 },
    { province: '江苏', count: 312000, growth: 8.7 },
    { province: '山东', count: 289000, growth: 6.5 },
    { province: '浙江', count: 276000, growth: 10.2 },
    { province: '河南', count: 245000, growth: 5.8 },
    { province: '四川', count: 218000, growth: 7.4 },
    { province: '湖北', count: 195000, growth: 9.1 },
    { province: '湖南', count: 182000, growth: 4.6 },
    { province: '河北', count: 168000, growth: 3.2 },
    { province: '北京', count: 156000, growth: 11.5 },
  ],
  topServices: [
    { name: '社保查询', calls: 892000, completionRate: 98.2 },
    { name: '养老金测算', calls: 567000, completionRate: 96.5 },
    { name: '关系转移', calls: 423000, completionRate: 91.3 },
    { name: '待遇资格认证', calls: 389000, completionRate: 95.8 },
    { name: '失业登记/申领', calls: 312000, completionRate: 93.7 },
    { name: '职业资格核验', calls: 198000, completionRate: 97.1 },
    { name: '劳动争议调解', calls: 156000, completionRate: 88.4 },
  ],
}

export const mockAuditLogs: AuditLogEntry[] = Array.from({ length: 50 }, (_, i) => {
  const categories: AuditLogEntry['category'][] = ['query', 'transfer', 'claim', 'certify', 'review', 'system']
  const actions = ['查询社保信息', '提交关系转移', '申领失业金', '待遇资格认证', '审核业务', '系统登录']
  const results: AuditLogEntry['result'][] = ['success', 'failure']
  return {
    id: `AL${String(i + 1).padStart(6, '0')}`,
    operatorId: i % 3 === 0 ? 'A001' : `U${String(i % 10 + 1).padStart(3, '0')}`,
    operatorName: i % 3 === 0 ? '赵晓红' : ['张明', '李芳', '王建国', '刘洋', '陈静', '周磊', '吴敏', '郑华', '孙丽', '钱伟'][i % 10],
    action: actions[i % actions.length],
    category: categories[i % categories.length],
    target: i % 3 === 0 ? `业务单号：BN${String(20250000 + i).padStart(8, '0')}` : '个人账户',
    timestamp: `2025-06-${String(Math.min(i + 1, 30)).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:${String(i * 7 % 60).padStart(2, '0')}:00`,
    ip: `192.168.${i % 255}.${(i * 3) % 255}`,
    result: i % 8 === 0 ? 'failure' : 'success',
  }
})

export const mockNotifications: Notification[] = [
  { id: 'N001', title: '社保关系转移进度更新', content: '您的养老保险关系转移申请已进入资金划转阶段，请留意后续通知。', time: '2025-06-09 09:30', read: false, type: 'info' },
  { id: 'N002', title: '待遇资格认证提醒', content: '您的待遇资格认证将于2025年7月1日到期，请及时完成认证。', time: '2025-06-08 14:00', read: false, type: 'warning' },
  { id: 'N003', title: '养老金调整通知', content: '2025年度养老金调整方案已公布，您的月养老金将增加180元。', time: '2025-06-07 10:00', read: true, type: 'success' },
  { id: 'N004', title: '异常登录提醒', content: '检测到您的账户于2025-06-06 03:22在新设备上登录，如非本人操作请及时修改密码。', time: '2025-06-06 03:22', read: true, type: 'error' },
]

export const mockTodoItems: TodoItem[] = [
  { id: 'T001', title: '完成待遇资格认证', deadline: '2025-07-01', priority: 'high', status: 'pending' },
  { id: 'T002', title: '确认社保关系转移信息', deadline: '2025-06-15', priority: 'high', status: 'processing' },
  { id: 'T003', title: '补充失业登记材料', deadline: '2025-06-20', priority: 'medium', status: 'pending' },
  { id: 'T004', title: '更新个人联系方式', deadline: '2025-06-30', priority: 'low', status: 'pending' },
]

export const mockCertificationRecords: CertificationRecord[] = [
  { id: 'CR001', type: 'face', status: 'success', time: '2025-06-01 10:30', location: '北京市' },
  { id: 'CR002', type: 'card', status: 'success', time: '2025-05-15 14:20', location: '北京市' },
  { id: 'CR003', type: 'face', status: 'failed', time: '2025-04-20 09:10', location: '上海市' },
]

export const mockEVoucherRecords: EVoucherRecord[] = [
  { id: 'EV001', type: 'medical', amount: 256.8, location: '北京协和医院', time: '2025-06-08 11:30', status: 'used' },
  { id: 'EV002', type: 'transit', location: '北京地铁1号线', time: '2025-06-09 08:15', status: 'used' },
  { id: 'EV003', type: 'culture', location: '国家博物馆', time: '2025-06-07 14:00', status: 'used' },
  { id: 'EV004', type: 'medical', amount: 89.5, location: '北京同仁医院', time: '2025-06-05 16:45', status: 'used' },
  { id: 'EV005', type: 'transit', location: '北京地铁2号线', time: '2025-06-06 07:50', status: 'used' },
]

export const mockMediationCases: MediationCase[] = [
  {
    id: 'MD20250001',
    title: '劳动合同纠纷调解',
    status: 'mediating',
    counterparty: '北京某科技有限公司',
    createdAt: '2025-05-20',
    messages: [
      { id: 'M001', sender: 'mediator', content: '调解已受理，请双方在调解室内陈述意见。', time: '2025-05-20 10:00' },
      { id: 'M002', sender: 'applicant', content: '公司未按合同约定支付加班费，累计欠付3个月。', time: '2025-05-20 10:15' },
      { id: 'M003', sender: 'counterparty', content: '因公司经营困难，愿意协商分期支付方案。', time: '2025-05-20 11:00' },
      { id: 'M004', sender: 'mediator', content: '建议双方在两周内达成和解方案，调解员将持续跟进。', time: '2025-05-20 11:30' },
    ],
  },
]

export const mockQualificationCerts: QualificationCert[] = [
  { id: 'QC001', name: '中级会计师', level: '中级', issueDate: '2020-06-15', issuer: '财政部', valid: true, certNo: '2020061500001' },
  { id: 'QC002', name: '人力资源管理师', level: '三级', issueDate: '2019-11-20', issuer: '人社部', valid: true, certNo: '2019112000002' },
  { id: 'QC003', name: '注册安全工程师', level: '中级', issueDate: '2022-08-10', issuer: '应急管理部', valid: true, certNo: '2022081000003' },
]
