const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const dbDir = path.join(rootDir, 'data');
const dbPath = path.join(dbDir, 'wedding.sqlite');
const env = readEnv(path.join(rootDir, '.env'));
const host = '127.0.0.1';
const port = Number.parseInt(env.BACKEND_PORT || '53471', 10);
const frontendPort = Number.parseInt(env.FRONTEND_PORT || '43471', 10);

function getAllowedOrigin(req) {
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    `http://127.0.0.1:${frontendPort}`,
    `http://localhost:${frontendPort}`,
    `http://0.0.0.0:${frontendPort}`
  ];
  for (let slot = 1; slot <= 5; slot++) {
    const slotPort = 40000 + slot * 1000 + 3471;
    allowedOrigins.push(`http://127.0.0.1:${slotPort}`);
    allowedOrigins.push(`http://localhost:${slotPort}`);
  }
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
}

function setCorsHeaders(req, res) {
  const allowedOrigin = getAllowedOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Vary', 'Origin');
}

function readEnv(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const index = line.indexOf('=');
    if (index > -1) result[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return result;
}

function quote(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`;
}

function execSql(statement) {
  execFileSync('/usr/bin/sqlite3', [dbPath], { input: statement, encoding: 'utf8' });
}

function query(statement) {
  const output = execFileSync('/usr/bin/sqlite3', ['-json', dbPath, statement], { encoding: 'utf8' });
  return output.trim() ? JSON.parse(output) : [];
}

function initDb() {
  fs.mkdirSync(dbDir, { recursive: true });
  execSql(`
    PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK(role IN ('couple','planner','photographer','venue','florist','admin')),
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER REFERENCES users(id),
      wedding_date TEXT NOT NULL,
      city TEXT NOT NULL,
      budget INTEGER NOT NULL,
      guest_count INTEGER NOT NULL,
      style TEXT NOT NULL,
      service_list TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('高','中','低')),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','matched','fulfilled','closed')),
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      service_type TEXT NOT NULL,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      price_min INTEGER,
      price_max INTEGER,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      contract_template TEXT,
      service_area TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','suspended')),
      credit_score INTEGER DEFAULT 100,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS supplier_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      image_urls TEXT,
      wedding_date TEXT,
      location TEXT,
      budget INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS supplier_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      time_slot TEXT,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','booked','blocked')),
      booking_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','expired')),
      message TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      responded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invitation_id INTEGER REFERENCES invitations(id) ON DELETE CASCADE,
      requirement_id INTEGER REFERENCES requirements(id),
      supplier_id INTEGER REFERENCES suppliers(id),
      total_price INTEGER NOT NULL,
      breakdown TEXT,
      delivery_days INTEGER,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','selected','rejected','negotiating')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS communications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
      sender_id INTEGER REFERENCES users(id),
      sender_type TEXT NOT NULL CHECK(sender_type IN ('couple','supplier','admin')),
      message TEXT NOT NULL,
      attachment_urls TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER REFERENCES requirements(id),
      supplier_id INTEGER REFERENCES suppliers(id),
      quote_id INTEGER REFERENCES quotes(id),
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending_signature','signed','archived','cancelled')),
      signed_by_couple_at TEXT,
      signed_by_supplier_at TEXT,
      archived_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER REFERENCES contracts(id),
      amount INTEGER NOT NULL,
      payment_type TEXT NOT NULL CHECK(payment_type IN ('deposit','installment','final','refund')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','refunded')),
      transaction_id TEXT,
      paid_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fulfillment_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
      supplier_id INTEGER REFERENCES suppliers(id),
      contract_id INTEGER REFERENCES contracts(id),
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL CHECK(category IN ('preparation','materials','arrival','change','acceptance')),
      responsible_party TEXT NOT NULL CHECK(responsible_party IN ('couple','supplier','planner','admin')),
      responsible_id INTEGER REFERENCES users(id),
      priority INTEGER DEFAULT 3 CHECK(priority BETWEEN 1 AND 5),
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled','delayed')),
      notes TEXT,
      completed_at TEXT,
      change_request_id INTEGER,
      parent_task_id INTEGER REFERENCES fulfillment_tasks(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS after_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
      contract_id INTEGER REFERENCES contracts(id),
      supplier_id INTEGER REFERENCES suppliers(id),
      type TEXT NOT NULL CHECK(type IN ('complaint','delay','refund','service_mismatch')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','investigating','resolved','closed','rejected')),
      resolution TEXT,
      refund_amount INTEGER DEFAULT 0,
      filed_by INTEGER REFERENCES users(id),
      handled_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id INTEGER REFERENCES requirements(id),
      supplier_id INTEGER REFERENCES suppliers(id),
      contract_id INTEGER REFERENCES contracts(id),
      reviewer_id INTEGER REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      content TEXT,
      images TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS credit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
      change INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_type TEXT,
      reference_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY,
      couple TEXT NOT NULL,
      wedding_date TEXT NOT NULL,
      venue TEXT NOT NULL,
      planner TEXT NOT NULL,
      status TEXT NOT NULL,
      budget INTEGER NOT NULL,
      spent INTEGER NOT NULL,
      guest_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      contact TEXT NOT NULL,
      status TEXT NOT NULL,
      amount INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      owner TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      side TEXT NOT NULL,
      rsvp TEXT NOT NULL,
      table_no TEXT NOT NULL
    );

    INSERT OR IGNORE INTO users VALUES
      (1,'couple','林晓 & 周南','13800000001','lin@example.com',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (2,'planner','Mia Chen','13800000002','mia@example.com',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (3,'photographer','光影纪实','13800004502','photo@example.com',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (4,'venue','湖畔花园','13800000003','venue@example.com',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (5,'florist','花序 Floral','13800004501','floral@example.com',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (6,'admin','平台运营','13800000000','admin@example.com',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO requirements VALUES
      (1,1,'2026-06-20','杭州',238000,168,'现代简约','策划,摄影,场地,花艺,司仪','高','matched','希望户外仪式加室内晚宴',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (2,1,'2026-07-12','上海',188000,120,'法式浪漫','策划,摄影,场地','中','published','偏爱紫色和白色主题',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO suppliers VALUES
      (1,5,'florist','花序 Floral Studio','小艾','13800004501',28000,48000,4.8,36,'花艺服务合同模板','杭州,上海,苏州','专注婚礼花艺8年','active',100,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (2,3,'photographer','光影纪实摄影工作室','阿凯','13800004502',18000,38000,4.9,58,'摄影服务合同模板','杭州,上海','纪实风格为主','active',98,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (3,4,'venue','湖畔花园宴会厅','王经理','13800000003',120000,280000,4.6,24,'场地租赁合同模板','杭州','可容纳300人','active',100,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (4,2,'planner','Mia Chen 婚礼策划','Mia','13800000002',15000,35000,4.9,42,'策划服务合同模板','杭州,上海','独立婚礼策划师','active',100,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO supplier_cases (id,supplier_id,title,description,image_urls,wedding_date,location,budget,created_at) VALUES
      (1,1,'春日户外婚礼','白绿色系花艺布置','','2025-05-18','杭州植物园',36000,CURRENT_TIMESTAMP),
      (2,1,'复古教堂婚礼','红金色系手捧花','','2025-10-22','上海教堂',42000,CURRENT_TIMESTAMP),
      (3,2,'海边婚礼纪实','全天跟拍','','2025-08-08','三亚',28000,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO bookings VALUES
      (1,'林晓 & 周南','2026-06-20','湖畔花园宴会厅','Mia Chen','筹备中',238000,126500,168),
      (2,'许安 & 贺宁','2026-07-12','城市艺术中心','Leo Wang','方案确认',188000,84000,120);

    INSERT OR IGNORE INTO supplier_schedules (id,supplier_id,date,time_slot,status,booking_id,created_at) VALUES
      (1,1,'2026-06-20','全天','booked',1,CURRENT_TIMESTAMP),
      (2,1,'2026-07-12','全天','available',NULL,CURRENT_TIMESTAMP),
      (3,2,'2026-06-20','全天','booked',1,CURRENT_TIMESTAMP),
      (4,3,'2026-06-20','全天','booked',1,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO invitations (id,requirement_id,supplier_id,status,message,expires_at,created_at,responded_at) VALUES
      (1,1,1,'accepted','请提供花艺方案','2026-05-25',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (2,1,2,'accepted','请提供摄影方案','2026-05-25',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (3,1,3,'accepted','请提供场地报价','2026-05-25',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO quotes (id,invitation_id,requirement_id,supplier_id,total_price,breakdown,delivery_days,notes,status,created_at,updated_at) VALUES
      (1,1,1,1,36000,'仪式区:15000, 签到区:8000, 手捧花:3000, 胸花:2000, 桌花:8000',7,'包含两次方案调整','selected',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (2,2,1,2,28000,'主摄影师1人, 副摄影师1人, 精修50张, 原片全送',14,'含航拍','selected',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (3,3,1,3,150000,'场地:100000, 餐饮:50000',30,'含基础音响灯光','selected',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO communications (id,requirement_id,sender_id,sender_type,message,attachment_urls,created_at) VALUES
      (1,1,1,'couple','请问手捧花可以用厄瓜多尔玫瑰吗?',NULL,CURRENT_TIMESTAMP),
      (2,1,5,'supplier','可以的,需要额外加2000元,您看是否需要?',NULL,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO contracts (id,requirement_id,supplier_id,quote_id,content,status,signed_by_couple_at,signed_by_supplier_at,archived_at,created_at,updated_at) VALUES
      (1,1,1,1,'花艺服务合同...','signed',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (2,1,2,2,'摄影服务合同...','pending_signature',NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO payments (id,contract_id,amount,payment_type,status,transaction_id,paid_at,notes,created_at) VALUES
      (1,1,10800,'deposit','paid','TXN001',CURRENT_TIMESTAMP,'30%定金',CURRENT_TIMESTAMP),
      (2,2,8400,'deposit','pending',NULL,NULL,'30%定金待支付',CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO fulfillment_tasks (id,requirement_id,supplier_id,contract_id,title,description,category,responsible_party,responsible_id,priority,due_date,status,notes,completed_at,change_request_id,parent_task_id,created_at,updated_at) VALUES
      (1,1,1,1,'确认花艺方案','与新人确认最终配色和花材','preparation','supplier',5,5,'2026-06-01','in_progress',NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (2,1,1,1,'采购花材','根据方案采购当季花材','materials','supplier',5,5,'2026-06-18','pending',NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (3,1,1,1,'婚礼当天到场布置','凌晨5点到场搭建仪式区','arrival','supplier',5,5,'2026-06-20','pending',NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (4,1,1,1,'方案变更-增加10桌桌花','新人临时增加10桌','change','planner',2,2,'2026-06-10','pending',NULL,NULL,1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (5,1,1,1,'花艺验收','婚礼后24小时内确认服务质量','acceptance','couple',1,1,'2026-06-21','pending',NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (6,2,2,2,'与新人沟通摄影风格','确定主色调、光影偏好和必拍场景','preparation','supplier',4,4,'2026-06-12','pending',NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (7,2,2,2,'准备摄影器材','调试相机、镜头、灯光设备','materials','supplier',4,4,'2026-07-10','pending',NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (8,2,2,2,'婚礼当天摄影团队到场','双机位+航拍,早7点到酒店','arrival','supplier',4,4,'2026-07-12','pending',NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (9,2,2,2,'变更-增加晚宴跟拍时长','延长2小时拍摄','change','planner',2,2,'2026-07-11','in_progress',NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (10,2,2,2,'摄影成片验收','45天内交付精修300张、底片全部','acceptance','couple',1,1,'2026-08-30','pending',NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (11,1,4,NULL,'喜帖设计完成','已发送,新人确认中','preparation','supplier',6,4,'2026-06-05','completed','已通过',CURRENT_TIMESTAMP,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (12,1,3,NULL,'婚宴菜单最终确认','调整了3道热菜,增加素食选项','preparation','supplier',5,5,'2026-06-15','delayed','酒店临时调整菜单',NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (13,1,3,NULL,'婚宴场地布置','包含签到区、仪式区、宴会厅','arrival','supplier',5,5,'2026-06-19','pending',NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (14,1,3,NULL,'餐饮服务验收','用餐结束后确认服务质量','acceptance','couple',1,1,'2026-06-20','pending',NULL,NULL,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      (15,1,2,NULL,'婚车装饰完成','主车+5辆副车,鲜花装饰','preparation','supplier',4,4,'2026-06-19','completed','已完成',CURRENT_TIMESTAMP,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO reviews (id,requirement_id,supplier_id,contract_id,reviewer_id,rating,content,images,created_at) VALUES
      (1,NULL,1,NULL,1,5,'花艺非常棒,配色高级,花材新鲜',NULL,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO credit_records (id,supplier_id,change,reason,reference_type,reference_id,created_at) VALUES
      (1,1,5,'好评加分','review',1,CURRENT_TIMESTAMP),
      (2,2,-2,'档期确认延迟','after_sale',1,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO after_sales (id,requirement_id,contract_id,supplier_id,type,title,description,status,resolution,refund_amount,filed_by,handled_by,created_at,updated_at) VALUES
      (1,1,1,1,'complaint','花材与方案不符','实际使用的花材质量低于方案约定','resolved','已更换部分花材并赔付5000元',5000,1,6,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

    INSERT OR IGNORE INTO vendors VALUES
      (1,'花序 Floral Studio','花艺','13800004501','已签约',36000),
      (2,'光影纪实摄影','摄影摄像','13800004502','已签约',28000),
      (3,'晨露甜品台','甜品','13800004503','待确认',12000),
      (4,'Blue Note Quartet','乐队','13800004504','洽谈中',18000);

    INSERT OR IGNORE INTO tasks (id,title,owner,due_date,status,priority) VALUES
      (1,'确认迎宾区花艺小样','Mia Chen','2026-05-31','进行中','高'),
      (2,'补齐女方亲友 RSVP','客户','2026-06-02','待处理','中'),
      (3,'完成宴会厅动线复测','Leo Wang','2026-06-04','待处理','高'),
      (4,'核对摄影团队时间表','Mia Chen','2026-06-05','已完成','中');

    INSERT OR IGNORE INTO guests VALUES
      (1,'林女士','新娘方','confirmed','A01'),
      (2,'周先生','新郎方','confirmed','A02'),
      (3,'陈一','朋友','pending','B03'),
      (4,'王敏','同事','declined','');
  `);
}

function send(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (err) { reject(err); }
    });
  });
}

function paginate(sql, url) {
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
  const offset = (page - 1) * pageSize;
  const countSql = `SELECT COUNT(*) AS total FROM (${sql.replace(/SELECT.*?FROM/i, 'SELECT 1 FROM')})`;
  const total = query(countSql)[0]?.total || 0;
  const data = query(`${sql} LIMIT ${pageSize} OFFSET ${offset}`);
  return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

initDb();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`);
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  try {
    if (url.pathname === '/api/health') {
      const count = query('SELECT COUNT(*) AS count FROM bookings')[0].count;
      return send(res, 200, { success: true, data: { status: 'healthy', sqlite: 'ok', bookings: count }, message: '婚礼管理服务运行正常' });
    }

    if (url.pathname === '/api/overview') {
      const booking = query('SELECT * FROM bookings ORDER BY wedding_date LIMIT 1')[0];
      const vendorTotal = query('SELECT SUM(amount) AS total FROM vendors')[0].total || 0;
      const confirmedGuests = query("SELECT COUNT(*) AS count FROM guests WHERE rsvp='confirmed'")[0].count;
      const requirementCount = query('SELECT COUNT(*) AS count FROM requirements')[0].count;
      const activeSuppliers = query("SELECT COUNT(*) AS count FROM suppliers WHERE status='active'")[0].count;
      const pendingInvitations = query("SELECT COUNT(*) AS count FROM invitations WHERE status='pending'")[0].count;
      const pendingQuotes = query("SELECT COUNT(*) AS count FROM quotes WHERE status='submitted'")[0].count;
      const pendingFulfillment = query("SELECT COUNT(*) AS count FROM fulfillment_tasks WHERE status IN ('pending','in_progress','delayed')")[0].count;
      const fulfillmentByStatus = query("SELECT status, COUNT(*) AS count FROM fulfillment_tasks GROUP BY status");
      const openTasks = pendingFulfillment;
      const signedContracts = query("SELECT COUNT(*) AS count FROM contracts WHERE status='signed'")[0].count;
      const pendingPayments = query("SELECT COUNT(*) AS count FROM payments WHERE status='pending'")[0].count;
      const totalRevenue = query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='paid'")[0].total;
      const afterSalesOpen = query("SELECT COUNT(*) AS count FROM after_sales WHERE status IN ('open','investigating')")[0].count;
      const totalReviews = query("SELECT COUNT(*) AS count FROM reviews")[0].count;
      return send(res, 200, {
        success: true,
        data: {
          booking, vendorTotal, openTasks, confirmedGuests,
          requirementCount, activeSuppliers, pendingInvitations, pendingQuotes,
          pendingFulfillment, fulfillmentByStatus, signedContracts,
          pendingPayments, totalRevenue, afterSalesOpen, totalReviews
        },
        message: '获取总览成功'
      });
    }

    if (url.pathname === '/api/dashboard/stats') {
      const stats = {
        requirements: query('SELECT COUNT(*) AS total FROM requirements')[0].total,
        suppliers: query("SELECT COUNT(*) AS total FROM suppliers WHERE status='active'")[0].total,
        bookings: query('SELECT COUNT(*) AS total FROM bookings')[0].total,
        tasks: query("SELECT COUNT(*) AS total FROM fulfillment_tasks WHERE status='pending'")[0].total,
        invitations: query("SELECT COUNT(*) AS total FROM invitations WHERE status='pending'")[0].total,
        contracts: query("SELECT COUNT(*) AS total FROM contracts WHERE status='signed'")[0].total,
        contracts_pending: query("SELECT COUNT(*) AS total FROM contracts WHERE status='pending_signature'")[0].total,
        contracts_archived: query("SELECT COUNT(*) AS total FROM contracts WHERE status='archived'")[0].total,
        revenue: query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='paid'")[0].total,
        payments_pending: query("SELECT COUNT(*) AS total FROM payments WHERE status='pending'")[0].total,
        payments_failed: query("SELECT COUNT(*) AS total FROM payments WHERE status='failed'")[0].total,
        payments_refunded: query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='refunded'")[0].total,
        after_sales_open: query("SELECT COUNT(*) AS total FROM after_sales WHERE status IN ('open','investigating')")[0].total,
        after_sales_resolved: query("SELECT COUNT(*) AS total FROM after_sales WHERE status='resolved'")[0].total,
        total_refunds: query("SELECT COALESCE(SUM(refund_amount),0) AS total FROM after_sales WHERE status='resolved' AND refund_amount>0")[0].total,
        avg_rating: query("SELECT COALESCE(AVG(rating),0) AS avg FROM reviews")[0].avg,
        total_reviews: query("SELECT COUNT(*) AS total FROM reviews")[0].total,
        avg_credit: query("SELECT COALESCE(AVG(credit_score),0) AS avg FROM suppliers")[0].avg
      };
      return send(res, 200, { success: true, data: stats, message: '获取统计成功' });
    }

    if (url.pathname === '/api/bookings') {
      return send(res, 200, { success: true, data: query('SELECT * FROM bookings ORDER BY wedding_date'), message: '获取婚礼档期成功' });
    }

    if (url.pathname === '/api/vendors') {
      return send(res, 200, { success: true, data: query('SELECT * FROM vendors ORDER BY category'), message: '获取供应商成功' });
    }

    if (url.pathname === '/api/guests') {
      return send(res, 200, { success: true, data: query('SELECT * FROM guests ORDER BY id'), message: '获取宾客成功' });
    }

    if (url.pathname === '/api/tasks' && req.method === 'GET') {
      return send(res, 200, { success: true, data: query('SELECT * FROM tasks ORDER BY due_date'), message: '获取任务成功' });
    }

    if (url.pathname === '/api/tasks' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.title || !body.owner || !body.due_date) return send(res, 400, { success: false, message: '任务标题、负责人和日期不能为空' });
      execSql(`INSERT INTO tasks (title,owner,due_date,status,priority) VALUES (${quote(body.title)},${quote(body.owner)},${quote(body.due_date)},'待处理',${quote(body.priority || '中')});`);
      const task = query('SELECT * FROM tasks ORDER BY id DESC LIMIT 1')[0];
      return send(res, 201, { success: true, data: task, message: '任务已创建' });
    }

    if (url.pathname.startsWith('/api/tasks/') && req.method === 'PUT') {
      const id = url.pathname.split('/')[3];
      const body = await readBody(req);
      const fields = [];
      if (body.title) fields.push(`title=${quote(body.title)}`);
      if (body.owner) fields.push(`owner=${quote(body.owner)}`);
      if (body.due_date) fields.push(`due_date=${quote(body.due_date)}`);
      if (body.status) fields.push(`status=${quote(body.status)}`);
      if (body.priority) fields.push(`priority=${quote(body.priority)}`);
      if (fields.length === 0) return send(res, 400, { success: false, message: '没有需要更新的字段' });
      execSql(`UPDATE tasks SET ${fields.join(',')} WHERE id=${id};`);
      return send(res, 200, { success: true, data: query(`SELECT * FROM tasks WHERE id=${id}`)[0], message: '任务已更新' });
    }

    if (url.pathname === '/api/requirements' && req.method === 'GET') {
      const where = [];
      if (url.searchParams.get('status')) where.push(`status=${quote(url.searchParams.get('status'))}`);
      if (url.searchParams.get('city')) where.push(`city=${quote(url.searchParams.get('city'))}`);
      if (url.searchParams.get('style')) where.push(`style=${quote(url.searchParams.get('style'))}`);
      const sql = `SELECT r.*, u.name AS couple_name FROM requirements r LEFT JOIN users u ON r.couple_id=u.id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY r.created_at DESC`;
      const result = paginate(sql, url);
      return send(res, 200, { success: true, ...result, message: '获取需求列表成功' });
    }

    if (url.pathname === '/api/requirements' && req.method === 'POST') {
      const body = await readBody(req);
      const required = ['wedding_date', 'city', 'budget', 'guest_count', 'style', 'service_list', 'priority'];
      for (const f of required) if (!body[f]) return send(res, 400, { success: false, message: `缺少必填字段: ${f}` });
      execSql(`INSERT INTO requirements (couple_id,wedding_date,city,budget,guest_count,style,service_list,priority,status,description) VALUES (${body.couple_id || 1},${quote(body.wedding_date)},${quote(body.city)},${body.budget},${body.guest_count},${quote(body.style)},${quote(body.service_list)},${quote(body.priority)},${quote(body.status || 'published')},${quote(body.description || '')});`);
      const req_ = query('SELECT * FROM requirements ORDER BY id DESC LIMIT 1')[0];
      return send(res, 201, { success: true, data: req_, message: '需求已创建' });
    }

    if (url.pathname.match(/^\/api\/requirements\/\d+$/) && req.method === 'GET') {
      const id = url.pathname.split('/')[3];
      const data = query(`SELECT r.*, u.name AS couple_name FROM requirements r LEFT JOIN users u ON r.couple_id=u.id WHERE r.id=${id}`)[0];
      if (!data) return send(res, 404, { success: false, message: '需求不存在' });
      data.invitations = query(`SELECT i.*, s.company_name, s.service_type FROM invitations i LEFT JOIN suppliers s ON i.supplier_id=s.id WHERE i.requirement_id=${id}`);
      data.quotes = query(`SELECT q.*, s.company_name FROM quotes q LEFT JOIN suppliers s ON q.supplier_id=s.id WHERE q.requirement_id=${id}`);
      data.tasks = query(`SELECT * FROM fulfillment_tasks WHERE requirement_id=${id} ORDER BY due_date`);
      data.communications = query(`SELECT c.*, u.name AS sender_name FROM communications c LEFT JOIN users u ON c.sender_id=u.id WHERE c.requirement_id=${id} ORDER BY c.created_at`);
      data.contracts = query(`SELECT ct.*, s.company_name FROM contracts ct LEFT JOIN suppliers s ON ct.supplier_id=s.id WHERE ct.requirement_id=${id}`);
      data.payments = query(`SELECT p.* FROM payments p LEFT JOIN contracts ct ON p.contract_id=ct.id WHERE ct.requirement_id=${id}`);
      data.reviews = query(`SELECT r.*, u.name AS reviewer_name FROM reviews r LEFT JOIN users u ON r.reviewer_id=u.id WHERE r.requirement_id=${id} ORDER BY r.created_at DESC`);
      return send(res, 200, { success: true, data, message: '获取需求详情成功' });
    }

    if (url.pathname.match(/^\/api\/requirements\/\d+$/) && req.method === 'PUT') {
      const id = url.pathname.split('/')[3];
      const body = await readBody(req);
      const fields = [];
      const map = { wedding_date: 's', city: 's', budget: 'n', guest_count: 'n', style: 's', service_list: 's', priority: 's', status: 's', description: 's' };
      for (const [k, t] of Object.entries(map)) {
        if (body[k] !== undefined) fields.push(`${k}=${t === 'n' ? body[k] : quote(body[k])}`);
      }
      if (fields.length) execSql(`UPDATE requirements SET ${fields.join(',')}, updated_at=CURRENT_TIMESTAMP WHERE id=${id};`);
      return send(res, 200, { success: true, data: query(`SELECT * FROM requirements WHERE id=${id}`)[0], message: '需求已更新' });
    }

    if (url.pathname === '/api/suppliers' && req.method === 'GET') {
      const where = [];
      if (url.searchParams.get('service_type')) where.push(`service_type=${quote(url.searchParams.get('service_type'))}`);
      if (url.searchParams.get('status')) where.push(`status=${quote(url.searchParams.get('status'))}`);
      if (url.searchParams.get('city')) where.push(`service_area LIKE '%'||${quote(url.searchParams.get('city'))}||'%'`);
      const minRating = url.searchParams.get('min_rating');
      if (minRating) where.push(`rating>=${minRating}`);
      const sql = `SELECT s.*, u.name AS contact_user FROM suppliers s LEFT JOIN users u ON s.user_id=u.id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY s.rating DESC, s.credit_score DESC`;
      const result = paginate(sql, url);
      return send(res, 200, { success: true, ...result, message: '获取供应商列表成功' });
    }

    if (url.pathname === '/api/suppliers' && req.method === 'POST') {
      const body = await readBody(req);
      const required = ['service_type', 'company_name', 'contact_name', 'phone'];
      for (const f of required) if (!body[f]) return send(res, 400, { success: false, message: `缺少必填字段: ${f}` });
      execSql(`INSERT INTO suppliers (user_id,service_type,company_name,contact_name,phone,price_min,price_max,contract_template,service_area,description) VALUES (${body.user_id || 'NULL'},${quote(body.service_type)},${quote(body.company_name)},${quote(body.contact_name)},${quote(body.phone)},${body.price_min || 'NULL'},${body.price_max || 'NULL'},${quote(body.contract_template || '')},${quote(body.service_area || '')},${quote(body.description || '')});`);
      const sup = query('SELECT * FROM suppliers ORDER BY id DESC LIMIT 1')[0];
      return send(res, 201, { success: true, data: sup, message: '供应商已创建' });
    }

    if (url.pathname.match(/^\/api\/suppliers\/\d+$/) && req.method === 'GET') {
      const id = url.pathname.split('/')[3];
      const data = query(`SELECT s.*, u.name AS contact_user, u.email FROM suppliers s LEFT JOIN users u ON s.user_id=u.id WHERE s.id=${id}`)[0];
      if (!data) return send(res, 404, { success: false, message: '供应商不存在' });
      data.cases = query(`SELECT * FROM supplier_cases WHERE supplier_id=${id} ORDER BY created_at DESC`);
      data.schedules = query(`SELECT * FROM supplier_schedules WHERE supplier_id=${id} ORDER BY date`);
      data.reviews = query(`SELECT r.*, u.name AS reviewer_name FROM reviews r LEFT JOIN users u ON r.reviewer_id=u.id WHERE r.supplier_id=${id} ORDER BY r.created_at DESC LIMIT 10`);
      data.credit_records = query(`SELECT * FROM credit_records WHERE supplier_id=${id} ORDER BY created_at DESC LIMIT 10`);
      data.active_quotes = query(`SELECT q.*, r.wedding_date FROM quotes q LEFT JOIN requirements r ON q.requirement_id=r.id WHERE q.supplier_id=${id} AND q.status IN ('submitted','negotiating','selected') ORDER BY q.created_at DESC`);
      return send(res, 200, { success: true, data, message: '获取供应商详情成功' });
    }

    if (url.pathname.match(/^\/api\/suppliers\/\d+$/) && req.method === 'PUT') {
      const id = url.pathname.split('/')[3];
      const body = await readBody(req);
      const fields = [];
      const map = { service_type: 's', company_name: 's', contact_name: 's', phone: 's', price_min: 'n', price_max: 'n', contract_template: 's', service_area: 's', description: 's', status: 's' };
      for (const [k, t] of Object.entries(map)) {
        if (body[k] !== undefined) fields.push(`${k}=${t === 'n' ? body[k] : quote(body[k])}`);
      }
      if (fields.length) execSql(`UPDATE suppliers SET ${fields.join(',')}, updated_at=CURRENT_TIMESTAMP WHERE id=${id};`);
      return send(res, 200, { success: true, data: query(`SELECT * FROM suppliers WHERE id=${id}`)[0], message: '供应商已更新' });
    }

    if (url.pathname.match(/^\/api\/suppliers\/\d+\/cases$/) && req.method === 'GET') {
      const supplier_id = url.pathname.split('/')[3];
      return send(res, 200, { success: true, data: query(`SELECT * FROM supplier_cases WHERE supplier_id=${supplier_id} ORDER BY created_at DESC`), message: '获取供应商案例成功' });
    }

    if (url.pathname.match(/^\/api\/suppliers\/\d+\/cases$/) && req.method === 'POST') {
      const supplier_id = url.pathname.split('/')[3];
      const body = await readBody(req);
      if (!body.title) return send(res, 400, { success: false, message: '案例标题不能为空' });
      execSql(`INSERT INTO supplier_cases (supplier_id,title,description,image_urls,wedding_date,location,budget) VALUES (${supplier_id},${quote(body.title)},${quote(body.description || '')},${quote(body.image_urls || '')},${quote(body.wedding_date || '')},${quote(body.location || '')},${body.budget || 'NULL'});`);
      return send(res, 201, { success: true, data: query('SELECT * FROM supplier_cases ORDER BY id DESC LIMIT 1')[0], message: '案例已添加' });
    }

    if (url.pathname.match(/^\/api\/suppliers\/\d+\/schedules$/) && req.method === 'GET') {
      const supplier_id = url.pathname.split('/')[3];
      return send(res, 200, { success: true, data: query(`SELECT * FROM supplier_schedules WHERE supplier_id=${supplier_id} ORDER BY date`), message: '获取供应商档期成功' });
    }

    if (url.pathname.match(/^\/api\/suppliers\/\d+\/schedules$/) && req.method === 'POST') {
      const supplier_id = url.pathname.split('/')[3];
      const body = await readBody(req);
      if (!body.date) return send(res, 400, { success: false, message: '日期不能为空' });
      execSql(`INSERT INTO supplier_schedules (supplier_id,date,time_slot,status,booking_id) VALUES (${supplier_id},${quote(body.date)},${quote(body.time_slot || '全天')},${quote(body.status || 'available')},${body.booking_id || 'NULL'});`);
      return send(res, 201, { success: true, data: query('SELECT * FROM supplier_schedules ORDER BY id DESC LIMIT 1')[0], message: '档期已添加' });
    }

    if (url.pathname === '/api/invitations' && req.method === 'GET') {
      const sql = `SELECT i.*, r.wedding_date, r.city, r.budget, u.name AS couple_name, s.company_name, s.service_type, s.price_min, s.price_max FROM invitations i LEFT JOIN requirements r ON i.requirement_id=r.id LEFT JOIN users u ON r.couple_id=u.id LEFT JOIN suppliers s ON i.supplier_id=s.id ORDER BY i.created_at DESC`;
      const result = paginate(sql, url);
      return send(res, 200, { success: true, ...result, message: '获取邀请列表成功' });
    }

    if (url.pathname === '/api/invitations' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.requirement_id || !body.supplier_id) return send(res, 400, { success: false, message: '需求ID和供应商ID不能为空' });
      execSql(`INSERT INTO invitations (requirement_id,supplier_id,status,message,expires_at) VALUES (${body.requirement_id},${body.supplier_id},${quote(body.status || 'pending')},${quote(body.message || '')},${quote(body.expires_at || '')});`);
      const inv = query('SELECT * FROM invitations ORDER BY id DESC LIMIT 1')[0];
      return send(res, 201, { success: true, data: inv, message: '邀请已发送' });
    }

    if (url.pathname.match(/^\/api\/invitations\/\d+$/) && req.method === 'PUT') {
      const id = url.pathname.split('/')[3];
      const body = await readBody(req);
      if (body.status) execSql(`UPDATE invitations SET status=${quote(body.status)}, responded_at=CURRENT_TIMESTAMP WHERE id=${id};`);
      if (body.message) execSql(`UPDATE invitations SET message=${quote(body.message)} WHERE id=${id};`);
      return send(res, 200, { success: true, data: query(`SELECT * FROM invitations WHERE id=${id}`)[0], message: '邀请已更新' });
    }

    if (url.pathname === '/api/quotes' && req.method === 'GET') {
      const where = [];
      if (url.searchParams.get('requirement_id')) where.push(`requirement_id=${url.searchParams.get('requirement_id')}`);
      if (url.searchParams.get('supplier_id')) where.push(`supplier_id=${url.searchParams.get('supplier_id')}`);
      if (url.searchParams.get('status')) where.push(`status=${quote(url.searchParams.get('status'))}`);
      const sql = `SELECT q.*, r.wedding_date, r.city, s.company_name, s.service_type, s.rating FROM quotes q LEFT JOIN requirements r ON q.requirement_id=r.id LEFT JOIN suppliers s ON q.supplier_id=s.id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY q.created_at DESC`;
      return send(res, 200, { success: true, data: query(sql), message: '获取报价列表成功' });
    }

    if (url.pathname === '/api/quotes' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.invitation_id || !body.total_price) return send(res, 400, { success: false, message: '邀请ID和总价不能为空' });
      const totalPrice = parseInt(body.total_price, 10);
      if (isNaN(totalPrice) || totalPrice <= 0) return send(res, 400, { success: false, message: '报价金额必须大于0' });
      if (body.delivery_days !== undefined && body.delivery_days !== null) {
        const dd = parseInt(body.delivery_days, 10);
        if (isNaN(dd) || dd < 0) return send(res, 400, { success: false, message: '交付周期不能为负数' });
      }
      const inv = query(`SELECT * FROM invitations WHERE id=${body.invitation_id}`)[0];
      if (!inv) return send(res, 404, { success: false, message: '邀请不存在' });
      const existing = query(`SELECT id FROM quotes WHERE invitation_id=${body.invitation_id} AND status!='rejected' LIMIT 1`);
      if (existing.length > 0) return send(res, 400, { success: false, message: '该邀请已提交过报价' });
      execSql(`INSERT INTO quotes (invitation_id,requirement_id,supplier_id,total_price,breakdown,delivery_days,notes,status) VALUES (${body.invitation_id},${inv.requirement_id},${inv.supplier_id},${totalPrice},${quote(body.breakdown || '')},${body.delivery_days || 'NULL'},${quote(body.notes || '')},${quote(body.status || 'submitted')});`);
      const q = query('SELECT * FROM quotes ORDER BY id DESC LIMIT 1')[0];
      return send(res, 201, { success: true, data: q, message: '报价已提交' });
    }

    if (url.pathname.match(/^\/api\/quotes\/\d+\/select$/) && req.method === 'POST') {
      const id = url.pathname.split('/')[3];
      const q = query(`SELECT * FROM quotes WHERE id=${id}`)[0];
      if (!q) return send(res, 404, { success: false, message: '报价不存在' });
      execSql(`UPDATE quotes SET status='selected' WHERE id=${id};`);
      execSql(`UPDATE quotes SET status='rejected' WHERE requirement_id=${q.requirement_id} AND id!=${id};`);
      execSql(`UPDATE requirements SET status='matched' WHERE id=${q.requirement_id};`);
      return send(res, 200, { success: true, message: '报价已选中' });
    }

    if (url.pathname === '/api/communications' && req.method === 'GET') {
      const rid = url.searchParams.get('requirement_id');
      if (!rid) return send(res, 400, { success: false, message: '缺少需求ID' });
      return send(res, 200, { success: true, data: query(`SELECT c.*, u.name AS sender_name FROM communications c LEFT JOIN users u ON c.sender_id=u.id WHERE c.requirement_id=${rid} ORDER BY c.created_at`), message: '获取沟通记录成功' });
    }

    if (url.pathname === '/api/communications' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.requirement_id || !body.sender_id || !body.message) return send(res, 400, { success: false, message: '需求ID、发送人ID和消息不能为空' });
      execSql(`INSERT INTO communications (requirement_id,sender_id,sender_type,message,attachment_urls) VALUES (${body.requirement_id},${body.sender_id},${quote(body.sender_type || 'couple')},${quote(body.message)},${quote(body.attachment_urls || '')});`);
      return send(res, 201, { success: true, data: query('SELECT * FROM communications ORDER BY id DESC LIMIT 1')[0], message: '消息已发送' });
    }

    if (url.pathname === '/api/contracts' && req.method === 'GET') {
      const sql = `SELECT c.*, r.wedding_date, s.company_name, q.total_price FROM contracts c LEFT JOIN requirements r ON c.requirement_id=r.id LEFT JOIN suppliers s ON c.supplier_id=s.id LEFT JOIN quotes q ON c.quote_id=q.id ORDER BY c.created_at DESC`;
      return send(res, 200, { success: true, data: query(sql), message: '获取合同列表成功' });
    }

    if (url.pathname === '/api/contracts' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.requirement_id || !body.supplier_id || !body.content) return send(res, 400, { success: false, message: '需求ID、供应商ID和合同内容不能为空' });
      execSql(`INSERT INTO contracts (requirement_id,supplier_id,quote_id,content,status) VALUES (${body.requirement_id},${body.supplier_id},${body.quote_id || 'NULL'},${quote(body.content)},${quote(body.status || 'draft')});`);
      return send(res, 201, { success: true, data: query('SELECT * FROM contracts ORDER BY id DESC LIMIT 1')[0], message: '合同已创建' });
    }

    if (url.pathname.match(/^\/api\/contracts\/\d+\/sign$/) && req.method === 'POST') {
      const id = url.pathname.split('/')[3];
      const body = await readBody(req);
      if (body.signer === 'couple') execSql(`UPDATE contracts SET signed_by_couple_at=CURRENT_TIMESTAMP WHERE id=${id};`);
      if (body.signer === 'supplier') execSql(`UPDATE contracts SET signed_by_supplier_at=CURRENT_TIMESTAMP WHERE id=${id};`);
      execSql(`UPDATE contracts SET status=CASE WHEN signed_by_couple_at IS NOT NULL AND signed_by_supplier_at IS NOT NULL THEN 'signed' ELSE 'pending_signature' END WHERE id=${id};`);
      return send(res, 200, { success: true, data: query(`SELECT * FROM contracts WHERE id=${id}`)[0], message: '合同已签署' });
    }

    if (url.pathname.match(/^\/api\/contracts\/\d+\/archive$/) && req.method === 'POST') {
      const id = url.pathname.split('/')[3];
      execSql(`UPDATE contracts SET status='archived', archived_at=CURRENT_TIMESTAMP WHERE id=${id};`);
      return send(res, 200, { success: true, message: '合同已归档' });
    }

    if (url.pathname === '/api/payments' && req.method === 'GET') {
      return send(res, 200, { success: true, data: query(`SELECT p.*, c.id AS contract_id, s.company_name FROM payments p LEFT JOIN contracts c ON p.contract_id=c.id LEFT JOIN suppliers s ON c.supplier_id=s.id ORDER BY p.created_at DESC`), message: '获取支付记录成功' });
    }

    if (url.pathname === '/api/payments' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.contract_id || !body.amount || !body.payment_type) return send(res, 400, { success: false, message: '合同ID、金额和支付类型不能为空' });
      execSql(`INSERT INTO payments (contract_id,amount,payment_type,status,transaction_id,notes) VALUES (${body.contract_id},${body.amount},${quote(body.payment_type)},${quote(body.status || 'pending')},${quote(body.transaction_id || '')},${quote(body.notes || '')});`);
      if (body.status === 'paid') execSql(`UPDATE payments SET paid_at=CURRENT_TIMESTAMP WHERE id=last_insert_rowid();`);
      return send(res, 201, { success: true, data: query('SELECT * FROM payments ORDER BY id DESC LIMIT 1')[0], message: '支付已记录' });
    }

    if (url.pathname.match(/^\/api\/payments\/\d+\/pay$/) && req.method === 'POST') {
      const id = url.pathname.split('/')[3];
      const body = await readBody(req);
      execSql(`UPDATE payments SET status='paid', transaction_id=${quote(body.transaction_id || '')}, paid_at=CURRENT_TIMESTAMP WHERE id=${id};`);
      return send(res, 200, { success: true, message: '支付已确认' });
    }

    if (url.pathname === '/api/fulfillment-tasks' && req.method === 'GET') {
      const where = [];
      if (url.searchParams.get('requirement_id')) where.push(`requirement_id=${url.searchParams.get('requirement_id')}`);
      if (url.searchParams.get('status')) where.push(`status=${quote(url.searchParams.get('status'))}`);
      if (url.searchParams.get('category')) where.push(`category=${quote(url.searchParams.get('category'))}`);
      if (url.searchParams.get('responsible_party')) where.push(`responsible_party=${quote(url.searchParams.get('responsible_party'))}`);
      const sql = `SELECT ft.*, u.name AS responsible_name FROM fulfillment_tasks ft LEFT JOIN users u ON ft.responsible_id=u.id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ft.due_date, ft.created_at`;
      return send(res, 200, { success: true, data: query(sql), message: '获取履约任务成功' });
    }

    if (url.pathname === '/api/fulfillment-tasks' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.requirement_id || !body.title || !body.category || !body.responsible_party) return send(res, 400, { success: false, message: '需求ID、标题、分类和责任方不能为空' });
      execSql(`INSERT INTO fulfillment_tasks (requirement_id,contract_id,title,description,category,responsible_party,responsible_id,due_date,status,parent_task_id) VALUES (${body.requirement_id},${body.contract_id || 'NULL'},${quote(body.title)},${quote(body.description || '')},${quote(body.category)},${quote(body.responsible_party)},${body.responsible_id || 'NULL'},${quote(body.due_date || '')},${quote(body.status || 'pending')},${body.parent_task_id || 'NULL'});`);
      const t = query('SELECT * FROM fulfillment_tasks ORDER BY id DESC LIMIT 1')[0];
      return send(res, 201, { success: true, data: t, message: '履约任务已创建' });
    }

    if (url.pathname.match(/^\/api\/fulfillment-tasks\/\d+$/) && req.method === 'PUT') {
      const id = url.pathname.split('/')[3];
      const body = await readBody(req);
      const fields = [];
      const map = { title: 's', description: 's', category: 's', responsible_party: 's', responsible_id: 'n', due_date: 's', status: 's', parent_task_id: 'n' };
      for (const [k, t] of Object.entries(map)) {
        if (body[k] !== undefined) fields.push(`${k}=${t === 'n' ? body[k] : quote(body[k])}`);
      }
      if (body.status === 'completed') fields.push("completed_at=CURRENT_TIMESTAMP");
      if (fields.length) execSql(`UPDATE fulfillment_tasks SET ${fields.join(',')}, updated_at=CURRENT_TIMESTAMP WHERE id=${id};`);
      return send(res, 200, { success: true, data: query(`SELECT * FROM fulfillment_tasks WHERE id=${id}`)[0], message: '任务已更新' });
    }

    if (url.pathname.match(/^\/api\/fulfillment-tasks\/\d+\/status$/) && req.method === 'POST') {
      const id = url.pathname.split('/')[3];
      const body = await readBody(req);
      if (!body.status) return send(res, 400, { success: false, message: '状态不能为空' });
      const updates = [`status=${quote(body.status)}`];
      if (body.status === 'completed') updates.push("completed_at=CURRENT_TIMESTAMP");
      execSql(`UPDATE fulfillment_tasks SET ${updates.join(',')}, updated_at=CURRENT_TIMESTAMP WHERE id=${id};`);
      return send(res, 200, { success: true, data: query(`SELECT * FROM fulfillment_tasks WHERE id=${id}`)[0], message: '任务状态已更新' });
    }

    if (url.pathname === '/api/after-sales' && req.method === 'GET') {
      const sql = `SELECT a.*, r.wedding_date, s.company_name, u.name AS filed_by_name FROM after_sales a LEFT JOIN requirements r ON a.requirement_id=r.id LEFT JOIN suppliers s ON a.supplier_id=s.id LEFT JOIN users u ON a.filed_by=u.id ORDER BY a.created_at DESC`;
      return send(res, 200, { success: true, data: query(sql), message: '获取售后记录成功' });
    }

    if (url.pathname === '/api/after-sales' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.requirement_id || !body.type || !body.title || !body.description) return send(res, 400, { success: false, message: '需求ID、类型、标题和描述不能为空' });
      execSql(`INSERT INTO after_sales (requirement_id,contract_id,supplier_id,type,title,description,status,refund_amount,filed_by) VALUES (${body.requirement_id},${body.contract_id || 'NULL'},${body.supplier_id || 'NULL'},${quote(body.type)},${quote(body.title)},${quote(body.description)},${quote(body.status || 'open')},${body.refund_amount || 0},${body.filed_by || 'NULL'});`);
      const a = query('SELECT * FROM after_sales ORDER BY id DESC LIMIT 1')[0];
      if (a.supplier_id && a.type === 'complaint') {
        execSql(`UPDATE suppliers SET credit_score=credit_score-5 WHERE id=${a.supplier_id};`);
        execSql(`INSERT INTO credit_records (supplier_id,change,reason,reference_type,reference_id) VALUES (${a.supplier_id},-5,'投诉扣分','after_sale',${a.id});`);
      }
      return send(res, 201, { success: true, data: a, message: '售后已提交' });
    }

    if (url.pathname.match(/^\/api\/after-sales\/\d+$/) && req.method === 'PUT') {
      const id = url.pathname.split('/')[3];
      const body = await readBody(req);
      const fields = [];
      if (body.status) fields.push(`status=${quote(body.status)}`);
      if (body.resolution) fields.push(`resolution=${quote(body.resolution)}`);
      if (body.refund_amount !== undefined) fields.push(`refund_amount=${body.refund_amount}`);
      if (body.handled_by) fields.push(`handled_by=${body.handled_by}`);
      if (fields.length) execSql(`UPDATE after_sales SET ${fields.join(',')}, updated_at=CURRENT_TIMESTAMP WHERE id=${id};`);
      const a = query(`SELECT * FROM after_sales WHERE id=${id}`)[0];
      if (body.status === 'resolved' && a.type === 'refund' && a.refund_amount > 0 && a.supplier_id) {
        execSql(`UPDATE suppliers SET credit_score=credit_score-3 WHERE id=${a.supplier_id};`);
        execSql(`INSERT INTO credit_records (supplier_id,change,reason,reference_type,reference_id) VALUES (${a.supplier_id},-3,'退款扣分','after_sale',${id});`);
      }
      return send(res, 200, { success: true, data: a, message: '售后已更新' });
    }

    if (url.pathname === '/api/reviews' && req.method === 'GET') {
      const where = [];
      if (url.searchParams.get('supplier_id')) where.push(`supplier_id=${url.searchParams.get('supplier_id')}`);
      if (url.searchParams.get('requirement_id')) where.push(`requirement_id=${url.searchParams.get('requirement_id')}`);
      return send(res, 200, { success: true, data: query(`SELECT r.*, u.name AS reviewer_name, s.company_name FROM reviews r LEFT JOIN users u ON r.reviewer_id=u.id LEFT JOIN suppliers s ON r.supplier_id=s.id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY r.created_at DESC`), message: '获取评价成功' });
    }

    if (url.pathname === '/api/reviews' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.supplier_id || !body.rating || !body.reviewer_id) return send(res, 400, { success: false, message: '供应商ID、评分和评价人ID不能为空' });
      if (body.rating < 1 || body.rating > 5) return send(res, 400, { success: false, message: '评分必须在1-5之间' });
      execSql(`INSERT INTO reviews (requirement_id,supplier_id,contract_id,reviewer_id,rating,content,images) VALUES (${body.requirement_id || 'NULL'},${body.supplier_id},${body.contract_id || 'NULL'},${body.reviewer_id},${body.rating},${quote(body.content || '')},${quote(body.images || '')});`);
      const avg = query(`SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE supplier_id=${body.supplier_id}`)[0];
      execSql(`UPDATE suppliers SET rating=${avg.avg_rating}, review_count=${avg.cnt} WHERE id=${body.supplier_id};`);
      const change = body.rating >= 4 ? 5 : body.rating <= 2 ? -5 : 0;
      if (change !== 0) {
        execSql(`UPDATE suppliers SET credit_score=MAX(0,MIN(100,credit_score+${change})) WHERE id=${body.supplier_id};`);
        execSql(`INSERT INTO credit_records (supplier_id,change,reason,reference_type,reference_id) VALUES (${body.supplier_id},${change},'${body.rating >= 4 ? '好评加分' : '差评扣分'}','review',last_insert_rowid());`);
      }
      return send(res, 201, { success: true, data: query('SELECT * FROM reviews ORDER BY id DESC LIMIT 1')[0], message: '评价已提交' });
    }

    if (url.pathname === '/api/credit-records' && req.method === 'GET') {
      const sid = url.searchParams.get('supplier_id');
      return send(res, 200, { success: true, data: query(`SELECT cr.*, s.company_name FROM credit_records cr LEFT JOIN suppliers s ON cr.supplier_id=s.id ${sid ? 'WHERE cr.supplier_id=' + sid : ''} ORDER BY cr.created_at DESC`), message: '获取信用记录成功' });
    }

    if (url.pathname === '/api/users' && req.method === 'GET') {
      const role = url.searchParams.get('role');
      return send(res, 200, { success: true, data: query(`SELECT * FROM users ${role ? 'WHERE role=' + quote(role) : ''} ORDER BY role, name`), message: '获取用户成功' });
    }

    if (url.pathname === '/api/users' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.role || !body.name) return send(res, 400, { success: false, message: '角色和姓名不能为空' });
      execSql(`INSERT INTO users (role,name,phone,email) VALUES (${quote(body.role)},${quote(body.name)},${quote(body.phone || '')},${quote(body.email || '')});`);
      return send(res, 201, { success: true, data: query('SELECT * FROM users ORDER BY id DESC LIMIT 1')[0], message: '用户已创建' });
    }

    send(res, 404, { success: false, message: '接口不存在: ' + url.pathname });
  } catch (err) {
    console.error(err);
    send(res, 500, { success: false, message: `服务异常: ${err.message}` });
  }
});

server.listen(port, host, () => {
  console.log(`Backend started: http://${host}:${port}`);
  console.log(`Health check: http://${host}:${port}/api/health`);
});
