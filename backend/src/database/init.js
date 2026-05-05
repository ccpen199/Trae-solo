const db = require('./index')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const dayjs = require('dayjs')

function initDatabase() {
  db.exec(`
    -- 管理员角色表
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      permissions TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 管理员表
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role_id TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    -- 供应商表
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      main_products TEXT,
      region TEXT,
      phone TEXT,
      contact TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 商品分类表
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );

    -- 品牌表
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      logo TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 商品表
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      brand_id TEXT,
      category_id TEXT,
      supplier_id TEXT,
      cost_price DECIMAL(10,2) NOT NULL,
      sell_price DECIMAL(10,2) NOT NULL,
      keywords TEXT,
      images TEXT,
      is_commentable INTEGER DEFAULT 1,
      status INTEGER DEFAULT 1,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- 库存表
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL UNIQUE,
      stock_quantity INTEGER DEFAULT 0,
      warning_line INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- C端用户表
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      account TEXT NOT NULL UNIQUE,
      gender INTEGER DEFAULT 0,
      address TEXT,
      user_type INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 订单表
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL,
      order_type INTEGER DEFAULT 1,
      total_amount DECIMAL(10,2) NOT NULL,
      status INTEGER DEFAULT 1,
      shipping_address TEXT,
      receiver_name TEXT,
      receiver_phone TEXT,
      logistics_no TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    -- 订单明细表
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- 物流记录表
    CREATE TABLE IF NOT EXISTS logistics (
      id TEXT PRIMARY KEY,
      logistics_no TEXT NOT NULL,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT,
      location TEXT,
      operator TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    -- 采购单表
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      purchase_no TEXT NOT NULL UNIQUE,
      supplier_id TEXT NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status INTEGER DEFAULT 1,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- 采购明细表
    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchase_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- 内容表（文案、活动、优惠券）
    CREATE TABLE IF NOT EXISTS contents (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      image TEXT,
      link TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      start_time DATETIME,
      end_time DATETIME,
      coupon_code TEXT,
      discount_amount DECIMAL(10,2),
      min_amount DECIMAL(10,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 消息通知表
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      target_role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 商品类型表
    CREATE TABLE IF NOT EXISTS product_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get().count
  if (roleCount === 0) {
    const roles = [
      { id: uuidv4(), name: 'super_admin', display_name: '超级管理员', permissions: JSON.stringify(['all']) },
      { id: uuidv4(), name: 'supplier_dev', display_name: '供应商开发', permissions: JSON.stringify(['supplier:read', 'supplier:write']) },
      { id: uuidv4(), name: 'purchase', display_name: '采购', permissions: JSON.stringify(['purchase:read', 'purchase:write', 'inventory:read']) },
      { id: uuidv4(), name: 'product_ops', display_name: '商品运营', permissions: JSON.stringify(['product:read', 'product:write', 'inventory:read']) },
      { id: uuidv4(), name: 'content_ops', display_name: '内容运营', permissions: JSON.stringify(['content:read', 'content:write']) },
      { id: uuidv4(), name: 'user_ops', display_name: '用户运营', permissions: JSON.stringify(['user:read', 'user:write', 'order:read']) }
    ]

    const insertRole = db.prepare(`
      INSERT INTO roles (id, name, display_name, permissions)
      VALUES (?, ?, ?, ?)
    `)

    roles.forEach(role => {
      insertRole.run(role.id, role.name, role.display_name, role.permissions)
    })

    const superAdminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('super_admin')
    const hashedPassword = bcrypt.hashSync('admin123', 10)
    
    db.prepare(`
      INSERT INTO admins (id, username, password, name, role_id, email, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'admin', hashedPassword, '系统管理员', superAdminRole.id, 'admin@example.com', '13800138000', 1)

    const categories = [
      { id: uuidv4(), name: '电子产品', parent_id: null, sort_order: 1 },
      { id: uuidv4(), name: '服装服饰', parent_id: null, sort_order: 2 },
      { id: uuidv4(), name: '食品饮料', parent_id: null, sort_order: 3 },
      { id: uuidv4(), name: '家居用品', parent_id: null, sort_order: 4 },
      { id: uuidv4(), name: '美妆个护', parent_id: null, sort_order: 5 }
    ]

    const insertCategory = db.prepare(`
      INSERT INTO categories (id, name, parent_id, sort_order)
      VALUES (?, ?, ?, ?)
    `)

    categories.forEach(cat => {
      insertCategory.run(cat.id, cat.name, cat.parent_id, cat.sort_order)
    })

    const brands = [
      { id: uuidv4(), name: '华为', logo: null },
      { id: uuidv4(), name: '小米', logo: null },
      { id: uuidv4(), name: '苹果', logo: null },
      { id: uuidv4(), name: '三星', logo: null },
      { id: uuidv4(), name: '耐克', logo: null }
    ]

    const insertBrand = db.prepare(`
      INSERT INTO brands (id, name, logo)
      VALUES (?, ?, ?)
    `)

    brands.forEach(brand => {
      insertBrand.run(brand.id, brand.name, brand.logo)
    })

    const suppliers = [
      { id: uuidv4(), code: 'SUP001', name: '深圳电子科技有限公司', main_products: '手机、平板、电脑', region: '广东省深圳市', phone: '0755-12345678', contact: '张经理', status: 1 },
      { id: uuidv4(), code: 'SUP002', name: '广州服装贸易公司', main_products: '男装、女装、童装', region: '广东省广州市', phone: '020-87654321', contact: '李经理', status: 1 },
      { id: uuidv4(), code: 'SUP003', name: '杭州食品有限公司', main_products: '零食、饮料、生鲜', region: '浙江省杭州市', phone: '0571-11112222', contact: '王经理', status: 1 }
    ]

    const insertSupplier = db.prepare(`
      INSERT INTO suppliers (id, code, name, main_products, region, phone, contact, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    suppliers.forEach(sup => {
      insertSupplier.run(sup.id, sup.code, sup.name, sup.main_products, sup.region, sup.phone, sup.contact, sup.status)
    })

    const huaweiBrand = db.prepare('SELECT id FROM brands WHERE name = ?').get('华为')
    const xiaomiBrand = db.prepare('SELECT id FROM brands WHERE name = ?').get('小米')
    const appleBrand = db.prepare('SELECT id FROM brands WHERE name = ?').get('苹果')
    const electronicsCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('电子产品')
    const sup1 = db.prepare('SELECT id FROM suppliers WHERE code = ?').get('SUP001')

    const products = [
      { id: uuidv4(), name: '华为Mate 60 Pro', code: 'PROD001', brand_id: huaweiBrand.id, category_id: electronicsCat.id, supplier_id: sup1.id, cost_price: 4999.00, sell_price: 6999.00, keywords: '华为,手机,旗舰', status: 1 },
      { id: uuidv4(), name: '小米14 Ultra', code: 'PROD002', brand_id: xiaomiBrand.id, category_id: electronicsCat.id, supplier_id: sup1.id, cost_price: 3999.00, sell_price: 5999.00, keywords: '小米,手机,摄影', status: 1 },
      { id: uuidv4(), name: 'iPhone 15 Pro Max', code: 'PROD003', brand_id: appleBrand.id, category_id: electronicsCat.id, supplier_id: sup1.id, cost_price: 7999.00, sell_price: 9999.00, keywords: '苹果,手机,旗舰', status: 1 }
    ]

    const insertProduct = db.prepare(`
      INSERT INTO products (id, name, code, brand_id, category_id, supplier_id, cost_price, sell_price, keywords, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    products.forEach(prod => {
      insertProduct.run(prod.id, prod.name, prod.code, prod.brand_id, prod.category_id, prod.supplier_id, prod.cost_price, prod.sell_price, prod.keywords, prod.status)
      
      db.prepare(`
        INSERT INTO inventory (id, product_id, stock_quantity, warning_line)
        VALUES (?, ?, ?, ?)
      `).run(uuidv4(), prod.id, Math.floor(Math.random() * 50) + 5, 10)
    })

    const customers = [
      { id: uuidv4(), username: '张三', account: 'zhangsan001', gender: 1, address: '北京市朝阳区xxx街道', user_type: 1 },
      { id: uuidv4(), username: '李四', account: 'lisi001', gender: 1, address: '上海市浦东新区xxx路', user_type: 1 },
      { id: uuidv4(), username: '王五', account: 'wangwu001', gender: 2, address: '广州市天河区xxx号', user_type: 2 }
    ]

    const insertCustomer = db.prepare(`
      INSERT INTO customers (id, username, account, gender, address, user_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    customers.forEach(cust => {
      insertCustomer.run(cust.id, cust.username, cust.account, cust.gender, cust.address, cust.user_type)
    })

    const cust1 = customers[0]
    const prod1 = products[0]
    const orderNo = 'ORD' + dayjs().format('YYYYMMDD') + '0001'

    const orderId = uuidv4()
    db.prepare(`
      INSERT INTO orders (id, order_no, customer_id, order_type, total_amount, status, shipping_address, receiver_name, receiver_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, orderNo, cust1.id, 1, 6999.00, 1, cust1.address, cust1.username, '13800000001')

    db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, product_code, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), orderId, prod1.id, prod1.name, prod1.code, 1, prod1.sell_price, prod1.sell_price)

    const contents = [
      { id: uuidv4(), type: 'article', title: '新品上市：华为Mate 60 Pro', content: '华为最新旗舰手机，搭载麒麟芯片，性能强劲', status: 1, sort_order: 1 },
      { id: uuidv4(), type: 'activity', title: '双11大促销', content: '全场商品8折起，满1000减100', status: 1, sort_order: 1, start_time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), end_time: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss') },
      { id: uuidv4(), type: 'coupon', title: '新人优惠券', content: '新用户专享，满200减50', status: 1, sort_order: 1, coupon_code: 'NEW50', discount_amount: 50.00, min_amount: 200.00 }
    ]

    const insertContent = db.prepare(`
      INSERT INTO contents (id, type, title, content, sort_order, status, start_time, end_time, coupon_code, discount_amount, min_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    contents.forEach(c => {
      insertContent.run(c.id, c.type, c.title, c.content, c.sort_order, c.status, c.start_time, c.end_time, c.coupon_code, c.discount_amount, c.min_amount)
    })

    const notifications = [
      { id: uuidv4(), title: '库存预警', content: 'iPhone 15 Pro Max 库存不足，请及时补货', type: 'inventory', target_role: 'purchase' },
      { id: uuidv4(), title: '新订单提醒', content: '您有一笔新订单等待处理，订单号：ORD202401010001', type: 'order', target_role: 'product_ops' }
    ]

    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, title, content, type, target_role)
      VALUES (?, ?, ?, ?, ?)
    `)

    notifications.forEach(n => {
      insertNotification.run(n.id, n.title, n.content, n.type, n.target_role)
    })

    const productTypes = [
      { id: uuidv4(), name: '实体商品', description: '需要物流配送的实物商品' },
      { id: uuidv4(), name: '虚拟商品', description: '无需物流配送的虚拟商品，如充值卡、会员等' },
      { id: uuidv4(), name: '服务商品', description: '提供服务类的商品' }
    ]

    const insertProductType = db.prepare(`
      INSERT INTO product_types (id, name, description)
      VALUES (?, ?, ?)
    `)

    productTypes.forEach(pt => {
      insertProductType.run(pt.id, pt.name, pt.description)
    })
  }

  console.log('数据库初始化完成')
}

module.exports = initDatabase
