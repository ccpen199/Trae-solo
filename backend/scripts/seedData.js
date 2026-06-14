const { db } = require('../src/database');
const bcrypt = require('bcryptjs');

db.pragma('foreign_keys = OFF');

console.log('开始生成测试数据...');

const hashedPassword = bcrypt.hashSync('123456', 10);

const testUsers = [
  { phone: '13800000001', password: hashedPassword, nickname: '张师傅', real_name: '张建国', id_card: '440101198001011234', is_verified: 1, credit_score: 92 },
  { phone: '13800000002', password: hashedPassword, nickname: '李阿姨', real_name: '李淑芬', id_card: '440101197505055678', is_verified: 1, credit_score: 88 },
  { phone: '13800000003', password: hashedPassword, nickname: '王工程师', real_name: '王明', id_card: '440101198808089012', is_verified: 1, credit_score: 95 },
  { phone: '13800000004', password: hashedPassword, nickname: '陈房东', real_name: '陈志强', id_card: '440101197002023456', is_verified: 1, credit_score: 90 },
  { phone: '13800000005', password: hashedPassword, nickname: '刘车主', real_name: '刘华', id_card: '440101199003037890', is_verified: 1, credit_score: 85 },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (phone, password_hash, nickname, real_name, id_card, is_verified, credit_score, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

testUsers.forEach(user => {
  insertUser.run(user.phone, user.password, user.nickname, user.real_name, user.id_card, user.is_verified, user.credit_score);
  console.log(`用户: ${user.nickname}`);
});

const categories = db.prepare('SELECT id, code FROM categories').all();
const categoryMap = {};
categories.forEach(c => categoryMap[c.code] = c.id);

const testListings = [
  {
    category_code: 'job',
    title: '天河区专业电工 持证上岗 8年经验 可上门',
    description: '本人持低压电工作业证，有8年工作经验，可提供电路维修、设备安装、线路整改等服务。价格公道，童叟无欺，24小时响应。',
    price: 200,
    price_unit: '次',
    city: '广州市',
    district: '天河区',
    user_id: 1,
    is_verified: 1,
    fields: {
      '技能证书': '低压电工作业证',
      '工作经验': '8',
      '社保缴纳': '是',
      '上门服务': '是',
      '资质证书': '电工特种作业操作证'
    },
    tags: ['维修靠谱', '持证上岗', '可上门', '响应快']
  },
  {
    category_code: 'job',
    title: '月嫂育儿嫂服务 10年经验 持证',
    description: '高级母婴护理师，10年月嫂经验，带过50+新生儿。提供月子护理、新生儿护理、催乳服务。有高级育婴师证书。',
    price: 12000,
    price_unit: '月',
    city: '广州市',
    district: '越秀区',
    user_id: 2,
    is_verified: 1,
    fields: {
      '技能证书': '高级育婴师',
      '工作经验': '10',
      '上门服务': '是'
    },
    tags: ['经验丰富', '细心负责', '持证上岗']
  },
  {
    category_code: 'house',
    title: '珠江新城两房一厅 业主直租 无中介 精装修',
    description: '保利心语花园，两房一厅85平，精装修，家电齐全。近地铁5号线猎德站。本人业主直租，无中介费，可随时看房。',
    price: 6800,
    price_unit: '月',
    city: '广州市',
    district: '天河区',
    user_id: 4,
    is_verified: 1,
    fields: {
      '房产证号': '粤(2020)广州市不动产权第0012345号',
      '是否中介': '否',
      '户型': '两房一厅',
      '面积': '85'
    },
    tags: ['无中介', '近地铁', '精装修', '业主直租']
  },
  {
    category_code: 'house',
    title: '海珠区江南西 三房两厅 业主直售',
    description: '江南西路玫瑰园，三房两厅120平，南北通透，学区房。满五唯一，税费低。诚心出售，价格可谈。',
    price: 4500000,
    price_unit: '总价',
    city: '广州市',
    district: '海珠区',
    user_id: 4,
    is_verified: 1,
    fields: {
      '房产证号': '粤(2018)广州市不动产权第0067890号',
      '是否中介': '否',
      '户型': '三房两厅',
      '面积': '120'
    },
    tags: ['无中介', '学区房', '满五唯一', '业主直售']
  },
  {
    category_code: 'car',
    title: '丰田凯美瑞 2020款 2.5G豪华版 全程4S保养',
    description: '个人一手车，丰田凯美瑞2020款2.5G豪华版，白色，行驶3.8万公里。全程4S店保养，有完整维保记录。无事故，车况极佳。',
    price: 168000,
    price_unit: '万',
    city: '广州市',
    district: '番禺区',
    user_id: 5,
    is_verified: 1,
    fields: {
      'VIN码': 'LVGBH42K0KG001234',
      '上牌年份': '2020',
      '里程': '38000',
      '保养记录': '4S店全程'
    },
    tags: ['VIN可查', '个人一手', '全程4S保养', '无事故']
  },
  {
    category_code: 'car',
    title: '本田雅阁 2019款 锐·混动 省油代步优选',
    description: '本田雅阁混动版，2019年上牌，黑色，行驶6.2万公里。油电混合，百公里油耗4.2L。家用代步非常合适。',
    price: 145000,
    price_unit: '万',
    city: '广州市',
    district: '白云区',
    user_id: 5,
    is_verified: 1,
    fields: {
      'VIN码': 'LHGCR268XKA876543',
      '上牌年份': '2019',
      '里程': '62000'
    },
    tags: ['VIN可查', '混动省油', '车况良好']
  },
  {
    category_code: 'repair',
    title: '家电维修 空调冰箱洗衣机 专业上门维修',
    description: '专业家电维修15年，专修空调、冰箱、洗衣机、电视等。可上门服务，维修有质保，价格透明。',
    price: 80,
    price_unit: '起',
    city: '广州市',
    district: '天河区',
    user_id: 1,
    is_verified: 1,
    fields: {
      '资质证书': '家电维修高级技师',
      '上门服务': '是',
      '工作经验': '15'
    },
    tags: ['专业靠谱', '可上门', '有质保']
  },
  {
    category_code: 'repair',
    title: '手机电脑维修 现场立等可取',
    description: '专业维修苹果、华为、小米等品牌手机，换屏、换电池、主板维修。电脑系统安装、硬件升级。天河区石牌桥可上门。',
    price: 50,
    price_unit: '起',
    city: '广州市',
    district: '天河区',
    user_id: 3,
    is_verified: 1,
    fields: {
      '资质证书': '计算机维修工程师',
      '上门服务': '是'
    },
    tags: ['快速维修', '立等可取', '可上门']
  },
  {
    category_code: 'housekeeping',
    title: '专业家政保洁 深度清洁 开荒保洁',
    description: '专业家政保洁服务，日常保洁、深度清洁、开荒保洁、擦玻璃。使用环保清洁用品，服务有保障，不满意免费返工。',
    price: 45,
    price_unit: '小时',
    city: '广州市',
    district: '海珠区',
    user_id: 2,
    is_verified: 1,
    fields: {
      '资质证书': '高级家政服务员',
      '上门服务': '是',
      '工作经验': '6'
    },
    tags: ['清洁彻底', '服务好', '可上门']
  },
  {
    category_code: 'housekeeping',
    title: '老人陪护 专业护理 有医护背景',
    description: '有护士执业证，可提供老人陪护、医院陪诊、居家护理服务。有爱心有耐心，专业可靠。',
    price: 180,
    price_unit: '天',
    city: '广州市',
    district: '越秀区',
    user_id: 2,
    is_verified: 1,
    fields: {
      '资质证书': '护士执业证',
      '上门服务': '是',
      '工作经验': '12'
    },
    tags: ['专业护理', '有爱心', '可上门']
  },
  {
    category_code: 'secondhand',
    title: 'MacBook Pro 16寸 2021款 M1Max 几乎全新',
    description: '自用MacBook Pro 16寸，M1Max芯片，32G内存，1TB硬盘。购买不到一年，几乎全新。带原装充电器和包装盒。',
    price: 18500,
    price_unit: '元',
    city: '广州市',
    district: '天河区',
    user_id: 3,
    is_verified: 1,
    fields: {
      '购买渠道': '官网',
      '购买时间': '2023'
    },
    tags: ['几乎全新', '正品保障', '可验机']
  },
  {
    category_code: 'secondhand',
    title: 'iPhone 14 Pro Max 256G 暗紫色 99新',
    description: 'iPhone 14 Pro Max 256G，暗紫色，购买于2022年10月，电池健康92%。有发票，原装配件齐全，无划痕。',
    price: 6800,
    price_unit: '元',
    city: '广州市',
    district: '番禺区',
    user_id: 5,
    is_verified: 1,
    fields: {
      '购买渠道': 'Apple Store',
      '购买时间': '2022'
    },
    tags: ['99新', '正品', '有发票']
  },
  {
    category_code: 'moving',
    title: '正规搬家公司 居民搬家 公司搬迁 打包服务',
    description: '专业搬家服务，居民搬家、公司搬迁、长途搬家、钢琴搬运、家具拆装。有正规发票，搬运有保险。',
    price: 380,
    price_unit: '起',
    city: '广州市',
    district: '白云区',
    user_id: 1,
    is_verified: 1,
    fields: {
      '资质证书': '道路运输经营许可证',
      '上门服务': '是'
    },
    tags: ['正规公司', '有保险', '专业打包']
  },
  {
    category_code: 'moving',
    title: '小型搬家 面包车拉货 随叫随到',
    description: '金杯面包车搬家拉货，小型搬家、个人搬家、小件物品搬运。价格实惠，随叫随到，可帮忙搬运。',
    price: 150,
    price_unit: '起',
    city: '广州市',
    district: '海珠区',
    user_id: 1,
    is_verified: 1,
    fields: {
      '上门服务': '是'
    },
    tags: ['价格实惠', '随叫随到', '可搬运']
  },
  {
    category_code: 'education',
    title: '一对一数学家教 重点中学在职教师',
    description: '重点中学在职数学教师，10年教学经验，擅长初中高中数学辅导。可上门或线上授课，提分效果显著。',
    price: 300,
    price_unit: '小时',
    city: '广州市',
    district: '越秀区',
    user_id: 3,
    is_verified: 1,
    fields: {
      '资质证书': '教师资格证',
      '工作经验': '10',
      '上门服务': '是'
    },
    tags: ['在职教师', '经验丰富', '提分快']
  },
  {
    category_code: 'education',
    title: '英语口语陪练 外教一对一 纯正发音',
    description: '来自美国的外教老师，纯正美式发音，5年教学经验。成人英语、商务英语、雅思托福口语培训。',
    price: 200,
    price_unit: '小时',
    city: '广州市',
    district: '天河区',
    user_id: 3,
    is_verified: 1,
    fields: {
      '资质证书': 'TESOL国际英语教师资格证',
      '工作经验': '5'
    },
    tags: ['外教', '纯正发音', '专业教学']
  },
  {
    category_code: 'beauty',
    title: '上门美甲美睫 日式美甲 款式任选',
    description: '专业美甲师，8年经验，可上门服务。日式美甲、韩式美睫、半永久纹绣。使用环保甲油胶，款式任选。',
    price: 168,
    price_unit: '起',
    city: '广州市',
    district: '天河区',
    user_id: 2,
    is_verified: 1,
    fields: {
      '资质证书': '高级美甲师证书',
      '上门服务': '是',
      '工作经验': '8'
    },
    tags: ['可上门', '款式多', '技术好']
  },
  {
    category_code: 'beauty',
    title: '专业化妆造型 新娘跟妆 舞台妆',
    description: '资深化妆师，提供新娘跟妆、日常妆、舞台妆、晚宴妆服务。使用一线品牌化妆品，免费试妆。',
    price: 1280,
    price_unit: '次',
    city: '广州市',
    district: '海珠区',
    user_id: 2,
    is_verified: 1,
    fields: {
      '资质证书': '高级化妆师证',
      '上门服务': '是',
      '工作经验': '6'
    },
    tags: ['免费试妆', '品牌化妆品', '技术精湛']
  },
  {
    category_code: 'food',
    title: '私房蛋糕定制 动物奶油 新鲜现做',
    description: '家庭私房烘焙，使用进口动物奶油，新鲜水果。生日蛋糕、甜品台、下午茶点心定制。提前24小时预订。',
    price: 168,
    price_unit: '起',
    city: '广州市',
    district: '番禺区',
    user_id: 2,
    is_verified: 1,
    fields: {
      '上门服务': '否',
      '配送': '是'
    },
    tags: ['动物奶油', '新鲜现做', '无添加']
  },
  {
    category_code: 'food',
    title: '上门私厨 粤菜大厨 家宴聚餐',
    description: '粤菜大厨，20年从厨经验，可上门做家宴、朋友聚餐、公司年会。菜品可定制，食材可代买。',
    price: 500,
    price_unit: '起',
    city: '广州市',
    district: '天河区',
    user_id: 1,
    is_verified: 1,
    fields: {
      '资质证书': '高级烹调师',
      '上门服务': '是',
      '工作经验': '20'
    },
    tags: ['粤菜大厨', '可上门', '味道正宗']
  },
  {
    category_code: 'travel',
    title: '广州本地导游 深度讲解 私人定制',
    description: '广州本地人，资深导游，10年导游经验。可带逛陈家祠、沙面、西关大屋等景点，深度讲解岭南文化。',
    price: 300,
    price_unit: '天',
    city: '广州市',
    district: '荔湾区',
    user_id: 3,
    is_verified: 1,
    fields: {
      '资质证书': '导游证',
      '工作经验': '10'
    },
    tags: ['本地导游', '深度讲解', '可定制']
  },
  {
    category_code: 'travel',
    title: '摄影跟拍 亲子照 个人写真 街拍',
    description: '专业摄影师，提供亲子照、个人写真、旅拍街拍服务。使用全画幅相机，精修照片。可上门或指定地点拍摄。',
    price: 688,
    price_unit: '套',
    city: '广州市',
    district: '越秀区',
    user_id: 3,
    is_verified: 1,
    fields: {
      '资质证书': '高级摄影师',
      '上门服务': '是',
      '工作经验': '8'
    },
    tags: ['专业摄影', '精修照片', '可上门']
  },
  {
    category_code: 'pet',
    title: '宠物寄养 家庭式寄养 24小时照顾',
    description: '家庭式宠物寄养，不关笼子，24小时有人照顾，每日遛弯视频反馈。只接受小型犬和猫咪，需要疫苗齐全。',
    price: 60,
    price_unit: '天',
    city: '广州市',
    district: '海珠区',
    user_id: 2,
    is_verified: 1,
    fields: {
      '上门服务': '否'
    },
    tags: ['家庭式', '不关笼', '视频反馈']
  },
  {
    category_code: 'pet',
    title: '上门宠物美容 洗澡剪毛 猫狗都可',
    description: '专业宠物美容师，可上门服务。洗澡、剪毛、修指甲、挤肛门腺全套服务。使用宠物专用洗护用品。',
    price: 120,
    price_unit: '起',
    city: '广州市',
    district: '天河区',
    user_id: 2,
    is_verified: 1,
    fields: {
      '资质证书': '宠物美容师C级',
      '上门服务': '是',
      '工作经验': '5'
    },
    tags: ['可上门', '专业美容', '技术好']
  },
  {
    category_code: 'business',
    title: '公司注册 代理记账 工商变更',
    description: '专业财务公司，提供公司注册、代理记账、工商变更、注销等服务。10年经验，价格透明，服务有保障。',
    price: 200,
    price_unit: '月',
    city: '广州市',
    district: '天河区',
    user_id: 3,
    is_verified: 1,
    fields: {
      '资质证书': '代理记账许可证',
      '工作经验': '10'
    },
    tags: ['专业靠谱', '价格透明', '效率高']
  },
  {
    category_code: 'business',
    title: '商标注册 专利申请 版权登记',
    description: '资深知识产权顾问，提供商标注册、专利申请、版权登记、商标转让等服务。专业高效，成功率高。',
    price: 800,
    price_unit: '件',
    city: '广州市',
    district: '越秀区',
    user_id: 3,
    is_verified: 1,
    fields: {
      '资质证书': '专利代理人资格证',
      '工作经验': '8'
    },
    tags: ['专业', '高效', '成功率高']
  },
];

const insertListing = db.prepare(`
  INSERT INTO listings (category_id, user_id, title, description, price, price_unit, city, district, is_verified, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
`);

const insertField = db.prepare(`
  INSERT INTO listing_fields (listing_id, field_key, field_value)
  VALUES (?, ?, ?)
`);

const insertTag = db.prepare(`
  INSERT INTO listing_tags (listing_id, tag)
  VALUES (?, ?)
`);

testListings.forEach(listing => {
  const categoryId = categoryMap[listing.category_code];
  if (!categoryId) {
    console.log(`分类不存在: ${listing.category_code}`);
    return;
  }

  const result = insertListing.run(
    categoryId,
    listing.user_id,
    listing.title,
    listing.description,
    listing.price,
    listing.price_unit,
    listing.city,
    listing.district,
    listing.is_verified
  );
  
  const listingId = result.lastInsertRowid;
  console.log(`创建: ${listing.title}`);

  Object.entries(listing.fields).forEach(([key, value]) => {
    insertField.run(listingId, key, String(value));
  });

  listing.tags.forEach(tag => {
    insertTag.run(listingId, tag);
  });
});

console.log('');
console.log('✅ 测试数据生成完成！');
console.log(`   - 用户: ${testUsers.length}个`);
console.log(`   - 信息卡片: ${testListings.length}条`);
console.log('');
console.log('测试账号:');
console.log('   手机号: 13800000001 至 13800000005');
console.log('   密码: 123456');
