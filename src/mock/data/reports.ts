import type {
  Report, ReportTrendItem, DepartmentRanking, ServiceRanking, HotIssue,
  ReportSatisfactionDetail, BadEvaluationCase, GoodEvaluationCase,
  ReportProblemItem, ReportDetail, ComplaintKeyword, SlaStat
} from '@/types'

const trendData: ReportTrendItem[] = [
  { date: '2024-01-01', applications: 856, completions: 780, tickets: 120, avgRating: 4.8 },
  { date: '2024-01-02', applications: 912, completions: 834, tickets: 135, avgRating: 4.7 },
  { date: '2024-01-03', applications: 1024, completions: 945, tickets: 148, avgRating: 4.8 },
  { date: '2024-01-04', applications: 985, completions: 912, tickets: 142, avgRating: 4.9 },
  { date: '2024-01-05', applications: 876, completions: 810, tickets: 118, avgRating: 4.7 },
  { date: '2024-01-06', applications: 432, completions: 398, tickets: 56, avgRating: 4.8 },
  { date: '2024-01-07', applications: 398, completions: 365, tickets: 48, avgRating: 4.9 },
  { date: '2024-01-08', applications: 1056, completions: 978, tickets: 152, avgRating: 4.8 },
  { date: '2024-01-09', applications: 1123, completions: 1045, tickets: 165, avgRating: 4.7 },
  { date: '2024-01-10', applications: 1089, completions: 1012, tickets: 158, avgRating: 4.8 },
  { date: '2024-01-11', applications: 1156, completions: 1078, tickets: 172, avgRating: 4.9 },
  { date: '2024-01-12', applications: 1023, completions: 956, tickets: 145, avgRating: 4.8 },
  { date: '2024-01-13', applications: 512, completions: 478, tickets: 68, avgRating: 4.7 },
  { date: '2024-01-14', applications: 456, completions: 423, tickets: 52, avgRating: 4.8 },
  { date: '2024-01-15', applications: 1234, completions: 892, tickets: 178, avgRating: 4.9 }
]

const departmentRankings: DepartmentRanking[] = [
  {
    departmentId: 'd_002',
    departmentName: '抚州市医疗保障局',
    applicationCount: 5860,
    completionRate: 99.2,
    avgProcessingDays: 0.8,
    avgRating: 4.92,
    rank: 1,
    trend: 'up'
  },
  {
    departmentId: 'd_004',
    departmentName: '抚州市住房公积金管理中心',
    applicationCount: 4520,
    completionRate: 98.5,
    avgProcessingDays: 1.5,
    avgRating: 4.88,
    rank: 2,
    trend: 'up'
  },
  {
    departmentId: 'd_001',
    departmentName: '抚州市人力资源和社会保障局',
    applicationCount: 6780,
    completionRate: 97.8,
    avgProcessingDays: 2.1,
    avgRating: 4.82,
    rank: 3,
    trend: 'stable'
  },
  {
    departmentId: 'd_010',
    departmentName: '抚州市公安局',
    applicationCount: 3890,
    completionRate: 97.2,
    avgProcessingDays: 3.2,
    avgRating: 4.78,
    rank: 4,
    trend: 'up'
  },
  {
    departmentId: 'd_009',
    departmentName: '抚州市市场监督管理局',
    applicationCount: 3450,
    completionRate: 96.8,
    avgProcessingDays: 2.8,
    avgRating: 4.75,
    rank: 5,
    trend: 'down'
  },
  {
    departmentId: 'd_005',
    departmentName: '抚州市交通运输局',
    applicationCount: 2780,
    completionRate: 96.5,
    avgProcessingDays: 2.5,
    avgRating: 4.70,
    rank: 6,
    trend: 'stable'
  },
  {
    departmentId: 'd_007',
    departmentName: '抚州市民政局',
    applicationCount: 2340,
    completionRate: 98.0,
    avgProcessingDays: 1.2,
    avgRating: 4.85,
    rank: 7,
    trend: 'up'
  },
  {
    departmentId: 'd_003',
    departmentName: '抚州市教育体育局',
    applicationCount: 3120,
    completionRate: 95.8,
    avgProcessingDays: 5.2,
    avgRating: 4.65,
    rank: 8,
    trend: 'down'
  },
  {
    departmentId: 'd_008',
    departmentName: '国家税务总局抚州市税务局',
    applicationCount: 4210,
    completionRate: 97.5,
    avgProcessingDays: 1.8,
    avgRating: 4.76,
    rank: 9,
    trend: 'stable'
  },
  {
    departmentId: 'd_006',
    departmentName: '抚州市文化广电新闻出版旅游局',
    applicationCount: 1560,
    completionRate: 98.8,
    avgProcessingDays: 0.5,
    avgRating: 4.89,
    rank: 10,
    trend: 'up'
  },
  {
    departmentId: 'd_011',
    departmentName: '抚州市司法局',
    applicationCount: 890,
    completionRate: 96.2,
    avgProcessingDays: 3.5,
    avgRating: 4.68,
    rank: 11,
    trend: 'stable'
  },
  {
    departmentId: 'd_012',
    departmentName: '抚州市卫生健康委员会',
    applicationCount: 2120,
    completionRate: 95.5,
    avgProcessingDays: 4.1,
    avgRating: 4.62,
    rank: 12,
    trend: 'down'
  }
]

