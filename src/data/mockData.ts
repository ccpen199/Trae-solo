import type {
  NewsSource,
  NewsItem,
  Keyword,
  Region,
  SubscriptionTopic,
  AlertRule,
  AlertRecord,
  WeatherData,
  DashboardData,
  ReportTemplate,
  User,
  SentimentAnalysis,
  SourceDistribution,
  KeywordTrend,
  HotEvent,
  TimelineEvent,
  RealTimeStream,
  ComparisonData,
  SystemStatus
} from '../types';

export const mockNewsSources: NewsSource[] = [
  {
    id: '1',
    name: '新华社',
    type: 'news',
    url: 'https://www.xinhuanet.com',
    status: 'active',
    lastSync: '2026-04-25 10:30:00',
    description: '国家通讯社，权威新闻来源',
    newsCount: 125,
    syncInterval: '30分钟'
  },
  {
    id: '2',
    name: '人民日报',
    type: 'news',
    url: 'https://www.people.com.cn',
    status: 'active',
    lastSync: '2026-04-25 10:25:00',
    description: '中共中央机关报',
    newsCount: 98,
    syncInterval: '30分钟'
  },
  {
    id: '3',
    name: '央视新闻',
    type: 'rss',
    url: 'https://news.cctv.com/rss',
    status: 'active',
    lastSync: '2026-04-25 10:20:00',
    description: '中央电视台新闻频道RSS源',
    newsCount: 76,
    syncInterval: '15分钟'
  },
  {
    id: '4',
    name: '中国天气网',
    type: 'weather',
    url: 'https://www.weather.com.cn',
    status: 'active',
    lastSync: '2026-04-25 10:15:00',
    description: '官方天气数据来源',
    newsCount: 43,
    syncInterval: '1小时'
  },
  {
    id: '5',
    name: '澎湃新闻',
    type: 'rss',
    url: 'https://www.thepaper.cn/rss',
    status: 'inactive',
    lastSync: '2026-04-24 18:00:00',
    description: '澎湃新闻RSS订阅',
    newsCount: 0,
    syncInterval: '30分钟'
  },
  {
    id: '6',
    name: '财新网',
    type: 'news',
    url: 'https://www.caixin.com',
    status: 'active',
    lastSync: '2026-04-25 10:10:00',
    description: '财经新闻专业媒体',
    newsCount: 56,
    syncInterval: '1小时'
  },
  {
    id: '7',
    name: '新浪新闻',
    type: 'rss',
    url: 'https://news.sina.com.cn/rss',
    status: 'active',
    lastSync: '2026-04-25 10:05:00',
    description: '新浪新闻RSS订阅',
    newsCount: 89,
    syncInterval: '15分钟'
  },
  {
    id: '8',
    name: '网易新闻',
    type: 'news',
    url: 'https://news.163.com',
    status: 'active',
    lastSync: '2026-04-25 10:00:00',
    description: '网易新闻客户端',
    newsCount: 67,
    syncInterval: '30分钟'
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
    sentimentScore: 0.85,
    url: 'https://www.xinhuanet.com/politics/2026-04-25/c_1128888888.htm',
    read: false,
    views: 12580,
    shares: 3256,
    comments: 892,
    hotScore: 8562
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
    sentimentScore: -0.45,
    url: 'https://www.weather.com.cn/alarm/101010100.html',
    read: false,
    views: 8956,
    shares: 2145,
    comments: 568,
    hotScore: 7234
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
    sentimentScore: -0.75,
    url: 'https://www.thepaper.cn/newsDetail_forward_28888888',
    read: false,
    views: 25890,
    shares: 8756,
    comments: 2345,
    hotScore: 9876
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
    sentimentScore: 0.65,
    url: 'https://www.caixin.com/2026-04-25/102022222.html',
    read: true,
    views: 35680,
    shares: 12568,
    comments: 3456,
    hotScore: 12580
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
    sentimentScore: -0.95,
    url: 'https://news.cctv.com/2026/04/24/ARTIabcdefghijklmnopqrst.shtml',
    read: false,
    views: 78960,
    shares: 25890,
    comments: 8756,
    hotScore: 18756
  },
  {
    id: '6',
    title: '上海发布新一轮人才引进政策，落户门槛进一步放宽',
    source: '人民日报',
    sourceType: 'news',
    publishTime: '2026-04-24 18:30:00',
    content: '上海市今日发布新一轮人才引进政策，进一步放宽落户门槛。新政规定，全日制本科及以上学历的应届毕业生可直接落户；重点扶持行业的技术人才可享受额外加分；在上海工作满5年的中级职称技术人员可直接申请落户。政策将于下月起正式实施。',
    summary: '上海发布新一轮人才引进政策，落户门槛进一步放宽，本科应届毕业生可直接落户。',
    keywords: ['人才引进', '落户政策', '上海', '人才政策'],
    riskLevel: 'low',
    region: '上海市',
    sentiment: 'positive',
    sentimentScore: 0.75,
    url: 'https://www.people.com.cn/n1/2026/0424/c1001-12345678.html',
    read: false,
    views: 45680,
    shares: 15680,
    comments: 4567,
    hotScore: 11234
  },
  {
    id: '7',
    title: '广东多地发布高温橙色预警，局部地区最高气温达38℃',
    source: '中国天气网',
    sourceType: 'weather',
    publishTime: '2026-04-24 16:00:00',
    content: '广东省气象台今日发布高温橙色预警信号，预计未来3天，广州、深圳、佛山等地最高气温将升至37-38℃，局部地区可达39℃。气象部门提醒广大市民注意防暑降温，尽量减少户外活动，同时注意用电安全和森林防火。',
    summary: '广东多地发布高温橙色预警，局部地区最高气温达38℃，注意防暑降温。',
    keywords: ['高温预警', '广东', '天气', '防暑'],
    riskLevel: 'medium',
    region: '广东省',
    sentiment: 'negative',
    sentimentScore: -0.35,
    url: 'https://www.weather.com.cn/alarm/101280100.html',
    read: false,
    views: 32560,
    shares: 8956,
    comments: 2345,
    hotScore: 9856
  },
  {
    id: '8',
    title: '国家能源局发布清洁能源发展规划，2030年非化石能源占比达35%',
    source: '新华社',
    sourceType: 'news',
    publishTime: '2026-04-24 14:30:00',
    content: '国家能源局今日发布《清洁能源发展规划（2026-2035年）》，明确提出到2030年非化石能源占一次能源消费比重达到35%，到2035年达到40%。规划强调要大力发展风电、光伏、水电等可再生能源，加快推进能源结构转型。',
    summary: '国家能源局发布清洁能源发展规划，2030年非化石能源占比达35%，加快能源结构转型。',
    keywords: ['清洁能源', '能源规划', '国家能源局', '可再生能源'],
    riskLevel: 'low',
    region: '全国',
    sentiment: 'positive',
    sentimentScore: 0.8,
    url: 'https://www.xinhuanet.com/energy/2026-04-24/c_1128888999.htm',
    read: true,
    views: 28960,
    shares: 9856,
    comments: 3256,
    hotScore: 10560
  }
];

