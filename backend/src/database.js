const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'data', 'app.db')
const db = new Database(dbPath, { verbose: console.log })

function initializeTables() {
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    total_duration INTEGER DEFAULT 0,
    step_count INTEGER DEFAULT 0,
    calories INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    distance REAL DEFAULT 0,
    duration INTEGER DEFAULT 0,
    calories INTEGER DEFAULT 0,
    pace REAL,
    route_data TEXT,
    start_time DATETIME,
    end_time DATETIME,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    cover TEXT,
    description TEXT,
    duration INTEGER,
    difficulty TEXT DEFAULT 'beginner',
    category TEXT,
    calories INTEGER DEFAULT 0,
    action_count INTEGER DEFAULT 0,
    is_recommended INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS course_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    duration INTEGER DEFAULT 30,
    video_url TEXT,
    tutorial TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(id)
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS user_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    last_study_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE(user_id, course_id)
  )`)

  db.exec(`CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    category TEXT,
    search_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`)

  console.log('数据库表初始化完成')
  insertInitialData()
}

function insertInitialData() {
  const count = db.prepare('SELECT COUNT(*) as count FROM courses').get()
  if (count.count > 0) return

  const insertCourse = db.prepare(`INSERT INTO courses 
    (title, cover, description, duration, difficulty, category, calories, action_count, is_recommended, is_new) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  
  const courses = [
    ['HIIT 燃脂训练', '🔥', '高强度间歇训练，快速燃脂', 20, 'intermediate', '有氧', 200, 8, 1, 0],
    ['核心力量训练', '💪', '强化核心肌群，塑造马甲线', 15, 'beginner', '力量', 120, 6, 1, 0],
    ['全身拉伸放松', '🧘', '缓解肌肉紧张，提升柔韧性', 10, 'beginner', '拉伸', 50, 5, 0, 1],
    ['臀腿塑形训练', '🍑', '打造完美臀腿线条', 25, 'intermediate', '力量', 180, 10, 1, 0],
    ['晨间唤醒瑜伽', '☀️', '开启元气满满的一天', 12, 'beginner', '瑜伽', 60, 7, 0, 1],
    ['腹肌撕裂者', '⚡', '高强度腹肌训练', 18, 'advanced', '力量', 150, 9, 0, 1]
  ]

  courses.forEach(course => insertCourse.run(...course))
  
  const insertAction = db.prepare(`INSERT INTO course_actions 
    (course_id, name, duration, sort_order) VALUES (?, ?, ?, ?)`)
  
  const actions = [
    [1, '开合跳', 60, 1],
    [1, '高抬腿', 60, 2],
    [1, '波比跳', 45, 3],
    [1, '深蹲跳', 45, 4],
    [1, '俯卧撑', 60, 5],
    [1, '登山跑', 60, 6],
    [1, '平板支撑', 60, 7],
    [1, '休息放松', 60, 8]
  ]

  actions.forEach(action => insertAction.run(...action))

  console.log('初始课程数据插入完成')
}

initializeTables()

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql)
      const result = stmt.run(...params)
      resolve({ lastID: result.lastInsertRowid, changes: result.changes })
    } catch (err) {
      reject(err)
    }
  })
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql)
      const row = stmt.get(...params)
      resolve(row)
    } catch (err) {
      reject(err)
    }
  })
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql)
      const rows = stmt.all(...params)
      resolve(rows)
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = { db, runAsync, getAsync, allAsync }
