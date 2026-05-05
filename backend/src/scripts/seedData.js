const { sequelize, User, House, Coupon, UserCoupon } = require('../models');
require('dotenv').config({ path: '../../../.env' });

const sampleHouses = [
  {
    title: '北欧风格精装两居室 近地铁 适合家庭入住',
    description: '这是一套精心设计的北欧风格公寓，位于市中心黄金地段，交通便利，周边配套设施完善。房间采光充足，装修精美，配备高品质家具和家电，让您享受舒适的住宿体验。',
    type: 'apartment',
    city: '北京',
    district: '朝阳区',
    address: '北京市朝阳区建国路88号SOHO现代城',
    longitude: 116.4734,
    latitude: 39.9174,
    rooms: 2,
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    area: 85.5,
    pricePerNight: 398,
    cleaningFee: 50,
    securityDeposit: 500,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
    ],
    amenities: ['wifi', 'air-conditioning', 'heating', 'kitchen', 'washing-machine', 'refrigerator', 'tv'],
    houseRules: '禁止吸烟，禁止举办派对，晚上10点后请保持安静',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    minNights: 1,
    maxNights: 30,
    isInstantBook: true,
    rating: 4.85,
    reviewCount: 126,
    favoriteCount: 342,
    viewCount: 2856,
    status: 'published',
    tags: ['地铁房', '家庭房', '市中心', '精装'],
    nearbyAttractions: ['天安门广场', '故宫博物院', '王府井步行街']
  },
  {
    title: '豪华海景公寓 270度海景阳台 浪漫首选',
    description: '坐落于海边的豪华公寓，独享270度无敌海景。超大阳台配备休闲桌椅，清晨可看日出，傍晚可赏晚霞。室内装修奢华，配备智能家居系统，让您的住宿体验更加便捷舒适。',
    type: 'apartment',
    city: '三亚',
    district: '海棠湾',
    address: '三亚市海棠湾龙海路1号',
    longitude: 109.7549,
    latitude: 18.3212,
    rooms: 1,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    area: 68.0,
    pricePerNight: 688,
    cleaningFee: 80,
    securityDeposit: 1000,
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      'https://images.unsplash.com/photo-1596323578887-d34cbea4f300?w=800',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800'
    ],
    amenities: ['wifi', 'air-conditioning', 'kitchen', 'washing-machine', 'refrigerator', 'tv', 'pool', 'balcony', 'sea-view'],
    houseRules: '禁止吸烟，禁止携带宠物，入住需出示身份证',
    checkInTime: '15:00',
    checkOutTime: '12:00',
    minNights: 2,
    maxNights: 60,
    isInstantBook: true,
    rating: 4.92,
    reviewCount: 89,
    favoriteCount: 567,
    viewCount: 3421,
    status: 'published',
    tags: ['海景房', '豪华', '浪漫', '度假'],
    nearbyAttractions: ['蜈支洲岛', '亚龙湾热带天堂森林公园', '海棠湾免税城']
  },
  {
    title: '日式禅意榻榻米民宿 体验传统日式生活',
    description: '位于老城区的日式民宿，保留了传统日式建筑风格。榻榻米房间配备正宗日式茶具，可体验茶道文化。庭院设有小池塘和锦鲤，让您在喧嚣的城市中感受宁静。',
    type: 'house',
    city: '杭州',
    district: '西湖区',
    address: '杭州市西湖区龙井路88号',
    longitude: 120.1283,
    latitude: 30.2394,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    area: 120.0,
    pricePerNight: 528,
    cleaningFee: 60,
    securityDeposit: 800,
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800'
    ],
    amenities: ['wifi', 'heating', 'kitchen', 'tea-set', 'garden', 'free-parking'],
    houseRules: '进入室内请脱鞋，保持安静，禁止大声喧哗',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    minNights: 1,
    maxNights: 14,
    isInstantBook: false,
    rating: 4.95,
    reviewCount: 234,
    favoriteCount: 892,
    viewCount: 5678,
    status: 'published',
    tags: ['日式', '禅意', '民宿', '西湖'],
    nearbyAttractions: ['西湖', '灵隐寺', '龙井茶园']
  },
  {
    title: 'LOFT复式公寓 工业风设计 适合年轻人',
    description: '独具特色的工业风LOFT公寓，高挑空设计，空间感十足。保留了原始的砖墙和管道元素，搭配现代家具，形成独特的视觉风格。位于创意园区内，周边有众多咖啡馆和艺术画廊。',
    type: 'loft',
    city: '上海',
    district: '静安区',
    address: '上海市静安区南京西路1788号',
    longitude: 121.4375,
    latitude: 31.2304,
    rooms: 1,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    area: 55.0,
    pricePerNight: 458,
    cleaningFee: 40,
    securityDeposit: 600,
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
      'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'
    ],
    amenities: ['wifi', 'air-conditioning', 'kitchen', 'washing-machine', 'tv', 'workspace'],
    houseRules: '禁止吸烟，禁止携带宠物',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    minNights: 1,
    maxNights: 30,
    isInstantBook: true,
    rating: 4.78,
    reviewCount: 156,
    favoriteCount: 423,
    viewCount: 2987,
    status: 'published',
    tags: ['LOFT', '工业风', '创意园区', '市中心'],
    nearbyAttractions: ['南京西路', '静安寺', '上海展览中心']
  },
  {
    title: '温馨一居室 近迪士尼 适合亲子游',
    description: '位于迪士尼度假区附近的温馨公寓，交通便利，车程仅需15分钟即可到达迪士尼乐园。房间布置温馨可爱，配备儿童玩具和绘本，特别适合带孩子的家庭入住。',
    type: 'studio',
    city: '上海',
    district: '浦东新区',
    address: '上海市浦东新区川沙路5558号',
    longitude: 121.6927,
    latitude: 31.1904,
    rooms: 1,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 3,
    area: 45.0,
    pricePerNight: 288,
    cleaningFee: 30,
    securityDeposit: 300,
    images: [
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800'
    ],
    amenities: ['wifi', 'air-conditioning', 'kitchen', 'washing-machine', 'refrigerator', 'tv', 'toys', 'books'],
    houseRules: '禁止吸烟，欢迎带孩子入住',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    minNights: 1,
    maxNights: 14,
    isInstantBook: true,
    rating: 4.82,
    reviewCount: 312,
    favoriteCount: 678,
    viewCount: 4567,
    status: 'published',
    tags: ['迪士尼', '亲子', '温馨', '性价比高'],
    nearbyAttractions: ['上海迪士尼乐园', '迪士尼小镇', '星愿公园']
  },
  {
    title: '独栋别墅 带花园泳池 适合团建聚会',
    description: '豪华独栋别墅，配备私人花园和游泳池。5间宽敞卧室，可容纳最多12人同时入住。客厅挑高设计，开放式厨房，适合家庭聚会、朋友团建。花园可烧烤，泳池全年开放。',
    type: 'villa',
    city: '广州',
    district: '番禺区',
    address: '广州市番禺区汉溪大道东388号',
    longitude: 113.3893,
    latitude: 23.0118,
    rooms: 5,
    bedrooms: 5,
    bathrooms: 3,
    maxGuests: 12,
    area: 380.0,
    pricePerNight: 1888,
    cleaningFee: 200,
    securityDeposit: 3000,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
    ],
    amenities: ['wifi', 'air-conditioning', 'heating', 'kitchen', 'washing-machine', 'refrigerator', 'tv', 'pool', 'garden', 'bbq-grill', 'free-parking'],
    houseRules: '晚上11点后请保持安静，禁止扰民。使用泳池请注意安全。',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    minNights: 2,
    maxNights: 30,
    isInstantBook: false,
    rating: 4.90,
    reviewCount: 78,
    favoriteCount: 234,
    viewCount: 1890,
    status: 'published',
    tags: ['别墅', '泳池', '花园', '团建', '聚会'],
    nearbyAttractions: ['长隆欢乐世界', '长隆野生动物世界', '广州南站']
  }
];

