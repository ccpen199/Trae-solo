const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const projectDir = process.env.PROJECT_DIR || path.resolve(__dirname, '..');
const projectName = process.env.PROJECT_NAME || 'may-89091';
const host = process.env.HOST || '127.0.0.1';
const backendPort = Number(process.env.BACKEND_PORT || 59091);
const frontendPort = Number(process.env.FRONTEND_PORT || backendPort - 10000);
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

    CREATE TABLE IF NOT EXISTS designers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      commission_rate REAL NOT NULL DEFAULT 0.3,
      total_earnings INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      designer_id INTEGER,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      thumbnail TEXT NOT NULL,
      preview_url TEXT,
      price INTEGER NOT NULL DEFAULT 99,
      description TEXT,
      content_json TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      review_note TEXT,
      reviewed_at TEXT,
      reviewed_by INTEGER,
      use_count INTEGER NOT NULL DEFAULT 0,
      conversion_rate REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (designer_id) REFERENCES designers(id)
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      template_id INTEGER,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      content_json TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      send_count INTEGER NOT NULL DEFAULT 0,
      open_count INTEGER NOT NULL DEFAULT 0,
      share_code TEXT UNIQUE,
      created_at TEXT NOT NULL,
      sent_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );

    CREATE TABLE IF NOT EXISTS recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invitation_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      opened_at TEXT,
      open_ip TEXT,
      latitude REAL,
      longitude REAL,
      device_info TEXT,
      reminded_count INTEGER NOT NULL DEFAULT 0,
      last_reminded_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blessings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invitation_id INTEGER NOT NULL,
      recipient_id INTEGER,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      avatar TEXT,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TEXT NOT NULL,
      FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES recipients(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      template_id INTEGER,
      invitation_id INTEGER,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'paid',
      payment_method TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );

    CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      designer_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      template_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      rate REAL NOT NULL DEFAULT 0.3,
      status TEXT NOT NULL DEFAULT 'pending',
      settled_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (designer_id) REFERENCES designers(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS template_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      reviewer_id INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      note TEXT,
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );

    CREATE TABLE IF NOT EXISTS export_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      reference_id INTEGER,
      file_path TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount === 0) {
    db.prepare('INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)').run('演示用户', '13800138000', 'user', now);
    db.prepare('INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)').run('后台管理员', '13900139000', 'admin', now);
    db.prepare('INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)').run('张设计师', '13700137000', 'designer', now);
  }

  const designerCount = db.prepare('SELECT COUNT(*) AS count FROM designers').get().count;
  if (designerCount === 0) {
    db.prepare('INSERT INTO designers (user_id, name, bio, commission_rate, total_earnings, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(3, '张设计师', '专业请柬设计师，5年经验，擅长中国风、现代简约风格', 0.3, 0, 'active', now);
  }

  const templateCount = db.prepare('SELECT COUNT(*) AS count FROM templates').get().count;
  if (templateCount === 0) {
    const insertTemplate = db.prepare(`
      INSERT INTO templates (designer_id, title, category, thumbnail, price, description, content_json, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const defaultContent = JSON.stringify({
      background: '#fff8f0',
      titleColor: '#c41e3a',
      elements: [
        { type: 'text', content: '{{title}}', x: 50, y: 80, fontSize: 32, fontWeight: 'bold' },
        { type: 'text', content: '诚挚邀请您参加', x: 50, y: 130, fontSize: 16 },
        { type: 'text', content: '{{event_date}} {{event_time}}', x: 50, y: 200, fontSize: 20 },
        { type: 'text', content: '{{location}}', x: 50, y: 240, fontSize: 16 },
        { type: 'image', src: '', x: 50, y: 300, width: 300, height: 200 }
      ]
    });

    const templates = [
      [1, '喜结良缘·中式婚礼', '婚礼', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop', 199, '传统中国红婚礼请柬，龙凤呈祥图案，适合中式婚礼', defaultContent, 'approved', now],
      [1, '浪漫婚约·西式婚礼', '婚礼', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop', 199, '简约西式风格，白金色调，优雅浪漫', defaultContent, 'approved', now],
      [1, '寿比南山·寿宴', '寿宴', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop', 129, '传统寿宴请柬，寿桃、仙鹤图案，寓意吉祥', defaultContent, 'approved', now],
      [1, '福星高照·满月酒', '满月', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop', 99, '可爱温馨风格，适合宝宝满月、百天宴请', defaultContent, 'approved', now],
      [1, '乔迁之喜·新居', '乔迁', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop', 99, '简约现代风格，适合新居落成、乔迁宴请', defaultContent, 'approved', now],
      [1, '金榜题名·升学宴', '升学', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop', 99, '青春活力风格，适合升学、毕业宴请', defaultContent, 'pending', now],
    ];
    templates.forEach(t => insertTemplate.run(...t));
  }

  const logCount = db.prepare('SELECT COUNT(*) AS count FROM audit_logs').get().count;
  if (logCount === 0) {
    db.prepare('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)').run('system', '初始化本地 SQLite 数据', now);
    db.prepare('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)').run('admin', '启用后台管理看板', now);
  }
}

function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}

function write(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return { lastInsertRowid: result.lastInsertRowid, changes: result.changes };
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
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
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

function getUserId(req) {
  const auth = req.headers.authorization || '';
  const match = auth.match(/Bearer local-token-(\d+)/);
  return match ? Number(match[1]) : 1;
}

async function handle(req, res) {
  const origin = req.headers.origin;
  if (req.method === 'OPTIONS') return json(res, 204, {}, origin);
  const url = new URL(req.url || '/', `http://${host}:${backendPort}`);
  const route = url.pathname.replace(/\/$/, '') || '/';
  const now = new Date().toISOString();
  const userId = getUserId(req);

  if (req.method === 'GET' && route === '/api/health') {
    return json(res, 200, { ok: true, status: 'ok', project: projectName, db: dbPath, time: Date.now() }, origin);
  }

  if (req.method === 'GET' && ['/api/templates', '/api/template-categories'].includes(route)) {
    if (route === '/api/template-categories') {
      const categories = ['婚礼', '寿宴', '满月', '乔迁', '升学'];
      return json(res, 200, categories, origin);
    }
    const search = String(url.searchParams.get('search') || '').trim();
    const category = String(url.searchParams.get('category') || '').trim();
    const status = String(url.searchParams.get('status') || 'approved').trim();
    let sql = `SELECT t.*, d.name AS designer_name,
      (SELECT COUNT(*) FROM invitations i WHERE i.template_id = t.id) AS use_count,
      (SELECT COUNT(*) FROM invitations i WHERE i.template_id = t.id AND i.status = 'sent') AS sent_count
      FROM templates t LEFT JOIN designers d ON t.designer_id = d.id WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ' AND t.category = ?';
      params.push(category);
    }
    if (status && status !== 'all') {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY use_count DESC, t.id DESC';
    const rows = all(sql, params).map(r => ({
      id: r.id,
      name: r.title,
      category: r.category,
      price: r.price,
      description: r.description,
      content: r.content_json,
      content_json: r.content_json,
      designer_id: r.designer_id,
      designer_name: r.designer_name,
      status: r.status,
      use_count: r.use_count,
      sent_count: r.sent_count,
      created_at: r.created_at
    }));
    return json(res, 200, rows, origin);
  }

  const templateMatch = route.match(/^\/api\/templates\/(\d+)$/);
  if (templateMatch) {
    const templateId = Number(templateMatch[1]);
    if (req.method === 'GET') {
      const r = get('SELECT t.*, d.name AS designer_name FROM templates t LEFT JOIN designers d ON t.designer_id = d.id WHERE t.id = ?', [templateId]);
      const template = r ? {
        id: r.id,
        name: r.title,
        category: r.category,
        price: r.price,
        description: r.description,
        content: r.content_json,
        content_json: r.content_json,
        designer_id: r.designer_id,
        designer_name: r.designer_name,
        status: r.status,
        created_at: r.created_at
      } : null;
      return json(res, 200, template, origin);
    }
    if (req.method === 'PUT') {
      const body = await readBody(req);
      write('UPDATE templates SET title=?, category=?, description=?, content_json=? WHERE id=?',
        [body.title || body.name, body.category, body.description, body.content_json || body.content, templateId]);
      return json(res, 200, { ok: true }, origin);
    }
  }

  if (req.method === 'GET' && route === '/api/invitations') {
    const rows = all(`SELECT i.*, t.title AS template_name,
      (SELECT COUNT(*) FROM recipients r WHERE r.invitation_id = i.id) AS recipient_count,
      (SELECT COUNT(*) FROM recipients r WHERE r.invitation_id = i.id AND r.status = 'opened') AS opened_count,
      (SELECT COUNT(*) FROM blessings b WHERE b.invitation_id = i.id) AS blessing_count
      FROM invitations i LEFT JOIN templates t ON i.template_id = t.id WHERE i.user_id = ? ORDER BY i.id DESC`, [userId]);
    return json(res, 200, rows, origin);
  }

  if (req.method === 'POST' && route === '/api/invitations') {
    const body = await readBody(req);
    const template = get('SELECT * FROM templates WHERE id = ?', [body.template_id || 1]);
    const shareCode = Math.random().toString(36).substring(2, 10);
    const result = write(`
      INSERT INTO invitations (user_id, template_id, title, category, event_date, event_time, location, latitude, longitude, content_json, status, share_code, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, body.template_id || 1, body.title || template?.title || '我的请柬', body.category || template?.category || '婚礼',
        body.event_date || '2026-08-08', body.event_time || '18:00', body.location || '请填写地址',
        body.latitude || null, body.longitude || null, body.content_json || body.content || template?.content_json || '{}',
        body.status || 'draft', shareCode, now]);

    if (template) {
      write('UPDATE templates SET use_count = use_count + 1 WHERE id = ?', [template.id]);
    }
    write('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)',
      [`user-${userId}`, `创建请柬 #${result.lastInsertRowid}`, now]);

    const created = get('SELECT * FROM invitations WHERE id = ?', [result.lastInsertRowid]);
    return json(res, 200, created, origin);
  }

  const invMatch = route.match(/^\/api\/invitations\/(\d+)$/);
  if (invMatch) {
    const invId = Number(invMatch[1]);
    if (req.method === 'GET') {
      const r = get('SELECT i.*, t.title AS template_name, t.thumbnail AS template_thumbnail, t.content_json AS template_content FROM invitations i LEFT JOIN templates t ON i.template_id = t.id WHERE i.id = ? AND i.user_id = ?', [invId, userId]);
      const invitation = r ? {
        id: r.id,
        title: r.title,
        category: r.category,
        event_date: r.event_date,
        event_time: r.event_time,
        location: r.location,
        latitude: r.latitude,
        longitude: r.longitude,
        content: r.content_json,
        content_json: r.content_json,
        status: r.status,
        template_id: r.template_id,
        template_name: r.template_name,
        send_count: r.send_count,
        created_at: r.created_at
      } : null;
      return json(res, 200, invitation, origin);
    }
    if (req.method === 'PUT') {
      const body = await readBody(req);
      write('UPDATE invitations SET title=?, category=?, event_date=?, event_time=?, location=?, latitude=?, longitude=?, content_json=?, status=? WHERE id=? AND user_id=?',
        [body.title, body.category, body.event_date, body.event_time, body.location, body.latitude, body.longitude, body.content_json || body.content, body.status, invId, userId]);
      return json(res, 200, { ok: true }, origin);
    }
    if (req.method === 'DELETE') {
      write('DELETE FROM blessings WHERE invitation_id = ?', [invId]);
      write('DELETE FROM recipients WHERE invitation_id = ?', [invId]);
      write('DELETE FROM invitations WHERE id = ? AND user_id = ?', [invId, userId]);
      write('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)',
        [`user-${userId}`, `删除请柬 #${invId}`, now]);
      return json(res, 200, { ok: true }, origin);
    }
  }

  const sendMatch = route.match(/^\/api\/invitations\/(\d+)\/send$/);
  if (sendMatch && req.method === 'POST') {
    const invId = Number(sendMatch[1]);

    const inv = get('SELECT * FROM invitations WHERE id = ? AND user_id = ?', [invId, userId]);
    if (!inv) return json(res, 404, { error: '请柬不存在' }, origin);

    let existingRecipients = all('SELECT * FROM recipients WHERE invitation_id = ?', [invId]);
    if (existingRecipients.length === 0) {
      const defaults = [
        ['王先生', '13800138001', 'guest1@example.com'],
        ['李女士', '13800138002', 'guest2@example.com'],
      ];
      defaults.forEach((item) => {
        write('INSERT INTO recipients (invitation_id, name, phone, email, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [invId, item[0], item[1], item[2], 'pending', now]);
      });
      existingRecipients = all('SELECT * FROM recipients WHERE invitation_id = ?', [invId]);
    }

    const template = get('SELECT * FROM templates WHERE id = ?', [inv.template_id]);
    const orderResult = write('INSERT INTO orders (user_id, template_id, invitation_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, inv.template_id, invId, template?.price || 99, 'paid', now]);

    if (template && template.designer_id) {
      const designer = get('SELECT * FROM designers WHERE id = ?', [template.designer_id]);
      if (designer) {
        const commissionAmount = Math.round((template?.price || 99) * designer.commission_rate);
        write('INSERT INTO commissions (designer_id, order_id, template_id, amount, rate, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [template.designer_id, orderResult.lastInsertRowid, template.id, commissionAmount, designer.commission_rate, 'pending', now]);
        write('UPDATE designers SET total_earnings = total_earnings + ? WHERE id = ?', [commissionAmount, template.designer_id]);
      }
    }

    write('UPDATE recipients SET status = ? WHERE invitation_id = ? AND status = ?', ['sent', invId, 'pending']);
    write('UPDATE invitations SET status = ?, send_count = (SELECT COUNT(*) FROM recipients WHERE invitation_id = ?), sent_at = ? WHERE id = ?', ['sent', invId, now, invId]);
    write('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)',
      [`user-${userId}`, `发送请柬 #${invId} 给 ${existingRecipients.length} 位收件人`, now]);

    return json(res, 200, { order_id: orderResult.lastInsertRowid, recipient_count: existingRecipients.length }, origin);
  }

  const recipientsMatch = route.match(/^\/api\/invitations\/(\d+)\/recipients$/);
  if (recipientsMatch) {
    const invId = Number(recipientsMatch[1]);
    if (req.method === 'GET') {
      const data = all('SELECT * FROM recipients WHERE invitation_id = ? ORDER BY id DESC', [invId]);
      return json(res, 200, data, origin);
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const result = write('INSERT INTO recipients (invitation_id, name, phone, email, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [invId, body.name, body.phone || '', body.email || '', 'pending', now]);
      write('UPDATE invitations SET send_count = (SELECT COUNT(*) FROM recipients WHERE invitation_id = ?) WHERE id = ?', [invId, invId]);
      return json(res, 200, { id: result.lastInsertRowid, name: body.name, phone: body.phone, email: body.email, status: 'pending' }, origin);
    }
  }

  const openMatch = route.match(/^\/api\/invitations\/(\d+)\/open$/);
  if (openMatch && req.method === 'POST') {
    const invId = Number(openMatch[1]);
    const body = await readBody(req);
    const recipient = get('SELECT * FROM recipients WHERE id = ? AND invitation_id = ?', [body.recipient_id, invId]);
    if (recipient && !recipient.opened_at) {
      write('UPDATE recipients SET status = ?, opened_at = ?, open_ip = ?, latitude = ?, longitude = ?, device_info = ? WHERE id = ?',
        ['opened', now, body.ip || '', body.latitude || null, body.longitude || null, body.device || '', body.recipient_id]);
      write('UPDATE invitations SET open_count = open_count + 1 WHERE id = ?', [invId]);
    }
    return json(res, 200, { ok: true }, origin);
  }

  const remindMatch = route.match(/^\/api\/invitations\/(\d+)\/remind$/);
  if (remindMatch && req.method === 'POST') {
    const invId = Number(remindMatch[1]);
    const body = await readBody(req);
    const unread = all('SELECT * FROM recipients WHERE invitation_id = ? AND status != ?', [invId, 'opened']);
    unread.forEach(r => {
      write('UPDATE recipients SET reminded_count = reminded_count + 1, last_reminded_at = ? WHERE id = ?', [now, r.id]);
    });
    write('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)',
      [`user-${userId}`, `提醒请柬 #${invId} ${unread.length} 位未读收件人`, now]);
    return json(res, 200, { reminded_count: unread.length }, origin);
  }

  const heatmapMatch = route.match(/^\/api\/invitations\/(\d+)\/heatmap$/);
  if (heatmapMatch && req.method === 'GET') {
    const invId = Number(heatmapMatch[1]);
    const data = all('SELECT latitude, longitude, COUNT(*) AS count FROM recipients WHERE invitation_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL GROUP BY latitude, longitude', [invId]);
    return json(res, 200, data, origin);
  }

  const statsMatch = route.match(/^\/api\/invitations\/(\d+)\/stats$/);
  if (statsMatch && req.method === 'GET') {
    const invId = Number(statsMatch[1]);
    const total = get('SELECT COUNT(*) AS count FROM recipients WHERE invitation_id = ?', [invId]).count;
    const opened = get('SELECT COUNT(*) AS count FROM recipients WHERE invitation_id = ? AND status = ?', [invId, 'opened']).count;
    const pending = get('SELECT COUNT(*) AS count FROM recipients WHERE invitation_id = ? AND status != ?', [invId, 'opened']).count;
    const blessings = get('SELECT COUNT(*) AS count FROM blessings WHERE invitation_id = ?', [invId]).count;
    const openRate = total > 0 ? Math.round((opened / total) * 100) : 0;
    return json(res, 200, {
      sent: total,
      opened,
      pending,
      blessings,
      open_rate: openRate
    }, origin);
  }

  const blessingMatch = route.match(/^\/api\/invitations\/(\d+)\/blessings$/);
  if (blessingMatch) {
    const invId = Number(blessingMatch[1]);
    if (req.method === 'GET') {
      const data = all('SELECT * FROM blessings WHERE invitation_id = ? AND status = ? ORDER BY id DESC', [invId, 'approved']).map(b => ({
        id: b.id,
        guest_name: b.name,
        content: b.content,
        reply: b.reply || '',
        status: b.status,
        created_at: b.created_at
      }));
      return json(res, 200, data, origin);
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const result = write('INSERT INTO blessings (invitation_id, recipient_id, name, content, avatar, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [invId, body.recipient_id || null, body.name || '匿名宾客', body.content, body.avatar || '', 'pending', now]);
      return json(res, 200, { id: result.lastInsertRowid, guest_name: body.name || '匿名宾客', content: body.content, status: 'pending' }, origin);
    }
  }

  if (req.method === 'GET' && route === '/api/designers') {
    const data = all('SELECT * FROM designers ORDER BY id DESC');
    return json(res, 200, data, origin);
  }

  if (req.method === 'GET' && route === '/api/commissions') {
    const data = all('SELECT c.*, d.name AS designer_name, t.title AS template_name FROM commissions c LEFT JOIN designers d ON c.designer_id = d.id LEFT JOIN templates t ON c.template_id = t.id ORDER BY c.id DESC');
    return json(res, 200, data, origin);
  }

  const settleMatch = route.match(/^\/api\/commissions\/(\d+)\/settle$/);
  if (settleMatch && req.method === 'POST') {
    const commissionId = Number(settleMatch[1]);
    write('UPDATE commissions SET status = ?, settled_at = ? WHERE id = ?', ['settled', now, commissionId]);
    write('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)',
      ['admin', `结算设计师分成 #${commissionId}`, now]);
    return json(res, 200, { ok: true }, origin);
  }

  if (req.method === 'GET' && route === '/api/template-reviews') {
    const data = all('SELECT tr.*, t.title AS template_title, t.category AS template_category FROM template_reviews tr LEFT JOIN templates t ON tr.template_id = t.id ORDER BY tr.id DESC');
    return json(res, 200, data, origin);
  }

  const reviewMatch = route.match(/^\/api\/templates\/(\d+)\/review$/);
  if (reviewMatch && req.method === 'POST') {
    const templateId = Number(reviewMatch[1]);
    const body = await readBody(req);
    write('UPDATE templates SET status = ?, review_note = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?',
      [body.status, body.note, now, userId, templateId]);
    write('INSERT INTO template_reviews (template_id, reviewer_id, status, note, created_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?)',
      [templateId, userId, body.status, body.note, now, now]);
    write('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)',
      ['admin', `审核模板 #${templateId} 结果: ${body.status}`, now]);
    return json(res, 200, { ok: true }, origin);
  }

  if (req.method === 'GET' && ['/api/export/records', '/api/export-records'].includes(route)) {
    const data = all('SELECT * FROM export_records WHERE user_id = ? ORDER BY id DESC', [userId]).map(r => ({
      id: r.id,
      type: r.type,
      record_count: 0,
      created_at: r.created_at
    }));
    return json(res, 200, data, origin);
  }

  if (req.method === 'POST' && route === '/api/export') {
    const body = await readBody(req);
    const type = body.type || 'blessings';
    const refId = body.invitation_id;
    let content = '';
    let recordCount = 0;
    if (type === 'blessings') {
      const data = all('SELECT name, content, created_at FROM blessings WHERE invitation_id = ? ORDER BY id DESC', [refId]);
      content = '姓名\t祝福内容\t时间\n' + data.map(b => `${b.name}\t${b.content}\t${b.created_at}`).join('\n');
      recordCount = data.length;
    } else if (type === 'recipients') {
      const data = all('SELECT name, phone, email, status, opened_at FROM recipients WHERE invitation_id = ? ORDER BY id DESC', [refId]);
      content = '姓名\t手机\t邮箱\t状态\t打开时间\n' + data.map(r => `${r.name}\t${r.phone}\t${r.email}\t${r.status}\t${r.opened_at || ''}`).join('\n');
      recordCount = data.length;
    }
    const fileName = `export_${type}_${refId}_${Date.now()}.csv`;
    const filePath = path.join(projectDir, 'data', fileName);
    fs.writeFileSync(filePath, '\ufeff' + content, 'utf8');
    const result = write('INSERT INTO export_records (user_id, type, reference_id, file_path, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, refId, filePath, 'completed', now]);
    write('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)',
      [`user-${userId}`, `导出 ${type} 记录 #${refId} (${recordCount}条)`, now]);
    return json(res, 200, { id: result.lastInsertRowid, file_path: filePath, file_name: fileName, record_count: recordCount }, origin);
  }

  if (req.method === 'GET' && ['/api/profile', '/api/auth/me', '/api/users/profile', '/api/user/profile'].includes(route)) {
    const user = get('SELECT * FROM users WHERE id = ?', [userId]);
    const invCount = get('SELECT COUNT(*) AS count FROM invitations WHERE user_id = ?', [userId]).count;
    const orderCount = get('SELECT COUNT(*) AS count FROM orders WHERE user_id = ?', [userId]).count;
    const totalSpent = get('SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE user_id = ?', [userId]).total;
    const blessingCount = get('SELECT COUNT(*) AS count FROM blessings b JOIN invitations i ON b.invitation_id = i.id WHERE i.user_id = ?', [userId]).count;
    if (route !== '/api/profile') return json(res, 200, { user, data: user }, origin);
    return json(res, 200, {
      ok: true,
      data: {
        user,
        stats: {
          invitations: invCount,
          orders: orderCount,
          total_spent: totalSpent,
          blessings: blessingCount
        }
      }
    }, origin);
  }

  if (req.method === 'GET' && ['/api/admin/summary', '/api/admin/dashboard', '/api/admin/stats'].includes(route)) {
    const userCount = get('SELECT COUNT(*) AS count FROM users').count;
    const templateCount = get('SELECT COUNT(*) AS count FROM templates').count;
    const pendingTemplates = get('SELECT COUNT(*) AS count FROM templates WHERE status = ?', ['pending']).count;
    const invCount = get('SELECT COUNT(*) AS count FROM invitations').count;
    const orderCount = get('SELECT COUNT(*) AS count FROM orders').count;
    const totalRevenue = get('SELECT COALESCE(SUM(amount), 0) AS total FROM orders').total;
    const pendingCommission = get('SELECT COALESCE(SUM(amount), 0) AS total FROM commissions WHERE status = ?', ['pending']).total;
    const blessingCount = get('SELECT COUNT(*) AS count FROM blessings').count;
    const recipientCount = get('SELECT COUNT(*) AS count FROM recipients').count;

    return json(res, 200, {
      total_users: userCount,
      total_templates: templateCount,
      total_invitations: invCount,
      total_revenue: totalRevenue,
      pending_templates: pendingTemplates,
      pending_blessings: get('SELECT COUNT(*) AS count FROM blessings WHERE status = ?', ['pending']).count,
      pending_commissions: pendingCommission,
      total_recipients: recipientCount,
      total_blessings: blessingCount
    }, origin);
  }

  if (req.method === 'GET' && ['/api/search', '/api/products', '/api/teachers', '/api/courses', '/api/bookings', '/api/cart'].includes(route)) {
    const search = String(url.searchParams.get('q') || url.searchParams.get('search') || '').trim();
    const templates = all(`
      SELECT id, title AS name, title, category, price, description, status
      FROM templates
      WHERE (? = '' OR title LIKE ? OR description LIKE ? OR category LIKE ?)
      ORDER BY id DESC
      LIMIT 20
    `, [search, `%${search}%`, `%${search}%`, `%${search}%`]);
    return json(res, 200, {
      ok: true,
      keyword: search,
      data: route === '/api/cart'
        ? { items: all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 5', [userId]) }
        : templates,
    }, origin);
  }

  if (req.method === 'GET' && route === '/api/admin/blessings') {
    const status = String(url.searchParams.get('status') || 'pending');
    const data = all('SELECT b.*, i.title AS invitation_title FROM blessings b LEFT JOIN invitations i ON b.invitation_id = i.id WHERE b.status = ? ORDER BY b.id DESC LIMIT 50', [status]);
    return json(res, 200, data, origin);
  }

  if (req.method === 'GET' && route === '/api/admin/logs') {
    const data = all('SELECT al.*, u.name AS user_name FROM audit_logs al LEFT JOIN users u ON al.actor = \'user-\' || u.id ORDER BY al.id DESC LIMIT 20');
    return json(res, 200, data, origin);
  }

  const blessingReviewMatch = route.match(/^\/api\/blessings\/(\d+)\/review$/);
  if (blessingReviewMatch && req.method === 'POST') {
    const blessingId = Number(blessingReviewMatch[1]);
    const body = await readBody(req);
    write('UPDATE blessings SET status = ? WHERE id = ?', [body.status, blessingId]);
    write('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)',
      ['admin', `审核祝福 #${blessingId} 结果: ${body.status}`, now]);
    return json(res, 200, { ok: true }, origin);
  }

  if (req.method === 'POST' && ['/api/auth/login', '/api/auth/register', '/api/login', '/api/register'].includes(route)) {
    const body = await readBody(req);
    const phone = String(body.phone || '13800138000');
    let user = get('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) {
      const result = write('INSERT INTO users (name, phone, role, created_at) VALUES (?, ?, ?, ?)',
        [String(body.name || '注册用户'), phone, 'user', now]);
      user = get('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
    }
    write('INSERT INTO audit_logs (actor, action, created_at) VALUES (?, ?, ?)',
      [`user-${user.id}`, '登录系统', now]);
    return json(res, 200, { token: `local-token-${user.id}`, user }, origin);
  }

  if (req.method === 'GET' && route === '/api/orders') {
    const data = all('SELECT o.*, t.title AS template_name FROM orders o LEFT JOIN templates t ON o.template_id = t.id WHERE o.user_id = ? ORDER BY o.id DESC', [userId]);
    return json(res, 200, data, origin);
  }

  return json(res, 404, { ok: false, error: `Unknown endpoint: ${route}` }, origin);
}

initDb();
const server = http.createServer((req, res) => handle(req, res).catch((error) => {
  console.error(error);
  json(res, 500, { ok: false, error: error.message }, req.headers.origin);
}));
server.listen(backendPort, host, () => {
  console.log(`${projectName} backend listening on http://${host}:${backendPort}`);
  console.log(`SQLite database: ${dbPath}`);
});