const serviceRankings: ServiceRanking[] = [
  { serviceId: 's_006', serviceName: '公积金提取', departmentName: '抚州市住房公积金管理中心', applyCount: 18900, satisfaction: 97.2, rank: 1 },
  { serviceId: 's_003', serviceName: '医保参保登记', departmentName: '抚州市医疗保障局', applyCount: 12500, satisfaction: 99.1, rank: 2 },
  { serviceId: 's_005', serviceName: '义务教育入学报名', departmentName: '抚州市教育体育局', applyCount: 15800, satisfaction: 96.5, rank: 3 },
  { serviceId: 's_011', serviceName: '身份证补办', departmentName: '抚州市公安局', applyCount: 9200, satisfaction: 98.8, rank: 4 },
  { serviceId: 's_002', serviceName: '社保卡办理', departmentName: '抚州市人力资源和社会保障局', applyCount: 8760, satisfaction: 97.8, rank: 5 },
  { serviceId: 's_004', serviceName: '医保异地就医备案', departmentName: '抚州市医疗保障局', applyCount: 6200, satisfaction: 98.2, rank: 6 },
  { serviceId: 's_001', serviceName: '养老保险参保登记', departmentName: '抚州市人力资源和社会保障局', applyCount: 3420, satisfaction: 98.5, rank: 7 },
  { serviceId: 's_010', serviceName: '个体工商户注册登记', departmentName: '抚州市市场监督管理局', applyCount: 6800, satisfaction: 97.5, rank: 8 },
  { serviceId: 's_008', serviceName: '机动车驾驶证期满换证', departmentName: '抚州市交通运输局', applyCount: 7800, satisfaction: 98.0, rank: 9 },
  { serviceId: 's_007', serviceName: '公积金贷款申请', departmentName: '抚州市住房公积金管理中心', applyCount: 4500, satisfaction: 95.8, rank: 10 }
]

const hotIssues: HotIssue[] = [
  { category: '医疗保险', count: 186, description: '医保报销进度查询及到账时间问题', trend: 'up' },
  { category: '住房公积金', count: 152, description: '公积金提取条件和材料咨询', trend: 'stable' },
  { category: '政务服务', count: 134, description: '办事大厅排队等候时间过长', trend: 'down' },
  { category: '城市管理', count: 108, description: '噪音扰民和环境卫生问题', trend: 'up' },
  { category: '社会保障', count: 95, description: '社保缴费记录查询和补缴', trend: 'stable' },
  { category: '教育服务', count: 78, description: '学区划分和入学政策咨询', trend: 'up' }
]

