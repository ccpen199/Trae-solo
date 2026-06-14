const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const projectDir = process.env.PROJECT_DIR || path.resolve(__dirname, '..');
const projectName = process.env.PROJECT_NAME || path.basename(projectDir);
const host = process.env.HOST || '127.0.0.1';
const backendPort = Number(process.env.BACKEND_PORT || 59090);
const frontendPort = Number(process.env.FRONTEND_PORT || 49090);
const dbPath = path.resolve(projectDir, process.env.DB_PATH || 'data/app.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      provider TEXT NOT NULL,
      price INTEGER NOT NULL,
      rating REAL NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER,
      customer TEXT NOT NULL,
      phone TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      contact TEXT NOT NULL,
      detail TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS news_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      author TEXT NOT NULL,
      source TEXT NOT NULL,
      content TEXT NOT NULL,
      ai_review_status TEXT NOT NULL DEFAULT '待审核',
      ai_sensitive_words TEXT,
      ai_fact_check_score REAL,
      publish_status TEXT NOT NULL DEFAULT '草稿',
      publish_schedule TEXT,
      publish_channels TEXT,
      gov_department TEXT,
      gov_contact TEXT,
      gov_status TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ugc_clues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      contact TEXT NOT NULL,
      location TEXT,
      description TEXT NOT NULL,
      media_urls TEXT,
      verification_status TEXT NOT NULL DEFAULT '待核实',
      reporter TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS government_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_type TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      applicant_phone TEXT NOT NULL,
      id_card TEXT,
      address TEXT,
      materials TEXT,
      status TEXT NOT NULL DEFAULT '待受理',
      processing_node TEXT,
      processing_result TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS editorial_workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      operator TEXT NOT NULL,
      action TEXT NOT NULL,
      comment TEXT,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS public_opinions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      source TEXT NOT NULL,
      channel TEXT NOT NULL,
      content TEXT NOT NULL,
      sentiment TEXT NOT NULL,
      sentiment_score REAL NOT NULL,
      author TEXT,
      url TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      spread_path TEXT,
      attributed_source TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS emergency_commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      sender TEXT NOT NULL,
      receiver TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '待响应',
      response TEXT,
      response_time TEXT,
      deadline TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hotline_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caller_name TEXT NOT NULL,
      caller_phone TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      handler TEXT,
      status TEXT NOT NULL DEFAULT '待处理',
      solution TEXT,
      created_at TEXT NOT NULL,
      closed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS service_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL,
      provider TEXT NOT NULL,
      applicant TEXT NOT NULL,
      contact TEXT NOT NULL,
      requirements TEXT,
      api_config TEXT,
      status TEXT NOT NULL DEFAULT '待接入',
      created_at TEXT NOT NULL
    );
  `);

  const serviceCount = db.prepare('SELECT COUNT(*) AS count FROM services').get().count;
  if (serviceCount === 0) {
    const insert = db.prepare(`
      INSERT INTO services (title, category, provider, price, rating, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    [
      ['多源新闻采集与AI编审', '新闻生产', '广州广电编审台', 0, 4.9, '功能入口', '汇聚记者投稿、政务通稿、UGC线索，AI敏感词过滤与事实核查。'],
      ['全媒体发布排期服务', '全媒体发布', '传播调度中心', 199, 4.8, '可购买', '一键排期发布到电视、广播、APP、公众号、视频号多端。'],
      ['记者投稿绿色通道', '记者投稿', '记者管理部', 0, 4.7, '功能入口', '支持记者在线投稿、状态追踪、稿酬核算与通知推送。'],
      ['政务通稿发布服务', '政务通稿', '政务合作部', 0, 4.6, '功能入口', '政务稿件三审三校，规范格式校验，多渠道同步发布。'],
      ['UGC线索核实平台', 'UGC线索', '线索审核中心', 0, 4.5, '功能入口', '市民报料线索审核、记者指派、真实性核查与奖励发放。'],
      ['AI智能编审助手', 'AI编审', '技术研发部', 149, 4.8, '可购买', 'AI敏感词检测、事实核查评分、自动摘要与标签推荐。'],
      ['发布流转追踪系统', '发布流转', '运营监控中心', 0, 4.7, '功能入口', '全流程可视化追踪：投稿→审核→签发→发布→传播效果。'],
      ['12345热线转办服务', '民生热线', '政务服务中心', 0, 4.6, '功能入口', '市民热线记录、分类派单、处理追踪与满意度回访。'],
      ['政务办事接入服务', '政务办事', '政务服务中心', 0, 4.5, '功能入口', '对接政务办事入口，支持预约、办理、查询、证照全流程。'],
      ['城市服务聚合接入', '服务接入', '开放平台部', 0, 4.8, '功能入口', '接入交通、文旅、教育、医疗等城市服务，统一入口管理。'],
      ['舆情监测预警系统', '舆情监测', '舆情分析中心', 0, 4.9, '功能入口', '全网舆情声量监测、情绪分析、传播路径追踪与预警。'],
      ['应急指令响应通道', '应急管理', '应急指挥中心', 0, 4.9, '功能入口', '分级应急指令下发、响应追踪、闭环管理与时效考核。'],
      ['传播效果归因分析', '效果归因', '数据研究院', 0, 4.7, '功能入口', '多维度传播效果分析、用户画像、转化漏斗与ROI归因。'],
      ['交通路况实时播报', '交通路况', '交通事业部', 0, 4.6, '功能入口', '实时路况、拥堵预警、施工通告、公共交通动态播报。'],
      ['文旅预约服务接入', '文旅预约', '文旅事业部', 0, 4.5, '功能入口', '景点预约、文博场馆订票、文旅活动报名与核销。'],
      ['非遗文化传播服务', '非遗文化', '非遗保护中心', 0, 4.8, '功能入口', '非遗内容数字化、专题报道、直播活动与文创推广。'],
    ].forEach((item) => insert.run(...item));
  }

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount === 0) {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)').run('演示用户', '13800138000', 'user', now);
    db.prepare('INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)').run('后台管理员', '13900139000', 'admin', now);
  }
}

