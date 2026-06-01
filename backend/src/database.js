import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT,
      avatar TEXT,
      password TEXT NOT NULL,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image TEXT NOT NULL,
      link TEXT,
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      cover TEXT,
      category TEXT NOT NULL,
      author TEXT,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      star INTEGER DEFAULT 3,
      rating REAL DEFAULT 4.5,
      price REAL NOT NULL,
      images TEXT,
      description TEXT,
      facilities TEXT,
      location TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      area REAL,
      bed_type TEXT,
      max_guests INTEGER DEFAULT 2,
      breakfast INTEGER DEFAULT 0,
      images TEXT,
      stock INTEGER DEFAULT 10,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      images TEXT,
      description TEXT,
      specs TEXT,
      stock INTEGER DEFAULT 100,
      sales INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS hotel_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      hotel_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      guest_name TEXT NOT NULL,
      guest_phone TEXT NOT NULL,
      rooms INTEGER DEFAULT 1,
      price REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'unpaid',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (hotel_id) REFERENCES hotels(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS product_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      items TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'unpaid',
      address TEXT,
      receiver_name TEXT,
      receiver_phone TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      images TEXT,
      category TEXT DEFAULT 'strategy',
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency TEXT UNIQUE NOT NULL,
      rate REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    db.exec(`
      INSERT INTO users (phone, nickname, password, balance) VALUES
      ('13800000001', '旅行者小明', '123456', 10000),
      ('13800000002', '澳门达人', '123456', 5000);

      INSERT INTO banners (title, image, sort) VALUES
      ('澳门威尼斯人度假村', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 1),
      ('澳门塔蹦极体验', 'https://images.unsplash.com/photo-1540202404-a2f29016be53?w=800', 2),
      ('澳门美食节盛大开幕', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', 3);

      INSERT INTO articles (title, content, cover, category, author) VALUES
      ('澳门旅游完全攻略：2024最新版', '澳门是一个融合中西文化的独特城市，既有葡式建筑的浪漫，又有东方的繁华。本文将为您详细介绍澳门的必去景点、美食推荐、购物指南和实用贴士。\n\n## 必去景点\n1. **大三巴牌坊** - 澳门的标志性建筑\n2. **澳门塔** - 可体验蹦极和观光\n3. **威尼斯人度假村** - 仿威尼斯水城的度假胜地\n4. **议事亭前地** - 历史城区的中心\n\n## 美食推荐\n- 葡式蛋挞\n- 猪扒包\n- 马介休\n- 木糠布甸', 'https://images.unsplash.com/photo-1540202404-a2f29016be53?w=600', '攻略', '澳门旅游局'),
      ('澳门美食地图：从街头小吃到米其林', '澳门是美食天堂，无论是地道的葡国菜还是精致的粤菜，都能让您大饱口福。让我们一起探索澳门的美食世界。', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600', '美食', '美食达人'),
      ('澳门购物指南：哪里买最划算？', '澳门不仅有繁华的赌场，还有众多的购物中心和免税店。本文将为您推荐最佳购物地点和省钱技巧。', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600', '购物', '购物达人');

      INSERT INTO hotels (name, address, star, rating, price, images, description, facilities) VALUES
      ('澳门威尼斯人酒店', '澳门路氹金光大道望德圣母湾大马路', 5, 4.8, 1580, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600', '威尼斯人酒店是澳门最具特色的度假村酒店，内部仿威尼斯水城建造，可乘坐贡多拉游船。酒店拥有超过3000间豪华套房，是亚洲最大的单幢式酒店。', '泳池,健身房,餐厅,赌场,购物中心,SPA'),
      ('澳门巴黎人酒店', '澳门路氹金光大道连贯公路', 5, 4.7, 1380, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600', '巴黎人酒店以巴黎为主题，按原建筑物二分之一比例兴建的巴黎铁塔，是澳门的新地标。酒店提供近3000间客房和套房。', '泳池,健身房,餐厅,赌场,购物中心,SPA'),
      ('澳门永利皇宫酒店', '澳门路氹体育馆大马路', 5, 4.9, 2580, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600', '永利皇宫是澳门最奢华的酒店之一，拥有壮观的表演湖和缆车，客房装饰豪华典雅。', '泳池,健身房,餐厅,赌场,SPA,缆车');

      INSERT INTO rooms (hotel_id, name, price, original_price, area, bed_type, max_guests, breakfast, stock) VALUES
      (1, '豪华皇室套房', 1580, 1880, 70, '大床', 2, 1, 10),
      (1, '豪华贝丽套房', 1780, 2080, 75, '双床', 3, 1, 8),
      (2, '埃菲尔套房', 1380, 1680, 65, '大床', 2, 0, 15),
      (2, '里昂套房', 1580, 1880, 70, '双床', 3, 1, 10),
      (3, '皇宫套房', 2580, 3080, 90, '大床', 2, 1, 5),
      (3, '湖景套房', 2980, 3580, 100, '大床', 2, 1, 3);

      INSERT INTO products (name, category, price, original_price, images, description, specs, stock, sales) VALUES
      ('澳门钜记杏仁饼 礼盒装', '美食特产', 128, 158, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', '澳门最著名的伴手礼，精选优质杏仁制作，口感酥脆，香气四溢。礼盒装内含24件独立包装，送礼自用两相宜。', '480g/盒，24件独立包装', 500, 1280),
      ('澳门葡式蛋挞 6个装', '美食特产', 68, 88, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', '正宗澳门葡式蛋挞，外酥内嫩，蛋液香浓，是澳门必尝的经典美食。冷链配送，新鲜到家。', '6个/盒，冷链配送', 300, 856),
      ('澳门旅游塔门票', '景点门票', 168, 198, 'https://images.unsplash.com/photo-1540202404-a2f29016be53?w=400', '澳门旅游塔58层观光层门票，可360度俯瞰澳门全景，还能观赏蹦极表演。', '电子票，有效期30天', 1000, 2560),
      ('澳门威尼斯人贡多拉船票', '景点门票', 118, 138, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', '威尼斯人贡多拉游船体验，意大利船夫划船，欣赏室内运河美景。每船可坐4人。', '电子票，需预约', 800, 1890),
      ('澳门特色冰箱贴套装', '纪念品', 38, 58, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400', '澳门特色纪念品套装，包含大三巴、澳门塔、葡式蛋挞等造型冰箱贴，是带回家的完美纪念品。', '5件/套，树脂材质', 1000, 3200),
      ('澳门猪扒包 2个装', '美食特产', 58, 78, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', '正宗澳门猪扒包，外酥内软的面包配上多汁猪扒，是澳门最受欢迎的街头美食。', '2个/装，真空包装', 400, 1560);

      INSERT INTO exchange_rates (currency, rate) VALUES
      ('MOP', 1.00),
      ('HKD', 1.03),
      ('CNY', 1.15),
      ('USD', 8.05),
      ('EUR', 8.75);

      INSERT INTO posts (user_id, title, content, category, like_count, comment_count, view_count) VALUES
      (1, '第一次去澳门，这样玩就对了！', '作为一个第一次去澳门的游客，我做了很多功课，最后整理出这篇超实用攻略。希望对大家有帮助！\n\n第一天：大三巴 → 议事亭前地 → 玫瑰堂 → 澳门塔\n第二天：威尼斯人 → 巴黎人 → 伦敦人\n第三天：官也街 → 龙环葡韵 → 返程', 'strategy', 156, 32, 2580),
      (2, '澳门本地人私藏的美食小店', '作为澳门本地人，我来分享一些游客不知道的美食小店。这些店虽然不大，但是味道绝对正宗！\n\n1. 礼记雪糕 - 百年老店\n2. 义顺牛奶公司 - 双皮奶一绝\n3. 荣记豆腐面食 - 早餐首选', 'qa', 234, 56, 3420),
      (1, '澳门拍照打卡圣地推荐', '澳门有太多适合拍照的地方了！这次去了几个超级出片的地方，分享给大家~\n\n1. 大三巴侧面楼梯\n2. 巴黎人铁塔前草坪\n3. 官也街彩色房子\n4. 威尼斯人运河', 'strategy', 189, 45, 2890);
    `);
  }
}

export default db;
