const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS registration_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      registration_region TEXT NOT NULL,
      company_type TEXT NOT NULL,
      shareholder_structure TEXT,
      business_scope TEXT,
      registered_capital REAL,
      urgent_requirement BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'pending',
      material_list TEXT,
      assigned_salesperson TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS name_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER NOT NULL,
      alternative_names TEXT NOT NULL,
      approved_name TEXT,
      approval_result TEXT,
      rejection_reason TEXT,
      submission_count INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      assigned_officer TEXT,
      submitted_at DATETIME,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requirement_id) REFERENCES registration_requirements(id)
    );

    CREATE TABLE IF NOT EXISTS name_approval_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      approval_id INTEGER NOT NULL,
      submission_number INTEGER NOT NULL,
      submitted_names TEXT NOT NULL,
      result TEXT,
      rejection_reason TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_by TEXT,
      FOREIGN KEY (approval_id) REFERENCES name_approvals(id)
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending_upload',
      file_path TEXT,
      version INTEGER DEFAULT 1,
      confirmed_by TEXT,
      confirmed_at DATETIME,
      uploaded_by TEXT,
      uploaded_at DATETIME,
      reviewed_by TEXT,
      reviewed_at DATETIME,
      review_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requirement_id) REFERENCES registration_requirements(id)
    );

    CREATE TABLE IF NOT EXISTS signature_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      signers TEXT,
      signed_by TEXT,
      signed_at DATETIME,
      expiry_date DATETIME,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS processing_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      assigned_to TEXT,
      started_at DATETIME,
      completed_at DATETIME,
      notes TEXT,
      customer_notification TEXT,
      notified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requirement_id) REFERENCES registration_requirements(id)
    );

    CREATE TABLE IF NOT EXISTS acceptance_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER NOT NULL,
      check_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      issue_description TEXT,
      responsible_person TEXT,
      due_date DATETIME,
      resolved_at DATETIME,
      resolved_by TEXT,
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requirement_id) REFERENCES registration_requirements(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requirement_id) REFERENCES registration_requirements(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, name, role, phone, email)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertUser.run('admin', '系统管理员', 'admin', '13800000000', 'admin@example.com');
    insertUser.run('sales1', '销售顾问张三', 'sales', '13800000001', 'sales1@example.com');
    insertUser.run('material1', '材料专员李四', 'material', '13800000002', 'material1@example.com');
    insertUser.run('officer1', '工商办理员王五', 'officer', '13800000003', 'officer1@example.com');
  }

  const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get();
  if (clientCount.count === 0) {
    const insertClient = db.prepare(`
      INSERT INTO clients (name, phone, email, created_at)
      VALUES (?, ?, ?, ?)
    `);
    insertClient.run('北京科技有限公司', '13900001001', 'contact@tech.com', '2026-05-01 10:00:00');
    insertClient.run('张三', '13900001002', 'zhangsan@email.com', '2026-05-02 11:00:00');
    insertClient.run('李四', '13900001003', 'lisi@email.com', '2026-05-03 14:30:00');
  }

  const requirementCount = db.prepare('SELECT COUNT(*) as count FROM registration_requirements').get();
  if (requirementCount.count === 0) {
    const insertRequirement = db.prepare(`
      INSERT INTO registration_requirements (
        client_id, registration_region, company_type, business_scope,
        registered_capital, urgent_requirement, status, material_list, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertRequirement.run(
      1, '北京市朝阳区', 'limited', '技术开发、技术咨询、技术服务',
      100, 1, 'in_progress',
      JSON.stringify(['身份证复印件', '租赁合同', '房产证复印件', '公司章程', '股东会决议', '加急办理申请书']),
      '2026-05-10 09:00:00'
    );
    
    insertRequirement.run(
      2, '上海市浦东新区', 'sole', '贸易、进出口业务',
      50, 0, 'pending',
      JSON.stringify(['身份证复印件', '租赁合同', '房产证复印件', '一人有限公司承诺书']),
      '2026-05-15 10:30:00'
    );
    
    insertRequirement.run(
      3, '广州市天河区', 'individual', '餐饮服务',
      10, 0, 'completed',
      JSON.stringify(['身份证复印件', '租赁合同', '房产证复印件', '个体工商户申请书']),
      '2026-05-05 08:00:00'
    );
  }

  const progressCount = db.prepare('SELECT COUNT(*) as count FROM processing_progress').get();
  if (progressCount.count === 0) {
    const insertProgress = db.prepare(`
      INSERT INTO processing_progress (requirement_id, step_name, step_order, status, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertProgress.run(1, '工商提交', 1, 'completed', '2026-05-10 10:00:00', '2026-05-10 11:00:00');
    insertProgress.run(1, '材料补正', 2, 'completed', '2026-05-11 09:00:00', '2026-05-11 15:00:00');
    insertProgress.run(1, '领取执照', 3, 'in_progress', '2026-05-15 10:00:00', null);
    insertProgress.run(1, '刻章', 4, 'pending', null, null);
    insertProgress.run(1, '银行开户', 5, 'pending', null, null);
    
    insertProgress.run(2, '工商提交', 1, 'pending', null, null);
    insertProgress.run(2, '材料补正', 2, 'pending', null, null);
    insertProgress.run(2, '领取执照', 3, 'pending', null, null);
    insertProgress.run(2, '刻章', 4, 'pending', null, null);
    insertProgress.run(2, '银行开户', 5, 'pending', null, null);
    
    insertProgress.run(3, '工商提交', 1, 'completed', '2026-05-05 09:00:00', '2026-05-05 10:00:00');
    insertProgress.run(3, '材料补正', 2, 'completed', '2026-05-06 09:00:00', '2026-05-06 10:00:00');
    insertProgress.run(3, '领取执照', 3, 'completed', '2026-05-07 09:00:00', '2026-05-07 11:00:00');
    insertProgress.run(3, '刻章', 4, 'completed', '2026-05-08 09:00:00', '2026-05-08 12:00:00');
    insertProgress.run(3, '银行开户', 5, 'completed', '2026-05-09 09:00:00', '2026-05-09 15:00:00');
  }

  const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials').get();
  if (materialCount.count === 0) {
    const insertMaterial = db.prepare(`
      INSERT INTO materials (requirement_id, name, type, status, version, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertMaterial.run(1, '身份证复印件', 'document', 'confirmed', 1, '2026-05-10 09:00:00');
    insertMaterial.run(1, '租赁合同', 'document', 'pending_review', 1, '2026-05-10 09:00:00');
    insertMaterial.run(1, '房产证复印件', 'document', 'pending_upload', 1, '2026-05-10 09:00:00');
    insertMaterial.run(1, '公司章程', 'document', 'confirmed', 1, '2026-05-10 09:00:00');
    insertMaterial.run(1, '股东会决议', 'document', 'pending_upload', 1, '2026-05-10 09:00:00');
    insertMaterial.run(1, '加急办理申请书', 'document', 'pending_upload', 1, '2026-05-10 09:00:00');
    
    insertMaterial.run(2, '身份证复印件', 'document', 'pending_upload', 1, '2026-05-15 10:30:00');
    insertMaterial.run(2, '租赁合同', 'document', 'pending_upload', 1, '2026-05-15 10:30:00');
    insertMaterial.run(2, '房产证复印件', 'document', 'pending_upload', 1, '2026-05-15 10:30:00');
    insertMaterial.run(2, '一人有限公司承诺书', 'document', 'pending_upload', 1, '2026-05-15 10:30:00');
    
    insertMaterial.run(3, '身份证复印件', 'document', 'confirmed', 1, '2026-05-05 08:00:00');
    insertMaterial.run(3, '租赁合同', 'document', 'confirmed', 1, '2026-05-05 08:00:00');
    insertMaterial.run(3, '房产证复印件', 'document', 'confirmed', 1, '2026-05-05 08:00:00');
    insertMaterial.run(3, '个体工商户申请书', 'document', 'confirmed', 1, '2026-05-05 08:00:00');
  }

  const nameApprovalCount = db.prepare('SELECT COUNT(*) as count FROM name_approvals').get();
  if (nameApprovalCount.count === 0) {
    const insertNameApproval = db.prepare(`
      INSERT INTO name_approvals (requirement_id, alternative_names, approved_name, approval_result, rejection_reason, submission_count, status, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertNameApproval.run(
      1,
      JSON.stringify(['北京创新科技有限公司', '北京科创科技有限公司', '北京智慧科技有限公司']),
      null, null, '第一个名称重名', 1, 'pending', '2026-05-12 10:00:00'
    );
    
    insertNameApproval.run(
      3,
      JSON.stringify(['广州天河餐饮服务部', '广州美味餐饮服务部']),
      '广州天河餐饮服务部', 'approved', null, 1, 'approved', '2026-05-06 09:00:00'
    );
  }

  const acceptanceCount = db.prepare('SELECT COUNT(*) as count FROM acceptance_checks').get();
  if (acceptanceCount.count === 0) {
    const insertAcceptance = db.prepare(`
      INSERT INTO acceptance_checks (requirement_id, check_type, issue_description, responsible_person, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertAcceptance.run(
      1, 'name_rejection', '第一个备选名称"北京创新科技有限公司"与现有企业重名',
      '工商办理员王五', 'pending', '2026-05-13 10:00:00'
    );
    
    insertAcceptance.run(
      3, 'document_archiving', '所有证照已归档，档案编号：20260509001',
      '材料专员李四', 'resolved', '2026-05-09 16:00:00'
    );
  }
};

module.exports = { db, initDatabase };
