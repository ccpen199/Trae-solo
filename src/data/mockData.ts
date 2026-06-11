export const dealerProfile = {
  id: 'D001',
  name: '李晓芳',
  level: '高级直销经理',
  teamSize: 48,
  monthlySales: 286500,
  certifications: ['健康管理师', '营养顾问', '高级直销员'],
  joinDate: '2022-03-15',
  region: '华东大区',
  phone: '138****6789',
  qrCodeUrl: '',
  stats: {
    totalCustomers: 326,
    newCustomers: 28,
    shareCount: 156,
    shareViews: 4820,
    conversionRate: 12.5,
    monthlyTarget: 300000,
    monthlyCompleted: 286500,
    weeklyGrowth: 8.3,
  },
}

export const customerNodes = [
  { id: 'C001', name: '王建国', level: 'A' as const, value: 85, connections: ['C002', 'C003', 'C005'], tags: ['VIP', '高频'] },
  { id: 'C002', name: '张美玲', level: 'A' as const, value: 78, connections: ['C001', 'C004'], tags: ['VIP', '团购'] },
  { id: 'C003', name: '刘志强', level: 'B' as const, value: 62, connections: ['C001', 'C006'], tags: ['活跃'] },
  { id: 'C004', name: '陈小红', level: 'B' as const, value: 55, connections: ['C002', 'C007'], tags: ['复购'] },
  { id: 'C005', name: '赵明华', level: 'C' as const, value: 38, connections: ['C001', 'C008'], tags: ['新客'] },
  { id: 'C006', name: '孙丽萍', level: 'C' as const, value: 32, connections: ['C003'], tags: ['新客'] },
  { id: 'C007', name: '周伟', level: 'D' as const, value: 20, connections: ['C004'], tags: ['待跟进'] },
  { id: 'C008', name: '吴秀英', level: 'D' as const, value: 15, connections: ['C005'], tags: ['待跟进'] },
]

export const shareTrackingData = {
  overview: { totalShares: 156, totalViews: 4820, totalClicks: 892, conversions: 28, conversionRate: 3.1 },
  trend: [
    { date: '06-01', shares: 18, views: 520, clicks: 96, conversions: 3 },
    { date: '06-02', shares: 22, views: 680, clicks: 124, conversions: 5 },
    { date: '06-03', shares: 15, views: 390, clicks: 72, conversions: 2 },
    { date: '06-04', shares: 28, views: 820, clicks: 156, conversions: 7 },
    { date: '06-05', shares: 20, views: 560, clicks: 104, conversions: 4 },
    { date: '06-06', shares: 25, views: 710, clicks: 138, conversions: 4 },
    { date: '06-07', shares: 28, views: 1140, clicks: 202, conversions: 3 },
  ],
  topContent: [
    { id: 'S001', title: '松花粉季节限定套装', type: 'product', shares: 42, views: 1380, conversions: 8, channel: '微信' },
    { id: 'S002', title: '夏季健康养生讲座', type: 'activity', shares: 35, views: 1120, conversions: 6, channel: '朋友圈' },
    { id: 'S003', title: '竹康宁新品体验报告', type: 'article', shares: 28, views: 890, conversions: 5, channel: '微信群' },
    { id: 'S004', title: '国珍早餐计划打卡', type: 'activity', shares: 24, views: 720, conversions: 4, channel: '抖音' },
    { id: 'S005', title: '健康自测小程序', type: 'tool', shares: 27, views: 710, conversions: 5, channel: '微信' },
  ],
}

export const products = [
  { id: 'P001', name: '松花粉片', category: '营养保健', price: 398, batchCode: 'B20250301', stock: 2450, status: 'active' as const, sales: 186 },
  { id: 'P002', name: '竹康宁胶囊', category: '营养保健', price: 528, batchCode: 'B20250302', stock: 1820, status: 'active' as const, sales: 142 },
  { id: 'P003', name: '国珍膳食粉', category: '膳食代餐', price: 268, batchCode: 'B20250303', stock: 3100, status: 'active' as const, sales: 238 },
  { id: 'P004', name: '松花能量饮', category: '功能饮品', price: 198, batchCode: 'B20250304', stock: 980, status: 'active' as const, sales: 95 },
  { id: 'P005', name: '国珍果蔬清洁剂', category: '日化护理', price: 88, batchCode: 'B20250305', stock: 5600, status: 'active' as const, sales: 412 },
  { id: 'P006', name: '松花胶原蛋白肽', category: '美容养颜', price: 668, batchCode: 'B20250306', stock: 650, status: 'active' as const, sales: 78 },
  { id: 'P007', name: '国珍松花酒', category: '养生酒类', price: 458, batchCode: 'B20250201', stock: 0, status: 'inactive' as const, sales: 0 },
  { id: 'P008', name: '松花破壁粉', category: '营养保健', price: 328, batchCode: 'B20250307', stock: 1200, status: 'active' as const, sales: 156 },
]

