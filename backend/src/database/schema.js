const initSchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      password TEXT DEFAULT '123456',
      store_id TEXT,
      brand_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      brand_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      category TEXT,
      price REAL,
      stock INTEGER DEFAULT 0,
      model_3d_id TEXT,
      model_2d_url TEXT,
      brand_id TEXT,
      store_id TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS models_3d (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      file_url TEXT,
      file_type TEXT,
      product_id TEXT,
      is_locked INTEGER DEFAULT 0,
      locked_by TEXT,
      locked_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      consumer_id TEXT NOT NULL,
      consumer_name TEXT,
      status TEXT NOT NULL,
      camera_info TEXT,
      camera_attachments TEXT,
      responsible_person TEXT,
      expected_time TEXT,
      total_amount REAL DEFAULT 0,
      brand_id TEXT,
      store_id TEXT,
      member_level TEXT DEFAULT 'normal',
      is_reverse INTEGER DEFAULT 0,
      original_order_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_details (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT,
      sku TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price REAL,
      subtotal REAL,
      tryon_result TEXT,
      tryon_screenshot_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS status_flows (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      operator_id TEXT,
      operator_name TEXT,
      operator_role TEXT,
      action TEXT,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      order_detail_id TEXT,
      file_name TEXT,
      file_url TEXT,
      file_type TEXT,
      file_size INTEGER,
      uploaded_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments_approvals (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      operator_id TEXT,
      operator_name TEXT,
      operator_role TEXT,
      action TEXT,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_role TEXT,
      order_id TEXT,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT,
      is_read INTEGER DEFAULT 0,
      read_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_role TEXT,
      order_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      due_time TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      order_id TEXT,
      operator_id TEXT,
      operator_name TEXT,
      operator_role TEXT,
      detail TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS statistics_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_date TEXT NOT NULL,
      total_orders INTEGER,
      pending_orders INTEGER,
      completed_orders INTEGER,
      cancelled_orders INTEGER,
      total_amount REAL,
      recognition_success_rate REAL,
      tryon_success_rate REAL,
      conversion_rate REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      order_detail_id TEXT,
      image_url TEXT,
      taken_by TEXT,
      tryon_params TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recognition_results (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      recognition_type TEXT,
      face_data TEXT,
      body_data TEXT,
      confidence REAL,
      status TEXT,
      error_message TEXT,
      processed_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  try {
    const brandCount = db.prepare('SELECT COUNT(*) as count FROM brands').get().count;
    if (brandCount === 0) {
      const brandStmt = db.prepare('INSERT INTO brands (id, name) VALUES (?, ?)');
      brandStmt.run('brand_001', 'AR时尚品牌');
      brandStmt.run('brand_002', '科技服饰');
    }

    const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get().count;
    if (storeCount === 0) {
      const storeStmt = db.prepare('INSERT INTO stores (id, name, address, brand_id) VALUES (?, ?, ?, ?)');
      storeStmt.run('store_001', 'AR体验店-北京旗舰店', '北京市朝阳区三里屯', 'brand_001');
      storeStmt.run('store_002', 'AR体验店-上海店', '上海市浦东新区陆家嘴', 'brand_001');
    }

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
      const userStmt = db.prepare('INSERT INTO users (id, username, name, role, email, phone, store_id, brand_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      userStmt.run('consumer_001', 'consumer1', '张三', 'consumer', 'zhangsan@example.com', '13800138001', null, null);
      userStmt.run('consumer_002', 'consumer2', '李四', 'consumer', 'lisi@example.com', '13800138002', null, null);
      userStmt.run('guide_001', 'guide1', '王导购', 'guide', 'wang@example.com', '13800138003', 'store_001', 'brand_001');
      userStmt.run('guide_002', 'guide2', '李导购', 'guide', 'li@example.com', '13800138004', 'store_002', 'brand_001');
      userStmt.run('operator_001', 'operator1', '赵运营', 'operator', 'zhao@example.com', '13800138005', null, null);
      userStmt.run('brand_001_user', 'brand_admin', '品牌管理员', 'brand', 'brand@example.com', '13800138006', null, 'brand_001');
    }

    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    if (productCount === 0) {
      const productStmt = db.prepare('INSERT INTO products (id, name, sku, category, price, stock, brand_id, store_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      productStmt.run('prod_001', 'AR智能眼镜-经典黑', 'SKU001', 'eyewear', 2999.00, 100, 'brand_001', 'store_001', 'active');
      productStmt.run('prod_002', 'AR智能眼镜-时尚银', 'SKU002', 'eyewear', 3299.00, 50, 'brand_001', 'store_001', 'active');
      productStmt.run('prod_003', '虚拟试穿T恤-夏季款', 'SKU003', 'clothing', 199.00, 200, 'brand_002', 'store_001', 'active');
      productStmt.run('prod_004', '虚拟试穿帽子-棒球帽', 'SKU004', 'accessories', 99.00, 150, 'brand_001', 'store_002', 'active');
    }

    const model3dCount = db.prepare('SELECT COUNT(*) as count FROM models_3d').get().count;
    if (model3dCount === 0) {
      const modelStmt = db.prepare('INSERT INTO models_3d (id, name, file_url, file_type, product_id) VALUES (?, ?, ?, ?, ?)');
      modelStmt.run('model_001', 'AR眼镜3D模型', '/models/glasses_classic.glb', 'glb', 'prod_001');
      modelStmt.run('model_002', 'AR眼镜银色3D模型', '/models/glasses_silver.glb', 'glb', 'prod_002');
      modelStmt.run('model_003', 'T恤3D模型', '/models/tshirt_summer.glb', 'glb', 'prod_003');
    }
  } catch (e) {
    console.log('数据初始化可能已存在:', e.message);
  }
};

module.exports = { initSchema };
