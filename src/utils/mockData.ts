const img = (prompt: string, size = 'square') =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`

export interface MenuItem {
  id: string
  name: string
  price: number
  description: string
  category: string
  spicy: boolean
  popular: boolean
}

export interface Stall {
  id: string
  name: string
  canteen: string
  rating: number
  avgWait: string
  image: string
  tags: string[]
  menu: MenuItem[]
}

export interface Product {
  id: string
  name: string
  price: number
  originalPrice: number
  category: string
  shelf: string
  expiryDate: string
  stock: number
  image: string
  isExpiring: boolean
  discount: number
}

export interface Post {
  id: string
  author: string
  avatar: string
  content: string
  images: string[]
  tags: string[]
  likes: number
  comments: number
  createdAt: string
  type: 'daily' | 'trade' | 'intern'
}

export interface Textbook {
  id: string
  title: string
  author: string
  course: string
  condition: string
  price: number
  originalPrice: number
  seller: string
  department: string
  contact: string
}

export interface Internship {
  id: string
  company: string
  position: string
  location: string
  salary: string
  duration: string
  requirements: string[]
  tags: string[]
  deadline: string
  postedAt: string
}

export interface Department {
  id: string
  name: string
  children?: Department[]
}

export interface Geofence {
  id: string
  name: string
  type: string
  radius: number
  center: { lat: number; lng: number }
  color: string
  rules: string[]
}

export interface SentimentAlert {
  id: string
  keyword: string
  source: string
  sentiment: 'positive' | 'negative' | 'neutral'
  count: number
  trend: 'up' | 'down' | 'stable'
  severity: 'low' | 'medium' | 'high'
  summary: string
  detectedAt: string
}

export interface AnalyticsData {
  heatmap: { hour: number; day: string; value: number }[]
  trends: { date: string; dining: number; store: number; social: number }[]
  distribution: { category: string; value: number; color: string }[]
}

export const stalls: Stall[] = [
  {
    id: 's1', name: '麻辣香锅', canteen: '一食堂', rating: 4.8, avgWait: '8分钟',
    image: img('中式麻辣香锅美食特写', 'landscape_4_3'),
    tags: ['辣', '人气'], menu: [
      { id: 'm1', name: '麻辣香锅(小)', price: 18, description: '自选食材现炒', category: '主食', spicy: true, popular: true },
      { id: 'm2', name: '麻辣香锅(大)', price: 28, description: '大份自选食材现炒', category: '主食', spicy: true, popular: true },
      { id: 'm3', name: '番茄香锅', price: 20, description: '番茄汤底不辣香锅', category: '主食', spicy: false, popular: false },
    ],
  },
  {
    id: 's2', name: '黄焖鸡米饭', canteen: '一食堂', rating: 4.6, avgWait: '10分钟',
    image: img('黄焖鸡米饭中式快餐', 'landscape_4_3'),
    tags: ['经典', '实惠'], menu: [
      { id: 'm4', name: '黄焖鸡米饭(小)', price: 14, description: '嫩鸡块配土豆', category: '主食', spicy: false, popular: true },
      { id: 'm5', name: '黄焖鸡米饭(大)', price: 18, description: '加量鸡块', category: '主食', spicy: false, popular: false },
      { id: 'm6', name: '黄焖排骨米饭', price: 22, description: '排骨替换鸡块', category: '主食', spicy: false, popular: true },
    ],
  },
  {
    id: 's3', name: '兰州拉面', canteen: '二食堂', rating: 4.5, avgWait: '5分钟',
    image: img('兰州牛肉拉面热气腾腾', 'landscape_4_3'),
    tags: ['面食', '快'], menu: [
      { id: 'm7', name: '牛肉拉面(小)', price: 12, description: '手工拉面牛肉汤', category: '面食', spicy: false, popular: true },
      { id: 'm8', name: '牛肉拉面(大)', price: 16, description: '加量面条牛肉', category: '面食', spicy: false, popular: false },
      { id: 'm9', name: '刀削面', price: 13, description: '山西刀削面配牛肉', category: '面食', spicy: false, popular: false },
      { id: 'm10', name: '牛肉拌面', price: 15, description: '干拌牛肉面', category: '面食', spicy: true, popular: true },
    ],
  },
  {
    id: 's4', name: '港式烧腊', canteen: '二食堂', rating: 4.7, avgWait: '6分钟',
    image: img('港式烧腊拼盘饭', 'landscape_4_3'),
    tags: ['烧腊', '广式'], menu: [
      { id: 'm11', name: '烧鹅饭', price: 22, description: '脆皮烧鹅配米饭', category: '主食', spicy: false, popular: true },
      { id: 'm12', name: '叉烧饭', price: 18, description: '蜜汁叉烧', category: '主食', spicy: false, popular: true },
      { id: 'm13', name: '双拼饭', price: 24, description: '任选两种烧腊', category: '主食', spicy: false, popular: true },
    ],
  },
  {
    id: 's5', name: '轻食沙拉', canteen: '三食堂', rating: 4.4, avgWait: '7分钟',
    image: img('健康轻食沙拉碗', 'landscape_4_3'),
    tags: ['健康', '轻食'], menu: [
      { id: 'm14', name: '凯撒沙拉', price: 20, description: '罗马生菜鸡胸肉', category: '轻食', spicy: false, popular: true },
      { id: 'm15', name: '牛油果鸡胸碗', price: 26, description: '牛油果藜麦鸡胸', category: '轻食', spicy: false, popular: true },
      { id: 'm16', name: '金枪鱼全麦三明治', price: 18, description: '全麦面包金枪鱼', category: '轻食', spicy: false, popular: false },
    ],
  },
  {
    id: 's6', name: '早餐豆浆', canteen: '三食堂', rating: 4.3, avgWait: '3分钟',
    image: img('中式早餐豆浆油条包子', 'landscape_4_3'),
    tags: ['早餐', '快'], menu: [
      { id: 'm17', name: '豆浆+油条', price: 6, description: '现磨豆浆配油条', category: '早餐', spicy: false, popular: true },
      { id: 'm18', name: '鲜肉包(2个)', price: 5, description: '手工鲜肉包子', category: '早餐', spicy: false, popular: true },
      { id: 'm19', name: '鸡蛋灌饼', price: 7, description: '鸡蛋灌饼加生菜', category: '早餐', spicy: false, popular: true },
      { id: 'm20', name: '小馄饨', price: 8, description: '猪肉小馄饨', category: '早餐', spicy: false, popular: false },
    ],
  },
]

export const products: Product[] = [
  { id: 'p1', name: '乐事薯片(原味)', price: 6.5, originalPrice: 8, category: '零食', shelf: 'A-01', expiryDate: '2026-09-15', stock: 48, image: img('乐事薯片原味包装', 'square'), isExpiring: false, discount: 19 },
  { id: 'p2', name: '可口可乐330ml', price: 2.5, originalPrice: 3, category: '饮料', shelf: 'B-03', expiryDate: '2026-12-01', stock: 120, image: img('可口可乐红色罐装', 'square'), isExpiring: false, discount: 17 },
  { id: 'p3', name: '康师傅红烧牛肉面', price: 4.5, originalPrice: 5, category: '方便食品', shelf: 'C-02', expiryDate: '2026-08-20', stock: 36, image: img('康师傅方便面包装', 'square'), isExpiring: false, discount: 10 },
  { id: 'p4', name: '蒙牛纯牛奶250ml', price: 3, originalPrice: 3.5, category: '乳制品', shelf: 'D-01', expiryDate: '2026-06-15', stock: 8, image: img('蒙牛纯牛奶盒装', 'square'), isExpiring: true, discount: 50 },
  { id: 'p5', name: '卫龙大面筋', price: 3.5, originalPrice: 4, category: '零食', shelf: 'A-03', expiryDate: '2026-10-10', stock: 60, image: img('卫龙辣条包装', 'square'), isExpiring: false, discount: 13 },
  { id: 'p6', name: '奥利奥饼干', price: 8.9, originalPrice: 10.9, category: '零食', shelf: 'A-02', expiryDate: '2026-11-30', stock: 25, image: img('奥利奥饼干蓝色包装', 'square'), isExpiring: false, discount: 18 },
  { id: 'p7', name: '三只松鼠每日坚果', price: 12.8, originalPrice: 15.9, category: '零食', shelf: 'A-05', expiryDate: '2026-06-18', stock: 5, image: img('三只松鼠坚果礼盒', 'square'), isExpiring: true, discount: 55 },
  { id: 'p8', name: '农夫山泉550ml', price: 1.5, originalPrice: 2, category: '饮料', shelf: 'B-01', expiryDate: '2027-03-01', stock: 200, image: img('农夫山泉矿泉水瓶', 'square'), isExpiring: false, discount: 25 },
  { id: 'p9', name: '百草味芒果干', price: 9.9, originalPrice: 12.9, category: '零食', shelf: 'A-04', expiryDate: '2026-06-20', stock: 3, image: img('百草味芒果干包装', 'square'), isExpiring: true, discount: 60 },
  { id: 'p10', name: '旺旺雪饼', price: 5.5, originalPrice: 6.5, category: '零食', shelf: 'A-06', expiryDate: '2026-08-01', stock: 30, image: img('旺旺雪饼包装', 'square'), isExpiring: false, discount: 15 },
  { id: 'p11', name: '统一冰红茶500ml', price: 3, originalPrice: 3.5, category: '饮料', shelf: 'B-04', expiryDate: '2026-06-12', stock: 4, image: img('统一冰红茶瓶装', 'square'), isExpiring: true, discount: 65 },
  { id: 'p12', name: '达利园软面包', price: 7.8, originalPrice: 9.5, category: '方便食品', shelf: 'C-01', expiryDate: '2026-07-25', stock: 18, image: img('达利园软面包包装', 'square'), isExpiring: false, discount: 18 },
]

export const posts: Post[] = [
  { id: 'po1', author: '校园美食家', avatar: '', content: '今天一食堂的麻辣香锅绝了！新加的藤椒味太上头了，推荐指数五颗星⭐⭐⭐⭐⭐', images: [], tags: ['美食', '麻辣香锅'], likes: 128, comments: 32, createdAt: '2026-06-09T11:00:00Z', type: 'daily' },
  { id: 'po2', author: '图书馆常客', avatar: '', content: '图书馆三楼自习室空调终于修好了！再也不用带小风扇了，感恩学校维修速度👍', images: [], tags: ['校园生活', '图书馆'], likes: 89, comments: 15, createdAt: '2026-06-09T09:30:00Z', type: 'daily' },
  { id: 'po3', author: '运动达人', avatar: '', content: '操场跑道翻新完毕，新塑胶跑道跑起来太舒服了！今晚约跑的有吗？7点操场集合🏃', images: [], tags: ['运动', '操场'], likes: 56, comments: 22, createdAt: '2026-06-08T16:00:00Z', type: 'daily' },
  { id: 'po4', author: '二手书铺', avatar: '', content: '出高等数学同济第七版上下册，九成新无笔记，原价68现卖20，可面交，联系方式看主页', images: [], tags: ['二手', '教材'], likes: 23, comments: 8, createdAt: '2026-06-08T14:00:00Z', type: 'trade' },
  { id: 'po5', author: '社团小喇叭', avatar: '', content: '摄影社周末采风活动报名中！地点：校园湖畔，时间：周六上午9点，带相机手机也行，欢迎新手参加', images: [], tags: ['社团', '摄影'], likes: 67, comments: 18, createdAt: '2026-06-08T10:00:00Z', type: 'daily' },
  { id: 'po6', author: '实习信息站', avatar: '', content: '腾讯2026暑期实习补录进行中！产品经理岗还有少量名额，有需要的同学抓紧投递，链接见评论区', images: [], tags: ['实习', '腾讯'], likes: 234, comments: 56, createdAt: '2026-06-07T20:00:00Z', type: 'intern' },
  { id: 'po7', author: '省钱小能手', avatar: '', content: '超市临期专区今日发现好物！蒙牛纯牛奶半价，三只松鼠坚果55折，手慢无！位置在超市最里面靠墙那排', images: [], tags: ['超市', '省钱'], likes: 189, comments: 45, createdAt: '2026-06-07T12:00:00Z', type: 'trade' },
  { id: 'po8', author: '考研战友', avatar: '', content: '考研政治大纲变动汇总来啦！马原部分新增3个考点，毛中特有调整，详情见我整理的文档，需要私信', images: [], tags: ['考研', '学习'], likes: 312, comments: 78, createdAt: '2026-06-06T18:00:00Z', type: 'daily' },
]

export const textbooks: Textbook[] = [
  { id: 't1', title: '高等数学(第七版)上册', author: '同济大学数学系', course: '高等数学I', condition: '九成新', price: 15, originalPrice: 34, seller: '李同学', department: '数学学院', contact: '微信: limath2024' },
  { id: 't2', title: '数据结构(C语言版)', author: '严蔚敏', course: '数据结构', condition: '八成新', price: 12, originalPrice: 39, seller: '王同学', department: '计算机学院', contact: 'QQ: 123456789' },
  { id: 't3', title: '大学英语综合教程4', author: '李荫华', course: '大学英语IV', condition: '七成新', price: 8, originalPrice: 45, seller: '赵同学', department: '外国语学院', contact: '微信: zhaoyy2024' },
  { id: 't4', title: '线性代数(第六版)', author: '同济大学数学系', course: '线性代数', condition: '全新', price: 20, originalPrice: 32, seller: '刘同学', department: '数学学院', contact: '微信: liulinear' },
  { id: 't5', title: '操作系统概念(第九版)', author: 'Abraham Silberschatz', course: '操作系统', condition: '八成新', price: 35, originalPrice: 89, seller: '陈同学', department: '计算机学院', contact: '微信: chenos2024' },
]

export const internships: Internship[] = [
  { id: 'i1', company: '字节跳动', position: '前端开发实习生', location: '北京', salary: '300-400元/天', duration: '3个月', requirements: ['熟悉React/Vue', 'TypeScript', 'Git'], tags: ['大厂', '前端', '高薪'], deadline: '2026-06-30', postedAt: '2026-06-01' },
  { id: 'i2', company: '腾讯', position: '产品经理实习生', location: '深圳', salary: '250-350元/天', duration: '3个月', requirements: ['产品思维', '数据分析', '沟通能力'], tags: ['大厂', '产品', '深圳'], deadline: '2026-07-15', postedAt: '2026-06-03' },
  { id: 'i3', company: '美团', position: '后端开发实习生', location: '北京', salary: '280-380元/天', duration: '3个月', requirements: ['Java/Go', 'MySQL', '分布式基础'], tags: ['大厂', '后端', 'Java'], deadline: '2026-06-25', postedAt: '2026-05-28' },
  { id: 'i4', company: '小红书', position: '算法实习生', location: '上海', salary: '300-450元/天', duration: '3个月', requirements: ['Python', '机器学习基础', 'PyTorch'], tags: ['算法', '上海', '高薪'], deadline: '2026-07-10', postedAt: '2026-06-05' },
  { id: 'i5', company: '华为', position: '嵌入式开发实习生', location: '成都', salary: '200-300元/天', duration: '3个月', requirements: ['C/C++', '嵌入式系统', 'Linux'], tags: ['硬件', '成都', '华为'], deadline: '2026-07-20', postedAt: '2026-06-02' },
]

export const departments: Department[] = [
  {
    id: 'd1', name: '信息学部', children: [
      { id: 'd11', name: '计算机科学与技术学院', children: [
        { id: 'd111', name: '计算机科学与技术系' },
        { id: 'd112', name: '人工智能系' },
        { id: 'd113', name: '软件工程系' },
      ]},
      { id: 'd12', name: '电子信息学院', children: [
        { id: 'd121', name: '电子信息工程系' },
        { id: 'd122', name: '通信工程系' },
      ]},
      { id: 'd13', name: '网络安全学院' },
    ],
  },
  {
    id: 'd2', name: '理学部', children: [
      { id: 'd21', name: '数学学院' },
      { id: 'd22', name: '物理学院' },
      { id: 'd23', name: '化学学院' },
    ],
  },
  {
    id: 'd3', name: '人文社科学部', children: [
      { id: 'd31', name: '文学院' },
      { id: 'd32', name: '外国语学院' },
      { id: 'd33', name: '法学院' },
      { id: 'd34', name: '经济与管理学院' },
    ],
  },
]

export const geofences: Geofence[] = [
  {
    id: 'g1', name: '核心教学区', type: 'teaching', radius: 500,
    center: { lat: 30.516, lng: 114.412 },
    color: '#1B3A5C',
    rules: ['上课时段禁止大声喧哗', '禁止外卖骑手进入', '限速20km/h'],
  },
  {
    id: 'g2', name: '生活服务区', type: 'living', radius: 400,
    center: { lat: 30.519, lng: 114.415 },
    color: '#FF6B35',
    rules: ['允许外卖配送', '超市配送优先', '临时停车位充足'],
  },
  {
    id: 'g3', name: '运动休闲区', type: 'recreation', radius: 350,
    center: { lat: 30.514, lng: 114.418 },
    color: '#2EC4B6',
    rules: ['允许社团活动', '允许外校人员预约', '22:00后关闭照明'],
  },
]

export const sentimentAlerts: SentimentAlert[] = [
  { id: 'sa1', keyword: '食堂涨价', source: '校园论坛', sentiment: 'negative', count: 234, trend: 'up', severity: 'high', summary: '多个帖子反映一食堂菜品价格上涨10%-20%，引发学生不满', detectedAt: '2026-06-09T08:00:00Z' },
  { id: 'sa2', keyword: '图书馆占座', source: '微信表白墙', sentiment: 'negative', count: 156, trend: 'stable', severity: 'medium', summary: '期末季图书馆占座现象严重，学生呼吁加强管理', detectedAt: '2026-06-08T14:00:00Z' },
  { id: 'sa3', keyword: '操场翻新', source: '微博超话', sentiment: 'positive', count: 89, trend: 'down', severity: 'low', summary: '操场翻新获得好评，多数学生对新跑道表示满意', detectedAt: '2026-06-08T10:00:00Z' },
  { id: 'sa4', keyword: '宿舍停水', source: '校园论坛', sentiment: 'negative', count: 312, trend: 'up', severity: 'high', summary: '北苑宿舍连续两天早晚停水，学生投诉激增', detectedAt: '2026-06-09T07:30:00Z' },
  { id: 'sa5', keyword: '实习招聘', source: '就业信息网', sentiment: 'positive', count: 67, trend: 'stable', severity: 'low', summary: '暑期实习信息发布密集，学生关注度持续走高', detectedAt: '2026-06-07T16:00:00Z' },
]

const hours = Array.from({ length: 24 }, (_, i) => i)
const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export const analyticsData: AnalyticsData = {
  heatmap: days.flatMap((day) =>
    hours.map((hour) => ({
      hour,
      day,
      value: Math.round(
        (hour >= 7 && hour <= 21 ? 1 : 0.1) *
        (hour >= 11 && hour <= 13 ? 2.5 : hour >= 17 && hour <= 19 ? 2.2 : 1) *
        (day === '周六' || day === '周日' ? 0.7 : 1) *
        (30 + Math.random() * 70)
      ),
    }))
  ),
  trends: Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2026, 5, i + 1)
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      dining: Math.round(800 + Math.random() * 400),
      store: Math.round(300 + Math.random() * 200),
      social: Math.round(500 + Math.random() * 300),
    }
  }),
  distribution: [
    { category: '餐饮订单', value: 35, color: '#FF6B35' },
    { category: '超市购物', value: 20, color: '#1B3A5C' },
    { category: '社交互动', value: 25, color: '#2EC4B6' },
    { category: '二手交易', value: 10, color: '#FFC857' },
    { category: '实习内推', value: 10, color: '#E63946' },
  ],
}
