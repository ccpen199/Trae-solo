import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'mindisland.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    anonymous_name TEXT NOT NULL,
    phq9_score INTEGER DEFAULT 0,
    gad7_score INTEGER DEFAULT 0,
    life_event_tags TEXT DEFAULT '[]',
    counseling_goals TEXT DEFAULT '',
    risk_level TEXT DEFAULT 'low',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vent_records (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    emotion_clustering TEXT DEFAULT '{}',
    risk_level TEXT DEFAULT 'low',
    keywords TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS counselors (
    id TEXT PRIMARY KEY,
    anonymous_name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    credential_type TEXT DEFAULT '三级',
    ocr_status TEXT DEFAULT 'pending',
    db_match_status TEXT DEFAULT 'pending',
    expertise_tags TEXT DEFAULT '[]',
    rating REAL DEFAULT 4.5,
    session_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS time_slots (
    id TEXT PRIMARY KEY,
    counselor_id TEXT NOT NULL REFERENCES counselors(id),
    slot_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_available INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id),
    counselor_id TEXT NOT NULL REFERENCES counselors(id),
    scheduled_at TEXT NOT NULL,
    duration INTEGER DEFAULT 50,
    status TEXT DEFAULT 'scheduled',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS session_summaries (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    emotion_state TEXT DEFAULT '',
    core_issues TEXT DEFAULT '[]',
    suggested_actions TEXT DEFAULT '[]',
    next_focus TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS emotion_trends (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id),
    record_date TEXT NOT NULL,
    phq9_score INTEGER DEFAULT 0,
    gad7_score INTEGER DEFAULT 0,
    dominant_emotion TEXT DEFAULT 'calm'
  );
`)

function seedCounselors() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM counselors').get() as { cnt: number }
  if (count.cnt > 0) return

  const counselors = [
    { name: '暖阳咨询师', tags: ['恋爱', '家庭'], rating: 4.8 },
    { name: '星河咨询师', tags: ['职场', '经济'], rating: 4.6 },
    { name: '清风咨询师', tags: ['学业', '成长'], rating: 4.9 },
    { name: '月影咨询师', tags: ['社交', '健康'], rating: 4.3 },
    { name: '晨露咨询师', tags: ['恋爱', '职场', '成长'], rating: 4.7 },
    { name: '云栖咨询师', tags: ['家庭', '学业', '健康'], rating: 4.5 },
  ]

  const insertCounselor = db.prepare(`
    INSERT INTO counselors (id, anonymous_name, expertise_tags, rating, credential_type, ocr_status, db_match_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertSlot = db.prepare(`
    INSERT INTO time_slots (id, counselor_id, slot_date, start_time, end_time, is_available)
    VALUES (?, ?, ?, ?, ?, 1)
  `)

  const today = new Date()

  const transaction = db.transaction(() => {
    for (const c of counselors) {
      const id = uuidv4()
      insertCounselor.run(id, c.name, JSON.stringify(c.tags), c.rating, '二级', 'verified', 'matched')

      for (let d = 0; d < 7; d++) {
        const date = new Date(today)
        date.setDate(date.getDate() + d)
        const dateStr = date.toISOString().slice(0, 10)

        const slots = [
          { start: '09:00', end: '10:00' },
          { start: '10:30', end: '11:30' },
          { start: '14:00', end: '15:00' },
          { start: '15:30', end: '16:30' },
          { start: '19:00', end: '20:00' },
        ]

        for (const slot of slots) {
          insertSlot.run(uuidv4(), id, dateStr, slot.start, slot.end)
        }
      }
    }
  })

  transaction()
}

function normalizeCounselorStatuses() {
  db.prepare("UPDATE counselors SET db_match_status = 'matched' WHERE db_match_status = 'verified'").run()
}

function seedDemoProfileData() {
  db.prepare(`
    INSERT OR IGNORE INTO profiles (id, anonymous_name, phq9_score, gad7_score, life_event_tags, counseling_goals, risk_level, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'demo-profile',
    '温暖的海浪',
    11,
    9,
    JSON.stringify(['职场', '家庭', '成长']),
    '缓解焦虑情绪、学会情绪管理、建立稳定作息',
    'medium',
    '2026-06-09T08:30:00.000Z',
  )

  const counselors = db.prepare('SELECT id, anonymous_name FROM counselors ORDER BY rating DESC LIMIT 2').all() as Array<{
    id: string
    anonymous_name: string
  }>

  if (counselors.length > 0) {
    const first = counselors[0]
    const second = counselors[1] ?? counselors[0]
    const insertSession = db.prepare(`
      INSERT OR IGNORE INTO sessions (id, profile_id, counselor_id, scheduled_at, duration, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    insertSession.run('demo-session-1', 'demo-profile', first.id, '2026-06-08T10:30:00.000Z', 50, 'completed', '2026-06-07T09:00:00.000Z')
    insertSession.run('demo-session-2', 'demo-profile', second.id, '2026-06-02T15:30:00.000Z', 50, 'completed', '2026-06-01T11:00:00.000Z')
    insertSession.run('demo-session-3', 'demo-profile', first.id, '2026-06-15T14:00:00.000Z', 0, 'scheduled', '2026-06-09T09:30:00.000Z')
  }

  const trendCount = db.prepare('SELECT COUNT(*) as cnt FROM emotion_trends WHERE profile_id = ?').get('demo-profile') as { cnt: number }
  if (trendCount.cnt === 0) {
    const insertTrend = db.prepare(`
      INSERT INTO emotion_trends (id, profile_id, record_date, phq9_score, gad7_score, dominant_emotion)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const emotions = ['焦虑', '低落', '平静']
    const start = new Date('2026-05-11T12:00:00.000Z')

    const transaction = db.transaction(() => {
      for (let i = 0; i < 30; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        insertTrend.run(
          `demo-trend-${i}`,
          'demo-profile',
          date.toISOString().slice(0, 10),
          Math.max(0, Math.min(27, Math.round(10 + Math.sin(i * 0.35) * 4 + (i % 3)))),
          Math.max(0, Math.min(21, Math.round(8 + Math.cos(i * 0.28) * 3 + (i % 2)))),
          emotions[i % emotions.length],
        )
      }
    })

    transaction()
  }
}

seedCounselors()
normalizeCounselorStatuses()
seedDemoProfileData()

export default db
