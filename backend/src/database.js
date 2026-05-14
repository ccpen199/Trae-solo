const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      real_name TEXT,
      id_card TEXT,
      is_verified INTEGER DEFAULT 0,
      balance REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS appliances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      description TEXT,
      images TEXT,
      daily_rent REAL NOT NULL,
      deposit REAL NOT NULL,
      location TEXT,
      latitude REAL,
      longitude REAL,
      condition TEXT CHECK(condition IN ('new', 'like_new', 'used')) DEFAULT 'used',
      status TEXT CHECK(status IN ('available', 'rented', 'maintenance')) DEFAULT 'available',
      owner_id INTEGER,
      views INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      appliance_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      daily_rent REAL NOT NULL,
      deposit REAL NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'one_time',
      status TEXT CHECK(status IN ('pending', 'active', 'completed', 'cancelled', 'sublet')) DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (appliance_id) REFERENCES appliances(id)
    );

    CREATE TABLE IF NOT EXISTS sublets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_rental_id INTEGER NOT NULL,
      appliance_id INTEGER NOT NULL,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      images TEXT,
      status TEXT CHECK(status IN ('available', 'pending', 'completed', 'cancelled')) DEFAULT 'available',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (original_rental_id) REFERENCES rentals(id),
      FOREIGN KEY (appliance_id) REFERENCES appliances(id),
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      appliance_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, appliance_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (appliance_id) REFERENCES appliances(id)
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image TEXT,
      link TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      appliance_id INTEGER,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id),
      FOREIGN KEY (appliance_id) REFERENCES appliances(id)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const seedData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (phone, password, nickname, avatar, real_name, id_card, is_verified, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertUser.run('13800138000', hashedPassword, '测试用户', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1', '张三', '110101199001011234', 1, 5000);
    insertUser.run('13800138001', hashedPassword, '未实名用户', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2', null, null, 0, 1000);
    
    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (username, password, role)
      VALUES (?, ?, ?)
    `);
    insertAdmin.run('admin', hashedPassword, 'admin');
  }

  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
    insertCategory.run('空调', '❄️', 1);
    insertCategory.run('冰箱', '🧊', 2);
    insertCategory.run('洗衣机', '🧺', 3);
    insertCategory.run('电视', '📺', 4);
    insertCategory.run('微波炉', '🍳', 5);
    insertCategory.run('热水器', '🔥', 6);
    insertCategory.run('吸尘器', '🧹', 7);
    insertCategory.run('其他', '📦', 8);
  }

  const applianceCount = db.prepare('SELECT COUNT(*) as count FROM appliances').get();
  if (applianceCount.count === 0) {
    const insertAppliance = db.prepare(`
      INSERT INTO appliances (name, category_id, description, images, daily_rent, deposit, location, latitude, longitude, condition, status, owner_id, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const appliances = [
      { name: '格力壁挂式空调 1.5匹', category_id: 1, description: '格力大1.5匹变频冷暖空调，一级能效，节能省电。适合15-22平米房间使用。', images: JSON.stringify(['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gree%20wall%20mounted%20air%20conditioner%201.5hp%20white%20modern%20home&image_size=square', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=air%20conditioner%20remote%20control&image_size=square']), daily_rent: 15, deposit: 500, location: '北京市朝阳区望京', latitude: 39.99, longitude: 116.48, condition: 'like_new', status: 'available', owner_id: 1, views: 234 },
      { name: '海尔三门冰箱 216升', category_id: 2, description: '海尔216升三门冰箱，中门软冷冻，智能温控，静音运行。', images: JSON.stringify(['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=haier%20three%20door%20refrigerator%20216L%20silver%20modern&image_size=square']), daily_rent: 12, deposit: 800, location: '北京市海淀区中关村', latitude: 39.98, longitude: 116.31, condition: 'used', status: 'available', owner_id: 1, views: 189 },
      { name: '小天鹅滚筒洗衣机 8kg', category_id: 3, description: '小天鹅8公斤滚筒洗衣机，BLDC变频电机，高温杀菌，智能投放。', images: JSON.stringify(['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=little%20swan%20front%20loading%20washing%20machine%208kg%20white&image_size=square']), daily_rent: 10, deposit: 600, location: '北京市西城区金融街', latitude: 39.92, longitude: 116.36, condition: 'new', status: 'available', owner_id: 1, views: 156 },
      { name: '小米智能电视 55英寸', category_id: 4, description: '小米55英寸4K超高清智能电视，杜比音效，PatchWall人工智能系统。', images: JSON.stringify(['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=xiaomi%20smart%20tv%2055%20inch%204k%20ultra%20hd%20modern%20living%20room&image_size=square']), daily_rent: 18, deposit: 1200, location: '北京市东城区东直门', latitude: 39.94, longitude: 116.43, condition: 'like_new', status: 'available', owner_id: 1, views: 312 },
      { name: '美的微波炉 23升', category_id: 5, description: '美的23升微波炉，智能菜单，一级能效，平板加热。', images: JSON.stringify(['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=midea%20microwave%20oven%2023L%20black%20kitchen%20appliance&image_size=square']), daily_rent: 5, deposit: 200, location: '北京市丰台区丽泽', latitude: 39.85, longitude: 116.31, condition: 'used', status: 'available', owner_id: 1, views: 98 },
      { name: 'A.O.史密斯电热水器 60升', category_id: 6, description: 'A.O.史密斯60升电热水器，金圭内胆，智能预约，一级能效。', images: JSON.stringify(['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ao%20smith%20electric%20water%20heater%2060L%20white%20bathroom&image_size=square']), daily_rent: 8, deposit: 700, location: '北京市通州区运河', latitude: 39.91, longitude: 116.66, condition: 'new', status: 'available', owner_id: 1, views: 145 },
      { name: '戴森无线吸尘器 V15', category_id: 7, description: '戴森V15无线手持吸尘器，激光探测，智能感应，强劲吸力。', images: JSON.stringify(['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dyson%20v15%20cordless%20vacuum%20cleaner%20silver%20modern&image_size=square']), daily_rent: 20, deposit: 1500, location: '北京市朝阳区三里屯', latitude: 39.93, longitude: 116.45, condition: 'like_new', status: 'available', owner_id: 1, views: 267 },
      { name: '美的空调 2匹柜机', category_id: 1, description: '美的2匹变频柜机空调，一级能效，智能控温，适合30-45平米客厅。', images: JSON.stringify(['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=midea%20floor%20standing%20air%20conditioner%202hp%20white%20modern&image_size=square']), daily_rent: 25, deposit: 1000, location: '北京市朝阳区国贸', latitude: 39.91, longitude: 116.47, condition: 'used', status: 'available', owner_id: 1, views: 198 }
    ];

    appliances.forEach(app => {
      insertAppliance.run(app.name, app.category_id, app.description, app.images, app.daily_rent, app.deposit, app.location, app.latitude, app.longitude, app.condition, app.status, app.owner_id, app.views);
    });
  }

  const bannerCount = db.prepare('SELECT COUNT(*) as count FROM banners').get();
  if (bannerCount.count === 0) {
    const insertBanner = db.prepare('INSERT INTO banners (title, image, link, sort_order, is_active) VALUES (?, ?, ?, ?, ?)');
    insertBanner.run('新用户首单立减50元', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=promotional%20banner%20appliance%20rental%20discount%2050%20yuan%20orange%20theme&image_size=landscape_16_9', '/category', 1, 1);
    insertBanner.run('夏季空调租赁特惠', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=summer%20air%20conditioner%20rental%20promotion%20banner%20blue%20cool&image_size=landscape_16_9', '/category/1', 2, 1);
    insertBanner.run('实名认证享押金减免', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=identity%20verification%20deposit%20reduction%20promotion%20green%20trust&image_size=landscape_16_9', '/settings/verify', 3, 1);
  }
};

module.exports = {
  db,
  initTables,
  seedData
};
