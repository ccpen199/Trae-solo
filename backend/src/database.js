const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

function getDB() {
  if (!db) {
    const Database = require('better-sqlite3');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function query(sql, params = []) {
  try {
    const database = getDB();
    const stmt = database.prepare(sql);
    return stmt.all(...params);
  } catch (err) {
    console.error('SQL Error:', err, 'SQL:', sql);
    throw err;
  }
}

function queryOne(sql, params = []) {
  try {
    const database = getDB();
    const stmt = database.prepare(sql);
    return stmt.get(...params);
  } catch (err) {
    console.error('SQL Error:', err, 'SQL:', sql);
    throw err;
  }
}

function execute(sql, params = []) {
  try {
    const database = getDB();
    const stmt = database.prepare(sql);
    const info = stmt.run(...params);
    return { lastID: info.lastInsertRowid, changes: info.changes };
  } catch (err) {
    console.error('SQL Error:', err, 'SQL:', sql);
    throw err;
  }
}

function runTransaction(queries) {
  try {
    const database = getDB();
    const transaction = database.transaction(() => {
      for (const q of queries) {
        const stmt = database.prepare(q.sql);
        stmt.run(...(q.params || []));
      }
    });
    transaction();
    return true;
  } catch (err) {
    console.error('Transaction Error:', err);
    throw err;
  }
}

async function init() {
  try {
    await execute(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      nickname TEXT,
      avatar TEXT,
      password TEXT,
      open_id TEXT UNIQUE,
      login_type TEXT,
      balance REAL DEFAULT 0,
      coupons INTEGER DEFAULT 0,
      vip INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      code TEXT,
      expires_at TEXT,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT,
      icon TEXT,
      sort INTEGER DEFAULT 0,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT,
      image TEXT,
      link TEXT,
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS activity_icons (
      id TEXT PRIMARY KEY,
      name TEXT,
      icon TEXT,
      link TEXT,
      sort INTEGER DEFAULT 0,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      image TEXT,
      images TEXT,
      price REAL,
      original_price REAL,
      category_id TEXT,
      description TEXT,
      stock INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      is_buy INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      shop_name TEXT,
      shop_id TEXT,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      product_id TEXT,
      quantity INTEGER DEFAULT 1,
      selected INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE,
      user_id TEXT,
      product_id TEXT,
      product_name TEXT,
      product_image TEXT,
      price REAL,
      quantity INTEGER,
      total_price REAL,
      status TEXT,
      pay_status TEXT DEFAULT 'unpaid',
      type TEXT DEFAULT 'normal',
      group_id TEXT,
      shipping_address TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      initiator_id TEXT,
      current_count INTEGER DEFAULT 1,
      total_count INTEGER DEFAULT 2,
      status TEXT DEFAULT 'pending',
      expires_at TEXT,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      product_id TEXT,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      name TEXT,
      avatar TEXT,
      description TEXT,
      followers INTEGER DEFAULT 0,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      shop_id TEXT,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS lives (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      title TEXT,
      cover TEXT,
      stream_url TEXT,
      status TEXT DEFAULT 'offline',
      viewers INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS shop_dynamics (
      id TEXT PRIMARY KEY,
      shop_id TEXT,
      content TEXT,
      images TEXT,
      product_id TEXT,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT,
      phone TEXT,
      province TEXT,
      city TEXT,
      district TEXT,
      detail TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS orchards (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      fruit_type TEXT,
      progress INTEGER DEFAULT 0,
      water_count INTEGER DEFAULT 0,
      fertilize_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'growing',
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS bargains (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      product_id TEXT,
      original_price REAL,
      current_price REAL,
      target_price REAL DEFAULT 0,
      helpers TEXT,
      status TEXT DEFAULT 'ongoing',
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS cash_activities (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      current_amount REAL DEFAULT 0,
      target_amount REAL DEFAULT 100,
      helpers TEXT,
      status TEXT DEFAULT 'ongoing',
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      from_id TEXT,
      to_id TEXT,
      content TEXT,
      type TEXT DEFAULT 'text',
      read INTEGER DEFAULT 0,
      created_at TEXT
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      created_at TEXT
    )`);

    await seedData();
    
    console.log('数据库初始化完成');
    return true;
  } catch (err) {
    console.error('数据库初始化失败:', err);
    throw err;
  }
}

async function seedData() {
  const existingCategories = await queryOne('SELECT COUNT(*) as count FROM categories');
  if (existingCategories.count > 0) {
    return;
  }

  const dayjs = require('dayjs');
  const { v4: uuidv4 } = require('uuid');
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const categories = [
    { id: uuidv4(), name: '女装', icon: '👗', sort: 1, created_at: now },
    { id: uuidv4(), name: '男装', icon: '👔', sort: 2, created_at: now },
    { id: uuidv4(), name: '鞋包', icon: '👜', sort: 3, created_at: now },
    { id: uuidv4(), name: '数码', icon: '📱', sort: 4, created_at: now },
    { id: uuidv4(), name: '母婴', icon: '🍼', sort: 5, created_at: now },
    { id: uuidv4(), name: '食品', icon: '🍎', sort: 6, created_at: now },
    { id: uuidv4(), name: '家居', icon: '🏠', sort: 7, created_at: now },
    { id: uuidv4(), name: '美妆', icon: '💄', sort: 8, created_at: now },
    { id: uuidv4(), name: '运动', icon: '⚽', sort: 9, created_at: now },
    { id: uuidv4(), name: '图书', icon: '📚', sort: 10, created_at: now }
  ];

  for (const cat of categories) {
    await execute('INSERT INTO categories (id, name, icon, sort, created_at) VALUES (?, ?, ?, ?, ?)',
      [cat.id, cat.name, cat.icon, cat.sort, cat.created_at]);
  }

  const banners = [
    { id: uuidv4(), title: '百亿补贴 限时抢购', image: 'https://picsum.photos/800/300?random=1', link: '', sort: 1, status: 1, created_at: now },
    { id: uuidv4(), title: '新人专享 首单立减', image: 'https://picsum.photos/800/300?random=2', link: '', sort: 2, status: 1, created_at: now },
    { id: uuidv4(), title: '限时秒杀 天天低价', image: 'https://picsum.photos/800/300?random=3', link: '', sort: 3, status: 1, created_at: now },
    { id: uuidv4(), title: '品牌清仓 全场5折起', image: 'https://picsum.photos/800/300?random=4', link: '', sort: 4, status: 1, created_at: now }
  ];

  for (const banner of banners) {
    await execute('INSERT INTO banners (id, title, image, link, sort, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [banner.id, banner.title, banner.image, banner.link, banner.sort, banner.status, banner.created_at]);
  }

  const icons = [
    { id: uuidv4(), name: '限时秒杀', icon: '🔥', link: '/seckill', sort: 1, created_at: now },
    { id: uuidv4(), name: '品牌断码', icon: '🏷️', link: '/brand', sort: 2, created_at: now },
    { id: uuidv4(), name: '多多果园', icon: '🌳', link: '/orchard', sort: 3, created_at: now },
    { id: uuidv4(), name: '9块9特卖', icon: '💰', link: '/nine', sort: 4, created_at: now },
    { id: uuidv4(), name: '充值中心', icon: '💳', link: '/recharge', sort: 5, created_at: now },
    { id: uuidv4(), name: '天天领现金', icon: '💵', link: '/cash', sort: 6, created_at: now },
    { id: uuidv4(), name: '砍价免费拿', icon: '🆓', link: '/bargain', sort: 7, created_at: now },
    { id: uuidv4(), name: '多多爱消除', icon: '🎮', link: '/game', sort: 8, created_at: now },
    { id: uuidv4(), name: '多多买菜', icon: '🥬', link: '/veggie', sort: 9, created_at: now },
    { id: uuidv4(), name: '百亿补贴', icon: '🎁', link: '/subsidy', sort: 10, created_at: now }
  ];

  for (const icon of icons) {
    await execute('INSERT INTO activity_icons (id, name, icon, link, sort, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [icon.id, icon.name, icon.icon, icon.link, icon.sort, icon.created_at]);
  }

  const shops = [
    { id: uuidv4(), name: '多多官方旗舰店', avatar: 'https://picsum.photos/100/100?random=101', description: '官方直营，品质保证', followers: 12580, created_at: now },
    { id: uuidv4(), name: '优选生活馆', avatar: 'https://picsum.photos/100/100?random=102', description: '精选好物，值得信赖', followers: 8960, created_at: now },
    { id: uuidv4(), name: '数码达人馆', avatar: 'https://picsum.photos/100/100?random=103', description: '专业数码，优惠到底', followers: 15680, created_at: now },
    { id: uuidv4(), name: '美食天地', avatar: 'https://picsum.photos/100/100?random=104', description: '美味零食，新鲜直达', followers: 23450, created_at: now }
  ];

  for (const shop of shops) {
    await execute('INSERT INTO shops (id, name, avatar, description, followers, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [shop.id, shop.name, shop.avatar, shop.description, shop.followers, shop.created_at]);
  }

  const productNames = [
    { name: '夏季新款连衣裙女装时尚气质修身显瘦裙子', category: '女装', price: 69.9, original: 199, shop: 0 },
    { name: '男士纯棉短袖T恤圆领宽松大码半袖', category: '男装', price: 29.9, original: 89, shop: 0 },
    { name: '时尚真皮女包单肩斜挎手提包', category: '鞋包', price: 158, original: 399, shop: 1 },
    { name: 'iPhone 15 Pro Max 256G 全网通', category: '数码', price: 8999, original: 9999, shop: 2, isBuy: 1 },
    { name: '婴儿奶粉3段900g 适合1-3岁', category: '母婴', price: 188, original: 268, shop: 0 },
    { name: '新疆阿克苏冰糖心苹果5斤装', category: '食品', price: 29.9, original: 59, shop: 3 },
    { name: '北欧简约风格实木餐桌椅组合', category: '家居', price: 1299, original: 2999, shop: 1 },
    { name: '大牌同款口红持久不脱色滋润', category: '美妆', price: 99, original: 299, shop: 0, isBuy: 1 },
    { name: '男女通用运动跑鞋透气轻便', category: '运动', price: 139, original: 399, shop: 2 },
    { name: '畅销小说图书套装精装版', category: '图书', price: 59, original: 128, shop: 1 },
    { name: '夏季薄款防晒衣女透气冰丝', category: '女装', price: 49.9, original: 149, shop: 0 },
    { name: '商务正装男士西装修身韩版', category: '男装', price: 299, original: 799, shop: 2 },
    { name: '新款时尚运动鞋男女同款', category: '鞋包', price: 199, original: 599, shop: 2, isHot: 1 },
    { name: '华为Mate 60 Pro 512G 旗舰手机', category: '数码', price: 6999, original: 7999, shop: 2, isBuy: 1 },
    { name: '儿童纯棉T恤套装夏季新款', category: '母婴', price: 39.9, original: 99, shop: 0 },
    { name: '进口巧克力礼盒装200g', category: '食品', price: 49.9, original: 99, shop: 3, isHot: 1 },
    { name: '多功能收纳柜整理箱四层', category: '家居', price: 89, original: 199, shop: 1 },
    { name: '补水保湿面膜套装30片装', category: '美妆', price: 69, original: 199, shop: 0 },
    { name: '瑜伽垫加厚防滑初学者专用', category: '运动', price: 59, original: 159, shop: 1 },
    { name: '经典世界名著套装10本', category: '图书', price: 99, original: 299, shop: 1, isHot: 1 }
  ];

  const categoryMap = {};
  const allCats = await query('SELECT id, name FROM categories');
  allCats.forEach(c => categoryMap[c.name] = c.id);

  let i = 1;
  for (const p of productNames) {
    const pid = uuidv4();
    const shop = shops[p.shop || 0];
    await execute(`INSERT INTO products (id, name, image, images, price, original_price, category_id, description, stock, sales, is_buy, is_hot, shop_name, shop_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pid,
        p.name,
        `https://picsum.photos/400/400?random=${10 + i}`,
        JSON.stringify([`https://picsum.photos/400/400?random=${10 + i}`, `https://picsum.photos/400/400?random=${20 + i}`, `https://picsum.photos/400/400?random=${30 + i}`]),
        p.price,
        p.original,
        categoryMap[p.category],
        p.name + ' 品质保证，售后无忧',
        999,
        Math.floor(Math.random() * 10000),
        p.isBuy || 0,
        p.isHot || 0,
        shop.name,
        shop.id,
        now
      ]
    );
    i++;
  }

  const lives = [
    { id: uuidv4(), shop_id: shops[0].id, title: '夏季女装大促 全场5折起', cover: 'https://picsum.photos/400/300?random=50', stream_url: '', status: 'live', viewers: 12580, likes: 8960, created_at: now },
    { id: uuidv4(), shop_id: shops[2].id, title: '数码产品专场 限时特惠', cover: 'https://picsum.photos/400/300?random=51', stream_url: '', status: 'live', viewers: 8960, likes: 5620, created_at: now },
    { id: uuidv4(), shop_id: shops[3].id, title: '美食零食专场 买一送一', cover: 'https://picsum.photos/400/300?random=52', stream_url: '', status: 'live', viewers: 23450, likes: 15680, created_at: now }
  ];

  for (const live of lives) {
    await execute('INSERT INTO lives (id, shop_id, title, cover, stream_url, status, viewers, likes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [live.id, live.shop_id, live.title, live.cover, live.stream_url, live.status, live.viewers, live.likes, live.created_at]);
  }

  const dynamics = [
    { id: uuidv4(), shop_id: shops[0].id, content: '夏季新款连衣裙上新啦！轻薄透气，气质优雅，多色可选，限时特惠中...', images: JSON.stringify([`https://picsum.photos/400/400?random=60`]), product_id: null, likes: 258, comments: 56, created_at: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { id: uuidv4(), shop_id: shops[1].id, content: '家居好物推荐！这款收纳柜真的太好用了，四层大容量，承重强，安装简单...', images: JSON.stringify([`https://picsum.photos/400/400?random=61`]), product_id: null, likes: 189, comments: 32, created_at: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { id: uuidv4(), shop_id: shops[2].id, content: 'iPhone 15 Pro Max 限时补贴中！直降1000元，还送原装配件，数量有限...', images: JSON.stringify([`https://picsum.photos/400/400?random=62`]), product_id: null, likes: 856, comments: 156, created_at: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { id: uuidv4(), shop_id: shops[3].id, content: '阿克苏冰糖心苹果！脆甜多汁，产地直供，新鲜采摘，坏果包赔...', images: JSON.stringify([`https://picsum.photos/400/400?random=63`]), product_id: null, likes: 423, comments: 89, created_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss') }
  ];

  for (const d of dynamics) {
    await execute('INSERT INTO shop_dynamics (id, shop_id, content, images, product_id, likes, comments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [d.id, d.shop_id, d.content, d.images, d.product_id, d.likes, d.comments, d.created_at]);
  }

  const bcrypt = require('bcryptjs');
  const adminId = uuidv4();
  const adminPassword = bcrypt.hashSync('admin123', 10);
  await execute('INSERT INTO admin_users (id, username, password, created_at) VALUES (?, ?, ?, ?)',
    [adminId, 'admin', adminPassword, now]);

  console.log('种子数据已插入');
}

module.exports = {
  getDB,
  query,
  queryOne,
  execute,
  runTransaction,
  init
};