export const batchTrace = {
  batchCode: 'B20250301',
  product: '松花粉片',
  stages: [
    { stage: '原料采集', location: '云南大理松花粉基地', timestamp: '2025-02-15 08:00', operator: '原料部-李明' },
    { stage: '质量检测', location: '北京总部质检中心', timestamp: '2025-02-20 10:30', operator: '质检部-王芳' },
    { stage: '生产加工', location: '烟台生产基地A线', timestamp: '2025-02-25 14:00', operator: '生产部-赵刚' },
    { stage: '包装入库', location: '烟台仓储中心', timestamp: '2025-02-28 09:00', operator: '仓储部-孙丽' },
    { stage: '物流配送', location: '华东分拨中心', timestamp: '2025-03-01 06:00', operator: '物流部-周伟' },
    { stage: '终端入库', location: '杭州西湖生活馆', timestamp: '2025-03-03 11:00', operator: '生活馆-陈小红' },
  ],
  qualityReport: '合格',
}

export const inventoryData = [
  { storeId: 'ST001', storeName: '杭州西湖生活馆', products: [{ name: '松花粉片', stock: 120, threshold: 50 }, { name: '竹康宁胶囊', stock: 85, threshold: 30 }, { name: '国珍膳食粉', stock: 200, threshold: 80 }] },
  { storeId: 'ST002', storeName: '上海浦东生活馆', products: [{ name: '松花粉片', stock: 95, threshold: 50 }, { name: '竹康宁胶囊', stock: 28, threshold: 30 }, { name: '国珍膳食粉', stock: 150, threshold: 80 }] },
  { storeId: 'ST003', storeName: '南京新街口生活馆', products: [{ name: '松花粉片', stock: 180, threshold: 50 }, { name: '竹康宁胶囊', stock: 60, threshold: 30 }, { name: '国珍膳食粉', stock: 42, threshold: 80 }] },
  { storeId: 'ST004', storeName: '苏州工业园生活馆', products: [{ name: '松花粉片', stock: 75, threshold: 50 }, { name: '竹康宁胶囊', stock: 45, threshold: 30 }, { name: '国珍膳食粉', stock: 110, threshold: 80 }] },
]

export const promotions = [
  { id: 'PR001', name: '618健康嘉年华', type: '满减', status: 'active' as const, startDate: '2025-06-01', endDate: '2025-06-18', rule: '满500减50，满1000减120', productCount: 12, participationCount: 386 },
  { id: 'PR002', name: '新品体验价', type: '折扣', status: 'active' as const, startDate: '2025-06-05', endDate: '2025-06-30', rule: '新品8折优惠', productCount: 3, participationCount: 128 },
  { id: 'PR003', name: '买赠活动-夏季版', type: '赠品', status: 'upcoming' as const, startDate: '2025-07-01', endDate: '2025-07-15', rule: '买松花粉片送能量饮体验装', productCount: 2, participationCount: 0 },
  { id: 'PR004', name: '会员专享日', type: '满减', status: 'ended' as const, startDate: '2025-05-20', endDate: '2025-05-22', rule: '会员满300减30', productCount: 8, participationCount: 256 },
]

