const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.resolve(__dirname, '../../data/app.sqlite')
let db = null

const init = () => {
  return new Promise((resolve, reject) => {
    try {
      db = new Database(dbPath)
      createTables().then(resolve).catch(reject)
    } catch (err) {
      reject(err)
    }
  })
}

const createTables = () => {
  return new Promise((resolve, reject) => {
    try {
      const sql = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT UNIQUE NOT NULL,
          password TEXT,
          nickname TEXT,
          avatar TEXT,
          taobao_openid TEXT,
          alipay_openid TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS addresses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          province TEXT,
          city TEXT,
          district TEXT,
          detail TEXT,
          is_default INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          parent_id INTEGER DEFAULT 0,
          sort_order INTEGER DEFAULT 0,
          icon TEXT
        );
        
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category_id INTEGER,
          price REAL NOT NULL,
          original_price REAL,
          image TEXT,
          description TEXT,
          stock INTEGER DEFAULT 0,
          sales INTEGER DEFAULT 0,
          is_new INTEGER DEFAULT 0,
          is_hot INTEGER DEFAULT 0,
          barcode TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        );
        
        CREATE TABLE IF NOT EXISTS carts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
        );
        
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          order_no TEXT UNIQUE NOT NULL,
          status TEXT DEFAULT 'pending',
          total_amount REAL NOT NULL,
          address_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (address_id) REFERENCES addresses(id)
        );
        
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
        );
        
        CREATE TABLE IF NOT EXISTS stores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT,
          longitude REAL,
          latitude REAL,
          phone TEXT,
          business_hours TEXT
        );
        
        CREATE TABLE IF NOT EXISTS ads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          image TEXT,
          link TEXT,
          sort_order INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
      
      db.exec(sql)
      insertInitialData().then(resolve).catch(reject)
    } catch (err) {
      reject(err)
    }
  })
}

const insertInitialData = () => {
  return new Promise((resolve, reject) => {
    try {
      const count = db.prepare('SELECT COUNT(*) as count FROM categories').get()
      if (count.count > 0) {
        resolve()
        return
      }
      
      const insertSql = `
        INSERT INTO categories (name, parent_id, sort_order, icon) VALUES
        ('蔬菜水果', 0, 1, '🍅'),
        ('肉禽蛋品', 0, 2, '🥩'),
        ('海鲜水产', 0, 3, '🦐'),
        ('乳品烘焙', 0, 4, '🥛'),
        ('粮油调味', 0, 5, '🍚'),
        ('休闲零食', 0, 6, '🍪'),
        ('酒水饮料', 0, 7, '🍺'),
        ('日用百货', 0, 8, '🧴');
        
        INSERT INTO products (name, category_id, price, original_price, image, description, stock, sales, is_new, is_hot, barcode) VALUES
        ('有机西红柿', 1, 12.8, 15.8, 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20organic%20tomatoes%20on%20white%20background&image_size=square', '新鲜有机西红柿，口感酸甜', 100, 256, 1, 1, '6901234567890'),
        ('土鸡蛋', 2, 28.8, 32.8, 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20farm%20eggs%20in%20basket&image_size=square', '农家散养土鸡蛋，营养丰富', 50, 189, 0, 1, '6901234567891'),
        ('鲜活基围虾', 3, 45.8, 58.8, 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20live%20shrimp%20on%20ice&image_size=square', '当日捕捞鲜活基围虾', 30, 123, 1, 1, '6901234567892'),
        ('进口牛奶', 4, 59.9, 69.9, 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=imported%20milk%20bottle%20on%20white&image_size=square', '新西兰进口纯牛奶', 80, 456, 0, 1, '6901234567893'),
        ('五常大米', 5, 68.0, 78.0, 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=premium%20rice%20bag%205kg&image_size=square', '黑龙江五常稻花香大米', 60, 234, 0, 0, '6901234567894'),
        ('坚果礼盒', 6, 88.0, 108.0, 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=mixed%20nuts%20gift%20box&image_size=square', '精选坚果礼盒装', 40, 89, 1, 0, '6901234567895'),
        ('青岛啤酒', 7, 58.0, 68.0, 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=Tsingtao%20beer%20bottles&image_size=square', '青岛经典啤酒6瓶装', 100, 567, 0, 1, '6901234567896'),
        ('洗衣液', 8, 35.8, 45.8, 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=laundry%20detergent%20bottle&image_size=square', '高效去污洗衣液', 70, 321, 0, 0, '6901234567897'),
        ('新鲜黄瓜', 1, 6.8, 8.8, 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20cucumbers%20on%20white&image_size=square', '清脆爽口黄瓜', 120, 189, 0, 0, '6901234567898'),
        ('黑猪五花肉', 2, 38.8, 45.8, 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20pork%20belly%20slices&image_size=square', '黑猪肉五花肉', 40, 156, 1, 1, '6901234567899');
        
        INSERT INTO stores (name, address, longitude, latitude, phone, business_hours) VALUES
        ('盒马鲜生望京店', '北京市朝阳区望京街9号望京SOHO', 116.4730, 39.9923, '400-888-8888', '09:00-22:00'),
        ('盒马鲜生中关村店', '北京市海淀区中关村大街15号', 116.3198, 39.9842, '400-888-8888', '09:00-22:00'),
        ('盒马鲜生国贸店', '北京市朝阳区建国门外大街1号', 116.4336, 39.9042, '400-888-8888', '09:00-22:00');
        
        INSERT INTO ads (title, image, link, sort_order, is_active) VALUES
        ('新人专享', 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=hema%20fresh%20new%20user%20promotion%20banner&image_size=landscape_16_9', '/promotion/newuser', 1, 1),
        ('限时特惠', 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=limited%20time%20sale%20banner%20colorful&image_size=landscape_16_9', '/promotion/sale', 2, 1),
        ('爆款推荐', 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=popular%20products%20recommendation%20banner&image_size=landscape_16_9', '/products/hot', 3, 1);
      `
      
      db.exec(insertSql)
      resolve()
    } catch (err) {
      reject(err)
    }
  })
}

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql)
      const rows = stmt.all(...params)
      resolve(rows)
    } catch (err) {
      reject(err)
    }
  })
}

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql)
      const row = stmt.get(...params)
      resolve(row)
    } catch (err) {
      reject(err)
    }
  })
}

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql)
      const result = stmt.run(...params)
      resolve({ lastID: result.lastInsertRowid, changes: result.changes })
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = {
  init,
  query,
  get,
  run
}