const sampleCoupons = [
  {
    code: 'NEWUSER100',
    name: '新用户专享优惠券',
    description: '新用户首单立减100元',
    type: 'fixed',
    discountValue: 100,
    minOrderAmount: 500,
    maxDiscountAmount: 100,
    totalQuantity: 1000,
    usedQuantity: 0,
    perUserLimit: 1,
    startTime: new Date(),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    applicableHouseTypes: [],
    applicableCities: [],
    isPartnerCoupon: false,
    status: 'active'
  },
  {
    code: 'SUMMER20',
    name: '夏季特惠券',
    description: '全场8折优惠，最高减免200元',
    type: 'discount',
    discountPercentage: 20,
    minOrderAmount: 0,
    maxDiscountAmount: 200,
    totalQuantity: 5000,
    usedQuantity: 0,
    perUserLimit: 2,
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    applicableHouseTypes: [],
    applicableCities: [],
    isPartnerCoupon: false,
    status: 'active'
  },
  {
    code: 'FLY50',
    name: '飞猪合作优惠券',
    description: '飞猪用户专属立减50元',
    type: 'fixed',
    discountValue: 50,
    minOrderAmount: 300,
    maxDiscountAmount: 50,
    totalQuantity: 2000,
    usedQuantity: 0,
    perUserLimit: 1,
    startTime: new Date(),
    endTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    applicableHouseTypes: [],
    applicableCities: [],
    isPartnerCoupon: true,
    partnerName: '飞猪',
    status: 'active'
  }
];

const seedData = async () => {
  try {
    console.log('开始填充测试数据...');

    const existingUsers = await User.findAll();
    if (existingUsers.length > 0) {
      console.log('数据库已存在数据，跳过填充');
      return;
    }

    const testUser = await User.create({
      phone: '13800138000',
      password: '123456',
      nickname: '测试用户',
      role: 'user',
      isVerified: true
    });

    const testLandlord = await User.create({
      phone: '13900139000',
      password: '123456',
      nickname: '房东小王',
      role: 'landlord',
      isVerified: true,
      realName: '王小明',
      idCard: '110101199001011234'
    });

    for (const houseData of sampleHouses) {
      await House.create({
        ...houseData,
        landlordId: testLandlord.id
      });
    }

    for (const couponData of sampleCoupons) {
      const coupon = await Coupon.create(couponData);
      
      await UserCoupon.create({
        userId: testUser.id,
        couponId: coupon.id,
        status: 'available'
      });
    }

    console.log('\n========================================');
    console.log('  测试数据填充完成!');
    console.log('  测试用户账号:');
    console.log('    普通用户: 13800138000 / 123456');
    console.log('    房东用户: 13900139000 / 123456');
    console.log(`  已创建 ${sampleHouses.length} 套测试房源`);
    console.log(`  已创建 ${sampleCoupons.length} 张测试优惠券`);
    console.log('========================================\n');

  } catch (error) {
    console.error('填充测试数据失败:', error);
    throw error;
  }
};

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    await seedData();

    process.exit(0);
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedData;
