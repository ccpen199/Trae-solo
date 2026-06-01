const db = require('./index');

console.log('开始初始化数据库...');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    cover_image TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS guides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    destination_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    itinerary TEXT,
    budget TEXT,
    preparation TEXT,
    cover_image TEXT,
    images TEXT,
    video_url TEXT,
    tags TEXT,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(id)
  );

  CREATE TABLE IF NOT EXISTS travel_bars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    guide_id INTEGER,
    travel_bar_id INTEGER,
    parent_id INTEGER,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE,
    FOREIGN KEY (travel_bar_id) REFERENCES travel_bars(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    guide_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE,
    UNIQUE(user_id, guide_id)
  );

  CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS guide_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    guide_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE,
    UNIQUE(user_id, guide_id)
  );

  CREATE TABLE IF NOT EXISTS travel_bar_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    travel_bar_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (travel_bar_id) REFERENCES travel_bars(id) ON DELETE CASCADE,
    UNIQUE(user_id, travel_bar_id)
  );
`);

console.log('数据库表创建成功！');

const destinations = [
  { name: '东京', country: '日本', description: '日本首都，现代化与传统文化的完美融合' },
  { name: '巴黎', country: '法国', description: '浪漫之都，艺术与时尚的殿堂' },
  { name: '马尔代夫', country: '马尔代夫', description: '印度洋上的珍珠，度假天堂' },
  { name: '丽江', country: '中国', description: '古城风韵，纳西文化的活化石' },
  { name: '三亚', country: '中国', description: '东方夏威夷，热带海滨度假胜地' },
  { name: '曼谷', country: '泰国', description: '佛教之都，微笑国度的心脏' },
  { name: '新加坡', country: '新加坡', description: '花园城市，多元文化的融合' },
  { name: '巴厘岛', country: '印度尼西亚', description: '神明之岛，浪漫的热带天堂' }
];

const insertDest = db.prepare('INSERT INTO destinations (name, country, description, cover_image) VALUES (?, ?, ?, ?)');

destinations.forEach(dest => {
  const imageName = dest.name === '东京' ? 'tokyo' : 
                    dest.name === '巴黎' ? 'paris' :
                    dest.name === '马尔代夫' ? 'maldives' :
                    dest.name === '丽江' ? 'lijiang' :
                    dest.name === '三亚' ? 'sanya' :
                    dest.name === '曼谷' ? 'bangkok' :
                    dest.name === '新加坡' ? 'singapore' : 'bali';
  insertDest.run(dest.name, dest.country, dest.description, `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${imageName}%20travel%20destination%20beautiful%20scenery&image_size=landscape_16_9`);
});

console.log('测试目的地数据插入成功！');

const bcrypt = require('bcryptjs');
const hashedPassword = bcrypt.hashSync('123456', 10);

const insertUser = db.prepare('INSERT INTO users (username, email, password, avatar, bio) VALUES (?, ?, ?, ?, ?)');
const testUserIds = [];

for (let i = 1; i <= 3; i++) {
  const result = insertUser.run(
    `旅行家${i}号`,
    `traveler${i}@example.com`,
    hashedPassword,
    `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traveler%20avatar%20portrait&image_size=square`,
    `热爱旅行，分享美好。这是旅行家${i}号的个人简介。`
  );
  testUserIds.push(result.lastInsertRowid);
}

console.log('测试用户数据插入成功！');

const sampleGuides = [
  {
    title: '东京5日深度游攻略',
    content: '东京是一个充满魅力的城市，既有现代化的高楼大厦，又有传统的神社寺庙。这次5天的行程将带你领略东京的精髓...',
    itinerary: 'Day1: 浅草寺 - 晴空塔 - 秋叶原\nDay2: 新宿 - 涩谷 - 原宿\nDay3: 银座 - 东京塔 - 台场\nDay4: 迪士尼乐园\nDay5: 上野公园 - 池袋',
    budget: '人均8000-12000元，含机票、住宿、餐饮和门票',
    preparation: '提前办理签证，购买Suica交通卡，下载Google翻译'
  },
  {
    title: '马尔代夫蜜月旅行完全指南',
    content: '马尔代夫是蜜月旅行的绝佳选择，碧海蓝天，白沙滩...',
    itinerary: 'Day1: 抵达马累 - 快艇上岛\nDay2: 浮潜 - 日落巡航\nDay3: 水上活动 - SPA\nDay4: 跳岛游\nDay5: 沙滩发呆 - 返程',
    budget: '人均20000-30000元，一价全包岛屿',
    preparation: '带好防晒用品，准备浮潜装备，提前申请蜜月礼遇'
  },
  {
    title: '丽江古城慢生活之旅',
    content: '放慢脚步，在丽江古城感受纳西文化的独特魅力...',
    itinerary: 'Day1: 抵达丽江 - 古城夜游\nDay2: 玉龙雪山 - 蓝月谷\nDay3: 束河古镇 - 白沙古镇\nDay4: 泸沽湖一日游\nDay5: 古城发呆 - 返程',
    budget: '人均3000-5000元',
    preparation: '带好保湿用品，注意高原反应，准备舒适的鞋子'
  }
];

const insertGuide = db.prepare(`
  INSERT INTO guides (user_id, destination_id, title, content, itinerary, budget, preparation, cover_image, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

sampleGuides.forEach((guide, index) => {
  const destId = index + 1;
  const userId = testUserIds[index % testUserIds.length];
  const imageName = ['tokyo', 'maldives', 'lijiang'][index];
  insertGuide.run(
    userId,
    destId,
    guide.title,
    guide.content,
    guide.itinerary,
    guide.budget,
    guide.preparation,
    `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${imageName}%20travel%20guide%20beautiful%20scenery&image_size=landscape_16_9`,
    JSON.stringify(['攻略', '自由行', '精选'])
  );
});

console.log('测试攻略数据插入成功！');

const sampleBars = [
  { title: '第一次出国旅行需要注意什么？', content: '下个月准备第一次出国旅行，去日本，想问问大家有什么需要注意的事项吗？签证好办吗？' },
  { title: '一个人旅行安全吗？', content: '女生一个人去东南亚旅行安全吗？有什么推荐的地方吗？' },
  { title: '旅行中如何拍出好看的照片？', content: '每次旅行拍的照片都不满意，有没有拍照大神分享一下技巧？' }
];

const insertBar = db.prepare('INSERT INTO travel_bars (user_id, title, content, tags) VALUES (?, ?, ?, ?)');

sampleBars.forEach((bar, index) => {
  const userId = testUserIds[index % testUserIds.length];
  const tags = index === 0 ? ['出国', '日本', '求助'] :
               index === 1 ? ['独自旅行', '安全', '东南亚'] :
               ['拍照', '技巧', '分享'];
  insertBar.run(userId, bar.title, bar.content, JSON.stringify(tags));
});

console.log('测试旅吧数据插入成功！');
console.log('数据库初始化完成！');