export const stores = [
  { id: 'ST001', name: '杭州西湖生活馆', address: '杭州市西湖区文三路268号', lat: 30.274, lng: 120.13, rating: 4.8, status: 'open' as const, monthlyVisits: 320, todayAppointments: 8 },
  { id: 'ST002', name: '上海浦东生活馆', address: '上海市浦东新区张杨路500号', lat: 31.23, lng: 121.52, rating: 4.6, status: 'open' as const, monthlyVisits: 450, todayAppointments: 12 },
  { id: 'ST003', name: '南京新街口生活馆', address: '南京市玄武区中山路18号', lat: 32.06, lng: 118.79, rating: 4.9, status: 'open' as const, monthlyVisits: 280, todayAppointments: 6 },
  { id: 'ST004', name: '苏州工业园生活馆', address: '苏州市工业园区星海街88号', lat: 31.32, lng: 120.72, rating: 4.5, status: 'closed' as const, monthlyVisits: 0, todayAppointments: 0 },
  { id: 'ST005', name: '无锡太湖生活馆', address: '无锡市滨湖区蠡湖大道168号', lat: 31.52, lng: 120.28, rating: 4.7, status: 'open' as const, monthlyVisits: 195, todayAppointments: 4 },
]

export const appointments = [
  { id: 'A001', customerName: '王建国', date: '2025-06-09', timeSlot: '09:00-10:00', service: '体质检测', status: 'confirmed' as const, storeName: '杭州西湖生活馆' },
  { id: 'A002', customerName: '张美玲', date: '2025-06-09', timeSlot: '10:00-11:00', service: '营养咨询', status: 'pending' as const, storeName: '杭州西湖生活馆' },
  { id: 'A003', customerName: '刘志强', date: '2025-06-09', timeSlot: '14:00-15:00', service: '产品体验', status: 'confirmed' as const, storeName: '上海浦东生活馆' },
  { id: 'A004', customerName: '陈小红', date: '2025-06-09', timeSlot: '15:30-16:30', service: '健康讲座', status: 'cancelled' as const, storeName: '杭州西湖生活馆' },
  { id: 'A005', customerName: '赵明华', date: '2025-06-10', timeSlot: '09:00-10:00', service: '体质检测', status: 'pending' as const, storeName: '南京新街口生活馆' },
  { id: 'A006', customerName: '孙丽萍', date: '2025-06-10', timeSlot: '11:00-12:00', service: '营养咨询', status: 'pending' as const, storeName: '上海浦东生活馆' },
]

export const serviceRecords = [
  { id: 'SR001', customerName: '王建国', service: '体质检测', date: '2025-06-08', staff: '李晓芳', score: 5, feedback: '非常专业，检测数据详细' },
  { id: 'SR002', customerName: '张美玲', service: '营养咨询', date: '2025-06-08', staff: '赵明华', score: 4, feedback: '建议很实用，希望有更多食谱推荐' },
  { id: 'SR003', customerName: '周伟', service: '产品体验', date: '2025-06-07', staff: '李晓芳', score: 5, feedback: '产品体验感很好，已下单购买' },
  { id: 'SR004', customerName: '吴秀英', service: '健康讲座', date: '2025-06-07', staff: '陈小红', score: 3, feedback: '内容一般，希望能更深入' },
]

export const reviews = [
  { id: 'R001', customerName: '王建国', rating: 5, content: '环境很好，服务专业，每次来都有新收获', date: '2025-06-08', sentiment: 'positive' as const, storeId: 'ST001' },
  { id: 'R002', customerName: '张美玲', rating: 4, content: '整体满意，就是等位时间有点长', date: '2025-06-08', sentiment: 'neutral' as const, storeId: 'ST001' },
  { id: 'R003', customerName: '刘志强', rating: 5, content: '老师讲解很细致，产品效果明显', date: '2025-06-07', sentiment: 'positive' as const, storeId: 'ST002' },
  { id: 'R004', customerName: '陈小红', rating: 2, content: '预约后等了很久才安排上，体验不太好', date: '2025-06-06', sentiment: 'negative' as const, storeId: 'ST001' },
  { id: 'R005', customerName: '赵明华', rating: 5, content: '每次来这里都像回家一样温暖', date: '2025-06-06', sentiment: 'positive' as const, storeId: 'ST003' },
  { id: 'R006', customerName: '孙丽萍', rating: 4, content: '产品不错，价格也合理', date: '2025-06-05', sentiment: 'positive' as const, storeId: 'ST002' },
  { id: 'R007', customerName: '周伟', rating: 3, content: '服务一般，没有太大惊喜', date: '2025-06-04', sentiment: 'neutral' as const, storeId: 'ST001' },
  { id: 'R008', customerName: '吴秀英', rating: 1, content: '虚假宣传，产品效果和说的完全不一样', date: '2025-06-03', sentiment: 'negative' as const, storeId: 'ST001' },
]