export const mockReports: Report[] = [
  {
    id: 'r_001',
    title: '2024年1月抚州市政务服务效能分析报告（上半月）',
    type: 'monthly',
    period: '2024年1月上半月',
    startDate: '2024-01-01',
    endDate: '2024-01-15',
    summary: {
      totalApplications: 13542,
      completedApplications: 12036,
      completionRate: 88.9,
      avgProcessingDays: 2.3,
      totalTickets: 1716,
      completedTickets: 1420,
      avgTicketHours: 18.5,
      avgRating: 4.8,
      totalEvaluations: 8956,
      goodRate: 96.8
    },
    departmentRankings,
    serviceRankings,
    trendData,
    hotIssues,
    recommendations: [
      '建议增加市人社局办事大厅窗口数量，缓解高峰期排队压力',
      '持续优化医保报销流程，缩短报销到账时间',
      '推进更多高频事项"一网通办"和"全程网办"',
      '加强对部门办件时效的监控和预警',
      '完善差评和投诉整改跟踪闭环机制'
    ],
    creator: '孙七',
    createTime: '2024-01-16 09:00:00',
    pdfUrl: '/reports/202401_monthly.pdf'
  },
  {
    id: 'r_002',
    title: '2024年第2周抚州市政务服务周报',
    type: 'weekly',
    period: '2024年第2周',
    startDate: '2024-01-08',
    endDate: '2024-01-14',
    summary: {
      totalApplications: 6689,
      completedApplications: 6090,
      completionRate: 91.0,
      avgProcessingDays: 2.1,
      totalTickets: 910,
      completedTickets: 785,
      avgTicketHours: 16.8,
      avgRating: 4.8,
      totalEvaluations: 4520,
      goodRate: 97.2
    },
    departmentRankings: departmentRankings.slice(0, 5),
    serviceRankings: serviceRankings.slice(0, 5),
    trendData: trendData.slice(7),
    hotIssues: hotIssues.slice(0, 3),
    recommendations: [
      '保持医保业务高办结率优势',
      '关注公积金贷款申请满意度偏低问题'
    ],
    creator: '孙七',
    createTime: '2024-01-15 10:00:00',
    pdfUrl: '/reports/2024w02_weekly.pdf'
  },
  {
    id: 'r_003',
    title: '2023年度抚州市政务服务效能年度报告',
    type: 'yearly',
    period: '2023年度',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    summary: {
      totalApplications: 458620,
      completedApplications: 432150,
      completionRate: 94.2,
      avgProcessingDays: 3.2,
      totalTickets: 56890,
      completedTickets: 54230,
      avgTicketHours: 22.5,
      avgRating: 4.7,
      totalEvaluations: 312560,
      goodRate: 95.6
    },
    departmentRankings,
    serviceRankings,
    trendData: [],
    hotIssues,
    recommendations: [
      '2024年重点推进"一网通办"提质增效',
      '加强跨部门数据共享和业务协同',
      '完善政务服务评价和整改机制',
      '推动更多政务服务向基层延伸'
    ],
    creator: '孙七',
    createTime: '2024-01-05 09:00:00',
    pdfUrl: '/reports/2023_yearly.pdf'
  }
]

const satisfactionDetail: ReportSatisfactionDetail = {
  overallRating: 96.8,
  speedRating: 95.2,
  attitudeRating: 97.5,
  qualityRating: 96.1,
  convenienceRating: 94.8,
  transparencyRating: 95.6
}

const badEvaluationCases: BadEvaluationCase[] = [
  {
    id: 'bec_001',
    serviceName: '机动车驾驶证期满换证',
    departmentName: '抚州市交通运输局',
    reason: '材料退回',
    content: '申请被驳回，说身体条件证明过期。但是提交的时候没有提示证明有效期，也没有样例说明，白跑一趟。',
    rectificationMeasures: '已优化申请页面，增加材料有效期提示和样例说明',
    rectificationStatus: 'completed',
    createTime: '2024-01-11 17:00:00'
  },
  {
    id: 'bec_002',
    serviceName: '医保报销',
    departmentName: '抚州市医疗保障局',
    reason: '办理周期长',
    content: '医保报销等了快一个月，进度也查不到，心里着急。',
    rectificationMeasures: '正在优化报销审核流程，增加审核人员，承诺10个工作日内完成',
    rectificationStatus: 'processing',
    createTime: '2024-01-08 14:30:00'
  },
  {
    id: 'bec_003',
    serviceName: '不动产登记',
    departmentName: '抚州市自然资源局',
    reason: '窗口排队久',
    content: '早上九点去排号，排到下午才办上，大厅座位也不够，站了一上午。',
    rectificationMeasures: '已增加2个办事窗口和等候座椅，同时推广预约办理',
    rectificationStatus: 'completed',
    createTime: '2024-01-05 16:20:00'
  }
]