export const mockKeywords: Keyword[] = [
  { id: '1', word: '营商环境', category: '政策', priority: 'high', monitorStatus: 'active', matchCount: 156, trend: 'up', trendPercent: 12.5 },
  { id: '2', word: '产品质量', category: '质量', priority: 'high', monitorStatus: 'active', matchCount: 89, trend: 'up', trendPercent: 8.3 },
  { id: '3', word: '安全事故', category: '安全', priority: 'high', monitorStatus: 'active', matchCount: 45, trend: 'down', trendPercent: -5.2 },
  { id: '4', word: '政策', category: '政策', priority: 'medium', monitorStatus: 'active', matchCount: 234, trend: 'stable', trendPercent: 1.2 },
  { id: '5', word: '消费者投诉', category: '消费', priority: 'medium', monitorStatus: 'active', matchCount: 67, trend: 'up', trendPercent: 15.6 },
  { id: '6', word: '天气预警', category: '天气', priority: 'high', monitorStatus: 'active', matchCount: 123, trend: 'up', trendPercent: 22.4 },
  { id: '7', word: '货币政策', category: '经济', priority: 'medium', monitorStatus: 'paused', matchCount: 45, trend: 'stable', trendPercent: 0.5 },
  { id: '8', word: '环境保护', category: '环境', priority: 'low', monitorStatus: 'active', matchCount: 78, trend: 'up', trendPercent: 6.8 },
  { id: '9', word: '人才引进', category: '政策', priority: 'medium', monitorStatus: 'active', matchCount: 56, trend: 'up', trendPercent: 18.9 },
  { id: '10', word: '清洁能源', category: '环境', priority: 'medium', monitorStatus: 'active', matchCount: 62, trend: 'up', trendPercent: 11.3 }
];

