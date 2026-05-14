const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dbPath = process.env.DB_PATH || 'data/app.sqlite'
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath, { verbose: console.log })

function upgradeDatabase() {
  try {
    const columns = db.prepare('PRAGMA table_info(users)').all()
    const hasAlipayOpenid = columns.some(c => c.name === 'alipay_openid')
    const hasWechatOpenid = columns.some(c => c.name === 'wechat_openid')
    
    if (!hasAlipayOpenid) {
      db.exec('ALTER TABLE users ADD COLUMN alipay_openid TEXT')
    }
    if (!hasWechatOpenid) {
      db.exec('ALTER TABLE users ADD COLUMN wechat_openid TEXT')
    }
    console.log('Database upgraded')
  } catch (err) {
    console.log('Upgrade skipped or error:', err.message)
  }
}

function initDatabase() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password TEXT,
        alipay_openid TEXT,
        wechat_openid TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        original_price REAL,
        description TEXT,
        images TEXT,
        specs TEXT,
        stock INTEGER DEFAULT 0,
        sales INTEGER DEFAULT 0,
        category_id INTEGER,
        store_id INTEGER,
        shipping_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        icon TEXT,
        sort_order INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        logo TEXT,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        quantity INTEGER DEFAULT 1,
        spec TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        order_no TEXT UNIQUE,
        status TEXT DEFAULT 'pending',
        total_amount REAL,
        shipping_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        price REAL,
        spec TEXT,
        FOREIGN KEY(order_id) REFERENCES orders(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        user_id INTEGER,
        rating INTEGER,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        user_id INTEGER,
        content TEXT,
        answer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `)
    console.log('Database tables created')
    initTestData()
  } catch (err) {
    console.error('Database init error:', err)
  }
}

function initTestData() {
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count
  if (categoryCount === 0) {
    const categories = [
      { name: '女装', icon: '👗' },
      { name: '男装', icon: '👔' },
      { name: '数码', icon: '📱' },
      { name: '家电', icon: '📺' },
      { name: '食品', icon: '🍎' },
      { name: '家居', icon: '🏠' },
      { name: '美妆', icon: '💄' },
      { name: '母婴', icon: '🍼' }
    ]
    const insertCategory = db.prepare('INSERT INTO categories (name, icon) VALUES (?, ?)')
    categories.forEach(cat => {
      insertCategory.run(cat.name, cat.icon)
    })
  }

  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get().count
  if (storeCount === 0) {
    db.prepare('INSERT INTO stores (name, logo, description) VALUES (?, ?, ?)')
      .run('官方旗舰店', '🏪', '官方认证店铺')
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count
  if (productCount === 0) {
    const products = [
      {
        name: '夏季新款连衣裙女韩版修身显瘦中长款A字裙',
        price: 199,
        original_price: 399,
        description: '优质面料，舒适透气，修身显瘦',
        images: JSON.stringify(['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=beautiful%20summer%20dress%20fashion%20product%20photo&image_size=square', 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=elegant%20woman%20wearing%20dress%20lifestyle&image_size=square']),
        specs: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
        stock: 100,
        sales: 2341,
        category_id: 1,
        store_id: 1,
        shipping_address: '广东省深圳市'
      },
      {
        name: 'Apple iPhone 15 Pro Max 256GB 原色钛金属',
        price: 9999,
        original_price: 10999,
        description: 'A17 Pro芯片，钛金属设计，专业相机系统',
        images: JSON.stringify(['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=iPhone%2015%20Pro%20Max%20smartphone%20product%20photo&image_size=square', 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=iPhone%20smartphone%20lifestyle%20photo&image_size=square']),
        specs: JSON.stringify(['256GB', '512GB', '1TB']),
        stock: 50,
        sales: 892,
        category_id: 3,
        store_id: 1,
        shipping_address: '上海市浦东新区'
      },
      {
        name: '男士休闲短袖T恤纯棉宽松圆领上衣',
        price: 89,
        original_price: 159,
        description: '100%纯棉，舒适透气，简约百搭',
        images: JSON.stringify(['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=mens%20casual%20t-shirt%20fashion%20product%20photo&image_size=square', 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=man%20wearing%20casual%20tshirt%20lifestyle&image_size=square']),
        specs: JSON.stringify(['M', 'L', 'XL', 'XXL', 'XXXL']),
        stock: 200,
        sales: 5678,
        category_id: 2,
        store_id: 1,
        shipping_address: '浙江省杭州市'
      },
      {
        name: '小米电视65英寸4K超高清智能电视',
        price: 3499,
        original_price: 4999,
        description: '4K超高清，MEMC运动补偿，远场语音',
        images: JSON.stringify(['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=65%20inch%20smart%20TV%20product%20photo%20modern%20design&image_size=square', 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=smart%20TV%20living%20room%20lifestyle&image_size=square']),
        specs: JSON.stringify(['55英寸', '65英寸', '75英寸', '85英寸']),
        stock: 30,
        sales: 156,
        category_id: 4,
        store_id: 1,
        shipping_address: '北京市朝阳区'
      },
      {
        name: '进口智利车厘子JJ级500g装',
        price: 129,
        original_price: 189,
        description: '新鲜采摘，果肉饱满，甜度高',
        images: JSON.stringify(['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20cherries%20food%20product%20photo&image_size=square', 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cherries%20in%20bowl%20lifestyle%20photo&image_size=square']),
        specs: JSON.stringify(['500g', '1kg', '2kg']),
        stock: 100,
        sales: 3421,
        category_id: 5,
        store_id: 1,
        shipping_address: '山东省青岛市'
      },
      {
        name: '雅诗兰黛小棕瓶精华液100ml',
        price: 899,
        original_price: 1090,
        description: '修护肌肤，紧致透亮，熬夜救星',
        images: JSON.stringify(['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=estee%20lauder%20serum%20bottle%20cosmetic%20product%20photo&image_size=square', 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=skincare%20serum%20beauty%20lifestyle%20photo&image_size=square']),
        specs: JSON.stringify(['30ml', '50ml', '100ml']),
        stock: 80,
        sales: 1892,
        category_id: 7,
        store_id: 1,
        shipping_address: '上海市静安区'
      }
    ]
    const insertProduct = db.prepare(`
      INSERT INTO products (name, price, original_price, description, images, specs, stock, sales, category_id, store_id, shipping_address) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    products.forEach(product => {
      insertProduct.run(
        product.name, product.price, product.original_price, product.description, 
        product.images, product.specs, product.stock, product.sales, 
        product.category_id, product.store_id, product.shipping_address
      )
    })
  }
}

initDatabase()
upgradeDatabase()

module.exports = db