const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

function initTables() {
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT,
      gender TEXT CHECK(gender IN ('male', 'female', 'other')),
      birth_year INTEGER,
      level TEXT DEFAULT 'beginner',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('video', 'audio', 'text')),
      title TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      content_url TEXT,
      duration INTEGER,
      tags TEXT,
      category TEXT NOT NULL,
      difficulty TEXT DEFAULT 'beginner' CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      favorite_count INTEGER DEFAULT 0,
      is_paid INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      author TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_content_interactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      interaction_type TEXT NOT NULL CHECK(interaction_type IN ('view', 'like', 'favorite', 'dislike', 'share')),
      view_duration INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
      UNIQUE(user_id, content_id, interaction_type)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS assessment_questions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('listening', 'speaking', 'reading', 'writing', 'vocabulary')),
      question TEXT NOT NULL,
      options TEXT,
      correct_answer TEXT NOT NULL,
      difficulty TEXT DEFAULT 'beginner' CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      level TEXT NOT NULL,
      details TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'super_admin')),
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  console.log('Database tables initialized');
  insertInitialData();
}

function insertInitialData() {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  if (adminCount.count === 0) {
    const adminId = uuidv4();
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO admin_users (id, username, password, role) VALUES (?, ?, ?, ?)
    `).run(adminId, 'admin', hashedPassword, 'super_admin');
    console.log('Default admin account created: admin/admin123');
  }

  const contentCount = db.prepare('SELECT COUNT(*) as count FROM content').get();
  if (contentCount.count === 0) {
    const insertContent = db.prepare(`
      INSERT INTO content (id, type, title, description, cover_url, content_url, duration, tags, category, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleContents = [
      {
        id: uuidv4(),
        type: 'video',
        title: 'Introduction to Chinese Calligraphy',
        description: 'Learn the basics of Chinese calligraphy, one of China\'s most treasured arts.',
        cover_url: 'https://picsum.photos/seed/calligraphy/400/300',
        content_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: 300,
        tags: JSON.stringify(['calligraphy', 'art', 'culture']),
        category: 'culture',
        difficulty: 'beginner'
      },
      {
        id: uuidv4(),
        type: 'video',
        title: 'Chinese Tea Ceremony Explained',
        description: 'Discover the ancient art of Chinese tea ceremony and its cultural significance.',
        cover_url: 'https://picsum.photos/seed/tea/400/300',
        content_url: 'https://www.w3schools.com/html/movie.mp4',
        duration: 450,
        tags: JSON.stringify(['tea', 'culture', 'tradition']),
        category: 'culture',
        difficulty: 'beginner'
      },
      {
        id: uuidv4(),
        type: 'audio',
        title: 'Chinese Folk Songs Collection',
        description: 'Enjoy beautiful traditional Chinese folk songs.',
        cover_url: 'https://picsum.photos/seed/folksong/400/300',
        content_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        duration: 180,
        tags: JSON.stringify(['music', 'folk', 'traditional']),
        category: 'music',
        difficulty: 'beginner'
      },
      {
        id: uuidv4(),
        type: 'text',
        title: 'The Story of Confucius',
        description: 'Learn about the life and teachings of Confucius, China\'s greatest philosopher.',
        cover_url: 'https://picsum.photos/seed/confucius/400/300',
        content_url: '',
        duration: null,
        tags: JSON.stringify(['philosophy', 'history', 'confucius']),
        category: 'history',
        difficulty: 'intermediate'
      },
      {
        id: uuidv4(),
        type: 'video',
        title: 'Making of Chinese Dumplings',
        description: 'Learn how to make authentic Chinese dumplings from scratch.',
        cover_url: 'https://picsum.photos/seed/dumplings/400/300',
        content_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: 600,
        tags: JSON.stringify(['food', 'cooking', 'recipe']),
        category: 'food',
        difficulty: 'beginner'
      }
    ];

    sampleContents.forEach(content => {
      insertContent.run(
        content.id, content.type, content.title, content.description,
        content.cover_url, content.content_url, content.duration, content.tags,
        content.category, content.difficulty
      );
    });

    console.log('Sample content inserted');
  }

  const questionCount = db.prepare('SELECT COUNT(*) as count FROM assessment_questions').get();
  if (questionCount.count === 0) {
    const insertQuestion = db.prepare(`
      INSERT INTO assessment_questions (id, type, question, options, correct_answer, difficulty)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const questions = [
      {
        id: uuidv4(),
        type: 'vocabulary',
        question: 'What does "你好" mean?',
        options: JSON.stringify(['Goodbye', 'Hello', 'Thank you', 'Please']),
        correct_answer: 'Hello',
        difficulty: 'beginner'
      },
      {
        id: uuidv4(),
        type: 'vocabulary',
        question: 'What does "谢谢" mean?',
        options: JSON.stringify(['Hello', 'Sorry', 'Thank you', 'Goodbye']),
        correct_answer: 'Thank you',
        difficulty: 'beginner'
      },
      {
        id: uuidv4(),
        type: 'reading',
        question: 'Select the correct character for "water":',
        options: JSON.stringify(['火', '水', '木', '金']),
        correct_answer: '水',
        difficulty: 'beginner'
      },
      {
        id: uuidv4(),
        type: 'vocabulary',
        question: 'What does "再见" mean?',
        options: JSON.stringify(['Hello', 'Goodbye', 'Please', 'Sorry']),
        correct_answer: 'Goodbye',
        difficulty: 'beginner'
      },
      {
        id: uuidv4(),
        type: 'vocabulary',
        question: 'What does "我爱你" mean?',
        options: JSON.stringify(['I hate you', 'I miss you', 'I love you', 'I need you']),
        correct_answer: 'I love you',
        difficulty: 'beginner'
      }
    ];

    questions.forEach(q => {
      insertQuestion.run(q.id, q.type, q.question, q.options, q.correct_answer, q.difficulty);
    });

    console.log('Sample assessment questions inserted');
  }
}

initTables();

module.exports = db;
