import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..', '..')

function loadEnv() {
  const envPaths = [
    resolve(projectRoot, '.env'),
    resolve(__dirname, '..', '.env')
  ]
  for (const envPath of envPaths) {
    if (!existsSync(envPath)) continue
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
      if (key && process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  }
}

loadEnv()

const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59149)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:49149'
const DB_PATH = resolve(projectRoot, process.env.SQLITE_PATH || './data/app.sqlite')

mkdirSync(dirname(DB_PATH), { recursive: true })
const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lawyers (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    firm TEXT,
    license_number TEXT,
    license_verified INTEGER DEFAULT 0,
    practice_years INTEGER DEFAULT 0,
    expertise TEXT DEFAULT '[]',
    regions TEXT DEFAULT '[]',
    continuing_education_credits INTEGER DEFAULT 0,
    credit_score INTEGER DEFAULT 80,
    avg_rating REAL DEFAULT 5.0,
    avg_response_time INTEGER DEFAULT 15,
    response_rate INTEGER DEFAULT 95,
    status TEXT DEFAULT 'active',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    lawyer_id TEXT,
    case_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    region TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    dispatch_mode TEXT NOT NULL DEFAULT 'auto',
    dispatched_at INTEGER,
    accepted_at INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
  );

  CREATE TABLE IF NOT EXISTS evidences (
    id TEXT PRIMARY KEY,
    consultation_id TEXT NOT NULL,
    uploader_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    url TEXT NOT NULL,
    watermarked INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    consultation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text',
    is_encrypted INTEGER DEFAULT 1,
    is_burn_after_read INTEGER DEFAULT 0,
    burn_after_read_seconds INTEGER,
    read_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    consultation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    lawyer_id TEXT NOT NULL,
    professional_rating INTEGER NOT NULL,
    attitude_rating INTEGER NOT NULL,
    timeliness_rating INTEGER NOT NULL,
    comment TEXT,
    anonymous INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
  );

  CREATE TABLE IF NOT EXISTS appeals (
    id TEXT PRIMARY KEY,
    consultation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    lawyer_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    processed_at INTEGER,
    processed_by TEXT,
    result TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_records (
    id TEXT PRIMARY KEY,
    operator TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    result TEXT,
    remark TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

function now() {
  return Date.now()
}

function sendJson(res, code, data = null, message = 'success') {
  res.status(code).json({
    code: code === 200 ? 0 : code,
    message,
    data,
    timestamp: now()
  })
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

const usersSeed = [
  { id: 'user-001', phone: '13800138000', name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1', role: 'user' },
]

const lawyersSeed = [
  { id: 'lawyer-001', phone: '13900139000', name: '李明', firm: '北京正义律师事务所', license_number: '1101012015001234', license_verified: 1, practice_years: 9, expertise: '["marriage","labor","debt"]', regions: '["北京","上海","广州"]', continuing_education_credits: 45, credit_score: 95, avg_rating: 4.8, avg_response_time: 12, response_rate: 98, status: 'active' },
  { id: 'lawyer-002', phone: '13900139001', name: '王芳', firm: '上海公正律师事务所', license_number: '3101012016002345', license_verified: 1, practice_years: 8, expertise: '["labor","contract","traffic"]', regions: '["上海","杭州","苏州"]', continuing_education_credits: 38, credit_score: 88, avg_rating: 4.6, avg_response_time: 18, response_rate: 92, status: 'active' },
  { id: 'lawyer-003', phone: '13900139002', name: '张伟', firm: '广州诚信律师事务所', license_number: '4401012014003456', license_verified: 1, practice_years: 11, expertise: '["debt","property","contract"]', regions: '["广州","深圳","佛山"]', continuing_education_credits: 42, credit_score: 90, avg_rating: 4.7, avg_response_time: 15, response_rate: 95, status: 'active' },
  { id: 'lawyer-004', phone: '13900139003', name: '赵志远', firm: '深圳明德律师事务所', license_number: '4403012013004567', license_verified: 1, practice_years: 12, expertise: '["criminal","property"]', regions: '["深圳","东莞","惠州"]', continuing_education_credits: 30, credit_score: 65, avg_rating: 4.2, avg_response_time: 35, response_rate: 52, status: 'frozen' },
]

const consultationsSeed = [
  { id: 'consult-001', user_id: 'user-001', lawyer_id: 'lawyer-001', case_type: 'marriage', title: '离婚财产分割咨询', description: '结婚5年，有一套房产和一个孩子，想咨询离婚时财产如何分割，孩子抚养权如何判定。', region: '北京朝阳', status: 'in_progress', dispatch_mode: 'auto', dispatched_at: now() - 3600000, accepted_at: now() - 3500000, created_at: now() - 7200000 },
  { id: 'consult-002', user_id: 'user-001', lawyer_id: 'lawyer-002', case_type: 'labor', title: '公司裁员赔偿问题', description: '工作3年，公司要裁员，只给N+1赔偿，我想咨询是否合法，能不能争取2N赔偿。', region: '上海浦东', status: 'pending', dispatch_mode: 'grab', dispatched_at: now() - 1800000, created_at: now() - 3600000 },
  { id: 'consult-003', user_id: 'user-001', lawyer_id: 'lawyer-003', case_type: 'debt', title: '朋友借钱不还怎么办', description: '朋友借了我10万块，有借条，但已经逾期半年，催了好几次都不还，我想起诉。', region: '广州天河', status: 'completed', dispatch_mode: 'manual', dispatched_at: now() - 86400000, accepted_at: now() - 86000000, completed_at: now() - 3600000, created_at: now() - 172800000 },
]

const messagesSeed = [
  { id: 'msg-001', consultation_id: 'consult-001', sender_id: 'user-001', sender_role: 'user', content: '律师您好，我想咨询离婚财产分割的问题。', content_type: 'text', is_encrypted: 1, is_burn_after_read: 0, created_at: now() - 6000000 },
  { id: 'msg-002', consultation_id: 'consult-001', sender_id: 'lawyer-001', sender_role: 'lawyer', content: '您好，请详细说一下您的情况。', content_type: 'text', is_encrypted: 1, is_burn_after_read: 0, created_at: now() - 5900000 },
  { id: 'msg-003', consultation_id: 'consult-001', sender_id: 'user-001', sender_role: 'user', content: '这是我们的房产证照片。', content_type: 'image', is_encrypted: 1, is_burn_after_read: 1, burn_after_read_seconds: 60, created_at: now() - 5800000 },
  { id: 'msg-004', consultation_id: 'consult-001', sender_id: 'lawyer-001', sender_role: 'lawyer', content: '好的，您的情况我了解了。根据您提供的信息...', content_type: 'text', is_encrypted: 1, is_burn_after_read: 0, created_at: now() - 5700000 },
]

const seedStmt = {
  user: db.prepare('INSERT OR IGNORE INTO users (id, phone, name, avatar, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
  lawyer: db.prepare('INSERT OR IGNORE INTO lawyers (id, phone, name, firm, license_number, license_verified, practice_years, expertise, regions, continuing_education_credits, credit_score, avg_rating, avg_response_time, response_rate, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  consultation: db.prepare('INSERT OR IGNORE INTO consultations (id, user_id, lawyer_id, case_type, title, description, region, status, dispatch_mode, dispatched_at, accepted_at, completed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  message: db.prepare('INSERT OR IGNORE INTO messages (id, consultation_id, sender_id, sender_role, content, content_type, is_encrypted, is_burn_after_read, burn_after_read_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  meta: db.prepare('INSERT OR IGNORE INTO app_meta (key, value) VALUES (?, ?)'),
}

const tx = db.transaction(() => {
  usersSeed.forEach(u => seedStmt.user.run(u.id, u.phone, u.name, u.avatar, u.role, now()))
  lawyersSeed.forEach(l => seedStmt.lawyer.run(l.id, l.phone, l.name, l.firm, l.license_number, l.license_verified, l.practice_years, l.expertise, l.regions, l.continuing_education_credits, l.credit_score, l.avg_rating, l.avg_response_time, l.response_rate, l.status, now()))
  consultationsSeed.forEach(c => seedStmt.consultation.run(c.id, c.user_id, c.lawyer_id, c.case_type, c.title, c.description, c.region, c.status, c.dispatch_mode, c.dispatched_at, c.accepted_at, c.completed_at, c.created_at))
  messagesSeed.forEach(m => seedStmt.message.run(m.id, m.consultation_id, m.sender_id, m.sender_role, m.content, m.content_type, m.is_encrypted, m.is_burn_after_read, m.burn_after_read_seconds, m.created_at))
  seedStmt.meta.run('service', '法律公益咨询协同平台')
  seedStmt.meta.run('startedAt', new Date().toISOString())
  seedStmt.meta.run('version', '1.0.0')
})
tx()

const app = express()

app.use(cors({
  origin: [FRONTEND_URL, 'http://127.0.0.1:49149', 'http://localhost:49149', 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5174', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1 AS ok').get()
    sendJson(res, 200, {
      ok: true,
      service: 'may-89149-backend',
      app: '法律公益咨询协同平台',
      sqlite: 'ok',
      version: db.prepare('SELECT value FROM app_meta WHERE key = ?').get('version')?.value,
      startedAt: db.prepare('SELECT value FROM app_meta WHERE key = ?').get('startedAt')?.value,
      timestamp: new Date().toISOString()
    })
  } catch (e) {
    sendJson(res, 500, { ok: false, error: e.message }, 'service_unavailable')
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { role, phone, password } = await parseJsonBody(req)
    if (password !== '123456') {
      return sendJson(res, 401, null, '账号或密码错误')
    }

    if (role === 'admin') {
      if (phone !== 'admin') return sendJson(res, 401, null, '管理员账号错误')
      return sendJson(res, 200, {
        token: 'admin-token-' + uuidv4(),
        user: {
          id: 'admin-001',
          name: '系统管理员',
          role: 'admin',
          avatar: 'https://api.dicebear.com/7.x/shield/svg?seed=admin'
        }
      })
    }

    const table = role === 'lawyer' ? 'lawyers' : 'users'
    const user = db.prepare(`SELECT * FROM ${table} WHERE phone = ?`).get(phone)
    if (!user) return sendJson(res, 401, null, '账号不存在')

    const result = {
      token: `${role}-token-` + uuidv4(),
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        role,
      }
    }

    if (role === 'lawyer') {
      result.user.firm = user.firm
      result.user.licenseNumber = user.license_number
      result.user.licenseVerified = !!user.license_verified
      result.user.practiceYears = user.practice_years
      result.user.expertise = JSON.parse(user.expertise || '[]')
      result.user.regions = JSON.parse(user.regions || '[]')
      result.user.continuingEducationCredits = user.continuing_education_credits
      result.user.creditScore = user.credit_score
      result.user.avgRating = user.avg_rating
      result.user.avgResponseTime = user.avg_response_time
      result.user.responseRate = user.response_rate
      result.user.status = user.status
    }

    sendJson(res, 200, result)
  } catch (e) {
    sendJson(res, 500, null, e.message)
  }
})

app.get('/api/consultations', (req, res) => {
  const { userId, lawyerId, status } = req.query
  let sql = 'SELECT * FROM consultations WHERE 1=1'
  const params = []
  if (userId) { sql += ' AND user_id = ?'; params.push(userId) }
  if (lawyerId) { sql += ' AND lawyer_id = ?'; params.push(lawyerId) }
  if (status) { sql += ' AND status = ?'; params.push(status) }
  sql += ' ORDER BY created_at DESC'
  const list = db.prepare(sql).all(...params).map(c => ({
    ...c,
    evidences: db.prepare('SELECT * FROM evidences WHERE consultation_id = ?').all(c.id),
  }))
  sendJson(res, 200, { list, total: list.length })
})

app.get('/api/consultations/:id', (req, res) => {
  const consultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id)
  if (!consultation) return sendJson(res, 404, null, '咨询不存在')
  consultation.evidences = db.prepare('SELECT * FROM evidences WHERE consultation_id = ?').all(req.params.id)
  consultation.messages = db.prepare('SELECT * FROM messages WHERE consultation_id = ? ORDER BY created_at ASC').all(req.params.id)
  if (consultation.lawyer_id) {
    consultation.lawyer = db.prepare('SELECT id, name, firm, avatar, avg_rating, practice_years FROM lawyers WHERE id = ?').get(consultation.lawyer_id)
  }
  if (consultation.user_id) {
    consultation.user = db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(consultation.user_id)
  }
  const evaluation = db.prepare('SELECT * FROM evaluations WHERE consultation_id = ?').get(req.params.id)
  if (evaluation) consultation.evaluation = evaluation
  const appeal = db.prepare('SELECT * FROM appeals WHERE consultation_id = ?').get(req.params.id)
  if (appeal) consultation.appeal = appeal
  sendJson(res, 200, consultation)
})

app.post('/api/consultations', async (req, res) => {
  try {
    const body = await parseJsonBody(req)
    const id = 'consult-' + uuidv4().slice(0, 8)
    const createdAt = now()
    db.prepare(`INSERT INTO consultations (id, user_id, lawyer_id, case_type, title, description, region, status, dispatch_mode, dispatched_at, accepted_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id,
      body.userId,
      body.assignedLawyerId || null,
      body.caseType,
      body.title,
      body.description,
      body.region || '',
      body.assignedLawyerId ? 'dispatched' : 'pending',
      body.assignedLawyerId ? 'manual' : 'auto',
      body.assignedLawyerId ? createdAt : null,
      body.assignedLawyerId ? createdAt : null,
      createdAt
    )
    sendJson(res, 200, db.prepare('SELECT * FROM consultations WHERE id = ?').get(id))
  } catch (e) {
    sendJson(res, 500, null, e.message)
  }
})

app.patch('/api/consultations/:id/status', async (req, res) => {
  try {
    const { status } = await parseJsonBody(req)
    const consultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id)
    if (!consultation) return sendJson(res, 404, null, '咨询不存在')
    const updates = { status }
    if (status === 'completed') updates.completedAt = now()
    db.prepare(`UPDATE consultations SET status = ?, completed_at = COALESCE(?, completed_at) WHERE id = ?`).run(status, updates.completedAt || null, req.params.id)
    sendJson(res, 200, db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id))
  } catch (e) {
    sendJson(res, 500, null, e.message)
  }
})

app.get('/api/grab-pool', (req, res) => {
  const { caseType, region } = req.query
  let sql = `SELECT c.*, u.name as user_name 
             FROM consultations c 
             LEFT JOIN users u ON c.user_id = u.id 
             WHERE c.status = 'pending' AND c.dispatch_mode = 'auto'`
  const params = []
  if (caseType && caseType !== 'all') { sql += ' AND c.case_type = ?'; params.push(caseType) }
  if (region && region !== 'all') { sql += ' AND c.region LIKE ?'; params.push('%' + region + '%') }
  sql += ' ORDER BY c.created_at DESC'
  const list = db.prepare(sql).all(...params).map(c => ({
    ...c,
    user: { id: c.user_id, name: c.user_name }
  }))
  sendJson(res, 200, { list, total: list.length })
})

app.post('/api/grab-pool/:id/grab', async (req, res) => {
  try {
    const { lawyerId } = await parseJsonBody(req)
    const consultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id)
    if (!consultation) return sendJson(res, 404, null, '咨询不存在')
    if (consultation.status !== 'pending') return sendJson(res, 400, null, '该咨询已被其他律师接单')
    const nowTime = now()
    db.prepare(`UPDATE consultations SET lawyer_id = ?, status = 'in_progress', dispatch_mode = 'grab', dispatched_at = ?, accepted_at = ? WHERE id = ?`).run(lawyerId, nowTime, nowTime, req.params.id)
    sendJson(res, 200, db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id))
  } catch (e) {
    sendJson(res, 500, null, e.message)
  }
})

app.post('/api/consultations/:id/close', async (req, res) => {
  try {
    const { summary } = await parseJsonBody(req)
    const nowTime = now()
    db.prepare(`UPDATE consultations SET status = 'completed', completed_at = ? WHERE id = ?`).run(nowTime, req.params.id)
    if (summary) {
      db.prepare(`INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`).run(`summary_${req.params.id}`, JSON.stringify(summary))
    }
    sendJson(res, 200, db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id))
  } catch (e) {
    sendJson(res, 500, null, e.message)
  }
})

app.get('/api/consultations/:id/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages WHERE consultation_id = ? ORDER BY created_at ASC').all(req.params.id)
  sendJson(res, 200, { list: messages, total: messages.length })
})

app.post('/api/consultations/:id/messages', async (req, res) => {
  try {
    const body = await parseJsonBody(req)
    const id = 'msg-' + uuidv4().slice(0, 12)
    db.prepare(`INSERT INTO messages (id, consultation_id, sender_id, sender_role, content, content_type, is_encrypted, is_burn_after_read, burn_after_read_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id,
      req.params.id,
      body.senderId,
      body.senderRole,
      body.content,
      body.contentType || 'text',
      body.isEncrypted ?? 1,
      body.isBurnAfterRead ?? 0,
      body.burnAfterReadSeconds,
      now()
    )
    sendJson(res, 200, db.prepare('SELECT * FROM messages WHERE id = ?').get(id))
  } catch (e) {
    sendJson(res, 500, null, e.message)
  }
})

app.patch('/api/messages/:id/read', async (req, res) => {
  db.prepare(`UPDATE messages SET read_at = ? WHERE id = ?`).run(now(), req.params.id)
  sendJson(res, 200, db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id))
})

app.get('/api/lawyers', (req, res) => {
  const { status, caseType, region } = req.query
  let sql = 'SELECT * FROM lawyers WHERE 1=1'
  const params = []
  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status) }
  sql += ' ORDER BY created_at DESC'
  let lawyers = db.prepare(sql).all(...params)
  if (caseType && caseType !== 'all') {
    lawyers = lawyers.filter(l => {
      const exp = JSON.parse(l.expertise || '[]')
      return exp.includes(caseType)
    })
  }
  if (region && region !== 'all') {
    lawyers = lawyers.filter(l => {
      const regs = JSON.parse(l.regions || '[]')
      return regs.some(r => r.includes(region))
    })
  }
  sendJson(res, 200, { list: lawyers, total: lawyers.length })
})

app.get('/api/lawyers/:id', (req, res) => {
  const lawyer = db.prepare('SELECT * FROM lawyers WHERE id = ?').get(req.params.id)
  if (!lawyer) return sendJson(res, 404, null, '律师不存在')
  lawyer.expertise = JSON.parse(lawyer.expertise || '[]')
  lawyer.regions = JSON.parse(lawyer.regions || '[]')
  sendJson(res, 200, lawyer)
})

app.patch('/api/lawyers/:id/status', async (req, res) => {
  try {
    const { status, operator } = await parseJsonBody(req)
    const lawyer = db.prepare('SELECT * FROM lawyers WHERE id = ?').get(req.params.id)
    if (!lawyer) return sendJson(res, 404, null, '律师不存在')
    db.prepare('UPDATE lawyers SET status = ? WHERE id = ?').run(status, req.params.id)
    const auditId = 'audit-' + uuidv4().slice(0, 8)
    db.prepare(`INSERT INTO audit_records (id, operator, target_type, target_id, action, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
      auditId, operator || 'admin', 'lawyer', req.params.id, status === 'frozen' ? 'freeze' : 'unfreeze', now()
    )
    sendJson(res, 200, db.prepare('SELECT * FROM lawyers WHERE id = ?').get(req.params.id))
  } catch (e) {
    sendJson(res, 500, null, e.message)
  }
})

app.get('/api/monitoring/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM consultations').get().count
  const pending = db.prepare("SELECT COUNT(*) as count FROM consultations WHERE status = 'pending'").get().count
  const inProgress = db.prepare("SELECT COUNT(*) as count FROM consultations WHERE status = 'in_progress'").get().count
  const completed = db.prepare("SELECT COUNT(*) as count FROM consultations WHERE status = 'completed'").get().count
  const activeLawyers = db.prepare("SELECT COUNT(*) as count FROM lawyers WHERE status = 'active'").get().count
  const frozenLawyers = db.prepare("SELECT COUNT(*) as count FROM lawyers WHERE status = 'frozen'").get().count
  const avgResponse = db.prepare('SELECT AVG(avg_response_time) as avg FROM lawyers').get().avg || 15
  const avgRating = db.prepare('SELECT AVG(avg_rating) as avg FROM lawyers').get().avg || 4.5
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    last7Days.push({
      date: dateStr,
      consultations: Math.floor(30 + Math.random() * 40),
      newUsers: Math.floor(5 + Math.random() * 15),
      activeLawyers: Math.floor(10 + Math.random() * 8),
    })
  }
  sendJson(res, 200, {
    totalConsultations: total,
    todayConsultations: 42,
    pendingCount: pending,
    inProgressCount: inProgress,
    completedCount: completed,
    activeLawyers,
    frozenLawyers,
    avgResponseTime: Math.round(avgResponse),
    avgRating: Number(avgRating.toFixed(1)),
    dailyStats: last7Days,
  })
})

app.get('/api/monitoring/lawyer-activities', (req, res) => {
  const lawyers = db.prepare('SELECT * FROM lawyers').all()
  const activities = lawyers.map(l => ({
    ...l,
    todayConsultations: Math.floor(2 + Math.random() * 4),
    avgResponseTime: l.avg_response_time || Math.floor(5 + Math.random() * 20),
    avgRating: l.avg_rating || Number((4.0 + Math.random()).toFixed(1)),
    saturation: Math.min(100, Math.floor(20 + Math.random() * 60)),
    lastActiveAt: now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
    responseRate: l.response_rate || Math.floor(50 + Math.random() * 50),
  }))
  sendJson(res, 200, { list: activities, total: activities.length })
})

app.post('/api/evaluations', async (req, res) => {
  try {
    const body = await parseJsonBody(req)
    const id = 'eval-' + uuidv4().slice(0, 8)
    db.prepare(`INSERT INTO evaluations (id, consultation_id, user_id, lawyer_id, professional_rating, attitude_rating, timeliness_rating, comment, anonymous, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id,
      body.consultationId,
      body.userId,
      body.lawyerId,
      body.professionalRating,
      body.attitudeRating,
      body.timelinessRating,
      body.comment || '',
      body.anonymous ? 1 : 0,
      now()
    )
    sendJson(res, 200, db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id))
  } catch (e) {
    sendJson(res, 500, null, e.message)
  }
})

app.get('/api/appeals', (req, res) => {
  const { status } = req.query
  let sql = `SELECT a.*, c.title as consultation_title, u.name as user_name, l.name as lawyer_name 
             FROM appeals a 
             LEFT JOIN consultations c ON a.consultation_id = c.id
             LEFT JOIN users u ON a.user_id = u.id
             LEFT JOIN lawyers l ON a.lawyer_id = l.id`
  const params = []
  if (status && status !== 'all') { sql += ' WHERE a.status = ?'; params.push(status) }
  sql += ' ORDER BY a.created_at DESC'
  const list = db.prepare(sql).all(...params)
  sendJson(res, 200, { list, total: list.length })
})

app.post('/api/appeals', async (req, res) => {
  try {
    const body = await parseJsonBody(req)
    const id = 'appeal-' + uuidv4().slice(0, 8)
    db.prepare(`INSERT INTO appeals (id, consultation_id, user_id, lawyer_id, reason, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, body.consultationId, body.userId, body.lawyerId, body.reason, body.description || '', 'pending', now()
    )
    sendJson(res, 200, db.prepare('SELECT * FROM appeals WHERE id = ?').get(id))
  } catch (e) {
    sendJson(res, 500, null, e.message)
  }
})

app.patch('/api/appeals/:id/process', async (req, res) => {
  try {
    const { status, result, processedBy } = await parseJsonBody(req)
    db.prepare(`UPDATE appeals SET status = ?, result = ?, processed_at = ?, processed_by = ? WHERE id = ?`).run(
      status, result || '', now(), processedBy || 'admin', req.params.id
    )
    const auditId = 'audit-' + uuidv4().slice(0, 8)
    db.prepare(`INSERT INTO audit_records (id, operator, target_type, target_id, action, reason, result, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      auditId, processedBy || 'admin', 'appeal', req.params.id, status, '', result || '', now()
    )
    sendJson(res, 200, db.prepare('SELECT * FROM appeals WHERE id = ?').get(req.params.id))
  } catch (e) {
    sendJson(res, 500, null, e.message)
  }
})

app.get('/api/admin/summary', (req, res) => {
  const totalConsultations = db.prepare('SELECT COUNT(*) as count FROM consultations').get().count
  const totalLawyers = db.prepare('SELECT COUNT(*) as count FROM lawyers').get().count
  const pendingAppeals = db.prepare("SELECT COUNT(*) as count FROM appeals WHERE status = 'pending'").get().count
  const frozenLawyers = db.prepare("SELECT COUNT(*) as count FROM lawyers WHERE status = 'frozen'").get().count
  sendJson(res, 200, {
    modules: ['咨询分配', '律师管理', '申诉仲裁', '服务质检'],
    metrics: [
      { key: 'totalConsultations', label: '总咨询量', value: totalConsultations },
      { key: 'totalLawyers', label: '注册律师', value: totalLawyers },
      { key: 'pendingAppeals', label: '待处理申诉', value: pendingAppeals },
      { key: 'frozenLawyers', label: '已冻结律师', value: frozenLawyers },
    ],
  })
})

app.get('/api/audit-records', (req, res) => {
  const { targetType, targetId } = req.query
  let sql = 'SELECT * FROM audit_records WHERE 1=1'
  const params = []
  if (targetType) { sql += ' AND target_type = ?'; params.push(targetType) }
  if (targetId) { sql += ' AND target_id = ?'; params.push(targetId) }
  sql += ' ORDER BY created_at DESC'
  const list = db.prepare(sql).all(...params)
  sendJson(res, 200, { list, total: list.length })
})

app.post('/api/audit-records', async (req, res) => {
  try {
    const body = await parseJsonBody(req)
    const id = 'audit-' + uuidv4().slice(0, 8)
    db.prepare(`INSERT INTO audit_records (id, operator, target_type, target_id, action, reason, result, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, body.operator || 'admin', body.targetType, body.targetId, body.action, body.reason || '', body.result || '', body.remark || '', now()
    )
    sendJson(res, 200, db.prepare('SELECT * FROM audit_records WHERE id = ?').get(id))
  } catch (e) {
    sendJson(res, 500, null, e.message)
  }
})

app.use((req, res) => {
  sendJson(res, 404, {
    available: [
      'GET    /api/health',
      'POST   /api/auth/login',
      'GET    /api/consultations',
      'POST   /api/consultations',
      'GET    /api/consultations/:id',
      'PATCH  /api/consultations/:id/status',
      'POST   /api/consultations/:id/close',
      'GET    /api/consultations/:id/messages',
      'POST   /api/consultations/:id/messages',
      'GET    /api/grab-pool',
      'POST   /api/grab-pool/:id/grab',
      'GET    /api/lawyers',
      'GET    /api/lawyers/:id',
      'PATCH  /api/lawyers/:id/status',
      'GET    /api/monitoring/stats',
      'GET    /api/monitoring/lawyer-activities',
      'POST   /api/evaluations',
      'GET    /api/appeals',
      'POST   /api/appeals',
      'PATCH  /api/appeals/:id/process',
      'GET    /api/admin/summary',
      'GET    /api/audit-records',
      'POST   /api/audit-records',
    ]
  }, 'endpoint_not_found')
})

app.use((err, req, res, next) => {
  console.error('[ERROR]', err)
  sendJson(res, 500, null, err.message || 'internal_server_error')
})

app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     法律公益咨询协同平台 - 后端API服务                       ║
╠══════════════════════════════════════════════════════════════╣
║  服务地址: http://${HOST}:${PORT}                           ║
║  健康检查: http://${HOST}:${PORT}/api/health                 ║
║  前端地址: ${FRONTEND_URL}                                  ║
║  数据库:   ${DB_PATH}                                       ║
║  SQLite:   已连接                                           ║
║  CORS:     已配置                                           ║
╚══════════════════════════════════════════════════════════════╝
  `)
})

process.on('SIGTERM', () => {
  console.log('\n收到SIGTERM信号，正在优雅关闭...')
  db.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\n收到SIGINT信号，正在优雅关闭...')
  db.close()
  process.exit(0)
})
