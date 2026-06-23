import bcrypt from 'bcrypt';
import { db, generateId } from './init';

export interface MockCity {
  id: string;
  name: string;
  province: string;
}

export interface MockCategory {
  code: string;
  name: string;
  icon: string;
  color: string;
  guidelines: string;
  misconceptions: string;
}

export interface MockItem {
  name: string;
  aliases: string[];
  categoryCode: string;
  requirements?: string;
  misconceptions?: string;
}

export interface MockAdmin {
  username: string;
  password: string;
  role: 'district_admin' | 'municipal_admin';
  cityId: string;
  district: string | null;
}

export interface MockStreet {
  district: string;
  name: string;
}

export const defaultCities: MockCity[] = [
  { id: 'shanghai', name: '上海市', province: '上海市' },
  { id: 'beijing', name: '北京市', province: '北京市' },
  { id: 'guangzhou', name: '广州市', province: '广东省' },
  { id: 'shenzhen', name: '深圳市', province: '广东省' },
];

export const baseCategories: MockCategory[] = [
  {
    code: 'recyclable',
    name: '可回收物',
    icon: '♻️',
    color: '#0ea5e9',
    guidelines: '轻投轻放，清洁干燥，避免污染；废纸尽量平整；立体包装物请清空内容物，清洁后压扁投放；有尖锐边角的，应包裹后投放。',
    misconceptions: '纸巾和卫生纸由于水溶性太强不可回收；一次性塑料袋、保鲜膜属于其他垃圾。'
  },
  {
    code: 'harmful',
    name: '有害垃圾',
    icon: '☠️',
    color: '#ef4444',
    guidelines: '投放时请注意轻放；易破损的请连带包装或包裹后轻放；如易挥发，请密封后投放。',
    misconceptions: '普通干电池（碱性电池）已达到低汞或无汞标准，属于其他垃圾；纽扣电池、充电电池、锂电池才是有害垃圾。'
  },
  {
    code: 'kitchen',
    name: '厨余垃圾',
    icon: '🍎',
    color: '#22c55e',
    guidelines: '纯流质的食物垃圾，如牛奶等，应直接倒进下水口；有包装物的厨余垃圾应将包装物去除后分类投放，包装物请投放到对应的可回收物或其他垃圾容器。',
    misconceptions: '大骨头、椰子壳、榴莲壳等难以腐烂的硬壳属于其他垃圾；厨余垃圾要沥干水分，去除塑料袋。'
  },
  {
    code: 'other',
    name: '其他垃圾',
    icon: '🗑️',
    color: '#6b7280',
    guidelines: '尽量沥干水分；难以辨识类别的生活垃圾投入其他垃圾容器内。',
    misconceptions: '尿不湿、烟蒂、陶瓷制品、普通一次性电池都属于其他垃圾。'
  }
];