function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}

function json(res, status, payload, origin) {
  const body = Buffer.from(JSON.stringify(payload));
  const allowedOrigin = origin && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)
    ? origin
    : `http://127.0.0.1:${frontendPort}`;
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    Vary: 'Origin',
  });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

function services(query) {
  const search = String(query.get('search') || query.get('q') || '').trim();
  const category = String(query.get('category') || '').trim();
  let sql = 'SELECT * FROM services WHERE 1=1';
  const params = [];
  if (search) {
    sql += ' AND (title LIKE ? OR provider LIKE ? OR description LIKE ? OR category LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category && category !== '全部') {
    sql += ' AND category = ?';
    params.push(category);
  }
  return all(`${sql} ORDER BY rating DESC, id ASC`, params);
}

function boundedLimit(query, fallback = 12, max = 50) {
  const parsed = Number(query.get('limit') || fallback);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function currentUser() {
  return get('SELECT * FROM users ORDER BY id LIMIT 1');
}

function adminSummary() {
  const positiveCount = get("SELECT COUNT(*) AS count FROM public_opinions WHERE sentiment = '正面'").count;
  const neutralCount = get("SELECT COUNT(*) AS count FROM public_opinions WHERE sentiment = '中性'").count;
  const negativeCount = get("SELECT COUNT(*) AS count FROM public_opinions WHERE sentiment = '负面'").count;
  const totalOpinions = positiveCount + neutralCount + negativeCount;
  const pendingEmergency = get("SELECT COUNT(*) AS count FROM emergency_commands WHERE status = '待响应'").count;
  const avgSentiment = get("SELECT COALESCE(AVG(sentiment_score), 0) AS avg FROM public_opinions").avg;
  
  return {
    users: get('SELECT COUNT(*) AS count FROM users').count,
    services: get('SELECT COUNT(*) AS count FROM services').count,
    orders: get('SELECT COUNT(*) AS count FROM orders').count,
    submissions: get('SELECT COUNT(*) AS count FROM submissions').count,
    revenue: get('SELECT COALESCE(SUM(amount), 0) AS total FROM orders').total,
    newsArticles: get('SELECT COUNT(*) AS count FROM news_articles').count,
    ugcClues: get('SELECT COUNT(*) AS count FROM ugc_clues').count,
    governmentServices: get('SELECT COUNT(*) AS count FROM government_services').count,
    publicOpinions: totalOpinions,
    positiveOpinions: positiveCount,
    neutralOpinions: neutralCount,
    negativeOpinions: negativeCount,
    avgSentimentScore: avgSentiment,
    emergencyCommands: get('SELECT COUNT(*) AS count FROM emergency_commands').count,
    pendingEmergency: pendingEmergency,
    hotlineRecords: get('SELECT COUNT(*) AS count FROM hotline_records').count,
    serviceAccess: get('SELECT COUNT(*) AS count FROM service_access').count,
    editorialWorkflows: get('SELECT COUNT(*) AS count FROM editorial_workflows').count,
    modules: ['登录注册', '搜索筛选', '购买提交', '个人中心', '后台管理', '新闻生产', '城市服务', '舆情监测', '应急管理'],
    logs: all('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5'),
  };
}

async function handle(req, res) {
  const origin = req.headers.origin;
  if (req.method === 'OPTIONS') return json(res, 204, {}, origin);
  const url = new URL(req.url || '/', `http://${host}:${backendPort}`);
  const route = url.pathname.replace(/\/$/, '') || '/';

  if (req.method === 'GET' && route === '/api/health') {
    return json(res, 200, { ok: true, status: 'ok', project: projectName, db: dbPath, time: Date.now() }, origin);
  }
  if (req.method === 'GET' && route === '/api') {
    return json(res, 200, {
      ok: true,
      project: projectName,
      health: '/api/health',
      endpoints: {
        services: '/api/services',
        categories: '/api/categories',
        profile: '/api/profile',
        admin: '/api/admin/summary',
      },
    }, origin);
  }
  if (req.method === 'GET' && ['/api/services', '/api/products', '/api/tasks', '/api/search'].includes(route)) {
    return json(res, 200, { ok: true, data: services(url.searchParams) }, origin);
  }
  if (req.method === 'GET' && route === '/api/categories') {
    return json(res, 200, { ok: true, data: all('SELECT DISTINCT category FROM services ORDER BY category').map((r) => r.category) }, origin);
  }
  if (req.method === 'GET' && route === '/api/orders') {
    const limit = boundedLimit(url.searchParams);
    return json(res, 200, {
      ok: true,
      data: all('SELECT * FROM orders ORDER BY id DESC LIMIT ?', [limit]),
      total: get('SELECT COUNT(*) AS count FROM orders').count,
    }, origin);
  }
  if (req.method === 'GET' && route === '/api/profile') {
    return json(res, 200, {
      ok: true,
      data: {
        user: currentUser(),
        stats: {
          orders: get('SELECT COUNT(*) AS count FROM orders').count,
          submissions: get('SELECT COUNT(*) AS count FROM submissions').count,
          newsArticles: get('SELECT COUNT(*) AS count FROM news_articles').count,
          ugcClues: get('SELECT COUNT(*) AS count FROM ugc_clues').count,
          governmentServices: get('SELECT COUNT(*) AS count FROM government_services').count,
          hotlineRecords: get('SELECT COUNT(*) AS count FROM hotline_records').count,
          serviceAccess: get('SELECT COUNT(*) AS count FROM service_access').count,
        },
      },
    }, origin);
  }
  if (req.method === 'GET' && ['/api/auth/me', '/api/users/profile', '/api/user/profile'].includes(route)) {
    return json(res, 200, { ok: true, data: currentUser(), user: currentUser() }, origin);
  }
  if (req.method === 'GET' && ['/api/admin/summary', '/api/admin/dashboard', '/api/admin/stats'].includes(route)) {
    return json(res, 200, { ok: true, data: adminSummary() }, origin);
  }
  if (req.method === 'GET' && ['/api/teachers', '/api/courses', '/api/bookings'].includes(route)) {
    return json(res, 200, {
      ok: true,
      data: services(url.searchParams),
      total: get('SELECT COUNT(*) AS count FROM services').count,
    }, origin);
  }
  if (req.method === 'GET' && route === '/api/cart') {
    return json(res, 200, {
      ok: true,
      data: { items: all('SELECT * FROM orders ORDER BY id DESC LIMIT 5'), total: get('SELECT COALESCE(SUM(amount), 0) AS total FROM orders').total },
    }, origin);
  }

  if (req.method === 'POST' && ['/api/auth/login', '/api/auth/register', '/api/login', '/api/register'].includes(route)) {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const phone = String(body.phone || '13800138000');
    let user = get('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) {
      db.prepare('INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)').run(String(body.name || '注册用户'), phone, 'user', now);
      user = get('SELECT * FROM users WHERE phone = ?', [phone]);
    }
    return json(res, 200, { ok: true, token: `local-token-${user.id}`, user }, origin);
  }
  if (req.method === 'POST' && ['/api/orders', '/api/purchase', '/api/buy'].includes(route)) {
    const body = await readBody(req);
    const serviceId = Number(body.serviceId || body.service_id || 1);
    const item = get('SELECT * FROM services WHERE id = ?', [serviceId]) || get('SELECT * FROM services ORDER BY id LIMIT 1');
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO orders (service_id, customer, phone, amount, status, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(serviceId, String(body.customer || '演示用户'), String(body.phone || '13800138000'), Number(body.amount || item.price), '已提交', String(body.note || '网页提交的购买申请'), now);
    db.prepare('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)').run('user', `提交订单 #${result.lastInsertRowid}`, now);
    return json(res, 200, { ok: true, data: get('SELECT * FROM orders WHERE id = ?', [result.lastInsertRowid]) }, origin);
  }
  if (req.method === 'POST' && ['/api/submissions', '/api/submit', '/api/requests'].includes(route)) {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO submissions (kind, title, contact, detail, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('需求提交', String(body.title || '新的业务需求'), String(body.contact || '13800138000'), String(body.detail || '需要平台安排顾问跟进'), '待处理', now);
    return json(res, 200, { ok: true, data: get('SELECT * FROM submissions WHERE id = ?', [result.lastInsertRowid]) }, origin);
  }

  if (req.method === 'GET' && route === '/api/news/articles') {
    const limit = boundedLimit(url.searchParams);
    const category = String(url.searchParams.get('category') || '').trim();
    const idParam = url.searchParams.get('id');
    if (idParam) {
      const id = Number(idParam);
      const article = get('SELECT * FROM news_articles WHERE id = ?', [id]);
      if (article) {
        const workflows = all('SELECT * FROM editorial_workflows WHERE article_id = ? ORDER BY id DESC', [id]);
        return json(res, 200, { ok: true, data: { ...article, workflows } }, origin);
      }
      return json(res, 404, { ok: false, error: '稿件不存在' }, origin);
    }
    let sql = 'SELECT * FROM news_articles WHERE 1=1';
    const params = [];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);
    return json(res, 200, { ok: true, data: all(sql, params), total: get('SELECT COUNT(*) AS count FROM news_articles').count }, origin);
  }
  if (req.method === 'GET' && route.startsWith('/api/news/articles/')) {
    const id = Number(route.split('/').pop());
    const article = get('SELECT * FROM news_articles WHERE id = ?', [id]);
    const workflows = all('SELECT * FROM editorial_workflows WHERE article_id = ? ORDER BY id DESC', [id]);
    return json(res, 200, { ok: true, data: { ...article, workflows } }, origin);
  }
  if (req.method === 'POST' && route === '/api/news/articles') {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const allSensitiveWords = ['敏感词', '违禁', '违规', '色情', '暴力', '赌博', '诈骗'];
    const content = String(body.content || '');
    const detectedSensitive = allSensitiveWords.filter(w => content.includes(w));
    const sensitiveWordsJson = detectedSensitive.length > 0 ? JSON.stringify(detectedSensitive) : null;
    const baseScore = 75 + Math.floor(Math.random() * 25);
    const factCheckScore = detectedSensitive.length > 0 ? Math.max(50, baseScore - detectedSensitive.length * 10) : baseScore;
    const isGov = String(body.source || '').includes('政务');
    const publishStatus = isGov ? '待初审' : '编辑审核中';
    const aiReviewStatus = detectedSensitive.length > 0 ? '待人工复核' : 'AI审核通过';
    const result = db.prepare(`
      INSERT INTO news_articles (title, category, author, source, content, ai_review_status, ai_sensitive_words, ai_fact_check_score, publish_status, gov_department, gov_contact, gov_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(body.title || '无标题稿件'),
      String(body.category || '时政新闻'),
      String(body.author || '匿名记者'),
      String(body.source || '记者投稿'),
      content,
      aiReviewStatus,
      sensitiveWordsJson,
      Number(factCheckScore),
      publishStatus,
      String(body.gov_department || null),
      String(body.gov_contact || null),
      isGov ? String(body.gov_status || '待初审') : null,
      now, now
    );
    db.prepare('INSERT INTO editorial_workflows (article_id, operator, action, comment, from_status, to_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      result.lastInsertRowid, body.author || '记者', '提交稿件', isGov ? '政务通稿提交' : '初次提交', '无', publishStatus, now
    );
    db.prepare('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)').run(body.author || '记者', `提交${isGov ? '政务通稿' : '新闻稿件'} #${result.lastInsertRowid}`, now);
    return json(res, 200, { ok: true, data: get('SELECT * FROM news_articles WHERE id = ?', [result.lastInsertRowid]) }, origin);
  }
  if (req.method === 'POST' && route.startsWith('/api/news/articles/') && route.endsWith('/review')) {
    const id = Number(route.split('/')[4]);
    const body = await readBody(req);
    const now = new Date().toISOString();
    const oldStatus = get('SELECT publish_status FROM news_articles WHERE id = ?', [id]).publish_status;
    db.prepare('UPDATE news_articles SET publish_status = ?, ai_review_status = ?, updated_at = ? WHERE id = ?').run(
      String(body.to_status || '已审核'),
      String(body.review_status || '审核通过'),
      now, id
    );
    db.prepare('INSERT INTO editorial_workflows (article_id, operator, action, comment, from_status, to_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, body.operator || '编辑', body.action || '审核通过', body.comment || '', oldStatus, body.to_status || '已审核', now
    );
    return json(res, 200, { ok: true, data: get('SELECT * FROM news_articles WHERE id = ?', [id]) }, origin);
  }

  if (req.method === 'GET' && route === '/api/ugc/clues') {
    const limit = boundedLimit(url.searchParams);
    const status = String(url.searchParams.get('status') || '').trim();
    let sql = 'SELECT * FROM ugc_clues WHERE 1=1';
    const params = [];
    if (status) {
      sql += ' AND verification_status = ?';
      params.push(status);
    }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);
    return json(res, 200, { ok: true, data: all(sql, params), total: get('SELECT COUNT(*) AS count FROM ugc_clues').count }, origin);
  }
  if (req.method === 'POST' && route === '/api/ugc/clues') {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO ugc_clues (title, category, contact, location, description, media_urls, verification_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(body.title || 'UGC线索'),
      String(body.category || '民生报料'),
      String(body.contact || '13800138000'),
      body.location || null,
      String(body.description || ''),
      body.media_urls || null,
      '待核实', now
    );
    db.prepare('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)').run(body.contact || '市民', `提交UGC线索 #${result.lastInsertRowid}`, now);
    return json(res, 200, { ok: true, data: get('SELECT * FROM ugc_clues WHERE id = ?', [result.lastInsertRowid]) }, origin);
  }

  if (req.method === 'GET' && route === '/api/government/services') {
    const limit = boundedLimit(url.searchParams);
    return json(res, 200, { ok: true, data: all('SELECT * FROM government_services ORDER BY id DESC LIMIT ?', [limit]), total: get('SELECT COUNT(*) AS count FROM government_services').count }, origin);
  }
  if (req.method === 'POST' && route === '/api/government/services') {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO government_services (service_type, applicant_name, applicant_phone, id_card, address, materials, status, processing_node, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(body.service_type || '政务办事'),
      String(body.applicant_name || '申请人'),
      String(body.applicant_phone || '13800138000'),
      body.id_card || null,
      body.address || null,
      body.materials || null,
      '待受理', '提交申请', now, now
    );
    db.prepare('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)').run(body.applicant_name || '市民', `提交政务办事申请 #${result.lastInsertRowid}`, now);
    return json(res, 200, { ok: true, data: get('SELECT * FROM government_services WHERE id = ?', [result.lastInsertRowid]) }, origin);
  }

  if (req.method === 'GET' && route === '/api/public/opinions') {
    const limit = boundedLimit(url.searchParams);
    const sentiment = String(url.searchParams.get('sentiment') || '').trim();
    let sql = 'SELECT * FROM public_opinions WHERE 1=1';
    const params = [];
    if (sentiment) {
      sql += ' AND sentiment = ?';
      params.push(sentiment);
    }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);
    const data = all(sql, params);
    const stats = {
      total: get('SELECT COUNT(*) AS count FROM public_opinions').count,
      positive: get("SELECT COUNT(*) AS count FROM public_opinions WHERE sentiment = '正面'").count,
      neutral: get("SELECT COUNT(*) AS count FROM public_opinions WHERE sentiment = '中性'").count,
      negative: get("SELECT COUNT(*) AS count FROM public_opinions WHERE sentiment = '负面'").count,
      avgScore: get('SELECT COALESCE(AVG(sentiment_score), 0) AS avg FROM public_opinions').avg,
      topKeywords: all('SELECT keyword, COUNT(*) as count FROM public_opinions GROUP BY keyword ORDER BY count DESC LIMIT 10'),
      topChannels: all('SELECT channel, COUNT(*) as count FROM public_opinions GROUP BY channel ORDER BY count DESC LIMIT 5'),
    };
    return json(res, 200, { ok: true, data, stats }, origin);
  }
  if (req.method === 'GET' && route === '/api/public/opinions/trend') {
    const days = Number(url.searchParams.get('days') || 7);
    const trend = all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN sentiment = '正面' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentiment = '中性' THEN 1 ELSE 0 END) as neutral,
        SUM(CASE WHEN sentiment = '负面' THEN 1 ELSE 0 END) as negative
      FROM public_opinions 
      WHERE created_at >= DATE('now', ?)
      GROUP BY DATE(created_at) 
      ORDER BY date DESC
    `, [`-${days} days`]);
    return json(res, 200, { ok: true, data: trend }, origin);
  }
  if (req.method === 'POST' && route === '/api/public/opinions') {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const sentiments = ['正面', '中性', '负面'];
    const sentiment = body.sentiment || sentiments[Math.floor(Math.random() * 3)];
    const score = sentiment === '正面' ? 0.7 + Math.random() * 0.3 : sentiment === '负面' ? -0.7 - Math.random() * 0.3 : -0.2 + Math.random() * 0.4;
    const result = db.prepare(`
      INSERT INTO public_opinions (keyword, source, channel, content, sentiment, sentiment_score, author, url, views, likes, comments, shares, spread_path, attributed_source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(body.keyword || '广州广电'),
      String(body.source || '社交媒体'),
      String(body.channel || '微博'),
      String(body.content || ''),
      sentiment,
      Number(score.toFixed(2)),
      body.author || null,
      body.url || null,
      Number(body.views || Math.floor(Math.random() * 10000)),
      Number(body.likes || Math.floor(Math.random() * 1000)),
      Number(body.comments || Math.floor(Math.random() * 500)),
      Number(body.shares || Math.floor(Math.random() * 200)),
      body.spread_path || '原生→转发→评论→二次转发',
      body.attributed_source || '广州广电新媒体中心',
      now
    );
    return json(res, 200, { ok: true, data: get('SELECT * FROM public_opinions WHERE id = ?', [result.lastInsertRowid]) }, origin);
  }

  if (req.method === 'GET' && route === '/api/emergency/commands') {
    const limit = boundedLimit(url.searchParams);
    const level = String(url.searchParams.get('level') || '').trim();
    let sql = 'SELECT * FROM emergency_commands WHERE 1=1';
    const params = [];
    if (level) {
      sql += ' AND level = ?';
      params.push(level);
    }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);
    return json(res, 200, { ok: true, data: all(sql, params), total: get('SELECT COUNT(*) AS count FROM emergency_commands').count }, origin);
  }
  if (req.method === 'POST' && route === '/api/emergency/commands') {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const deadline = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const result = db.prepare(`
      INSERT INTO emergency_commands (title, level, category, content, sender, receiver, status, deadline, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(body.title || '应急指令'),
      String(body.level || '一级'),
      String(body.category || '突发事件'),
      String(body.content || ''),
      String(body.sender || '应急指挥中心'),
      String(body.receiver || '全台各部门'),
      '待响应',
      body.deadline || deadline,
      now
    );
    db.prepare('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)').run(body.sender || '指挥中心', `发布应急指令 #${result.lastInsertRowid}`, now);
    return json(res, 200, { ok: true, data: get('SELECT * FROM emergency_commands WHERE id = ?', [result.lastInsertRowid]) }, origin);
  }
  if (req.method === 'POST' && route.startsWith('/api/emergency/commands/') && route.endsWith('/respond')) {
    const id = Number(route.split('/')[4]);
    const body = await readBody(req);
    const now = new Date().toISOString();
    db.prepare('UPDATE emergency_commands SET status = ?, response = ?, response_time = ? WHERE id = ?').run(
      '已响应', String(body.response || '已收到，立即处理'), now, id
    );
    db.prepare('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)').run(body.responder || '部门负责人', `响应应急指令 #${id}`, now);
    return json(res, 200, { ok: true, data: get('SELECT * FROM emergency_commands WHERE id = ?', [id]) }, origin);
  }

  if (req.method === 'GET' && route === '/api/hotline/records') {
    const limit = boundedLimit(url.searchParams);
    return json(res, 200, { ok: true, data: all('SELECT * FROM hotline_records ORDER BY id DESC LIMIT ?', [limit]), total: get('SELECT COUNT(*) AS count FROM hotline_records').count }, origin);
  }
  if (req.method === 'POST' && route === '/api/hotline/records') {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO hotline_records (caller_name, caller_phone, category, content, handler, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(body.caller_name || '市民'),
      String(body.caller_phone || '13800138000'),
      String(body.category || '咨询'),
      String(body.content || ''),
      body.handler || null,
      '待处理', now
    );
    db.prepare('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)').run(body.caller_name || '市民', `拨打12345热线 #${result.lastInsertRowid}`, now);
    return json(res, 200, { ok: true, data: get('SELECT * FROM hotline_records WHERE id = ?', [result.lastInsertRowid]) }, origin);
  }

  if (req.method === 'GET' && route === '/api/service/access') {
    const limit = boundedLimit(url.searchParams);
    return json(res, 200, { ok: true, data: all('SELECT * FROM service_access ORDER BY id DESC LIMIT ?', [limit]), total: get('SELECT COUNT(*) AS count FROM service_access').count }, origin);
  }
  if (req.method === 'POST' && route === '/api/service/access') {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO service_access (service_name, provider, applicant, contact, requirements, api_config, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(body.service_name || '城市服务接入'),
      String(body.provider || '服务提供商'),
      String(body.applicant || '申请人'),
      String(body.contact || '13800138000'),
      body.requirements || null,
      body.api_config || null,
      '待接入', now
    );
    db.prepare('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)').run(body.applicant || '申请人', `提交服务接入申请 #${result.lastInsertRowid}`, now);
    return json(res, 200, { ok: true, data: get('SELECT * FROM service_access WHERE id = ?', [result.lastInsertRowid]) }, origin);
  }

  if (req.method === 'GET' && route === '/api/editorial/workflows') {
    const limit = boundedLimit(url.searchParams);
    return json(res, 200, { ok: true, data: all('SELECT * FROM editorial_workflows ORDER BY id DESC LIMIT ?', [limit]), total: get('SELECT COUNT(*) AS count FROM editorial_workflows').count }, origin);
  }

  return json(res, 404, { ok: false, error: `Unknown endpoint: ${route}` }, origin);
}

initDb();
const server = http.createServer((req, res) => handle(req, res).catch((error) => json(res, 500, { ok: false, error: error.message }, req.headers.origin)));
server.listen(backendPort, host, () => {
  console.log(`${projectName} backend listening on http://${host}:${backendPort}`);
  console.log(`SQLite database: ${dbPath}`);
});
