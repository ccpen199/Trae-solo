import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(path.resolve(process.cwd(), dbPath));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      store_id INTEGER,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'active',
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category_id INTEGER,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      cost_price DECIMAL(10,2) DEFAULT 0,
      stock INTEGER DEFAULT 0,
      unit TEXT DEFAULT '件',
      bar_code TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      level TEXT DEFAULT '普通',
      points INTEGER DEFAULT 0,
      balance DECIMAL(10,2) DEFAULT 0,
      birthday DATE,
      address TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      value DECIMAL(10,2) NOT NULL,
      min_amount DECIMAL(10,2) DEFAULT 0,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      store_id INTEGER NOT NULL,
      cashier_id INTEGER NOT NULL,
      member_id INTEGER,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      promotion_id INTEGER,
      payable_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      actual_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      change_amount DECIMAL(10,2) DEFAULT 0,
      status TEXT DEFAULT 'completed',
      invoice_needed INTEGER DEFAULT 0,
      invoice_title TEXT,
      invoice_tax_no TEXT,
      remark TEXT,
      hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (cashier_id) REFERENCES users(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (promotion_id) REFERENCES promotions(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      subtotal DECIMAL(10,2) NOT NULL,
      unit TEXT DEFAULT '件',
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_no TEXT UNIQUE NOT NULL,
      order_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      cashier_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      method TEXT NOT NULL,
      channel_order_no TEXT,
      status TEXT DEFAULT 'success',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (cashier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      refund_no TEXT UNIQUE NOT NULL,
      order_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      operator_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      reason TEXT NOT NULL,
      method TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      reviewer_id INTEGER,
      review_remark TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (operator_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS shift_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_no TEXT UNIQUE NOT NULL,
      store_id INTEGER NOT NULL,
      cashier_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      expected_cash DECIMAL(10,2) DEFAULT 0,
      actual_cash DECIMAL(10,2) DEFAULT 0,
      difference_cash DECIMAL(10,2) DEFAULT 0,
      expected_qrcode DECIMAL(10,2) DEFAULT 0,
      actual_qrcode DECIMAL(10,2) DEFAULT 0,
      difference_qrcode DECIMAL(10,2) DEFAULT 0,
      expected_bank_card DECIMAL(10,2) DEFAULT 0,
      actual_bank_card DECIMAL(10,2) DEFAULT 0,
      difference_bank_card DECIMAL(10,2) DEFAULT 0,
      expected_stored_card DECIMAL(10,2) DEFAULT 0,
      actual_stored_card DECIMAL(10,2) DEFAULT 0,
      difference_stored_card DECIMAL(10,2) DEFAULT 0,
      expected_coupon DECIMAL(10,2) DEFAULT 0,
      actual_coupon DECIMAL(10,2) DEFAULT 0,
      difference_coupon DECIMAL(10,2) DEFAULT 0,
      total_expected DECIMAL(10,2) DEFAULT 0,
      total_actual DECIMAL(10,2) DEFAULT 0,
      total_difference DECIMAL(10,2) DEFAULT 0,
      status TEXT DEFAULT 'open',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (cashier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reconciliation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recon_no TEXT UNIQUE NOT NULL,
      store_id INTEGER NOT NULL,
      recon_date DATE NOT NULL,
      order_count INTEGER DEFAULT 0,
      order_amount DECIMAL(10,2) DEFAULT 0,
      refund_count INTEGER DEFAULT 0,
      refund_amount DECIMAL(10,2) DEFAULT 0,
      net_amount DECIMAL(10,2) DEFAULT 0,
      channel_amount TEXT,
      status TEXT DEFAULT 'pending',
      operator_id INTEGER,
      reviewed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (operator_id) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reconciliation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recon_id INTEGER NOT NULL,
      order_id INTEGER,
      payment_id INTEGER,
      refund_id INTEGER,
      type TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      channel TEXT NOT NULL,
      cashier_id INTEGER,
      is_matched INTEGER DEFAULT 1,
      difference_amount DECIMAL(10,2) DEFAULT 0,
      remark TEXT,
      FOREIGN KEY (recon_id) REFERENCES reconciliation_records(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      content TEXT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (permission_id) REFERENCES permissions(id)
    );
  `);
};

const initData = () => {
  const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get().count;
  if (roleCount === 0) {
    const insertRole = db.prepare(
      'INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)'
    );
    insertRole.run('admin', '系统管理员', JSON.stringify(['*']));
    insertRole.run('finance', '财务人员', JSON.stringify(['reconciliation:*', 'report:*', 'order:view', 'refund:view']));
    insertRole.run('store_manager', '店长', JSON.stringify(['order:*', 'refund:review', 'shift:*', 'store:view', 'report:view']));
    insertRole.run('cashier', '收银员', JSON.stringify(['order:create', 'order:view', 'refund:create', 'shift:create', 'shift:view']));
    insertRole.run('area_operator', '区域运营', JSON.stringify(['store:view', 'report:view', 'reconciliation:view']));
  }

  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get().count;
  if (storeCount === 0) {
    const insertStore = db.prepare(
      'INSERT INTO stores (code, name, address, phone) VALUES (?, ?, ?, ?)'
    );
    insertStore.run('ST001', '朝阳门店', '北京市朝阳区朝阳门外大街1号', '010-12345678');
    insertStore.run('ST002', '海淀店', '北京市海淀区中关村大街1号', '010-87654321');
    insertStore.run('ST003', '西城店', '北京市西城区西单北大街1号', '010-11112222');
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hashPwd = bcrypt.hashSync('123456', salt);
    const insertUser = db.prepare(
      'INSERT INTO users (username, password, real_name, role_id, store_id, phone) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertUser.run('admin', hashPwd, '系统管理员', 1, null, '13800000000');
    insertUser.run('finance01', hashPwd, '财务小张', 2, null, '13800000001');
    insertUser.run('manager01', hashPwd, '朝阳店店长', 3, 1, '13800000002');
    insertUser.run('cashier01', hashPwd, '收银员小李', 4, 1, '13800000003');
    insertUser.run('cashier02', hashPwd, '收银员小王', 4, 1, '13800000004');
    insertUser.run('area01', hashPwd, '区域运营刘经理', 5, null, '13800000005');
  }

  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (categoryCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
    insertCat.run('食品饮料', 1);
    insertCat.run('日用百货', 2);
    insertCat.run('服装鞋帽', 3);
    insertCat.run('数码电子', 4);
    insertCat.run('服务项目', 5);
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const insertProduct = db.prepare(
      'INSERT INTO products (code, name, category_id, price, cost_price, stock, unit) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    insertProduct.run('SKU001', '矿泉水', 1, 2.00, 1.00, 100, '瓶');
    insertProduct.run('SKU002', '可乐', 1, 3.50, 2.00, 200, '瓶');
    insertProduct.run('SKU003', '面包', 1, 5.00, 2.50, 50, '个');
    insertProduct.run('SKU004', '方便面', 1, 4.50, 2.20, 150, '袋');
    insertProduct.run('SKU005', '牛奶', 1, 6.00, 3.50, 80, '盒');
    insertProduct.run('SKU006', '纸巾', 2, 3.00, 1.50, 300, '包');
    insertProduct.run('SKU007', '洗衣液', 2, 25.00, 15.00, 60, '瓶');
    insertProduct.run('SKU008', '牙刷', 2, 8.00, 4.00, 200, '支');
    insertProduct.run('SKU009', 'T恤', 3, 59.00, 30.00, 40, '件');
    insertProduct.run('SKU010', '运动鞋', 3, 299.00, 150.00, 30, '双');
    insertProduct.run('SKU011', '手机壳', 4, 29.00, 10.00, 100, '个');
    insertProduct.run('SKU012', '充电宝', 4, 99.00, 50.00, 50, '个');
    insertProduct.run('SKU013', '洗车服务', 5, 35.00, 15.00, 9999, '次');
    insertProduct.run('SKU014', '美容服务', 5, 199.00, 80.00, 9999, '次');
    insertProduct.run('SKU015', '维修服务', 5, 80.00, 40.00, 9999, '次');
  }

  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
  if (memberCount === 0) {
    const insertMember = db.prepare(
      'INSERT INTO members (code, name, phone, level, points, balance) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertMember.run('VIP001', '张三', '13900000001', '黄金', 1500, 500.00);
    insertMember.run('VIP002', '李四', '13900000002', '普通', 300, 100.00);
    insertMember.run('VIP003', '王五', '13900000003', '钻石', 8000, 2000.00);
    insertMember.run('VIP004', '赵六', '13900000004', '普通', 50, 0.00);
  }

  const promotionCount = db.prepare('SELECT COUNT(*) as count FROM promotions').get().count;
  if (promotionCount === 0) {
    const insertPromo = db.prepare(
      'INSERT INTO promotions (name, type, value, min_amount, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertPromo.run('满100减10', 'discount', 10.00, 100.00, '2024-01-01', '2024-12-31');
    insertPromo.run('满200减30', 'discount', 30.00, 200.00, '2024-01-01', '2024-12-31');
    insertPromo.run('9折优惠', 'percent', 10.00, 0.00, '2024-01-01', '2024-12-31');
  }

  const permCount = db.prepare('SELECT COUNT(*) as count FROM permissions').get().count;
  if (permCount === 0) {
    const insertPerm = db.prepare(
      'INSERT INTO permissions (name, code, category, description) VALUES (?, ?, ?, ?)'
    );
    insertPerm.run('创建订单', 'order:create', '订单管理', '创建新订单');
    insertPerm.run('查看订单', 'order:view', '订单管理', '查看订单详情');
    insertPerm.run('取消订单', 'order:cancel', '订单管理', '取消订单');
    insertPerm.run('创建退款', 'refund:create', '退款管理', '创建退款申请');
    insertPerm.run('查看退款', 'refund:view', '退款管理', '查看退款记录');
    insertPerm.run('审核退款', 'refund:review', '退款管理', '审核退款申请');
    insertPerm.run('交班操作', 'shift:create', '交班管理', '开启/关闭交班');
    insertPerm.run('查看交班', 'shift:view', '交班管理', '查看交班记录');
    insertPerm.run('查看对账', 'reconciliation:view', '财务对账', '查看对账记录');
    insertPerm.run('处理对账', 'reconciliation:manage', '财务对账', '创建和审核对账');
    insertPerm.run('查看报表', 'report:view', '数据报表', '查看各类报表');
    insertPerm.run('查看门店', 'store:view', '门店管理', '查看门店信息');
    insertPerm.run('管理门店', 'store:manage', '门店管理', '编辑门店信息');
    insertPerm.run('管理用户', 'user:manage', '系统管理', '管理用户账号');
    insertPerm.run('管理角色', 'role:manage', '系统管理', '管理角色和权限');
    insertPerm.run('查看审计', 'audit:view', '系统管理', '查看操作审计日志');
  }

  const rpCount = db.prepare('SELECT COUNT(*) as count FROM role_permissions').get().count;
  if (rpCount === 0) {
    const insertRP = db.prepare(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)'
    );
    const adminPerms = db.prepare('SELECT id FROM permissions').all();
    adminPerms.forEach((p: any) => insertRP.run(1, p.id));

    const financePerms = db.prepare("SELECT id FROM permissions WHERE code IN ('order:view','refund:view','refund:review','shift:view','reconciliation:view','reconciliation:manage','report:view','audit:view')").all();
    financePerms.forEach((p: any) => insertRP.run(2, p.id));

    const managerPerms = db.prepare("SELECT id FROM permissions WHERE code IN ('order:create','order:view','order:cancel','refund:create','refund:view','refund:review','shift:create','shift:view','reconciliation:view','report:view','store:view')").all();
    managerPerms.forEach((p: any) => insertRP.run(3, p.id));

    const cashierPerms = db.prepare("SELECT id FROM permissions WHERE code IN ('order:create','order:view','refund:create','shift:create','shift:view','store:view')").all();
    cashierPerms.forEach((p: any) => insertRP.run(4, p.id));

    const areaPerms = db.prepare("SELECT id FROM permissions WHERE code IN ('store:view','report:view','reconciliation:view')").all();
    areaPerms.forEach((p: any) => insertRP.run(5, p.id));
  }
};

initTables();
initData();

export default db;
