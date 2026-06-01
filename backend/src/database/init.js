const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
    });

    db.serialize(() => {
      db.run(`PRAGMA foreign_keys = ON`);

      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'nurse', 'caregiver', 'social_worker', 'logistics', 'family')),
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS elderly (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        gender TEXT CHECK(gender IN ('男', '女')),
        birth_date DATE,
        id_card TEXT UNIQUE,
        room_number TEXT,
        bed_number TEXT,
        health_status TEXT,
        care_level TEXT CHECK(care_level IN ('自理', '半自理', '全护理', '特护')),
        allergy_history TEXT,
        diet_type TEXT,
        admission_date DATE,
        contract_number TEXT,
        package_id INTEGER,
        status TEXT DEFAULT '入住中' CHECK(status IN ('入住中', '请假', '出院', '离世')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (package_id) REFERENCES fee_packages(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        elderly_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        relationship TEXT,
        phone TEXT NOT NULL,
        address TEXT,
        is_emergency INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (elderly_id) REFERENCES elderly(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS medical_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        elderly_id INTEGER NOT NULL,
        record_type TEXT NOT NULL,
        content TEXT NOT NULL,
        recorded_by INTEGER,
        sensitivity_level TEXT DEFAULT 'normal' CHECK(sensitivity_level IN ('normal', 'confidential', 'restricted')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (elderly_id) REFERENCES elderly(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS fee_packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        base_fee REAL NOT NULL,
        care_fee REAL DEFAULT 0,
        meal_fee REAL DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS care_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        elderly_id INTEGER NOT NULL,
        plan_name TEXT NOT NULL,
        task_type TEXT NOT NULL CHECK(task_type IN ('翻身', '喂药', '测量', '康复', '活动', '巡房')),
        frequency TEXT NOT NULL,
        time_points TEXT NOT NULL,
        description TEXT,
        created_by INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (elderly_id) REFERENCES elderly(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS care_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER,
        elderly_id INTEGER NOT NULL,
        task_type TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        executed_by INTEGER NOT NULL,
        status TEXT DEFAULT '已完成' CHECK(status IN ('已完成', '异常', '未执行', '超时')),
        notes TEXT,
        abnormality TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plan_id) REFERENCES care_plans(id),
        FOREIGN KEY (elderly_id) REFERENCES elderly(id) ON DELETE CASCADE,
        FOREIGN KEY (executed_by) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        generic_name TEXT,
        specification TEXT,
        manufacturer TEXT,
        stock_quantity INTEGER DEFAULT 0,
        unit TEXT,
        warning_threshold INTEGER DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS medication_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        elderly_id INTEGER NOT NULL,
        medication_id INTEGER NOT NULL,
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        administration_route TEXT,
        start_date DATE,
        end_date DATE,
        prescribed_by INTEGER,
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (elderly_id) REFERENCES elderly(id) ON DELETE CASCADE,
        FOREIGN KEY (medication_id) REFERENCES medications(id),
        FOREIGN KEY (prescribed_by) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS medication_administration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        elderly_id INTEGER NOT NULL,
        scheduled_time DATETIME NOT NULL,
        administered_time DATETIME,
        administered_by INTEGER,
        status TEXT DEFAULT '待执行' CHECK(status IN ('待执行', '已执行', '漏服', '拒服', '延迟')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES medication_orders(id),
        FOREIGN KEY (elderly_id) REFERENCES elderly(id) ON DELETE CASCADE,
        FOREIGN KEY (administered_by) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_date DATE NOT NULL,
        meal_type TEXT NOT NULL CHECK(meal_type IN ('早餐', '午餐', '晚餐', '加餐')),
        menu TEXT NOT NULL,
        dietary_restrictions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS meal_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_id INTEGER NOT NULL,
        elderly_id INTEGER NOT NULL,
        intake_status TEXT CHECK(intake_status IN ('正常', '少量', '未进食', '家属送餐')),
        notes TEXT,
        recorded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meal_id) REFERENCES meals(id),
        FOREIGN KEY (elderly_id) REFERENCES elderly(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        elderly_id INTEGER NOT NULL,
        incident_type TEXT NOT NULL CHECK(incident_type IN ('跌倒', '突发疾病', '情绪异常', '走失', '其他')),
        severity TEXT CHECK(severity IN ('轻微', '一般', '严重', '紧急')),
        description TEXT NOT NULL,
        occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reported_by INTEGER NOT NULL,
        handled_by INTEGER,
        handling_notes TEXT,
        status TEXT DEFAULT '待处理' CHECK(status IN ('待处理', '处理中', '已处理', '已上报')),
        family_notified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (elderly_id) REFERENCES elderly(id) ON DELETE CASCADE,
        FOREIGN KEY (reported_by) REFERENCES users(id),
        FOREIGN KEY (handled_by) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS family_access (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_member_id INTEGER NOT NULL,
        elderly_id INTEGER NOT NULL,
        can_view_care_records INTEGER DEFAULT 1,
        can_view_photos INTEGER DEFAULT 1,
        can_view_fees INTEGER DEFAULT 1,
        can_receive_notifications INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_member_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (elderly_id) REFERENCES elderly(id) ON DELETE CASCADE,
        UNIQUE(family_member_id, elderly_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS activity_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        elderly_id INTEGER NOT NULL,
        photo_url TEXT NOT NULL,
        description TEXT,
        uploaded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (elderly_id) REFERENCES elderly(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS fee_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        elderly_id INTEGER NOT NULL,
        billing_month TEXT NOT NULL,
        total_amount REAL NOT NULL,
        paid_amount REAL DEFAULT 0,
        payment_status TEXT DEFAULT '待缴费' CHECK(payment_status IN ('待缴费', '部分缴费', '已缴费', '欠费')),
        due_date DATE,
        paid_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (elderly_id) REFERENCES elderly(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      const salt = bcrypt.genSaltSync(10);
      const adminPassword = bcrypt.hashSync('admin123', salt);
      const nursePassword = bcrypt.hashSync('nurse123', salt);
      const caregiverPassword = bcrypt.hashSync('care123', salt);
      const familyPassword = bcrypt.hashSync('family123', salt);

      db.run(`INSERT OR IGNORE INTO users (username, password, name, role, phone) VALUES 
        ('admin', ?, '系统管理员', 'admin', '13800138000'),
        ('nurse1', ?, '张护士', 'nurse', '13800138001'),
        ('caregiver1', ?, '李护理员', 'caregiver', '13800138002'),
        ('family1', ?, '王家属', 'family', '13800138003')`,
        [adminPassword, nursePassword, caregiverPassword, familyPassword]);

      db.run(`INSERT OR IGNORE INTO fee_packages (name, base_fee, care_fee, meal_fee, description) VALUES 
        ('标准护理套餐', 2000, 1500, 900, '包含基础住宿、护理和三餐'),
        ('全护理套餐', 2500, 3000, 900, '适用于完全不能自理的老人'),
        ('特护套餐', 3000, 5000, 1200, '24小时专人护理')`);

      db.run(`INSERT OR IGNORE INTO medications (name, generic_name, specification, manufacturer, stock_quantity, unit, warning_threshold) VALUES 
        ('硝苯地平控释片', '硝苯地平', '30mg*7片', '拜耳医药', 50, '盒', 10),
        ('二甲双胍片', '盐酸二甲双胍', '0.5g*30片', '中美上海施贵宝', 30, '盒', 10),
        ('阿司匹林肠溶片', '阿司匹林', '100mg*30片', '拜耳医药', 45, '盒', 10),
        ('胰岛素注射液', '胰岛素', '300IU/笔芯', '诺和诺德', 20, '支', 5)`);

      db.run(`INSERT OR IGNORE INTO elderly (name, gender, birth_date, id_card, room_number, bed_number, health_status, care_level, allergy_history, diet_type, admission_date, contract_number, package_id, status) VALUES 
        ('王爷爷', '男', '1945-03-15', '110101194503150001', '301', 'A', '高血压、糖尿病', '半自理', '青霉素过敏', '低糖低脂饮食', '2023-01-15', 'HT202301001', 2, '入住中'),
        ('李奶奶', '女', '1950-07-22', '110101195007220002', '301', 'B', '冠心病', '自理', '无', '低盐饮食', '2023-03-20', 'HT202303002', 1, '入住中'),
        ('张爷爷', '男', '1938-11-08', '110101193811080003', '302', 'A', '阿尔茨海默症', '全护理', '无', '软食', '2023-05-10', 'HT202305003', 3, '入住中')`);

      db.run(`INSERT OR IGNORE INTO contacts (elderly_id, name, relationship, phone, address, is_emergency) VALUES 
        (1, '王家属', '儿子', '13800138003', '北京市朝阳区', 1),
        (2, '李小明', '女儿', '13800138004', '北京市海淀区', 1),
        (3, '张建国', '儿子', '13800138005', '北京市西城区', 1)`);

      db.run(`INSERT OR IGNORE INTO family_access (family_member_id, elderly_id) VALUES 
        (4, 1)`);

      db.run(`INSERT OR IGNORE INTO care_plans (elderly_id, plan_name, task_type, frequency, time_points, description, created_by) VALUES 
        (1, '血压测量', '测量', '每日2次', '08:00,18:00', '测量血压并记录', 2),
        (1, '服用降糖药', '喂药', '每日2次', '08:00,18:00', '餐前30分钟服用', 2),
        (2, '晨间巡房', '巡房', '每日1次', '07:30', '询问夜间睡眠情况', 2),
        (3, '翻身拍背', '翻身', '每2小时1次', '08:00,10:00,12:00,14:00,16:00,18:00', '预防压疮', 2)`);

      db.run(`INSERT OR IGNORE INTO medication_orders (elderly_id, medication_id, dosage, frequency, administration_route, start_date, prescribed_by, notes) VALUES 
        (1, 1, '30mg', '每日1次', '口服', '2023-01-15', 2, '晨起服用'),
        (1, 2, '0.5g', '每日2次', '口服', '2023-01-15', 2, '餐前服用'),
        (2, 3, '100mg', '每日1次', '口服', '2023-03-20', 2, '饭后服用')`);

      db.run(`INSERT OR IGNORE INTO fee_records (elderly_id, billing_month, total_amount, paid_amount, payment_status, due_date) VALUES 
        (1, '2024-05', 6400, 6400, '已缴费', '2024-05-05'),
        (2, '2024-05', 4400, 0, '欠费', '2024-05-05'),
        (3, '2024-05', 9200, 9200, '已缴费', '2024-05-05')`);

      db.run(`INSERT OR IGNORE INTO care_records (elderly_id, task_type, executed_by, status, notes) VALUES 
        (1, '测量', 3, '已完成', '血压 135/85 mmHg'),
        (1, '喂药', 3, '已完成', '二甲双胍已服用'),
        (2, '巡房', 2, '已完成', '夜间睡眠良好')`);

      db.run(`INSERT OR IGNORE INTO incidents (elderly_id, incident_type, severity, description, reported_by, status) VALUES 
        (2, '跌倒', '轻微', '在走廊不慎滑倒，经检查无大碍', 2, '已处理'),
        (1, '情绪异常', '一般', '因思念家人情绪低落，已进行心理疏导', 3, '已处理')`);

      console.log('数据库初始化完成');
      resolve(db);
    });
  });
};

module.exports = { initDatabase, dbPath };
