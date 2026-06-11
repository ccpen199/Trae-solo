import type { RiskAlert } from '@/types'

export const riskAlerts: RiskAlert[] = [
  { id: 'RA01', type: 'device_duplicate', severity: 'high', details: '设备 DVM-A3F2 同一小时内注册3个不同账号', userId: 'W009', userName: '赵某', createdAt: '2026-06-11T07:15:00Z', resolved: false },
  { id: 'RA02', type: 'withdrawal_exceed', severity: 'high', details: '单日提现金额 ¥5,500 超过阈值 ¥5,000', userId: 'W007', userName: '钱某', createdAt: '2026-06-11T08:00:00Z', resolved: false },
  { id: 'RA03', type: 'withdrawal_exceed', severity: 'medium', details: '单日提现金额 ¥6,200 超过阈值 ¥5,000', userId: 'W008', userName: '孙某', createdAt: '2026-06-11T07:30:00Z', resolved: false },
  { id: 'RA04', type: 'ip_anomaly', severity: 'medium', details: '同一IP段 192.168.45.* 下10分钟内5次注册', userId: 'W010', userName: '周某', createdAt: '2026-06-11T06:45:00Z', resolved: false },
  { id: 'RA05', type: 'device_duplicate', severity: 'medium', details: '设备 DVM-B7D1 关联2个账号，且接单模式高度相似', userId: 'W011', userName: '吴某', createdAt: '2026-06-10T22:00:00Z', resolved: true },
  { id: 'RA06', type: 'compliance', severity: 'high', details: '任务"刷单返利计划"涉嫌传销模式', userId: 'E013', userName: '某电商', createdAt: '2026-06-10T16:00:00Z', resolved: true },
  { id: 'RA07', type: 'ip_anomaly', severity: 'low', details: 'IP 10.0.0.15 切换3次账号，可能为公共网络', userId: 'W012', userName: '郑某', createdAt: '2026-06-10T14:00:00Z', resolved: true },
  { id: 'RA08', type: 'device_duplicate', severity: 'high', details: '设备 DVM-C9E8 注册5个账号，均在30分钟内完成', userId: 'W013', userName: '王某', createdAt: '2026-06-10T11:00:00Z', resolved: false },
  { id: 'RA09', type: 'withdrawal_exceed', severity: 'medium', details: '单日提现金额 ¥5,100 超过阈值 ¥5,000', userId: 'W014', userName: '冯某', createdAt: '2026-06-09T19:00:00Z', resolved: true },
  { id: 'RA10', type: 'compliance', severity: 'high', details: '任务"投资理财推广"涉嫌非法集资', userId: 'E014', userName: '某金融', createdAt: '2026-06-09T15:00:00Z', resolved: true },
]

export const fundFlowData = [
  { date: '06-05', deposit: 45000, withdrawal: 32000, net: 13000, largeWithdrawals: 3 },
  { date: '06-06', deposit: 38000, withdrawal: 28000, net: 10000, largeWithdrawals: 2 },
  { date: '06-07', deposit: 52000, withdrawal: 41000, net: 11000, largeWithdrawals: 5 },
  { date: '06-08', deposit: 41000, withdrawal: 35000, net: 6000, largeWithdrawals: 4 },
  { date: '06-09', deposit: 55000, withdrawal: 48000, net: 7000, largeWithdrawals: 6 },
  { date: '06-10', deposit: 49000, withdrawal: 52000, net: -3000, largeWithdrawals: 7 },
  { date: '06-11', deposit: 30000, withdrawal: 62000, net: -32000, largeWithdrawals: 8 },
]

export const deviceDistribution = [
  { region: '北京', count: 45, anomaly: 3 },
  { region: '上海', count: 38, anomaly: 2 },
  { region: '广州', count: 32, anomaly: 5 },
  { region: '深圳', count: 28, anomaly: 1 },
  { region: '杭州', count: 22, anomaly: 4 },
  { region: '成都', count: 18, anomaly: 6 },
  { region: '武汉', count: 15, anomaly: 2 },
  { region: '南京', count: 12, anomaly: 1 },
]

