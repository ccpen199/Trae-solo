import { SearchRecord, ComplaintPoint, OptimizationSuggestion, ReviewRecord, User } from '../types'

export const searchRecords: SearchRecord[] = [
  { keyword: '居住证续签', count: 15623, trend: 45, category: 'household' },
  { keyword: '小学入学', count: 12456, trend: 23, category: 'education' },
  { keyword: '积分入户', count: 9876, trend: 12, category: 'household' },
  { keyword: '社保转移', count: 8543, trend: 8, category: 'social_security' },
  { keyword: '公积金提取', count: 7654, trend: -3, category: 'housing' },
  { keyword: '驾驶证换证', count: 6543, trend: 5, category: 'traffic' },
  { keyword: '营业执照变更', count: 5432, trend: 15, category: 'business' },
  { keyword: '医保报销', count: 4567, trend: 18, category: 'medical' },
  { keyword: '居住证办理', count: 4321, trend: -5, category: 'household' },
  { keyword: '灵活就业社保', count: 3456, trend: 28, category: 'social_security' },
]

export const complaintPoints: ComplaintPoint[] = [
  {
    id: 'cp1',
    keyword: '居住证续签失败',
    count: 328,
    trend: 156,
    relatedGuideIds: ['guide-002'],
    description: '大量用户反馈居住证续签系统提示"地址校验不通过"，但实际居住地址未发生变化。经初步排查，可能为系统与不动产登记数据同步延迟导致。',
  },
  {
    id: 'cp2',
    keyword: '小学入学信息采集重复提交',
    count: 256,
    trend: 89,
    relatedGuideIds: ['guide-003'],
    description: '小学入学报名期间，家长反馈系统卡顿导致信息重复提交，审核状态不明确，客服电话占线严重。',
  },
  {
    id: 'cp3',
    keyword: '社保转移进度查询不到',
    count: 187,
    trend: 34,
    relatedGuideIds: ['guide-008'],
    description: '办理跨省社保转移后，网上查询不到转移进度，部分用户等待超过45个工作日仍未到账。',
  },
  {
    id: 'cp4',
    keyword: '驾驶证体检报告不认可',
    count: 145,
    trend: 12,
    relatedGuideIds: ['guide-004'],
    description: '部分用户反映在指定医院体检后，车管所系统未同步体检数据，需重新体检。',
  },
  {
    id: 'cp5',
    keyword: '公积金提取审核时间长',
    count: 123,
    trend: -8,
    relatedGuideIds: ['guide-010'],
    description: '部分购房提取公积金用户反馈审核时间超过承诺的1个工作日，等待3-5天仍未到账。',
  },
]

export const optimizationSuggestions: OptimizationSuggestion[] = [
  {
    id: 'os1',
    type: 'process',
    priority: 'high',
    title: '优化居住证续签地址校验逻辑',
    description: '建议增加"居住地址未变更"快捷通道，对于系统中已有登记地址且用户确认未变更的，跳过不动产登记数据实时校验，改为事后抽查。预计可解决80%以上的续签失败问题。',
    dataSource: '用户投诉分析 + 办事日志分析',
    relatedMetrics: [
      { name: '续签失败率', value: 15.6, unit: '%' },
      { name: '涉及用户数', value: 3280, unit: '人/月' },
      { name: '平均等待时长', value: 48, unit: '小时' },
    ],
  },
  {
    id: 'os2',
    type: 'service',
    priority: 'high',
    title: '在小学入学高峰期增加临时客服坐席',
    description: '每年5-6月入学报名期间，建议从其他部门临时调配30名客服人员，并增加智能客服知识库中入学相关问答覆盖率。同时在办事指南页面增加实时在线咨询入口。',
    dataSource: '客服热线数据 + 搜索词分析',
    relatedMetrics: [
      { name: '热线接通率', value: 42.3, unit: '%' },
      { name: '平均等待时长', value: 12, unit: '分钟' },
      { name: '高峰日咨询量', value: 8500, unit: '次' },
    ],
  },
  {
    id: 'os3',
    type: 'content',
    priority: 'medium',
    title: '完善社保转移进度可视化查询',
    description: '建议在社保转移办理页面增加转移进度时间轴，明确显示"已提交申请→转出地审核→基金划转→转入地接收→完成"各节点状态及预计时间，并推送短信通知。',
    dataSource: '用户行为分析 + 满意度调查',
    relatedMetrics: [
      { name: '进度查询用户占比', value: 78.5, unit: '%' },
      { name: '平均查询次数', value: 5.2, unit: '次/人' },
      { name: '满意度评分', value: 3.2, unit: '/5' },
    ],
  },
  {
    id: 'os4',
    type: 'content',
    priority: 'medium',
    title: '补充驾驶证换证自助体检点地图',
    description: '在驾驶证换证办事指南中增加"24小时自助体检机"分布地图，支持实时查看排队情况，并提供导航功能。减少用户因不了解体检渠道导致的往返跑动。',
    dataSource: '办事材料退回原因分析',
    relatedMetrics: [
      { name: '体检材料问题退回率', value: 18.2, unit: '%' },
      { name: '自助体检点覆盖率', value: 35, unit: '%' },
      { name: '用户跑腿次数', value: 1.8, unit: '次/人' },
    ],
  },
  {
    id: 'os5',
    type: 'process',
    priority: 'low',
    title: '优化公积金提取材料自动核验',
    description: '建议与不动产登记中心、税务部门打通数据接口，对于购房提取公积金的申请，自动核验购房合同和发票信息的真实性，减少人工审核压力。',
    dataSource: '审核效率分析',
    relatedMetrics: [
      { name: '人工审核占比', value: 68, unit: '%' },
      { name: '平均审核时长', value: 2.3, unit: '天' },
      { name: '审核人员配置', value: 15, unit: '人' },
    ],
  },
]