export const defaultItems: MockItem[] = [
  { name: '矿泉水瓶', aliases: ['塑料瓶', 'PET瓶'], categoryCode: 'recyclable', requirements: '请清空残留液体并压扁后投放' },
  { name: '报纸', aliases: ['旧报纸', '废报纸'], categoryCode: 'recyclable', requirements: '请叠放整齐，避免浸湿' },
  { name: '易拉罐', aliases: ['铝罐', '金属罐'], categoryCode: 'recyclable', requirements: '请清空内容物并压扁后投放' },
  { name: '废电池', aliases: ['纽扣电池', '充电电池', '锂电池'], categoryCode: 'harmful', requirements: '请单独投放至有害垃圾收集点，请勿丢弃至其他垃圾桶' },
  { name: '过期药品', aliases: ['药物', '药片'], categoryCode: 'harmful', requirements: '请连同包装一起投放至有害垃圾收集点' },
  { name: '剩菜剩饭', aliases: ['剩饭', '剩菜', '餐厨垃圾'], categoryCode: 'kitchen', requirements: '请沥干水分后投放，去除塑料袋' },
  { name: '果皮', aliases: ['水果皮', '香蕉皮', '苹果皮'], categoryCode: 'kitchen', requirements: '请沥干水分后投放' },
  { name: '餐巾纸', aliases: ['纸巾', '卫生纸', '面巾纸'], categoryCode: 'other', requirements: '使用过的纸巾请投放至其他垃圾' },
  { name: '烟蒂', aliases: ['烟头', '香烟头'], categoryCode: 'other', requirements: '请确认熄灭后投放' },
  { name: '陶瓷碎片', aliases: ['碎陶瓷', '瓷器碎片'], categoryCode: 'other', requirements: '请包裹后投放，避免划伤' },
  { name: '玻璃杯', aliases: ['玻璃瓶', '玻璃罐'], categoryCode: 'recyclable', requirements: '请清洗干净后投放，破碎玻璃请包裹后投放' },
  { name: '旧衣服', aliases: ['旧衣物', '纺织品'], categoryCode: 'recyclable', requirements: '请清洗干净打包后投放至衣物回收箱或可回收物' },
  { name: '荧光灯管', aliases: ['日光灯', '节能灯'], categoryCode: 'harmful', requirements: '请小心包装，避免破碎，投放至有害垃圾收集点' },
  { name: '杀虫剂', aliases: ['农药', '消毒剂'], categoryCode: 'harmful', requirements: '请连同容器一起投放至有害垃圾收集点' },
  { name: '菜叶', aliases: ['蔬菜叶', '烂菜叶'], categoryCode: 'kitchen', requirements: '请沥干水分后投放' },
  { name: '蛋壳', aliases: ['鸡蛋壳', '鸭蛋壳'], categoryCode: 'kitchen', requirements: '可直接投放' },
  { name: '大骨头', aliases: ['猪骨头', '牛骨头'], categoryCode: 'other', requirements: '难腐烂，属于其他垃圾' },
  { name: '椰子壳', aliases: ['榴莲壳', '核桃壳'], categoryCode: 'other', requirements: '难腐烂的硬壳，属于其他垃圾' },
  { name: '塑料袋', aliases: ['一次性塑料袋', '保鲜膜'], categoryCode: 'other', requirements: '普通塑料袋属于其他垃圾' },
  { name: '尿不湿', aliases: ['纸尿裤', '卫生巾'], categoryCode: 'other', requirements: '使用后的卫生用品请投放至其他垃圾' },
];

export const defaultAdmins: MockAdmin[] = [
  {
    username: 'admin_sh',
    password: 'admin123',
    role: 'district_admin',
    cityId: 'shanghai',
    district: '浦东新区'
  },
  {
    username: 'admin_municipal',
    password: 'admin123',
    role: 'municipal_admin',
    cityId: 'shanghai',
    district: null
  }
];

export const defaultStreets: MockStreet[] = [
  { district: '浦东新区', name: '陆家嘴街道' },
  { district: '浦东新区', name: '张江镇' },
  { district: '浦东新区', name: '金桥开发区' },
  { district: '黄浦区', name: '南京东路街道' },
  { district: '黄浦区', name: '豫园街道' },
  { district: '徐汇区', name: '徐家汇街道' },
  { district: '徐汇区', name: '枫林路街道' },
  { district: '静安区', name: '南京西路街道' },
  { district: '静安区', name: '静安寺街道' },
  { district: '长宁区', name: '新华路街道' },
  { district: '长宁区', name: '天山路街道' },
];

