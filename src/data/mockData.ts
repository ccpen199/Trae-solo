import type {
  ServiceGrid,
  ServiceProvider,
  VirtualResource,
  StarLevelRule,
  CompensationRule,
  GrowthMetrics,
  Dispute,
  Review,
  ServiceCategory,
  AchievementBadge,
} from '@/types';

const CITY_CENTER = { lat: 31.2304, lng: 121.4737 };

const reviewSamples = [
  { content: '师傅非常专业，提前到达，干活细致！', tags: ['准时', '专业', '干净'] },
  { content: '服务态度很好，问题处理得很满意。', tags: ['态度好', '满意'] },
  { content: '性价比高，以后还会选择这家。', tags: ['性价比高', '回头客'] },
  { content: '响应速度快，约好时间很快就来了。', tags: ['响应快', '准时'] },
  { content: '整体不错，细节处理也到位。', tags: ['细致', '推荐'] },
  { content: '工作人员很有礼貌，服务流程规范。', tags: ['礼貌', '规范'] },
  { content: '价格透明，没有隐形消费，很放心。', tags: ['价格透明', '放心'] },
  { content: '售后跟进很及时，有问题都能解决。', tags: ['售后好', '负责任'] },
  { content: '师傅手艺很棒，问题一次性解决了。', tags: ['专业', '效率高'] },
  { content: '态度超好，有问必答，非常耐心。', tags: ['态度好', '耐心'] },
  { content: '比预期的好很多，强烈推荐！', tags: ['推荐', '超预期'] },
  { content: '准时到达，干活麻利，非常满意。', tags: ['准时', '专业', '满意'] },
];

const replySamples = [
  '感谢您的好评！我们会继续努力，为您提供更优质的服务。',
  '谢谢您的认可！您的满意是我们最大的动力，期待再次为您服务。',
  '非常感谢您的支持！我们会保持服务质量，欢迎下次光临。',
  '感谢您的五星好评！我们会再接再厉，竭诚为您服务。',
  '谢谢您的鼓励！您的满意是我们前进的动力，祝您生活愉快！',
];

const userNames = ['王女士', '李先生', '张阿姨', '陈先生', '刘小姐', '赵叔叔', '孙女士', '周先生', '吴阿姨', '郑小姐'];

