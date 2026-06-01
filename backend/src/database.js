const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrateDatabase() {
  try {
    const columns = db.prepare("PRAGMA table_info(audit_checklists)").all();
    const columnNames = columns.map(c => c.name);
    
    if (!columnNames.includes('photo_path')) {
      db.prepare("ALTER TABLE audit_checklists ADD COLUMN photo_path TEXT").run();
    }
  } catch (e) {
    console.log('Migration skipped:', e.message);
  }
}

function initDatabase() {
  migrateDatabase();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS factories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      area REAL,
      employee_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS auditors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      factory_id INTEGER NOT NULL,
      audit_type TEXT NOT NULL,
      auditor_id INTEGER NOT NULL,
      audit_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      standards TEXT,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (factory_id) REFERENCES factories(id),
      FOREIGN KEY (auditor_id) REFERENCES auditors(id)
    );

    CREATE TABLE IF NOT EXISTS checklist_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      max_score INTEGER DEFAULT 100,
      weight REAL DEFAULT 1.0
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      item_text TEXT NOT NULL,
      max_score INTEGER DEFAULT 10,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES checklist_categories(id)
    );

    CREATE TABLE IF NOT EXISTS audit_checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_plan_id INTEGER NOT NULL,
      checklist_item_id INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      notes TEXT,
      photo_path TEXT,
      filled_by INTEGER,
      filled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (audit_plan_id) REFERENCES audit_plans(id),
      FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id)
    );

    CREATE TABLE IF NOT EXISTS audit_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_plan_id INTEGER NOT NULL,
      category_id INTEGER,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      responsible_person TEXT,
      deadline DATE,
      evidence_requirement TEXT,
      status TEXT DEFAULT 'open',
      rectification_evidence TEXT,
      recheck_result TEXT,
      recheck_by INTEGER,
      recheck_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (audit_plan_id) REFERENCES audit_plans(id),
      FOREIGN KEY (category_id) REFERENCES checklist_categories(id)
    );

    CREATE TABLE IF NOT EXISTS audit_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_plan_id INTEGER NOT NULL UNIQUE,
      total_score INTEGER DEFAULT 0,
      risk_level TEXT,
      conclusion TEXT,
      issues_summary TEXT,
      rectification_status TEXT,
      exported_count INTEGER DEFAULT 0,
      generated_by INTEGER,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (audit_plan_id) REFERENCES audit_plans(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_plan_id INTEGER,
      action TEXT NOT NULL,
      action_by TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (audit_plan_id) REFERENCES audit_plans(id)
    );
  `);

  const categories = db.prepare('SELECT COUNT(*) as count FROM checklist_categories').get();
  if (categories.count === 0) {
    const insertCategory = db.prepare('INSERT INTO checklist_categories (name, code, max_score, weight) VALUES (?, ?, ?, ?)');
    const insertItem = db.prepare('INSERT INTO checklist_items (category_id, item_text, max_score, sort_order) VALUES (?, ?, ?, ?)');

    const categoryData = [
      { name: '资质审核', code: 'qualification', items: [
        '营业执照有效期内',
        '生产许可证齐全',
        '环评批复文件',
        '消防验收合格',
        '组织机构代码证有效'
      ]},
      { name: '劳工标准', code: 'labor', items: [
        '劳动合同签订率100%',
        '工资按时足额发放',
        '无童工现象',
        '工作时间符合法规',
        '社保缴纳合规'
      ]},
      { name: '消防安全', code: 'fire', items: [
        '消防通道畅通',
        '灭火器有效且充足',
        '应急照明正常',
        '消防栓水压正常',
        '员工消防培训记录'
      ]},
      { name: '质量管理', code: 'quality', items: [
        '质量体系认证有效',
        '来料检验记录完整',
        '过程检验规范执行',
        '成品检验标准明确',
        '不合格品处理流程'
      ]},
      { name: '环境保护', code: 'environment', items: [
        '废水处理设施运行',
        '废气排放达标',
        '危废合规处置',
        '环保设备维护记录',
        '环境应急预案'
      ]},
      { name: '生产能力', code: 'capacity', items: [
        '设备完好率达标',
        '产能满足订单需求',
        '生产计划合理',
        '供应链稳定',
        '技术人员配置充足'
      ]}
    ];

    categoryData.forEach((cat, catIdx) => {
      const catResult = insertCategory.run(cat.name, cat.code, 100, 1.0);
      cat.items.forEach((item, itemIdx) => {
        insertItem.run(catResult.lastInsertRowid, item, 10, itemIdx);
      });
    });
  }

  const auditors = db.prepare('SELECT COUNT(*) as count FROM auditors').get();
  if (auditors.count === 0) {
    const insertAuditor = db.prepare('INSERT INTO auditors (name, department, phone, email) VALUES (?, ?, ?, ?)');
    insertAuditor.run('张伟', '质量部', '13800138001', 'zhangwei@example.com');
    insertAuditor.run('李娜', '供应链部', '13800138002', 'lina@example.com');
    insertAuditor.run('王强', 'EHS部', '13800138003', 'wangqiang@example.com');
  }

  const suppliers = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
  if (suppliers.count === 0) {
    const insertSupplier = db.prepare('INSERT INTO suppliers (name, contact, phone, email) VALUES (?, ?, ?, ?)');
    const insertFactory = db.prepare('INSERT INTO factories (supplier_id, name, address, area, employee_count) VALUES (?, ?, ?, ?, ?)');
    
    const s1 = insertSupplier.run('东莞市华瑞制衣有限公司', '陈经理', '13900139001', 'chen@huarui.com');
    insertFactory.run(s1.lastInsertRowid, '华瑞制衣一厂', '广东省东莞市虎门镇工业区A栋', 5000, 350);
    
    const s2 = insertSupplier.run('深圳市佳美电子科技有限公司', '刘总', '13900139002', 'liu@jiamei.com');
    insertFactory.run(s2.lastInsertRowid, '佳美电子宝安工厂', '广东省深圳市宝安区科技园B区', 8000, 520);
  }
}

module.exports = { db, initDatabase };
