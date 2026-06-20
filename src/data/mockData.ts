import { NewsItem, ReviewRecord, Reporter, Material, Topic, SentimentItem, HotEvent, Course, Exam, TrainingRecord, Asset, DistributionChannel, DashboardStats, User } from '../types';

export const currentUser: User = {
  id: '1',
  name: '张编辑',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  role: 'editor',
  roleName: '高级编辑',
  department: '新闻中心',
  phone: '138****8888',
  email: 'zhangbianji@changping.gov.cn'
};

export const dashboardStats: DashboardStats = {
  totalArticles: 12586,
  todayArticles: 86,
  totalViews: 5689234,
  totalLikes: 235678,
  totalShares: 89456,
  totalComments: 45678,
  spreadIndex: 87.5,
  matrixCoverage: 92.3,
  reportersOnline: 23,
  materialsToday: 156
};

export const newsList: NewsItem[] = [
  {
    id: '1',
    title: '昌平区召开2026年经济工作会议 部署全年重点任务',
    type: 'mixed',
    status: 'published',
    author: '李记者',
    department: '新闻中心',
    createdAt: '2026-06-18 14:30',
    updatedAt: '2026-06-18 16:45',
    views: 15680,
    likes: 892,
    shares: 234,
    comments: 156,
    cover: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
    copyright: '原创',
    tags: ['经济', '会议', '重点工作'],
    channels: ['网站', '微信公众号', '微博'],
    reviewHistory: [
      { id: 'r1', reviewer: '初审编辑', role: '初审', status: 'approved', comment: '内容准确，符合发布要求', createdAt: '2026-06-18 15:00', level: 1 },
      { id: 'r2', reviewer: '复审编辑', role: '复审', status: 'approved', comment: '标题醒目，结构清晰', createdAt: '2026-06-18 15:30', level: 2 },
      { id: 'r3', reviewer: '终审编辑', role: '终审', status: 'approved', comment: '同意发布', createdAt: '2026-06-18 16:00', level: 3 }
    ]
  },
  {
    id: '2',
    title: '回天地区社区治理新模式探索 居民幸福感显著提升',
    type: 'text',
    status: 'reviewing',
    author: '王记者',
    department: '社会新闻部',
    createdAt: '2026-06-18 10:20',
    updatedAt: '2026-06-18 14:10',
    views: 0,
    copyright: '原创',
    tags: ['社区治理', '回天', '民生'],
    channels: [],
    reviewHistory: [
      { id: 'r1', reviewer: '初审编辑', role: '初审', status: 'approved', comment: '内容详实，有深度', createdAt: '2026-06-18 11:30', level: 1 },
      { id: 'r2', reviewer: '复审编辑', role: '复审', status: 'pending', comment: '', createdAt: '2026-06-18 13:00', level: 2 }
    ]
  },
  {
    id: '3',
    title: '昌平区科技创新企业孵化基地正式揭牌',
    type: 'image',
    status: 'pending',
    author: '刘记者',
    department: '科技新闻部',
    createdAt: '2026-06-18 09:15',
    updatedAt: '2026-06-18 09:15',
    copyright: '原创',
    tags: ['科技', '创新', '创业'],
    channels: []
  },
  {
    id: '4',
    title: '视频：昌平草莓节开幕 邀您共赴甜蜜之约',
    type: 'video',
    status: 'draft',
    author: '陈记者',
    department: '文旅新闻部',
    createdAt: '2026-06-17 16:40',
    updatedAt: '2026-06-17 18:20',
    copyright: '原创',
    tags: ['文旅', '草莓节', '活动'],
    channels: []
  },
  {
    id: '5',
    title: '昌平区教育系统召开师德师风建设推进会',
    type: 'text',
    status: 'rejected',
    author: '赵记者',
    department: '教育新闻部',
    createdAt: '2026-06-17 14:00',
    updatedAt: '2026-06-17 16:30',
    copyright: '原创',
    tags: ['教育', '师德', '会议'],
    channels: [],
    reviewHistory: [
      { id: 'r1', reviewer: '初审编辑', role: '初审', status: 'rejected', comment: '缺少现场图片，内容较单薄，请补充', createdAt: '2026-06-17 15:30', level: 1 }
    ]
  },
  {
    id: '6',
    title: '音频：昌平交通早高峰实时播报',
    type: 'audio',
    status: 'published',
    author: '孙记者',
    department: '交通新闻部',
    createdAt: '2026-06-18 07:30',
    updatedAt: '2026-06-18 07:30',
    views: 3456,
    likes: 123,
    shares: 45,
    comments: 23,
    copyright: '原创',
    tags: ['交通', '播报', '便民'],
    channels: ['广播', 'APP']
  },
  {
    id: '7',
    title: '昌平区卫生健康委员会发布夏季健康提示',
    type: 'text',
    status: 'approved',
    author: '周记者',
    department: '卫生新闻部',
    createdAt: '2026-06-18 11:00',
    updatedAt: '2026-06-18 15:00',
    copyright: '原创',
    tags: ['卫生', '健康', '提示'],
    channels: [],
    reviewHistory: [
      { id: 'r1', reviewer: '初审编辑', role: '初审', status: 'approved', comment: '内容准确', createdAt: '2026-06-18 12:00', level: 1 },
      { id: 'r2', reviewer: '复审编辑', role: '复审', status: 'approved', comment: '格式规范', createdAt: '2026-06-18 13:30', level: 2 },
      { id: 'r3', reviewer: '终审编辑', role: '终审', status: 'approved', comment: '同意发布', createdAt: '2026-06-18 14:30', level: 3 }
    ]
  }
];