export const mockRegions: Region[] = [
  { id: '1', name: '全国', code: '000000', level: 'province', monitorStatus: 'active', newsCount: 145, lat: 39.9042, lng: 116.4074 },
  { id: '2', name: '北京市', code: '110000', level: 'province', monitorStatus: 'active', newsCount: 52, lat: 39.9042, lng: 116.4074 },
  { id: '3', name: '上海市', code: '310000', level: 'province', monitorStatus: 'active', newsCount: 48, lat: 31.2304, lng: 121.4737 },
  { id: '4', name: '广东省', code: '440000', level: 'province', monitorStatus: 'active', newsCount: 56, lat: 23.1291, lng: 113.2644 },
  { id: '5', name: '江苏省', code: '320000', level: 'province', monitorStatus: 'active', newsCount: 41, lat: 32.0603, lng: 118.7969 },
  { id: '6', name: '浙江省', code: '330000', level: 'province', monitorStatus: 'paused', newsCount: 35, lat: 30.2741, lng: 120.1551 }
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
    createdAt: '2026-03-15 10:00:00',
    newsCount: 156
  },
  {
    id: '2',
    name: '风险监控',
    description: '监控产品质量、安全事故等负面舆情',
    keywords: ['产品质量', '安全事故', '消费者投诉'],
    regions: ['440000', '320000', '330000'],
    sources: ['3', '5'],
    notifyMethods: ['sms', 'email', 'app'],
    createdAt: '2026-03-20 14:30:00',
    newsCount: 89
  },
  {
    id: '3',
    name: '天气预警',
    description: '关注极端天气和灾害预警信息',
    keywords: ['天气预警', '暴雨', '台风', '高温'],
    regions: ['110000', '310000', '440000'],
    sources: ['4'],
    notifyMethods: ['app'],
    createdAt: '2026-04-01 09:00:00',
    newsCount: 45
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
    enabled: true,
    alertCount: 23
  },
  {
    id: '2',
    name: '负面舆情监控',
    keywords: ['消费者投诉', '负面报道', '危机'],
    riskThreshold: 'medium',
    regions: ['440000', '320000'],
    notifyMethods: ['email', 'app'],
    enabled: true,
    alertCount: 56
  },
  {
    id: '3',
    name: '天气灾害预警',
    keywords: ['暴雨', '台风', '地震', '高温'],
    riskThreshold: 'medium',
    regions: ['110000', '310000', '440000'],
    notifyMethods: ['app'],
    enabled: true,
    alertCount: 34
  },
  {
    id: '4',
    name: '紧急事件预警',
    keywords: ['紧急', '突发', '重大事故'],
    riskThreshold: 'critical',
    regions: ['000000'],
    notifyMethods: ['sms', 'email', 'app'],
    enabled: false,
    alertCount: 12
  }
];

