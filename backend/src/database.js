const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      avatar TEXT,
      points INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host_id TEXT NOT NULL,
      type TEXT NOT NULL,
      max_players INTEGER DEFAULT 8,
      current_players INTEGER DEFAULT 1,
      status TEXT DEFAULT 'waiting',
      popularity INTEGER DEFAULT 0,
      story_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (host_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS room_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'player',
      joined_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(room_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      answer TEXT NOT NULL,
      difficulty TEXT DEFAULT 'easy',
      creator_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      story_id TEXT NOT NULL,
      current_stage TEXT DEFAULT 'questioning',
      started_at INTEGER DEFAULT (strftime('%s', 'now')),
      ended_at INTEGER,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (story_id) REFERENCES stories(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'chat',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'matching',
      matched_room_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id),
      UNIQUE(follower_id, following_id)
    );
  `);

  const storyCount = db.prepare('SELECT COUNT(*) as count FROM stories').get().count;
  if (storyCount === 0) {
    const insertStory = db.prepare(`
      INSERT INTO stories (id, title, content, answer, difficulty, status)
      VALUES (?, ?, ?, ?, ?, 'approved')
    `);
    
    insertStory.run(
      'story_001',
      '海上命案',
      '一名男子在海上航行，某天早上他在甲板上发现了一具尸体，但是他却没有报警，这是为什么？',
      '因为那具尸体是一条鱼，他准备把鱼做成早餐。',
      'easy'
    );
    
    insertStory.run(
      'story_002',
      '半夜敲门声',
      '一个人住在山顶的小屋里，半夜听见有敲门的声音，但是他打开门却没有人，于是去睡了。等了一会又有敲门声，去开门，还是没人，如是者几次。第二天，有人在山脚下发现死尸一具，警察来把山顶的那人带走了。为什么？',
      '因为他的门开在悬崖边，那个人好不容易爬上来，他门一开，就被推下去了。如此几次，那个人摔死了。',
      'medium'
    );
    
    insertStory.run(
      'story_003',
      '水草',
      '有个男子跟他女友去河边散步，突然他的女友掉进河里了，那个男子就急忙跳到水里去找，可没找到他的女友，他伤心的离开了这里。过了几年后，他故地重游，这时看到有个老人家在钓鱼，可那老人家钓上来的鱼身上没有水草，他就问那老人家为什么鱼身上没有沾到一点水草，那老人家说：这河从没有长过水草。说到这时那男子突然跳到水里，自杀了，为什么？',
      '男子曾抓到女友头发，却以为是水草，松手了，女友因此溺亡。得知真相后他愧疚自杀。',
      'hard'
    );
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, nickname, avatar, points)
      VALUES (?, ?, ?, ?)
    `);
    
    insertUser.run('user_001', '海龟达人', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user001', 1500);
    insertUser.run('user_002', '推理新手', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user002', 300);
    insertUser.run('user_003', '故事大王', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user003', 2000);
    insertUser.run('user_004', '吃瓜群众', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user004', 100);
  }
}

module.exports = { db, initDatabase };
