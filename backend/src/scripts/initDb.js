const db = require('../config/database');

const initTables = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_card_no TEXT UNIQUE,
      real_name TEXT,
      phone TEXT UNIQUE,
      email TEXT,
      avatar TEXT,
      province TEXT DEFAULT '北京市',
      city TEXT DEFAULT '北京市',
      region TEXT,
      auth_level INTEGER DEFAULT 1,
      gov_auth_token TEXT,
      password_hash TEXT,
      sm2_public_key TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS provinces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT,
      api_endpoint TEXT,
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS social_security_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      card_no TEXT UNIQUE,
      issue_date DATE,
      valid_date DATE,
      issue_office TEXT,
      card_status INTEGER DEFAULT 1,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      category TEXT,
      tags TEXT,
      province TEXT,
      city TEXT,
      target_group TEXT,
      publish_date DATE,
      publisher TEXT,
      views INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      is_top INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policy_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      policy_id INTEGER,
      score REAL,
      reason TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (policy_id) REFERENCES policies(id)
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      code TEXT UNIQUE,
      category TEXT,
      icon TEXT,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      is_enabled INTEGER DEFAULT 1,
      province TEXT DEFAULT 'national',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      service_id INTEGER,
      service_code TEXT,
      service_name TEXT,
      request_data TEXT,
      response_data TEXT,
      status TEXT DEFAULT 'pending',
      province TEXT,
      trace_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS pension_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      verify_date DATE,
      verify_method TEXT,
      verify_result TEXT,
      certificate_no TEXT,
      next_verify_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      hospital TEXT,
      department TEXT,
      diagnosis TEXT,
      amount REAL,
      reimbursement REAL,
      date DATE,
      province TEXT,
      is_remote INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS unemployment_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      application_date DATE,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      amount REAL,
      months INTEGER,
      review_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      cert_name TEXT,
      cert_no TEXT,
      issue_date DATE,
      issue_org TEXT,
      level TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS news_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      summary TEXT,
      content TEXT,
      category TEXT,
      media_type TEXT DEFAULT 'text',
      media_url TEXT,
      cover_image TEXT,
      source TEXT,
      publish_time DATETIME,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      is_top INTEGER DEFAULT 0,
      province TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT,
      answer TEXT,
      category TEXT,
      keywords TEXT,
      views INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      content TEXT,
      type TEXT,
      is_read INTEGER DEFAULT 0,
      related_service TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS todo_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      description TEXT,
      type TEXT,
      priority INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      due_date DATE,
      related_service TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      module TEXT,
      ip TEXT,
      user_agent TEXT,
      request_data TEXT,
      response_data TEXT,
      status INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sensitive_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      operation TEXT,
      verify_code TEXT,
      verify_method TEXT,
      verified INTEGER DEFAULT 0,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS service_authorizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      service_type TEXT,
      authorized INTEGER DEFAULT 0,
      authorized_at DATETIME,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS digital_archives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      archive_type TEXT,
      title TEXT,
      file_url TEXT,
      file_hash TEXT,
      encrypted INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_id_card ON users(id_card_no);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category);
    CREATE INDEX IF NOT EXISTS idx_policies_province ON policies(province);
    CREATE INDEX IF NOT EXISTS idx_service_records_user ON service_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_service_records_province ON service_records(province);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at);
  `);

  console.log('数据库表初始化完成');
};

const initSeedData = async () => {
  const provinceResult = await db.getAsync('SELECT COUNT(*) as count FROM provinces');
  if (provinceResult.count === 0) {
    const provinces = [
      { code: '110000', name: '北京市', api_endpoint: 'http://127.0.0.1:59088/api/province/110000' },
      { code: '310000', name: '上海市', api_endpoint: 'http://127.0.0.1:59088/api/province/310000' },
      { code: '440000', name: '广东省', api_endpoint: 'http://127.0.0.1:59088/api/province/440000' },
      { code: '330000', name: '浙江省', api_endpoint: 'http://127.0.0.1:59088/api/province/330000' },
      { code: '320000', name: '江苏省', api_endpoint: 'http://127.0.0.1:59088/api/province/320000' },
    ];
    for (const p of provinces) {
      await db.runAsync('INSERT INTO provinces (code, name, api_endpoint) VALUES (?, ?, ?)', [p.code, p.name, p.api_endpoint]);
    }
    console.log('省份数据初始化完成');
  }

  const serviceResult = await db.getAsync('SELECT COUNT(*) as count FROM services');
  if (serviceResult.count === 0) {
    const services = [
      { name: '养老金领取认证', code: 'pension_verify', category: '养老', icon: '养', sort_order: 1, is_hot: 1 },
      { name: '异地就医备案', code: 'medical_record', category: '医疗', icon: '医', sort_order: 2, is_hot: 1 },
      { name: '社保关系转移', code: 'social_transfer', category: '社保', icon: '保', sort_order: 3, is_hot: 1 },
      { name: '失业金申领', code: 'unemployment', category: '失业', icon: '业', sort_order: 4, is_hot: 1 },
      { name: '职业资格证书查询', code: 'cert_query', category: '证书', icon: '证', sort_order: 5, is_hot: 0 },
      { name: '劳动保障监察举报', code: 'labor_report', category: '维权', icon: '权', sort_order: 6, is_hot: 0 },
      { name: '社保缴费查询', code: 'payment_query', category: '社保', icon: '保', sort_order: 7, is_hot: 1 },
      { name: '医保账户查询', code: 'medical_balance', category: '医疗', icon: '医', sort_order: 8, is_hot: 0 },
      { name: '电子社保卡', code: 'essc', category: '社保', icon: '卡', sort_order: 9, is_hot: 1 },
      { name: '就业服务', code: 'employment', category: '就业', icon: '就', sort_order: 10, is_hot: 0 },
    ];
    for (const s of services) {
      await db.runAsync('INSERT INTO services (name, code, category, icon, description, sort_order, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?)', [s.name, s.code, s.category, s.icon, s.name, s.sort_order, s.is_hot]);
    }
    console.log('服务数据初始化完成');
  }

  const policyResult = await db.getAsync('SELECT COUNT(*) as count FROM policies');
  if (policyResult.count === 0) {
    const policies = [
      { title: '2024年养老金调整方案发布', content: '经国务院批准，从2024年1月1日起，为2023年底前已按规定办理退休手续并按月领取基本养老金的企业和机关事业单位退休人员提高基本养老金水平，总体调整水平为2023年退休人员月人均基本养老金的3%。', category: '养老保险', tags: '养老金,调整', target_group: '退休人员', publisher: '人力资源社会保障部', is_hot: 1, is_top: 1 },
      { title: '社保关系转移接续新规', content: '为进一步优化社保关系转移接续流程，提高服务效率，现就有关事项通知如下：...', category: '社会保险', tags: '社保转移,接续', target_group: '参保人员', publisher: '人力资源社会保障部', is_hot: 1 },
      { title: '失业保险稳岗返还政策', content: '为支持企业稳定岗位，现就实施失业保险稳岗返还政策有关事项通知如下：...', category: '失业保险', tags: '稳岗返还,失业', target_group: '企业', publisher: '人力资源社会保障部' },
    ];
    for (const p of policies) {
      await db.runAsync('INSERT INTO policies (title, content, category, tags, target_group, publish_date, publisher, is_hot, is_top) VALUES (?, ?, ?, ?, ?, DATE(), ?, ?, ?)', [p.title, p.content, p.category, p.tags, p.target_group, p.publisher, p.is_hot || 0, p.is_top || 0]);
    }
    console.log('政策数据初始化完成');
  }

  const userResult = await db.getAsync('SELECT COUNT(*) as count FROM users');
  if (userResult.count === 0) {
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync('123456', 10);
    const users = [
      { id_card: '110101199001011234', name: '张三', phone: '13800138000', province: '北京市', city: '北京市', auth_level: 2 },
      { id_card: '110101199001011235', name: '系统管理员', phone: 'admin', province: '北京市', city: '北京市', auth_level: 2 },
      { id_card: '110101199001011236', name: '平台运营', phone: 'platform', province: '北京市', city: '北京市', auth_level: 2 },
      { id_card: '110101199001011237', name: '运维工程师', phone: 'ops', province: '北京市', city: '北京市', auth_level: 2 },
    ];
    for (const u of users) {
      await db.runAsync('INSERT INTO users (id_card_no, real_name, phone, province, city, password_hash, auth_level) VALUES (?, ?, ?, ?, ?, ?, ?)', [u.id_card, u.name, u.phone, u.province, u.city, passwordHash, u.auth_level]);
    }
    console.log('测试用户初始化完成（账号: 13800138000/admin/platform/ops, 密码: 123456）');
  }

  const newsResult = await db.getAsync('SELECT COUNT(*) as count FROM news_articles');
  if (newsResult.count === 0) {
    const news = [
      { title: '人社部召开2024年全国人力资源社会保障工作会议', content: '会议强调，要以习近平新时代中国特色社会主义思想为指导，全面贯彻党的二十大和二十届二中全会精神...', category: '工作动态', media_type: 'text', source: '人力资源社会保障部' },
      { title: '电子社保卡签发量突破8亿张', content: '截至目前，全国电子社保卡签发量已突破8亿张，覆盖全国31个省份和新疆生产建设兵团...', category: '便民服务', media_type: 'text', source: '人力资源社会保障部', is_hot: 1 },
      { title: '关于优化灵活就业人员参保缴费政策的解读', content: '为更好保障灵活就业人员的社会保险权益，现就有关政策解读如下：...', category: '政策解读', media_type: 'video', media_url: '/static/video/interpretation.mp4', source: '人力资源社会保障部' },
    ];
    for (const n of news) {
      await db.runAsync('INSERT INTO news_articles (title, summary, content, category, media_type, media_url, source, publish_time, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, DATETIME(), ?)', [n.title, n.content.substring(0, 100), n.content, n.category, n.media_type, n.media_url || '', n.source, n.is_hot || 0]);
    }
    console.log('资讯数据初始化完成');
  }

  const faqResult = await db.getAsync('SELECT COUNT(*) as count FROM faqs');
  if (faqResult.count === 0) {
    const faqs = [
      { question: '如何办理电子社保卡？', answer: '您可以通过本APP、掌上12333APP、微信、支付宝等多个渠道申领电子社保卡。申领时需要进行实名认证和人脸识别。', category: '社保卡', keywords: '电子社保卡,申领', sort_order: 1 },
      { question: '养老金如何认证？', answer: '您可以通过本APP进行人脸识别认证，也可以到社保经办机构现场认证，还可以委托他人协助认证。', category: '养老保险', keywords: '养老金,认证,人脸识别', sort_order: 2 },
      { question: '异地就医如何备案？', answer: '您可以通过本APP在线提交异地就医备案申请，填写备案信息后1-2个工作日内完成审核。', category: '医疗保险', keywords: '异地就医,备案', sort_order: 3 },
    ];
    for (const f of faqs) {
      await db.runAsync('INSERT INTO faqs (question, answer, category, keywords, sort_order) VALUES (?, ?, ?, ?, ?)', [f.question, f.answer, f.category, f.keywords, f.sort_order]);
    }
    console.log('问答数据初始化完成');
  }
};

if (require.main === module) {
  (async () => {
    try {
      await initTables();
      await initSeedData();
      console.log('数据库初始化完成');
      process.exit(0);
    } catch (error) {
      console.error('数据库初始化失败:', error);
      process.exit(1);
    }
  })();
}

module.exports = { initTables, initSeedData };