export const mockAlerts: AlertRecord[] = [
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
    aqi: 85,
    aqiLevel: '良',
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
    wind: '东南风 2级',
    aqi: 65,
    aqiLevel: '良'
  },
  {
    id: '3',
    region: '广东省',
    date: '2026-04-25',
    temperature: { max: 35, min: 26, current: 31 },
    weather: '雷阵雨',
    humidity: 82,
    wind: '南风 4级',
    aqi: 95,
    aqiLevel: '良',
    warning: {
      type: '高温',
      level: '橙色',
      description: '预计未来3天最高气温将达37-38℃，局部地区可达39℃'
    }
  }
];

const previousDayData: ComparisonData = {
  period: '昨日',
  totalNews: 298,
  positiveNews: 108,
  negativeNews: 52,
  criticalAlerts: 1,
  avgSentiment: 0.25
};

const currentDayData: ComparisonData = {
  period: '今日',
  totalNews: 342,
  positiveNews: 125,
  negativeNews: 59,
  criticalAlerts: 3,
  avgSentiment: 0.22
};

const previousWeekData: ComparisonData = {
  period: '上周',
  totalNews: 2156,
  positiveNews: 785,
  negativeNews: 356,
  criticalAlerts: 12,
  avgSentiment: 0.28
};

const currentWeekData: ComparisonData = {
  period: '本周',
  totalNews: 2356,
  positiveNews: 856,
  negativeNews: 412,
  criticalAlerts: 18,
  avgSentiment: 0.25
};

const previousMonthData: ComparisonData = {
  period: '上月',
  totalNews: 8560,
  positiveNews: 3120,
  negativeNews: 1456,
  criticalAlerts: 45,
  avgSentiment: 0.32
};

const currentMonthData: ComparisonData = {
  period: '本月',
  totalNews: 9856,
  positiveNews: 3580,
  negativeNews: 1689,
  criticalAlerts: 52,
  avgSentiment: 0.29
};

export const mockSentimentAnalysis: SentimentAnalysis = {
  positive: 125,
  neutral: 158,
  negative: 59,
  positivePercent: 36.5,
  neutralPercent: 46.2,
  negativePercent: 17.3,
  trend: 'improving'
};

export const mockSourceDistribution: SourceDistribution[] = [
  { name: '新华社', type: 'news', count: 125, percent: 36.5 },
  { name: '人民日报', type: 'news', count: 98, percent: 28.7 },
  { name: '央视新闻', type: 'rss', count: 76, percent: 22.2 },
  { name: '财新网', type: 'news', count: 56, percent: 16.4 },
  { name: '新浪新闻', type: 'rss', count: 89, percent: 26.0 },
  { name: '网易新闻', type: 'news', count: 67, percent: 19.6 },
  { name: '中国天气网', type: 'weather', count: 43, percent: 12.6 }
];

export const mockKeywordTrends: KeywordTrend[] = [
  {
    word: '营商环境',
    trend: 'up',
    data: [
      { date: '4.19', count: 18 },
      { date: '4.20', count: 22 },
      { date: '4.21', count: 19 },
      { date: '4.22', count: 25 },
      { date: '4.23', count: 28 },
      { date: '4.24', count: 32 },
      { date: '4.25', count: 35 }
    ]
  },
  {
    word: '产品质量',
    trend: 'up',
    data: [
      { date: '4.19', count: 8 },
      { date: '4.20', count: 10 },
      { date: '4.21', count: 12 },
      { date: '4.22', count: 9 },
      { date: '4.23', count: 11 },
      { date: '4.24', count: 14 },
      { date: '4.25', count: 16 }
    ]
  },
  {
    word: '安全事故',
    trend: 'down',
    data: [
      { date: '4.19', count: 12 },
      { date: '4.20', count: 10 },
      { date: '4.21', count: 8 },
      { date: '4.22', count: 6 },
      { date: '4.23', count: 7 },
      { date: '4.24', count: 5 },
      { date: '4.25', count: 4 }
    ]
  }
];

