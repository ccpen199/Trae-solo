const db = require('./database');
const bcrypt = require('bcryptjs');

function initDatabase() {
  const tableExists = (tableName) => {
    const result = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name=?
    `).get(tableName);
    return !!result;
  };

  if (!tableExists('roles')) {
    db.exec(`
      CREATE TABLE roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        code VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const insertRole = db.prepare(`
      INSERT INTO roles (name, code, description) VALUES (?, ?, ?)
    `);
    insertRole.run('超级管理员', 'super_admin', '系统最高权限管理员');
    insertRole.run('销售', 'sales', '负责客户管理和订单创建');
    insertRole.run('仓库管理员', 'warehouse', '负责仓储管理和库存操作');
    insertRole.run('财务', 'finance', '负责财务审核和定金单处理');
    insertRole.run('客服', 'customer_service', '负责订单跟进和客户服务');
  }

  if (!tableExists('departments')) {
    db.exec(`
      CREATE TABLE departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        parent_id INTEGER,
        manager_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES departments(id)
      )
    `);

    const insertDept = db.prepare(`
      INSERT INTO departments (name, code, parent_id) VALUES (?, ?, ?)
    `);
    insertDept.run('总公司', 'HEAD', null);
    insertDept.run('销售部', 'SALES', 1);
    insertDept.run('仓储部', 'WAREHOUSE', 1);
    insertDept.run('财务部', 'FINANCE', 1);
    insertDept.run('客服部', 'CS', 1);
  }

  if (!tableExists('users')) {
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(50) NOT NULL,
        employee_id VARCHAR(50) UNIQUE,
        phone VARCHAR(20),
        email VARCHAR(100),
        avatar VARCHAR(255),
        role_id INTEGER NOT NULL,
        department_id INTEGER,
        manager_id INTEGER,
        status TINYINT DEFAULT 1,
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (manager_id) REFERENCES users(id)
      )
    `);

    const salt = bcrypt.genSaltSync(10);
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, employee_id, phone, role_id, department_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'admin',
      bcrypt.hashSync('admin123', salt),
      '系统管理员',
      'EMP001',
      '13800138000',
      1,
      1,
      1
    );

    insertUser.run(
      'sales01',
      bcrypt.hashSync('123456', salt),
      '张三',
      'EMP002',
      '13800138001',
      2,
      2,
      1
    );

    insertUser.run(
      'warehouse01',
      bcrypt.hashSync('123456', salt),
      '李四',
      'EMP003',
      '13800138002',
      3,
      3,
      1
    );

    insertUser.run(
      'finance01',
      bcrypt.hashSync('123456', salt),
      '王五',
      'EMP004',
      '13800138003',
      4,
      4,
      1
    );

    insertUser.run(
      'cs01',
      bcrypt.hashSync('123456', salt),
      '赵六',
      'EMP005',
      '13800138004',
      5,
      5,
      1
    );
  }

  if (!tableExists('customer_categories')) {
    db.exec(`
      CREATE TABLE customer_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const insertCat = db.prepare(`
      INSERT INTO customer_categories (name, code, sort_order) VALUES (?, ?, ?)
    `);
    insertCat.run('普通客户', 'NORMAL', 1);
    insertCat.run('VIP客户', 'VIP', 2);
    insertCat.run('企业客户', 'ENTERPRISE', 3);
  }

  if (!tableExists('regions')) {
    db.exec(`
      CREATE TABLE regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20),
        parent_id INTEGER,
        level TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  if (!tableExists('customers')) {
    db.exec(`
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_no VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        telephone VARCHAR(20),
        email VARCHAR(100),
        address VARCHAR(255),
        province VARCHAR(50),
        city VARCHAR(50),
        district VARCHAR(50),
        category_id INTEGER,
        region_id INTEGER,
        owner_id INTEGER NOT NULL,
        purchase_count INTEGER DEFAULT 0,
        total_amount DECIMAL(15,2) DEFAULT 0.00,
        last_order_at DATETIME,
        last_follow_at DATETIME,
        remark TEXT,
        status TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES customer_categories(id),
        FOREIGN KEY (region_id) REFERENCES regions(id),
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )
    `);
  }

  if (!tableExists('warehouses')) {
    db.exec(`
      CREATE TABLE warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        address VARCHAR(255),
        manager_id INTEGER,
        capacity INTEGER,
        description VARCHAR(255),
        status TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES users(id)
      )
    `);

    const insertWarehouse = db.prepare(`
      INSERT INTO warehouses (name, code, address, status) VALUES (?, ?, ?, ?)
    `);
    insertWarehouse.run('主仓库', 'MAIN', '北京市朝阳区主仓库路1号', 1);
    insertWarehouse.run('备用仓库', 'BACKUP', '上海市浦东新区备用仓库路2号', 1);
  }

  if (!tableExists('product_categories')) {
    db.exec(`
      CREATE TABLE product_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        parent_id INTEGER,
        description VARCHAR(255),
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const insertCat = db.prepare(`
      INSERT INTO product_categories (name, code, sort_order) VALUES (?, ?, ?)
    `);
    insertCat.run('电子产品', 'ELECTRONICS', 1);
    insertCat.run('办公用品', 'OFFICE', 2);
    insertCat.run('生活用品', 'DAILY', 3);
  }

  if (!tableExists('brands')) {
    db.exec(`
      CREATE TABLE brands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE,
        logo VARCHAR(255),
        description VARCHAR(255),
        status TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const insertBrand = db.prepare(`
      INSERT INTO brands (name, code, status) VALUES (?, ?, ?)
    `);
    insertBrand.run('联想', 'LENOVO', 1);
    insertBrand.run('惠普', 'HP', 1);
    insertBrand.run('戴尔', 'DELL', 1);
  }

  if (!tableExists('products')) {
    db.exec(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_no VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        brand_id INTEGER,
        category_id INTEGER,
        unit VARCHAR(20),
        purchase_price DECIMAL(15,2) DEFAULT 0.00,
        sale_price DECIMAL(15,2) DEFAULT 0.00,
        usage_type VARCHAR(50),
        description TEXT,
        image_url VARCHAR(255),
        video_url VARCHAR(255),
        is_on_sale TINYINT DEFAULT 1,
        min_stock INTEGER DEFAULT 0,
        max_stock INTEGER DEFAULT 999999,
        status TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brand_id) REFERENCES brands(id),
        FOREIGN KEY (category_id) REFERENCES product_categories(id)
      )
    `);

    const insertProduct = db.prepare(`
      INSERT INTO products (product_no, name, brand_id, category_id, unit, purchase_price, sale_price, is_on_sale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertProduct.run('PROD001', '联想笔记本电脑 ThinkPad X1', 1, 1, '台', 5000.00, 6999.00, 1);
    insertProduct.run('PROD002', '惠普打印机 LaserJet Pro', 2, 2, '台', 1200.00, 1899.00, 1);
    insertProduct.run('PROD003', '戴尔显示器 27英寸4K', 3, 1, '台', 1800.00, 2499.00, 1);
  }

  if (!tableExists('inventory')) {
    db.exec(`
      CREATE TABLE inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        warehouse_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 0,
        locked_quantity INTEGER DEFAULT 0,
        last_check_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
        UNIQUE(product_id, warehouse_id)
      )
    `);

    const insertInventory = db.prepare(`
      INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)
    `);
    insertInventory.run(1, 1, 100);
    insertInventory.run(2, 1, 50);
    insertInventory.run(3, 1, 80);
  }

  if (!tableExists('payment_methods')) {
    db.exec(`
      CREATE TABLE payment_methods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        status TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const insertMethod = db.prepare(`
      INSERT INTO payment_methods (name, code, status) VALUES (?, ?, ?)
    `);
    insertMethod.run('微信支付', 'WECHAT', 1);
    insertMethod.run('支付宝', 'ALIPAY', 1);
    insertMethod.run('银行转账', 'BANK', 1);
    insertMethod.run('现金', 'CASH', 1);
  }

  if (!tableExists('logistics_companies')) {
    db.exec(`
      CREATE TABLE logistics_companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        tracking_url VARCHAR(255),
        status TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const insertLogistics = db.prepare(`
      INSERT INTO logistics_companies (name, code, status) VALUES (?, ?, ?)
    `);
    insertLogistics.run('顺丰速运', 'SF', 1);
    insertLogistics.run('京东物流', 'JD', 1);
    insertLogistics.run('中通快递', 'ZTO', 1);
    insertLogistics.run('圆通速递', 'YTO', 1);
  }

  if (!tableExists('orders')) {
    db.exec(`
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no VARCHAR(50) NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL,
        sales_id INTEGER NOT NULL,
        warehouse_id INTEGER,
        total_amount DECIMAL(15,2) DEFAULT 0.00,
        discount_amount DECIMAL(15,2) DEFAULT 0.00,
        final_amount DECIMAL(15,2) DEFAULT 0.00,
        paid_amount DECIMAL(15,2) DEFAULT 0.00,
        deposit_amount DECIMAL(15,2) DEFAULT 0.00,
        payment_method_id INTEGER,
        status VARCHAR(50) DEFAULT 'pending_review',
        review_status VARCHAR(50) DEFAULT 'pending',
        logistics_status VARCHAR(50) DEFAULT 'pending',
        follow_status VARCHAR(50) DEFAULT 'normal',
        receiver_name VARCHAR(100),
        receiver_phone VARCHAR(20),
        receiver_address VARCHAR(255),
        logistics_company_id INTEGER,
        tracking_no VARCHAR(100),
        shipped_at DATETIME,
        delivered_at DATETIME,
        cancelled_at DATETIME,
        remark TEXT,
        internal_remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (sales_id) REFERENCES users(id),
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
        FOREIGN KEY (logistics_company_id) REFERENCES logistics_companies(id)
      )
    `);
  }

  if (!tableExists('order_items')) {
    db.exec(`
      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name VARCHAR(200),
        product_no VARCHAR(50),
        unit VARCHAR(20),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        warehouse_id INTEGER,
        returned_quantity INTEGER DEFAULT 0,
        remark VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
      )
    `);
  }

  if (!tableExists('deposit_orders')) {
    db.exec(`
      CREATE TABLE deposit_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deposit_no VARCHAR(50) NOT NULL UNIQUE,
        order_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        sales_id INTEGER NOT NULL,
        department_id INTEGER,
        amount DECIMAL(15,2) NOT NULL,
        payment_method_id INTEGER,
        payment_no VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        reviewed_by INTEGER,
        reviewed_at DATETIME,
        review_remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (sales_id) REFERENCES users(id),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
      )
    `);
  }

  if (!tableExists('stock_in_orders')) {
    db.exec(`
      CREATE TABLE stock_in_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stock_in_no VARCHAR(50) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL,
        purchase_no VARCHAR(100),
        supplier_name VARCHAR(200),
        warehouse_id INTEGER NOT NULL,
        total_quantity INTEGER DEFAULT 0,
        total_amount DECIMAL(15,2) DEFAULT 0.00,
        operator_id INTEGER NOT NULL,
        remark TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )
    `);
  }

  if (!tableExists('stock_in_items')) {
    db.exec(`
      CREATE TABLE stock_in_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stock_in_order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        production_date DATE,
        expiry_date DATE,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(15,2),
        total_price DECIMAL(15,2),
        batch_no VARCHAR(100),
        remark VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (stock_in_order_id) REFERENCES stock_in_orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
  }

  if (!tableExists('stock_out_orders')) {
    db.exec(`
      CREATE TABLE stock_out_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stock_out_no VARCHAR(50) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL,
        order_id INTEGER,
        warehouse_id INTEGER NOT NULL,
        total_quantity INTEGER DEFAULT 0,
        operator_id INTEGER NOT NULL,
        remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )
    `);
  }

  if (!tableExists('stock_out_items')) {
    db.exec(`
      CREATE TABLE stock_out_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stock_out_order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        remark VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (stock_out_order_id) REFERENCES stock_out_orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
  }

  if (!tableExists('return_orders')) {
    db.exec(`
      CREATE TABLE return_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_no VARCHAR(50) NOT NULL UNIQUE,
        order_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        logistics_company_id INTEGER,
        tracking_no VARCHAR(100),
        returned_at DATETIME,
        received_at DATETIME,
        receiver_id INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        total_quantity INTEGER DEFAULT 0,
        total_amount DECIMAL(15,2) DEFAULT 0.00,
        reason TEXT,
        remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (logistics_company_id) REFERENCES logistics_companies(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
      )
    `);
  }

  if (!tableExists('return_items')) {
    db.exec(`
      CREATE TABLE return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_order_id INTEGER NOT NULL,
        order_item_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(15,2),
        total_price DECIMAL(15,2),
        reason VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (return_order_id) REFERENCES return_orders(id),
        FOREIGN KEY (order_item_id) REFERENCES order_items(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
  }

  if (!tableExists('inventory_checks')) {
    db.exec(`
      CREATE TABLE inventory_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        check_no VARCHAR(50) NOT NULL UNIQUE,
        product_id INTEGER NOT NULL,
        warehouse_id INTEGER NOT NULL,
        original_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        difference INTEGER NOT NULL,
        reason TEXT NOT NULL,
        operator_id INTEGER NOT NULL,
        check_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )
    `);
  }

  if (!tableExists('order_trails')) {
    db.exec(`
      CREATE TABLE order_trails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        action VARCHAR(100) NOT NULL,
        content TEXT,
        operator_id INTEGER,
        operator_name VARCHAR(50),
        status_before VARCHAR(50),
        status_after VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )
    `);
  }

  if (!tableExists('operation_logs')) {
    db.exec(`
      CREATE TABLE operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_name VARCHAR(50),
        module VARCHAR(100),
        action VARCHAR(100),
        target_type VARCHAR(100),
        target_id INTEGER,
        detail TEXT,
        ip_address VARCHAR(50),
        user_agent VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  }

  console.log('数据库初始化完成');
}

module.exports = initDatabase;
