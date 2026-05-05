import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  const cities = [
    { id: uuidv4(), name: '北京', nameEn: 'Beijing', country: '中国', province: '北京市', pinyin: 'beijing', isHot: true, isDomestic: true, lat: 39.9042, lng: 116.4074, sort: 1 },
    { id: uuidv4(), name: '上海', nameEn: 'Shanghai', country: '中国', province: '上海市', pinyin: 'shanghai', isHot: true, isDomestic: true, lat: 31.2304, lng: 121.4737, sort: 2 },
    { id: uuidv4(), name: '杭州', nameEn: 'Hangzhou', country: '中国', province: '浙江省', pinyin: 'hangzhou', isHot: true, isDomestic: true, lat: 30.2741, lng: 120.1551, sort: 3 },
    { id: uuidv4(), name: '成都', nameEn: 'Chengdu', country: '中国', province: '四川省', pinyin: 'chengdu', isHot: true, isDomestic: true, lat: 30.5728, lng: 104.0668, sort: 4 },
    { id: uuidv4(), name: '厦门', nameEn: 'Xiamen', country: '中国', province: '福建省', pinyin: 'xiamen', isHot: true, isDomestic: true, lat: 24.4798, lng: 118.0894, sort: 5 },
    { id: uuidv4(), name: '三亚', nameEn: 'Sanya', country: '中国', province: '海南省', pinyin: 'sanya', isHot: true, isDomestic: true, lat: 18.2528, lng: 109.5119, sort: 6 },
    { id: uuidv4(), name: '西安', nameEn: "Xi'an", country: '中国', province: '陕西省', pinyin: 'xian', isHot: true, isDomestic: true, lat: 34.3416, lng: 108.9398, sort: 7 },
    { id: uuidv4(), name: '重庆', nameEn: 'Chongqing', country: '中国', province: '重庆市', pinyin: 'chongqing', isHot: true, isDomestic: true, lat: 29.4316, lng: 106.9123, sort: 8 },
    { id: uuidv4(), name: '苏州', nameEn: 'Suzhou', country: '中国', province: '江苏省', pinyin: 'suzhou', isHot: false, isDomestic: true, lat: 31.2990, lng: 120.5853, sort: 9 },
    { id: uuidv4(), name: '南京', nameEn: 'Nanjing', country: '中国', province: '江苏省', pinyin: 'nanjing', isHot: false, isDomestic: true, lat: 32.0603, lng: 118.7969, sort: 10 },
    { id: uuidv4(), name: '东京', nameEn: 'Tokyo', country: '日本', province: null, pinyin: 'dongjing', isHot: true, isDomestic: false, lat: 35.6762, lng: 139.6503, sort: 11 },
    { id: uuidv4(), name: '曼谷', nameEn: 'Bangkok', country: '泰国', province: null, pinyin: 'mangu', isHot: true, isDomestic: false, lat: 13.7563, lng: 100.5018, sort: 12 },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { id: city.id },
      update: city,
      create: city,
    });
  }
  console.log('城市数据初始化完成');

  const hostUserId = uuidv4();
  const hostPassword = await bcrypt.hash('123456', 10);
  
  const hostUser = await prisma.user.upsert({
    where: { phone: '13900139001' },
    update: {},
    create: {
      id: hostUserId,
      phone: '13900139001',
      password: hostPassword,
      nickname: '房东老王',
      avatar: null,
      role: 'HOST',
    },
  });

  const hostId = uuidv4();
  await prisma.host.upsert({
    where: { id: hostId },
    update: {},
    create: {
      id: hostId,
      userId: hostUser.id,
      realName: '王建国',
      idCard: '110101199001011234',
      verifyStatus: true,
      intro: '我是一个热情好客的房东，已经经营民宿5年了。我的房子都经过精心布置，希望给每一位客人带来家的感觉。',
      responseRate: 98.5,
      responseTime: 10,
    },
  });
  console.log('房东数据初始化完成');

  const beijing = cities.find(c => c.name === '北京')!;
  const shanghai = cities.find(c => c.name === '上海')!;
  const hangzhou = cities.find(c => c.name === '杭州')!;
  const chengdu = cities.find(c => c.name === '成都')!;

  const properties = [
    {
      id: uuidv4(),
      title: '【故宫旁】南锣鼓巷胡同里的温馨一居室',
      subtitle: '步行到南锣鼓巷5分钟，感受老北京风情',
      type: 'APARTMENT',
      typeLabel: '公寓',
      cityId: beijing.id,
      address: '北京市东城区南锣鼓巷胡同123号',
      lat: 39.9420,
      lng: 116.4070,
      bedrooms: 1,
      beds: 1,
      baths: 1,
      maxGuests: 2,
      area: 45,
      pricePerNight: 388,
      cleaningFee: 50,
      serviceFee: 30,
      deposit: 200,
      intro: '这套房子位于北京著名的南锣鼓巷胡同区，周围环境安静，生活便利。步行5分钟即可到达南锣鼓巷地铁站，交通十分便捷。房屋装修温馨舒适，配备齐全的家电和日用品，让您有宾至如归的感觉。',
      facilities: JSON.stringify(['WiFi', '空调', '暖气', '洗衣机', '厨房', '电视', '热水器', '吹风机']),
      houseRules: JSON.stringify(['禁止吸烟', '禁止宠物', '禁止派对', '退房时间：12:00前', '入住时间：14:00后']),
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20cozy%20apartment%20interior%20with%20natural%20light%20near%20Forbidden%20City%20Beijing&image_size=square_hd',
      images: JSON.stringify([
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20cozy%20apartment%20living%20room%20Beijing&image_size=square_hd',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20bedroom%20with%20double%20bed&image_size=square_hd',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20kitchen%20with%20appliances&image_size=square_hd',
      ]),
      hostId: hostId,
      isActive: true,
      viewCount: 12580,
      likeCount: 856,
      rating: 4.9,
      reviewCount: 234,
    },
    {
      id: uuidv4(),
      title: '外滩全景落地窗豪华公寓',
      subtitle: '直面东方明珠，270度江景视野',
      type: 'APARTMENT',
      typeLabel: '公寓',
      cityId: shanghai.id,
      address: '上海市黄浦区外滩中心公寓',
      lat: 31.2397,
      lng: 121.4998,
      bedrooms: 2,
      beds: 2,
      baths: 2,
      maxGuests: 4,
      area: 120,
      pricePerNight: 888,
      cleaningFee: 100,
      serviceFee: 80,
      deposit: 1000,
      intro: '位于上海最繁华的外滩区域，这套豪华公寓拥有270度超大落地窗，可以欣赏到东方明珠、陆家嘴天际线和黄浦江的绝美夜景。房间装修现代奢华，配备智能家居系统和高端家电。',
      facilities: JSON.stringify(['WiFi', '空调', '洗衣机', '烘干机', '厨房', '智能电视', '热水器', '浴缸', '咖啡机', '保险箱']),
      houseRules: JSON.stringify(['禁止吸烟', '禁止宠物', '禁止派对', '退房时间：11:00前', '入住时间：15:00后']),
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20apartment%20with%20panoramic%20view%20of%20Shanghai%20Bund&image_size=square_hd',
      images: JSON.stringify([
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20luxury%20living%20room%20Shanghai&image_size=square_hd',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=master%20bedroom%20with%20river%20view&image_size=square_hd',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20bathroom%20with%20bathtub&image_size=square_hd',
      ]),
      hostId: hostId,
      isActive: true,
      viewCount: 25680,
      likeCount: 1890,
      rating: 4.95,
      reviewCount: 567,
    },
    {
      id: uuidv4(),
      title: '西湖边日式禅意民宿',
      subtitle: '雷峰塔下，茶香满溢的幽静小院',
      type: 'HOUSE',
      typeLabel: '独栋',
      cityId: hangzhou.id,
      address: '杭州市西湖区虎跑路88号',
      lat: 30.2310,
      lng: 120.1430,
      bedrooms: 3,
      beds: 4,
      baths: 2,
      maxGuests: 6,
      area: 180,
      pricePerNight: 1288,
      cleaningFee: 150,
      serviceFee: 100,
      deposit: 1500,
      intro: '这套民宿位于西湖风景区，距离雷峰塔仅几步之遥。小院种满了茶树和翠竹，环境清幽雅致。房屋采用日式禅意风格装修，配备茶室和冥想空间，是远离城市喧嚣、静心修养的绝佳选择。',
      facilities: JSON.stringify(['WiFi', '空调', '暖气', '洗衣机', '厨房', '茶室', '日式庭院', '茶具', '香薰', '瑜伽垫']),
      houseRules: JSON.stringify(['保持安静', '禁止吸烟（庭院除外）', '可以带宠物（需提前告知）', '退房时间：12:00前', '入住时间：14:00后']),
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Japanese%20style%20courtyard%20house%20near%20West%20Lake%20Hangzhou&image_size=square_hd',
      images: JSON.stringify([
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20Japanese%20tea%20room&image_size=square_hd',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=peaceful%20garden%20with%20bamboo&image_size=square_hd',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=zen%20style%20bedroom&image_size=square_hd',
      ]),
      hostId: hostId,
      isActive: true,
      viewCount: 18920,
      likeCount: 1230,
      rating: 4.88,
      reviewCount: 345,
    },
    {
      id: uuidv4(),
      title: '成都宽窄巷子旁文艺loft',
      subtitle: '老成都风情与现代艺术的完美融合',
      type: 'LOFT',
      typeLabel: 'LOFT',
      cityId: chengdu.id,
      address: '成都市青羊区宽窄巷子旁',
      lat: 30.6636,
      lng: 104.0492,
      bedrooms: 1,
      beds: 2,
      baths: 1,
      maxGuests: 3,
      area: 65,
      pricePerNight: 298,
      cleaningFee: 40,
      serviceFee: 25,
      deposit: 300,
      intro: '这套LOFT位于成都最具特色的宽窄巷子旁边，楼下就是繁华的商业街和美食街。房子层高4.5米，采用工业风设计，充满文艺气息。夜晚可以在露台上喝着小酒，感受成都的悠闲生活。',
      facilities: JSON.stringify(['WiFi', '空调', '洗衣机', '投影仪', '音响', '小吧台', '露台', '咖啡机']),
      houseRules: JSON.stringify(['禁止吸烟', '禁止宠物', '深夜保持安静', '退房时间：12:00前', '入住时间：14:00后']),
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20style%20loft%20apartment%20Chengdu&image_size=square_hd',
      images: JSON.stringify([
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20loft%20mezzanine%20bedroom&image_size=square_hd',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rooftop%20terrace%20with%20city%20view&image_size=square_hd',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20open%20kitchen&image_size=square_hd',
      ]),
      hostId: hostId,
      isActive: true,
      viewCount: 9850,
      likeCount: 678,
      rating: 4.82,
      reviewCount: 189,
    },
  ];

  for (const prop of properties) {
    await prisma.property.upsert({
      where: { id: prop.id },
      update: prop,
      create: prop,
    });

    for (let i = 0; i < 90; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      await prisma.availability.upsert({
        where: { propertyId_date: { propertyId: prop.id, date } },
        update: { isAvailable: Math.random() > 0.2 },
        create: {
          id: uuidv4(),
          propertyId: prop.id,
          date,
          isAvailable: Math.random() > 0.2,
          price: prop.pricePerNight + Math.floor(Math.random() * 100) - 50,
        },
      });
    }
  }
  console.log('房源和房态数据初始化完成');

  const banners = [
    {
      id: uuidv4(),
      title: '新春特惠季',
      subtitle: '精选民宿低至5折起',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20New%20Year%20travel%20promotion%20banner&image_size=landscape_16_9',
      link: '/search?keyword=新春特惠',
      linkType: 'search',
      sort: 1,
    },
    {
      id: uuidv4(),
      title: '海岛蜜月之旅',
      subtitle: '三亚精选海景民宿限时优惠',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tropical%20island%20beach%20resort%20banner&image_size=landscape_16_9',
      link: '/search?cityId=sanya',
      linkType: 'city',
      sort: 2,
    },
    {
      id: uuidv4(),
      title: '周末逃离城市',
      subtitle: '周边热门城市民宿推荐',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=weekend%20getaway%20travel%20banner&image_size=landscape_16_9',
      link: '/search?keyword=周末游',
      linkType: 'search',
      sort: 3,
    },
  ];

  for (const banner of banners) {
    await prisma.banner.upsert({
      where: { id: banner.id },
      update: banner,
      create: banner,
    });
  }
  console.log('Banner数据初始化完成');

  const topics = [
    { id: uuidv4(), title: '情侣约会', subtitle: '浪漫满屋', icon: '❤️', sort: 1 },
    { id: uuidv4(), title: '亲子出游', subtitle: '欢乐时光', icon: '👨‍👩‍👧', sort: 2 },
    { id: uuidv4(), title: '商务出行', subtitle: '高效便捷', icon: '💼', sort: 3 },
    { id: uuidv4(), title: '闺蜜聚会', subtitle: '温馨时光', icon: '👭', sort: 4 },
    { id: uuidv4(), title: '独自旅行', subtitle: '探索世界', icon: '🎒', sort: 5 },
    { id: uuidv4(), title: '全家度假', subtitle: '天伦之乐', icon: '👨‍👩‍👧‍👦', sort: 6 },
  ];

  for (const topic of topics) {
    await prisma.activityTopic.upsert({
      where: { id: topic.id },
      update: topic,
      create: topic,
    });
  }
  console.log('出行专题数据初始化完成');

  const guestPassword = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      id: uuidv4(),
      phone: '13800138000',
      password: guestPassword,
      nickname: '测试用户',
      avatar: null,
      role: 'GUEST',
    },
  });
  console.log('测试用户初始化完成');

  console.log('\n=======================');
  console.log('数据库初始化完成！');
  console.log('测试账号：13800138000 / 123456');
  console.log('房东账号：13900139001 / 123456');
  console.log('=======================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
