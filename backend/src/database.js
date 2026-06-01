const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'app.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'reception', 'doctor', 'lab', 'admin')),
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      target_audience TEXT,
      contraindications TEXT,
      price DECIMAL(10,2) NOT NULL,
      preparation TEXT,
      version INTEGER DEFAULT 1,
      is_published BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS package_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      target_audience TEXT,
      contraindications TEXT,
      price DECIMAL(10,2) NOT NULL,
      preparation TEXT,
      version INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id)
    );

    CREATE TABLE IF NOT EXISTS package_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      reference_range TEXT,
      unit TEXT,
      is_key BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id)
    );

    CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 10,
      booked INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, time)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_card TEXT,
      gender TEXT,
      age INTEGER,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      package_id INTEGER NOT NULL,
      package_version INTEGER NOT NULL,
      time_slot_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show', 'refunded')),
      payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'refunded')),
      payment_amount DECIMAL(10,2),
      payment_time DATETIME,
      check_in_time DATETIME,
      completed_time DATETIME,
      cancelled_time DATETIME,
      cancel_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (package_id) REFERENCES packages(id),
      FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)
    );

    CREATE TABLE IF NOT EXISTS appointment_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      change_type TEXT NOT NULL CHECK(change_type IN ('reschedule', 'cancel', 'status_change')),
      old_value TEXT,
      new_value TEXT,
      reason TEXT,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS checkup_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      package_item_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sampled', 'testing', 'completed', 'skipped')),
      result TEXT,
      is_abnormal BOOLEAN DEFAULT 0,
      doctor_id INTEGER,
      doctor_comment TEXT,
      sampled_time DATETIME,
      completed_time DATETIME,
      skip_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (package_item_id) REFERENCES package_items(id),
      FOREIGN KEY (doctor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER UNIQUE NOT NULL,
      report_no TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'pending_review', 'rejected', 'final')),
      overall_conclusion TEXT,
      recommendations TEXT,
      doctor_id INTEGER,
      reviewed_by INTEGER,
      review_comment TEXT,
      generated_at DATETIME,
      finalized_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (doctor_id) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS abnormal_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      checkup_record_id INTEGER NOT NULL,
      alert_level TEXT NOT NULL CHECK(alert_level IN ('low', 'medium', 'high')),
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (checkup_record_id) REFERENCES checkup_records(id)
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_checkup_appointment ON checkup_records(appointment_id);
    CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const insertUser = db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)');
    
    insertUser.run('admin', bcrypt.hashSync('admin123', 10), 'admin', '系统管理员');
    insertUser.run('reception', bcrypt.hashSync('reception123', 10), 'reception', '前台小王');
    insertUser.run('doctor', bcrypt.hashSync('doctor123', 10), 'doctor', '张医生');
    insertUser.run('lab', bcrypt.hashSync('lab123', 10), 'lab', '检验科李工');
    insertUser.run('customer1', bcrypt.hashSync('customer123', 10), 'customer', '测试客户');
  }

  const slotCount = db.prepare('SELECT COUNT(*) as count FROM time_slots').get().count;
  if (slotCount === 0) {
    const insertSlot = db.prepare('INSERT OR IGNORE INTO time_slots (date, time, capacity) VALUES (?, ?, ?)');
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      insertSlot.run(dateStr, '08:00', 10);
      insertSlot.run(dateStr, '08:30', 10);
      insertSlot.run(dateStr, '09:00', 10);
      insertSlot.run(dateStr, '09:30', 10);
      insertSlot.run(dateStr, '10:00', 10);
    }
  }

  const packageCount = db.prepare('SELECT COUNT(*) as count FROM packages').get().count;
  if (packageCount === 0) {
    const insertPackage = db.prepare(`
      INSERT INTO packages (name, description, target_audience, contraindications, price, preparation, version, is_published)
      VALUES (?, ?, ?, ?, ?, ?, 1, 1)
    `);
    
    const pkg1 = insertPackage.run('基础体检套餐', '适合健康人群的常规检查，包含血常规、尿常规、肝肾功能等基础项目', '健康人群', '无特殊禁忌', 299.00, '体检前空腹8小时，避免剧烈运动');
    const pkg1Id = pkg1.lastInsertRowid;
    
    const pkg2 = insertPackage.run('全面体检套餐', '包含基础检查及心脑血管、肿瘤筛查等深度检查，适合40岁以上人群', '40岁以上人群', '孕妇禁做X光检查', 899.00, '体检前空腹8小时，带齐既往病历');
    const pkg2Id = pkg2.lastInsertRowid;
    
    const pkg3 = insertPackage.run('精英体检套餐', '高端全面检查，包含头部CT、心脏彩超等深度项目', '高端商务人士', '孕妇禁做CT检查', 1999.00, '体检前空腹12小时，穿着宽松衣物');
    const pkg3Id = pkg3.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO package_items (package_id, name, category, description, reference_range, unit, is_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertItem.run(pkg1Id, '血常规', '检验科', '红细胞、白细胞、血小板等指标检测', '见报告单', '多项', 1);
    insertItem.run(pkg1Id, '尿常规', '检验科', '尿液常规检查', '见报告单', '多项', 0);
    insertItem.run(pkg1Id, '肝功能', '检验科', '谷丙转氨酶、谷草转氨酶等', '见报告单', 'U/L', 1);
    insertItem.run(pkg1Id, '肾功能', '检验科', '肌酐、尿素氮等', '见报告单', 'μmol/L', 1);
    insertItem.run(pkg1Id, '一般检查', '一般检查', '身高、体重、血压', '见报告单', '-', 0);
    insertItem.run(pkg1Id, '心电图', '辅助检查', '心脏电生理检查', '窦性心律', '-', 0);
    
    insertItem.run(pkg2Id, '血常规', '检验科', '红细胞、白细胞、血小板等指标检测', '见报告单', '多项', 1);
    insertItem.run(pkg2Id, '肝功能全套', '检验科', '肝脏功能全面检查', '见报告单', '多项', 1);
    insertItem.run(pkg2Id, '血脂四项', '检验科', '胆固醇、甘油三酯等', '见报告单', 'mmol/L', 1);
    insertItem.run(pkg2Id, '空腹血糖', '检验科', '空腹血糖检测', '3.9-6.1', 'mmol/L', 1);
    insertItem.run(pkg2Id, '胸部X光', '影像科', '胸部正位片', '未见明显异常', '-', 0);
    insertItem.run(pkg2Id, '腹部B超', '影像科', '肝、胆、胰、脾、肾检查', '未见明显异常', '-', 1);
    insertItem.run(pkg2Id, '肿瘤标志物', '检验科', 'AFP、CEA筛查', '见报告单', 'ng/mL', 1);
    
    insertItem.run(pkg3Id, '血常规', '检验科', '红细胞、白细胞、血小板等指标检测', '见报告单', '多项', 1);
    insertItem.run(pkg3Id, '生化全套', '检验科', '肝肾功能、电解质、血糖血脂', '见报告单', '多项', 1);
    insertItem.run(pkg3Id, '甲状腺功能', '检验科', 'TSH、T3、T4检测', '见报告单', '多项', 1);
    insertItem.run(pkg3Id, '心脏彩超', '影像科', '心脏结构和功能评估', '未见明显异常', '-', 1);
    insertItem.run(pkg3Id, '颈动脉彩超', '影像科', '颈动脉血管检查', '未见明显斑块', '-', 0);
    insertItem.run(pkg3Id, '头部CT', '影像科', '头颅断层扫描', '未见明显异常', '-', 1);
    insertItem.run(pkg3Id, '肿瘤标志物全套', '检验科', '多种肿瘤标志物检测', '见报告单', '多项', 1);

    db.prepare('INSERT INTO package_versions (package_id, name, description, target_audience, contraindications, price, preparation, version) SELECT id, name, description, target_audience, contraindications, price, preparation, 1 FROM packages').run();

    const insertCustomer = db.prepare('INSERT INTO customers (name, phone, id_card, gender, age, address) VALUES (?, ?, ?, ?, ?, ?)');
    const cust1 = insertCustomer.run('张三', '13800138001', '110101199001011234', '男', 34, '北京市朝阳区建国路88号');
    const cust1Id = cust1.lastInsertRowid;
    const cust2 = insertCustomer.run('李四', '13800138002', '310101198505055678', '女', 39, '上海市浦东新区陆家嘴');
    const cust2Id = cust2.lastInsertRowid;
    insertCustomer.run('王五', '13800138003', '440101197808089012', '男', 46, '广州市天河区珠江新城');

    const today = new Date().toISOString().split('T')[0];
    const todaySlot = db.prepare('SELECT id FROM time_slots WHERE date = ? LIMIT 1').get(today);
    const slotId = todaySlot?.id || 1;

    const insertAppointment = db.prepare(`
      INSERT INTO appointments (appointment_no, customer_id, package_id, package_version, time_slot_id, status, payment_status, payment_amount, payment_time, check_in_time)
      VALUES (?, ?, ?, 1, ?, 'confirmed', 'paid', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const apt1 = insertAppointment.run('A20260523001', cust1Id, pkg1Id, slotId, 299.00);
    const apt1Id = apt1.lastInsertRowid;
    
    const apt2 = insertAppointment.run('A20260523002', cust2Id, pkg2Id, slotId, 899.00);
    const apt2Id = apt2.lastInsertRowid;

    db.prepare('UPDATE time_slots SET booked = 2 WHERE id = ?').run(slotId);

    const itemsPkg1 = db.prepare('SELECT id FROM package_items WHERE package_id = ?').all(pkg1Id);
    const itemsPkg2 = db.prepare('SELECT id FROM package_items WHERE package_id = ?').all(pkg2Id);
    
    const insertRecord = db.prepare(`
      INSERT INTO checkup_records (appointment_id, package_item_id, status, result, is_abnormal, completed_time)
      VALUES (?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)
    `);
    
    insertRecord.run(apt1Id, itemsPkg1[0].id, '正常', 0);
    insertRecord.run(apt1Id, itemsPkg1[1].id, '正常', 0);
    insertRecord.run(apt1Id, itemsPkg1[2].id, '正常', 0);
    insertRecord.run(apt1Id, itemsPkg1[3].id, '正常', 0);
    insertRecord.run(apt1Id, itemsPkg1[4].id, '身高175cm 体重70kg', 0);
    insertRecord.run(apt1Id, itemsPkg1[5].id, '窦性心律', 0);

    insertRecord.run(apt2Id, itemsPkg2[0].id, '白细胞偏高', 1);
    insertRecord.run(apt2Id, itemsPkg2[1].id, '正常', 0);
    insertRecord.run(apt2Id, itemsPkg2[2].id, '胆固醇略高', 1);
    insertRecord.run(apt2Id, itemsPkg2[3].id, '5.8', 1);
    insertRecord.run(apt2Id, itemsPkg2[4].id, '正常', 0);
    insertRecord.run(apt2Id, itemsPkg2[5].id, '正常', 0);
    insertRecord.run(apt2Id, itemsPkg2[6].id, '正常', 0);

    db.prepare(`
      INSERT INTO abnormal_alerts (appointment_id, checkup_record_id, alert_level, message)
      VALUES (?, ?, 'medium', '白细胞偏高，建议复查')
    `).run(apt2Id, itemsPkg2[0].id);

    db.prepare(`
      INSERT INTO abnormal_alerts (appointment_id, checkup_record_id, alert_level, message)
      VALUES (?, ?, 'low', '胆固醇略高，建议低脂饮食')
    `).run(apt2Id, itemsPkg2[2].id);

    db.prepare(`
      UPDATE appointments SET status = 'completed', completed_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(apt1Id);

    db.prepare(`
      UPDATE appointments SET status = 'checked_in'
      WHERE id = ?
    `).run(apt2Id);

    const insertReport = db.prepare(`
      INSERT INTO reports (appointment_id, report_no, status, overall_conclusion, recommendations, doctor_id, generated_at, finalized_at)
      VALUES (?, ?, 'final', ?, ?, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    insertReport.run(apt1Id, 'R20260523001', '本次体检各项指标均在正常范围内，身体状况良好。', '建议保持规律作息，适量运动，每年定期体检。');

    db.prepare(`
      INSERT INTO reports (appointment_id, report_no, status, doctor_id, generated_at)
      VALUES (?, ?, 'draft', 3, CURRENT_TIMESTAMP)
    `).run(apt2Id, 'R20260523002');
  }
}

module.exports = { db, initDatabase };
