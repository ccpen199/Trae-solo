import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appRoot = path.resolve(__dirname, '..')
const projectRoot = path.resolve(appRoot, '..')

loadEnv(path.join(projectRoot, '.env'))
loadEnv(path.join(appRoot, '.env'), true)

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59131)
const dbPath = resolveDbPath(process.env.DB_PATH || '../data/app.sqlite')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })
const db = new DatabaseSync(dbPath)
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS runtime_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS career_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_role TEXT NOT NULL,
    current_role TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`)

seed()

const jobs = [
  { id: 'job-frontend-senior', title: '高级前端工程师', company: '星河科技', growth: 91, match: 86, salary: '28k-42k', city: '上海' },
  { id: 'job-product-analytics', title: '产品数据分析师', company: '青云智能', growth: 84, match: 78, salary: '22k-35k', city: '杭州' },
  { id: 'job-ux-researcher', title: '用户研究员', company: '明略咨询', growth: 79, match: 74, salary: '20k-32k', city: '深圳' },
]

const competencies = [
  { name: 'React 工程化', current: 78, target: 90 },
  { name: '业务建模', current: 64, target: 82 },
  { name: '跨团队协作', current: 72, target: 86 },
  { name: '数据分析', current: 58, target: 76 },
]

const encyclopedia = [
  { id: 'frontend', title: '前端工程师', level: '中级到高级', entry: '掌握现代框架、工程化和性能优化' },
  { id: 'product-manager', title: '产品经理', level: '入门到高级', entry: '从需求分析、原型设计到增长实验' },
  { id: 'data-analyst', title: '数据分析师', level: '入门到专家', entry: '围绕指标体系、SQL、可视化和实验分析' },
]

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '*'
  if (req.method === 'OPTIONS') {
    writeCors(res, 204, origin)
    return
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`)

  if (req.method === 'GET' && url.pathname === '/api/health') {
    json(res, 200, {
      ok: true,
      success: true,
      project: 'may-89131',
      service: 'CareerPath 本地 API',
      database: path.relative(projectRoot, dbPath),
      events: db.prepare('SELECT COUNT(*) AS count FROM runtime_events').get().count,
      time: new Date().toISOString(),
    }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/profile') {
    json(res, 200, {
      success: true,
      data: db.prepare('SELECT * FROM career_profiles WHERE id = ?').get('demo-user'),
    }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/jobs') {
    json(res, 200, { success: true, data: jobs, total: jobs.length }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/matches') {
    json(res, 200, {
      success: true,
      data: {
        targetRole: '高级前端工程师',
        readiness: 82,
        gaps: competencies.filter((item) => item.current < item.target),
        recommendedJobs: jobs,
      },
    }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/competencies') {
    json(res, 200, { success: true, data: competencies }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/encyclopedia') {
    json(res, 200, { success: true, data: encyclopedia }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/hr/pipeline') {
    json(res, 200, {
      success: true,
      data: [
        { stage: '潜力人才', count: 42 },
        { stage: '持续跟进', count: 18 },
        { stage: '岗位匹配', count: 9 },
      ],
    }, origin)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/events') {
    const body = await readJson(req)
    db.prepare('INSERT INTO runtime_events (event_name, payload) VALUES (?, ?)').run(body.event || 'web_event', JSON.stringify(body))
    json(res, 201, { success: true, data: body }, origin)
    return
  }

  json(res, 404, { success: false, error: 'API not found', path: url.pathname }, origin)
})

server.listen(port, host, () => {
  console.log(`may-89131 backend listening on http://${host}:${port}`)
})

function resolveDbPath(value) {
  return path.isAbsolute(value) ? value : path.resolve(appRoot, value)
}

function loadEnv(filePath, override = false) {
  if (!fs.existsSync(filePath)) return
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/)
    if (match && (override || !process.env[match[1]])) process.env[match[1]] = match[2]
  }
}

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM career_profiles').get().count
  if (count === 0) {
    db.prepare('INSERT INTO career_profiles (id, name, target_role, current_role) VALUES (?, ?, ?, ?)').run(
      'demo-user',
      '张明',
      '高级前端工程师',
      '初级前端工程师',
    )
  }

  const eventCount = db.prepare('SELECT COUNT(*) AS count FROM runtime_events').get().count
  if (eventCount === 0) {
    db.prepare('INSERT INTO runtime_events (event_name, payload) VALUES (?, ?)').run(
      'service_ready',
      JSON.stringify({ module: 'CareerPath', routes: ['/api/jobs', '/api/matches', '/api/competencies'] }),
    )
  }
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return { raw }
  }
}

function writeCors(res, status, origin) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  })
  res.end()
}

function json(res, status, body, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  })
  res.end(JSON.stringify(body))
}