export interface DeviceBlockRecord {
  deviceId: string
  model: string
  os: string
  browser: string
  browserFingerprint: string
  accountCount: number
  firstRegister: string
  lastRegister: string
  ipSegment: string
  riskLevel: 'low' | 'medium' | 'high'
  status: 'banned' | 'observing' | 'released'
  associatedAccounts: {
    userId: string
    username: string
    registerTime: string
    taskCount: number
    realNameVerified: boolean
  }[]
  behaviorPatterns: string[]
  historyRecords: {
    time: string
    action: 'ban' | 'release' | 'observe'
    operator: string
    reason: string
  }[]
}

export const deviceBlockRecords: DeviceBlockRecord[] = [
  {
    deviceId: 'DVM-A3F2', model: 'iPhone 15 Pro', os: 'iOS 17.4', browser: 'Safari 17.4', browserFingerprint: 'FP-8F2A9C',
    accountCount: 5, firstRegister: '2026-06-11T06:30:00Z', lastRegister: '2026-06-11T07:10:00Z',
    ipSegment: '192.168.45.*', riskLevel: 'high', status: 'observing',
    associatedAccounts: [
      { userId: 'W009', username: '赵某', registerTime: '2026-06-11T06:30:00Z', taskCount: 0, realNameVerified: false },
      { userId: 'W021', username: '钱**', registerTime: '2026-06-11T06:45:00Z', taskCount: 0, realNameVerified: false },
      { userId: 'W022', username: '孙**', registerTime: '2026-06-11T06:58:00Z', taskCount: 0, realNameVerified: false },
      { userId: 'W023', username: '李**', registerTime: '2026-06-11T07:05:00Z', taskCount: 0, realNameVerified: false },
      { userId: 'W024', username: '周**', registerTime: '2026-06-11T07:10:00Z', taskCount: 0, realNameVerified: false },
    ],
    behaviorPatterns: ['5个账号均在40分钟内注册完成', '注册间隔时间高度集中', '均未完成实名认证', '均未产生任何接单行为'],
    historyRecords: [{ time: '2026-06-11T07:20:00Z', action: 'observe', operator: '风控系统', reason: '短时间多账号批量注册检测' }],
  },
  {
    deviceId: 'DVM-B7D1', model: 'Xiaomi 14', os: 'Android 14', browser: 'Chrome 125', browserFingerprint: 'FP-3C4E1B',
    accountCount: 3, firstRegister: '2026-06-08T14:00:00Z', lastRegister: '2026-06-10T22:00:00Z',
    ipSegment: '10.0.20.*', riskLevel: 'medium', status: 'banned',
    associatedAccounts: [
      { userId: 'W011', username: '吴某', registerTime: '2026-06-08T14:00:00Z', taskCount: 12, realNameVerified: true },
      { userId: 'W025', username: '郑**', registerTime: '2026-06-09T09:30:00Z', taskCount: 8, realNameVerified: true },
      { userId: 'W026', username: '王**', registerTime: '2026-06-10T22:00:00Z', taskCount: 3, realNameVerified: true },
    ],
    behaviorPatterns: ['3个账号接单时间段高度重叠', '均偏好同类型标注任务', '完成任务速度异常快速', 'IP地址无变化'],
    historyRecords: [
      { time: '2026-06-10T22:30:00Z', action: 'observe', operator: '风控系统', reason: '接单模式高度相似' },
      { time: '2026-06-11T09:00:00Z', action: 'ban', operator: '管理员-张三', reason: '确认多账号协同作弊' },
    ],
  },
  {
    deviceId: 'DVM-C9E8', model: 'HUAWEI Mate 60', os: 'HarmonyOS 4.2', browser: '华为浏览器', browserFingerprint: 'FP-A1D5F7',
    accountCount: 5, firstRegister: '2026-06-05T10:00:00Z', lastRegister: '2026-06-10T11:00:00Z',
    ipSegment: '172.16.8.*', riskLevel: 'high', status: 'observing',
    associatedAccounts: [
      { userId: 'W013', username: '王某', registerTime: '2026-06-05T10:00:00Z', taskCount: 25, realNameVerified: true },
      { userId: 'W027', username: '冯**', registerTime: '2026-06-07T15:00:00Z', taskCount: 18, realNameVerified: true },
      { userId: 'W028', username: '陈**', registerTime: '2026-06-08T11:00:00Z', taskCount: 15, realNameVerified: true },
      { userId: 'W029', username: '褚**', registerTime: '2026-06-09T16:00:00Z', taskCount: 10, realNameVerified: true },
      { userId: 'W030', username: '卫**', registerTime: '2026-06-10T11:00:00Z', taskCount: 5, realNameVerified: false },
    ],
    behaviorPatterns: ['5个账号注册间隔约24小时一个', '接单高峰时间段完全一致', '任务完成质量评分接近', '部分账号实名信息存在相似'],
    historyRecords: [{ time: '2026-06-10T11:30:00Z', action: 'observe', operator: '风控系统', reason: '同设备多账号注册检测' }],
  },
  {
    deviceId: 'DVM-E1G4', model: 'OPPO Find X7', os: 'Android 14', browser: 'UC浏览器', browserFingerprint: 'FP-9B82D3',
    accountCount: 2, firstRegister: '2026-06-01T08:00:00Z', lastRegister: '2026-06-09T19:00:00Z',
    ipSegment: '192.168.1.*', riskLevel: 'low', status: 'released',
    associatedAccounts: [
      { userId: 'W031', username: '蒋**', registerTime: '2026-06-01T08:00:00Z', taskCount: 45, realNameVerified: true },
      { userId: 'W032', username: '沈**', registerTime: '2026-06-09T19:00:00Z', taskCount: 2, realNameVerified: false },
    ],
    behaviorPatterns: ['为夫妻共用设备，注册间隔8天', '主账号长期活跃，新账号刚注册', 'IP稳定未发现异常行为'],
    historyRecords: [
      { time: '2026-06-10T10:00:00Z', action: 'observe', operator: '风控系统', reason: '同设备双账号检测' },
      { time: '2026-06-11T08:00:00Z', action: 'release', operator: '管理员-李四', reason: '确认为家庭共用设备，无风险' },
    ],
  },
  {
    deviceId: 'DVM-F5H9', model: 'iPhone 14', os: 'iOS 17.3', browser: '微信内置浏览器', browserFingerprint: 'FP-7E3A5C',
    accountCount: 4, firstRegister: '2026-06-06T13:00:00Z', lastRegister: '2026-06-11T09:30:00Z',
    ipSegment: '220.181.38.*', riskLevel: 'high', status: 'observing',
    associatedAccounts: [
      { userId: 'W033', username: '韩**', registerTime: '2026-06-06T13:00:00Z', taskCount: 20, realNameVerified: true },
      { userId: 'W034', username: '杨**', registerTime: '2026-06-08T10:00:00Z', taskCount: 14, realNameVerified: true },
      { userId: 'W035', username: '朱**', registerTime: '2026-06-09T15:00:00Z', taskCount: 9, realNameVerified: false },
      { userId: 'W036', username: '秦**', registerTime: '2026-06-11T09:30:00Z', taskCount: 0, realNameVerified: false },
    ],
    behaviorPatterns: ['4个账号持续新增频率加快', '近两日接单数量突增', '均接高佣金任务为主', '新账号未实名'],
    historyRecords: [{ time: '2026-06-11T10:00:00Z', action: 'observe', operator: '风控系统', reason: '多账号设备异常活跃' }],
  },
  {
    deviceId: 'DVM-G2J6', model: 'vivo X100', os: 'Android 14', browser: 'QQ浏览器', browserFingerprint: 'FP-4D6F2A',
    accountCount: 3, firstRegister: '2026-06-02T11:00:00Z', lastRegister: '2026-06-10T20:00:00Z',
    ipSegment: '114.114.114.*', riskLevel: 'medium', status: 'observing',
    associatedAccounts: [
      { userId: 'W037', username: '尤**', registerTime: '2026-06-02T11:00:00Z', taskCount: 33, realNameVerified: true },
      { userId: 'W038', username: '许**', registerTime: '2026-06-04T09:00:00Z', taskCount: 22, realNameVerified: true },
      { userId: 'W039', username: '何**', registerTime: '2026-06-10T20:00:00Z', taskCount: 1, realNameVerified: false },
    ],
    behaviorPatterns: ['3个账号注册间隔逐步缩短', '接单偏好相同任务', '完成率接近', 'IP稳定'],
    historyRecords: [{ time: '2026-06-11T08:30:00Z', action: 'observe', operator: '风控系统', reason: '多账号检测' }],
  },
  {
    deviceId: 'DVM-H8K3', model: 'Samsung Galaxy S24', os: 'Android 14', browser: 'Samsung Internet', browserFingerprint: 'FP-1A9C4E',
    accountCount: 2, firstRegister: '2026-06-03T16:00:00Z', lastRegister: '2026-06-11T08:00:00Z',
    ipSegment: '183.232.231.*', riskLevel: 'low', status: 'observing',
    associatedAccounts: [
      { userId: 'W040', username: '吕**', registerTime: '2026-06-03T16:00:00Z', taskCount: 28, realNameVerified: true },
      { userId: 'W041', username: '施**', registerTime: '2026-06-11T08:00:00Z', taskCount: 0, realNameVerified: false },
    ],
    behaviorPatterns: ['新账号今早注册，与老账号同设备', '老账号行为正常', '暂未发现协同行为'],
    historyRecords: [{ time: '2026-06-11T08:15:00Z', action: 'observe', operator: '风控系统', reason: '同设备新增账号' }],
  },
  {
    deviceId: 'DVM-J4M7', model: 'Redmi Note 13', os: 'Android 13', browser: 'Chrome 124', browserFingerprint: 'FP-6B2D8F',
    accountCount: 4, firstRegister: '2026-06-04T09:00:00Z', lastRegister: '2026-06-10T18:00:00Z',
    ipSegment: '119.75.217.*', riskLevel: 'medium', status: 'banned',
    associatedAccounts: [
      { userId: 'W042', username: '张**', registerTime: '2026-06-04T09:00:00Z', taskCount: 17, realNameVerified: false },
      { userId: 'W043', username: '孔**', registerTime: '2026-06-05T14:00:00Z', taskCount: 12, realNameVerified: false },
      { userId: 'W044', username: '曹**', registerTime: '2026-06-07T16:00:00Z', taskCount: 7, realNameVerified: false },
      { userId: 'W045', username: '严**', registerTime: '2026-06-10T18:00:00Z', taskCount: 3, realNameVerified: false },
    ],
    behaviorPatterns: ['4个账号均未实名', '均接低价批量注册，持续新增', '任务完成率偏低', '弃单率较高'],
    historyRecords: [
      { time: '2026-06-09T14:00:00Z', action: 'observe', operator: '风控系统', reason: '多账号注册异常' },
      { time: '2026-06-11T10:30:00Z', action: 'ban', operator: '管理员-王五', reason: '未实名多账号，疑似羊毛党' },
    ],
  },
]

