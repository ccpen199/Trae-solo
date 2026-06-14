const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/app.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功:', dbPath);
    initDatabase();
  }
});

function migrateTableColumns(callback) {
  const migrations = [
    {
      table: 'scenario_services',
      columns: [
        { name: 'handling_guide', definition: 'TEXT' },
        { name: 'banner', definition: 'TEXT' },
        { name: 'target_users', definition: 'TEXT' },
        { name: 'service_items', definition: 'TEXT' },
        { name: 'is_hot', definition: 'INTEGER DEFAULT 0' },
        { name: 'sort_order', definition: 'INTEGER DEFAULT 0' }
      ]
    },
    {
      table: 'roles',
      columns: [
        { name: 'code', definition: 'TEXT' },
        { name: 'status', definition: 'INTEGER DEFAULT 1' },
        { name: 'updated_at', definition: 'DATETIME' }
      ],
      after: () => {
        db.run('UPDATE roles SET code = level WHERE code IS NULL OR code = \'\'', (err) => {
          if (!err && this.changes > 0) console.log('更新 roles.code 字段值:', this.changes, '行');
        });
      }
    },
    {
      table: 'users',
      columns: [
        { name: 'department_id', definition: 'INTEGER' },
        { name: 'region_id', definition: 'INTEGER' },
        { name: 'last_login_ip', definition: 'TEXT' },
        { name: 'last_login_at', definition: 'DATETIME' },
        { name: 'region_level', definition: 'TEXT DEFAULT \'province\'' },
        { name: 'region_code', definition: 'TEXT' },
        { name: 'region_name', definition: 'TEXT' }
      ]
    },
    {
      table: 'departments',
      columns: [
        { name: 'contact_person', definition: 'TEXT' },
        { name: 'contact_phone', definition: 'TEXT' },
        { name: 'address', definition: 'TEXT' },
        { name: 'sort_order', definition: 'INTEGER DEFAULT 0' },
        { name: 'status', definition: 'INTEGER DEFAULT 1' },
        { name: 'updated_at', definition: 'DATETIME' }
      ]
    },
    {
      table: 'service_items',
      columns: [
        { name: 'fee_standards', definition: 'TEXT' },
        { name: 'faqs', definition: 'TEXT' },
        { name: 'materials_json', definition: 'TEXT' },
        { name: 'process_steps_json', definition: 'TEXT' }
      ]
    }
  ];

  let completedMigrations = 0;
  const totalMigrations = migrations.length;

  migrations.forEach(migration => {
    db.all(`PRAGMA table_info(${migration.table})`, (err, columns) => {
      if (err) {
        console.error(`检查表 ${migration.table} 结构失败:`, err.message);
        completedMigrations++;
        if (completedMigrations === totalMigrations) {
          runAfterMigrations(callback);
        }
        return;
      }
    
      const existingColumns = columns.map(c => c.name);
      let pending = 0;
      let addedAny = false;
    
      migration.columns.forEach(col => {
        if (!existingColumns.includes(col.name)) {
          pending++;
          addedAny = true;
          db.run(`ALTER TABLE ${migration.table} ADD COLUMN ${col.name} ${col.definition}`, (err) => {
            if (!err) console.log(`表 ${migration.table} 添加字段: ${col.name}`);
            pending--;
            if (pending === 0) {
              if (migration.after) migration.after();
              completedMigrations++;
              if (completedMigrations === totalMigrations) {
                runAfterMigrations(callback);
              }
            }
          });
        }
      });
    
      if (pending === 0) {
        if (addedAny && migration.after) migration.after();
        completedMigrations++;
        if (completedMigrations === totalMigrations) {
          runAfterMigrations(callback);
        }
      }
    });
  });
}