const genReviews = (seed: number): Review[] => {
  const count = 8 + (seed % 3);
  return Array.from({ length: count }, (_, i) => {
    const idx = (seed + i) % reviewSamples.length;
    const sample = reviewSamples[idx];
    const hasReply = i % 3 !== 2;
    return {
      id: `r-${seed}-${i}`,
      userName: userNames[(seed + i) % userNames.length],
      userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}-${i}`,
      rating: 4.0 + ((seed + i) % 5) * 0.2,
      content: sample.content,
      date: `2026-0${1 + ((seed + i) % 6)}-${10 + ((seed + i) * 3) % 20}`,
      tags: sample.tags,
      reply: hasReply ? replySamples[(seed + i) % replySamples.length] : undefined,
      replyDate: hasReply ? `2026-0${1 + ((seed + i) % 6)}-${12 + ((seed + i) * 3) % 18}` : undefined,
    };
  });
};

export const mockGrids = Array.from({ length: 25 }, (_, i) => {
  const row = Math.floor(i / 5);
  const col = i % 5;
  const latOffset = (row - 2) * 0.0045;
  const lngOffset = (col - 2) * 0.0055;
  const categories: ServiceCategory[] = ['餐饮', '家政', '维修', '快递', '保洁', '搬家', '美容', '教育'];
  const selectedCats = categories.filter((_, idx) => (i + idx) % 3 === 0).slice(0, 4);
  return {
    id: `grid-${i}`,
    code: `G${String(row + 1).padStart(2, '0')}${String(col + 1).padStart(2, '0')}`,
    name: ['人民广场', '南京东路', '陆家嘴', '静安寺', '徐家汇', '淮海路', '五角场', '四川北路', '中山公园', '虹桥'][i % 10] + '片区',
    center: {
      lat: CITY_CENTER.lat + latOffset,
      lng: CITY_CENTER.lng + lngOffset,
    },
    bounds: [
      CITY_CENTER.lat + latOffset - 0.00225,
      CITY_CENTER.lng + lngOffset - 0.00275,
      CITY_CENTER.lat + latOffset + 0.00225,
      CITY_CENTER.lng + lngOffset + 0.00275,
    ],
    categories: selectedCats.length > 0 ? selectedCats : (['餐饮', '家政'] as ServiceCategory[]),
    providerIds: [],
    heatLevel: 1 + (i * 7) % 5,
  };
}) as ServiceGrid[];

const providerNames = [
  { name: '洁净家家政', cat: '家政' as const },
  { name: '快修侠家电维修', cat: '维修' as const },
  { name: '顺风快递驿站', cat: '快递' as const },
  { name: '川香阁私房菜', cat: '餐饮' as const },
  { name: '美之约美容SPA', cat: '美容' as const },
  { name: '金牌搬家服务', cat: '搬家' as const },
  { name: '名师一对一教育', cat: '教育' as const },
  { name: '亮洁保洁服务', cat: '保洁' as const },
  { name: '老上海本帮菜', cat: '餐饮' as const },
  { name: '无忧家政服务', cat: '家政' as const },
  { name: '速达家电维修', cat: '维修' as const },
  { name: '韵达快递代收点', cat: '快递' as const },
  { name: '清雅美容会所', cat: '美容' as const },
  { name: '安心搬家公司', cat: '搬家' as const },
  { name: '启智教育培训', cat: '教育' as const },
  { name: '净新保洁中心', cat: '保洁' as const },
  { name: '粤味轩茶餐厅', cat: '餐饮' as const },
  { name: '邻里家政互助', cat: '家政' as const },
  { name: '精诚家电修理', cat: '维修' as const },
  { name: '中通快递网点', cat: '快递' as const },
  { name: '靓颜美容养生馆', cat: '美容' as const },
  { name: '快捷搬家服务部', cat: '搬家' as const },
  { name: '学优教育培训中心', cat: '教育' as const },
  { name: '万洁保洁服务站', cat: '保洁' as const },
  { name: '湘菜馆家常菜', cat: '餐饮' as const },
  { name: '好帮手家政服务', cat: '家政' as const },
  { name: '利民家电维修部', cat: '维修' as const },
  { name: '申通快递服务点', cat: '快递' as const },
  { name: '伊人美容美体', cat: '美容' as const },
  { name: '福临门搬家公司', cat: '搬家' as const },
  { name: '博文教育辅导中心', cat: '教育' as const },
  { name: '洁净保洁服务队', cat: '保洁' as const },
  { name: '杭帮菜精品餐厅', cat: '餐饮' as const },
  { name: '万家乐家政服务', cat: '家政' as const },
  { name: '诚信家电维修中心', cat: '维修' as const },
  { name: '圆通快递代理点', cat: '快递' as const },
  { name: '丽都美容美发', cat: '美容' as const },
  { name: '顺利搬家服务部', cat: '搬家' as const },
  { name: '智慧教育培训中心', cat: '教育' as const },
  { name: '新天地保洁服务', cat: '保洁' as const },
];

export const mockProviders: ServiceProvider[] = providerNames.map((p, i) => {
  const gridIdx = i % mockGrids.length;
  const grid = mockGrids[gridIdx];
  const starLevel = (Math.min(5, Math.floor(i / 8) + 1)) as 1 | 2 | 3 | 4 | 5;
  const goodRate = 0.8 + (starLevel * 0.032) + (i % 3) * 0.01;
  const responseSpeed = 60 - starLevel * 10 - (i % 3) * 5;
  const orderCount = 50 + starLevel * 400 + i * 20;
  const trafficWeight = [0.6, 0.8, 1.0, 1.3, 1.8][starLevel - 1];
  mockGrids[gridIdx].providerIds.push(`p-${i}`);
  return {
    id: `p-${i}`,
    name: p.name,
    avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(p.name)}&backgroundColor=${['FF6B35', '0A2540', '2DD4A8', '8FAAD1'][i % 4]}`,
    category: p.cat,
    gridId: grid.id,
    location: grid.center,
    address: grid.name + `${(i % 99) + 1}号`,
    starLevel,
    orderCount,
    goodRate: Math.round(goodRate * 100) / 100,
    responseSpeed,
    trafficWeight,
    description: `${p.name}成立于2020年，专业${p.cat}服务，拥有资深团队，服务千家万户。`,
    priceRange: ['¥50-200', '¥80-500', '¥10-30', '¥30-150', '¥100-1000', '¥200-2000', '¥150-500/时', '¥25-80/时'][i % 8],
    reviews: genReviews(i),
  };
});