const goodEvaluationCases: GoodEvaluationCase[] = [
  {
    id: 'gec_001',
    serviceName: '医保异地就医备案',
    departmentName: '抚州市医疗保障局',
    content: '异地就医备案真的太方便了！在手机上填了信息提交，一分钟就办好了，以前还要回老家开证明，现在真是省心。',
    tags: ['即时办结', '操作简便'],
    createTime: '2024-01-10 11:30:00'
  },
  {
    id: 'gec_002',
    serviceName: '个体工商户注册登记',
    departmentName: '抚州市市场监督管理局',
    content: '全程网上办理，三天就拿到了电子营业执照，不用跑大厅，效率很高！',
    tags: ['全程网办', '效率高'],
    createTime: '2024-01-12 09:15:00'
  },
  {
    id: 'gec_003',
    serviceName: '新生儿医保参保',
    departmentName: '抚州市医疗保障局',
    content: '给宝宝办医保，材料清楚，流程简单，当天就办好了，点赞！',
    tags: ['办理快速', '材料清晰'],
    createTime: '2024-01-14 15:40:00'
  }
]

const reportProblems: ReportProblemItem[] = [
  {
    id: 'rp_001',
    title: '部分事项办理周期偏长',
    description: '不动产登记、公积金贷款等事项平均办理时长超过5个工作日，高于全市平均水平。',
    impact: '影响群众办事体验，拉低整体满意度评分',
    suggestion: '优化内部审批流程，推行并联审批，增加窗口人员配置',
    priority: 'high'
  },
  {
    id: 'rp_002',
    title: '移动端办事覆盖率不足',
    description: '目前仅60%的高频事项支持移动端办理，部分复杂事项仍需到窗口办理。',
    impact: '制约"一网通办"水平提升，无法充分满足群众"掌上办"需求',
    suggestion: '加快移动端事项开发，优先推进高频事项的移动端适配',
    priority: 'high'
  },
  {
    id: 'rp_003',
    title: '跨部门数据共享程度有待提高',
    description: '部分业务仍需群众提交多个部门的证明材料，数据互通不充分。',
    impact: '增加群众办事成本，影响"减证便民"成效',
    suggestion: '推进数据共享交换平台建设，建立跨部门数据协同机制',
    priority: 'medium'
  },
  {
    id: 'rp_004',
    title: '政务服务向基层延伸不够',
    description: '乡镇（街道）、村（社区）政务服务能力较弱，很多事项仍需到市区办理。',
    impact: '偏远地区群众办事不便，城乡服务差距较大',
    suggestion: '加强基层政务服务体系建设，推动更多事项下沉办理',
    priority: 'medium'
  }
]

const nextMonthFocus = [
  '推进"一网通办"提质增效专项行动',
  '完成第二批50个高频事项的移动端开发',
  '开展政务服务满意度提升专项培训',
  '启动数据共享交换平台二期建设',
  '推进基层政务服务标准化建设'
]

const crossDepartmentItems = [
  '企业开办"一窗通"平台优化（市监局、税务局、人社局、公安局等）',
  '不动产登记"一窗受理"（自然资源局、住建局、税务局等）',
  '医保异地结算协同（医保局、卫健委、各定点医院）',
  '社保卡"一卡通"应用（人社局、各相关部门）'
]

const dataSources = [
  '抚州市政务服务网办件数据库',
  '各委办局业务系统数据',
  '12345政务服务便民热线数据',
  '政务服务评价系统数据',
  '政务服务大厅现场评价数据'
]

const complaintKeywords: ComplaintKeyword[] = [
  { word: '报销慢', count: 286 },
  { word: '排队久', count: 245 },
  { word: '材料多', count: 198 },
  { word: '流程复杂', count: 176 },
  { word: '态度差', count: 142 },
  { word: '不清楚', count: 128 },
  { word: '跑多次', count: 115 },
  { word: '系统慢', count: 98 },
  { word: '预约难', count: 87 },
  { word: '收费', count: 76 }
]

const slaStat: SlaStat = {
  total: 1716,
  onTime: 1598,
  overdue: 118,
  slaRate: 93.1,
  avgResponseHours: 2.5,
  avgResolutionHours: 18.5
}

export const mockReportDetails: Record<string, ReportDetail> = {}

mockReports.forEach((report) => {
  mockReportDetails[report.id] = {
    ...report,
    satisfactionDetail,
    badEvaluationCases,
    goodEvaluationCases,
    problems: reportProblems,
    nextMonthFocus,
    crossDepartmentItems,
    dataSources,
    annotations: []
  }
})

export { complaintKeywords, slaStat }

