require('dotenv').config({ path: '../../.env' });
const db = require('../config/database');
const bcrypt = require('bcryptjs');

const initDatabase = () => {
  console.log('创建数据库表...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      nickname TEXT,
      avatar TEXT,
      bio TEXT,
      gender TEXT,
      birth_month TEXT,
      interests TEXT,
      is_guest INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      follower_count INTEGER DEFAULT 0,
      question_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      view_count INTEGER DEFAULT 0,
      answer_count INTEGER DEFAULT 0,
      follow_count INTEGER DEFAULT 0,
      is_paid INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS question_topics (
      question_id INTEGER NOT NULL,
      topic_id INTEGER NOT NULL,
      PRIMARY KEY (question_id, topic_id),
      FOREIGN KEY (question_id) REFERENCES questions(id),
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      vote_up INTEGER DEFAULT 0,
      vote_down INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      is_accepted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      cover_image TEXT,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      collect_count INTEGER DEFAULT 0,
      is_paid INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      cover_image TEXT,
      duration INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS thoughts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      images TEXT,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      parent_id INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_follows (
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS topic_follows (
      user_id INTEGER NOT NULL,
      topic_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, topic_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    );

    CREATE TABLE IF NOT EXISTS question_follows (
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, question_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS collections (
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, target_type, target_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      vote_type INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, target_type, target_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, target_type, target_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      related_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS member_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_type TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      start_date DATETIME,
      end_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS salt_columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      author_id INTEGER NOT NULL,
      price REAL NOT NULL,
      chapter_count INTEGER DEFAULT 0,
      subscriber_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
  `);

  console.log('数据库表创建完成');
};

const initSampleData = () => {
  console.log('创建示例数据...');
  
  const topics = [
    '人工智能', '编程', '产品设计', '创业', '投资',
    '心理学', '健康', '职场', '教育', '生活方式'
  ];
  
  const insertTopic = db.prepare('INSERT OR IGNORE INTO topics (name, description) VALUES (?, ?)');
  topics.forEach(topic => {
    insertTopic.run(topic, `${topic}相关的讨论和知识分享`);
  });

  const hashedPassword = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password, nickname, bio, is_guest)
    VALUES (?, ?, ?, ?, ?, 0)
  `);
  
  const result = insertUser.run('demo', 'demo@example.com', hashedPassword, '演示用户', '这是一个演示账号');
  const userId = result.lastInsertRowid || 1;

  const sampleQuestions = [
    { title: '如何学习人工智能？', content: '想入门AI，请问有什么学习路径推荐吗？' },
    { title: '前端开发应该先学什么框架？', content: '刚开始学前端，不知道应该从Vue还是React开始？' },
    { title: '怎样提升产品设计能力？', content: '产品新人，想提升自己的设计思维，有什么建议？' }
  ];

  const insertQuestion = db.prepare('INSERT INTO questions (user_id, title, content) VALUES (?, ?, ?)');
  const insertQuestionTopic = db.prepare('INSERT INTO question_topics (question_id, topic_id) VALUES (?, ?)');

  sampleQuestions.forEach((q, idx) => {
    const qResult = insertQuestion.run(userId, q.title, q.content);
    const questionId = qResult.lastInsertRowid;
    insertQuestionTopic.run(questionId, idx + 1);
  });

  db.prepare('INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)')
    .run(1, userId, '建议从数学基础开始，然后学习Python，再逐步接触机器学习和深度学习。');

  console.log('示例数据创建完成');
};

try {
  initDatabase();
  initSampleData();
  console.log('数据库初始化完成');
  db.close();
  process.exit(0);
} catch (error) {
  console.error('数据库初始化失败:', error);
  db.close();
  process.exit(1);
}
