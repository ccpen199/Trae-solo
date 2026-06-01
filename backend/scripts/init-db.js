require('dotenv').config({ path: '../../.env' });
const db = require('../src/config/database');

const initTables = () => {
  const migrate = db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS cooperatives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        contact_person TEXT,
        phone TEXT,
        address TEXT,
        guarantee_limit DECIMAL(15,2) DEFAULT 0,
        used_guarantee DECIMAL(15,2) DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        owner_name TEXT,
        phone TEXT,
        address TEXT,
        cooperative_id INTEGER,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
      );

      CREATE TABLE IF NOT EXISTS farmers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        id_card TEXT UNIQUE,
        phone TEXT,
        address TEXT,
        planting_area DECIMAL(10,2) DEFAULT 0,
        historical_yield DECIMAL(15,2) DEFAULT 0,
        cooperative_id INTEGER,
        has_cooperative_guarantee INTEGER DEFAULT 0,
        guarantee_amount DECIMAL(15,2) DEFAULT 0,
        past_repayment_history TEXT,
        insurance_info TEXT,
        subsidy_info TEXT,
        risk_tags TEXT,
        credit_score INTEGER DEFAULT 600,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
      );

      CREATE TABLE IF NOT EXISTS credit_approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id INTEGER NOT NULL,
        cooperative_id INTEGER,
        crop_cycle TEXT NOT NULL,
        product_category TEXT NOT NULL,
        requested_amount DECIMAL(15,2) NOT NULL,
        approved_amount DECIMAL(15,2) NOT NULL,
        used_amount DECIMAL(15,2) DEFAULT 0,
        available_amount DECIMAL(15,2) DEFAULT 0,
        validity_start DATE NOT NULL,
        validity_end DATE NOT NULL,
        risk_tags TEXT,
        approval_status TEXT DEFAULT 'pending',
        approver_id INTEGER,
        approval_notes TEXT,
        approved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES farmers(id),
        FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        specification TEXT,
        unit TEXT,
        price DECIMAL(10,2) NOT NULL,
        store_id INTEGER,
        stock_quantity DECIMAL(10,2) DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT UNIQUE NOT NULL,
        farmer_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        credit_approval_id INTEGER NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        account_period_days INTEGER NOT NULL,
        due_date DATE NOT NULL,
        signed_by_farmer INTEGER DEFAULT 0,
        signed_at DATETIME,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES farmers(id),
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (credit_approval_id) REFERENCES credit_approvals(id)
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(15,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS repayments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repayment_no TEXT UNIQUE NOT NULL,
        order_id INTEGER NOT NULL,
        farmer_id INTEGER NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        paid_amount DECIMAL(15,2) DEFAULT 0,
        remaining_amount DECIMAL(15,2) NOT NULL,
        due_date DATE NOT NULL,
        actual_paid_date DATE,
        status TEXT DEFAULT 'pending',
        is_overdue INTEGER DEFAULT 0,
        overdue_days INTEGER DEFAULT 0,
        extension_days INTEGER DEFAULT 0,
        extension_reason TEXT,
        reduction_amount DECIMAL(15,2) DEFAULT 0,
        reduction_reason TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (farmer_id) REFERENCES farmers(id)
      );

      CREATE TABLE IF NOT EXISTS repayment_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repayment_id INTEGER NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_method TEXT,
        payment_date DATE NOT NULL,
        operator TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repayment_id) REFERENCES repayments(id)
      );

      CREATE TABLE IF NOT EXISTS collection_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repayment_id INTEGER NOT NULL,
        farmer_id INTEGER NOT NULL,
        assignee TEXT,
        task_status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'normal',
        last_contact_date DATE,
        contact_result TEXT,
        next_followup_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repayment_id) REFERENCES repayments(id),
        FOREIGN KEY (farmer_id) REFERENCES farmers(id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        old_data TEXT,
        new_data TEXT,
        operator TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_farmers_cooperative ON farmers(cooperative_id);
      CREATE INDEX IF NOT EXISTS idx_credit_farmer ON credit_approvals(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_credit_status ON credit_approvals(approval_status);
      CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_repayments_order ON repayments(order_id);
      CREATE INDEX IF NOT EXISTS idx_repayments_due ON repayments(due_date);
      CREATE INDEX IF NOT EXISTS idx_repayments_status ON repayments(status);
      CREATE INDEX IF NOT EXISTS idx_collections_repayment ON collection_tasks(repayment_id);
      CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name, record_id);
    `);

    console.log('数据库表初始化完成');
  });

  migrate();
  db.close();
  console.log('数据库初始化完成');
};

initTables();
