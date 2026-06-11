import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database;

export function initDatabase(): Database.Database {
  const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedInitialData();

  console.log('[Database] SQLite database initialized at:', dbPath);
  return db;
}

export function getDb(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      real_name TEXT NOT NULL,
      id_card TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female', 'unknown')) NOT NULL,
      birth_date TEXT,
      avatar TEXT,
      address TEXT,
      email TEXT,
      education TEXT,
      occupation TEXT,
      marital_status TEXT,
      real_name_verified INTEGER DEFAULT 0,
      face_verified INTEGER DEFAULT 0,
      government_verified INTEGER DEFAULT 0,
      user_level INTEGER DEFAULT 1,
      tags TEXT DEFAULT '[]',
      password_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS insurance_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      insurance_type TEXT,
      payment_months INTEGER DEFAULT 0,
      pension_balance REAL DEFAULT 0,
      unemployment_months INTEGER DEFAULT 0,
      medical_type TEXT,
      last_payment_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      license_code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      type_name TEXT NOT NULL,
      holder_name TEXT NOT NULL,
      holder_id_card TEXT NOT NULL,
      issuer TEXT NOT NULL,
      issuer_code TEXT,
      issue_date TEXT NOT NULL,
      valid_from TEXT NOT NULL,
      valid_to TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'expiring', 'expired', 'revoked', 'lost', 'pending')) NOT NULL,
      verify_code TEXT UNIQUE NOT NULL,
      qr_code TEXT,
      front_image TEXT,
      back_image TEXT,
      electronic_signature INTEGER DEFAULT 0,
      verify_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS license_verify_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_id INTEGER NOT NULL,
      verify_method TEXT NOT NULL,
      verify_time TEXT NOT NULL,
      verifier TEXT NOT NULL,
      verify_location TEXT,
      result TEXT CHECK(result IN ('valid', 'invalid', 'expired')) NOT NULL,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS license_usage_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_id INTEGER NOT NULL,
      usage_scene TEXT NOT NULL,
      usage_time TEXT NOT NULL,
      usage_location TEXT,
      operator TEXT NOT NULL,
      result TEXT CHECK(result IN ('success', 'fail')) NOT NULL,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS matters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      matter_code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      type_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      form_data TEXT,
      materials TEXT,
      status TEXT CHECK(status IN ('pending', 'processing', 'supplement', 'completed', 'rejected', 'withdrawn')) NOT NULL,
      current_node TEXT NOT NULL,
      fee REAL DEFAULT 0,
      is_urgent INTEGER DEFAULT 0,
      is_cross_province INTEGER DEFAULT 0,
      target_province TEXT,
      target_city TEXT,
      applicant_name TEXT NOT NULL,
      applicant_id_card TEXT NOT NULL,
      applicant_phone TEXT NOT NULL,
      handle_organization TEXT,
      handler TEXT,
      handler_phone TEXT,
      estimated_finish_time TEXT,
      actual_finish_time TEXT,
      result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS approval_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matter_id INTEGER NOT NULL,
      node_code TEXT NOT NULL,
      node_name TEXT NOT NULL,
      node_role TEXT,
      node_order INTEGER NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'skipped')) NOT NULL,
      operator_id TEXT,
      operator_name TEXT,
      operated_at TEXT,
      remark TEXT,
      handle_result TEXT CHECK(handle_result IN ('approve', 'reject', 'transfer')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS matter_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matter_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('required', 'optional')) NOT NULL,
      format TEXT CHECK(format IN ('image', 'pdf', 'other')) NOT NULL,
      file_url TEXT NOT NULL,
      upload_time TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      verify_time TEXT,
      FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS trace_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matter_id INTEGER NOT NULL,
      operation_type TEXT NOT NULL,
      operation_name TEXT NOT NULL,
      description TEXT,
      operator TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      status TEXT NOT NULL,
      remark TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (matter_id) REFERENCES matters(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('system', 'business', 'approval', 'service')) NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent')) NOT NULL,
      is_read INTEGER DEFAULT 0,
      read_at TEXT,
      business_id TEXT,
      business_type TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS recommend_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      service_code TEXT NOT NULL,
      service_name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      description TEXT,
      confidence REAL NOT NULL,
      user_match_score INTEGER NOT NULL,
      reason_type TEXT CHECK(reason_type IN ('user_profile', 'behavior', 'hot', 'similar', 'location')) NOT NULL,
      reason TEXT NOT NULL,
      match_tags TEXT NOT NULL,
      satisfaction INTEGER NOT NULL,
      average_duration INTEGER NOT NULL,
      apply_count INTEGER NOT NULL,
      is_cross_province INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS behavior_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      service_id INTEGER,
      service_code TEXT,
      service_name TEXT,
      service_category TEXT,
      action_type TEXT CHECK(action_type IN ('view', 'apply', 'search', 'collect', 'share', 'behavior')) NOT NULL,
      action_detail TEXT,
      page_seconds INTEGER,
      search_keyword TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS user_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      tag_value TEXT NOT NULL,
      weight INTEGER DEFAULT 0,
      source TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      tags TEXT DEFAULT '[]',
      interested_categories TEXT DEFAULT '[]',
      uninterested_categories TEXT DEFAULT '[]',
      recommended_tags TEXT DEFAULT '[]',
      last_analysis_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS cross_province_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_code TEXT UNIQUE NOT NULL,
      node_name TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'inactive', 'maintenance')) NOT NULL,
      endpoint TEXT NOT NULL,
      is_source INTEGER DEFAULT 0,
      supported_services TEXT NOT NULL,
      last_heartbeat TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS cross_province_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      description TEXT,
      available_provinces TEXT,
      handling_time TEXT,
      required_materials TEXT,
      hot_level INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('active', 'inactive')) NOT NULL,
      icon TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      description TEXT,
      handling_time TEXT,
      required_materials TEXT,
      urgency_level INTEGER DEFAULT 0,
      hot_level INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('active', 'inactive')) NOT NULL,
      icon TEXT,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS data_exchange_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exchange_no TEXT UNIQUE NOT NULL,
      matter_id INTEGER,
      user_id TEXT NOT NULL,
      source_node_id INTEGER NOT NULL,
      target_node_id INTEGER NOT NULL,
      service_code TEXT NOT NULL,
      service_name TEXT NOT NULL,
      data_type TEXT NOT NULL,
      data_payload TEXT NOT NULL,
      priority TEXT CHECK(priority IN ('low', 'normal', 'high')) NOT NULL,
      status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL,
      retry_count INTEGER DEFAULT 0,
      started_at TEXT,
      completed_at TEXT,
      response_data TEXT,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_node_id) REFERENCES cross_province_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_node_id) REFERENCES cross_province_nodes(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS data_exchange_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exchange_id INTEGER NOT NULL,
      operation_type TEXT NOT NULL,
      operation_name TEXT NOT NULL,
      description TEXT,
      operator TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exchange_id) REFERENCES data_exchange_records(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS node_status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      response_time INTEGER,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (node_id) REFERENCES cross_province_nodes(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      push_enabled INTEGER DEFAULT 1,
      system_enabled INTEGER DEFAULT 1,
      business_enabled INTEGER DEFAULT 1,
      approval_enabled INTEGER DEFAULT 1,
      service_enabled INTEGER DEFAULT 1,
      sound_enabled INTEGER DEFAULT 1,
      vibration_enabled INTEGER DEFAULT 0,
      quiet_start TEXT DEFAULT '22:00',
      quiet_end TEXT DEFAULT '07:00',
      quiet_enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS auth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      refresh_token TEXT UNIQUE NOT NULL,
      token_type TEXT CHECK(token_type IN ('access', 'refresh')) NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      revoked INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    `CREATE INDEX IF NOT EXISTS idx_matters_user_id ON matters(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status)`,
    `CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read)`,
    `CREATE INDEX IF NOT EXISTS idx_behavior_records_user_id ON behavior_records(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_trace_records_matter_id ON trace_records(matter_id)`
  ];

  tables.forEach(sql => db.exec(sql));
  console.log('[Database] All tables created/verified');
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (userCount.count === 0) {
    console.log('[Database] Seeding initial data...');
    
    const insertUser = db.prepare(`
      INSERT INTO users (id, real_name, id_card, phone, gender, real_name_verified, face_verified, government_verified, user_level, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'user_001',
      '张三',
      '320101199001011234',
      '13800138001',
      'male',
      1,
      1,
      1,
      3,
      JSON.stringify(['高级职称', '养老保险', '医疗保险', '本地户籍'])
    );

    const insertInsurance = db.prepare(`
      INSERT INTO insurance_info (user_id, insurance_type, payment_months, pension_balance, unemployment_months, medical_type, last_payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertInsurance.run(
      'user_001',
      '城镇职工社会保险',
      180,
      125600.50,
      60,
      '职工医保',
      new Date().toISOString()
    );

    const insertLicenses = db.prepare(`
      INSERT INTO licenses (user_id, license_code, type, type_name, holder_name, holder_id_card, issuer, issuer_code, issue_date, valid_from, valid_to, status, verify_code, qr_code, electronic_signature)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    insertLicenses.run(
      'user_001',
      'JS_SSC_2020_001',
      'social_security_card',
      '社会保障卡',
      '张三',
      '320101199001011234',
      '江苏省人力资源和社会保障厅',
      'JS_HRSS_320000',
      '2020-01-15',
      '2020-01-15',
      nextYear.toISOString().split('T')[0],
      'active',
      'VERIFY_SSC_001',
      'QR_SSC_001_' + Date.now(),
      1
    );

    insertLicenses.run(
      'user_001',
      'JS_PQ_2023_001',
      'professional_qualification',
      '高级工程师资格证书',
      '张三',
      '320101199001011234',
      '江苏省人力资源和社会保障厅',
      'JS_HRSS_320000',
      '2023-06-20',
      '2023-06-20',
      '2028-06-19',
      'active',
      'VERIFY_PQ_002',
      'QR_PQ_002_' + Date.now(),
      1
    );

    insertLicenses.run(
      'user_001',
      'JS_PC_2024_001',
      'pension_certificate',
      '养老待遇领取证',
      '张三',
      '320101199001011234',
      '江苏省社会保险基金管理中心',
      'JS_SI_320000',
      '2024-03-01',
      '2024-03-01',
      nextMonth.toISOString().split('T')[0],
      'expiring',
      'VERIFY_PC_003',
      'QR_PC_003_' + Date.now(),
      1
    );

    const insertUserTags = db.prepare(`
      INSERT INTO user_tags (user_id, tag, tag_value, weight, source)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUserTags.run('user_001', '职称', '高级职称', 10, 'user_profile');
    insertUserTags.run('user_001', '保险类型', '养老保险', 8, 'insurance');
    insertUserTags.run('user_001', '保险类型', '医疗保险', 8, 'insurance');
    insertUserTags.run('user_001', '户籍', '本地户籍', 6, 'user_profile');

    const insertNodes = db.prepare(`
      INSERT INTO cross_province_nodes (node_code, node_name, province, city, status, endpoint, is_source, supported_services, last_heartbeat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const nodes = [
      { code: 'JS', name: '江苏省', province: '江苏省', city: '南京市', endpoint: 'https://js.hrss.gov.cn/api', is_source: 1 },
      { code: 'SH', name: '上海市', province: '上海市', city: '上海市', endpoint: 'https://sh.hrss.gov.cn/api', is_source: 0 },
      { code: 'ZJ', name: '浙江省', province: '浙江省', city: '杭州市', endpoint: 'https://zj.hrss.gov.cn/api', is_source: 0 },
      { code: 'AH', name: '安徽省', province: '安徽省', city: '合肥市', endpoint: 'https://ah.hrss.gov.cn/api', is_source: 0 }
    ];

    nodes.forEach((node) => {
      insertNodes.run(
        node.code,
        node.name,
        node.province,
        node.city,
        'active',
        node.endpoint,
        node.is_source,
        JSON.stringify(['pension_cert', 'ss_transfer', 'title_declare', 'medical_reimbursement']),
        now.toISOString()
      );
    });

    const insertServices = db.prepare(`
      INSERT INTO cross_province_services (service_code, name, category, description, available_provinces, handling_time, required_materials, hot_level, status, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const services = [
      { code: 'PENSION_CERT', name: '养老待遇资格认证', category: '养老保险' },
      { code: 'SS_TRANSFER', name: '社保关系转移接续', category: '养老保险' },
      { code: 'TITLE_DECLARE', name: '职称跨省申报评审', category: '职称评审' },
      { code: 'MEDICAL_REIMBURSEMENT', name: '异地医保直接结算', category: '医疗保险' },
      { code: 'UNEMPLOYMENT_TRANSFER', name: '失业保险关系转移', category: '失业保险' }
    ];

    services.forEach((service, index) => {
      insertServices.run(
        service.code,
        service.name,
        service.category,
        `长三角地区${service.name}跨省通办服务`,
        JSON.stringify(['JS', 'SH', 'ZJ', 'AH']),
        `${15 + index * 5}个工作日`,
        JSON.stringify(['身份证', '申请表']),
        5 - index,
        'active',
        null
      );
    });

    const insertSystemServices = db.prepare(`
      INSERT INTO services (code, name, category, description, handling_time, hot_level, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const systemServices = [
      { code: 'PENSION_CERT', name: '养老待遇资格认证', category: '养老保险', handling: '1个工作日', hot: 5 },
      { code: 'SS_TRANSFER', name: '社保关系转移接续', category: '养老保险', handling: '15个工作日', hot: 4 },
      { code: 'TITLE_DECLARE', name: '职称申报评审', category: '职称评审', handling: '30个工作日', hot: 4 },
      { code: 'MEDICAL_REIMBURSEMENT', name: '医保费用结算', category: '医疗保险', handling: '5个工作日', hot: 5 },
      { code: 'UNEMPLOYMENT_TRANSFER', name: '失业保险关系转移', category: '失业保险', handling: '10个工作日', hot: 3 },
      { code: 'RETIREMENT_APPLY', name: '退休申请', category: '养老保险', handling: '20个工作日', hot: 4 }
    ];

    systemServices.forEach((service) => {
      insertSystemServices.run(
        service.code,
        service.name,
        service.category,
        `${service.name}服务`,
        service.handling,
        service.hot,
        'active'
      );
    });

    console.log('[Database] Initial data seeded successfully');
  }
}

export { db };
