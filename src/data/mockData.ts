import {
  NewsSource,
  NewsItem,
  Keyword,
  Region,
  SubscriptionTopic,
  AlertRule,
  Alert,
  WeatherData,
  DashboardData,
  ReportTemplate,
  User
} from '../types';

export const mockNewsSources: NewsSource[] = [
  {
    id: '1',
    name: '新华社',
    type: 'news',
    url: 'https://www.xinhuanet.com',
    status: 'active',
    lastSync: '2026-04-25 10:30:00',
    description: '国家通讯社，权威新闻来源'
  },
  {
    id: '2',
    name: '人民日报',
    type: 'news',
    url: 'https://www.people.com.cn',
    status: 'active',
    lastSync: '2026-04-25 10:25:00',
    description: '中共中央机关报'
  },
  {
    id: '3',
    name: '央视新闻',
    type: 'rss',
    url: 'https://news.cctv.com/rss',
    status: 'active',
    lastSync: '2026-04-25 10:20:00',
    description: '中央电视台新闻频道RSS源'
  },
  {
    id: '4',
    name: '中国天气网',
    type: 'weather',
    url: 'https://www.weather.com.cn',
    status: 'active',
    lastSync: '2026-04-25 10:15:00',
    description: '官方天气数据来源'
  },
  {
    id: '5',
    name: '澎湃新闻',
    type: 'rss',
    url: 'https://www.thepaper.cn/rss',
    status: 'inactive',
    lastSync: '2026-04-24 18:00:00',
    description: '澎湃新闻RSS订阅'
  },
  {
    id: '6',
    name: '财新网',
    type: 'news',
    url: 'https://www.caixin.com',
    status: 'active',
    lastSync: '2026-04-25 10:10:00',
    description: '财经新闻专业媒体'
  }
];

export const mockNewsItems: NewsItem[] = [
  {
    id: '1',
    title: '国务院发布关于进一步优化营商环境的指导意见',
    source: '新华社',
    sourceType: 'news',
    publishTime: '2026-04-25 09:30:00',
    content: '国务院今日发布关于进一步优化营商环境的指导意见，提出多项具体措施，包括简化行政审批流程、降低市场准入门槛、加强知识产权保护等。意见指出，要持续深化"放管服"改革，打造市场化、法治化、国际化营商环境。',
    summary: '国务院发布优化营商环境指导意见，提出简化审批、降低门槛、加强知识产权保护等措施。',
    keywords: ['营商环境', '国务院', '政策', '改革'],
    riskLevel: 'low',
    region: '全国',
    sentiment: 'positive',
    url: 'https://www.xinhuanet.com/politics/2026-04-25/c_1128888888.htm',
    read: false
  },
  {
    id: '2',
    title: '北京市发布暴雨蓝色预警信号',
    source: '中国天气网',
    sourceType: 'weather',
    publishTime: '2026-04-25 08:45:00',
    content: '北京市气象台2026年4月25日08时45分发布暴雨蓝色预警信号：预计当前至26日08时，本市大部分地区将出现小时雨量30毫米以上的强降水，山区及浅山区可能出现强降水诱发的中小河流洪水、山洪、地质灾害等次生灾害，低洼地区可能出现积水，请注意防范。',
    summary: '北京发布暴雨蓝色预警，预计将有强降水，注意防范次生灾害。',
    keywords: ['暴雨预警', '北京', '天气', '灾害'],
    riskLevel: 'medium',
    region: '北京市',
    sentiment: 'negative',
    url: 'https://www.weather.com.cn/alarm/101010100.html',
    read: false
  },
  {
    id: '3',
    title: '某知名企业产品质量问题引发消费者投诉',
    source: '澎湃新闻',
    sourceType: 'rss',
    publishTime: '2026-04-25 07:20:00',
    content: '近日，某知名家电企业生产的多款空调产品因质量问题引发大量消费者投诉。据消费者反映，这些空调在使用过程中出现制冷效果差、噪音大、故障率高等问题。目前，市场监管部门已介入调查，企业方面表示将积极配合调查并妥善处理消费者诉求。',
    summary: '知名家电企业产品质量问题引发消费者投诉，监管部门介入调查。',
    keywords: ['产品质量', '消费者投诉', '监管调查', '企业危机'],
    riskLevel: 'high',
    region: '广东省',
    sentiment: 'negative',
    url: 'https://www.thepaper.cn/newsDetail_forward_28888888',
    read: false
  },
  {
    id: '4',
    title: '央行宣布降准0.5个百分点，释放长期资金约1万亿元',
    source: '财新网',
    sourceType: 'news',
    publishTime: '2026-04-25 06:00:00',
    content: '中国人民银行今日宣布，决定下调金融机构存款准备金率0.5个百分点（不含已执行5%存款准备金率的金融机构）。本次下调后，金融机构加权平均存款准备金率约为7.6%。据测算，此次降准将释放长期资金约1万亿元，有助于增强金融机构资金配置能力，加大对实体经济的支持力度。',
    summary: '央行降准0.5个百分点，释放长期资金约1万亿元，支持实体经济发展。',
    keywords: ['央行', '降准', '货币政策', '实体经济'],
    riskLevel: 'low',
    region: '全国',
    sentiment: 'positive',
    url: 'https://www.caixin.com/2026-04-25/102022222.html',
    read: true
  },
  {
    id: '5',
    title: '某化工园区发生泄漏事故，应急部门紧急处置',
    source: '央视新闻',
    sourceType: 'rss',
    publishTime: '2026-04-24 23:15:00',
    content: '今日21时30分许，江苏省某化工园区内一家化工企业发生化学物质泄漏事故。事故发生后，当地应急管理、消防、环保等部门立即赶赴现场处置。目前，泄漏源已被控制，周边群众已安全疏散，环境监测显示空气中有害物质浓度已降至安全范围。事故原因正在调查中。',
    summary: '江苏某化工园区发生泄漏事故，应急部门紧急处置，情况已得到控制。',
    keywords: ['化工泄漏', '安全事故', '应急处置', '环境监测'],
    riskLevel: 'critical',
    region: '江苏省',
    sentiment: 'negative',
    url: 'https://news.cctv.com/2026/04/24/ARTIabcdefghijklmnopqrst.shtml',
    read: false
  }
];