export const reviewRecords: ReviewRecord[] = [
  {
    id: 'rr1',
    guideId: 'guide-008',
    stage: 'editor',
    reviewer: '张编辑',
    reviewerRole: 'editor',
    action: 'approve',
    comment: '材料清单已更新，流程描述准确，建议提交主管审核。',
    createdAt: '2026-06-16 10:30',
  },
  {
    id: 'rr2',
    guideId: 'guide-008',
    stage: 'supervisor',
    reviewer: '李主管',
    reviewerRole: 'supervisor',
    action: 'approve',
    comment: '内容符合政策要求，同意提交法律顾问审核。',
    createdAt: '2026-06-17 14:20',
  },
  {
    id: 'rr3',
    guideId: 'guide-009',
    stage: 'editor',
    reviewer: '张编辑',
    reviewerRole: 'editor',
    action: 'approve',
    comment: '新办事指南已按模板填写完整，材料清单示例图已补充。',
    createdAt: '2026-06-15 09:45',
  },
  {
    id: 'rr4',
    guideId: 'guide-001',
    stage: 'legal',
    reviewer: '王律师',
    reviewerRole: 'legal',
    action: 'comment',
    comment: '建议在"法律依据"部分补充《居住证暂行条例》具体条款引用。',
    createdAt: '2026-05-18 16:00',
  },
  {
    id: 'rr5',
    guideId: 'guide-002',
    stage: 'editor',
    reviewer: '张编辑',
    reviewerRole: 'editor',
    action: 'reject',
    comment: '办理时限描述与最新政策不一致，请核实后重新提交。',
    createdAt: '2026-06-08 11:15',
  },
]

export const users: User[] = [
  { id: 'u1', name: '张编辑', role: 'editor', cityId: 'bj', department: '市政务服务中心' },
  { id: 'u2', name: '李主管', role: 'supervisor', cityId: 'bj', department: '市政务服务中心' },
  { id: 'u3', name: '王律师', role: 'legal', cityId: 'bj', department: '市司法局' },
  { id: 'u4', name: '赵管理员', role: 'admin', cityId: 'bj', department: '市大数据局' },
]

export const dailyVisitTrend = [
  { date: '06-15', visits: 23450, searches: 8765 },
  { date: '06-16', visits: 24560, searches: 9123 },
  { date: '06-17', visits: 25670, searches: 9456 },
  { date: '06-18', visits: 26780, searches: 9876 },
  { date: '06-19', visits: 18900, searches: 6543 },
  { date: '06-20', visits: 17650, searches: 6123 },
  { date: '06-21', visits: 28900, searches: 10567 },
]

export const categoryDistribution = [
  { name: '户政服务', value: 35 },
  { name: '教育培训', value: 22 },
  { name: '社会保障', value: 18 },
  { name: '交通出行', value: 12 },
  { name: '医疗健康', value: 8 },
  { name: '住房服务', value: 5 },
]