export const speechAnalysisData = {
  conversations: [
    {
      id: 'CV001', dealer: '李晓芳', customer: '王建国', date: '2025-06-08 14:32', riskLevel: 'safe' as const,
      messages: [
        { role: 'dealer', content: '王先生您好，这款松花粉片是我们公司明星产品，经过国家认证的保健食品' },
        { role: 'customer', content: '效果怎么样？' },
        { role: 'dealer', content: '很多客户反馈服用后精力明显提升，建议您先体验一个月' },
      ],
    },
    {
      id: 'CV002', dealer: '张三', customer: '李四', date: '2025-06-08 10:15', riskLevel: 'warning' as const,
      messages: [
        { role: 'dealer', content: '这个产品可以治疗高血压和糖尿病' },
        { role: 'customer', content: '真的吗？吃了就能好？' },
        { role: 'dealer', content: '当然，很多人都治好了' },
      ],
    },
    {
      id: 'CV003', dealer: '王五', customer: '赵六', date: '2025-06-07 16:45', riskLevel: 'danger' as const,
      messages: [
        { role: 'dealer', content: '加入我们月入十万不是梦，轻松躺赚' },
        { role: 'customer', content: '怎么做？' },
        { role: 'dealer', content: '只要拉人进来就行了，人头越多收入越高，保证回本' },
      ],
    },
  ],
  violations: [
    { id: 'V001', conversationId: 'CV002', content: '可以治疗高血压和糖尿病', type: '医疗功效宣称', severity: 'warning' as const, suggestion: '保健食品不可宣称治疗功效，建议修改为"有助于维持健康"' },
    { id: 'V002', conversationId: 'CV002', content: '很多人都治好了', type: '虚假宣传', severity: 'warning' as const, suggestion: '不可使用绝对化用语，建议提供实际案例和科学依据' },
    { id: 'V003', conversationId: 'CV003', content: '月入十万不是梦，轻松躺赚', type: '夸大收入承诺', severity: 'danger' as const, suggestion: '严禁夸大收入承诺，需提供真实收入数据' },
    { id: 'V004', conversationId: 'CV003', content: '只要拉人进来就行了', type: '拉人头模式', severity: 'danger' as const, suggestion: '涉嫌传销话术，必须修改为以产品销售为导向' },
    { id: 'V005', conversationId: 'CV003', content: '保证回本', type: '收益保证', severity: 'danger' as const, suggestion: '严禁承诺收益和回本，直销存在经营风险' },
  ],
}

export const amlData = {
  recentChecks: [
    { id: 'AML001', dealer: '李晓芳', amount: 5800, date: '2025-06-08', status: 'passed' as const, riskScore: 12 },
    { id: 'AML002', dealer: '张三', amount: 45000, date: '2025-06-08', status: 'pending' as const, riskScore: 72 },
    { id: 'AML003', dealer: '王五', amount: 28000, date: '2025-06-07', status: 'flagged' as const, riskScore: 88 },
    { id: 'AML004', dealer: '赵明华', amount: 3200, date: '2025-06-07', status: 'passed' as const, riskScore: 8 },
    { id: 'AML005', dealer: '陈小红', amount: 12000, date: '2025-06-06', status: 'passed' as const, riskScore: 25 },
  ],
  rules: [
    { id: 'R001', name: '单笔大额提现', description: '单笔提现超过20000元触发审核', threshold: 20000, enabled: true },
    { id: 'R002', name: '高频提现检测', description: '24小时内提现超过3次触发审核', threshold: 3, enabled: true },
    { id: 'R003', name: '异常增长检测', description: '月收入环比增长超过300%触发审核', threshold: 300, enabled: true },
    { id: 'R004', name: '关联账户检测', description: '多个账户提现至同一银行卡触发审核', threshold: 2, enabled: false },
  ],
}

