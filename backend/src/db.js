const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      avatar TEXT,
      is_vip INTEGER DEFAULT 0,
      vip_expire_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      source_text TEXT NOT NULL,
      target_text TEXT NOT NULL,
      source_lang TEXT,
      target_lang TEXT,
      translation_type TEXT DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS word_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      phonetic TEXT,
      meaning TEXT,
      example TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, word),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS daily_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE UNIQUE NOT NULL,
      word TEXT NOT NULL,
      phonetic TEXT,
      meaning TEXT NOT NULL,
      example TEXT,
      example_translation TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      translation TEXT,
      source TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE UNIQUE NOT NULL,
      movie_name TEXT NOT NULL,
      line TEXT NOT NULL,
      line_translation TEXT,
      cover TEXT
    );

    CREATE TABLE IF NOT EXISTS study_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      study_date DATE NOT NULL,
      study_type TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      words_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, study_date, study_type),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      cover TEXT,
      description TEXT,
      chapters INTEGER DEFAULT 0,
      is_vip INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS book_chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      chapter_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cover TEXT,
      description TEXT,
      instructor TEXT,
      is_vip INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const wordCount = db.prepare('SELECT COUNT(*) as count FROM daily_words').get().count;
  if (wordCount === 0) {
    const insertWord = db.prepare(`
      INSERT INTO daily_words (date, word, phonetic, meaning, example, example_translation)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const today = new Date().toISOString().split('T')[0];
    insertWord.run(today, 'ephemeral', '/ɪˈfemərəl/', '短暂的;瞬息的', 'Fame is ephemeral in the entertainment industry.', '在娱乐业，名声是转瞬即逝的。');
  }

  const readingCount = db.prepare('SELECT COUNT(*) as count FROM daily_readings').get().count;
  if (readingCount === 0) {
    const insertReading = db.prepare(`
      INSERT INTO daily_readings (date, title, content, translation, source)
      VALUES (?, ?, ?, ?, ?)
    `);
    const today = new Date().toISOString().split('T')[0];
    insertReading.run(today, 'The Power of Habit', 'Habits are the compound interest of self-improvement. The same way that money multiplies through compound interest, the effects of your habits multiply as you repeat them.', '习惯是自我提升的复利。就像金钱通过复利增值一样，习惯的效果也会随着重复而倍增。', 'Atomic Habits');
  }

  const movieCount = db.prepare('SELECT COUNT(*) as count FROM daily_movies').get().count;
  if (movieCount === 0) {
    const insertMovie = db.prepare(`
      INSERT INTO daily_movies (date, movie_name, line, line_translation, cover)
      VALUES (?, ?, ?, ?, ?)
    `);
    const today = new Date().toISOString().split('T')[0];
    insertMovie.run(today, 'The Shawshank Redemption', 'Hope is a good thing, maybe the best of things, and no good thing ever dies.', '希望是美好的，也许是人间至善，而美好的事物永不消逝。', '');
  }
}

module.exports = { db, initDatabase };
