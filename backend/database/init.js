import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbDir = path.dirname(process.env.DB_PATH || './data/app.sqlite');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(process.env.DB_PATH || './data/app.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    keywords TEXT,
    background_image TEXT,
    tags TEXT,
    start_time DATETIME,
    end_time DATETIME,
    status INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    note_count INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER,
    user_id INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    content TEXT,
    images TEXT,
    type TEXT DEFAULT 'image',
    like_count INTEGER DEFAULT 0,
    collect_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
  );

  CREATE TABLE IF NOT EXISTS user_topic_follow (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, topic_id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    user_id INTEGER DEFAULT 1,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id)
  );

  CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
  CREATE INDEX IF NOT EXISTS idx_topics_priority ON topics(priority DESC);
  CREATE INDEX IF NOT EXISTS idx_notes_topic ON notes(topic_id);
  CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_user_topic_follow ON user_topic_follow(user_id, topic_id);
`);

const topicCount = db.prepare('SELECT COUNT(*) as count FROM topics').get().count;
if (topicCount === 0) {
  const insertTopic = db.prepare(`
    INSERT INTO topics (name, description, keywords, tags, priority, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const sampleTopics = [
    ['美食探店', '分享身边的美食，发现隐藏的宝藏餐厅', '美食,探店,餐厅', '美食,生活', 10, 1],
    ['旅行日记', '记录旅途中的美好瞬间，分享旅行攻略', '旅行,攻略,风景', '旅行,生活', 9, 1],
    ['健身打卡', '一起运动健身，记录每日锻炼成果', '健身,运动,打卡', '健身,健康', 8, 1],
    ['穿搭分享', '每日穿搭灵感，时尚搭配技巧', '穿搭,时尚,搭配', '时尚,生活', 7, 1],
    ['护肤心得', '护肤经验分享，好物推荐', '护肤,美妆,好物', '美妆,生活', 6, 1],
  ];

  for (const topic of sampleTopics) {
    insertTopic.run(...topic);
  }

  const insertNote = db.prepare(`
    INSERT INTO notes (topic_id, title, content, images, type)
    VALUES (?, ?, ?, ?, ?)
  `);

  const sampleImages = JSON.stringify([
    'https://picsum.photos/400/400?random=1',
    'https://picsum.photos/400/400?random=2',
    'https://picsum.photos/400/400?random=3',
  ]);

  for (let i = 1; i <= 5; i++) {
    for (let j = 1; j <= 10; j++) {
      insertNote.run(
        i,
        `话题${i}的笔记${j}`,
        `这是话题${i}下的第${j}条笔记内容，分享一些有趣的事情。`,
        sampleImages,
        j % 3 === 0 ? 'video' : 'image'
      );
    }
    db.prepare('UPDATE topics SET note_count = ? WHERE id = ?').run(10, i);
  }
}

console.log('Database initialized successfully');
db.close();