export const geofenceAlerts = [
  { id: 'GF001', dealerName: '张三', authorizedRegion: '华东大区', currentLocation: '武汉市武昌区', timestamp: '2025-06-08 14:32', type: 'cross_region' as const, distance: '580km' },
  { id: 'GF002', dealerName: '王五', authorizedRegion: '华东大区', currentLocation: '长沙市岳麓区', timestamp: '2025-06-08 10:15', type: 'cross_region' as const, distance: '720km' },
  { id: 'GF003', dealerName: '赵明华', authorizedRegion: '华东大区', currentLocation: '军事管理区附近', timestamp: '2025-06-07 16:45', type: 'restricted_area' as const, distance: '0.5km' },
  { id: 'GF004', dealerName: '陈小红', authorizedRegion: '华北大区', currentLocation: '郑州市金水区', timestamp: '2025-06-07 09:20', type: 'cross_region' as const, distance: '350km' },
]

export const courses = [
  { id: 'CR001', title: '新时代产品知识精讲', category: '产品知识', duration: '2小时', progress: 85, totalLessons: 12, completedLessons: 10, status: 'in_progress' as const },
  { id: 'CR002', title: '直销合规经营指南', category: '合规培训', duration: '1.5小时', progress: 100, totalLessons: 8, completedLessons: 8, status: 'completed' as const },
  { id: 'CR003', title: '客户关系维护技巧', category: '销售技能', duration: '1小时', progress: 30, totalLessons: 6, completedLessons: 2, status: 'in_progress' as const },
  { id: 'CR004', title: '健康营养学基础', category: '专业知识', duration: '3小时', progress: 0, totalLessons: 18, completedLessons: 0, status: 'not_started' as const },
  { id: 'CR005', title: '数字化展业工具使用', category: '销售技能', duration: '45分钟', progress: 60, totalLessons: 5, completedLessons: 3, status: 'in_progress' as const },
]

export const exams = [
  { id: 'E001', title: '6月产品知识月考', questionCount: 50, duration: 60, passScore: 80, participantCount: 256, avgScore: 82.5, status: 'active' as const, deadline: '2025-06-15' },
  { id: 'E002', title: '合规经营专项测试', questionCount: 30, duration: 30, passScore: 90, participantCount: 189, avgScore: 88.2, status: 'active' as const, deadline: '2025-06-20' },
  { id: 'E003', title: '5月综合能力考核', questionCount: 80, duration: 90, passScore: 70, participantCount: 312, avgScore: 75.8, status: 'ended' as const, deadline: '2025-05-31' },
]

export const rankings = [
  { rank: 1, name: '刘芳', region: '华南大区', sales: 528000, growth: 32.5, teamSize: 86 },
  { rank: 2, name: '陈明', region: '华东大区', sales: 486000, growth: 28.3, teamSize: 72 },
  { rank: 3, name: '李晓芳', region: '华东大区', sales: 286500, growth: 8.3, teamSize: 48 },
  { rank: 4, name: '赵强', region: '华北大区', sales: 268000, growth: 15.6, teamSize: 55 },
  { rank: 5, name: '王丽华', region: '西南大区', sales: 245000, growth: 22.1, teamSize: 42 },
  { rank: 6, name: '孙伟', region: '华中大区', sales: 218000, growth: 18.9, teamSize: 38 },
  { rank: 7, name: '周婷', region: '东北大区', sales: 195000, growth: 12.4, teamSize: 35 },
  { rank: 8, name: '吴磊', region: '西北大区', sales: 168000, growth: 25.7, teamSize: 28 },
]

export const fissionData = {
  root: { id: 'D000', name: '总部', level: 0, metrics: { members: 48, sales: 286500, growth: 8.3 } },
  nodes: [
    { id: 'D001', name: '李晓芳', level: 1, parent: 'D000', metrics: { members: 48, sales: 286500, growth: 8.3 } },
    { id: 'D010', name: '张明', level: 2, parent: 'D001', metrics: { members: 18, sales: 98000, growth: 12.5 } },
    { id: 'D011', name: '王芳', level: 2, parent: 'D001', metrics: { members: 15, sales: 82000, growth: 6.8 } },
    { id: 'D012', name: '刘强', level: 2, parent: 'D001', metrics: { members: 15, sales: 106500, growth: 15.2 } },
    { id: 'D020', name: '赵敏', level: 3, parent: 'D010', metrics: { members: 8, sales: 42000, growth: 22.3 } },
    { id: 'D021', name: '陈丽', level: 3, parent: 'D010', metrics: { members: 10, sales: 56000, growth: 18.6 } },
    { id: 'D022', name: '孙磊', level: 3, parent: 'D011', metrics: { members: 7, sales: 38000, growth: 5.2 } },
    { id: 'D023', name: '周婷', level: 3, parent: 'D011', metrics: { members: 8, sales: 44000, growth: 9.1 } },
    { id: 'D024', name: '吴明', level: 3, parent: 'D012', metrics: { members: 9, sales: 58000, growth: 20.5 } },
    { id: 'D025', name: '郑华', level: 3, parent: 'D012', metrics: { members: 6, sales: 48500, growth: 11.3 } },
  ],
}