export interface WithdrawalReviewRecord {
  id: string
  orderNo: string
  workerName: string
  amount: number
  dailyTotal: number
  historyCount: number
  tasksLast7Days: number
  riskTags: string[]
  submitTime: string
  status: 'pending' | 'approved' | 'frozen'
  reviewReason?: string
  reviewer?: string
  reviewTime?: string
}

export const withdrawalReviewRecords: WithdrawalReviewRecord[] = [
  { id: 'WR01', orderNo: 'TX20260611001', workerName: '钱*明', amount: 5500, dailyTotal: 5500, historyCount: 3, tasksLast7Days: 18, riskTags: ['新账号', '异地IP'], submitTime: '2026-06-11T08:00:00Z', status: 'pending' },
  { id: 'WR02', orderNo: 'TX20260611002', workerName: '孙*华', amount: 6200, dailyTotal: 6200, historyCount: 8, tasksLast7Days: 25, riskTags: ['设备异常', '大额首次大额'], submitTime: '2026-06-11T07:30:00Z', status: 'pending' },
  { id: 'WR03', orderNo: 'TX20260611003', workerName: '冯*强', amount: 5100, dailyTotal: 5100, historyCount: 2, tasksLast7Days: 12, riskTags: ['新账号'], submitTime: '2026-06-11T09:15:00Z', status: 'pending' },
  { id: 'WR04', orderNo: 'TX20260611004', workerName: '陈*丽', amount: 7800, dailyTotal: 7800, historyCount: 15, tasksLast7Days: 35, riskTags: ['异地IP', '频率异常'], submitTime: '2026-06-11T10:00:00Z', status: 'pending' },
  { id: 'WR05', orderNo: 'TX20260611005', workerName: '褚*峰', amount: 5300, dailyTotal: 6800, historyCount: 20, tasksLast7Days: 42, riskTags: ['单日多笔'], submitTime: '2026-06-11T10:30:00Z', status: 'pending' },
  { id: 'WR06', orderNo: 'TX20260610006', workerName: '卫*东', amount: 5800, dailyTotal: 5800, historyCount: 10, tasksLast7Days: 28, riskTags: ['夜间提现'], submitTime: '2026-06-10T21:00:00Z', status: 'approved', reviewReason: '老用户，历史记录良好', reviewer: '管理员-张三', reviewTime: '2026-06-10T22:00:00Z' },
  { id: 'WR07', orderNo: 'TX20260610007', workerName: '蒋*梅', amount: 6500, dailyTotal: 6500, historyCount: 25, tasksLast7Days: 50, riskTags: [], submitTime: '2026-06-10T18:00:00Z', status: 'approved', reviewReason: '金牌接单者，信誉良好', reviewer: '管理员-李四', reviewTime: '2026-06-10T19:30:00Z' },
  { id: 'WR08', orderNo: 'TX20260609008', workerName: '沈*洋', amount: 5200, dailyTotal: 5200, historyCount: 18, tasksLast7Days: 30, riskTags: [], submitTime: '2026-06-09T16:00:00Z', status: 'approved', reviewReason: '正常提现', reviewer: '管理员-王五', reviewTime: '2026-06-09T17:00:00Z' },
  { id: 'WR09', orderNo: 'TX20260608009', workerName: '韩*雪', amount: 8000, dailyTotal: 9500, historyCount: 5, tasksLast7Days: 8, riskTags: ['新账号', '设备异常', '高频率'], submitTime: '2026-06-08T14:00:00Z', status: 'frozen', reviewReason: '多风险标签叠加，疑似风险过高', reviewer: '管理员-张三', reviewTime: '2026-06-08T15:30:00Z' },
  { id: 'WR10', orderNo: 'TX20260607010', workerName: '杨*磊', amount: 6700, dailyTotal: 6700, historyCount: 1, tasksLast7Days: 3, riskTags: ['新账号', '异地IP', '无历史记录'], submitTime: '2026-06-07T11:00:00Z', status: 'frozen', reviewReason: '新注册即大额提现，风险高', reviewer: '管理员-李四', reviewTime: '2026-06-07T12:00:00Z' },
]

