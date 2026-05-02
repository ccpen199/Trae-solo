const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      role TEXT NOT NULL DEFAULT 'player',
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      start_date DATETIME,
      end_date DATETIME,
      config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS match_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT UNIQUE NOT NULL,
      season_id INTEGER NOT NULL,
      game_mode TEXT NOT NULL,
      match_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      start_time DATETIME,
      end_time DATETIME,
      report_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES seasons(id)
    );

    CREATE TABLE IF NOT EXISTS player_match_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_record_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      team_id TEXT,
      position TEXT,
      kills INTEGER DEFAULT 0,
      deaths INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      damage_dealt INTEGER DEFAULT 0,
      damage_taken INTEGER DEFAULT 0,
      gold_earned INTEGER DEFAULT 0,
      win BOOLEAN DEFAULT 0,
      performance_score REAL DEFAULT 0,
      extra_stats TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (match_record_id) REFERENCES match_records(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(match_record_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS point_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      game_mode TEXT NOT NULL,
      match_type TEXT NOT NULL,
      rule_type TEXT NOT NULL DEFAULT 'base',
      condition TEXT,
      points INTEGER NOT NULL DEFAULT 0,
      multiplier REAL DEFAULT 1.0,
      priority INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_season_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      season_id INTEGER NOT NULL,
      total_points INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      matches_played INTEGER DEFAULT 0,
      win_rate REAL DEFAULT 0,
      rank TEXT DEFAULT 'unranked',
      rank_points INTEGER DEFAULT 0,
      last_match_id INTEGER,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (season_id) REFERENCES seasons(id),
      UNIQUE(user_id, season_id)
    );

    CREATE TABLE IF NOT EXISTS point_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      season_id INTEGER NOT NULL,
      match_record_id INTEGER,
      transaction_type TEXT NOT NULL,
      points_change INTEGER NOT NULL,
      balance_before INTEGER DEFAULT 0,
      balance_after INTEGER DEFAULT 0,
      reason TEXT,
      rule_ids TEXT,
      reference_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (season_id) REFERENCES seasons(id),
      FOREIGN KEY (match_record_id) REFERENCES match_records(id)
    );

    CREATE TABLE IF NOT EXISTS leaderboards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      season_id INTEGER,
      game_mode TEXT,
      match_type TEXT,
      rank_type TEXT NOT NULL DEFAULT 'points',
      status TEXT NOT NULL DEFAULT 'active',
      refresh_interval INTEGER DEFAULT 300,
      last_refreshed DATETIME,
      config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES seasons(id)
    );

    CREATE TABLE IF NOT EXISTS leaderboard_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leaderboard_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rank INTEGER NOT NULL,
      previous_rank INTEGER,
      score INTEGER NOT NULL,
      previous_score INTEGER,
      metadata TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(leaderboard_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      season_id INTEGER,
      reward_type TEXT NOT NULL,
      condition_type TEXT NOT NULL,
      condition_value TEXT,
      reward_data TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES seasons(id)
    );

    CREATE TABLE IF NOT EXISTS user_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reward_id INTEGER NOT NULL,
      season_id INTEGER,
      status TEXT NOT NULL DEFAULT 'eligible',
      claimed_at DATETIME,
      claim_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reward_id) REFERENCES rewards(id),
      FOREIGN KEY (season_id) REFERENCES seasons(id)
    );

    CREATE TABLE IF NOT EXISTS anti_cheat_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_record_id INTEGER,
      detection_type TEXT NOT NULL,
      detection_score REAL,
      evidence_data TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewer_id INTEGER,
      review_note TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (match_record_id) REFERENCES match_records(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS workflow_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      current_state TEXT NOT NULL,
      previous_state TEXT,
      transition_data TEXT,
      actor_id INTEGER,
      actor_role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_match_records_season ON match_records(season_id);
    CREATE INDEX IF NOT EXISTS idx_match_records_status ON match_records(status);
    CREATE INDEX IF NOT EXISTS idx_player_stats_user ON player_match_stats(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_points_user_season ON user_season_points(user_id, season_id);
    CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON leaderboard_entries(leaderboard_id, rank);
    CREATE INDEX IF NOT EXISTS idx_workflow_entity ON workflow_states(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);
};

const initData = () => {
  const bcrypt = require('bcryptjs');

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, password, nickname, role, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, '系统管理员', 'admin', 'active');
  }

  const operatorExists = db.prepare('SELECT id FROM users WHERE username = ?').get('operator');
  if (!operatorExists) {
    const hashedPassword = bcrypt.hashSync('operator123', 10);
    db.prepare(`
      INSERT INTO users (username, password, nickname, role, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('operator', hashedPassword, '运营人员', 'operator', 'active');
  }

  const customerServiceExists = db.prepare('SELECT id FROM users WHERE username = ?').get('cs');
  if (!customerServiceExists) {
    const hashedPassword = bcrypt.hashSync('cs123', 10);
    db.prepare(`
      INSERT INTO users (username, password, nickname, role, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('cs', hashedPassword, '客服人员', 'customer_service', 'active');
  }

  const antiCheatExists = db.prepare('SELECT id FROM users WHERE username = ?').get('anticheat');
  if (!antiCheatExists) {
    const hashedPassword = bcrypt.hashSync('anticheat123', 10);
    db.prepare(`
      INSERT INTO users (username, password, nickname, role, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('anticheat', hashedPassword, '反作弊审核', 'anticheat', 'active');
  }

  for (let i = 1; i <= 10; i++) {
    const username = `player${i}`;
    const playerExists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!playerExists) {
      const hashedPassword = bcrypt.hashSync('player123', 10);
      db.prepare(`
        INSERT INTO users (username, password, nickname, role, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(username, hashedPassword, `玩家${i}`, 'player', 'active');
    }
  }

  const activeSeason = db.prepare('SELECT id FROM seasons WHERE status = ?').get('active');
  if (!activeSeason) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    db.prepare(`
      INSERT INTO seasons (name, description, status, start_date, end_date, config)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'S1 荣耀赛季',
      '第一赛季，开启荣耀之旅',
      'active',
      startDate.toISOString(),
      endDate.toISOString(),
      JSON.stringify({
        rankSystem: {
          ranks: [
            { name: '青铜', minPoints: 0 },
            { name: '白银', minPoints: 1000 },
            { name: '黄金', minPoints: 2000 },
            { name: '铂金', minPoints: 3500 },
            { name: '钻石', minPoints: 5000 },
            { name: '大师', minPoints: 7500 },
            { name: '王者', minPoints: 10000 }
          ]
        }
      })
    );
  }

  const pointRules = db.prepare('SELECT COUNT(*) as count FROM point_rules').get();
  if (pointRules.count === 0) {
    const rules = [
      { name: '胜利基础分', game_mode: 'default', match_type: 'ranked', rule_type: 'base', condition: 'win = true', points: 25, multiplier: 1.0, priority: 1, description: '排位赛胜利获得25基础分' },
      { name: '失败基础分', game_mode: 'default', match_type: 'ranked', rule_type: 'base', condition: 'win = false', points: 5, multiplier: 1.0, priority: 1, description: '排位赛失败获得5基础分' },
      { name: '击杀奖励', game_mode: 'default', match_type: 'any', rule_type: 'performance', condition: 'kills > 0', points: 2, multiplier: 1.0, priority: 2, description: '每击杀1人获得2分' },
      { name: '助攻奖励', game_mode: 'default', match_type: 'any', rule_type: 'performance', condition: 'assists > 0', points: 1, multiplier: 1.0, priority: 2, description: '每助攻1人获得1分' },
      { name: '连胜加成', game_mode: 'default', match_type: 'ranked', rule_type: 'bonus', condition: 'consecutive_wins >= 3', points: 0, multiplier: 1.2, priority: 3, description: '3连胜及以上积分加成20%' },
      { name: 'MVP加成', game_mode: 'default', match_type: 'any', rule_type: 'bonus', condition: 'is_mvp = true', points: 10, multiplier: 1.0, priority: 3, description: '获得MVP额外加10分' }
    ];

    const insertRule = db.prepare(`
      INSERT INTO point_rules (name, game_mode, match_type, rule_type, condition, points, multiplier, priority, status, description)
      VALUES (@name, @game_mode, @match_type, @rule_type, @condition, @points, @multiplier, @priority, 'active', @description)
    `);

    for (const rule of rules) {
      insertRule.run(rule);
    }
  }

  const leaderboards = db.prepare('SELECT COUNT(*) as count FROM leaderboards').get();
  if (leaderboards.count === 0) {
    const activeSeason = db.prepare('SELECT id FROM seasons WHERE status = ?').get('active');
    if (activeSeason) {
      db.prepare(`
        INSERT INTO leaderboards (name, season_id, game_mode, match_type, rank_type, status, refresh_interval, config)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        '全服总积分排行',
        activeSeason.id,
        'default',
        'any',
        'points',
        'active',
        60,
        JSON.stringify({ limit: 100, includeUnranked: false })
      );

      db.prepare(`
        INSERT INTO leaderboards (name, season_id, game_mode, match_type, rank_type, status, refresh_interval, config)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        '排位赛积分排行',
        activeSeason.id,
        'default',
        'ranked',
        'points',
        'active',
        60,
        JSON.stringify({ limit: 100 })
      );
    }
  }
};

const init = () => {
  initTables();
  initData();
  console.log('数据库初始化完成');
};

module.exports = { db, init };