export const mockKeywords: Keyword[] = [
  { id: '1', word: '营商环境', category: '政策', priority: 'high', monitorStatus: 'active', matchCount: 156 },
  { id: '2', word: '产品质量', category: '质量', priority: 'high', monitorStatus: 'active', matchCount: 89 },
  { id: '3', word: '安全事故', category: '安全', priority: 'critical', monitorStatus: 'active', matchCount: 45 },
  { id: '4', word: '政策', category: '政策', priority: 'medium', monitorStatus: 'active', matchCount: 234 },
  { id: '5', word: '消费者投诉', category: '消费', priority: 'medium', monitorStatus: 'active', matchCount: 67 },
  { id: '6', word: '天气预警', category: '天气', priority: 'high', monitorStatus: 'active', matchCount: 123 },
  { id: '7', word: '货币政策', category: '经济', priority: 'medium', monitorStatus: 'paused', matchCount: 45 },
  { id: '8', word: '环境保护', category: '环境', priority: 'low', monitorStatus: 'active', matchCount: 78 }
];

export const mockRegions: Region[] = [
  { id: '1', name: '全国', code: '000000', level: 'province', monitorStatus: 'active' },
  { id: '2', name: '北京市', code: '110000', level: 'province', monitorStatus: 'active' },
  { id: '3', name: '上海市', code: '310000', level: 'province', monitorStatus: 'active' },
  { id: '4', name: '广东省', code: '440000', level: 'province', monitorStatus: 'active' },
  { id: '5', name: '江苏省', code: '320000', level: 'province', monitorStatus: 'active' },
  { id: '6', name: '浙江省', code: '330000', level: 'province', monitorStatus: 'paused' }
];

export const mockSubscriptionTopics: SubscriptionTopic[] = [
  {
    id: '1',
    name: '政策动态',
    description: '关注国家及地方最新政策发布和解读',
    keywords: ['政策', '法规', '改革', '营商环境'],
    regions: ['000000'],
    sources: ['1', '2'],
    notifyMethods: ['email', 'app'],
    createdAt: '2026-03-15 10:00:00'
  },
  {
    id: '2',
    name: '风险监控',
    description: '监控产品质量、安全事故等负面舆情',
    keywords: ['产品质量', '安全事故', '消费者投诉'],
    regions: ['440000', '320000', '330000'],
    sources: ['3', '5'],
    notifyMethods: ['sms', 'email', 'app'],
    createdAt: '2026-03-20 14:30:00'
  },
  {
    id: '3',
    name: '天气预警',
    description: '关注极端天气和灾害预警信息',
    keywords: ['天气预警', '暴雨', '台风', '高温'],
    regions: ['110000', '310000', '440000'],
    sources: ['4'],
    notifyMethods: ['app'],
    createdAt: '2026-04-01 09:00:00'
  }
];

export const mockAlertRules: AlertRule[] = [
  {
    id: '1',
    name: '高风险关键词预警',
    keywords: ['安全事故', '产品质量问题', '化工泄漏'],
    riskThreshold: 'high',
    regions: ['000000'],
    notifyMethods: ['sms', 'email'],
    enabled: true
  },
  {
    id: '2',
    name: '负面舆情监控',
    keywords: ['消费者投诉', '负面报道', '危机'],
    riskThreshold: 'medium',
    regions: ['440000', '320000'],
    notifyMethods: ['email', 'app'],
    enabled: true
  },
  {
    id: '3',
    name: '天气灾害预警',
    keywords: ['暴雨', '台风', '地震', '高温'],
    riskThreshold: 'medium',
    regions: ['110000', '310000', '440000'],
    notifyMethods: ['app'],
    enabled: true
  },
  {
    id: '4',
    name: '紧急事件预警',
    keywords: ['紧急', '突发', '重大事故'],
    riskThreshold: 'critical',
    regions: ['000000'],
    notifyMethods: ['sms', 'email', 'app'],
    enabled: false
  }
];