export interface ReviewHistoryRecord {
  id: string
  operator: string
  time: string
  action: 'approved' | 'frozen'
  amount: number
  reason: string
}

export const reviewHistoryRecords: ReviewHistoryRecord[] = [
  { id: 'RH01', operator: '管理员-张三', time: '2026-06-11T10:30:00Z', action: 'frozen', amount: 8000, reason: '多风险标签叠加' },
  { id: 'RH02', operator: '管理员-李四', time: '2026-06-11T09:30:00Z', action: 'approved', amount: 5200, reason: '正常提现' },
  { id: 'RH03', operator: '管理员-王五', time: '2026-06-10T22:00:00Z', action: 'approved', amount: 5800, reason: '老用户记录良好' },
  { id: 'RH04', operator: '管理员-张三', time: '2026-06-10T19:30:00Z', action: 'approved', amount: 6500, reason: '金牌接单者' },
  { id: 'RH05', operator: '管理员-李四', time: '2026-06-10T15:30:00Z', action: 'frozen', amount: 6700, reason: '新账号大额提现' },
  { id: 'RH06', operator: '管理员-王五', time: '2026-06-09T17:00:00Z', action: 'approved', amount: 5100, reason: '信誉良好' },
  { id: 'RH07', operator: '管理员-张三', time: '2026-06-09T14:20:00Z', action: 'approved', amount: 7200, reason: '历史提现正常' },
  { id: 'RH08', operator: '管理员-李四', time: '2026-06-08T18:00:00Z', action: 'frozen', amount: 9200, reason: '设备多账号异常' },
  { id: 'RH09', operator: '管理员-王五', time: '2026-06-08T11:30:00Z', action: 'approved', amount: 6100, reason: '正常操作' },
  { id: 'RH10', operator: '管理员-张三', time: '2026-06-07T16:45:00Z', action: 'approved', amount: 5600, reason: '老用户' },
]
