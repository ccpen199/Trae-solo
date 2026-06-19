import type { Database as DbType } from 'better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

let db: DbType;

export function initDB(): DbType {
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedInitialData();

  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT UNIQUE,
      unionid TEXT,
      nickname TEXT,
      avatar TEXT,
      phone TEXT,
      coins INTEGER DEFAULT 0,
      cash_balance REAL DEFAULT 0,
      total_earned_coins INTEGER DEFAULT 0,
      total_withdrawn REAL DEFAULT 0,
      inviter_id INTEGER,
      device_id TEXT,
      device_fingerprint TEXT,
      ip TEXT,
      region TEXT,
      level INTEGER DEFAULT 1,
      is_blocked INTEGER DEFAULT 0,
      is_cheater INTEGER DEFAULT 0,
      risk_score INTEGER DEFAULT 0,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_device ON users(device_id);
    CREATE INDEX IF NOT EXISTS idx_users_inviter ON users(inviter_id);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      reward_coins INTEGER DEFAULT 0,
      reward_cash REAL DEFAULT 0,
      daily_limit INTEGER DEFAULT 1,
      total_limit INTEGER DEFAULT 0,
      start_time DATETIME,
      end_time DATETIME,
      target_regions TEXT,
      target_user_level INTEGER DEFAULT 0,
      min_new_users INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_hot INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      ext_config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      task_date DATE NOT NULL,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      target INTEGER DEFAULT 0,
      reward_coins INTEGER DEFAULT 0,
      reward_cash REAL DEFAULT 0,
      completed_at DATETIME,
      claimed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, task_id, task_date)
    );

    CREATE INDEX IF NOT EXISTS idx_user_tasks_user ON user_tasks(user_id, task_date);

    CREATE TABLE IF NOT EXISTS coin_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      change INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      type TEXT NOT NULL,
      biz_id INTEGER,
      biz_type TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_coin_records_user ON coin_records(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS cash_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      change REAL NOT NULL,
      balance_after REAL NOT NULL,
      type TEXT NOT NULL,
      biz_id INTEGER,
      biz_type TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_cash_records_user ON cash_records(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      fee REAL DEFAULT 0,
      actual_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      channel TEXT DEFAULT 'wechat',
      wx_openid TEXT,
      transaction_id TEXT,
      risk_level TEXT DEFAULT 'low',
      risk_reason TEXT,
      audited_at DATETIME,
      auditor TEXT,
      paid_at DATETIME,
      failed_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inviter_id INTEGER NOT NULL,
      invitee_id INTEGER NOT NULL,
      level INTEGER DEFAULT 1,
      reward_coins INTEGER DEFAULT 0,
      reward_cash REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(inviter_id, invitee_id)
    );

    CREATE INDEX IF NOT EXISTS idx_invitations_inviter ON invitations(inviter_id);
    CREATE INDEX IF NOT EXISTS idx_invitations_invitee ON invitations(invitee_id);

    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      checkin_date DATE NOT NULL,
      continuous_days INTEGER DEFAULT 1,
      reward_coins INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, checkin_date)
    );

    CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins(user_id, checkin_date DESC);

    CREATE TABLE IF NOT EXISTS step_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      step_date DATE NOT NULL,
      steps INTEGER DEFAULT 0,
      reward_coins INTEGER DEFAULT 0,
      is_claimed INTEGER DEFAULT 0,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, step_date)
    );

    CREATE INDEX IF NOT EXISTS idx_step_records_user ON step_records(user_id, step_date DESC);

    CREATE TABLE IF NOT EXISTS video_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      video_id TEXT,
      duration INTEGER DEFAULT 0,
      watch_duration INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      reward_coins INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_video_records_user ON video_records(user_id, date(created_at));

    CREATE TABLE IF NOT EXISTS risk_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      device_id TEXT,
      ip TEXT,
      event_type TEXT NOT NULL,
      risk_level TEXT DEFAULT 'medium',
      details TEXT,
      is_handled INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_risk_events_type ON risk_events(event_type, created_at DESC);

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ad_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      position TEXT NOT NULL,
      ad_unit_id TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      ext_config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ad_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_id INTEGER NOT NULL,
      stat_date DATE NOT NULL,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(ad_id, stat_date)
    );
  `);
}

function seedInitialData() {
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
  if (taskCount.count === 0) {
    const insertTask = db.prepare(`
      INSERT INTO tasks (name, description, type, reward_coins, daily_limit, is_hot, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertTask.run('每日签到', '每日签到领取金币奖励', 'checkin', 20, 1, 1, 1);
    insertTask.run('步数兑换', '走路也能赚金币，每日上限10000步', 'steps', 0, 1, 1, 2);
    insertTask.run('观看视频', '观看完播视频获得金币奖励', 'video', 50, 10, 1, 3);
    insertTask.run('邀请好友', '邀请好友注册，双方各得奖励', 'invite', 500, 0, 1, 4);
  }

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
  if (adminCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin_users (username, password, role) VALUES (?, ?, ?)')
      .run('admin', hash, 'super');
  }
}

export function getDB(): DbType {
  if (!db) {
    initDB();
  }
  return db;
}
