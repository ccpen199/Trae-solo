const db = require('./db');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      real_name TEXT NOT NULL,
      id_card TEXT UNIQUE,
      phone TEXT UNIQUE,
      avatar TEXT,
      is_elder INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cert_type TEXT NOT NULL,
      cert_name TEXT NOT NULL,
      cert_number TEXT,
      cert_data TEXT,
      issue_date TEXT,
      expire_date TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS identity_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code_token TEXT UNIQUE NOT NULL,
      qr_data TEXT,
      risk_level TEXT DEFAULT 'low',
      risk_score INTEGER DEFAULT 0,
      is_offline INTEGER DEFAULT 0,
      expire_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS service_outlets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      district TEXT,
      lng REAL,
      lat REAL,
      service_types TEXT,
      window_count INTEGER DEFAULT 5,
      open_time TEXT,
      close_time TEXT,
      rating REAL DEFAULT 4.5,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS service_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      required_materials TEXT,
      handling_time INTEGER,
      is_online INTEGER DEFAULT 1,
      is_offline INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      outlet_id INTEGER,
      service_item_id INTEGER,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      queue_number INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (outlet_id) REFERENCES service_outlets(id)
    );

    CREATE TABLE IF NOT EXISTS agent_authorizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      principal_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      auth_scope TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      require_confirm INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (principal_id) REFERENCES users(id),
      FOREIGN KEY (agent_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS agent_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auth_id INTEGER NOT NULL,
      operation_type TEXT NOT NULL,
      operation_detail TEXT,
      is_confirmed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (auth_id) REFERENCES agent_authorizations(id)
    );

    CREATE TABLE IF NOT EXISTS window_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      outlet_id INTEGER NOT NULL,
      window_no TEXT NOT NULL,
      service_type TEXT,
      is_open INTEGER DEFAULT 1,
      current_queue INTEGER DEFAULT 0,
      avg_wait_time INTEGER DEFAULT 15,
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (outlet_id) REFERENCES service_outlets(id)
    );

    CREATE TABLE IF NOT EXISTS heat_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      outlet_id INTEGER NOT NULL,
      predict_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      predicted_count INTEGER,
      actual_count INTEGER,
      suggested_windows INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (outlet_id) REFERENCES service_outlets(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      operation TEXT NOT NULL,
      module TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  console.log('数据库表创建完成');

  seedData();
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('已存在数据，跳过初始化');
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (real_name, id_card, phone, avatar, is_elder)
    VALUES (?, ?, ?, ?, ?)
  `);

  const users = [
    { name: '张三', idCard: '500101199001011234', phone: '13800138001', isElder: 0 },
    { name: '李婆婆', idCard: '500101195005051234', phone: '13800138002', isElder: 1 },
    { name: '王大爷', idCard: '500101194803031234', phone: '13800138003', isElder: 1 },
    { name: '李四', idCard: '500101199202021234', phone: '13800138004', isElder: 0 },
  ];

  users.forEach(u => {
    insertUser.run(u.name, u.idCard, u.phone, '', u.isElder);
  });

  const insertCert = db.prepare(`
    INSERT INTO certificates (user_id, cert_type, cert_name, cert_number, cert_data, issue_date, expire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const certTypes = [
    { type: 'id_card', name: '居民身份证' },
    { type: 'social_security', name: '社会保障卡' },
    { type: 'driving_license', name: '机动车驾驶证' },
    { type: 'vehicle_license', name: '机动车行驶证' },
    { type: 'passport', name: '护照' },
    { type: 'hk_macau_pass', name: '港澳通行证' },
    { type: 'taiwan_pass', name: '台湾通行证' },
    { type: 'birth_cert', name: '出生医学证明' },
    { type: 'marriage_cert', name: '结婚证' },
    { type: 'real_estate', name: '不动产权证' },
    { type: 'business_license', name: '营业执照' },
    { type: 'tax_cert', name: '税务登记证' },
  ];

  for (let userId = 1; userId <= 4; userId++) {
    const certCount = Math.floor(Math.random() * 4) + 5;
    const shuffled = [...certTypes].sort(() => Math.random() - 0.5);
    for (let i = 0; i < certCount; i++) {
      const cert = shuffled[i];
      insertCert.run(
        userId,
        cert.type,
        cert.name,
        'CERT' + Date.now() + Math.floor(Math.random() * 10000),
        JSON.stringify({ issuer: '重庆市相关部门' }),
        '2020-01-01',
        '2030-01-01'
      );
    }
  }

  const insertOutlet = db.prepare(`
    INSERT INTO service_outlets (name, address, district, lng, lat, service_types, window_count, open_time, close_time, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const outlets = [
    { name: '渝中区政务服务中心', addr: '渝中区和平路1号', district: '渝中区', lng: 106.5548, lat: 29.5648, windows: 20, rating: 4.7 },
    { name: '江北区政务服务中心', addr: '江北区金港新区16号', district: '江北区', lng: 106.5428, lat: 29.5882, windows: 18, rating: 4.6 },
    { name: '南岸区政务服务中心', addr: '南岸区长生桥镇', district: '南岸区', lng: 106.5692, lat: 29.5497, windows: 15, rating: 4.5 },
    { name: '九龙坡区政务服务中心', addr: '九龙坡区西郊路27号', district: '九龙坡区', lng: 106.5338, lat: 29.5501, windows: 16, rating: 4.4 },
    { name: '沙坪坝区政务服务中心', addr: '沙坪坝区凤天大道8号', district: '沙坪坝区', lng: 106.5472, lat: 29.5853, windows: 17, rating: 4.6 },
    { name: '渝北区政务服务中心', addr: '渝北区双龙大道153号', district: '渝北区', lng: 106.5821, lat: 29.5902, windows: 22, rating: 4.8 },
    { name: '大渡口区政务服务中心', addr: '大渡口区春晖路街道', district: '大渡口区', lng: 106.5247, lat: 29.5316, windows: 12, rating: 4.3 },
    { name: '巴南区政务服务中心', addr: '巴南区龙洲湾街道', district: '巴南区', lng: 106.5786, lat: 29.5262, windows: 14, rating: 4.5 },
  ];

  outlets.forEach(o => {
    insertOutlet.run(
      o.name, o.addr, o.district, o.lng, o.lat,
      JSON.stringify(['身份证办理', '社保业务', '不动产登记', '工商注册']),
      o.windows, '09:00', '17:00', o.rating
    );
  });

  const insertItem = db.prepare(`
    INSERT INTO service_items (name, category, description, required_materials, handling_time, is_online, is_offline)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const items = [
    { name: '身份证补办', category: '证件办理', time: 15, online: 1, offline: 1 },
    { name: '社保缴费查询', category: '社会保障', time: 5, online: 1, offline: 1 },
    { name: '不动产登记查询', category: '住房服务', time: 10, online: 1, offline: 1 },
    { name: '营业执照办理', category: '企业服务', time: 30, online: 1, offline: 1 },
    { name: '医保卡补办', category: '社会保障', time: 20, online: 0, offline: 1 },
    { name: '驾驶证换证', category: '交通出行', time: 25, online: 1, offline: 1 },
    { name: '生育服务登记', category: '生育服务', time: 10, online: 1, offline: 1 },
    { name: '公积金提取', category: '住房服务', time: 20, online: 1, offline: 1 },
    { name: '户籍迁移', category: '证件办理', time: 30, online: 0, offline: 1 },
    { name: '低保申请', category: '社会救助', time: 45, online: 0, offline: 1 },
  ];

  items.forEach(item => {
    insertItem.run(
      item.name, item.category, `办理${item.name}业务`,
      JSON.stringify(['身份证明', '申请表']),
      item.time, item.online, item.offline
    );
  });

  const insertWindow = db.prepare(`
    INSERT INTO window_resources (outlet_id, window_no, service_type, is_open, current_queue, avg_wait_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const windowConfigs = [
    { outlet: 1, queues: [8, 12, 5, 3, 7, 6] },
    { outlet: 2, queues: [10, 6, 9, 4, 8, 3] },
    { outlet: 3, queues: [5, 7, 3, 2, 6, 4] },
    { outlet: 4, queues: [6, 4, 8, 3, 5, 2] },
    { outlet: 5, queues: [9, 11, 6, 5, 7, 4] },
    { outlet: 6, queues: [12, 8, 10, 6, 9, 5] },
    { outlet: 7, queues: [3, 4, 2, 1, 5, 3] },
    { outlet: 8, queues: [5, 6, 4, 3, 7, 2] },
  ];

  for (let oi = 0; oi < windowConfigs.length; oi++) {
    const cfg = windowConfigs[oi];
    for (let i = 0; i < cfg.queues.length; i++) {
      insertWindow.run(
        cfg.outlet,
        `${i + 1}号窗口`,
        ['综合业务', '证件办理', '社保业务', '不动产'][i % 4],
        i < 5 ? 1 : 0,
        cfg.queues[i],
        8 + Math.floor(Math.random() * 18)
      );
    }
  }

  const insertPrediction = db.prepare(`
    INSERT INTO heat_predictions (outlet_id, predict_date, time_slot, predicted_count, actual_count, suggested_windows)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const today = new Date().toISOString().split('T')[0];
  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];
  const predictionConfigs = [
    { outlet: 1, base: 45 }, { outlet: 2, base: 38 },
    { outlet: 3, base: 30 }, { outlet: 4, base: 32 },
    { outlet: 5, base: 42 }, { outlet: 6, base: 50 },
    { outlet: 7, base: 22 }, { outlet: 8, base: 28 },
  ];

  for (const pc of predictionConfigs) {
    timeSlots.forEach((slot, idx) => {
      let factor = 0.6 + Math.random() * 0.8;
      if (idx === 0 || idx === 3) factor *= 1.2;
      if (idx === 2 || idx === 5) factor *= 0.7;
      const predicted = Math.round(pc.base * factor);
      const actual = Math.round(predicted * (0.7 + Math.random() * 0.5));
      insertPrediction.run(
        pc.outlet, today, slot, predicted, actual,
        Math.max(1, Math.min(6, Math.ceil(predicted / 12)))
      );
    });
  }

  const insertAuth = db.prepare(`
    INSERT INTO agent_authorizations (principal_id, agent_id, auth_scope, start_time, end_time, status, require_confirm)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAuth.run(
    2, 1, JSON.stringify(['社保业务', '证件办理']),
    new Date().toISOString(),
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    'active', 1
  );

  insertAuth.run(
    3, 4, JSON.stringify(['医保业务', '住房服务', '证件办理']),
    new Date().toISOString(),
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    'active', 1
  );

  insertAuth.run(
    1, 4, JSON.stringify(['社保业务']),
    new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    'revoked', 0
  );

  const insertOp = db.prepare(`
    INSERT INTO agent_operations (auth_id, operation_type, operation_detail, is_confirmed)
    VALUES (?, ?, ?, ?)
  `);

  const opTypes = ['社保缴费查询', '身份证补办预约', '医保卡补办', '公积金提取申请', '社保缴费查询'];
  opTypes.forEach((type, i) => {
    insertOp.run(1, type, `${type}代办操作详情`, i < 3 ? 1 : 0);
  });

  const insertLog = db.prepare(`
    INSERT INTO operation_logs (user_id, operation, module, ip, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `);

  const logEntries = [
    { uid: 1, op: '生成动态身份码', mod: 'identity', hoursAgo: 1 },
    { uid: 1, op: '查询风险评估', mod: 'identity', hoursAgo: 2 },
    { uid: 2, op: '进入长辈版模式', mod: 'identity', hoursAgo: 3 },
    { uid: 1, op: '查询附近网点', mod: 'outlet', hoursAgo: 4 },
    { uid: 1, op: '预约身份证补办', mod: 'outlet', hoursAgo: 5 },
    { uid: 3, op: '创建代办授权', mod: 'agent', hoursAgo: 6 },
    { uid: 4, op: '执行代办操作-社保查询', mod: 'agent', hoursAgo: 3 },
    { uid: 1, op: '确认代办操作', mod: 'agent', hoursAgo: 2 },
    { uid: 1, op: '调整窗口调度-渝中区', mod: 'window', hoursAgo: 1 },
    { uid: 1, op: '生成今日热度预测', mod: 'window', hoursAgo: 8 },
    { uid: 2, op: '语音输入办理社保', mod: 'identity', hoursAgo: 4 },
    { uid: 1, op: '查看证件列表', mod: 'identity', hoursAgo: 6 },
    { uid: 3, op: '查询附近网点', mod: 'outlet', hoursAgo: 5 },
    { uid: 1, op: '撤销代办授权', mod: 'agent', hoursAgo: 7 },
    { uid: 1, op: '导出运营数据', mod: 'window', hoursAgo: 2 },
  ];

  logEntries.forEach(entry => {
    const stmt = db.prepare(`
      INSERT INTO operation_logs (user_id, operation, module, ip, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))
    `);
    stmt.run(entry.uid, entry.op, entry.mod, '127.0.0.1', 'Mozilla/5.0', entry.hoursAgo);
  });

  const insertAppt = db.prepare(`
    INSERT INTO appointments (user_id, outlet_id, service_item_id, appointment_date, appointment_time, status, queue_number)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const aptTimeSlots = ['09:30', '10:15', '10:45', '11:20', '14:10', '14:50', '15:30', '16:20'];
  const todayDate = "date('now', 'localtime')";
  const tomorrowDate = "date('now', 'localtime', '+1 day')";

  const appointments = [
    { uid: 1, outlet: 1, item: 1, date: todayDate, time: '09:30', status: 'confirmed', q: 1 },
    { uid: 2, outlet: 2, item: 2, date: todayDate, time: '10:15', status: 'confirmed', q: 3 },
    { uid: 3, outlet: 3, item: 3, date: todayDate, time: '10:45', status: 'completed', q: 2 },
    { uid: 4, outlet: 4, item: 4, date: todayDate, time: '11:20', status: 'confirmed', q: 5 },
    { uid: 1, outlet: 5, item: 5, date: todayDate, time: '14:10', status: 'pending', q: 7 },
    { uid: 2, outlet: 6, item: 6, date: todayDate, time: '14:50', status: 'confirmed', q: 4 },
    { uid: 3, outlet: 7, item: 7, date: todayDate, time: '15:30', status: 'pending', q: 6 },
    { uid: 4, outlet: 8, item: 8, date: todayDate, time: '16:20', status: 'confirmed', q: 8 },
    { uid: 1, outlet: 1, item: 9, date: todayDate, time: '14:50', status: 'confirmed', q: 9 },
    { uid: 2, outlet: 2, item: 10, date: tomorrowDate, time: '09:30', status: 'pending', q: 1 },
    { uid: 3, outlet: 3, item: 1, date: tomorrowDate, time: '10:15', status: 'confirmed', q: 2 },
    { uid: 4, outlet: 4, item: 2, date: tomorrowDate, time: '10:45', status: 'confirmed', q: 3 },
    { uid: 1, outlet: 5, item: 3, date: tomorrowDate, time: '11:20', status: 'pending', q: 4 },
    { uid: 2, outlet: 6, item: 4, date: tomorrowDate, time: '14:10', status: 'confirmed', q: 5 },
  ];

  appointments.forEach(a => {
    const stmt = db.prepare(`
      INSERT INTO appointments (user_id, outlet_id, service_item_id, appointment_date, appointment_time, status, queue_number)
      VALUES (?, ?, ?, ${a.date}, ?, ?, ?)
    `);
    stmt.run(a.uid, a.outlet, a.item, a.time, a.status, a.q);
  });

  const insertIdCode = db.prepare(`
    INSERT INTO identity_codes (user_id, code_token, qr_data, risk_level, risk_score, is_offline, expire_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const idCodeRecords = [];
  const riskConfig = [
    { level: 'low', min: 0, max: 30, weight: 11 },
    { level: 'medium', min: 31, max: 65, weight: 4 },
    { level: 'high', min: 66, max: 100, weight: 1 },
  ];
  const weightedLevels = [];
  riskConfig.forEach(c => {
    for (let i = 0; i < c.weight; i++) weightedLevels.push(c);
  });

  for (let i = 0; i < 16; i++) {
    const uid = (i % 4) + 1;
    const isOffline = i % 3 === 0 ? 1 : 0;
    const config = weightedLevels[Math.floor(Math.random() * weightedLevels.length)];
    const score = config.min + Math.floor(Math.random() * (config.max - config.min + 1));
    const hoursAgo = Math.floor(Math.random() * 49);
    const expireSql = isOffline
      ? "datetime('now', '+7 days')"
      : "datetime('now', '+30 minutes')";
    const createdAtSql = `datetime('now', '-' || ${hoursAgo} || ' hours')`;
    idCodeRecords.push({
      uid,
      token: 'IC' + Date.now() + Math.floor(Math.random() * 100000) + i,
      qr: JSON.stringify({ uid, ts: Date.now() }),
      level: config.level,
      score,
      offline: isOffline,
      expireSql,
      createdAtSql,
    });
  }

  idCodeRecords.forEach(r => {
    const stmt = db.prepare(`
      INSERT INTO identity_codes (user_id, code_token, qr_data, risk_level, risk_score, is_offline, expire_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ${r.expireSql}, ${r.createdAtSql})
    `);
    stmt.run(r.uid, r.token, r.qr, r.level, r.score, r.offline);
  });

  console.log('初始数据填充完成');
}

initDatabase();

module.exports = { initDatabase };
