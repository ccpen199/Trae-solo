import type {
  User,
  HouseholdBiz,
  AuditLog,
  Certificate,
  PaymentRecord,
  SocialAccount,
  HealthCode,
  TransportQr,
  TransportRecord,
  School,
  District,
  RecommendService,
} from '../../shared/types.js'

export const users = new Map<string, User>()
export const householdBiz = new Map<string, HouseholdBiz>()
export const auditLogs: AuditLog[] = []
export const certificates = new Map<string, Certificate[]>()
export const socialRecords = new Map<string, PaymentRecord[]>()
export const socialAccounts = new Map<string, SocialAccount>()
export const healthCodes = new Map<string, HealthCode>()
export const serviceUsageCount = new Map<string, number>()
export const transportQr = new Map<string, TransportQr>()
export const transportRecords = new Map<string, TransportRecord[]>()
export const schools = new Map<string, School[]>()
export const districts = new Map<string, District[]>()

const demoUserId = 'demo-user'

const demoUser: User = {
  id: demoUserId,
  name: '张三',
  idCard: '110101199001011234',
  phone: '138****8888',
  avatar: '',
  realNameVerified: true,
  elderlyMode: false,
  fontScale: 1,
  voiceNav: false,
  relatives: [
    {
      id: 'relative-1',
      name: '张父',
      relation: '父亲',
      idCardMasked: '1101011960****5678',
      authorized: true,
    },
  ],
}

users.set(demoUserId, demoUser)

const demoSocialAccount: SocialAccount = {
  social: {
    pension: 125000.5,
    medical: 28500.3,
    unemployment: 8500,
    workInjury: 3200,
    maternity: 2100,
    months: 180,
    status: 'normal',
  },
  fund: {
    balance: 256800,
    monthly: 2400,
    months: 180,
    lastDeposit: '2026-05-15',
  },
}

socialAccounts.set(demoUserId, demoSocialAccount)

const generatePaymentRecords = (): PaymentRecord[] => {
  const records: PaymentRecord[] = []
  const types: ('pension' | 'medical' | 'fund')[] = ['pension', 'medical', 'fund']
  for (let i = 1; i <= 12; i++) {
    types.forEach((type) => {
      records.push({
        id: `pay-${demoUserId}-${i}-${type}`,
        month: `2025-${String(i).padStart(2, '0')}`,
        type,
        base: 12000,
        personal: type === 'fund' ? 1200 : type === 'medical' ? 240 : 960,
        company: type === 'fund' ? 1200 : type === 'medical' ? 1200 : 2400,
        status: 'paid',
      })
    })
  }
  return records
}

socialRecords.set(demoUserId, generatePaymentRecords())

const demoHouseholdBizList: HouseholdBiz[] = [
  {
    id: 'biz-settle-001',
    type: 'settle',
    title: '人才引进落户申请',
    status: 'reviewing',
    steps: [
      { name: '提交申请', status: 'done', time: '2026-05-10 09:30', desc: '材料已提交' },
      { name: '材料预审', status: 'done', time: '2026-05-12 14:20', desc: '预审通过' },
      { name: '部门审核', status: 'active', desc: '人社局审核中' },
      { name: '审批决定', status: 'pending' },
      { name: '办结', status: 'pending' },
    ],
    submittedAt: '2026-05-10 09:30',
    estimatedDays: 15,
    materials: [
      { name: '身份证', required: true, uploaded: true, ocrPassed: true },
      { name: '户口本', required: true, uploaded: true, ocrPassed: true },
      { name: '学历证明', required: true, uploaded: true, ocrPassed: true },
      { name: '社保证明', required: true, uploaded: true, ocrPassed: true },
    ],
  },
  {
    id: 'biz-residence-001',
    type: 'residence',
    title: '居住证办理',
    status: 'completed',
    steps: [
      { name: '提交申请', status: 'done', time: '2026-03-01 10:00' },
      { name: '材料预审', status: 'done', time: '2026-03-02 11:00' },
      { name: '部门审核', status: 'done', time: '2026-03-05 15:30' },
      { name: '审批决定', status: 'done', time: '2026-03-08 09:00' },
      { name: '办结', status: 'done', time: '2026-03-10 16:00', desc: '已完成' },
    ],
    submittedAt: '2026-03-01 10:00',
    estimatedDays: 15,
    materials: [
      { name: '身份证', required: true, uploaded: true, ocrPassed: true },
      { name: '租房合同', required: true, uploaded: true, ocrPassed: true },
    ],
  },
]

