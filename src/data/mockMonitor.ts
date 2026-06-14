export interface ProbeNode {
  id: string
  name: string
  service: string
  status: 'healthy' | 'warning' | 'error' | 'offline'
  responseTime: number
  uptime: number
  lastCheck: string
  location: string
  cpu: number
  memory: number
  requests: number
  errorRate: number
}

export interface NPSTrend {
  month: string
  score: number
}

export interface NPSData {
  score: number
  trends: NPSTrend[]
  tags: { name: string; count: number; sentiment: 'positive' | 'negative' | 'neutral' }[]
}

export interface HotKeyword {
  id: string
  keyword: string
  count: number
  trend: 'up' | 'down' | 'stable'
  category: string
  noResultCount: number
  conversionRate: number
}

export interface SupplyGap {
  id: string
  service: string
  demand: number
  supply: number
  gap: number
  department: string
  description: string
  hotwordReferences: string[]
  trend: 'worsening' | 'improving' | 'stable'
  priority: 'high' | 'medium' | 'low'
}

export interface NPSSurvey {
  id: string
  serviceId: string
  serviceName: string
  score: number
  comment: string
  tags: string[]
  submitTime: string
  userId: string
  category: 'praise' | 'suggestion' | 'complaint'
}

export interface GapDisposition {
  gapId: string
  status: 'pending' | 'processing' | 'resolved' | 'reviewed'
  assigneeDepartment: string
  assignee: string
  createdAt: string
  updatedAt: string
  deadline: string
  measures: string[]
  resolution?: string
  reviewResult?: 'pass' | 'fail' | 'pending'
  relatedHotwords: string[]
}

export interface HotwordGapLink {
  hotword: string
  gapId: string
  correlationStrength: number
  analysis: string
}

