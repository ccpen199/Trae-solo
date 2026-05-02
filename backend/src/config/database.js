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

console.log('成功连接到 SQLite 数据库');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_code TEXT UNIQUE NOT NULL,
      role_name TEXT NOT NULL,
      description TEXT,
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_uuid TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE,
      password TEXT,
      role_code TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'active',
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_code) REFERENCES roles(role_code)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_uuid TEXT UNIQUE NOT NULL,
      task_code TEXT UNIQUE,
      task_name TEXT NOT NULL,
      task_type TEXT NOT NULL,
      description TEXT,
      trigger_event_code TEXT,
      target_count INTEGER DEFAULT 1,
      priority INTEGER DEFAULT 0,
      is_daily INTEGER DEFAULT 0,
      is_repeatable INTEGER DEFAULT 0,
      max_repeat_count INTEGER DEFAULT 1,
      start_time DATETIME,
      end_time DATETIME,
      status TEXT DEFAULT 'draft',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trigger_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_uuid TEXT UNIQUE NOT NULL,
      event_code TEXT UNIQUE NOT NULL,
      event_name TEXT NOT NULL,
      event_type TEXT NOT NULL,
      description TEXT,
      event_schema TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS progresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      progress_uuid TEXT UNIQUE NOT NULL,
      user_uuid TEXT NOT NULL,
      task_uuid TEXT NOT NULL,
      current_count INTEGER DEFAULT 0,
      target_count INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      last_triggered_at DATETIME,
      completed_at DATETIME,
      repeat_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_uuid) REFERENCES tasks(task_uuid)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      achievement_uuid TEXT UNIQUE NOT NULL,
      achievement_code TEXT UNIQUE,
      achievement_name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      rarity TEXT DEFAULT 'common',
      required_task_uuids TEXT,
      is_hidden INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reward_uuid TEXT UNIQUE NOT NULL,
      reward_code TEXT UNIQUE,
      reward_name TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      reward_value TEXT,
      description TEXT,
      icon TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_reward_uuid TEXT UNIQUE NOT NULL,
      task_uuid TEXT NOT NULL,
      reward_uuid TEXT NOT NULL,
      reward_quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_uuid) REFERENCES tasks(task_uuid),
      FOREIGN KEY (reward_uuid) REFERENCES rewards(reward_uuid)
    );

    CREATE TABLE IF NOT EXISTS achievement_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      achievement_reward_uuid TEXT UNIQUE NOT NULL,
      achievement_uuid TEXT NOT NULL,
      reward_uuid TEXT NOT NULL,
      reward_quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (achievement_uuid) REFERENCES achievements(achievement_uuid),
      FOREIGN KEY (reward_uuid) REFERENCES rewards(reward_uuid)
    );

    CREATE TABLE IF NOT EXISTS user_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_reward_uuid TEXT UNIQUE NOT NULL,
      user_uuid TEXT NOT NULL,
      reward_uuid TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_uuid TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      granted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_achievement_uuid TEXT UNIQUE NOT NULL,
      user_uuid TEXT NOT NULL,
      achievement_uuid TEXT NOT NULL,
      unlocked_at DATETIME,
      status TEXT DEFAULT 'locked',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tracking_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_uuid TEXT UNIQUE NOT NULL,
      user_uuid TEXT,
      event_code TEXT NOT NULL,
      event_data TEXT,
      event_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      source TEXT,
      session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_uuid TEXT UNIQUE NOT NULL,
      operator_uuid TEXT,
      operator_role TEXT,
      action_type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_uuid TEXT,
      old_value TEXT,
      new_value TEXT,
      description TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      history_uuid TEXT UNIQUE NOT NULL,
      task_uuid TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      operator_uuid TEXT,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_uuid) REFERENCES tasks(task_uuid)
    );
  `);

  const initRoles = db.prepare(`
    INSERT OR IGNORE INTO roles (role_code, role_name, description, permissions) VALUES
    ('player', '玩家', '游戏玩家，参与任务和成就', 'view_tasks,view_progress,view_achievements,view_rewards,trigger_events'),
    ('planner', '策划', '任务和成就配置人员', 'manage_tasks,manage_triggers,manage_achievements,manage_rewards,view_reports'),
    ('operator', '运营', '运营人员，查看数据和调整配置', 'view_tasks,view_achievements,view_rewards,view_reports,view_analytics,adjust_config'),
    ('customer_service', '客服', '客服人员，处理玩家问题', 'view_users,view_progress,view_audits,handle_issues')
  `);
  initRoles.run();

  const initAdminUser = db.prepare(`
    INSERT OR IGNORE INTO users (user_uuid, username, password, role_code, nickname, status) VALUES
    ('admin-001', 'admin', 'admin123', 'planner', '管理员', 'active'),
    ('player-001', 'player1', 'player123', 'player', '测试玩家1', 'active'),
    ('player-002', 'player2', 'player123', 'player', '测试玩家2', 'active')
  `);
  initAdminUser.run();

  const initTriggerEvents = db.prepare(`
    INSERT OR IGNORE INTO trigger_events (event_uuid, event_code, event_name, event_type, description, event_schema, status) VALUES
    ('event-login', 'user_login', '用户登录', 'user_action', '玩家登录游戏', '{"user_uuid":"string","login_time":"datetime"}', 'active'),
    ('event-quest', 'complete_quest', '完成任务', 'game_action', '玩家完成游戏内任务', '{"user_uuid":"string","quest_id":"string","reward_type":"string"}', 'active'),
    ('event-battle', 'win_battle', '战斗胜利', 'game_action', '玩家在战斗中获胜', '{"user_uuid":"string","battle_type":"string","enemy_level":"integer"}', 'active'),
    ('event-collect', 'collect_item', '收集物品', 'game_action', '玩家收集物品', '{"user_uuid":"string","item_type":"string","item_count":"integer"}', 'active'),
    ('event-level', 'level_up', '等级提升', 'user_action', '玩家等级提升', '{"user_uuid":"string","old_level":"integer","new_level":"integer"}', 'active')
  `);
  initTriggerEvents.run();

  const initRewards = db.prepare(`
    INSERT OR IGNORE INTO rewards (reward_uuid, reward_code, reward_name, reward_type, reward_value, description, icon, status) VALUES
    ('reward-gold-100', 'gold_100', '金币100', 'currency', '100', '游戏内通用货币', 'icon-gold', 'active'),
    ('reward-exp-500', 'exp_500', '经验值500', 'exp', '500', '角色升级所需经验', 'icon-exp', 'active'),
    ('reward-item-sword', 'rare_sword', '稀有宝剑', 'item', 'sword_001', '攻击力+50的稀有武器', 'icon-sword', 'active'),
    ('reward-gem-10', 'gem_10', '宝石10个', 'premium_currency', '10', '可用于特殊购买的付费货币', 'icon-gem', 'active')
  `);
  initRewards.run();
};

initTables();

const run = (sql, params = []) => {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return { lastID: result.lastInsertRowid, changes: result.changes };
};

const get = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

const all = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

module.exports = {
  db,
  run,
  get,
  all
};
