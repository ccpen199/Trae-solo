const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbPath = process.env.DB_PATH || 'data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = sqlite3(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image TEXT,
      price REAL,
      gmv REAL DEFAULT 0,
      sales_count INTEGER DEFAULT 0,
      is_live INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rankings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ranking_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ranking_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      rank INTEGER NOT NULL,
      recommend_count INTEGER DEFAULT 0,
      recommend_value REAL DEFAULT 0,
      tags TEXT,
      recommend_reason TEXT,
      influencer_name TEXT,
      influencer_avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ranking_id) REFERENCES rankings(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_avatar TEXT,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      is_hot INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      user_id TEXT DEFAULT 'anonymous',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_rankings_type ON rankings(type);
    CREATE INDEX IF NOT EXISTS idx_ranking_items_ranking_id ON ranking_items(ranking_id);
    CREATE INDEX IF NOT EXISTS idx_ranking_items_product_id ON ranking_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_comments_product_id ON comments(product_id);
    CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
  `);

  seedData();
}

function seedData() {
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount > 0) return;

  const insertProduct = db.prepare(`
    INSERT INTO products (title, image, price, gmv, sales_count, is_live)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertRanking = db.prepare(`
    INSERT INTO rankings (type, name, description)
    VALUES (?, ?, ?)
  `);

  const insertRankingItem = db.prepare(`
    INSERT INTO ranking_items (ranking_id, product_id, rank, recommend_count, recommend_value, tags, recommend_reason, influencer_name, influencer_avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertComment = db.prepare(`
    INSERT INTO comments (product_id, user_name, user_avatar, content, rating, is_hot)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const products = [
    { title: '高端智能手表 Pro Max', image: 'https://picsum.photos/seed/watch1/400/400', price: 2999, gmv: 8997000, sales_count: 3000, is_live: 1 },
    { title: '降噪蓝牙耳机 Air', image: 'https://picsum.photos/seed/earbuds1/400/400', price: 899, gmv: 4495000, sales_count: 5000, is_live: 0 },
    { title: '超薄笔记本电脑 14寸', image: 'https://picsum.photos/seed/laptop1/400/400', price: 5999, gmv: 17997000, sales_count: 3000, is_live: 1 },
    { title: '4K高清显示器 27寸', image: 'https://picsum.photos/seed/monitor1/400/400', price: 2499, gmv: 7497000, sales_count: 3000, is_live: 0 },
    { title: '智能扫地机器人', image: 'https://picsum.photos/seed/vacuum1/400/400', price: 1999, gmv: 5997000, sales_count: 3000, is_live: 1 },
    { title: '真皮商务公文包', image: 'https://picsum.photos/seed/bag1/400/400', price: 1299, gmv: 3897000, sales_count: 3000, is_live: 0 },
    { title: '高端护肤套装礼盒', image: 'https://picsum.photos/seed/skincare1/400/400', price: 899, gmv: 4495000, sales_count: 5000, is_live: 1 },
    { title: '运动无线耳机', image: 'https://picsum.photos/seed/sportsearbuds1/400/400', price: 599, gmv: 2995000, sales_count: 5000, is_live: 0 },
    { title: '智能空气净化器', image: 'https://picsum.photos/seed/purifier1/400/400', price: 1599, gmv: 4797000, sales_count: 3000, is_live: 1 },
    { title: '便携充电宝 20000mAh', image: 'https://picsum.photos/seed/powerbank1/400/400', price: 199, gmv: 995000, sales_count: 5000, is_live: 0 }
  ];

  const productIds = [];
  products.forEach((p, index) => {
    const result = insertProduct.run(p.title, p.image, p.price, p.gmv, p.sales_count, p.is_live);
    productIds.push(result.lastInsertRowid);
  });

  const rankings = [
    { type: 'hot', name: '今日热门榜', description: '全网最受欢迎的热门商品' },
    { type: 'recommend', name: '编辑推荐榜', description: '专业编辑精心挑选的优质好物' },
    { type: 'digital', name: '数码电子榜', description: '最新最全的数码电子产品' },
    { type: 'beauty', name: '美妆护肤榜', description: '爆款美妆护肤好物推荐' },
    { type: 'lifestyle', name: '生活家居榜', description: '提升生活品质的家居好物' }
  ];

  const rankingIds = [];
  rankings.forEach(r => {
    const result = insertRanking.run(r.type, r.name, r.description);
    rankingIds.push(result.lastInsertRowid);
  });

  const influencers = [
    { name: '科技达人小王', avatar: 'https://picsum.photos/seed/avatar1/100/100' },
    { name: '时尚博主小美', avatar: 'https://picsum.photos/seed/avatar2/100/100' },
    { name: '生活家老张', avatar: 'https://picsum.photos/seed/avatar3/100/100' }
  ];

  const tags = ['热销', '新品', '爆款', '限时特惠', '明星同款', '性价比之王'];
  const reasons = [
    '品质过硬，性价比超高，强烈推荐！',
    '用了都说好，回头客超多！',
    '功能强大，设计精美，值得拥有！',
    '全网口碑爆款，买了不后悔！',
    '亲测好用，已经回购第三次了！'
  ];

  rankingIds.forEach((rankingId, rIndex) => {
    const count = rIndex === 0 ? 10 : 5;
    for (let i = 0; i < count; i++) {
      const influencer = influencers[Math.floor(Math.random() * influencers.length)];
      const tagCount = Math.floor(Math.random() * 2) + 1;
      const productTags = [];
      for (let j = 0; j < tagCount; j++) {
        const tag = tags[Math.floor(Math.random() * tags.length)];
        if (!productTags.includes(tag)) productTags.push(tag);
      }
      insertRankingItem.run(
        rankingId,
        productIds[i % productIds.length],
        i + 1,
        Math.floor(Math.random() * 10000) + 1000,
        Math.random() * 10 + 90,
        productTags.join(','),
        reasons[Math.floor(Math.random() * reasons.length)],
        influencer.name,
        influencer.avatar
      );
    }
  });

  const comments = [
    { user_name: '用户A', content: '非常好用，已经推荐给朋友了！', rating: 5, is_hot: 1 },
    { user_name: '用户B', content: '质量很好，物流也很快，满意！', rating: 5, is_hot: 1 },
    { user_name: '用户C', content: '用了一段时间，确实不错，值得购买。', rating: 4, is_hot: 0 },
    { user_name: '用户D', content: '性价比很高，会回购的！', rating: 5, is_hot: 0 },
    { user_name: '用户E', content: '外观漂亮，功能强大，很喜欢！', rating: 5, is_hot: 1 }
  ];

  productIds.forEach(productId => {
    comments.forEach(comment => {
      insertComment.run(productId, comment.user_name, null, comment.content, comment.rating, comment.is_hot);
    });
  });
}

module.exports = {
  db,
  initDatabase
};