export const mockAlerts: Alert[] = [
  {
    id: '1',
    ruleId: '3',
    ruleName: '天气灾害预警',
    newsId: '2',
    newsTitle: '北京市发布暴雨蓝色预警信号',
    riskLevel: 'medium',
    alertTime: '2026-04-25 08:45:00',
    status: 'unread'
  },
  {
    id: '2',
    ruleId: '2',
    ruleName: '负面舆情监控',
    newsId: '3',
    newsTitle: '某知名企业产品质量问题引发消费者投诉',
    riskLevel: 'high',
    alertTime: '2026-04-25 07:20:00',
    status: 'read'
  },
  {
    id: '3',
    ruleId: '1',
    ruleName: '高风险关键词预警',
    newsId: '5',
    newsTitle: '某化工园区发生泄漏事故，应急部门紧急处置',
    riskLevel: 'critical',
    alertTime: '2026-04-24 23:15:00',
    status: 'processed',
    processedBy: '张三',
    processedTime: '2026-04-25 08:30:00',
    processedNote: '已联系当地应急管理部门核实情况，事故已得到控制，将持续关注后续进展。'
  }
];

export const mockWeatherData: WeatherData[] = [
  {
    id: '1',
    region: '北京市',
    date: '2026-04-25',
    temperature: { max: 28, min: 18, current: 24 },
    weather: '多云转小雨',
    humidity: 65,
    wind: '南风 3级',
    warning: {
      type: '暴雨',
      level: '蓝色',
      description: '预计当前至26日08时，本市大部分地区将出现小时雨量30毫米以上的强降水'
    }
  },
  {
    id: '2',
    region: '上海市',
    date: '2026-04-25',
    temperature: { max: 26, min: 20, current: 23 },
    weather: '晴转多云',
    humidity: 55,
    wind: '东南风 2级'
  },
  {
    id: '3',
    region: '广东省',
    date: '2026-04-25',
    temperature: { max: 32, min: 25, current: 29 },
    weather: '雷阵雨',
    humidity: 80,
    wind: '南风 4级'
  }
];

export const mockDashboardData: DashboardData = {
  todayStats: {
    totalNews: 342,
    positiveNews: 125,
    neutralNews: 158,
    negativeNews: 59,
    criticalAlerts: 3
  },
  trendData: [
    { date: '4.19', positive: 110, neutral: 145, negative: 45 },
    { date: '4.20', positive: 95, neutral: 160, negative: 60 },
    { date: '4.21', positive: 130, neutral: 140, negative: 50 },
    { date: '4.22', positive: 105, neutral: 155, negative: 55 },
    { date: '4.23', positive: 115, neutral: 148, negative: 48 },
    { date: '4.24', positive: 120, neutral: 152, negative: 52 },
    { date: '4.25', positive: 125, neutral: 158, negative: 59 }
  ],
  topKeywords: [
    { word: '政策', count: 89 },
    { word: '营商环境', count: 76 },
    { word: '产品质量', count: 54 },
    { word: '安全事故', count: 43 },
    { word: '消费者投诉', count: 38 },
    { word: '天气预警', count: 32 },
    { word: '货币政策', count: 28 },
    { word: '环境保护', count: 22 }
  ],
  regionDistribution: [
    { region: '全国', count: 145 },
    { region: '北京市', count: 52 },
    { region: '上海市', count: 48 },
    { region: '广东省', count: 56 },
    { region: '江苏省', count: 41 }
  ],
  riskDistribution: [
    { level: '低风险', count: 198 },
    { level: '中风险', count: 92 },
    { level: '高风险', count: 45 },
    { level: '紧急', count: 7 }
  ]
};

export const mockReportTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: '日报模板',
    description: '每日舆情简报，包含关键数据和热点新闻',
    sections: [
      { id: '1', title: '今日概览', type: 'summary', enabled: true },
      { id: '2', title: '统计数据', type: 'statistics', enabled: true },
      { id: '3', title: '热点新闻', type: 'news_list', enabled: true },
      { id: '4', title: '风险预警', type: 'alerts', enabled: true },
      { id: '5', title: '趋势图表', type: 'charts', enabled: false }
    ],
    createdAt: '2026-03-01 10:00:00'
  },
  {
    id: '2',
    name: '周报模板',
    description: '每周舆情分析报告，包含详细数据分析和趋势',
    sections: [
      { id: '1', title: '本周概览', type: 'summary', enabled: true },
      { id: '2', title: '数据统计', type: 'statistics', enabled: true },
      { id: '3', title: '热点新闻回顾', type: 'news_list', enabled: true },
      { id: '4', title: '风险事件汇总', type: 'alerts', enabled: true },
      { id: '5', title: '趋势分析图表', type: 'charts', enabled: true }
    ],
    createdAt: '2026-03-05 14:00:00'
  }
];

export const mockUser: User = {
  id: '1',
  name: '张三',
  email: 'zhangsan@example.com',
  role: 'admin'
};
