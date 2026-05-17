import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/app.sqlite');

export function initDatabase() {
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      is_vip INTEGER DEFAULT 0,
      vip_expire_at DATETIME,
      wisdom_coins INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      speaker TEXT,
      cover TEXT,
      category TEXT,
      tags TEXT,
      intro TEXT,
      duration INTEGER DEFAULT 0,
      play_count INTEGER DEFAULT 0,
      is_free INTEGER DEFAULT 0,
      audio_url TEXT,
      excerpt TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cover TEXT,
      category TEXT,
      teacher TEXT,
      intro TEXT,
      price REAL DEFAULT 0,
      original_price REAL,
      lesson_count INTEGER DEFAULT 0,
      student_count INTEGER DEFAULT 0,
      is_free INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      audio_url TEXT,
      is_free INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ebooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      cover TEXT,
      category TEXT,
      intro TEXT,
      price REAL DEFAULT 0,
      wisdom_price INTEGER DEFAULT 0,
      is_free INTEGER DEFAULT 0,
      total_pages INTEGER DEFAULT 100,
      content TEXT,
      is_fandeng INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cover TEXT,
      category TEXT,
      price REAL DEFAULT 0,
      original_price REAL,
      stock INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      intro TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image TEXT NOT NULL,
      link TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      item_title TEXT,
      item_cover TEXT,
      amount REAL NOT NULL,
      status INTEGER DEFAULT 0,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS play_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER,
      course_id INTEGER,
      lesson_id INTEGER,
      progress INTEGER DEFAULT 0,
      last_play_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      keyword TEXT NOT NULL,
      search_count INTEGER DEFAULT 1,
      last_search_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hot_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      search_count INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, book_id)
    );

    CREATE TABLE IF NOT EXISTS user_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS user_ebooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ebook_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, ebook_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get()?.count || 0;
  if (bookCount === 0) {
    const insertBook = db.prepare(`
      INSERT INTO books (title, author, speaker, cover, category, tags, intro, duration, is_free, audio_url, excerpt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const baseUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=';
    
    const books = [
      [
        'Lunyu Wisdom', 
        'Confucius', 
        'Fan Deng', 
        `${baseUrl}book%20cover%20chinese%20classic&image_size=square_hd`, 
        'Classic', 
        'Philosophy', 
        'Learn ancient Chinese wisdom', 
        3600, 
        1, 
        '', 
        'Learning and practice'
      ],
      [
        'Art of War', 
        'Sun Tzu', 
        'Fan Deng', 
        `${baseUrl}business%20book%20cover&image_size=square_hd`, 
        'Business', 
        'Strategy', 
        'Business strategy classics', 
        4200, 
        0, 
        '', 
        'Know yourself'
      ],
      [
        '7 Habits', 
        'Stephen Covey', 
        'Fan Deng', 
        `${baseUrl}self%20help%20book%20cover&image_size=square_hd`, 
        'Growth', 
        'Efficiency', 
        'Personal growth classic', 
        5400, 
        0, 
        '', 
        'Be proactive'
      ],
      [
        'To Live', 
        'Yu Hua', 
        'Fan Deng', 
        `${baseUrl}literature%20book%20cover&image_size=square_hd`, 
        'Literature', 
        'Novel', 
        'Modern Chinese literature', 
        3000, 
        1, 
        '', 
        'Live for life itself'
      ],
      [
        'Sapiens', 
        'Harari', 
        'Fan Deng', 
        `${baseUrl}history%20book%20cover&image_size=square_hd`, 
        'History', 
        'Anthropology', 
        'Human evolution story', 
        6000, 
        0, 
        '', 
        'Money is trust'
      ]
    ];

    for (const book of books) {
      insertBook.run(...book);
    }

    const insertBanner = db.prepare(`
      INSERT INTO banners (title, image, link, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    const banners = [
      ['VIP Special Offer', `${baseUrl}vip%20promotion%20banner&image_size=square_hd`, '/vip', 1],
      ['New Book Release', `${baseUrl}new%20book%20banner&image_size=square_hd`, '/book/2', 2],
      ['Business Course', `${baseUrl}course%20banner&image_size=square_hd`, '/courses', 3]
    ];

    for (const banner of banners) {
      insertBanner.run(...banner);
    }

    const insertHotSearch = db.prepare(`
      INSERT INTO hot_searches (keyword, search_count, sort_order)
      VALUES (?, ?, ?)
    `);

    const hotSearches = [
      ['Lunyu', 12580, 1],
      ['Art of War', 9860, 2],
      ['7 Habits', 8420, 3],
      ['Sapiens', 7650, 4],
      ['Business', 6890, 5]
    ];

    for (const hs of hotSearches) {
      insertHotSearch.run(...hs);
    }

    const insertCourse = db.prepare(`
      INSERT INTO courses (title, cover, category, teacher, intro, price, original_price, lesson_count, student_count, is_free)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const courses = [
      ['Business Thinking Mastery', `${baseUrl}business%20course%20cover&image_size=square_hd`, 'Business', 'Fan Deng', 'Learn essential business thinking and strategies for success', 199, 399, 24, 12580, 0],
      ['Communication Skills', `${baseUrl}communication%20course%20cover&image_size=square_hd`, 'Career', 'Teacher Chen', 'Master the art of effective communication', 99, 199, 12, 8960, 0],
      ['Parenting Essentials', `${baseUrl}parenting%20course%20cover&image_size=square_hd`, 'Family', 'Teacher Li', 'Essential parenting skills for modern families', 149, 299, 18, 6750, 1],
      ['Mindfulness Journey', `${baseUrl}mindfulness%20course%20cover&image_size=square_hd`, 'Psychology', 'Teacher Zhang', 'Find inner peace through mindfulness practice', 129, 259, 15, 5420, 0],
      ['Personal Growth', `${baseUrl}growth%20course%20cover&image_size=square_hd`, 'Growth', 'Fan Deng', 'Unlock your potential and achieve personal growth', 159, 319, 20, 9870, 0]
    ];

    for (const course of courses) {
      insertCourse.run(...course);
    }

    const insertLesson = db.prepare(`
      INSERT INTO course_lessons (course_id, title, duration, is_free, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (let courseId = 1; courseId <= 5; courseId++) {
      const lessonCount = [24, 12, 18, 15, 20][courseId - 1];
      for (let i = 1; i <= lessonCount; i++) {
        insertLesson.run(
          courseId, 
          `Lesson ${i}: Core Content of This Section`, 
          1800 + Math.floor(Math.random() * 1200), 
          i <= 3 ? 1 : 0, 
          i
        );
      }
    }
  }

  db.close();
  console.log('Database initialized');
}
