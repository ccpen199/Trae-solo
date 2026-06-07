const db = require('../src/db');
const bcrypt = require('bcryptjs');

const users = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'expert1', password: 'expert123', role: 'expert' },
  { username: 'user1', password: 'user123', role: 'user' }
];

const brands = [
  { name: '华为', english_name: 'Huawei', industry: '消费电子', category: '手机', region: '广东', level: 'S', first_letter: 'H', description: '全球领先的ICT基础设施和智能终端提供商', established_year: 1987, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Huawei%20brand%20logo%20minimalist%20red%20color&image_size=square' },
  { name: '小米', english_name: 'Xiaomi', industry: '消费电子', category: '手机', region: '北京', level: 'A', first_letter: 'X', description: '以智能硬件和电子产品研发为主的全球化移动互联网企业', established_year: 2010, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Xiaomi%20brand%20logo%20orange%20color%20simple&image_size=square' },
  { name: '苹果', english_name: 'Apple', industry: '消费电子', category: '手机', region: '海外', level: 'S', first_letter: 'P', description: '美国高科技公司，全球市值最高企业之一', established_year: 1976, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Apple%20brand%20logo%20minimalist%20silhouette&image_size=square' },
  { name: '比亚迪', english_name: 'BYD', industry: '汽车', category: '新能源汽车', region: '广东', level: 'A', first_letter: 'B', description: '中国新能源汽车和电池制造龙头企业', established_year: 1995, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=BYD%20auto%20brand%20logo%20silver%20blue&image_size=square' },
  { name: '特斯拉', english_name: 'Tesla', industry: '汽车', category: '新能源汽车', region: '海外', level: 'S', first_letter: 'T', description: '美国新能源汽车和清洁能源公司', established_year: 2003, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Tesla%20brand%20logo%20modern%20stylized%20T&image_size=square' },
  { name: '海尔', english_name: 'Haier', industry: '家电', category: '白色家电', region: '山东', level: 'A', first_letter: 'H', description: '全球大型家电第一品牌', established_year: 1984, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Haier%20brand%20logo%20blue%20wave%20design&image_size=square' },
  { name: '美的', english_name: 'Midea', industry: '家电', category: '白色家电', region: '广东', level: 'A', first_letter: 'M', description: '中国家电制造业龙头企业', established_year: 1968, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Midea%20brand%20logo%20purple%20modern&image_size=square' },
  { name: '格力', english_name: 'Gree', industry: '家电', category: '空调', region: '广东', level: 'A', first_letter: 'G', description: '中国空调行业领军企业', established_year: 1991, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Gree%20brand%20logo%20blue%20professional&image_size=square' },
  { name: '茅台', english_name: 'Moutai', industry: '食品', category: '白酒', region: '贵州', level: 'S', first_letter: 'M', description: '中国高端白酒第一品牌，酱香代表', established_year: 1951, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Moutai%20brand%20logo%20red%20gold%20elegant&image_size=square' },
  { name: '五粮液', english_name: 'Wuliangye', industry: '食品', category: '白酒', region: '四川', level: 'A', first_letter: 'W', description: '中国浓香型白酒代表品牌', established_year: 1959, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Wuliangye%20brand%20logo%20red%20traditional&image_size=square' },
  { name: '阿里', english_name: 'Alibaba', industry: '互联网', category: '电商', region: '浙江', level: 'S', first_letter: 'A', description: '全球知名电子商务集团', established_year: 1999, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Alibaba%20brand%20logo%20orange%20smile&image_size=square' },
  { name: '腾讯', english_name: 'Tencent', industry: '互联网', category: '社交', region: '广东', level: 'S', first_letter: 'T', description: '中国最大的互联网综合服务提供商之一', established_year: 1998, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Tencent%20brand%20logo%20blue%20green&image_size=square' },
  { name: '京东', english_name: 'JD', industry: '互联网', category: '电商', region: '北京', level: 'A', first_letter: 'J', description: '中国知名综合型电商平台', established_year: 2004, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=JD%20brand%20logo%20red%20dog%20mascot&image_size=square' },
  { name: '美团', english_name: 'Meituan', industry: '互联网', category: '本地生活', region: '北京', level: 'A', first_letter: 'M', description: '中国领先的生活服务电子商务平台', established_year: 2010, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Meituan%20brand%20logo%20yellow%20kangaroo&image_size=square' },
  { name: '字节跳动', english_name: 'ByteDance', industry: '互联网', category: '短视频', region: '北京', level: 'S', first_letter: 'Z', description: '全球知名的短视频和内容平台', established_year: 2012, logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ByteDance%20brand%20logo%20modern%20colorful&image_size=square' }
];

const rankingCategories = [
  { name: '智能手机十大品牌', code: 'smartphone_top10', description: '中国智能手机市场品牌综合排名', category_type: 'top10' },
  { name: '新能源汽车十大品牌', code: 'ev_top10', description: '中国新能源汽车市场品牌综合排名', category_type: 'top10' },
  { name: '白色家电十大品牌', code: 'homeappliance_top10', description: '中国家电行业品牌综合排名', category_type: 'top10' },
  { name: '白酒品牌十大排行榜', code: 'baijiu_top10', description: '中国白酒行业品牌综合排名', category_type: 'top10' },
  { name: '互联网企业市值榜', code: 'internet_marketcap', description: '中国互联网企业市值排名', category_type: 'top10' },
  { name: '品牌趣闻榜', code: 'fun_facts', description: '品牌背后的有趣故事', category_type: 'news' },
  { name: '一线城市品牌活力榜', code: 'city_first_tier', description: '一线城市品牌发展活力排名', category_type: 'city' },
  { name: '新一线城市品牌活力榜', code: 'city_new_tier', description: '新一线城市品牌发展活力排名', category_type: 'city' }
];

const knowledgeTopics = [
  { title: '装修材料选购指南', summary: '如何选择环保、耐用的装修材料，打造健康舒适的家居环境', category: '装修', tags: '装修,建材,环保', author: '家居研究院', content: '装修材料是决定装修质量的关键因素。本文从环保等级、耐用性、性价比等多个维度，详细介绍了地板、瓷砖、涂料、板材等主要装修材料的选购要点。' },
  { title: '中国传统美食文化', summary: '探索中国八大菜系的历史渊源与特色美食', category: '美食', tags: '美食,八大菜系,传统文化', author: '美食文化研究中心', content: '中国饮食文化源远流长，八大菜系各具特色。鲁菜讲究调味醇正，川菜以麻辣鲜香见长，粤菜追求原汁原味，苏菜注重刀工火候...' },
  { title: '二十四节气之立春', summary: '立春的由来、习俗与养生建议', category: '节气', tags: '节气,立春,养生', author: '传统文化研究中心', content: '立春是二十四节气之首，标志着春季的开始。这一天有咬春、打春牛、迎春等传统习俗。立春时节，阳气初生，养生应顺应阳气升发的特点。' },
  { title: '新能源汽车技术解析', summary: '深入了解电动汽车的三电系统与核心技术', category: '汽车', tags: '新能源,电动汽车,技术', author: '汽车科技研究院', content: '新能源汽车的核心是三电系统：电池、电机、电控。比亚迪集团在刀片电池技术上取得重大突破，特斯拉则以电控系统见长...' },
  { title: '智能手机发展简史', summary: '从功能机到智能机的演进历程与未来趋势', category: '手机', tags: '智能手机,发展史,科技', author: '科技评论部', content: '1994年IBM推出世界上第一款智能手机Simon，2007年苹果发布iPhone彻底改变行业格局。华为、小米等中国品牌在5G时代实现弯道超车...' }
];

const conceptHierarchy = [
  { name: '消费电子', level: 1, parent_id: null },
  { name: '手机', level: 2, parent_id: 1 },
  { name: '智能穿戴', level: 2, parent_id: 1 },
  { name: '智能家居', level: 2, parent_id: 1 },
  { name: '食品饮料', level: 1, parent_id: null },
  { name: '白酒', level: 2, parent_id: 5 },
  { name: '休闲食品', level: 2, parent_id: 5 },
  { name: '饮品', level: 2, parent_id: 5 },
  { name: '汽车交通', level: 1, parent_id: null },
  { name: '新能源汽车', level: 2, parent_id: 9 },
  { name: '传统燃油车', level: 2, parent_id: 9 }
];

const dataSources = [
  { source_name: '电商平台API', source_type: 'api', api_endpoint: 'https://api.example.com/ecommerce' },
  { source_name: '天眼查工商数据', source_type: 'api', api_endpoint: 'https://api.tianyancha.com/' },
  { source_name: '新闻爬虫', source_type: 'crawler', api_endpoint: '' },
  { source_name: '社交媒体舆情', source_type: 'api', api_endpoint: 'https://api.example.com/social' }
];

const transaction = db.transaction(() => {
  const userStmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
  users.forEach(u => userStmt.run(u.username, bcrypt.hashSync(u.password, 10), u.role));
  console.log(`Inserted ${users.length} users`);

  const brandStmt = db.prepare(`
    INSERT INTO brands (name, english_name, logo_url, industry, category, region, established_year,
                        description, level, first_letter, sales_volume, reputation_score, vote_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  brands.forEach(b => brandStmt.run(
    b.name, b.english_name, b.logo_url, b.industry, b.category, b.region, b.established_year,
    b.description, b.level, b.first_letter,
    Math.floor(Math.random() * 9000) + 1000,
    Math.floor(Math.random() * 30) + 70,
    Math.floor(Math.random() * 5000) + 500
  ));
  console.log(`Inserted ${brands.length} brands`);

  const categoryStmt = db.prepare(`
    INSERT INTO ranking_categories (name, code, description, category_type, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  rankingCategories.forEach((c, i) => categoryStmt.run(c.name, c.code, c.description, c.category_type, i));
  console.log(`Inserted ${rankingCategories.length} ranking categories`);

  const topicStmt = db.prepare(`
    INSERT INTO knowledge_topics (title, summary, content, category, tags, author, published_at, view_count, like_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  knowledgeTopics.forEach(t => topicStmt.run(
    t.title, t.summary, t.content, t.category, t.tags, t.author,
    new Date().toISOString(),
    Math.floor(Math.random() * 10000) + 1000,
    Math.floor(Math.random() * 500) + 50
  ));
  console.log(`Inserted ${knowledgeTopics.length} knowledge topics`);

  const conceptStmt = db.prepare(`
    INSERT INTO concept_hierarchy (parent_id, name, level, description)
    VALUES (?, ?, ?, ?)
  `);
  conceptHierarchy.forEach(c => conceptStmt.run(c.parent_id, c.name, c.level, c.description || ''));
  console.log(`Inserted ${conceptHierarchy.length} concept hierarchy items`);

  const sourceStmt = db.prepare(`
    INSERT INTO data_sources (source_name, source_type, api_endpoint, last_sync_at)
    VALUES (?, ?, ?, ?)
  `);
  dataSources.forEach(s => sourceStmt.run(s.source_name, s.source_type, s.api_endpoint, new Date().toISOString()));
  console.log(`Inserted ${dataSources.length} data sources`);

  const brandIds = db.prepare('SELECT id FROM brands').all().map(b => b.id);
  const voteStmt = db.prepare('INSERT INTO votes (brand_id, ip_address, score) VALUES (?, ?, ?)');
  brandIds.forEach(id => {
    for (let i = 0; i < Math.floor(Math.random() * 50) + 10; i++) {
      voteStmt.run(id, `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, 1);
    }
  });
  console.log('Inserted sample votes');
});

transaction();
console.log('All seed data inserted successfully!');
db.close();
