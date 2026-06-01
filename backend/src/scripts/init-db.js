const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('business_owner', 'model_operator', 'auditor', 'user')),
      email TEXT,
      phone TEXT,
      department TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_categories (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      parent_id TEXT,
      description TEXT,
      owner_id TEXT REFERENCES users(id),
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      contact_person TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      address TEXT,
      credit_rating TEXT,
      risk_level TEXT DEFAULT 'normal' CHECK(risk_level IN ('high', 'medium', 'normal', 'low')),
      tags TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS supplier_risks (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL REFERENCES suppliers(id),
      risk_type TEXT NOT NULL,
      risk_level TEXT NOT NULL CHECK(risk_level IN ('high', 'medium', 'low')),
      description TEXT,
      source TEXT,
      found_date DATE,
      handler_id TEXT REFERENCES users(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES purchase_categories(id),
      supplier_id TEXT NOT NULL REFERENCES suppliers(id),
      item_name TEXT NOT NULL,
      spec TEXT,
      unit TEXT,
      price DECIMAL(15,4) NOT NULL,
      quantity DECIMAL(15,2),
      total_amount DECIMAL(15,2),
      effective_date DATE NOT NULL,
      contract_no TEXT,
      source TEXT,
      created_by TEXT REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contract_templates (
      id TEXT PRIMARY KEY,
      category_id TEXT REFERENCES purchase_categories(id),
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      clauses TEXT,
      required_items TEXT,
      is_default INTEGER DEFAULT 0,
      created_by TEXT REFERENCES users(id),
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category_id, version)
    );

    CREATE TABLE IF NOT EXISTS negotiations (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES purchase_categories(id),
      supplier_id TEXT NOT NULL REFERENCES suppliers(id),
      supplier_name TEXT NOT NULL,
      expected_amount DECIMAL(15,2),
      target_price DECIMAL(15,4),
      status TEXT DEFAULT 'draft' CHECK(status IN (
        'draft', 'submitted', 'executing', 'reviewing', 'returned', 'completed', 'closed'
      )),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
      owner_id TEXT REFERENCES users(id),
      auditor_id TEXT REFERENCES users(id),
      template_id TEXT REFERENCES contract_templates(id),
      current_result TEXT CHECK(current_result IN (
        'auto_blocked', 'manual_review', 'observing', 'closed'
      )),
      risk_alerts TEXT,
      negotiation_strategy TEXT,
      final_price DECIMAL(15,4),
      final_amount DECIMAL(15,2),
      start_date DATE,
      end_date DATE,
      close_reason TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME,
      reviewed_at DATETIME,
      completed_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS negotiation_details (
      id TEXT PRIMARY KEY,
      negotiation_id TEXT NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      spec TEXT,
      unit TEXT,
      quantity DECIMAL(15,2) NOT NULL,
      quoted_price DECIMAL(15,4) NOT NULL,
      quoted_amount DECIMAL(15,2) NOT NULL,
      historical_avg_price DECIMAL(15,4),
      target_price DECIMAL(15,4),
      final_price DECIMAL(15,4),
      final_amount DECIMAL(15,2),
      price_deviation DECIMAL(10,2),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS negotiation_records (
      id TEXT PRIMARY KEY,
      negotiation_id TEXT NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
      action TEXT NOT NULL CHECK(action IN (
        'create', 'submit', 'execute', 'review', 'return', 'close', 'update', 'price_compare', 'risk_check', 'strategy_generate'
      )),
      status TEXT NOT NULL,
      operator_id TEXT REFERENCES users(id),
      operator_name TEXT,
      content TEXT,
      reason TEXT,
      previous_status TEXT,
      next_action TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exception_handlings (
      id TEXT PRIMARY KEY,
      negotiation_id TEXT NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
      exception_type TEXT NOT NULL CHECK(exception_type IN (
        'price_inconsistent', 'supplier_abnormal', 'clause_missing', 'manual_reject'
      )),
      description TEXT,
      result_type TEXT NOT NULL CHECK(result_type IN (
        'auto_blocked', 'manual_review', 'observing', 'closed'
      )),
      handler_id TEXT REFERENCES users(id),
      handled_at DATETIME,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS configurations (
      id TEXT PRIMARY KEY,
      config_key TEXT UNIQUE NOT NULL,
      config_value TEXT,
      config_type TEXT NOT NULL CHECK(config_type IN (
        'category_rule', 'owner', 'permission', 'valid_period', 'status'
      )),
      category_id TEXT REFERENCES purchase_categories(id),
      description TEXT,
      valid_from DATE,
      valid_to DATE,
      is_enabled INTEGER DEFAULT 1,
      created_by TEXT REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      negotiation_id TEXT REFERENCES negotiations(id),
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      uploaded_by TEXT REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS history_versions (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      data TEXT NOT NULL,
      changed_by TEXT REFERENCES users(id),
      change_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(table_name, record_id, version)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      user_name TEXT,
      operation TEXT NOT NULL,
      module TEXT NOT NULL,
      ip TEXT,
      params TEXT,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status);
    CREATE INDEX IF NOT EXISTS idx_negotiations_category ON negotiations(category_id);
    CREATE INDEX IF NOT EXISTS idx_negotiations_supplier ON negotiations(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_negotiations_owner ON negotiations(owner_id);
    CREATE INDEX IF NOT EXISTS idx_negotiation_records_negotiation ON negotiation_records(negotiation_id);
    CREATE INDEX IF NOT EXISTS idx_price_history_category_supplier ON price_history(category_id, supplier_id);
    CREATE INDEX IF NOT EXISTS idx_exception_handlings_negotiation ON exception_handlings(negotiation_id);
  `);

  console.log('数据库表创建完成');
};

const initSampleData = () => {
  const { v4: uuidv4 } = require('uuid');

  const users = [
    { id: 'user_001', username: 'admin', name: '系统管理员', role: 'business_owner', email: 'admin@example.com', department: '采购部' },
    { id: 'user_002', username: 'operator', name: '模型运营', role: 'model_operator', email: 'operator@example.com', department: '运营部' },
    { id: 'user_003', username: 'auditor', name: '审核人员', role: 'auditor', email: 'auditor@example.com', department: '风控部' },
    { id: 'user_004', username: 'user1', name: '张三', role: 'user', email: 'zhangsan@example.com', department: '采购部' },
    { id: 'user_005', username: 'user2', name: '李四', role: 'user', email: 'lisi@example.com', department: '采购部' },
  ];

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, username, name, role, email, department) VALUES (?, ?, ?, ?, ?, ?)');
  users.forEach(u => insertUser.run(u.id, u.username, u.name, u.role, u.email, u.department));

  const categories = [
    { id: 'cat_001', code: 'HW-001', name: '服务器硬件', owner_id: 'user_001' },
    { id: 'cat_002', code: 'HW-002', name: '网络设备', owner_id: 'user_001' },
    { id: 'cat_003', code: 'SW-001', name: '软件许可', owner_id: 'user_002' },
    { id: 'cat_004', code: 'SV-001', name: '云服务', owner_id: 'user_002' },
    { id: 'cat_005', code: 'OT-001', name: '其他采购', owner_id: 'user_004' },
  ];

  const insertCategory = db.prepare('INSERT OR IGNORE INTO purchase_categories (id, code, name, owner_id) VALUES (?, ?, ?, ?)');
  categories.forEach(c => insertCategory.run(c.id, c.code, c.name, c.owner_id));

  const suppliers = [
    { id: 'sup_001', code: 'SUP001', name: '华为技术有限公司', contact_person: '王经理', contact_phone: '13800138001', credit_rating: 'AAA', risk_level: 'low' },
    { id: 'sup_002', code: 'SUP002', name: '新华三技术有限公司', contact_person: '李经理', contact_phone: '13800138002', credit_rating: 'AA', risk_level: 'low' },
    { id: 'sup_003', code: 'SUP003', name: '戴尔中国有限公司', contact_person: '张经理', contact_phone: '13800138003', credit_rating: 'AA', risk_level: 'normal' },
    { id: 'sup_004', code: 'SUP004', name: '微软中国有限公司', contact_person: '赵经理', contact_phone: '13800138004', credit_rating: 'AAA', risk_level: 'low' },
    { id: 'sup_005', code: 'SUP005', name: '某风险供应商', contact_person: '孙经理', contact_phone: '13800138005', credit_rating: 'B', risk_level: 'high' },
  ];

  const insertSupplier = db.prepare('INSERT OR IGNORE INTO suppliers (id, code, name, contact_person, contact_phone, credit_rating, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?)');
  suppliers.forEach(s => insertSupplier.run(s.id, s.code, s.name, s.contact_person, s.contact_phone, s.credit_rating, s.risk_level));

  const priceHistory = [
    { id: uuidv4(), category_id: 'cat_001', supplier_id: 'sup_001', item_name: '2U机架式服务器', spec: 'Intel Xeon Gold 6330, 64GB, 2TB SSD', unit: '台', price: 28500, quantity: 10, total_amount: 285000, effective_date: '2024-01-15', created_by: 'user_001' },
    { id: uuidv4(), category_id: 'cat_001', supplier_id: 'sup_002', item_name: '2U机架式服务器', spec: 'Intel Xeon Gold 6330, 64GB, 2TB SSD', unit: '台', price: 27800, quantity: 5, total_amount: 139000, effective_date: '2024-02-20', created_by: 'user_001' },
    { id: uuidv4(), category_id: 'cat_001', supplier_id: 'sup_001', item_name: '4U存储服务器', spec: '2*Intel Xeon Silver 4310, 128GB, 16*8TB HDD', unit: '台', price: 52000, quantity: 3, total_amount: 156000, effective_date: '2024-03-10', created_by: 'user_004' },
    { id: uuidv4(), category_id: 'cat_002', supplier_id: 'sup_001', item_name: '千兆交换机', spec: '48口千兆, 4口万兆上联', unit: '台', price: 8500, quantity: 20, total_amount: 170000, effective_date: '2024-01-20', created_by: 'user_001' },
    { id: uuidv4(), category_id: 'cat_003', supplier_id: 'sup_004', item_name: '操作系统许可', spec: 'Windows Server 2022 标准版', unit: '套', price: 4200, quantity: 50, total_amount: 210000, effective_date: '2024-02-01', created_by: 'user_002' },
    { id: uuidv4(), category_id: 'cat_004', supplier_id: 'sup_004', item_name: '云服务器ECS', spec: '4核8GB, 100GB云盘', unit: '月', price: 350, quantity: 100, total_amount: 35000, effective_date: '2024-03-01', created_by: 'user_002' },
  ];

  const insertPrice = db.prepare('INSERT OR IGNORE INTO price_history (id, category_id, supplier_id, item_name, spec, unit, price, quantity, total_amount, effective_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  priceHistory.forEach(p => insertPrice.run(p.id, p.category_id, p.supplier_id, p.item_name, p.spec, p.unit, p.price, p.quantity, p.total_amount, p.effective_date, p.created_by));

  const sampleNegotiation = {
    id: 'neg_001',
    code: 'NGT202405001',
    title: '2024年Q2服务器采购项目',
    category_id: 'cat_001',
    supplier_id: 'sup_001',
    supplier_name: '华为技术有限公司',
    expected_amount: 500000,
    target_price: 27000,
    status: 'reviewing',
    priority: 'high',
    owner_id: 'user_004',
    auditor_id: 'user_003',
    created_by: 'user_004',
    negotiation_strategy: JSON.stringify({
      priceStrategy: '基于历史价格的阶梯降价3-5%',
      riskControl: '要求供应商提供3年质保服务',
      paymentTerms: '首付30%, 验收后付65%, 5%质保金'
    }),
    submitted_at: '2024-05-20 10:30:00'
  };

  const insertNegotiation = db.prepare(`INSERT OR IGNORE INTO negotiations 
    (id, code, title, category_id, supplier_id, supplier_name, expected_amount, target_price, status, priority, owner_id, auditor_id, created_by, negotiation_strategy, submitted_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertNegotiation.run(
    sampleNegotiation.id, sampleNegotiation.code, sampleNegotiation.title,
    sampleNegotiation.category_id, sampleNegotiation.supplier_id, sampleNegotiation.supplier_name,
    sampleNegotiation.expected_amount, sampleNegotiation.target_price, sampleNegotiation.status,
    sampleNegotiation.priority, sampleNegotiation.owner_id, sampleNegotiation.auditor_id,
    sampleNegotiation.created_by, sampleNegotiation.negotiation_strategy, sampleNegotiation.submitted_at
  );

  const details = [
    { id: uuidv4(), negotiation_id: 'neg_001', item_name: '2U机架式服务器', spec: 'Intel Xeon Gold 6330, 64GB, 2TB SSD', unit: '台', quantity: 10, quoted_price: 28000, quoted_amount: 280000, historical_avg_price: 28150, target_price: 27000 },
    { id: uuidv4(), negotiation_id: 'neg_001', item_name: '4U存储服务器', spec: '2*Intel Xeon Silver 4310, 128GB, 16*8TB HDD', unit: '台', quantity: 4, quoted_price: 51000, quoted_amount: 204000, historical_avg_price: 52000, target_price: 49500 },
  ];

  const insertDetail = db.prepare('INSERT OR IGNORE INTO negotiation_details (id, negotiation_id, item_name, spec, unit, quantity, quoted_price, quoted_amount, historical_avg_price, target_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  details.forEach(d => insertDetail.run(d.id, d.negotiation_id, d.item_name, d.spec, d.unit, d.quantity, d.quoted_price, d.quoted_amount, d.historical_avg_price, d.target_price));

  const records = [
    { id: uuidv4(), negotiation_id: 'neg_001', action: 'create', status: 'draft', operator_id: 'user_004', operator_name: '张三', content: '创建谈判项目', next_action: '提交审核' },
    { id: uuidv4(), negotiation_id: 'neg_001', action: 'price_compare', status: 'draft', operator_id: 'system', operator_name: '系统', content: '价格对比完成，平均偏差-0.53%', next_action: '继续' },
    { id: uuidv4(), negotiation_id: 'neg_001', action: 'risk_check', status: 'draft', operator_id: 'system', operator_name: '系统', content: '供应商风险检查通过', next_action: '继续' },
    { id: uuidv4(), negotiation_id: 'neg_001', action: 'strategy_generate', status: 'draft', operator_id: 'system', operator_name: '系统', content: '谈判策略已生成', next_action: '提交审核' },
    { id: uuidv4(), negotiation_id: 'neg_001', action: 'submit', status: 'submitted', operator_id: 'user_004', operator_name: '张三', content: '提交审核', next_action: '审核人员审核' },
    { id: uuidv4(), negotiation_id: 'neg_001', action: 'execute', status: 'reviewing', operator_id: 'user_003', operator_name: '审核人员', content: '进入审核流程', next_action: '审核完成' },
  ];

  const insertRecord = db.prepare('INSERT OR IGNORE INTO negotiation_records (id, negotiation_id, action, status, operator_id, operator_name, content, next_action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  records.forEach(r => insertRecord.run(r.id, r.negotiation_id, r.action, r.status, r.operator_id, r.operator_name, r.content, r.next_action));

  const configs = [
    { id: uuidv4(), config_key: 'price_deviation_threshold', config_value: '5', config_type: 'category_rule', description: '价格偏差预警阈值(%)', is_enabled: 1 },
    { id: uuidv4(), config_key: 'auto_approval_amount', config_value: '100000', config_type: 'category_rule', description: '自动审批金额阈值', is_enabled: 1 },
    { id: uuidv4(), config_key: 'neg_valid_days', config_value: '30', config_type: 'valid_period', description: '谈判单有效期(天)', is_enabled: 1 },
  ];

  const insertConfig = db.prepare('INSERT OR IGNORE INTO configurations (id, config_key, config_value, config_type, description, is_enabled) VALUES (?, ?, ?, ?, ?, ?)');
  configs.forEach(c => insertConfig.run(c.id, c.config_key, c.config_value, c.config_type, c.description, c.is_enabled));

  console.log('示例数据初始化完成');
};

initTables();
initSampleData();

db.close();

console.log('数据库初始化完成！');