function runAfterMigrations(callback) {
  db.get('SELECT COUNT(*) as count FROM roles WHERE code = ?', ['agent'], (err, row) => {
    if (!err && row.count === 0) {
      db.run('INSERT INTO roles (name, code, description, level, permissions) VALUES (?, ?, ?, ?, ?)',
        ['客服坐席', 'agent', '智能问答与人工坐席', 'agent', '["chat:manage","chat:reply"]'],
        function(err) {
          if (!err) console.log('添加缺失角色: 客服坐席 (agent), ID:', this.lastID);
        });
    }
  });

  db.get('SELECT COUNT(*) as count FROM users WHERE username = ?', ['agent01'], (err, row) => {
    if (!err && row.count === 0) {
      const salt = bcrypt.genSaltSync(10);
      const pwd = bcrypt.hashSync('123456', salt);
      db.run('INSERT INTO users (username, password, real_name, level, region_level, region_code, region_name, phone, id_card, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['agent01', pwd, '周坐席', 'user', 'province', '510000', '四川省', '13800000008', '510104199001010008', 1],
        function(err) {
          if (!err) {
            const userId = this.lastID;
            console.log('添加缺失用户: agent01, ID:', userId);
            db.get('SELECT id FROM roles WHERE code = ?', ['agent'], (err, role) => {
              if (!err && role) {
                db.run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, role.id],
                  function(err) {
                    if (!err) console.log('关联 agent01 到 agent 角色');
                  });
              }
            });
          }
        });
    }
  });

  setTimeout(() => {
    console.log('数据库表字段检查完成');
    callback();
  }, 200);
}