demoHouseholdBizList.forEach((biz) => householdBiz.set(biz.id, biz))

const demoCertificates: Certificate[] = [
  {
    id: 'cert-idcard-001',
    type: 'idcard',
    title: '居民身份证',
    numberMasked: '110101********1234',
    holder: '张三',
    issueDate: '2020-06-15',
    expireDate: '2040-06-15',
    issueBy: '北京市公安局',
    status: 'valid',
  },
  {
    id: 'cert-driver-001',
    type: 'driver',
    title: '机动车驾驶证',
    numberMasked: '110101********1234',
    holder: '张三',
    issueDate: '2015-03-20',
    expireDate: '2027-03-20',
    issueBy: '北京市公安局交通管理局',
    status: 'valid',
  },
  {
    id: 'cert-marriage-001',
    type: 'marriage',
    title: '结婚证',
    numberMasked: '京朝结字********号',
    holder: '张三',
    issueDate: '2020-10-01',
    expireDate: '9999-12-31',
    issueBy: '北京市朝阳区民政局',
    status: 'valid',
  },
]

certificates.set(demoUserId, demoCertificates)

const demoHealthCode: HealthCode = {
  status: 'green',
  qrToken: 'health-qr-' + Date.now(),
  updatedAt: new Date().toISOString(),
  vaccine: {
    name: '新冠灭活疫苗',
    doses: 3,
    lastDate: '2023-02-15',
  },
  pcr: {
    result: 'negative',
    date: '2026-06-20',
    lab: '北京市海淀区检测中心',
  },
}

healthCodes.set(demoUserId, demoHealthCode)

const demoAuditLogs: AuditLog[] = [
  {
    id: 'log-001',
    userId: demoUserId,
    action: 'login',
    module: 'auth',
    ip: '192.168.1.100',
    ua: 'Mozilla/5.0',
    time: '2026-06-20 08:30:00',
    result: 'success',
    detail: '用户登录',
  },
  {
    id: 'log-002',
    userId: demoUserId,
    action: 'query',
    module: 'social',
    ip: '192.168.1.100',
    ua: 'Mozilla/5.0',
    time: '2026-06-20 08:35:00',
    result: 'success',
    detail: '查询社保账户',
  },
  {
    id: 'log-003',
    userId: demoUserId,
    action: 'view',
    module: 'certificates',
    ip: '192.168.1.100',
    ua: 'Mozilla/5.0',
    time: '2026-06-20 09:00:00',
    result: 'success',
    detail: '查看电子证照',
  },
]

auditLogs.push(...demoAuditLogs)

const demoUsageCount: Record<string, number> = {
  social: 15,
  'health-code': 12,
  transport: 28,
  household: 5,
  certificates: 8,
  education: 3,
  audit: 2,
}

Object.entries(demoUsageCount).forEach(([key, value]) => {
  serviceUsageCount.set(`${demoUserId}:${key}`, value)
})

const demoTransportQr: TransportQr = {
  token: 'transport-qr-token-demo',
  expireIn: 60,
  balance: 128.5,
  type: '公交地铁通用码',
}

transportQr.set(demoUserId, demoTransportQr)

