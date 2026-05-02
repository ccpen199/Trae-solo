require('dotenv').config();
const db = require('./config/database');
const bcrypt = require('bcryptjs');

const initTables = () => {
  console.log('开始初始化数据库表...');

  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      phone TEXT,
      email TEXT,
      role TEXT DEFAULT 'buyer', -- buyer, seller, appraiser, customer_service, admin
      trust_score INTEGER DEFAULT 600,
      trust_level TEXT DEFAULT 'normal', -- poor, normal, good, excellent
      is_verified INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active', -- active, banned, frozen
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score);
  `);

  // 商品表
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      category TEXT,
      brand TEXT,
      model TEXT,
      condition TEXT, -- new, like_new, excellent, good, fair, poor
      images TEXT, -- JSON array
      location TEXT,
      is_express_delivery INTEGER DEFAULT 0,
      is_self_pickup INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending_review', -- pending_review, reviewing, on_sale, sold, removed, rejected
      view_count INTEGER DEFAULT 0,
      favorite_count INTEGER DEFAULT 0,
      ocr_result TEXT, -- Image-OCR识别结果
      brand_suggestion TEXT, -- 品牌建议
      reviewer_id INTEGER,
      review_comment TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
  `);

  // 订单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      product_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      price REAL NOT NULL,
      service_fee REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending_payment', -- pending_payment, paid, pending_shipment, shipped, pending_confirmation, completed, cancelled, disputed
      payment_method TEXT,
      payment_time DATETIME,
      escrow_status TEXT DEFAULT 'none', -- none, locked, releasing, released, refunding, refunded
      escrow_locked_at DATETIME,
      escrow_released_at DATETIME,
      shipment_method TEXT,
      tracking_number TEXT,
      shipped_at DATETIME,
      received_at DATETIME,
      completed_at DATETIME,
      cancelled_at DATETIME,
      cancel_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (seller_id) REFERENCES users(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
    CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
    CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
  `);

  // 聊天会话表
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      product_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      last_message TEXT,
      last_message_time DATETIME,
      unread_count_seller INTEGER DEFAULT 0,
      unread_count_buyer INTEGER DEFAULT 0,
      is_fraud_detected INTEGER DEFAULT 0,
      fraud_warning TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (seller_id) REFERENCES users(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_chat_sessions_product_id ON chat_sessions(product_id);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_seller_id ON chat_sessions(seller_id);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_buyer_id ON chat_sessions(buyer_id);
  `);

  // 聊天消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text', -- text, image, system
      is_read INTEGER DEFAULT 0,
      read_at DATETIME,
      is_flagged INTEGER DEFAULT 0,
      flag_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id),
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
  `);

  // 物流轨迹表
  db.exec(`
    CREATE TABLE IF NOT EXISTS logistics_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      tracking_number TEXT NOT NULL,
      carrier TEXT, -- 快递公司
      status TEXT DEFAULT 'pending', -- pending, in_transit, delivered, exception
      current_location TEXT,
      events TEXT, -- JSON array of events
      estimated_delivery DATETIME,
      actual_delivery DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_logistics_tracks_order_id ON logistics_tracks(order_id);
    CREATE INDEX IF NOT EXISTS idx_logistics_tracks_tracking_number ON logistics_tracks(tracking_number);
  `);

  // 鉴定记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS appraisals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      appraiser_id INTEGER,
      status TEXT DEFAULT 'pending', -- pending, in_progress, completed, rejected
      images TEXT, -- 鉴定图片
      description TEXT,
      brand_verified INTEGER DEFAULT 0,
      authenticity_score INTEGER,
      condition_assessment TEXT,
      value_estimate REAL,
      report_content TEXT,
      is_authentic INTEGER,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (appraiser_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_appraisals_order_id ON appraisals(order_id);
    CREATE INDEX IF NOT EXISTS idx_appraisals_product_id ON appraisals(product_id);
    CREATE INDEX IF NOT EXISTS idx_appraisals_status ON appraisals(status);
  `);

  // 纠纷记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispute_no TEXT UNIQUE NOT NULL,
      order_id INTEGER NOT NULL,
      initiator_id INTEGER NOT NULL,
      respondent_id INTEGER NOT NULL,
      type TEXT, -- quality, delivery, payment, other
      title TEXT NOT NULL,
      description TEXT,
      evidence TEXT, -- JSON array of evidence
      status TEXT DEFAULT 'pending', -- pending, investigating, mediating, resolved, closed
      handler_id INTEGER,
      mediation_result TEXT,
      resolution TEXT, -- refund, partial_refund, keep_item, other
      refund_amount REAL,
      is_satisfied_initiator INTEGER,
      is_satisfied_respondent INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      closed_at DATETIME,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (initiator_id) REFERENCES users(id),
      FOREIGN KEY (respondent_id) REFERENCES users(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_disputes_dispute_no ON disputes(dispute_no);
    CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
    CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
  `);

  // 评价表
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      reviewee_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      rating INTEGER NOT NULL, -- 1-5
      content TEXT,
      images TEXT,
      is_anonymous INTEGER DEFAULT 0,
      trust_impact INTEGER, -- 对信任分的影响
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (reviewee_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
  `);

  // 信任分变更记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS trust_score_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      review_id INTEGER,
      dispute_id INTEGER,
      change_type TEXT NOT NULL, -- order_complete, review_positive, review_negative, dispute_lost, dispute_won, system_adjust
      change_amount INTEGER NOT NULL,
      before_score INTEGER NOT NULL,
      after_score INTEGER NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (review_id) REFERENCES reviews(id),
      FOREIGN KEY (dispute_id) REFERENCES disputes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_trust_score_logs_user_id ON trust_score_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_trust_score_logs_order_id ON trust_score_logs(order_id);
  `);

  // 资金流水表
  db.exec(`
    CREATE TABLE IF NOT EXISTS fund_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_no TEXT UNIQUE NOT NULL,
      order_id INTEGER,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- payment, escrow_lock, escrow_release, refund, service_fee, withdrawal, deposit
      amount REAL NOT NULL,
      balance_before REAL,
      balance_after REAL,
      status TEXT DEFAULT 'pending', -- pending, completed, failed, cancelled
      related_transaction_no TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_fund_transactions_transaction_no ON fund_transactions(transaction_no);
    CREATE INDEX IF NOT EXISTS idx_fund_transactions_order_id ON fund_transactions(order_id);
    CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON fund_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON fund_transactions(type);
  `);

  // 审计日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trace_id TEXT NOT NULL,
      user_id INTEGER,
      username TEXT,
      role TEXT,
      module TEXT NOT NULL, -- product, order, chat, payment, user, appraisal, dispute, system
      action TEXT NOT NULL, -- create, update, delete, query, status_change
      resource_type TEXT,
      resource_id TEXT,
      old_value TEXT, -- JSON
      new_value TEXT, -- JSON
      description TEXT,
      ip_address TEXT,
      user_agent TEXT,
      request_path TEXT,
      request_method TEXT,
      status TEXT, -- success, failed
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_trace_id ON audit_logs(trace_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
  `);

  // 收藏表
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
  `);

  console.log('数据库表初始化完成！');
};

const initData = () => {
  console.log('开始初始化基础数据...');

  // 检查是否已有管理员
  const existingAdmin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    // 创建管理员
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, nickname, role, trust_score, trust_level, is_verified, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('admin', hashedPassword, '系统管理员', 'admin', 1000, 'excellent', 1, 'active');
    console.log('管理员账号创建成功: admin / admin123');

    // 创建测试用户 - 卖家
    const sellerPassword = bcrypt.hashSync('seller123', 10);
    insertUser.run('seller01', sellerPassword, '测试卖家', 'seller', 750, 'good', 1, 'active');
    console.log('测试卖家账号创建成功: seller01 / seller123');

    // 创建测试用户 - 买家
    const buyerPassword = bcrypt.hashSync('buyer123', 10);
    insertUser.run('buyer01', buyerPassword, '测试买家', 'buyer', 680, 'normal', 1, 'active');
    console.log('测试买家账号创建成功: buyer01 / buyer123');

    // 创建测试用户 - 鉴定师
    const appraiserPassword = bcrypt.hashSync('appraiser123', 10);
    insertUser.run('appraiser01', appraiserPassword, '张鉴定师', 'appraiser', 900, 'excellent', 1, 'active');
    console.log('测试鉴定师账号创建成功: appraiser01 / appraiser123');

    // 创建测试用户 - 客服
    const csPassword = bcrypt.hashSync('cs123456', 10);
    insertUser.run('cs01', csPassword, '客服小王', 'customer_service', 850, 'excellent', 1, 'active');
    console.log('测试客服账号创建成功: cs01 / cs123456');

    // 创建一些测试商品
    const insertProduct = db.prepare(`
      INSERT INTO products (seller_id, title, description, price, original_price, category, brand, model, condition, images, location, status, ocr_result, brand_suggestion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seller = db.prepare('SELECT * FROM users WHERE username = ?').get('seller01');
    
    if (seller) {
      // 测试商品1 - iPhone
      insertProduct.run(
        seller.id,
        'iPhone 14 Pro Max 256G 暗紫色',
        '自用iPhone 14 Pro Max，256G，暗紫色，购于2023年3月，无拆无修，电池健康度92%，配件齐全，包装盒在。',
        5999,
        9999,
        '数码产品',
        'Apple',
        'iPhone 14 Pro Max',
        'excellent',
        JSON.stringify(['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2014%20Pro%20Max%20dark%20purple%20smartphone&image_size=square_hd']),
        '北京市朝阳区',
        'on_sale',
        JSON.stringify({ detected_brand: 'Apple', model: 'iPhone 14 Pro Max', confidence: 0.98 }),
        '建议标价：5800-6200元，市场需求较高'
      );

      // 测试商品2 - 相机
      insertProduct.run(
        seller.id,
        '索尼 A7M4 全画幅微单相机 99新',
        '索尼A7M4机身，购于2023年6月，快门数不足2000，成色99新，配件齐全，有发票。',
        14500,
        16999,
        '数码产品',
        'Sony',
        'A7M4',
        'like_new',
        JSON.stringify(['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sony%20A7M4%20mirrorless%20camera&image_size=square_hd']),
        '上海市浦东新区',
        'on_sale',
        JSON.stringify({ detected_brand: 'Sony', model: 'A7M4', confidence: 0.95 }),
        '建议标价：14000-15000元，近期成交量大'
      );

      // 测试商品3 - 手表
      insertProduct.run(
        seller.id,
        '劳力士黑水鬼 116610LN 全套',
        '劳力士潜航者型系列116610LN-97200黑盘腕表，俗称黑水鬼，2020年保卡，全套配件齐全，原始品相。',
        98000,
        115000,
        '奢侈品',
        'Rolex',
        'Submariner 116610LN',
        'good',
        JSON.stringify(['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Rolex%20Submariner%20black%20watch&image_size=square_hd']),
        '深圳市南山区',
        'pending_review',
        JSON.stringify({ detected_brand: 'Rolex', model: 'Submariner', confidence: 0.88 }),
        '建议标价：95000-105000元，需要专业鉴定'
      );
    }

    console.log('测试商品创建成功！');
  } else {
    console.log('基础数据已存在，跳过初始化');
  }

  console.log('基础数据初始化完成！');
};

const main = () => {
  try {
    initTables();
    initData();
    console.log('\n========================================');
    console.log('数据库初始化完成！');
    console.log('========================================');
    console.log('\n测试账号：');
    console.log('  管理员:    admin / admin123');
    console.log('  卖家:      seller01 / seller123');
    console.log('  买家:      buyer01 / buyer123');
    console.log('  鉴定师:    appraiser01 / appraiser123');
    console.log('  客服:      cs01 / cs123456');
    console.log('\n数据库路径: ./data/app.sqlite');
    console.log('========================================\n');
    
    db.close();
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

main();
