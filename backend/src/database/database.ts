import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/gym.db');

export const getDb = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  return db;
};

export const initDb = async () => {
  const db = await getDb();

  await db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 会员表
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      card_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'inactive',
      join_date DATE NOT NULL,
      expiry_date DATE,
      remaining_visits INTEGER DEFAULT 0,
      total_visits INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 套餐表
    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      total_sessions INTEGER NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 会员套餐关联表
    CREATE TABLE IF NOT EXISTS member_packages (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      total_sessions INTEGER NOT NULL,
      remaining_sessions INTEGER NOT NULL,
      purchase_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      business_order_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (package_id) REFERENCES packages(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 课程表
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      trainer_id TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 20,
      duration INTEGER NOT NULL DEFAULT 60,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trainer_id) REFERENCES users(id)
    );

    -- 排课表
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      trainer_id TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 20,
      booked_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (trainer_id) REFERENCES users(id)
    );

    -- 预约表
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      schedule_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      business_order_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (schedule_id) REFERENCES schedules(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 入场记录表
    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      check_in_time DATETIME NOT NULL,
      check_out_time DATETIME,
      status TEXT NOT NULL DEFAULT 'checked_in',
      business_order_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 核销记录表
    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      schedule_id TEXT NOT NULL,
      reservation_id TEXT NOT NULL,
      trainer_id TEXT NOT NULL,
      sessions_deducted INTEGER NOT NULL DEFAULT 1,
      rating INTEGER,
      comment TEXT,
      business_order_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (schedule_id) REFERENCES schedules(id),
      FOREIGN KEY (reservation_id) REFERENCES reservations(id),
      FOREIGN KEY (trainer_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 工单表
    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      assigned_to TEXT NOT NULL,
      description TEXT NOT NULL,
      result TEXT,
      business_order_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    -- 审计日志表
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      business_order_id TEXT,
      operator_id TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    -- 交易记录表
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      sessions INTEGER NOT NULL DEFAULT 0,
      reference_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      business_order_id TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    -- 教练绩效表
    CREATE TABLE IF NOT EXISTS trainer_performances (
      id TEXT PRIMARY KEY,
      trainer_id TEXT NOT NULL,
      date DATE NOT NULL,
      total_sessions INTEGER NOT NULL DEFAULT 0,
      completed_sessions INTEGER NOT NULL DEFAULT 0,
      revenue REAL NOT NULL DEFAULT 0,
      avg_rating REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trainer_id) REFERENCES users(id)
    );

    -- 流失扫描记录表
    CREATE TABLE IF NOT EXISTS retention_scans (
      id TEXT PRIMARY KEY,
      scan_date DATE NOT NULL,
      member_id TEXT NOT NULL,
      last_visit_date DATE,
      days_since_last_visit INTEGER NOT NULL,
      risk_level TEXT NOT NULL,
      generated_work_order_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (generated_work_order_id) REFERENCES work_orders(id)
    );

    -- 创建索引以提高查询性能
    CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
    CREATE INDEX IF NOT EXISTS idx_members_card_number ON members(card_number);
    CREATE INDEX IF NOT EXISTS idx_schedules_trainer_id ON schedules(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time);
    CREATE INDEX IF NOT EXISTS idx_reservations_member_id ON reservations(member_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_schedule_id ON reservations(schedule_id);
    CREATE INDEX IF NOT EXISTS idx_check_ins_member_id ON check_ins(member_id);
    CREATE INDEX IF NOT EXISTS idx_check_ins_check_in_time ON check_ins(check_in_time);
    CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON audit_logs(operator_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_business_order ON transactions(business_order_id);
    CREATE INDEX IF NOT EXISTS idx_retention_scans_scan_date ON retention_scans(scan_date);
  `);

  // 插入初始数据
  await insertInitialData(db);

  await db.close();
  console.log('数据库初始化完成');
};

const insertInitialData = async (db: any) => {
  const bcrypt = require('bcryptjs');
  
  // 检查是否已有数据
  const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (usersCount.count > 0) {
    console.log('数据库已有数据，跳过初始化数据插入');
    return;
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('123456', saltRounds);

  // 创建管理员
  await db.run(`
    INSERT INTO users (id, username, password, role, name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['user_001', 'admin', hashedPassword, 'admin', '系统管理员', '13800000000']);

  // 创建销售经理
  await db.run(`
    INSERT INTO users (id, username, password, role, name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['user_002', 'sales_manager', hashedPassword, 'sales_manager', '张经理', '13800000001']);

  // 创建教练
  await db.run(`
    INSERT INTO users (id, username, password, role, name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['user_003', 'trainer1', hashedPassword, 'trainer', '李教练', '13800000002']);

  await db.run(`
    INSERT INTO users (id, username, password, role, name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['user_004', 'trainer2', hashedPassword, 'trainer', '王教练', '13800000003']);

  // 创建前台
  await db.run(`
    INSERT INTO users (id, username, password, role, name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['user_005', 'receptionist', hashedPassword, 'receptionist', '赵前台', '13800000004']);

  // 创建套餐
  await db.run(`
    INSERT INTO packages (id, name, type, total_sessions, price, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['pkg_001', '月卡', 'time_card', 30, 299, '30天内不限次入场']);

  await db.run(`
    INSERT INTO packages (id, name, type, total_sessions, price, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['pkg_002', '10次卡', 'session_card', 10, 299, '10次入场，有效期6个月']);

  await db.run(`
    INSERT INTO packages (id, name, type, total_sessions, price, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['pkg_003', '20次卡', 'session_card', 20, 499, '20次入场，有效期12个月']);

  await db.run(`
    INSERT INTO packages (id, name, type, total_sessions, price, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['pkg_004', '私教课10节', 'session_card', 10, 2999, '10节私教课，有效期6个月']);

  console.log('初始数据插入完成');
};