export const reporters: Reporter[] = [
  { id: '1', name: '李记者', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', department: '新闻中心', phone: '138****1111', taskCount: 5, materialCount: 23 },
  { id: '2', name: '王记者', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', department: '社会新闻部', phone: '138****2222', taskCount: 3, materialCount: 18 },
  { id: '3', name: '刘记者', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', department: '科技新闻部', phone: '138****3333', taskCount: 4, materialCount: 31 },
  { id: '4', name: '陈记者', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', department: '文旅新闻部', phone: '138****4444', taskCount: 2, materialCount: 15 },
  { id: '5', name: '赵记者', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', department: '教育新闻部', phone: '138****5555', taskCount: 6, materialCount: 27 }
];

export const materials: Material[] = [
  { id: '1', type: 'image', title: '经济工作会议现场照片', url: '', thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&h=150&fit=crop', size: '2.3MB', uploader: '李记者', uploadTime: '2026-06-18 14:35', tags: ['会议', '经济', '现场'], copyright: '原创', location: '昌平区政府' },
  { id: '2', type: 'video', title: '草莓节开幕式视频', url: '', thumbnail: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=200&h=150&fit=crop', duration: 180, size: '45MB', uploader: '陈记者', uploadTime: '2026-06-18 10:20', tags: ['草莓节', '开幕式', '活动'], copyright: '原创', location: '草莓博览园' },
  { id: '3', type: 'audio', title: '交通早高峰录音', url: '', duration: 300, size: '5.2MB', uploader: '孙记者', uploadTime: '2026-06-18 07:45', tags: ['交通', '播报'], copyright: '原创' },
  { id: '4', type: 'image', title: '科创基地揭牌仪式', url: '', thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=200&h=150&fit=crop', size: '3.1MB', uploader: '刘记者', uploadTime: '2026-06-18 09:30', tags: ['科技', '创新', '揭牌'], copyright: '原创', location: '未来科学城' },
  { id: '5', type: 'document', title: '2026年政府工作报告.docx', url: '', size: '1.8MB', uploader: '办公室', uploadTime: '2026-06-17 16:00', tags: ['报告', '政府工作'], copyright: '官方' },
  { id: '6', type: 'image', title: '社区治理现场照片', url: '', thumbnail: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=200&h=150&fit=crop', size: '2.8MB', uploader: '王记者', uploadTime: '2026-06-18 11:15', tags: ['社区', '治理', '民生'], copyright: '原创', location: '回龙观街道' }
];

export const topics: Topic[] = [
  { id: '1', title: '2026年中经济发展专题报道', description: '围绕上半年经济发展成果、重点项目推进情况进行深度报道', proposer: '新闻中心', department: '新闻中心', status: 'approved', priority: 'high', createdAt: '2026-06-15', deadline: '2026-06-30', assignees: ['李记者', '王记者'] },
  { id: '2', title: '回天行动计划实施五周年系列报道', description: '回顾回天行动计划五年来的变化和成就', proposer: '社会新闻部', department: '社会新闻部', status: 'in_progress', priority: 'high', createdAt: '2026-06-10', deadline: '2026-07-15', assignees: ['王记者', '赵记者'] },
  { id: '3', title: '科技创新企业风采展示', description: '宣传昌平区优秀科技企业，展示创新成果', proposer: '科技新闻部', department: '科技新闻部', status: 'pending', priority: 'medium', createdAt: '2026-06-18' },
  { id: '4', title: '夏季旅游攻略专题', description: '制作昌平夏季旅游攻略，推荐景点和活动', proposer: '文旅新闻部', department: '文旅新闻部', status: 'pending', priority: 'low', createdAt: '2026-06-17' },
  { id: '5', title: '教育系统优秀教师专访', description: '采访一线优秀教师，展现师德师风', proposer: '教育新闻部', department: '教育新闻部', status: 'rejected', priority: 'medium', createdAt: '2026-06-12' }
];

export const sentimentItems: SentimentItem[] = [
  { id: '1', title: '昌平区经济发展势头强劲 多项指标位居全市前列', source: '北京日报', platform: 'website', sentiment: 'positive', heat: 8500, publishTime: '2026-06-18 10:30', url: '', summary: '昌平区上半年经济运行良好，GDP增速达到6.8%，多项指标位居全市前列...', keywords: ['经济', '发展', '昌平'], region: '昌平区' },
  { id: '2', title: '回天地区交通拥堵问题引关注 居民盼改善', source: '新浪微博', platform: 'weibo', sentiment: 'negative', heat: 6200, publishTime: '2026-06-18 09:15', url: '', summary: '有网友反映回天地区早高峰交通拥堵严重，希望相关部门能够采取措施...', keywords: ['交通', '拥堵', '回天'], region: '回天地区' },
  { id: '3', title: '昌平草莓节吸引众多游客 首日接待超3万人次', source: '微信公众号', platform: 'wechat', sentiment: 'positive', heat: 5800, publishTime: '2026-06-18 08:00', url: '', summary: '昌平草莓节正式开幕，首日接待游客超过3万人次，现场热闹非凡...', keywords: ['草莓节', '旅游', '活动'], region: '昌平区' },
  { id: '4', title: '未来科学城多家企业发布新产品 科创活力迸发', source: '抖音', platform: 'douyin', sentiment: 'positive', heat: 4500, publishTime: '2026-06-17 16:30', url: '', summary: '未来科学城多家科技企业集中发布新产品，展示最新科技创新成果...', keywords: ['科技', '创新', '未来科学城'], region: '未来科学城' },
  { id: '5', title: '昌平部分小区停水 居民生活受影响', source: '今日头条', platform: 'website', sentiment: 'negative', heat: 3800, publishTime: '2026-06-17 14:20', url: '', summary: '因管道维修，昌平部分小区临时停水，给居民生活带来不便...', keywords: ['停水', '维修', '民生'], region: '昌平区' },
  { id: '6', title: '昌平区教育资源持续优化 新建多所学校', source: '北京青年报', platform: 'website', sentiment: 'neutral', heat: 3200, publishTime: '2026-06-17 11:00', url: '', summary: '昌平区持续加大教育投入，新建多所学校，教育资源进一步优化...', keywords: ['教育', '学校', '资源'], region: '昌平区' }
];

export const hotEvents: HotEvent[] = [
  { id: '1', name: '2026昌平草莓节', heat: 12500, trend: 'up', trendValue: 15.3, articleCount: 86, keywords: ['草莓节', '旅游', '活动'], relatedTopics: ['文旅', '经济'], updateTime: '2026-06-18 15:00' },
  { id: '2', name: '回天行动计划五周年', heat: 9800, trend: 'up', trendValue: 8.7, articleCount: 62, keywords: ['回天', '行动计划', '治理'], relatedTopics: ['民生', '社区'], updateTime: '2026-06-18 14:30' },
  { id: '3', name: '经济工作会议', heat: 8500, trend: 'stable', trendValue: 0.5, articleCount: 45, keywords: ['经济', '会议', '部署'], relatedTopics: ['政策', '发展'], updateTime: '2026-06-18 12:00' },
  { id: '4', name: '科技创新大会', heat: 6200, trend: 'down', trendValue: -3.2, articleCount: 38, keywords: ['科技', '创新', '大会'], relatedTopics: ['科技', '人才'], updateTime: '2026-06-18 10:00' },
  { id: '5', name: '夏季高考', heat: 5800, trend: 'down', trendValue: -12.5, articleCount: 29, keywords: ['高考', '教育', '考试'], relatedTopics: ['教育', '民生'], updateTime: '2026-06-18 09:00' }
];

export const courses: Course[] = [
  {
    id: '1',
    title: '新闻采访与写作基础',
    description: '系统学习新闻采访技巧和写作方法，提升新闻业务能力',
    cover: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop',
    instructor: '张教授',
    duration: 480,
    category: '新闻业务',
    students: 156,
    rating: 4.8,
    status: 'published',
    createdAt: '2026-05-01',
    chapters: [
      { id: 'c1', title: '新闻采访概述', duration: 45 },
      { id: 'c2', title: '采访准备与提问技巧', duration: 60 },
      { id: 'c3', title: '新闻写作基础', duration: 55 },
      { id: 'c4', title: '消息写作', duration: 50 },
      { id: 'c5', title: '通讯写作', duration: 65 },
      { id: 'c6', title: '深度报道', duration: 70 }
    ]
  },
  {
    id: '2',
    title: '短视频拍摄与剪辑实战',
    description: '掌握短视频拍摄技巧和剪辑方法，打造爆款短视频',
    cover: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=200&fit=crop',
    instructor: '李导演',
    duration: 360,
    category: '新媒体',
    students: 234,
    rating: 4.9,
    status: 'published',
    createdAt: '2026-05-10',
    chapters: [
      { id: 'c1', title: '短视频策划', duration: 40 },
      { id: 'c2', title: '拍摄设备与技巧', duration: 55 },
      { id: 'c3', title: '剪辑软件入门', duration: 60 },
      { id: 'c4', title: '剪辑技巧实战', duration: 65 },
      { id: 'c5', title: '特效与配乐', duration: 50 }
    ]
  },
  {
    id: '3',
    title: '新媒体运营与推广',
    description: '学习新媒体平台运营策略，提升内容传播力',
    cover: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=200&fit=crop',
    instructor: '王运营',
    duration: 300,
    category: '新媒体',
    students: 189,
    rating: 4.7,
    status: 'published',
    createdAt: '2026-04-20',
    chapters: [
      { id: 'c1', title: '新媒体平台概述', duration: 35 },
      { id: 'c2', title: '内容策划', duration: 50 },
      { id: 'c3', title: '用户增长策略', duration: 55 },
      { id: 'c4', title: '数据分析', duration: 45 },
      { id: 'c5', title: '变现模式', duration: 40 }
    ]
  },
  {
    id: '4',
    title: '舆情监测与应对',
    description: '掌握舆情监测方法，提升舆情应对能力',
    cover: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
    instructor: '赵专家',
    duration: 240,
    category: '舆情',
    students: 98,
    rating: 4.6,
    status: 'draft',
    createdAt: '2026-06-01',
    chapters: [
      { id: 'c1', title: '舆情基础概念', duration: 30 },
      { id: 'c2', title: '舆情监测方法', duration: 45 },
      { id: 'c3', title: '舆情分析技巧', duration: 50 },
      { id: 'c4', title: '舆情应对策略', duration: 55 }
    ]
  }
];

export const exams: Exam[] = [
  { id: '1', title: '新闻业务基础考试', courseId: '1', duration: 90, totalScore: 100, passScore: 60, questionCount: 50, status: 'published', createdAt: '2026-05-15', startDate: '2026-06-01', endDate: '2026-06-30' },
  { id: '2', title: '短视频创作技能考核', courseId: '2', duration: 120, totalScore: 100, passScore: 70, questionCount: 30, status: 'published', createdAt: '2026-05-20', startDate: '2026-06-10', endDate: '2026-07-10' },
  { id: '3', title: '新媒体运营资格考试', courseId: '3', duration: 60, totalScore: 100, passScore: 60, questionCount: 40, status: 'draft', createdAt: '2026-06-05' }
];

export const trainingRecords: TrainingRecord[] = [
  { id: '1', userId: '1', userName: '张编辑', courseId: '1', courseTitle: '新闻采访与写作基础', progress: 100, studyHours: 8, examScore: 92, certificateUrl: '', completedAt: '2026-05-20', status: 'completed' },
  { id: '2', userId: '1', userName: '张编辑', courseId: '2', courseTitle: '短视频拍摄与剪辑实战', progress: 65, studyHours: 4, status: 'studying' },
  { id: '3', userId: '2', userName: '李记者', courseId: '1', courseTitle: '新闻采访与写作基础', progress: 100, studyHours: 8, examScore: 88, certificateUrl: '', completedAt: '2026-05-25', status: 'completed' },
  { id: '4', userId: '3', userName: '王记者', courseId: '3', courseTitle: '新媒体运营与推广', progress: 40, studyHours: 2, status: 'studying' },
  { id: '5', userId: '4', userName: '刘记者', courseId: '2', courseTitle: '短视频拍摄与剪辑实战', progress: 100, studyHours: 6, examScore: 95, certificateUrl: '', completedAt: '2026-06-05', status: 'completed' }
];

export const assets: Asset[] = [
  { id: '1', title: '昌平区政府大楼航拍图', type: 'image', thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f1?w=300&h=200&fit=crop', fileSize: '5.2MB', format: 'JPG', copyright: 'original', copyrightHolder: '昌平区融媒体中心', tags: ['政府', '建筑', '航拍'], metadata: { 分辨率: '4096x2732', 拍摄时间: '2026-03-15', 摄影师: '王摄影' }, uploader: '王摄影', createdAt: '2026-03-15', downloads: 234, views: 1560, status: 'available' },
  { id: '2', title: '居庸关长城宣传片', type: 'video', thumbnail: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=300&h=200&fit=crop', fileSize: '156MB', format: 'MP4', copyright: 'original', copyrightHolder: '昌平区融媒体中心', tags: ['长城', '文旅', '宣传片'], metadata: { 时长: '5分30秒', 分辨率: '1920x1080', 码率: '8Mbps' }, uploader: '视频部', createdAt: '2026-04-10', downloads: 156, views: 8900, status: 'available' },
  { id: '3', title: '昌平草莓宣传图', type: 'image', thumbnail: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=200&fit=crop', fileSize: '3.8MB', format: 'JPG', copyright: 'authorized', copyrightHolder: '某摄影工作室', licenseType: '商用授权', expirationDate: '2027-06-01', tags: ['草莓', '农业', '美食'], metadata: { 分辨率: '3000x2000', 授权类型: '非独家' }, uploader: '图库管理员', createdAt: '2026-01-20', downloads: 456, views: 3200, status: 'available' },
  { id: '4', title: '新闻片头音乐', type: 'audio', thumbnail: '', fileSize: '8.5MB', format: 'MP3', copyright: 'public', copyrightHolder: '公有领域', tags: ['音乐', '片头', '新闻'], metadata: { 时长: '30秒', 音质: '320kbps' }, uploader: '音频部', createdAt: '2026-02-10', downloads: 89, views: 560, status: 'available' },
  { id: '5', title: '2026昌平统计年鉴', type: 'document', thumbnail: '', fileSize: '12.5MB', format: 'PDF', copyright: 'original', copyrightHolder: '昌平区统计局', tags: ['统计', '数据', '年鉴'], metadata: { 页数: '256页', 年份: '2026' }, uploader: '数据部', createdAt: '2026-05-01', downloads: 67, views: 340, status: 'available' },
  { id: '6', title: '未来科学城规划图', type: 'graphic', thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&h=200&fit=crop', fileSize: '15.3MB', format: 'PSD', copyright: 'original', copyrightHolder: '昌平区规划和自然资源委员会', tags: ['规划', '科技', '未来科学城'], metadata: { 尺寸: '8000x6000', 图层: '15层' }, uploader: '美编部', createdAt: '2026-03-20', downloads: 45, views: 280, status: 'restricted' },
  { id: '7', title: '明十三陵景区高清照片集', type: 'image', thumbnail: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=300&h=200&fit=crop', fileSize: '256MB', format: 'ZIP', copyright: 'authorized', copyrightHolder: '十三陵特区办事处', licenseType: '宣传使用授权', tags: ['文物', '旅游', '历史'], metadata: { 数量: '50张', 平均大小: '5MB' }, uploader: '图库管理员', createdAt: '2026-04-05', downloads: 123, views: 890, status: 'pending' }
];

export const distributionChannels: DistributionChannel[] = [
  { id: 'site', name: '昌平政府网', icon: 'globe', type: 'website', category: '官方平台', status: 'active', todayPosts: 15, todayViews: 25600 },
  { id: 'wechat', name: '北京昌平微信公众号', icon: 'message-circle', type: 'wechat', category: '新媒体', status: 'active', followers: 320000, todayPosts: 6, todayViews: 78900 },
  { id: 'weibo', name: '北京昌平微博', icon: 'twitter', type: 'weibo', category: '新媒体', status: 'active', followers: 580000, todayPosts: 23, todayViews: 45600 },
  { id: 'douyin', name: '昌平融媒抖音号', icon: 'video', type: 'douyin', category: '短视频', status: 'active', followers: 1250000, todayPosts: 8, todayViews: 156000 },
  { id: 'kuaishou', name: '昌平融媒快手号', icon: 'film', type: 'kuaishou', category: '短视频', status: 'active', followers: 680000, todayPosts: 5, todayViews: 89000 },
  { id: 'app', name: '昌平融媒APP', icon: 'smartphone', type: 'app', category: '官方平台', status: 'active', followers: 450000, todayPosts: 30, todayViews: 234000 },
  { id: 'sph', name: '昌平视频号', icon: 'video', type: 'douyin', category: '短视频', status: 'active', followers: 180000, todayPosts: 4, todayViews: 32000 },
  { id: 'paper', name: '昌平报', icon: 'newspaper', type: 'newspaper', category: '传统媒体', status: 'active', todayPosts: 8, todayViews: 12500 },
  { id: 'tv', name: '昌平电视台', icon: 'tv', type: 'tv', category: '传统媒体', status: 'active', todayPosts: 5, todayViews: 8900 },
  { id: 'radio', name: '昌平广播电台', icon: 'radio', type: 'radio', category: '传统媒体', status: 'active', todayPosts: 12, todayViews: 6700 }
];

export const articleTrendData = [
  { date: '6/12', articles: 72, views: 85000, likes: 3200, shares: 890 },
  { date: '6/13', articles: 68, views: 78000, likes: 2900, shares: 780 },
  { date: '6/14', articles: 85, views: 92000, likes: 3800, shares: 1020 },
  { date: '6/15', articles: 79, views: 88000, likes: 3500, shares: 950 },
  { date: '6/16', articles: 92, views: 105000, likes: 4200, shares: 1180 },
  { date: '6/17', articles: 88, views: 98000, likes: 3900, shares: 1050 },
  { date: '6/18', articles: 86, views: 112000, likes: 4500, shares: 1280 }
];

export const channelDistribution = [
  { name: '微信', value: 32, color: '#07c160' },
  { name: '抖音', value: 28, color: '#000000' },
  { name: '微博', value: 18, color: '#e6162d' },
  { name: '网站', value: 12, color: '#3b82f6' },
  { name: '报纸', value: 5, color: '#6b7280' },
  { name: '其他', value: 5, color: '#a855f7' }
];

export const sentimentDistribution = [
  { name: '正面', value: 65, color: '#10b981' },
  { name: '中性', value: 22, color: '#f59e0b' },
  { name: '负面', value: 13, color: '#ef4444' }
];

export const departmentStats = [
  { name: '新闻中心', articles: 28, views: 45000 },
  { name: '社会新闻部', articles: 18, views: 32000 },
  { name: '科技新闻部', articles: 12, views: 18000 },
  { name: '文旅新闻部', articles: 15, views: 28000 },
  { name: '教育新闻部', articles: 8, views: 12000 },
  { name: '卫生新闻部', articles: 5, views: 8000 }
];