export interface ProbeAlert {
  id: string
  nodeId: string
  level: 'info' | 'warning' | 'critical'
  alertType: string
  message: string
  firstTriggered: string
  lastTriggered: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

export const probeNodes: ProbeNode[] = [
  {
    id: 'probe_1',
    name: '统一身份认证节点',
    service: '统一身份认证',
    status: 'healthy',
    responseTime: 45,
    uptime: 99.98,
    lastCheck: '2026-06-10 14:30:00',
    location: '福田数据中心',
    cpu: 32,
    memory: 58,
    requests: 128560,
    errorRate: 0.02,
  },
  {
    id: 'probe_2',
    name: '电子证照服务节点',
    service: '电子证照',
    status: 'healthy',
    responseTime: 62,
    uptime: 99.95,
    lastCheck: '2026-06-10 14:30:00',
    location: '南山数据中心',
    cpu: 45,
    memory: 62,
    requests: 98230,
    errorRate: 0.05,
  },
  {
    id: 'probe_3',
    name: '事项管理系统节点',
    service: '事项管理',
    status: 'warning',
    responseTime: 280,
    uptime: 99.82,
    lastCheck: '2026-06-10 14:30:00',
    location: '福田数据中心',
    cpu: 78,
    memory: 85,
    requests: 56780,
    errorRate: 0.18,
  },
  {
    id: 'probe_4',
    name: '统一支付平台节点',
    service: '统一支付',
    status: 'healthy',
    responseTime: 38,
    uptime: 99.99,
    lastCheck: '2026-06-10 14:30:00',
    location: '前海数据中心',
    cpu: 28,
    memory: 45,
    requests: 234560,
    errorRate: 0.01,
  },
  {
    id: 'probe_5',
    name: '数据共享交换节点',
    service: '数据共享',
    status: 'healthy',
    responseTime: 55,
    uptime: 99.96,
    lastCheck: '2026-06-10 14:30:00',
    location: '龙岗数据中心',
    cpu: 52,
    memory: 68,
    requests: 178920,
    errorRate: 0.04,
  },
  {
    id: 'probe_6',
    name: '消息推送服务节点',
    service: '消息推送',
    status: 'healthy',
    responseTime: 25,
    uptime: 99.97,
    lastCheck: '2026-06-10 14:30:00',
    location: '福田数据中心',
    cpu: 18,
    memory: 35,
    requests: 562340,
    errorRate: 0.03,
  },
  {
    id: 'probe_7',
    name: '物流追踪服务节点',
    service: '物流追踪',
    status: 'error',
    responseTime: 1500,
    uptime: 98.56,
    lastCheck: '2026-06-10 14:30:00',
    location: '宝安数据中心',
    cpu: 95,
    memory: 92,
    requests: 34560,
    errorRate: 1.44,
  },
  {
    id: 'probe_8',
    name: '统一评价服务节点',
    service: '统一评价',
    status: 'healthy',
    responseTime: 42,
    uptime: 99.94,
    lastCheck: '2026-06-10 14:30:00',
    location: '南山数据中心',
    cpu: 22,
    memory: 40,
    requests: 89670,
    errorRate: 0.06,
  },
  {
    id: 'probe_9',
    name: '智能客服服务节点',
    service: '智能客服',
    status: 'warning',
    responseTime: 350,
    uptime: 99.75,
    lastCheck: '2026-06-10 14:30:00',
    location: '前海数据中心',
    cpu: 82,
    memory: 78,
    requests: 456230,
    errorRate: 0.25,
  },
  {
    id: 'probe_10',
    name: '网上办事大厅节点',
    service: '网上办事',
    status: 'healthy',
    responseTime: 68,
    uptime: 99.93,
    lastCheck: '2026-06-10 14:30:00',
    location: '福田数据中心',
    cpu: 56,
    memory: 72,
    requests: 312450,
    errorRate: 0.07,
  },
  {
    id: 'probe_11',
    name: '移动端服务网关节点',
    service: '移动端网关',
    status: 'offline',
    responseTime: 0,
    uptime: 97.23,
    lastCheck: '2026-06-10 14:28:00',
    location: '龙岗数据中心',
    cpu: 0,
    memory: 0,
    requests: 0,
    errorRate: 2.77,
  },
  {
    id: 'probe_12',
    name: '电子签章服务节点',
    service: '电子签章',
    status: 'healthy',
    responseTime: 88,
    uptime: 99.91,
    lastCheck: '2026-06-10 14:30:00',
    location: '福田数据中心',
    cpu: 35,
    memory: 55,
    requests: 67890,
    errorRate: 0.09,
  },
  {
    id: 'probe_13',
    name: '档案管理服务节点',
    service: '档案管理',
    status: 'healthy',
    responseTime: 95,
    uptime: 99.88,
    lastCheck: '2026-06-10 14:30:00',
    location: '南山数据中心',
    cpu: 42,
    memory: 60,
    requests: 45670,
    errorRate: 0.12,
  },
]

export const npsData: NPSData = {
  score: 72,
  trends: [
    { month: '2025-07', score: 58 },
    { month: '2025-08', score: 60 },
    { month: '2025-09', score: 62 },
    { month: '2025-10', score: 65 },
    { month: '2025-11', score: 64 },
    { month: '2025-12', score: 67 },
    { month: '2026-01', score: 68 },
    { month: '2026-02', score: 70 },
    { month: '2026-03', score: 69 },
    { month: '2026-04', score: 71 },
    { month: '2026-05', score: 72 },
    { month: '2026-06', score: 72 },
  ],
  tags: [
    { name: '办理速度快', count: 3842, sentiment: 'positive' },
    { name: '操作简便', count: 3256, sentiment: 'positive' },
    { name: '免证办方便', count: 2890, sentiment: 'positive' },
    { name: '在线服务好', count: 2345, sentiment: 'positive' },
    { name: '一窗通高效', count: 1890, sentiment: 'positive' },
    { name: '系统响应慢', count: 1560, sentiment: 'negative' },
    { name: '材料要求多', count: 1230, sentiment: 'negative' },
    { name: '页面加载慢', count: 980, sentiment: 'negative' },
    { name: '流程不清晰', count: 876, sentiment: 'negative' },
    { name: '重复填信息', count: 756, sentiment: 'negative' },
    { name: '功能较完善', count: 1230, sentiment: 'positive' },
    { name: '指南详细', count: 890, sentiment: 'positive' },
    { name: '偶尔出错', count: 650, sentiment: 'neutral' },
    { name: '需要优化', count: 540, sentiment: 'neutral' },
  ],
}

export const hotKeywords: HotKeyword[] = [
  { id: 'kw_1', keyword: '居住证办理', count: 28560, trend: 'up', category: '户政', noResultCount: 342, conversionRate: 0.78 },
  { id: 'kw_2', keyword: '社保查询', count: 25340, trend: 'stable', category: '社保', noResultCount: 255, conversionRate: 0.82 },
  { id: 'kw_3', keyword: '公积金提取', count: 22890, trend: 'up', category: '住房', noResultCount: 275, conversionRate: 0.75 },
  { id: 'kw_4', keyword: '营业执照', count: 20150, trend: 'up', category: '市场准入', noResultCount: 302, conversionRate: 0.71 },
  { id: 'kw_5', keyword: '驾驶证换证', count: 18760, trend: 'stable', category: '交通', noResultCount: 188, conversionRate: 0.85 },
  { id: 'kw_6', keyword: '医保报销', count: 16540, trend: 'up', category: '医保', noResultCount: 248, conversionRate: 0.73 },
  { id: 'kw_7', keyword: '不动产登记', count: 15320, trend: 'stable', category: '住房', noResultCount: 214, conversionRate: 0.79 },
  { id: 'kw_8', keyword: '户籍迁移', count: 14280, trend: 'up', category: '户政', noResultCount: 286, conversionRate: 0.68 },
  { id: 'kw_9', keyword: '企业注销', count: 12890, trend: 'down', category: '市场准入', noResultCount: 155, conversionRate: 0.81 },
  { id: 'kw_10', keyword: '人才引进', count: 12340, trend: 'up', category: '人才', noResultCount: 222, conversionRate: 0.76 },
  { id: 'kw_11', keyword: '公积金贷款', count: 11560, trend: 'stable', category: '住房', noResultCount: 208, conversionRate: 0.74 },
  { id: 'kw_12', keyword: '身份证补办', count: 10890, trend: 'stable', category: '户政', noResultCount: 131, conversionRate: 0.88 },
  { id: 'kw_13', keyword: '交通违法处理', count: 9870, trend: 'down', category: '交通', noResultCount: 118, conversionRate: 0.86 },
  { id: 'kw_14', keyword: '新生儿出生登记', count: 9230, trend: 'up', category: '户政', noResultCount: 185, conversionRate: 0.72 },
  { id: 'kw_15', keyword: '保障性住房', count: 8760, trend: 'up', category: '住房', noResultCount: 350, conversionRate: 0.55 },
  { id: 'kw_16', keyword: '社保转移', count: 8120, trend: 'stable', category: '社保', noResultCount: 162, conversionRate: 0.80 },
  { id: 'kw_17', keyword: '车辆年检', count: 7560, trend: 'down', category: '交通', noResultCount: 91, conversionRate: 0.87 },
  { id: 'kw_18', keyword: '企业变更', count: 6890, trend: 'stable', category: '市场准入', noResultCount: 138, conversionRate: 0.78 },
  { id: 'kw_19', keyword: '退休办理', count: 6340, trend: 'up', category: '社保', noResultCount: 152, conversionRate: 0.76 },
  { id: 'kw_20', keyword: '婚姻登记', count: 5780, trend: 'stable', category: '民政', noResultCount: 69, conversionRate: 0.90 },
  { id: 'kw_21', keyword: '医疗器械许可', count: 5230, trend: 'up', category: '市场准入', noResultCount: 157, conversionRate: 0.65 },
  { id: 'kw_22', keyword: '公积金缴存证明', count: 4890, trend: 'stable', category: '住房', noResultCount: 49, conversionRate: 0.92 },
]

export const supplyGaps: SupplyGap[] = [
  {
    id: 'gap_1',
    service: '居住证签注',
    demand: 15600,
    supply: 12300,
    gap: 3300,
    department: '深圳市公安局',
    description: '居住证签注在线办理容量不足，高峰期排队时间超30分钟',
    hotwordReferences: ['居住证办理', '户籍迁移', '身份证补办'],
    trend: 'worsening',
    priority: 'high',
  },
  {
    id: 'gap_2',
    service: '社保参保登记',
    demand: 12800,
    supply: 10500,
    gap: 2300,
    department: '深圳市社会保险基金管理局',
    description: '新入职员工社保参保登记处理能力不足，跨部门数据同步延迟',
    hotwordReferences: ['社保查询', '社保转移', '退休办理'],
    trend: 'stable',
    priority: 'high',
  },
  {
    id: 'gap_3',
    service: '不动产抵押登记',
    demand: 9600,
    supply: 8200,
    gap: 1400,
    department: '深圳市规划和自然资源局',
    description: '不动产抵押登记系统与银行系统对接不完善，需人工介入处理',
    hotwordReferences: ['不动产登记', '公积金贷款', '公积金提取'],
    trend: 'improving',
    priority: 'medium',
  },
  {
    id: 'gap_4',
    service: '企业变更登记',
    demand: 11200,
    supply: 9800,
    gap: 1400,
    department: '深圳市市场监督管理局',
    description: '企业变更登记中涉及多部门信息同步，系统响应速度待提升',
    hotwordReferences: ['营业执照', '企业变更', '企业注销'],
    trend: 'worsening',
    priority: 'medium',
  },
  {
    id: 'gap_5',
    service: '医保异地结算',
    demand: 8500,
    supply: 7200,
    gap: 1300,
    department: '深圳市医疗保障局',
    description: '异地就医直接结算覆盖医院有限，部分省份联网结算不稳定',
    hotwordReferences: ['医保报销', '社保转移'],
    trend: 'improving',
    priority: 'medium',
  },
  {
    id: 'gap_6',
    service: '公积金贷款审批',
    demand: 7800,
    supply: 6500,
    gap: 1300,
    department: '深圳市住房公积金管理中心',
    description: '公积金贷款审批环节多，与不动产登记联动效率待提升',
    hotwordReferences: ['公积金贷款', '公积金提取', '不动产登记', '公积金缴存证明'],
    trend: 'stable',
    priority: 'high',
  },
  {
    id: 'gap_7',
    service: '人才住房配租',
    demand: 14200,
    supply: 5600,
    gap: 8600,
    department: '深圳市住房和建设局',
    description: '人才住房供给严重不足，轮候时间超过18个月',
    hotwordReferences: ['保障性住房', '人才引进', '户籍迁移'],
    trend: 'worsening',
    priority: 'high',
  },
]

export const npsSurveys: NPSSurvey[] = [
  {
    id: 'nps_1',
    serviceId: 'svc_001',
    serviceName: '居住证办理',
    score: 9,
    comment: '网上申请非常方便，三天就拿到证了，效率很高！',
    tags: ['办理速度快', '操作简便'],
    submitTime: '2026-06-09 10:23:45',
    userId: 'user_10001',
    category: 'praise',
  },
  {
    id: 'nps_2',
    serviceId: 'svc_002',
    serviceName: '社保查询',
    score: 10,
    comment: '社保查询功能很强大，历史缴费记录一目了然，点赞！',
    tags: ['功能完善', '信息清晰'],
    submitTime: '2026-06-09 11:15:30',
    userId: 'user_10002',
    category: 'praise',
  },
  {
    id: 'nps_3',
    serviceId: 'svc_003',
    serviceName: '公积金提取',
    score: 6,
    comment: '提取流程有点复杂，需要填的材料太多了，希望能简化。',
    tags: ['材料多', '流程复杂'],
    submitTime: '2026-06-09 14:02:18',
    userId: 'user_10003',
    category: 'suggestion',
  },
  {
    id: 'nps_4',
    serviceId: 'svc_004',
    serviceName: '营业执照办理',
    score: 3,
    comment: '系统太卡了，提交了三次才成功，体验很差。',
    tags: ['系统卡顿', '提交失败'],
    submitTime: '2026-06-09 15:45:22',
    userId: 'user_10004',
    category: 'complaint',
  },
  {
    id: 'nps_5',
    serviceId: 'svc_005',
    serviceName: '驾驶证换证',
    score: 8,
    comment: '整体还不错，就是照片上传要求有点严格，试了好几次。',
    tags: ['照片要求严', '流程顺畅'],
    submitTime: '2026-06-09 16:30:11',
    userId: 'user_10005',
    category: 'suggestion',
  },
  {
    id: 'nps_6',
    serviceId: 'svc_006',
    serviceName: '医保报销',
    score: 5,
    comment: '异地报销流程不清晰，不知道需要准备什么材料。',
    tags: ['流程不清晰', '指引不足'],
    submitTime: '2026-06-09 09:12:55',
    userId: 'user_10006',
    category: 'complaint',
  },
  {
    id: 'nps_7',
    serviceId: 'svc_007',
    serviceName: '不动产登记',
    score: 7,
    comment: '办理速度还行，但是查询进度不太方便，希望能有短信通知。',
    tags: ['进度查询', '通知待完善'],
    submitTime: '2026-06-08 10:45:33',
    userId: 'user_10007',
    category: 'suggestion',
  },
  {
    id: 'nps_8',
    serviceId: 'svc_008',
    serviceName: '户籍迁移',
    score: 4,
    comment: '等了好久都没消息，打电话也没人接，太失望了。',
    tags: ['等待时间长', '客服差'],
    submitTime: '2026-06-08 13:22:17',
    userId: 'user_10008',
    category: 'complaint',
  },
  {
    id: 'nps_9',
    serviceId: 'svc_009',
    serviceName: '人才引进',
    score: 9,
    comment: '人才引进政策解读很详细，办理全程有指引，非常满意！',
    tags: ['指引详细', '政策透明'],
    submitTime: '2026-06-08 15:08:42',
    userId: 'user_10009',
    category: 'praise',
  },
  {
    id: 'nps_10',
    serviceId: 'svc_010',
    serviceName: '保障性住房',
    score: 2,
    comment: '轮了两年还没轮上，房源太少了，根本不够。',
    tags: ['房源不足', '轮候时间长'],
    submitTime: '2026-06-08 17:33:56',
    userId: 'user_10010',
    category: 'complaint',
  },
  {
    id: 'nps_11',
    serviceId: 'svc_011',
    serviceName: '身份证补办',
    score: 10,
    comment: '身份证补办太方便了，全程网办，还能邮寄到家，必须给满分！',
    tags: ['全程网办', '邮寄服务好'],
    submitTime: '2026-06-08 08:55:21',
    userId: 'user_10011',
    category: 'praise',
  },
  {
    id: 'nps_12',
    serviceId: 'svc_012',
    serviceName: '交通违法处理',
    score: 7,
    comment: '处理速度还可以，但是手续费有点贵，希望能降低。',
    tags: ['费用高', '处理快'],
    submitTime: '2026-06-07 11:28:14',
    userId: 'user_10012',
    category: 'suggestion',
  },
  {
    id: 'nps_13',
    serviceId: 'svc_013',
    serviceName: '新生儿出生登记',
    score: 8,
    comment: '新生儿登记挺方便的，就是希望能多开通一些医院的出生即办证服务。',
    tags: ['出生即办证', '覆盖面待扩大'],
    submitTime: '2026-06-07 14:17:39',
    userId: 'user_10013',
    category: 'suggestion',
  },
  {
    id: 'nps_14',
    serviceId: 'svc_014',
    serviceName: '企业变更',
    score: 5,
    comment: '企业变更要跑好几个部门，能不能一窗通办啊？',
    tags: ['多部门', '一窗通办'],
    submitTime: '2026-06-07 16:05:08',
    userId: 'user_10014',
    category: 'suggestion',
  },
  {
    id: 'nps_15',
    serviceId: 'svc_015',
    serviceName: '退休办理',
    score: 9,
    comment: '退休办理比想象中简单，材料清单很清楚，一次就办好了。',
    tags: ['材料清单清晰', '一次办好'],
    submitTime: '2026-06-07 09:42:33',
    userId: 'user_10015',
    category: 'praise',
  },
  {
    id: 'nps_16',
    serviceId: 'svc_016',
    serviceName: '婚姻登记',
    score: 10,
    comment: '婚姻登记预约系统很好用，到了直接办，5分钟搞定，太赞了！',
    tags: ['预约方便', '办理快速'],
    submitTime: '2026-06-07 10:58:27',
    userId: 'user_10016',
    category: 'praise',
  },
  {
    id: 'nps_17',
    serviceId: 'svc_017',
    serviceName: '公积金贷款',
    score: 4,
    comment: '贷款审批太慢了，等了一个月还没消息，急死人。',
    tags: ['审批慢', '等待时间长'],
    submitTime: '2026-06-06 13:45:52',
    userId: 'user_10017',
    category: 'complaint',
  },
  {
    id: 'nps_18',
    serviceId: 'svc_018',
    serviceName: '社保转移',
    score: 6,
    comment: '社保转移功能还行，就是进度查询不太实时，有点滞后。',
    tags: ['进度不实时', '功能可用'],
    submitTime: '2026-06-06 15:22:16',
    userId: 'user_10018',
    category: 'suggestion',
  },
  {
    id: 'nps_19',
    serviceId: 'svc_019',
    serviceName: '车辆年检',
    score: 7,
    comment: '网上预约很方便，检测站也挺多的，就是价格有点不一样。',
    tags: ['预约方便', '价格不统一'],
    submitTime: '2026-06-06 16:50:41',
    userId: 'user_10019',
    category: 'suggestion',
  },
  {
    id: 'nps_20',
    serviceId: 'svc_020',
    serviceName: '企业注销',
    score: 8,
    comment: '企业注销比以前简单多了，简易注销很方便，节省了很多时间。',
    tags: ['简易注销', '省时省力'],
    submitTime: '2026-06-06 09:33:05',
    userId: 'user_10020',
    category: 'praise',
  },
]

export const gapDispositions: GapDisposition[] = [
  {
    gapId: 'gap_1',
    status: 'processing',
    assigneeDepartment: '深圳市公安局',
    assignee: '张明',
    createdAt: '2026-05-15 09:00:00',
    updatedAt: '2026-06-08 14:30:00',
    deadline: '2026-07-15 23:59:59',
    measures: ['增加服务器算力', '优化排队算法', '增设预约时段'],
    relatedHotwords: ['居住证办理', '户籍迁移'],
  },
  {
    gapId: 'gap_2',
    status: 'processing',
    assigneeDepartment: '深圳市社会保险基金管理局',
    assignee: '李华',
    createdAt: '2026-05-20 10:00:00',
    updatedAt: '2026-06-05 11:20:00',
    deadline: '2026-07-30 23:59:59',
    measures: ['推进跨部门数据共享', '优化批量处理流程', '增加人工审核力量'],
    relatedHotwords: ['社保查询', '社保转移'],
  },
  {
    gapId: 'gap_3',
    status: 'resolved',
    assigneeDepartment: '深圳市规划和自然资源局',
    assignee: '王芳',
    createdAt: '2026-04-10 09:30:00',
    updatedAt: '2026-06-01 16:45:00',
    deadline: '2026-06-15 23:59:59',
    measures: ['完成银行系统直连对接', '实现抵押登记全流程电子化', '减少人工审核环节'],
    resolution: '已完成与8家主要银行的系统直连，抵押登记办理时间从5个工作日缩短至1个工作日',
    relatedHotwords: ['不动产登记', '公积金贷款'],
  },
  {
    gapId: 'gap_4',
    status: 'pending',
    assigneeDepartment: '深圳市市场监督管理局',
    assignee: '刘强',
    createdAt: '2026-06-01 08:00:00',
    updatedAt: '2026-06-01 08:00:00',
    deadline: '2026-08-15 23:59:59',
    measures: ['评估系统升级方案', '协调各部门数据接口'],
    relatedHotwords: ['营业执照', '企业变更'],
  },
  {
    gapId: 'gap_5',
    status: 'reviewed',
    assigneeDepartment: '深圳市医疗保障局',
    assignee: '陈静',
    createdAt: '2026-03-20 09:00:00',
    updatedAt: '2026-06-08 10:00:00',
    deadline: '2026-05-30 23:59:59',
    measures: ['扩大异地结算医院覆盖面', '优化跨省联网结算系统', '增加人工结算窗口'],
    resolution: '新增23家异地结算医院，跨省结算成功率提升至98.5%',
    reviewResult: 'pass',
    relatedHotwords: ['医保报销'],
  },
  {
    gapId: 'gap_6',
    status: 'processing',
    assigneeDepartment: '深圳市住房公积金管理中心',
    assignee: '赵磊',
    createdAt: '2026-05-05 10:30:00',
    updatedAt: '2026-06-09 09:15:00',
    deadline: '2026-07-20 23:59:59',
    measures: ['推进公积金与不动产登记系统联动', '简化审批环节', '引入智能预审'],
    relatedHotwords: ['公积金贷款', '不动产登记'],
  },
  {
    gapId: 'gap_7',
    status: 'pending',
    assigneeDepartment: '深圳市住房和建设局',
    assignee: '孙伟',
    createdAt: '2026-06-05 14:00:00',
    updatedAt: '2026-06-05 14:00:00',
    deadline: '2026-12-31 23:59:59',
    measures: ['加快保障性住房建设', '优化配租流程', '建立轮候动态管理机制'],
    relatedHotwords: ['保障性住房', '人才引进'],
  },
]

export const hotwordGapLinks: HotwordGapLink[] = [
  {
    hotword: '居住证办理',
    gapId: 'gap_1',
    correlationStrength: 0.92,
    analysis: '居住证办理搜索量与居住证签注服务缺口高度相关，搜索高峰时段与系统排队时间正相关',
  },
  {
    hotword: '户籍迁移',
    gapId: 'gap_1',
    correlationStrength: 0.75,
    analysis: '户籍迁移用户多需同时办理居住证，间接增加居住证签注服务压力',
  },
  {
    hotword: '社保查询',
    gapId: 'gap_2',
    correlationStrength: 0.88,
    analysis: '社保查询量大反映社保服务需求高，参保登记处理能力不足影响整体服务体验',
  },
  {
    hotword: '社保转移',
    gapId: 'gap_2',
    correlationStrength: 0.68,
    analysis: '社保转移涉及参保登记信息同步，数据延迟问题在转移业务中尤为突出',
  },
  {
    hotword: '公积金贷款',
    gapId: 'gap_3',
    correlationStrength: 0.82,
    analysis: '公积金贷款用户普遍需要办理不动产抵押登记，两者需求联动明显',
  },
  {
    hotword: '不动产登记',
    gapId: 'gap_3',
    correlationStrength: 0.95,
    analysis: '不动产登记搜索量直接反映抵押登记服务压力，相关性极强',
  },
  {
    hotword: '营业执照',
    gapId: 'gap_4',
    correlationStrength: 0.78,
    analysis: '营业执照办理量增长带来更多企业变更需求，系统响应速度成为瓶颈',
  },
  {
    hotword: '企业变更',
    gapId: 'gap_4',
    correlationStrength: 0.91,
    analysis: '企业变更搜索量与企业变更登记服务缺口直接对应',
  },
  {
    hotword: '保障性住房',
    gapId: 'gap_7',
    correlationStrength: 0.97,
    analysis: '保障性住房搜索量极高但无结果率也高，直接反映住房供给严重不足',
  },
  {
    hotword: '人才引进',
    gapId: 'gap_7',
    correlationStrength: 0.72,
    analysis: '人才引进政策吸引大量人才，但人才住房配套跟不上，形成供给缺口',
  },
]

export const probeAlerts: ProbeAlert[] = [
  {
    id: 'alert_1',
    nodeId: 'probe_11',
    level: 'critical',
    alertType: 'offline',
    message: '移动端服务网关节点离线，无法正常提供服务',
    firstTriggered: '2026-06-10 14:28:00',
    lastTriggered: '2026-06-10 14:30:00',
    acknowledged: false,
  },
  {
    id: 'alert_2',
    nodeId: 'probe_7',
    level: 'critical',
    alertType: 'error',
    message: '物流追踪服务节点错误率达1.44%，远超正常阈值',
    firstTriggered: '2026-06-10 13:45:00',
    lastTriggered: '2026-06-10 14:30:00',
    acknowledged: true,
    acknowledgedBy: '运维-李明',
    acknowledgedAt: '2026-06-10 14:00:00',
  },
  {
    id: 'alert_3',
    nodeId: 'probe_3',
    level: 'warning',
    alertType: 'performance',
    message: '事项管理系统节点响应时间达280ms，CPU使用率78%',
    firstTriggered: '2026-06-10 12:30:00',
    lastTriggered: '2026-06-10 14:30:00',
    acknowledged: false,
  },
  {
    id: 'alert_4',
    nodeId: 'probe_9',
    level: 'warning',
    alertType: 'performance',
    message: '智能客服服务节点响应时间达350ms，内存使用率78%',
    firstTriggered: '2026-06-10 13:00:00',
    lastTriggered: '2026-06-10 14:30:00',
    acknowledged: true,
    acknowledgedBy: '运维-王芳',
    acknowledgedAt: '2026-06-10 13:30:00',
  },
  {
    id: 'alert_5',
    nodeId: 'probe_7',
    level: 'warning',
    alertType: 'resource',
    message: '物流追踪服务节点CPU使用率95%，内存使用率92%，资源接近饱和',
    firstTriggered: '2026-06-10 14:00:00',
    lastTriggered: '2026-06-10 14:30:00',
    acknowledged: true,
    acknowledgedBy: '运维-李明',
    acknowledgedAt: '2026-06-10 14:15:00',
  },
  {
    id: 'alert_6',
    nodeId: 'probe_3',
    level: 'warning',
    alertType: 'error_rate',
    message: '事项管理系统节点错误率达0.18%，需要关注',
    firstTriggered: '2026-06-10 11:00:00',
    lastTriggered: '2026-06-10 14:30:00',
    acknowledged: false,
  },
]
