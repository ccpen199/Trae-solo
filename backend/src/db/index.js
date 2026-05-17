import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

export const initDB = () => {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedData();

  return db;
};

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT,
      total_duration INTEGER DEFAULT 0,
      total_calories REAL DEFAULT 0,
      level INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      subcategory TEXT,
      age_group TEXT,
      duration INTEGER DEFAULT 0,
      calories_per_minute REAL DEFAULT 0,
      thumbnail TEXT,
      instructor TEXT,
      is_rehabilitation BOOLEAN DEFAULT 0,
      medical_guidance TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      total_duration INTEGER DEFAULT 0,
      avg_heart_rate REAL,
      max_heart_rate REAL,
      total_calories REAL DEFAULT 0,
      device_connected BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'ongoing',
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    );

    CREATE TABLE IF NOT EXISTS coaches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT,
      title TEXT,
      specialty TEXT,
      is_premium BOOLEAN DEFAULT 0,
      is_certified BOOLEAN DEFAULT 0,
      followers INTEGER DEFAULT 0,
      description TEXT,
      is_new BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rankings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      category TEXT NOT NULL,
      value REAL NOT NULL,
      rank INTEGER,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      deposit_amount REAL NOT NULL,
      target_type TEXT NOT NULL,
      target_value REAL NOT NULL,
      total_pool REAL DEFAULT 0,
      participant_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'upcoming',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS challenge_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      deposit_paid BOOLEAN DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      progress REAL DEFAULT 0,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(challenge_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS exercise_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      calories REAL DEFAULT 0,
      exercise_type TEXT,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
};

const seedData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (name, avatar, total_duration, total_calories, level) VALUES (?, ?, ?, ?, ?)');
    const users = [
      ['张三', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan', 1200, 3500, 5],
      ['李四', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi', 800, 2200, 3],
      ['王五', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu', 2000, 5800, 8],
    ];
    users.forEach(u => insertUser.run(u[0], u[1], u[2], u[3], u[4]));
  }

  const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
  if (courseCount === 0) {
    const insertCourse = db.prepare(`
      INSERT INTO courses (title, description, category, subcategory, age_group, duration, calories_per_minute, instructor, is_rehabilitation, medical_guidance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const courses = [
      ['颈椎康复训练', '针对办公室人群的颈椎放松与康复训练', '运动医学', '颈椎劳损', 'adult', 30, 3.5, '陈医生', 1, '动作缓慢，避免剧烈运动，如有不适立即停止'],
      ['膝关节养护', '中老年人膝关节康复与强化训练', '运动医学', '骨关节疾病', 'elderly', 25, 2.8, '李医生', 1, '注意膝盖保暖，避免深蹲过深'],
      ['青少年体态矫正', '未成年人脊柱健康与体态矫正', '运动医学', '体态矫正', 'teen', 40, 4.2, '王教练', 1, '家长陪同，注意动作规范'],
      ['全身燃脂HIIT', '高强度间歇训练，快速燃脂', '燃脂', 'HIIT', 'adult', 45, 8.5, '张教练', 0, ''],
      ['瑜伽放松', '舒缓身心，提升柔韧性', '瑜伽', '放松', 'all', 60, 2.5, '刘教练', 0, ''],
    ];
    courses.forEach(c => insertCourse.run(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9]));
  }

  const coachCount = db.prepare('SELECT COUNT(*) as count FROM coaches').get().count;
  if (coachCount === 0) {
    const insertCoach = db.prepare(`
      INSERT INTO coaches (name, avatar, title, specialty, is_premium, is_certified, followers, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const coaches = [
      ['陈医生', 'https://api.dicebear.com/7.x/avataaars/svg?seed=drchen', '运动医学专家', '颈椎、腰椎康复', 1, 1, 12580, '从业15年，三甲医院康复科主任'],
      ['李医生', 'https://api.dicebear.com/7.x/avataaars/svg?seed=drli', '骨关节康复专家', '膝关节、踝关节康复', 1, 1, 9860, '运动医学博士，专注骨关节疾病康复'],
      ['王教练', 'https://api.dicebear.com/7.x/avataaars/svg?seed=coachwang', '认证康复教练', '青少年体态矫正', 0, 1, 5420, '国家认证康复教练，5年青少年矫正经验'],
      ['张教练', 'https://api.dicebear.com/7.x/avataaars/svg?seed=coachzhang', '健身教练', 'HIIT、力量训练', 0, 1, 3200, 'ACE认证教练'],
    ];
    coaches.forEach(c => insertCoach.run(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7]));
  }

  const challengeCount = db.prepare('SELECT COUNT(*) as count FROM challenges').get().count;
  if (challengeCount === 0) {
    const insertChallenge = db.prepare(`
      INSERT INTO challenges (title, description, start_date, end_date, deposit_amount, target_type, target_value, total_pool, participant_count, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const challenges = [
      ['7天连续打卡挑战', '连续7天每天运动30分钟，完成者平分保证金', '2024-01-15', '2024-01-21', 19.9, 'duration', 210, 1990, 100, 'ongoing'],
      ['30天减脂挑战', '30天内累计消耗5000卡路里', '2024-01-20', '2024-02-18', 49.9, 'calories', 5000, 4990, 100, 'upcoming'],
    ];
    challenges.forEach(c => insertChallenge.run(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9]));
  }
};

export const getDB = () => {
  if (!db) {
    return initDB();
  }
  return db;
};

export default db;