export const salesAnalysisData = {
  trend: [
    { month: '1月', sales: 245000, target: 280000, rate: 68.5 },
    { month: '2月', sales: 198000, target: 280000, rate: 62.3 },
    { month: '3月', sales: 312000, target: 300000, rate: 75.8 },
    { month: '4月', sales: 278000, target: 300000, rate: 71.2 },
    { month: '5月', sales: 345000, target: 320000, rate: 78.6 },
    { month: '6月', sales: 286500, target: 350000, rate: 72.1 },
  ],
  byCategory: [
    { name: '营养保健', value: 42, sales: 320800 },
    { name: '膳食代餐', value: 25, sales: 191200 },
    { name: '功能饮品', value: 15, sales: 114720 },
    { name: '日化护理', value: 12, sales: 91776 },
    { name: '美容养颜', value: 6, sales: 45888 },
  ],
  byRegion: [
    { region: '华东', sales: 386000, growth: 12.3 },
    { region: '华南', sales: 328000, growth: 18.5 },
    { region: '华北', sales: 265000, growth: 8.6 },
    { region: '西南', sales: 198000, growth: 22.1 },
    { region: '华中', sales: 175000, growth: 15.4 },
    { region: '东北', sales: 120000, growth: 6.8 },
    { region: '西北', sales: 85000, growth: 28.5 },
  ],
}

export const saturationData = [
  { region: '上海', saturation: 92, dealers: 185, potential: 8, alert: 'critical' as const },
  { region: '杭州', saturation: 78, dealers: 120, potential: 22, alert: 'warning' as const },
  { region: '南京', saturation: 65, dealers: 88, potential: 35, alert: 'normal' as const },
  { region: '苏州', saturation: 71, dealers: 95, potential: 29, alert: 'warning' as const },
  { region: '无锡', saturation: 55, dealers: 62, potential: 45, alert: 'normal' as const },
  { region: '宁波', saturation: 48, dealers: 45, potential: 52, alert: 'normal' as const },
  { region: '合肥', saturation: 38, dealers: 32, potential: 62, alert: 'normal' as const },
  { region: '温州', saturation: 85, dealers: 145, potential: 15, alert: 'critical' as const },
]

export const homeStats = {
  totalDealers: 2856,
  dealerGrowth: 12.5,
  productSalesRate: 72.3,
  salesRateChange: 5.8,
  storeActivity: 86.2,
  storeActivityChange: 3.2,
  complianceAlerts: 7,
  complianceAlertsChange: -15.3,
}

export const performanceTrend = [
  { week: '第1周', actual: 68000, target: 75000 },
  { week: '第2周', actual: 72000, target: 75000 },
  { week: '第3周', actual: 82000, target: 80000 },
  { week: '第4周', actual: 64500, target: 70000 },
]

export const todoItems = [
  { id: 'T001', title: '审核新直销员注册申请（3人）', priority: 'high' as const, type: '审批', dueDate: '2025-06-09' },
  { id: 'T002', title: '618促销活动方案终审', priority: 'high' as const, type: '活动', dueDate: '2025-06-10' },
  { id: 'T003', title: '合规培训课程完成（还差2节）', priority: 'medium' as const, type: '培训', dueDate: '2025-06-15' },
  { id: 'T004', title: '上海浦东生活馆库存预警处理', priority: 'medium' as const, type: '库存', dueDate: '2025-06-12' },
  { id: 'T005', title: '6月产品知识月考', priority: 'low' as const, type: '考试', dueDate: '2025-06-15' },
]