function initDatabase() {
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    db.run(`CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT,
      level TEXT DEFAULT 'user',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      real_name TEXT,
      id_card TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      avatar TEXT,
      level TEXT DEFAULT 'user',
      region_level TEXT DEFAULT 'province',
      region_code TEXT,
      region_name TEXT,
      department_id INTEGER,
      region_id INTEGER,
      status INTEGER DEFAULT 1,
      last_login_at DATETIME,
      last_login_ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (region_id) REFERENCES regions(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      UNIQUE(user_id, role_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      parent_code TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      region_code TEXT,
      parent_id INTEGER,
      description TEXT,
      contact_info TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      address TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES departments(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS service_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_code TEXT NOT NULL UNIQUE,
      item_name TEXT NOT NULL,
      item_type TEXT,
      service_type TEXT,
      department_id INTEGER NOT NULL,
      region_code TEXT NOT NULL,
      region_level TEXT NOT NULL,
      legal_basis TEXT,
      handling_object TEXT,
      acceptance_conditions TEXT,
      handling_materials TEXT,
      handling_process TEXT,
      handling_time_limit TEXT,
      charging_standards TEXT,
      consulting_phone TEXT,
      complaint_phone TEXT,
      handling_location TEXT,
      online_handling_url TEXT,
      work_time TEXT,
      faq TEXT,
      status INTEGER DEFAULT 1,
      is_online INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      access_mode TEXT DEFAULT 'api',
      publish_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_item_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      requirement TEXT,
      format TEXT,
      quantity INTEGER DEFAULT 1,
      is_required INTEGER DEFAULT 1,
      sample_url TEXT,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_item_id) REFERENCES service_items(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS charging_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      fee_type TEXT,
      fee_standard TEXT,
      fee_basis TEXT,
      is_free INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_item_id) REFERENCES service_items(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS process_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_item_id INTEGER NOT NULL,
      step_no INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      step_content TEXT,
      handling_time TEXT,
      handling_department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_item_id) REFERENCES service_items(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS faq_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_item_id INTEGER,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_item_id) REFERENCES service_items(id) ON DELETE SET NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS scenario_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_code TEXT NOT NULL UNIQUE,
      scenario_name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      banner TEXT,
      service_items TEXT,
      target_users TEXT,
      handling_guide TEXT,
      is_hot INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT NOT NULL UNIQUE,
      service_item_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      applicant_name TEXT NOT NULL,
      applicant_phone TEXT,
      applicant_id_card TEXT,
      application_data TEXT,
      materials TEXT,
      current_status TEXT DEFAULT 'pending',
      current_step INTEGER DEFAULT 0,
      total_steps INTEGER DEFAULT 0,
      submit_time DATETIME,
      accept_time DATETIME,
      complete_time DATETIME,
      result TEXT,
      result_file TEXT,
      handling_opinion TEXT,
      is_paid INTEGER DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      paid_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_item_id) REFERENCES service_items(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS application_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      step_no INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      status TEXT NOT NULL,
      handler TEXT,
      handle_time DATETIME,
      opinion TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS application_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      material_name TEXT NOT NULL,
      file_url TEXT,
      file_name TEXT,
      file_size INTEGER,
      upload_time DATETIME,
      is_verified INTEGER DEFAULT 0,
      verify_opinion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      service_item_id INTEGER NOT NULL,
      overall_rating INTEGER NOT NULL,
      speed_rating INTEGER,
      attitude_rating INTEGER,
      result_rating INTEGER,
      content TEXT,
      suggestions TEXT,
      is_anonymous INTEGER DEFAULT 0,
      status TEXT DEFAULT 'normal',
      reply TEXT,
      reply_time DATETIME,
      replier TEXT,
      is_rectified INTEGER DEFAULT 0,
      rectification_plan TEXT,
      rectification_result TEXT,
      rectification_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (service_item_id) REFERENCES service_items(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS policy_interpretations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      policy_type TEXT,
      publish_department TEXT,
      publish_time DATETIME,
      file_url TEXT,
      view_count INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      user_id INTEGER,
      message_type TEXT NOT NULL,
      content TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      sender_name TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      user_id INTEGER,
      service_type TEXT,
      status TEXT DEFAULT 'active',
      agent_id INTEGER,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (agent_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      operation TEXT NOT NULL,
      module TEXT,
      target_type TEXT,
      target_id INTEGER,
      detail TEXT,
      ip_address TEXT,
      user_agent TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      operator_id INTEGER,
      operator_name TEXT,
      operation TEXT NOT NULL,
      detail TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT NOT NULL,
      alert_level TEXT DEFAULT 'warning',
      title TEXT NOT NULL,
      content TEXT,
      related_type TEXT,
      related_id INTEGER,
      handler_id INTEGER,
      status TEXT DEFAULT 'pending',
      handled_time DATETIME,
      handle_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (handler_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS electronic_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cert_type TEXT NOT NULL,
      cert_no TEXT,
      cert_name TEXT,
      issue_authority TEXT,
      issue_date DATETIME,
      valid_date DATETIME,
      cert_data TEXT,
      cert_file TEXT,
      is_verified INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS digital_signatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      sign_data TEXT,
      sign_time DATETIME,
      sign_cert TEXT,
      sign_result TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      payment_no TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'pending',
      payment_time DATETIME,
      transaction_id TEXT,
      refund_status TEXT DEFAULT 'none',
      refund_time DATETIME,
      refund_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS national_platform_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_type TEXT NOT NULL,
      sync_direction TEXT NOT NULL,
      data_type TEXT,
      data_id INTEGER,
      sync_status TEXT DEFAULT 'pending',
      sync_time DATETIME,
      response_data TEXT,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS access_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_name TEXT NOT NULL,
      source_code TEXT NOT NULL UNIQUE,
      access_mode TEXT NOT NULL,
      api_url TEXT,
      api_key TEXT,
      callback_url TEXT,
      status INTEGER DEFAULT 1,
      last_sync_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS statistics_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stat_date DATE NOT NULL UNIQUE,
      total_visits INTEGER DEFAULT 0,
      total_applications INTEGER DEFAULT 0,
      completed_applications INTEGER DEFAULT 0,
      total_evaluations INTEGER DEFAULT 0,
      average_rating REAL DEFAULT 0,
      avg_handling_time REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS statistics_service (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stat_date DATE NOT NULL,
      service_item_id INTEGER NOT NULL,
      application_count INTEGER DEFAULT 0,
      completed_count INTEGER DEFAULT 0,
      average_rating REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_item_id) REFERENCES service_items(id),
      UNIQUE(stat_date, service_item_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS statistics_region (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stat_date DATE NOT NULL,
      region_code TEXT NOT NULL,
      application_count INTEGER DEFAULT 0,
      completed_count INTEGER DEFAULT 0,
      average_rating REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(stat_date, region_code)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'system',
      related_type TEXT,
      related_id INTEGER,
      is_read INTEGER DEFAULT 0,
      read_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    console.log('数据库表初始化完成');

    migrateTableColumns(() => {
      db.run('UPDATE roles SET code = level WHERE code IS NULL OR code = ""');
      db.run('UPDATE roles SET status = 1 WHERE status IS NULL');
      db.run('UPDATE departments SET status = 1 WHERE status IS NULL');
      console.log('数据库表字段检查完成');
      initSeedData();
    });
  });
}

function initSeedData() {
  const now = new Date().toISOString();

  db.get('SELECT COUNT(*) as count FROM roles', (err, row) => {
    if (err || row.count > 0) return;

    const roles = [
      { name: '超级管理员', code: 'super_admin', level: 'admin', permissions: 'all' },
      { name: '省级管理员', code: 'province_admin', level: 'admin', permissions: 'province' },
      { name: '市级管理员', code: 'city_admin', level: 'admin', permissions: 'city' },
      { name: '县级管理员', code: 'county_admin', level: 'admin', permissions: 'county' },
      { name: '审批人员', code: 'approver', level: 'user', permissions: 'approve' },
      { name: '窗口人员', code: 'staff', level: 'user', permissions: 'window' },
      { name: '客服坐席', code: 'agent', level: 'user', permissions: 'chat' },
      { name: '普通用户', code: 'user', level: 'user', permissions: 'apply' }
    ];

    roles.forEach(role => {
      db.run('INSERT INTO roles (name, code, description, level, permissions) VALUES (?, ?, ?, ?, ?)',
        [role.name, role.code, role.name, role.level, role.permissions]);
    });

    console.log('角色数据初始化完成');
  });

  db.get('SELECT COUNT(*) as count FROM regions', (err, row) => {
    if (err || row.count > 0) return;

    const regions = [
      { code: '510000', name: '四川省', level: 'province', parent_code: null, sort_order: 1 },
      { code: '510100', name: '成都市', level: 'city', parent_code: '510000', sort_order: 1 },
      { code: '510300', name: '自贡市', level: 'city', parent_code: '510000', sort_order: 2 },
      { code: '510400', name: '攀枝花市', level: 'city', parent_code: '510000', sort_order: 3 },
      { code: '510500', name: '泸州市', level: 'city', parent_code: '510000', sort_order: 4 },
      { code: '510600', name: '德阳市', level: 'city', parent_code: '510000', sort_order: 5 },
      { code: '510700', name: '绵阳市', level: 'city', parent_code: '510000', sort_order: 6 },
      { code: '510104', name: '锦江区', level: 'county', parent_code: '510100', sort_order: 1 },
      { code: '510105', name: '青羊区', level: 'county', parent_code: '510100', sort_order: 2 },
      { code: '510106', name: '金牛区', level: 'county', parent_code: '510100', sort_order: 3 },
      { code: '510107', name: '武侯区', level: 'county', parent_code: '510100', sort_order: 4 },
      { code: '510112', name: '龙泉驿区', level: 'county', parent_code: '510100', sort_order: 5 }
    ];

    regions.forEach(region => {
      db.run('INSERT INTO regions (code, name, level, parent_code, sort_order) VALUES (?, ?, ?, ?, ?)',
        [region.code, region.name, region.level, region.parent_code, region.sort_order]);
    });

    console.log('行政区划数据初始化完成');
  });

  db.get('SELECT COUNT(*) as count FROM departments', (err, row) => {
    if (err || row.count > 0) return;

    const departments = [
      { code: 'SC-SZF', name: '四川省人民政府', region_code: '510000', description: '四川省人民政府办公厅', contact_info: '028-12345' },
      { code: 'SC-GXJ', name: '四川省公安厅', region_code: '510000', description: '四川省公安厅', contact_info: '028-86301114' },
      { code: 'SC-MZJ', name: '四川省民政厅', region_code: '510000', description: '四川省民政厅', contact_info: '028-84423000' },
      { code: 'SC-SHJ', name: '四川省市场监督管理局', region_code: '510000', description: '四川省市场监督管理局', contact_info: '028-86607500' },
      { code: 'SC-SWJ', name: '四川省税务局', region_code: '510000', description: '国家税务总局四川省税务局', contact_info: '028-86734526' },
      { code: 'CD-SZF', name: '成都市人民政府', region_code: '510100', description: '成都市人民政府办公厅', contact_info: '028-12345' },
      { code: 'CD-GXJ', name: '成都市公安局', region_code: '510100', description: '成都市公安局', contact_info: '028-86407114' },
      { code: 'CD-MZJ', name: '成都市民政局', region_code: '510100', description: '成都市民政局', contact_info: '028-61881700' }
    ];

    departments.forEach(dept => {
      db.run('INSERT INTO departments (code, name, region_code, description, contact_info) VALUES (?, ?, ?, ?, ?)',
        [dept.code, dept.name, dept.region_code, dept.description, dept.contact_info]);
    });

    console.log('部门数据初始化完成');
  });

  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err || row.count > 0) return;

    const salt = bcrypt.genSaltSync(10);
    const defaultPwd = bcrypt.hashSync('123456', salt);

    const users = [
      { username: 'admin', password: defaultPwd, real_name: '系统管理员', level: 'admin', region_level: 'province', region_code: '510000', region_name: '四川省', phone: '13800000001' },
      { username: 'province01', password: defaultPwd, real_name: '省级管理员', level: 'admin', region_level: 'province', region_code: '510000', region_name: '四川省', phone: '13800000002' },
      { username: 'city01', password: defaultPwd, real_name: '成都市级管理员', level: 'admin', region_level: 'city', region_code: '510100', region_name: '成都市', phone: '13800000003' },
      { username: 'county01', password: defaultPwd, real_name: '锦江区管理员', level: 'admin', region_level: 'county', region_code: '510104', region_name: '锦江区', phone: '13800000004' },
      { username: 'staff01', password: defaultPwd, real_name: '窗口工作人员', level: 'user', region_level: 'province', region_code: '510000', region_name: '四川省', phone: '13800000005' },
      { username: 'approver01', password: defaultPwd, real_name: '审批人员', level: 'user', region_level: 'province', region_code: '510000', region_name: '四川省', phone: '13800000006' },
      { username: 'agent01', password: defaultPwd, real_name: '客服坐席', level: 'user', region_level: 'province', region_code: '510000', region_name: '四川省', phone: '13800000007' },
      { username: 'user01', password: defaultPwd, real_name: '张三', level: 'user', region_level: 'province', region_code: '510000', region_name: '四川省', phone: '13900000001', id_card: '510104199001010001' }
    ];

    users.forEach((user, index) => {
      db.run('INSERT INTO users (username, password, real_name, level, region_level, region_code, region_name, phone, id_card) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.username, user.password, user.real_name, user.level, user.region_level, user.region_code, user.region_name, user.phone, user.id_card],
        function(err) {
          if (!err) {
            const roleId = index < 7 ? index + 1 : 8;
            db.run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [this.lastID, roleId]);
          }
        }
      );
    });

    console.log('用户数据初始化完成');
  });

  db.get('SELECT COUNT(*) as count FROM service_items', (err, row) => {
    if (err || row.count > 0) return;

    const serviceItems = [
      {
        item_code: 'SC-510000-GXJ-001',
        item_name: '居民身份证办理',
        item_type: '行政确认',
        service_type: '个人服务',
        department_id: 2,
        region_code: '510000',
        region_level: 'province',
        legal_basis: '《中华人民共和国居民身份证法》',
        handling_object: '年满16周岁的中国公民',
        acceptance_conditions: JSON.stringify([
          '具有中华人民共和国国籍',
          '年满十六周岁',
          '应当自年满十六周岁之日起三个月内申请'
        ]),
        handling_materials: JSON.stringify([
          { name: '居民户口簿', required: true, format: '原件', quantity: 1 },
          { name: '近期免冠照片', required: true, format: '电子照', quantity: 1 }
        ]),
        handling_process: JSON.stringify([
          { step: 1, name: '申请', desc: '携带材料到户籍所在地派出所申请' },
          { step: 2, name: '受理', desc: '工作人员审核材料，采集人像和指纹' },
          { step: 3, name: '缴费', desc: '缴纳证件工本费20元' },
          { step: 4, name: '制证', desc: '省级公安机关制证' },
          { step: 5, name: '领证', desc: '20个工作日后领取证件' }
        ]),
        handling_time_limit: JSON.stringify({ promise: '20个工作日', legal: '60个工作日' }),
        charging_standards: JSON.stringify([
          { item: '居民身份证工本费', standard: '20元/证', basis: '发改价格[2003]2322号' }
        ]),
        consulting_phone: '028-86301114',
        complaint_phone: '028-86301114',
        handling_location: '户籍所在地派出所',
        work_time: '周一至周五 9:00-17:00',
        faq: JSON.stringify([
          { q: '身份证丢失怎么办？', a: '请及时到派出所申请补领' },
          { q: '可以异地办理吗？', a: '四川省内已实现异地办理' }
        ]),
        is_online: 1,
        is_hot: 1,
        access_mode: 'api',
        publish_time: now
      },
      {
        item_code: 'SC-510000-MZJ-001',
        item_name: '结婚登记',
        item_type: '行政确认',
        service_type: '个人服务',
        department_id: 3,
        region_code: '510000',
        region_level: 'province',
        legal_basis: '《中华人民共和国民法典》、《婚姻登记条例》',
        handling_object: '符合结婚条件的男女双方',
        acceptance_conditions: JSON.stringify([
          '双方自愿结婚',
          '男方年满22周岁，女方年满20周岁',
          '双方均无配偶',
          '双方没有直系血亲和三代以内旁系血亲关系'
        ]),
        handling_materials: JSON.stringify([
          { name: '本人户口簿', required: true, format: '原件', quantity: 1 },
          { name: '本人居民身份证', required: true, format: '原件', quantity: 1 },
          { name: '三张2寸双方近期半身免冠合影照片', required: true, format: '纸质', quantity: 3 }
        ]),
        handling_process: JSON.stringify([
          { step: 1, name: '申请', desc: '双方共同到一方常住户口所在地的婚姻登记机关申请' },
          { step: 2, name: '审查', desc: '登记机关审查材料，询问相关情况' },
          { step: 3, name: '登记', desc: '符合条件的，当场予以登记，发给结婚证' }
        ]),
        handling_time_limit: JSON.stringify({ promise: '当场办理', legal: '当场办理' }),
        charging_standards: JSON.stringify([{ item: '婚姻登记工本费', standard: '免费', basis: '财税[2014]101号', is_free: 1 }]),
        consulting_phone: '028-84423000',
        complaint_phone: '028-84423000',
        handling_location: '一方常住户口所在地的婚姻登记机关',
        work_time: '周一至周五 9:00-17:00',
        faq: JSON.stringify([
          { q: '需要提前预约吗？', a: '建议提前1-2个工作日网上预约' },
          { q: '身份证过期了能办理吗？', a: '请先换领有效身份证' }
        ]),
        is_online: 1,
        is_hot: 1,
        access_mode: 'api',
        publish_time: now
      },
      {
        item_code: 'SC-510000-SHJ-001',
        item_name: '企业设立登记',
        item_type: '行政许可',
        service_type: '企业服务',
        department_id: 4,
        region_code: '510000',
        region_level: 'province',
        legal_basis: '《中华人民共和国公司法》、《市场主体登记管理条例》',
        handling_object: '拟设立有限责任公司的申请人',
        acceptance_conditions: JSON.stringify([
          '股东符合法定人数（50个以下）',
          '有符合公司章程规定的全体股东认缴的出资额',
          '股东共同制定公司章程',
          '有公司名称，建立符合有限责任公司要求的组织机构',
          '有公司住所'
        ]),
        handling_materials: JSON.stringify([
          { name: '公司设立登记申请书', required: true, format: '电子/纸质', quantity: 1 },
          { name: '公司章程', required: true, format: '电子/纸质', quantity: 1 },
          { name: '股东身份证明', required: true, format: '复印件', quantity: 1 },
          { name: '法定代表人任职文件', required: true, format: '电子/纸质', quantity: 1 },
          { name: '住所使用证明', required: true, format: '电子/纸质', quantity: 1 }
        ]),
        handling_process: JSON.stringify([
          { step: 1, name: '名称自主申报', desc: '在网上登记系统进行名称申报' },
          { step: 2, name: '提交材料', desc: '在线填报并上传申请材料' },
          { step: 3, name: '受理审核', desc: '登记机关1-3个工作日内审核' },
          { step: 4, name: '领取执照', desc: '审核通过后领取电子营业执照或纸质执照' }
        ]),
        handling_time_limit: JSON.stringify({ promise: '3个工作日', legal: '15个工作日' }),
        charging_standards: JSON.stringify([{ item: '企业设立登记费', standard: '免费', basis: '财税[2014]101号', is_free: 1 }]),
        consulting_phone: '028-86607500',
        complaint_phone: '028-86607500',
        handling_location: '网上办理或经营场所所在地登记机关',
        online_handling_url: 'http://127.0.0.1:49072/online/apply',
        work_time: '周一至周五 9:00-17:00',
        faq: JSON.stringify([
          { q: '注册资本需要实缴吗？', a: '现在实行注册资本认缴制，不需要实缴' },
          { q: '一个人可以设立有限公司吗？', a: '可以设立一人有限责任公司' }
        ]),
        is_online: 1,
        is_hot: 1,
        access_mode: 'api',
        publish_time: now
      },
      {
        item_code: 'SC-510000-SWJ-001',
        item_name: '个人所得税纳税申报',
        item_type: '行政征收',
        service_type: '个人服务',
        department_id: 5,
        region_code: '510000',
        region_level: 'province',
        legal_basis: '《中华人民共和国个人所得税法》',
        handling_object: '取得应税所得的个人',
        acceptance_conditions: JSON.stringify([
          '取得综合所得需要办理汇算清缴',
          '取得应税所得没有扣缴义务人',
          '取得应税所得，扣缴义务人未扣缴税款',
          '取得境外所得',
          '因移居境外注销中国户籍'
        ]),
        handling_materials: JSON.stringify([
          { name: '个人所得税纳税申报表', required: true, format: '电子', quantity: 1 },
          { name: '个人身份证件', required: true, format: '电子件', quantity: 1 },
          { name: '收入证明材料', required: false, format: '电子件', quantity: 1 }
        ]),
        handling_process: JSON.stringify([
          { step: 1, name: '登录系统', desc: '登录自然人电子税务局' },
          { step: 2, name: '填写申报表', desc: '根据实际情况填写申报表' },
          { step: 3, name: '提交申报', desc: '核对无误后提交申报' },
          { step: 4, name: '缴纳税款', desc: '如有应缴税款，在线缴纳' }
        ]),
        handling_time_limit: JSON.stringify({ promise: '即时办结', legal: '即时办结' }),
        charging_standards: JSON.stringify([{ item: '无', standard: '免费', basis: '无', is_free: 1 }]),
        consulting_phone: '12366',
        complaint_phone: '12366',
        handling_location: '自然人电子税务局或办税服务厅',
        work_time: '全天候（网上）',
        faq: JSON.stringify([
          { q: '哪些人需要办理年度汇算？', a: '年度综合所得收入超过12万元且需要补税金额超过400元的' },
          { q: '可以享受哪些专项附加扣除？', a: '子女教育、继续教育、大病医疗、住房贷款利息、住房租金、赡养老人、3岁以下婴幼儿照护' }
        ]),
        is_online: 1,
        is_hot: 0,
        access_mode: 'api',
        publish_time: now
      }
    ];

    serviceItems.forEach(item => {
      db.run(`INSERT INTO service_items (
        item_code, item_name, item_type, service_type, department_id, region_code, region_level,
        legal_basis, handling_object, acceptance_conditions, handling_materials, handling_process,
        handling_time_limit, charging_standards, consulting_phone, complaint_phone, handling_location,
        online_handling_url, work_time, faq, is_online, is_hot, access_mode, publish_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.item_code, item.item_name, item.item_type, item.service_type, item.department_id,
          item.region_code, item.region_level, item.legal_basis, item.handling_object,
          item.acceptance_conditions, item.handling_materials, item.handling_process,
          item.handling_time_limit, item.charging_standards, item.consulting_phone,
          item.complaint_phone, item.handling_location, item.online_handling_url,
          item.work_time, item.faq, item.is_online, item.is_hot, item.access_mode, item.publish_time
        ]
      );
    });

    console.log('服务事项数据初始化完成');
  });

  db.get('SELECT COUNT(*) as count FROM scenario_services', (err, row) => {
    if (err || row.count > 0) return;

    const scenarios = [
      {
        scenario_code: 'SCENE-XSE',
        scenario_name: '新生儿一件事',
        description: '为新生儿提供出生医学证明、户口登记、社保参保等联办服务',
        icon: '👶',
        target_users: JSON.stringify(['新生儿父母', '法定监护人']),
        handling_guide: '1. 出生医学证明签发 → 2. 预防接种证办理 → 3. 户口登记 → 4. 城乡居民医疗保险参保 → 5. 社会保障卡申领',
        service_items: JSON.stringify([1, 2]),
        is_hot: 1,
        sort_order: 1
      },
      {
        scenario_code: 'SCENE-QYKB',
        scenario_name: '企业开办一件事',
        description: '企业设立登记、公章刻制、发票申领、社保登记等一站式办理',
        icon: '🏢',
        target_users: JSON.stringify(['企业设立申请人', '创业者']),
        handling_guide: '1. 企业名称自主申报 → 2. 设立登记 → 3. 公章刻制备案 → 4. 发票和税控设备申领 → 5. 企业社会保险登记 → 6. 住房公积金单位缴存登记',
        service_items: JSON.stringify([3]),
        is_hot: 1,
        sort_order: 2
      },
      {
        scenario_code: 'SCENE-JYD',
        scenario_name: '就业创业一件事',
        description: '失业登记、求职登记、创业担保贷款申请等就业创业服务',
        icon: '💼',
        target_users: JSON.stringify(['求职者', '创业者', '失业人员']),
        handling_guide: '1. 失业登记 → 2. 求职登记 → 3. 职业培训 → 4. 创业担保贷款申请 → 5. 灵活就业社保补贴',
        service_items: JSON.stringify([]),
        is_hot: 0,
        sort_order: 3
      },
      {
        scenario_code: 'SCENE-LH',
        scenario_name: '公民身后一件事',
        description: '死亡医学证明、户口注销、社保终止、公积金提取等联办',
        icon: '🕯️',
        target_users: JSON.stringify(['逝者家属', '法定继承人']),
        handling_guide: '1. 死亡医学证明 → 2. 户口注销 → 3. 养老保险个人账户余额继承 → 4. 医疗保险个人账户余额继承 → 5. 住房公积金提取',
        service_items: JSON.stringify([]),
        is_hot: 0,
        sort_order: 4
      }
    ];

    scenarios.forEach(s => {
      db.run('INSERT INTO scenario_services (scenario_code, scenario_name, description, icon, target_users, handling_guide, service_items, is_hot, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [s.scenario_code, s.scenario_name, s.description, s.icon, s.target_users, s.handling_guide, s.service_items, s.is_hot, s.sort_order]);
    });

    console.log('场景式服务数据初始化完成');
  });

  db.get('SELECT COUNT(*) as count FROM policy_interpretations', (err, row) => {
    if (err || row.count > 0) return;

    const policies = [
      {
        title: '《四川省优化营商环境条例》解读',
        content: '本条例旨在持续优化营商环境，维护市场主体合法权益，激发市场活力和社会创造力...',
        policy_type: '地方性法规',
        publish_department: '四川省人大常委会',
        publish_time: now,
        is_hot: 1,
        sort_order: 1
      },
      {
        title: '四川省政务服务事项管理办法解读',
        content: '为加强政务服务事项管理，推进政务服务标准化、规范化、便利化，根据相关法律法规制定本办法...',
        policy_type: '政府规章',
        publish_department: '四川省人民政府',
        publish_time: now,
        is_hot: 1,
        sort_order: 2
      },
      {
        title: '关于推进"一件事一次办"改革的实施意见',
        content: '深入贯彻落实党中央、国务院关于深化"放管服"改革优化营商环境决策部署...',
        policy_type: '规范性文件',
        publish_department: '四川省人民政府办公厅',
        publish_time: now,
        is_hot: 0,
        sort_order: 3
      }
    ];

    policies.forEach(p => {
      db.run('INSERT INTO policy_interpretations (title, content, policy_type, publish_department, publish_time, is_hot, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.title, p.content, p.policy_type, p.publish_department, p.publish_time, p.is_hot, p.sort_order]);
    });

    console.log('政策解读数据初始化完成');
  });

  db.get('SELECT COUNT(*) as count FROM faq_items', (err, row) => {
    if (err || row.count > 0) return;

    const faqs = [
      { question: '如何查询办件进度？', answer: '您可以通过"个人中心-我的办件"查看所有办件的当前进度和详细信息。', category: '办件查询', sort_order: 1 },
      { question: '网上申请需要实名认证吗？', answer: '是的，为了保护您的信息安全，办理政务服务事项需要进行实名认证。', category: '账号相关', sort_order: 2 },
      { question: '申请材料上传后还能修改吗？', answer: '在审核人员受理前，您可以撤回申请并修改材料；受理后如需修改，请联系办理窗口。', category: '材料相关', sort_order: 3 },
      { question: '如何查看电子证照？', answer: '登录后在"个人中心-我的证照"中可以查看和管理您的所有电子证照。', category: '证照相关', sort_order: 4 },
      { question: '评价后可以修改吗？', answer: '评价提交后不可修改，但如果您对服务有新的意见，可以在评价后30天内进行追评。', category: '评价相关', sort_order: 5 }
    ];

    faqs.forEach(f => {
      db.run('INSERT INTO faq_items (question, answer, category, sort_order) VALUES (?, ?, ?, ?)',
        [f.question, f.answer, f.category, f.sort_order]);
    });

    console.log('常见问题数据初始化完成');
  });
}

db.runAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

db.getAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = db;