const demoTransportRecords: TransportRecord[] = [
  { id: 'tr-001', time: '2026-06-20 08:15', route: '地铁1号线', amount: 6, type: 'subway' },
  { id: 'tr-002', time: '2026-06-20 18:30', route: '公交302路', amount: 2, type: 'bus' },
  { id: 'tr-003', time: '2026-06-19 07:50', route: '地铁10号线', amount: 5, type: 'subway' },
  { id: 'tr-004', time: '2026-06-19 19:10', route: '公交68路', amount: 2, type: 'bus' },
  { id: 'tr-005', time: '2026-06-18 08:20', route: '地铁2号线', amount: 4, type: 'subway' },
]

transportRecords.set(demoUserId, demoTransportRecords)

const demoDistricts: District[] = [
  { code: '110101', name: '东城区', schools: 32 },
  { code: '110102', name: '西城区', schools: 45 },
  { code: '110105', name: '朝阳区', schools: 68 },
  { code: '110106', name: '丰台区', schools: 38 },
  { code: '110107', name: '石景山区', schools: 22 },
  { code: '110108', name: '海淀区', schools: 72 },
]

districts.set('default', demoDistricts)

const demoSchools: School[] = [
  { id: 'sch-001', name: '北京市朝阳区实验小学', district: '110105', address: '朝阳区建国路88号', level: 'primary' },
  { id: 'sch-002', name: '北京市朝阳区第二实验小学', district: '110105', address: '朝阳区望京西路10号', level: 'primary' },
  { id: 'sch-003', name: '北京市海淀区中关村第一小学', district: '110108', address: '海淀区中关村南二街5号', level: 'primary' },
  { id: 'sch-004', name: '北京市海淀区中关村第三小学', district: '110108', address: '海淀区万柳中路6号', level: 'primary' },
  { id: 'sch-005', name: '北京市西城区育才中学', district: '110102', address: '西城区东经路21号', level: 'junior' },
  { id: 'sch-006', name: '北京市东城区东直门中学', district: '110101', address: '东城区东直门内北顺城街2号', level: 'junior' },
  { id: 'sch-007', name: '北京市第四中学', district: '110102', address: '西城区西黄城根北街甲2号', level: 'senior' },
  { id: 'sch-008', name: '北京市第八十中学', district: '110105', address: '朝阳区望京北路甲16号', level: 'senior' },
]

schools.set('default', demoSchools)

export const recommendServices: RecommendService[] = [
  { id: 'service-social', title: '社保公积金查询', icon: 'PiggyBank', description: '查询社保、公积金账户及缴费明细', category: 'social', usageCount: 0 },
  { id: 'service-transport', title: '扫码乘车', icon: 'QrCode', description: '公交地铁一码通行', category: 'transport', usageCount: 0 },
  { id: 'service-health', title: '健康码亮证', icon: 'Heart', description: '展示健康码、疫苗核酸记录', category: 'health', usageCount: 0 },
  { id: 'service-household', title: '户籍业务办理', icon: 'Building2', description: '落户、居住证、新生儿入户等', category: 'household', usageCount: 0 },
  { id: 'service-certificates', title: '电子证照', icon: 'FileText', description: '身份证、驾驶证、结婚证等电子证照', category: 'certificates', usageCount: 0 },
  { id: 'service-education', title: '教育服务', icon: 'GraduationCap', description: '学区查询、幼升小报名', category: 'education', usageCount: 0 },
  { id: 'service-audit', title: '操作日志', icon: 'ClipboardList', description: '查看个人操作审计记录', category: 'audit', usageCount: 0 },
]

export const incrementUsageCount = (userId: string, serviceId: string): void => {
  const key = `${userId}:${serviceId}`
  const current = serviceUsageCount.get(key) || 0
  serviceUsageCount.set(key, current + 1)
}

export const getUsageCount = (userId: string, serviceId: string): number => {
  return serviceUsageCount.get(`${userId}:${serviceId}`) || 0
}

export const getUserHouseholdBiz = (userId: string): HouseholdBiz[] => {
  return Array.from(householdBiz.values()).filter((biz) => biz.id.includes(userId) || biz.id.startsWith('biz-'))
}
