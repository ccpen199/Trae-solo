import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, '../data/app.sqlite');

const dataDir = join(dirname(DB_PATH));
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH, { verbose: console.log });

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    tier INTEGER DEFAULT 1,
    tier_name TEXT DEFAULT '青铜',
    score INTEGER DEFAULT 1000,
    win_count INTEGER DEFAULT 0,
    lose_count INTEGER DEFAULT 0,
    power INTEGER DEFAULT 1000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS match_queue (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    tier INTEGER NOT NULL,
    power INTEGER NOT NULL,
    win_rate REAL DEFAULT 50.0,
    status TEXT DEFAULT 'waiting',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    matched_at DATETIME,
    expired_at DATETIME
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS battles (
    id TEXT PRIMARY KEY,
    player1_id TEXT NOT NULL,
    player2_id TEXT NOT NULL,
    player1_power INTEGER NOT NULL,
    player2_power INTEGER NOT NULL,
    player1_win_rate REAL NOT NULL,
    player2_win_rate REAL NOT NULL,
    power_diff INTEGER NOT NULL,
    win_rate_diff REAL NOT NULL,
    winner_id TEXT,
    status TEXT DEFAULT 'matching',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    ended_at DATETIME
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS match_requests (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    battle_id TEXT,
    queue_id TEXT,
    request_data TEXT,
    response_data TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS process_logs (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    step TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    status TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertConfig = db.prepare(`
  INSERT OR IGNORE INTO configs (key, value, description) VALUES (?, ?, ?)
`);

db.transaction(() => {
  insertConfig.run(
    'tier_config',
    '[{"name":"青铜","min_score":0,"max_score":1199,"power_bonus":0},{"name":"白银","min_score":1200,"max_score":1399,"power_bonus":50},{"name":"黄金","min_score":1400,"max_score":1599,"power_bonus":100},{"name":"铂金","min_score":1600,"max_score":1799,"power_bonus":150},{"name":"钻石","min_score":1800,"max_score":1999,"power_bonus":200},{"name":"大师","min_score":2000,"max_score":999999,"power_bonus":250}]',
    '段位配置'
  );
  insertConfig.run('match_win_rate_limit', '5.0', '匹配胜率差限制(%)');
  insertConfig.run('match_power_diff_limit', '100', '匹配战力差限制');
  insertConfig.run('match_queue_expire_seconds', '300', '匹配队列过期时间(秒)');
  insertConfig.run('review_enabled', 'true', '是否启用复核功能');
})();

console.log('已连接到 SQLite 数据库');
console.log('数据库初始化完成');

export default db;