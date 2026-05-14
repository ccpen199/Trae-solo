const Database = require('better-sqlite3')
const path = require('path')

const dbPath = process.env.DB_PATH || './data/app.sqlite'
const db = new Database(dbPath)

function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      db.pragma('foreign_keys = ON')

      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          avatar TEXT NOT NULL,
          nickname TEXT,
          birthday TEXT NOT NULL,
          signature TEXT,
          gender TEXT NOT NULL,
          constellation TEXT,
          planet_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      db.exec(`
        CREATE TABLE IF NOT EXISTS planets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          color TEXT DEFAULT '#6366f1',
          icon TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      db.exec(`
        CREATE TABLE IF NOT EXISTS tests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          questions TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      db.exec(`
        CREATE TABLE IF NOT EXISTS user_test_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          test_id INTEGER NOT NULL,
          answers TEXT NOT NULL,
          result TEXT NOT NULL,
          planet_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (test_id) REFERENCES tests(id)
        )
      `)

      db.exec(`
        CREATE TABLE IF NOT EXISTS matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id1 INTEGER NOT NULL,
          user_id2 INTEGER NOT NULL,
          match_type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id1) REFERENCES users(id),
          FOREIGN KEY (user_id2) REFERENCES users(id)
        )
      `)

      db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          from_user_id INTEGER NOT NULL,
          to_user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          type TEXT DEFAULT 'text',
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (from_user_id) REFERENCES users(id),
          FOREIGN KEY (to_user_id) REFERENCES users(id)
        )
      `)

      db.exec(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          type TEXT DEFAULT 'text',
          media_url TEXT,
          location TEXT,
          tags TEXT,
          likes_count INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          shares_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `)

      db.exec(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `)

      db.exec(`
        CREATE TABLE IF NOT EXISTS likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id),
          FOREIGN KEY (post_id) REFERENCES posts(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `)

      db.exec(`
        CREATE TABLE IF NOT EXISTS follows (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          follower_id INTEGER NOT NULL,
          following_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(follower_id, following_id),
          FOREIGN KEY (follower_id) REFERENCES users(id),
          FOREIGN KEY (following_id) REFERENCES users(id)
        )
      `)

      db.exec(`
        CREATE TABLE IF NOT EXISTS verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT NOT NULL,
          code TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      const planets = [
        { name: '浪漫星球', description: '追求浪漫与诗意的灵魂', color: '#ec4899' },
        { name: '理性星球', description: '逻辑思维主导的思考者', color: '#3b82f6' },
        { name: '艺术星球', description: '充满创意与想象力的艺术家', color: '#f59e0b' },
        { name: '冒险星球', description: '热爱挑战与探索的冒险家', color: '#10b981' },
        { name: '温暖星球', description: '善解人意的治愈系灵魂', color: '#8b5cf6' }
      ]

      const insertPlanet = db.prepare('INSERT OR IGNORE INTO planets (name, description, color) VALUES (?, ?, ?)')
      planets.forEach(planet => {
        insertPlanet.run(planet.name, planet.description, planet.color)
      })

      const funQuestions = JSON.stringify([
        { id: 1, question: '周末你更喜欢？', options: ['宅家看书', '户外探险', '朋友聚会', '艺术创作'] },
        { id: 2, question: '遇到问题你倾向于？', options: ['理性分析', '直觉判断', '寻求帮助', '独自思考'] },
        { id: 3, question: '你更看重朋友的？', options: ['忠诚', '幽默', '智慧', '善良'] }
      ])

      db.prepare('INSERT OR IGNORE INTO tests (type, title, description, questions) VALUES (?, ?, ?, ?)')
        .run('fun', '趣味测试', '快速了解你的性格倾向', funQuestions)

      console.log('Database initialized successfully')
      resolve()
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = { db, initDatabase }
