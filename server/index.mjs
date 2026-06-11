import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))

function loadLocalEnv() {
  const envPath = resolve(projectRoot, '.env')
  if (!existsSync(envPath)) return
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const [key, ...parts] = trimmed.split('=')
    if (!process.env[key]) process.env[key] = parts.join('=')
  }
}

loadLocalEnv()

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.BACKEND_PORT || 59166)
const dbPath = resolve(projectRoot, process.env.SQLITE_PATH || './data/app.sqlite')

mkdirSync(dirname(dbPath), { recursive: true })
const db = new DatabaseSync(dbPath)
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS health_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS intervention_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    duration INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

const snapshotCount = db.prepare('SELECT COUNT(*) AS count FROM health_snapshots').get().count
if (snapshotCount === 0) {
  const insertSnapshot = db.prepare('INSERT INTO health_snapshots (metric, value) VALUES (?, ?)')
  insertSnapshot.run('sleep_efficiency', '86')
  insertSnapshot.run('avg_breathing_rate', '16')
  insertSnapshot.run('night_turns', '12')
}

const trackCount = db.prepare('SELECT COUNT(*) AS count FROM intervention_tracks').get().count
if (trackCount === 0) {
  const insertTrack = db.prepare('INSERT INTO intervention_tracks (title, category, duration) VALUES (?, ?, ?)')
  insertTrack.run('焦虑缓解呼吸', 'anxiety', 600)
  insertTrack.run('深睡呼吸引导', 'insomnia', 1800)
  insertTrack.run('雨声放松', 'stress', 2400)
  insertTrack.run('晨间唤醒冥想', 'meditation', 900)
}

const discoverCategories = [
  {
    id: 'insomnia',
    name: '深度失眠',
    summary: '睡前故事、白噪音与CBT-I助眠练习',
    protocol: 'CBT-I + 睡眠限制疗法',
    riskFit: '入睡困难、早醒、睡眠效率偏低',
  },
  {
    id: 'anxiety',
    name: '焦虑缓解',
    summary: '呼吸节律、接地练习与夜间惊醒安抚',
    protocol: '4-7-8呼吸 + 正念接地',
    riskFit: '压力升高、夜间觉醒、心率波动',
  },
  {
    id: 'stress',
    name: '压力释放',
    summary: '身体扫描、雨声放松与渐进式肌肉松弛',
    protocol: 'PMR渐进放松',
    riskFit: '工作压力、肩颈紧张、浅睡比例高',
  },
  {
    id: 'meditation',
    name: '专注冥想',
    summary: '晨间唤醒、正念冥想与情绪记录',
    protocol: '正念认知训练',
    riskFit: '情绪波动、晨间疲惫、专注下降',
  },
]

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  })
  res.end(JSON.stringify(payload))
}

const server = createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${host}:${port}`)

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    const sqliteCheck = db.prepare('SELECT 1 AS ok').get()
    sendJson(res, 200, {
      status: 'ok',
      service: 'sleep-health-intervention-platform',
      sqlite: sqliteCheck?.ok === 1 ? 'ok' : 'error',
      database: dbPath,
      timestamp: new Date().toISOString(),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/sleep/summary') {
    const rows = db.prepare('SELECT metric, value FROM health_snapshots ORDER BY id').all()
    sendJson(res, 200, {
      status: 'ok',
      data: Object.fromEntries(rows.map((row) => [row.metric, Number(row.value) || row.value])),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/audio/tracks') {
    sendJson(res, 200, {
      status: 'ok',
      data: db.prepare('SELECT id, title, category, duration FROM intervention_tracks ORDER BY id').all(),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/discover/categories') {
    const rows = db.prepare('SELECT id, title, category, duration FROM intervention_tracks ORDER BY id').all()
    const data = discoverCategories.map((category) => ({
      ...category,
      trackCount: rows.filter((row) => row.category === category.id).length,
      tracks: rows.filter((row) => row.category === category.id),
    }))

    sendJson(res, 200, {
      status: 'ok',
      data,
      updatedAt: new Date().toISOString(),
    })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/admin/overview') {
    const snapshotRows = db.prepare('SELECT metric, value FROM health_snapshots ORDER BY id').all()
    const trackRows = db.prepare('SELECT id, title, category, duration FROM intervention_tracks ORDER BY id').all()
    const sleepSummary = Object.fromEntries(snapshotRows.map((row) => [row.metric, Number(row.value) || row.value]))

    sendJson(res, 200, {
      status: 'ok',
      data: {
        usersOnline: 128,
        activePlans: 46,
        highRiskAlerts: 7,
        medicalReferrals: 5,
        sqlitePath: dbPath,
        sleepSummary,
        trackCount: trackRows.length,
        categories: discoverCategories.map((category) => ({
          id: category.id,
          name: category.name,
          trackCount: trackRows.filter((row) => row.category === category.id).length,
        })),
        auditEvents: [
          { id: 'evt-001', action: '高风险报告生成', operator: '风控引擎', createdAt: new Date(Date.now() - 1800000).toISOString() },
          { id: 'evt-002', action: '医生转诊授权', operator: '用户星夜旅者', createdAt: new Date(Date.now() - 5400000).toISOString() },
          { id: 'evt-003', action: '音频版权水印校验', operator: '内容系统', createdAt: new Date(Date.now() - 8600000).toISOString() },
        ],
      },
    })
    return
  }

  sendJson(res, 404, {
    status: 'not_found',
    available: [
      '/api/health',
      '/api/sleep/summary',
      '/api/audio/tracks',
      '/api/discover/categories',
      '/api/admin/overview',
    ],
  })
})

server.listen(port, host, () => {
  console.log(`may-89166 backend listening on http://${host}:${port}`)
  console.log(`sqlite database: ${dbPath}`)
})