export const mockHotEvents: HotEvent[] = [
  {
    id: '1',
    title: '国务院发布优化营商环境指导意见',
    keywords: ['营商环境', '国务院', '政策'],
    newsCount: 45,
    startDate: '2026-04-23',
    hotScore: 9856,
    trend: 'rising',
    region: '全国',
    sentiment: 'positive'
  },
  {
    id: '2',
    title: '某化工园区泄漏事故',
    keywords: ['安全事故', '化工泄漏', '应急处置'],
    newsCount: 32,
    startDate: '2026-04-24',
    hotScore: 18756,
    trend: 'stable',
    region: '江苏省',
    sentiment: 'negative'
  },
  {
    id: '3',
    title: '央行降准释放长期资金',
    keywords: ['央行', '降准', '货币政策'],
    newsCount: 28,
    startDate: '2026-04-25',
    hotScore: 12580,
    trend: 'rising',
    region: '全国',
    sentiment: 'positive'
  },
  {
    id: '4',
    title: '上海发布人才引进新政',
    keywords: ['人才引进', '落户政策', '上海'],
    newsCount: 25,
    startDate: '2026-04-24',
    hotScore: 11234,
    trend: 'falling',
    region: '上海市',
    sentiment: 'positive'
  },
  {
    id: '5',
    title: '多地发布高温预警',
    keywords: ['高温预警', '天气', '防暑'],
    newsCount: 18,
    startDate: '2026-04-24',
    hotScore: 9856,
    trend: 'rising',
    region: '广东省',
    sentiment: 'negative'
  }
];

export const mockTimelineEvents: TimelineEvent[] = [
  { id: '1', time: '10:30', title: '新华社完成数据同步', description: '成功获取最新新闻125条', type: 'system' },
  { id: '2', time: '10:15', title: '北京暴雨蓝色预警', description: '触发天气灾害预警规则', type: 'alert', level: 'medium' },
  { id: '3', time: '09:30', title: '国务院发布营商环境意见', description: '检测到政策关键词匹配', type: 'news' },
  { id: '4', time: '08:45', title: '央视新闻完成同步', description: '更新新闻76条', type: 'system' },
  { id: '5', time: '08:00', title: '系统健康检查', description: '所有来源状态正常', type: 'system' },
  { id: '6', time: '07:20', title: '产品质量问题舆情', description: '触发负面舆情监控规则', type: 'alert', level: 'high' }
];

export const mockRealTimeStreams: RealTimeStream[] = [
  { id: '1', time: '刚刚', title: '发改委发布新能源汽车产业政策', source: '新华社', type: 'news' },
  { id: '2', time: '1分钟前', title: '上海发布大雾黄色预警', source: '中国天气网', type: 'weather' },
  { id: '3', time: '2分钟前', title: '证监会通报多起证券违规案件', source: '财新网', type: 'news' },
  { id: '4', time: '5分钟前', title: '广东部分地区发布雷雨大风预警', source: '中国天气网', type: 'weather', riskLevel: 'medium' },
  { id: '5', time: '8分钟前', title: '工信部召开制造业数字化转型会议', source: '新华社', type: 'news' }
];

