const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initDatabase = () => {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      nickname TEXT,
      avatar TEXT,
      total_score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 游戏类型表
    CREATE TABLE IF NOT EXISTS game_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      icon TEXT,
      min_players INTEGER DEFAULT 1,
      max_players INTEGER DEFAULT 4,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 关卡表
    CREATE TABLE IF NOT EXISTS levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_type_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      level_number INTEGER NOT NULL,
      description TEXT,
      difficulty TEXT NOT NULL DEFAULT 'easy',
      score_points INTEGER DEFAULT 100,
      config TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_type_id) REFERENCES game_types(id)
    );

    -- 积分记录表
    CREATE TABLE IF NOT EXISTS score_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_type_id INTEGER NOT NULL,
      level_id INTEGER,
      score INTEGER NOT NULL,
      game_session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (game_type_id) REFERENCES game_types(id),
      FOREIGN KEY (level_id) REFERENCES levels(id)
    );

    -- 游戏房间表（用于互动游戏）
    CREATE TABLE IF NOT EXISTS game_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT UNIQUE NOT NULL,
      game_type_id INTEGER NOT NULL,
      host_id INTEGER NOT NULL,
      status TEXT DEFAULT 'waiting',
      max_players INTEGER DEFAULT 4,
      config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_type_id) REFERENCES game_types(id),
      FOREIGN KEY (host_id) REFERENCES users(id)
    );

    -- 房间玩家表
    CREATE TABLE IF NOT EXISTS room_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_ready INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES game_rooms(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(room_id, user_id)
    );

    -- 老师-学生关系表
    CREATE TABLE IF NOT EXISTS teacher_student (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id),
      FOREIGN KEY (student_id) REFERENCES users(id),
      UNIQUE(teacher_id, student_id)
    );
  `);

  const gameTypes = [
    { name: '知识问答', code: 'quiz', description: '回答各种知识问题，测试你的知识储备', category: 'quiz', icon: '🎯', min_players: 1, max_players: 4 },
    { name: '记忆挑战', code: 'memory', description: '翻开卡片，找到相同的配对，训练记忆力', category: 'puzzle', icon: '🧠', min_players: 1, max_players: 2 },
    { name: '拼图游戏', code: 'puzzle', description: '将打乱的图片拼回完整，训练观察力', category: 'puzzle', icon: '🧩', min_players: 1, max_players: 1 },
    { name: '连连看', code: 'linklink', description: '连接相同的图案，经典休闲游戏', category: 'puzzle', icon: '🔗', min_players: 1, max_players: 2 },
    { name: '五子棋', code: 'gomoku', description: '策略对战，先连成五子获胜', category: 'strategy', icon: '⚫', min_players: 2, max_players: 2 },
    { name: '猜词游戏', code: 'charades', description: '一个人描述，其他人猜词', category: 'interactive', icon: '💬', min_players: 2, max_players: 8 },
    { name: '数学竞速', code: 'mathrace', description: '快速计算数学题，比拼速度和准确性', category: 'quiz', icon: '🔢', min_players: 1, max_players: 4 },
    { name: '成语接龙', code: 'idiom', description: '成语接龙，考验语文积累', category: 'interactive', icon: '📚', min_players: 2, max_players: 6 },
  ];

  const insertGameType = db.prepare(`
    INSERT OR IGNORE INTO game_types (name, code, description, category, icon, min_players, max_players)
    VALUES (@name, @code, @description, @category, @icon, @min_players, @max_players)
  `);

  for (const gameType of gameTypes) {
    insertGameType.run(gameType);
  }

  const existingLevels = db.prepare('SELECT COUNT(*) as count FROM levels').get();
  if (existingLevels.count === 0) {
    const insertLevel = db.prepare(`
      INSERT INTO levels (game_type_id, name, level_number, difficulty, score_points, config)
      VALUES (@game_type_id, @name, @level_number, @difficulty, @score_points, @config)
    `);

    const quizLevels = [
      { game_type_id: 1, name: '初级入门', level_number: 1, difficulty: 'easy', score_points: 50, config: '{"questionCount": 5, "timeLimit": 60}' },
      { game_type_id: 1, name: '进阶挑战', level_number: 2, difficulty: 'medium', score_points: 100, config: '{"questionCount": 10, "timeLimit": 90}' },
      { game_type_id: 1, name: '大师级别', level_number: 3, difficulty: 'hard', score_points: 200, config: '{"questionCount": 15, "timeLimit": 120}' },
    ];

    const memoryLevels = [
      { game_type_id: 2, name: '初级记忆', level_number: 1, difficulty: 'easy', score_points: 50, config: '{"pairs": 6, "timeLimit": 120}' },
      { game_type_id: 2, name: '中级记忆', level_number: 2, difficulty: 'medium', score_points: 100, config: '{"pairs": 10, "timeLimit": 180}' },
      { game_type_id: 2, name: '高级记忆', level_number: 3, difficulty: 'hard', score_points: 200, config: '{"pairs": 15, "timeLimit": 240}' },
    ];

    for (const level of [...quizLevels, ...memoryLevels]) {
      insertLevel.run(level);
    }
  }

  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('123456', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (username, password, role, nickname, avatar, total_score)
      VALUES (@username, @password, @role, @nickname, @avatar, @total_score)
    `);

    insertUser.run({
      username: 'teacher1',
      password: hashedPassword,
      role: 'teacher',
      nickname: '张老师',
      avatar: '👨‍🏫',
      total_score: 0
    });

    insertUser.run({
      username: 'student1',
      password: hashedPassword,
      role: 'student',
      nickname: '小明',
      avatar: '👦',
      total_score: 1500
    });

    insertUser.run({
      username: 'student2',
      password: hashedPassword,
      role: 'student',
      nickname: '小红',
      avatar: '👧',
      total_score: 2300
    });

    insertUser.run({
      username: 'student3',
      password: hashedPassword,
      role: 'student',
      nickname: '小华',
      avatar: '🧒',
      total_score: 800
    });

    console.log('初始化数据完成');
    console.log('默认账号: teacher1/123456 (老师), student1/123456 (学生)');
  }
};

initDatabase();

module.exports = db;