const genVrReviews = (seed: number): Review[] => {
  const samples = [
    { content: 'VR效果很真实，体验超棒！', tags: ['真实', '清晰'] },
    { content: '不用跑现场就能体验，太方便了', tags: ['便捷', '省时'] },
    { content: '360度全景，细节都看得到', tags: ['全景', '细节好'] },
    { content: '客服很耐心，指导怎么操作', tags: ['服务好', '耐心'] },
    { content: '体验完直接预约了线下服务', tags: ['转化高', '满意'] },
  ];
  return samples.slice(0, 3 + (seed % 2)).map((s, i) => ({
    id: `vr-r-${seed}-${i}`,
    userName: userNames[(seed + i) % userNames.length],
    userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=vr-${seed}-${i}`,
    rating: 4.3 + (i % 3) * 0.3,
    content: s.content,
    date: `2026-0${1 + (i % 6)}-${10 + i * 4}`,
    tags: s.tags,
  }));
};

const AR_CLOTHES = [
  { id: 'c1', name: '碎花雪纺上衣', category: 'top' as const, image: 'https://images.unsplash.com/photo-1564257671631-2b16ec7744bf?w=200', price: '¥299', color: '粉色' },
  { id: 'c2', name: '简约白T恤', category: 'top' as const, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', price: '¥129', color: '白色' },
  { id: 'c3', name: '高腰阔腿裤', category: 'bottom' as const, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=200', price: '¥399', color: '卡其色' },
  { id: 'c4', name: '牛仔半身裙', category: 'bottom' as const, image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=200', price: '¥259', color: '蓝色' },
  { id: 'c5', name: '优雅碎花连衣裙', category: 'dress' as const, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200', price: '¥599', color: '花色' },
  { id: 'c6', name: '小黑裙礼服', category: 'dress' as const, image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200', price: '¥899', color: '黑色' },
  { id: 'c7', name: '休闲牛仔外套', category: 'coat' as const, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200', price: '¥499', color: '蓝色' },
  { id: 'c8', name: '英伦风风衣', category: 'coat' as const, image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=200', price: '¥1299', color: '卡其色' },
];

const DISHES = [
  { id: 'd1', name: '招牌水煮鱼', price: '¥88', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300', taste: '麻辣鲜香', sales: 2380, desc: '精选鲜活草鱼，配以秘制红油，麻辣鲜香，回味无穷' },
  { id: 'd2', name: '夫妻肺片', price: '¥48', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300', taste: '麻辣爽口', sales: 1560, desc: '经典川菜凉菜，牛肉与牛杂搭配秘制辣酱，开胃爽口' },
  { id: 'd3', name: '麻婆豆腐', price: '¥38', image: 'https://images.unsplash.com/photo-1582576163090-09d3b6f8a969?w=300', taste: '麻辣鲜嫩', sales: 3200, desc: '川菜经典，豆腐嫩滑，麻辣鲜香，下饭神器' },
  { id: 'd4', name: '宫保鸡丁', price: '¥58', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300', taste: '酸甜微辣', sales: 1890, desc: '鸡肉嫩滑，花生酥脆，酸甜微辣，口感丰富' },
  { id: 'd5', name: '回锅肉', price: '¥68', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300', taste: '咸香微辣', sales: 1450, desc: '精选五花肉，配以青蒜爆炒，肥而不腻，香气四溢' },
  { id: 'd6', name: '担担面', price: '¥28', image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=300', taste: '麻辣鲜香', sales: 4200, desc: '四川传统面食，肉末酥香，麻辣味浓，经典美味' },
];

const VR_HOTSPOTS_FULL = [
  { x: 25, y: 40, label: '客厅', desc: '45㎡ 南向采光 · 落地窗', icon: 'Sofa' },
  { x: 60, y: 30, label: '主卧', desc: '18㎡ · 独立卫浴', icon: 'BedDouble' },
  { x: 80, y: 55, label: '次卧', desc: '12㎡ · 北向次卧', icon: 'BedSingle' },
  { x: 15, y: 65, label: '厨房', desc: '10㎡ · U型操作台', icon: 'ChefHat' },
  { x: 45, y: 70, label: '卫生间', desc: '8㎡ · 干湿分离', icon: 'Bath' },
  { x: 70, y: 75, label: '阳台', desc: '6㎡ · 南向阳台', icon: 'Flower2' },
];

export const mockVirtualResources: VirtualResource[] = [
  {
    id: 'vr-1',
    type: 'ar_clothing',
    title: '春夏新款优雅连衣裙',
    thumbnail: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
    resourceUrl: '',
    providerId: 'p-4',
    providerName: '美之约美容SPA',
    price: '¥599',
    tags: ['新品', '显瘦', '通勤', '气质'],
    rating: 4.8,
    experienceCount: 3256,
    favoriteCount: 892,
    reviews: genVrReviews(1),
    distance: 0.8,
    clothes: AR_CLOTHES,
  },
  {
    id: 'vr-2',
    type: 'ar_clothing',
    title: '商务休闲西装外套',
    thumbnail: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    resourceUrl: '',
    providerId: 'p-12',
    providerName: '清雅美容会所',
    price: '¥1299',
    tags: ['商务', '韩版', '修身', '精英'],
    rating: 4.6,
    experienceCount: 1890,
    favoriteCount: 567,
    reviews: genVrReviews(2),
    distance: 1.5,
    clothes: AR_CLOTHES.slice(2),
  },
  {
    id: 'vr-3',
    type: 'ar_clothing',
    title: '夏日清新碎花长裙',
    thumbnail: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600',
    resourceUrl: '',
    providerId: 'p-20',
    providerName: '靓颜美容养生馆',
    price: '¥399',
    tags: ['清新', '显瘦', '度假', '甜美'],
    rating: 4.5,
    experienceCount: 2567,
    favoriteCount: 723,
    reviews: genVrReviews(3),
    distance: 2.1,
    clothes: AR_CLOTHES.slice(0, 6),
  },
  {
    id: 'vr-4',
    type: 'ar_clothing',
    title: '法式复古针织开衫',
    thumbnail: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600',
    resourceUrl: '',
    providerId: 'p-28',
    providerName: '伊人美容美体',
    price: '¥459',
    tags: ['复古', '温柔', '百搭', '慵懒'],
    rating: 4.7,
    experienceCount: 1456,
    favoriteCount: 432,
    reviews: genVrReviews(4),
    distance: 3.2,
    clothes: AR_CLOTHES.slice(4),
  },
  {
    id: 'vr-5',
    type: 'vr_house',
    title: '陆家嘴精装两室一厅',
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    resourceUrl: '',
    providerId: 'p-3',
    providerName: '川香阁私房菜',
    address: '陆家嘴环路1000号',
    price: '¥9800/月',
    tags: ['近地铁', '精装修', '拎包入住', '江景房'],
    rating: 4.9,
    experienceCount: 5621,
    favoriteCount: 1523,
    reviews: genVrReviews(5),
    distance: 2.3,
    vrHotspots: VR_HOTSPOTS_FULL,
  },
  {
    id: 'vr-6',
    type: 'vr_house',
    title: '静安寺电梯三居室',
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    resourceUrl: '',
    providerId: 'p-8',
    providerName: '老上海本帮菜',
    address: '南京西路1266号',
    price: '¥15800/月',
    tags: ['学区房', '电梯房', '南北通', '市中心'],
    rating: 4.7,
    experienceCount: 4328,
    favoriteCount: 1289,
    reviews: genVrReviews(6),
    distance: 3.1,
    vrHotspots: VR_HOTSPOTS_FULL,
  },
  {
    id: 'vr-7',
    type: 'vr_house',
    title: '徐家汇温馨一居室',
    thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    resourceUrl: '',
    providerId: 'p-16',
    providerName: '粤味轩茶餐厅',
    address: '徐家汇路555号',
    price: '¥6800/月',
    tags: ['温馨', '独卫', '近商圈', '朝南'],
    rating: 4.6,
    experienceCount: 3456,
    favoriteCount: 987,
    reviews: genVrReviews(7),
    distance: 1.8,
    vrHotspots: VR_HOTSPOTS_FULL,
  },
  {
    id: 'vr-8',
    type: 'vr_house',
    title: '虹桥商务区精装公寓',
    thumbnail: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800',
    resourceUrl: '',
    providerId: 'p-24',
    providerName: '湘菜馆家常菜',
    address: '虹桥路2000号',
    price: '¥8200/月',
    tags: ['商务', '精装', '交通便利', '新小区'],
    rating: 4.5,
    experienceCount: 2890,
    favoriteCount: 756,
    reviews: genVrReviews(8),
    distance: 4.5,
    vrHotspots: VR_HOTSPOTS_FULL,
  },
  {
    id: 'vr-9',
    type: 'shop_360',
    title: '川香阁·正宗川菜体验',
    thumbnail: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    resourceUrl: '',
    providerId: 'p-3',
    providerName: '川香阁私房菜',
    address: '人民广场227号',
    tags: ['川菜', '网红店', '聚餐', '正宗'],
    rating: 4.5,
    experienceCount: 8932,
    favoriteCount: 2341,
    reviews: genVrReviews(9),
    distance: 0.5,
    dishes: DISHES,
  },
  {
    id: 'vr-10',
    type: 'shop_360',
    title: '老上海本帮菜·怀旧味道',
    thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    resourceUrl: '',
    providerId: 'p-8',
    providerName: '老上海本帮菜',
    address: '南京东路88号',
    tags: ['本帮菜', '老字号', '环境优雅', '家庭聚餐'],
    rating: 4.4,
    experienceCount: 6789,
    favoriteCount: 1876,
    reviews: genVrReviews(10),
    distance: 1.2,
    dishes: DISHES.slice(0, 4),
  },
  {
    id: 'vr-11',
    type: 'shop_360',
    title: '粤味轩·早茶下午茶',
    thumbnail: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
    resourceUrl: '',
    providerId: 'p-16',
    providerName: '粤味轩茶餐厅',
    address: '淮海中路333号',
    tags: ['粤菜', '早茶', '下午茶', '港式'],
    rating: 4.6,
    experienceCount: 7543,
    favoriteCount: 2108,
    reviews: genVrReviews(11),
    distance: 2.0,
    dishes: DISHES.slice(2),
  },
  {
    id: 'vr-12',
    type: 'shop_360',
    title: '清雅美容会所·沉浸式体验',
    thumbnail: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800',
    resourceUrl: '',
    providerId: 'p-12',
    providerName: '清雅美容会所',
    address: '静安寺路168号',
    tags: ['美容', 'SPA', '放松', '高端'],
    rating: 4.8,
    experienceCount: 4567,
    favoriteCount: 1345,
    reviews: genVrReviews(12),
    distance: 1.6,
    dishes: DISHES.slice(0, 3),
  },
];

export const mockStarRules: StarLevelRule[] = [
  { star: 1, orderCount: 50, goodRate: 0.80, responseSpeed: 60, trafficWeight: 0.6, privileges: ['基础流量曝光'] },
  { star: 2, orderCount: 200, goodRate: 0.85, responseSpeed: 45, trafficWeight: 0.8, privileges: ['基础流量曝光', '搜索加权'] },
  { star: 3, orderCount: 500, goodRate: 0.90, responseSpeed: 30, trafficWeight: 1.0, privileges: ['基础流量曝光', '搜索加权', '首页推荐资格'] },
  { star: 4, orderCount: 1000, goodRate: 0.93, responseSpeed: 20, trafficWeight: 1.3, privileges: ['基础流量曝光', '搜索加权', '首页推荐资格', '专属客服', '平台活动优先'] },
  { star: 5, orderCount: 2000, goodRate: 0.96, responseSpeed: 10, trafficWeight: 1.8, privileges: ['基础流量曝光', '搜索加权', '首页推荐资格', '专属客服', '平台活动优先', '品牌标识认证', '最高流量权重'] },
];

export const mockCompensationRules: CompensationRule[] = [
  { type: 'service_quality', typeLabel: '服务质量问题', ratio: '30%-100%', maxAmount: 2000, description: '服务未达标、与描述不符等质量问题，按比例赔偿服务费用' },
  { type: 'delay', typeLabel: '服务延误', ratio: '每小时10%', maxAmount: 500, description: '服务商未按约定时间到达或完成，按延误时长计算赔偿' },
  { type: 'overcharge', typeLabel: '乱收费', ratio: '超额+20%', maxAmount: 1000, description: '未明码标价、额外收费，退还超额部分并补偿20%' },
  { type: 'damage', typeLabel: '物品损坏', ratio: '定损金额', maxAmount: 5000, description: '服务过程中造成用户物品损坏，按定损金额赔偿' },
];

export const mockGrowthMetrics: GrowthMetrics = {
  providerId: 'p-1',
  orderTrend: [
    { date: '1月', value: 42 },
    { date: '2月', value: 58 },
    { date: '3月', value: 75 },
    { date: '4月', value: 92 },
    { date: '5月', value: 118 },
    { date: '6月', value: 145 },
  ],
  rateTrend: [
    { date: '1月', value: 86 },
    { date: '2月', value: 88 },
    { date: '3月', value: 90 },
    { date: '4月', value: 91 },
    { date: '5月', value: 93 },
    { date: '6月', value: 95 },
  ],
  speedTrend: [
    { date: '1月', value: 45 },
    { date: '2月', value: 40 },
    { date: '3月', value: 35 },
    { date: '4月', value: 30 },
    { date: '5月', value: 22 },
    { date: '6月', value: 15 },
  ],
  radar: [
    { dimension: '服务质量', value: 92, fullMark: 100 },
    { dimension: '响应速度', value: 88, fullMark: 100 },
    { dimension: '准时履约', value: 95, fullMark: 100 },
    { dimension: '用户评价', value: 90, fullMark: 100 },
    { dimension: '投诉率', value: 96, fullMark: 100 },
  ],
};

export const mockHistoryOrders = [
  { orderId: 'ORD-2026-0615-001', serviceType: '家电清洗', providerName: '洁净家家政', orderTime: '2026-06-15 10:00', amount: 300 },
  { orderId: 'ORD-2026-0610-008', serviceType: '搬家服务', providerName: '金牌搬家服务', orderTime: '2026-06-10 09:00', amount: 180 },
  { orderId: 'ORD-2026-0605-023', serviceType: '空调维修', providerName: '快修侠家电维修', orderTime: '2026-06-05 14:00', amount: 250 },
  { orderId: 'ORD-2026-0528-015', serviceType: '深度保洁', providerName: '亮洁保洁服务', orderTime: '2026-05-28 08:30', amount: 420 },
  { orderId: 'ORD-2026-0520-007', serviceType: '美容SPA', providerName: '美之约美容SPA', orderTime: '2026-05-20 15:00', amount: 599 },
];

export const mockDisputes: Dispute[] = [
  {
    id: 'd-1',
    orderId: 'ORD-2026-0615-001',
    type: 'service_quality',
    typeLabel: '服务质量问题',
    description: '家电清洗后仍有异味，清洁不彻底，多处污渍未处理。油烟机内部还有明显油渍，空调滤网未清洗。',
    evidences: [
      { id: 'e-1', type: 'image', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400', name: '清洗前后对比.jpg' },
      { id: 'e-2', type: 'image', url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400', name: '残留污渍特写.jpg' },
      { id: 'e-3', type: 'image', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd69?w=400', name: '油烟机内部油渍.jpg' },
    ],
    status: 'reviewing',
    statusLabel: '客服审核中',
    compensationStandard: '服务质量问题 · 赔付比例50%',
    compensationAmount: 150,
    result: '平台客服已介入，正在与服务商沟通核实',
    createdAt: '2026-06-15 14:30',
    csAgent: '客服小王',
    progress: 40,
    orderInfo: {
      orderId: 'ORD-2026-0615-001',
      serviceType: '家电清洗',
      providerName: '洁净家家政',
      orderTime: '2026-06-15 10:00',
      amount: 300,
      disputeAmount: 300,
      claimAmount: 200,
      platformPayout: 150,
    },
    timeline: [
      { label: '提交纠纷', time: '2026-06-15 14:30', done: true, description: '用户提交纠纷申请' },
      { label: '客服介入', time: '2026-06-15 15:00', done: true, description: '客服小王已受理，正在核实' },
      { label: '核实证据', time: '处理中', done: false, description: '平台正在与服务商沟通核实' },
      { label: '仲裁结果', time: '待处理', done: false },
      { label: '赔付完成', time: '待处理', done: false },
    ],
    messages: [
      { id: 'm-1', sender: 'user', senderName: '我', content: '清洗完还是有异味，而且油烟机里面还有油渍，根本没洗干净！', time: '2026-06-15 14:30', avatar: '' },
      { id: 'm-2', sender: 'cs', senderName: '客服小王', content: '您好，非常抱歉给您带来不好的体验。我已受理您的纠纷申请，我们会尽快与服务商核实情况。', time: '2026-06-15 15:00', avatar: '' },
      { id: 'm-3', sender: 'provider', senderName: '洁净家家政', content: '您好，我们的清洗流程都是按照标准执行的。可能是油烟机使用时间较长，部分顽固油渍确实较难清除。我们可以安排师傅上门复洗。', time: '2026-06-15 16:20', avatar: '' },
    ],
    severity: 'normal',
    expectedSolution: 'refund',
  },
  {
    id: 'd-2',
    orderId: 'ORD-2026-0610-008',
    type: 'delay',
    typeLabel: '服务延误',
    description: '约定上午9点到家，结果下午2点才到，延误5小时。当天还有家具搬运也有划痕。',
    evidences: [
      { id: 'e-4', type: 'image', url: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400', name: '聊天记录截图.png' },
      { id: 'e-5', type: 'image', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', name: '家具划痕.jpg' },
    ],
    status: 'resolved',
    statusLabel: '已完成仲裁',
    compensationStandard: '服务延误 · 每小时10%，共计50%',
    compensationAmount: 90,
    result: '已按标准赔付 ¥90，款项1-3个工作日到账',
    createdAt: '2026-06-10 10:15',
    csAgent: '客服小李',
    progress: 100,
    orderInfo: {
      orderId: 'ORD-2026-0610-008',
      serviceType: '搬家服务',
      providerName: '金牌搬家服务',
      orderTime: '2026-06-10 09:00',
      amount: 180,
      disputeAmount: 180,
      claimAmount: 100,
      platformPayout: 90,
    },
    timeline: [
      { label: '提交纠纷', time: '2026-06-10 10:15', done: true, description: '用户提交纠纷申请' },
      { label: '客服介入', time: '2026-06-10 10:45', done: true, description: '客服小李已受理' },
      { label: '核实证据', time: '2026-06-10 14:30', done: true, description: '服务商确认延误事实' },
      { label: '仲裁结果', time: '2026-06-10 16:00', done: true, description: '判定赔付50%服务费用' },
      { label: '赔付完成', time: '2026-06-11 09:00', done: true, description: '¥90已赔付至账户' },
    ],
    messages: [
      { id: 'm-4', sender: 'user', senderName: '我', content: '说好9点到，现在都11点了还没来！', time: '2026-06-10 11:00', avatar: '' },
      { id: 'm-5', sender: 'cs', senderName: '客服小李', content: '非常抱歉，我马上联系服务商确认情况。', time: '2026-06-10 11:05', avatar: '' },
      { id: 'm-6', sender: 'provider', senderName: '金牌搬家服务', content: '实在不好意思，今天路上堵车严重，我们已经在赶过来的路上了。', time: '2026-06-10 11:20', avatar: '' },
      { id: 'm-7', sender: 'cs', senderName: '客服小李', content: '您好，经过核实，服务商确实延误了5小时。根据平台规则，将赔付您50%的服务费用共计¥90，款项会在1-3个工作日内到账。', time: '2026-06-10 16:00', avatar: '' },
      { id: 'm-8', sender: 'user', senderName: '我', content: '好的，谢谢处理。', time: '2026-06-10 16:30', avatar: '' },
    ],
    severity: 'serious',
    expectedSolution: 'compensation',
    payoutTime: '2026-06-11 09:00',
  },
  {
    id: 'd-3',
    orderId: 'ORD-2026-0605-023',
    type: 'overcharge',
    typeLabel: '乱收费',
    description: '报价250元，上门后说配件要额外加100元，未提前说明。',
    evidences: [
      { id: 'e-6', type: 'image', url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400', name: '支付凭证.jpg' },
    ],
    status: 'submitted',
    statusLabel: '已提交待审核',
    compensationStandard: '等待平台匹配',
    compensationAmount: 0,
    result: '平台客服将在24小时内联系您',
    createdAt: '2026-06-16 09:00',
    progress: 10,
    orderInfo: {
      orderId: 'ORD-2026-0605-023',
      serviceType: '空调维修',
      providerName: '快修侠家电维修',
      orderTime: '2026-06-05 14:00',
      amount: 350,
      disputeAmount: 100,
      claimAmount: 120,
      platformPayout: 0,
    },
    timeline: [
      { label: '提交纠纷', time: '2026-06-16 09:00', done: true, description: '用户提交纠纷申请' },
      { label: '客服介入', time: '待处理', done: false },
      { label: '核实证据', time: '待处理', done: false },
      { label: '仲裁结果', time: '待处理', done: false },
      { label: '赔付完成', time: '待处理', done: false },
    ],
    messages: [
      { id: 'm-9', sender: 'user', senderName: '我', content: '明明报价250，上门后说配件要加钱，这不是乱收费吗！', time: '2026-06-16 09:00', avatar: '' },
    ],
    severity: 'serious',
    expectedSolution: 'refund',
  },
];

export const CITIES = ['上海市', '北京市', '广州市', '深圳市', '杭州市', '成都市', '武汉市', '南京市'];

export const CURRENT_CITY = '上海市';
export const CURRENT_LOCATION = CITY_CENTER;
export const CURRENT_GRID_CODE = 'G0303';

export const getProviderAchievements = (providerId: string): AchievementBadge[] => {
  const p = mockProviders.find((x) => x.id === providerId);
  if (!p) return [];
  const allBadges: AchievementBadge[] = [
    { id: 'first-order', name: '首单达人', description: '完成第一笔订单', condition: '完成1单', icon: 'Rocket', unlocked: p.orderCount >= 1, unlockedDate: '2025-03-15', progress: p.orderCount >= 1 ? 100 : p.orderCount * 100 },
    { id: 'ten-order', name: '十单新星', description: '累计完成10单', condition: '完成10单', icon: 'TrendingUp', unlocked: p.orderCount >= 10, progress: Math.min(100, (p.orderCount / 10) * 100) },
    { id: 'hundred-order', name: '百单王者', description: '累计完成100单', condition: '完成100单', icon: 'Crown', unlocked: p.orderCount >= 100, progress: Math.min(100, (p.orderCount / 100) * 100) },
    { id: 'thousand-order', name: '千单传奇', description: '累计完成1000单', condition: '完成1000单', icon: 'Award', unlocked: p.orderCount >= 1000, progress: Math.min(100, (p.orderCount / 1000) * 100) },
    { id: 'good-rate', name: '好评如潮', description: '好评率达到95%以上', condition: '好评率≥95%', icon: 'ThumbsUp', unlocked: p.goodRate >= 0.95, progress: Math.min(100, (p.goodRate / 0.95) * 100) },
    { id: 'fast-response', name: '闪电响应', description: '平均响应时间低于10分钟', condition: '响应≤10分钟', icon: 'Zap', unlocked: p.responseSpeed <= 10, progress: Math.min(100, ((60 - p.responseSpeed) / 50) * 100) },
    { id: 'monthly-star', name: '月度之星', description: '入选月度优秀服务商', condition: '月度排名前10', icon: 'Star', unlocked: p.starLevel >= 4, progress: Math.min(100, (p.starLevel / 5) * 100) },
    { id: 'zero-complaint', name: '零投诉标兵', description: '连续30天零投诉', condition: '连续30天无投诉', icon: 'Shield', unlocked: p.starLevel >= 3, progress: Math.min(100, (p.starLevel / 4) * 100) },
  ];
  return allBadges;
};

export const getProviderGrowthMetrics = (providerId: string): GrowthMetrics => {
  const p = mockProviders.find((x) => x.id === providerId);
  if (!p) return mockGrowthMetrics;
  const seed = parseInt(providerId.replace('p-', ''));
  const orderBase = 30 + seed * 8;
  const rateBase = 82 + (seed % 10);
  const speedBase = 50 - seed * 2;
  return {
    providerId,
    orderTrend: [
      { date: '1月', value: Math.round(orderBase * 0.6) },
      { date: '2月', value: Math.round(orderBase * 0.75) },
      { date: '3月', value: Math.round(orderBase * 0.9) },
      { date: '4月', value: Math.round(orderBase * 1.05) },
      { date: '5月', value: Math.round(orderBase * 1.2) },
      { date: '6月', value: Math.round(orderBase * 1.4) },
    ],
    rateTrend: [
      { date: '1月', value: Math.min(99, rateBase) },
      { date: '2月', value: Math.min(99, rateBase + 1) },
      { date: '3月', value: Math.min(99, rateBase + 2) },
      { date: '4月', value: Math.min(99, rateBase + 3) },
      { date: '5月', value: Math.min(99, rateBase + 4) },
      { date: '6月', value: Math.min(99, rateBase + 5) },
    ],
    speedTrend: [
      { date: '1月', value: Math.max(5, speedBase) },
      { date: '2月', value: Math.max(5, speedBase - 2) },
      { date: '3月', value: Math.max(5, speedBase - 5) },
      { date: '4月', value: Math.max(5, speedBase - 8) },
      { date: '5月', value: Math.max(5, speedBase - 10) },
      { date: '6月', value: Math.max(5, speedBase - 12) },
    ],
    radar: [
      { dimension: '服务质量', value: Math.min(100, 75 + seed * 3), fullMark: 100 },
      { dimension: '响应速度', value: Math.min(100, 70 + seed * 4), fullMark: 100 },
      { dimension: '准时履约', value: Math.min(100, 80 + seed * 2), fullMark: 100 },
      { dimension: '用户评价', value: Math.min(100, 72 + seed * 3), fullMark: 100 },
      { dimension: '投诉率', value: Math.min(100, 78 + seed * 3), fullMark: 100 },
    ],
  };
};

export const getProviderCategoryRank = (providerId: string): { rank: number; total: number; category: string } => {
  const p = mockProviders.find((x) => x.id === providerId);
  if (!p) return { rank: 1, total: 10, category: '家政' };
  const sameCat = mockProviders.filter((x) => x.category === p.category);
  const sorted = [...sameCat].sort((a, b) => b.starLevel - a.starLevel || b.orderCount - a.orderCount);
  const rank = sorted.findIndex((x) => x.id === providerId) + 1;
  return { rank, total: sameCat.length, category: p.category };
};