export function seedMockData() {
  const cityCount = db.prepare('SELECT COUNT(*) as count FROM cities').get() as { count: number };
  if (cityCount.count > 0) {
    console.log('Mock data already exists, skipping...');
    return;
  }

  const insertCity = db.prepare('INSERT INTO cities (id, name, province) VALUES (?, ?, ?)');
  const insertCategory = db.prepare('INSERT INTO categories (id, city_id, code, name, icon, color, guidelines, misconceptions, update_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO garbage_items (id, name, aliases, category_id, city_id, requirements, misconceptions) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertAdmin = db.prepare('INSERT INTO admins (id, username, password_hash, role, city_id, district) VALUES (?, ?, ?, ?, ?, ?)');
  const insertStreet = db.prepare('INSERT INTO streets (id, district, name, city_id) VALUES (?, ?, ?, ?)');
  const insertFeedback = db.prepare('INSERT INTO feedback (id, item_name, correct_category_id, district, street, created_at) VALUES (?, ?, ?, ?, ?, ?)');

  const tx = db.transaction(() => {
    for (const city of defaultCities) {
      insertCity.run(city.id, city.name, city.province);
      console.log(`Inserted city: ${city.name}`);

      const categoryMap = new Map<string, string>();
      for (const cat of baseCategories) {
        const catId = generateId();
        categoryMap.set(cat.code, catId);
        insertCategory.run(
          catId,
          city.id,
          cat.code,
          cat.name,
          cat.icon,
          cat.color,
          cat.guidelines,
          cat.misconceptions,
          Date.now()
        );
      }
      console.log(`Inserted categories for ${city.name}`);

      for (const item of defaultItems) {
        const categoryId = categoryMap.get(item.categoryCode);
        if (!categoryId) continue;
        const itemId = generateId();
        insertItem.run(
          itemId,
          item.name,
          JSON.stringify(item.aliases),
          categoryId,
          city.id,
          item.requirements || baseCategories.find(c => c.code === item.categoryCode)?.guidelines || '',
          item.misconceptions || baseCategories.find(c => c.code === item.categoryCode)?.misconceptions || ''
        );
      }
      console.log(`Inserted garbage items for ${city.name}`);
    }

    for (const admin of defaultAdmins) {
      const adminId = generateId();
      const passwordHash = bcrypt.hashSync(admin.password, 10);
      insertAdmin.run(adminId, admin.username, passwordHash, admin.role, admin.cityId, admin.district);
    }
    console.log('Inserted admin users');

    for (const street of defaultStreets) {
      const streetId = generateId();
      insertStreet.run(streetId, street.district, street.name, 'shanghai');
    }
    console.log('Inserted streets');

    const shanghaiCats = db.prepare('SELECT id, code FROM categories WHERE city_id = ?').all('shanghai') as Array<{id: string, code: string}>;
    const catIdMap = new Map(shanghaiCats.map(c => [c.code, c.id]));

    const mockFeedbacks = [
      { item: '矿泉水瓶', correctCode: 'recyclable', misCode: 'other', district: '浦东新区', street: '陆家嘴街道', daysAgo: 1 },
      { item: '矿泉水瓶', correctCode: 'recyclable', misCode: 'other', district: '浦东新区', street: '张江镇', daysAgo: 2 },
      { item: '大骨头', correctCode: 'other', misCode: 'kitchen', district: '黄浦区', street: '南京东路街道', daysAgo: 1 },
      { item: '大骨头', correctCode: 'other', misCode: 'kitchen', district: '黄浦区', street: '豫园街道', daysAgo: 3 },
      { item: '餐巾纸', correctCode: 'other', misCode: 'recyclable', district: '徐汇区', street: '徐家汇街道', daysAgo: 2 },
      { item: '塑料袋', correctCode: 'other', misCode: 'recyclable', district: '静安区', street: '南京西路街道', daysAgo: 1 },
      { item: '椰子壳', correctCode: 'other', misCode: 'kitchen', district: '浦东新区', street: '金桥开发区', daysAgo: 4 },
      { item: '废电池', correctCode: 'harmful', misCode: 'other', district: '长宁区', street: '新华路街道', daysAgo: 2 },
      { item: '果皮', correctCode: 'kitchen', misCode: 'other', district: '徐汇区', street: '枫林路街道', daysAgo: 3 },
      { item: '报纸', correctCode: 'recyclable', misCode: 'other', district: '静安区', street: '静安寺街道', daysAgo: 1 },
    ];

    for (let i = 0; i < 50; i++) {
      const fb = mockFeedbacks[i % mockFeedbacks.length];
      const fbId = generateId();
      const createdAt = Math.floor(Date.now() / 1000) - (fb.daysAgo + Math.floor(i / 10)) * 86400 - Math.random() * 3600;
      insertFeedback.run(
        fbId,
        fb.item,
        catIdMap.get(fb.correctCode) || '',
        fb.district,
        fb.street,
        createdAt
      );
    }
    console.log('Inserted mock feedback data');
  });

  tx();
  console.log('All mock data inserted successfully');
}