export const mockDashboardData: DashboardData = {
  todayStats: {
    totalNews: 342,
    positiveNews: 125,
    neutralNews: 158,
    negativeNews: 59,
    criticalAlerts: 3,
    activeSources: 7,
    monitoredKeywords: 10,
    activeSubscriptions: 3
  },
  comparisonStats: {
    daily: {
      previous: previousDayData,
      current: currentDayData
    },
    weekly: {
      previous: previousWeekData,
      current: currentWeekData
    },
    monthly: {
      previous: previousMonthData,
      current: currentMonthData
    }
  },
  trendData: [
    { date: '4.19', positive: 110, neutral: 145, negative: 45, total: 300 },
    { date: '4.20', positive: 95, neutral: 160, negative: 60, total: 315 },
    { date: '4.21', positive: 130, neutral: 140, negative: 50, total: 320 },
    { date: '4.22', positive: 105, neutral: 155, negative: 55, total: 315 },
    { date: '4.23', positive: 115, neutral: 148, negative: 48, total: 311 },
    { date: '4.24', positive: 120, neutral: 152, negative: 52, total: 324 },
    { date: '4.25', positive: 125, neutral: 158, negative: 59, total: 342 }
  ],
  hourlyTrend: [
    { hour: '00:00', count: 12 },
    { hour: '02:00', count: 8 },
    { hour: '04:00', count: 5 },
    { hour: '06:00', count: 15 },
    { hour: '08:00', count: 32 },
    { hour: '10:00', count: 45 },
    { hour: '12:00', count: 38 },
    { hour: '14:00', count: 42 },
    { hour: '16:00', count: 36 },
    { hour: '18:00', count: 28 },
    { hour: '20:00', count: 22 },
    { hour: '22:00', count: 15 }
  ],
  topKeywords: [
    { word: '政策', count: 89, trend: 'up', trendPercent: 5.6 },
    { word: '营商环境', count: 76, trend: 'up', trendPercent: 12.5 },
    { word: '产品质量', count: 54, trend: 'up', trendPercent: 8.3 },
    { word: '安全事故', count: 43, trend: 'down', trendPercent: -5.2 },
    { word: '消费者投诉', count: 38, trend: 'up', trendPercent: 15.6 },
    { word: '天气预警', count: 32, trend: 'up', trendPercent: 22.4 },
    { word: '货币政策', count: 28, trend: 'stable', trendPercent: 0.5 },
    { word: '环境保护', count: 22, trend: 'up', trendPercent: 6.8 }
  ],
  keywordTrends: mockKeywordTrends,
  regionDistribution: [
    { region: '全国', count: 145, lat: 39.9042, lng: 116.4074, positive: 65, negative: 25 },
    { region: '北京市', count: 52, lat: 39.9042, lng: 116.4074, positive: 22, negative: 12 },
    { region: '上海市', count: 48, lat: 31.2304, lng: 121.4737, positive: 18, negative: 10 },
    { region: '广东省', count: 56, lat: 23.1291, lng: 113.2644, positive: 20, negative: 18 },
    { region: '江苏省', count: 41, lat: 32.0603, lng: 118.7969, positive: 15, negative: 12 }
  ],
  riskDistribution: [
    { level: '低风险', count: 198, percent: 57.9 },
    { level: '中风险', count: 92, percent: 26.9 },
    { level: '高风险', count: 45, percent: 13.2 },
    { level: '紧急', count: 7, percent: 2.0 }
  ],
  sentimentAnalysis: mockSentimentAnalysis,
  sentimentTrendData: [
    { date: '4.19', positive: 110, neutral: 145, negative: 45, positivePercent: 36.7, neutralPercent: 48.3, negativePercent: 15.0 },
    { date: '4.20', positive: 95, neutral: 160, negative: 60, positivePercent: 30.2, neutralPercent: 50.8, negativePercent: 19.0 },
    { date: '4.21', positive: 130, neutral: 140, negative: 50, positivePercent: 40.6, neutralPercent: 43.8, negativePercent: 15.6 },
    { date: '4.22', positive: 105, neutral: 155, negative: 55, positivePercent: 33.3, neutralPercent: 49.2, negativePercent: 17.5 },
    { date: '4.23', positive: 115, neutral: 148, negative: 48, positivePercent: 36.9, neutralPercent: 47.6, negativePercent: 15.4 },
    { date: '4.24', positive: 120, neutral: 152, negative: 52, positivePercent: 37.0, neutralPercent: 46.9, negativePercent: 16.0 },
    { date: '4.25', positive: 125, neutral: 158, negative: 59, positivePercent: 36.5, neutralPercent: 46.2, negativePercent: 17.3 }
  ],
  sourceSentimentDistribution: [
    { name: '新华社', positive: 45, neutral: 32, negative: 8, positivePercent: 52.9, negativePercent: 9.4 },
    { name: '人民日报', positive: 38, neutral: 28, negative: 12, positivePercent: 48.7, negativePercent: 15.4 },
    { name: '央视新闻', positive: 32, neutral: 25, negative: 15, positivePercent: 44.4, negativePercent: 20.8 },
    { name: '财新网', positive: 18, neutral: 22, negative: 20, positivePercent: 30.0, negativePercent: 33.3 },
    { name: '新浪新闻', positive: 25, neutral: 35, negative: 28, positivePercent: 28.4, negativePercent: 31.8 },
    { name: '网易新闻', positive: 20, neutral: 30, negative: 25, positivePercent: 26.7, negativePercent: 33.3 }
  ],
  regionSentimentDistribution: [
    { region: '全国', positive: 65, neutral: 55, negative: 25, total: 145, positivePercent: 44.8, negativePercent: 17.2 },
    { region: '北京市', positive: 22, neutral: 18, negative: 12, total: 52, positivePercent: 42.3, negativePercent: 23.1 },
    { region: '上海市', positive: 18, neutral: 20, negative: 10, total: 48, positivePercent: 37.5, negativePercent: 20.8 },
    { region: '广东省', positive: 20, neutral: 18, negative: 18, total: 56, positivePercent: 35.7, negativePercent: 32.1 },
    { region: '江苏省', positive: 15, neutral: 14, negative: 12, total: 41, positivePercent: 36.6, negativePercent: 29.3 }
  ],
  riskTrendData: [
    { date: '4.19', low: 165, medium: 85, high: 38, critical: 12 },
    { date: '4.20', low: 175, medium: 90, high: 42, critical: 8 },
    { date: '4.21', low: 180, medium: 88, high: 40, critical: 12 },
    { date: '4.22', low: 172, medium: 92, high: 45, critical: 6 },
    { date: '4.23', low: 168, medium: 85, high: 42, critical: 16 },
    { date: '4.24', low: 185, medium: 95, high: 38, critical: 6 },
    { date: '4.25', low: 198, medium: 92, high: 45, critical: 7 }
  ],
  topicDistribution: [
    { topic: '政策解读', count: 45, positive: 32, negative: 5, trend: 'up' },
    { topic: '营商环境', count: 38, positive: 25, negative: 8, trend: 'up' },
    { topic: '质量安全', count: 32, positive: 15, negative: 12, trend: 'down' },
    { topic: '消费者权益', count: 28, positive: 12, negative: 14, trend: 'up' },
    { topic: '天气预警', count: 22, positive: 8, negative: 10, trend: 'stable' }
  ],
  sourceDistribution: mockSourceDistribution,
  sourceTrendData: [
    { date: '4.19', 新华社: 28, 人民日报: 22, 央视新闻: 18, 财新网: 12, 新浪新闻: 20, 网易新闻: 15 },
    { date: '4.20', 新华社: 25, 人民日报: 24, 央视新闻: 20, 财新网: 14, 新浪新闻: 22, 网易新闻: 16 },
    { date: '4.21', 新华社: 30, 人民日报: 20, 央视新闻: 16, 财新网: 10, 新浪新闻: 18, 网易新闻: 14 },
    { date: '4.22', 新华社: 26, 人民日报: 23, 央视新闻: 19, 财新网: 13, 新浪新闻: 21, 网易新闻: 15 },
    { date: '4.23', 新华社: 27, 人民日报: 21, 央视新闻: 17, 财新网: 11, 新浪新闻: 19, 网易新闻: 13 },
    { date: '4.24', 新华社: 29, 人民日报: 25, 央视新闻: 21, 财新网: 15, 新浪新闻: 23, 网易新闻: 17 },
    { date: '4.25', 新华社: 32, 人民日报: 26, 央视新闻: 22, 财新网: 16, 新浪新闻: 25, 网易新闻: 18 }
  ],
  hotEvents: mockHotEvents,
  timelineEvents: mockTimelineEvents,
  realTimeStreams: mockRealTimeStreams
};

export const mockSystemStatus: SystemStatus = {
  lastSyncTime: '2026-04-25 10:30:00',
  nextSyncTime: '2026-04-25 11:00:00',
  activeSources: 7,
  totalNewsToday: 342,
  alertsToday: 3,
  systemHealth: 'healthy'
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
  role: 'admin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan'
};
