// api/app.ts
import express from "express";
import cors from "cors";
import path2 from "path";
import dotenv from "dotenv";
import { fileURLToPath as fileURLToPath2 } from "url";

// api/db.ts
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var DB_PATH = process.env.DB_PATH || path.resolve(__dirname, "../data/app.sqlite");
var db;
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}
function initDb() {
  const db2 = getDb();
  db2.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      customer_type TEXT NOT NULL DEFAULT 'individual',
      role TEXT NOT NULL DEFAULT 'user',
      company_name TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS electricity_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      meter_no TEXT NOT NULL,
      billing_period TEXT NOT NULL,
      usage_kwh REAL NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid',
      due_date TEXT NOT NULL,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS outage_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      area TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS efficiency_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company_name TEXT,
      report_period TEXT NOT NULL,
      peak_usage REAL,
      valley_usage REAL,
      peak_ratio REAL,
      load_rate REAL,
      suggestions TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS pv_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      roof_area REAL,
      monthly_usage REAL,
      recommended_capacity REAL,
      estimated_generation REAL,
      investment REAL,
      payback_years REAL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS carbon_footprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      electricity_co2 REAL DEFAULT 0,
      gas_co2 REAL DEFAULT 0,
      transport_co2 REAL DEFAULT 0,
      total_co2 REAL DEFAULT 0,
      reduction_suggestion TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS smart_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_name TEXT NOT NULL,
      device_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'offline',
      power_consumption REAL DEFAULT 0,
      last_active TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS energy_tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      season TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS points_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      balance INTEGER NOT NULL DEFAULT 0,
      total_earned INTEGER NOT NULL DEFAULT 0,
      total_redeemed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS points_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT,
      reference_id INTEGER,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mall_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL,
      image_url TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS redeem_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      points_cost INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (item_id) REFERENCES mall_items(id)
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      policy_no TEXT,
      publish_date TEXT,
      category TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS safety_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS livestreams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      speaker TEXT,
      description TEXT,
      video_url TEXT,
      live_date TEXT,
      duration INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS enterprise_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      metric_date TEXT NOT NULL,
      peak_kwh REAL DEFAULT 0,
      valley_kwh REAL DEFAULT 0,
      flat_kwh REAL DEFAULT 0,
      peak_cost REAL DEFAULT 0,
      valley_cost REAL DEFAULT 0,
      flat_cost REAL DEFAULT 0,
      max_load_kw REAL DEFAULT 0,
      avg_load_kw REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS load_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_name TEXT NOT NULL,
      load_percentage REAL NOT NULL,
      threshold REAL NOT NULL DEFAULT 80,
      alert_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS usage_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      season TEXT NOT NULL,
      avg_daily_kwh REAL DEFAULT 0,
      avg_monthly_kwh REAL DEFAULT 0,
      peak_hour_start INTEGER DEFAULT 0,
      peak_hour_end INTEGER DEFAULT 0,
      pattern_type TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS green_credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      credit_type TEXT NOT NULL,
      amount REAL NOT NULL,
      source TEXT,
      status TEXT NOT NULL DEFAULT 'issued',
      issued_at TEXT,
      verified_at TEXT,
      expired_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS credit_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credit_id INTEGER NOT NULL,
      verifier TEXT NOT NULL,
      action TEXT NOT NULL,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (credit_id) REFERENCES green_credits(id)
    );

    CREATE TABLE IF NOT EXISTS price_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      audit_period TEXT NOT NULL,
      price_standard REAL NOT NULL,
      actual_price REAL NOT NULL,
      deviation REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS subsidy_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subsidy_type TEXT NOT NULL,
      amount REAL NOT NULL,
      policy_ref TEXT,
      issued_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      audit_trail TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  const userColumns = db2.prepare("PRAGMA table_info(users)").all();
  if (!userColumns.some((column) => column.name === "role")) {
    db2.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }
  seedData(db2);
}
function ensureSeedUsers(db2, users) {
  const selectUser = db2.prepare("SELECT id FROM users WHERE username = ?");
  const insertUser = db2.prepare(`
    INSERT INTO users (username, password, name, email, phone, customer_type, role, company_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateUser = db2.prepare(`
    UPDATE users
    SET password = ?, name = ?, email = ?, phone = ?, customer_type = ?, role = ?, company_name = ?, updated_at = datetime('now','localtime')
    WHERE username = ?
  `);
  for (const user of users) {
    const passwordHash = bcrypt.hashSync(user.password, 10);
    const existing = selectUser.get(user.username);
    if (existing) {
      updateUser.run(
        passwordHash,
        user.name,
        user.email,
        user.phone,
        user.customerType,
        user.role,
        user.companyName,
        user.username
      );
    } else {
      insertUser.run(
        user.username,
        passwordHash,
        user.name,
        user.email,
        user.phone,
        user.customerType,
        user.role,
        user.companyName
      );
    }
  }
}
function seedData(db2) {
  const userCount = db2.prepare("SELECT COUNT(*) as count FROM users").get();
  const hadUsers = userCount.count > 0;
  ensureSeedUsers(db2, [
    {
      username: "admin",
      password: "Admin@123",
      name: "\u7CFB\u7EDF\u7BA1\u7406\u5458",
      email: "admin@csg.cn",
      phone: "13800000000",
      customerType: "admin",
      role: "admin",
      companyName: "\u5357\u65B9\u7535\u7F51"
    },
    {
      username: "platform",
      password: "Platform@123",
      name: "\u5E73\u53F0\u8FD0\u8425\u5458",
      email: "platform@csg.cn",
      phone: "13800000001",
      customerType: "admin",
      role: "platform",
      companyName: "\u5357\u65B9\u7535\u7F51\u8FD0\u8425\u4E2D\u5FC3"
    },
    {
      username: "ops",
      password: "Ops@123",
      name: "\u8FD0\u7EF4\u5DE5\u7A0B\u5E08",
      email: "ops@csg.cn",
      phone: "13800000002",
      customerType: "admin",
      role: "ops",
      companyName: "\u5357\u65B9\u7535\u7F51\u8FD0\u7EF4\u90E8"
    }
  ]);
  if (hadUsers) return;
  const insertUser = db2.prepare(`
    INSERT INTO users (username, password, name, email, phone, customer_type, role, company_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const hash = (pw) => bcrypt.hashSync(pw, 10);
  insertUser.run("zhangsan", hash("123456"), "\u5F20\u4E09", "zhangsan@example.com", "13800001111", "individual", "user", null);
  insertUser.run("lisi", hash("123456"), "\u674E\u56DB\u5BB6\u5EAD", "lisi@example.com", "13800002222", "family", "user", null);
  insertUser.run("wangwu", hash("123456"), "\u738B\u4E94", "wangwu@company.com", "13800003333", "enterprise", "user", "\u5357\u65B9\u79D1\u6280\u6709\u9650\u516C\u53F8");
  insertUser.run("zhaoliu", hash("123456"), "\u8D75\u516D", "zhaoliu@park.com", "13800004444", "park", "user", "\u9AD8\u65B0\u4EA7\u4E1A\u56ED\u533A");
  const insertBill = db2.prepare(`
    INSERT INTO electricity_bills (user_id, meter_no, billing_period, usage_kwh, amount, status, due_date, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const periods = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05"];
  periods.forEach((period, i) => {
    insertBill.run(1, "GD20240001", period, 180 + Math.random() * 80, (180 + Math.random() * 80) * 0.62, i < 3 ? "paid" : "unpaid", "2026-06-15", i < 3 ? "2026-06-10" : null);
    insertBill.run(2, "GD20240002", period, 350 + Math.random() * 120, (350 + Math.random() * 120) * 0.58, i < 2 ? "paid" : "unpaid", "2026-06-15", i < 2 ? "2026-06-08" : null);
    insertBill.run(3, "GD20240003", period, 8e3 + Math.random() * 3e3, (8e3 + Math.random() * 3e3) * 0.85, i < 4 ? "paid" : "unpaid", "2026-06-20", i < 4 ? "2026-06-18" : null);
    insertBill.run(4, "GD20240004", period, 25e3 + Math.random() * 8e3, (25e3 + Math.random() * 8e3) * 0.75, i < 3 ? "paid" : "unpaid", "2026-06-20", i < 3 ? "2026-06-15" : null);
  });
  const insertOutage = db2.prepare(`
    INSERT INTO outage_notifications (title, content, area, start_time, end_time, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertOutage.run("\u8BA1\u5212\u68C0\u4FEE\u505C\u7535\u901A\u77E5", "\u56E0\u7EBF\u8DEF\u68C0\u4FEE\u9700\u8981\uFF0C\u4EE5\u4E0B\u533A\u57DF\u5C06\u8BA1\u5212\u505C\u7535\uFF1A\u5929\u6CB3\u533A\u4E2D\u5C71\u5927\u9053\u6CBF\u7EBF\uFF0C\u9884\u8BA1\u5F71\u54CD\u7EA62000\u6237\u5C45\u6C11\u3002\u8BF7\u63D0\u524D\u505A\u597D\u505C\u7535\u51C6\u5907\u3002", "\u5E7F\u5DDE\u5E02\u5929\u6CB3\u533A", "2026-06-10 08:00", "2026-06-10 18:00", "planned");
  insertOutage.run("\u6545\u969C\u62A2\u4FEE\u505C\u7535\u901A\u77E5", "\u56E0\u7A81\u53D1\u8BBE\u5907\u6545\u969C\uFF0C\u4EE5\u4E0B\u533A\u57DF\u7D27\u6025\u505C\u7535\u62A2\u4FEE\uFF1A\u5357\u5C71\u533A\u79D1\u6280\u56ED\u7247\u533A\uFF0C\u9884\u8BA1\u5F71\u54CD\u7EA6800\u6237\u3002", "\u6DF1\u5733\u5E02\u5357\u5C71\u533A", "2026-06-05 14:00", "2026-06-05 22:00", "active");
  insertOutage.run("\u4E34\u65F6\u505C\u7535\u901A\u77E5", "\u56E0\u53D8\u538B\u5668\u66F4\u6362\u65BD\u5DE5\uFF0C\u4EE5\u4E0B\u533A\u57DF\u4E34\u65F6\u505C\u7535\uFF1A\u7985\u57CE\u533A\u7956\u5E99\u8DEF\u5468\u8FB9\uFF0C\u9884\u8BA1\u5F71\u54CD\u7EA61500\u6237\u3002", "\u4F5B\u5C71\u5E02\u7985\u57CE\u533A", "2026-06-15 09:00", "2026-06-15 17:00", "planned");
  const insertReport = db2.prepare(`
    INSERT INTO efficiency_reports (user_id, company_name, report_period, peak_usage, valley_usage, peak_ratio, load_rate, suggestions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertReport.run(3, "\u5357\u65B9\u79D1\u6280\u6709\u9650\u516C\u53F8", "2026-Q1", 24e3, 8e3, 0.65, 0.78, "\u5EFA\u8BAE\u5C06\u90E8\u5206\u9AD8\u8017\u80FD\u8BBE\u5907\u8F6C\u79FB\u81F3\u8C37\u6BB5\u8FD0\u884C\uFF0C\u9884\u8BA1\u53EF\u964D\u4F4E\u7535\u8D3915%");
  insertReport.run(4, "\u9AD8\u65B0\u4EA7\u4E1A\u56ED\u533A", "2026-Q1", 15e4, 5e4, 0.72, 0.82, "\u5EFA\u8BAE\u4F18\u5316\u56ED\u533A\u7A7A\u8C03\u7CFB\u7EDF\u8FD0\u884C\u7B56\u7565\uFF0C\u5F15\u5165\u84C4\u51B7\u6280\u672F\uFF1B\u8003\u8651\u5B89\u88C5\u5C4B\u9876\u5149\u4F0F");
  const insertPv = db2.prepare(`
    INSERT INTO pv_plans (user_id, roof_area, monthly_usage, recommended_capacity, estimated_generation, investment, payback_years)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertPv.run(2, 80, 400, 10, 1200, 5e4, 6.5);
  insertPv.run(3, 500, 9e3, 80, 9600, 4e5, 5.8);
  insertPv.run(4, 2e3, 28e3, 300, 36e3, 15e5, 5.2);
  const insertCarbon = db2.prepare(`
    INSERT INTO carbon_footprints (user_id, period, electricity_co2, gas_co2, transport_co2, total_co2, reduction_suggestion)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCarbon.run(1, "2026-05", 98, 12, 45, 155, "\u5EFA\u8BAE\u4F7F\u7528\u516C\u5171\u4EA4\u901A\u51FA\u884C\uFF0C\u53EF\u51CF\u5C11\u78B3\u6392\u653E\u7EA630kg/\u6708");
  insertCarbon.run(2, "2026-05", 220, 35, 80, 335, "\u5EFA\u8BAE\u5B89\u88C5\u5C4B\u9876\u5149\u4F0F\u7CFB\u7EDF\uFF0C\u53EF\u62B5\u6D88\u7EA640%\u7528\u7535\u78B3\u6392\u653E");
  insertCarbon.run(3, "2026-Q1", 8500, 1200, 3200, 12900, "\u5EFA\u8BAE\u63A8\u8FDB\u7535\u6C14\u5316\u6539\u9020\uFF0C\u91C7\u7528\u7EFF\u7535\u91C7\u8D2D\u7B56\u7565");
  insertCarbon.run(4, "2026-Q1", 28e3, 4500, 8500, 41e3, "\u5EFA\u8BAE\u5927\u89C4\u6A21\u90E8\u7F72\u5206\u5E03\u5F0F\u5149\u4F0F\uFF0C\u5F15\u5165\u78B3\u4EA4\u6613\u673A\u5236");
  const insertDevice = db2.prepare(`
    INSERT INTO smart_devices (user_id, device_name, device_type, status, power_consumption, last_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertDevice.run(1, "\u5BA2\u5385\u7A7A\u8C03", "ac", "online", 1.5, "2026-06-05 10:30");
  insertDevice.run(1, "\u5BA2\u5385\u706F", "light", "online", 0.05, "2026-06-05 10:30");
  insertDevice.run(2, "\u4E3B\u5367\u7A7A\u8C03", "ac", "online", 1.2, "2026-06-05 09:15");
  insertDevice.run(2, "\u70ED\u6C34\u5668", "heater", "online", 2, "2026-06-05 08:00");
  insertDevice.run(2, "\u667A\u80FD\u63D2\u5EA7", "plug", "offline", 0, "2026-06-04 22:00");
  insertDevice.run(3, "\u4E2D\u592E\u7A7A\u8C03\u7CFB\u7EDF", "ac", "online", 15, "2026-06-05 10:00");
  insertDevice.run(3, "\u7167\u660E\u7CFB\u7EDF", "light", "online", 3, "2026-06-05 10:30");
  const insertTip = db2.prepare(`
    INSERT INTO energy_tips (title, content, category, season)
    VALUES (?, ?, ?, ?)
  `);
  insertTip.run("\u590F\u5B63\u7A7A\u8C03\u8282\u80FD\u6280\u5DE7", "\u5C06\u7A7A\u8C03\u6E29\u5EA6\u8BBE\u7F6E\u572826\xB0C\u4EE5\u4E0A\uFF0C\u6BCF\u63D0\u9AD81\xB0C\u53EF\u8282\u7EA66%-8%\u7684\u7535\u80FD\u3002\u4F7F\u7528\u7761\u7720\u6A21\u5F0F\u53EF\u8FDB\u4E00\u6B65\u964D\u4F4E\u80FD\u8017\u3002\u5B9A\u671F\u6E05\u6D17\u6EE4\u7F51\u53EF\u63D0\u9AD8\u5236\u51B7\u6548\u738715%-20%\u3002", "\u7A7A\u8C03", "summer");
  insertTip.run("\u51AC\u5B63\u53D6\u6696\u8282\u80FD\u6307\u5357", "\u4F18\u5148\u4F7F\u7528\u5730\u6696\u800C\u975E\u7A7A\u8C03\u5236\u70ED\uFF0C\u70ED\u6548\u7387\u66F4\u9AD8\u3002\u5173\u95ED\u65E0\u4EBA\u623F\u95F4\u7684\u6696\u6C14\u9600\u95E8\uFF0C\u53EF\u8282\u7EA620%-30%\u7684\u4F9B\u6696\u80FD\u8017\u3002", "\u53D6\u6696", "winter");
  insertTip.run("\u7167\u660E\u8282\u80FD\u5C0F\u8D34\u58EB", "\u5C06\u4F20\u7EDF\u706F\u6CE1\u66FF\u6362\u4E3ALED\u706F\uFF0C\u53EF\u8282\u7EA675%\u4EE5\u4E0A\u7684\u7167\u660E\u7528\u7535\u3002\u5145\u5206\u5229\u7528\u81EA\u7136\u91C7\u5149\uFF0C\u51CF\u5C11\u767D\u5929\u5F00\u706F\u65F6\u95F4\u3002", "\u7167\u660E", null);
  insertTip.run("\u4F01\u4E1A\u7528\u7535\u4F18\u5316\u5EFA\u8BAE", "\u5408\u7406\u5B89\u6392\u751F\u4EA7\u73ED\u6B21\uFF0C\u5C06\u9AD8\u8017\u80FD\u5DE5\u5E8F\u5B89\u6392\u5728\u8C37\u6BB5\u7535\u4EF7\u65F6\u6BB5\u3002\u5B9A\u671F\u8FDB\u884C\u8BBE\u5907\u80FD\u6548\u8BC4\u4F30\uFF0C\u53CA\u65F6\u6DD8\u6C70\u4F4E\u6548\u8BBE\u5907\u3002", "\u4F01\u4E1A", null);
  insertTip.run("\u65B0\u80FD\u6E90\u5229\u7528\u6307\u5357", "\u5BB6\u5EAD\u53EF\u8003\u8651\u5B89\u88C5\u5C4B\u9876\u5149\u4F0F\u677F\uFF0C\u5E74\u53D1\u7535\u91CF\u53EF\u6EE1\u8DB330%-50%\u7684\u5BB6\u5EAD\u7528\u7535\u9700\u6C42\uFF0C\u6295\u8D44\u56DE\u6536\u671F\u7EA65-7\u5E74\u3002", "\u65B0\u80FD\u6E90", null);
  const insertPoints = db2.prepare(`
    INSERT INTO points_accounts (user_id, balance, total_earned, total_redeemed)
    VALUES (?, ?, ?, ?)
  `);
  insertPoints.run(1, 580, 1200, 620);
  insertPoints.run(2, 1200, 2500, 1300);
  insertPoints.run(3, 3500, 8e3, 4500);
  insertPoints.run(4, 5600, 15e3, 9400);
  const insertPtTxn = db2.prepare(`
    INSERT INTO points_transactions (user_id, type, amount, description, reference_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertPtTxn.run(1, "earn", 100, "\u6708\u5EA6\u8282\u80FD\u5956\u52B1", null);
  insertPtTxn.run(1, "earn", 50, "\u7B7E\u5230\u5956\u52B1", null);
  insertPtTxn.run(1, "redeem", -200, "\u5151\u6362LED\u706F\u6CE1", 1);
  insertPtTxn.run(2, "earn", 300, "\u5149\u4F0F\u53D1\u7535\u5956\u52B1", null);
  insertPtTxn.run(2, "earn", 150, "\u8282\u80FD\u7ADE\u8D5B\u5956\u52B1", null);
  insertPtTxn.run(3, "earn", 800, "\u4F01\u4E1A\u80FD\u6548\u8FBE\u6807\u5956\u52B1", null);
  insertPtTxn.run(3, "redeem", -500, "\u5151\u6362\u667A\u80FD\u7535\u8868", 2);
  const insertMallItem = db2.prepare(`
    INSERT INTO mall_items (name, description, points_cost, stock, category)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertMallItem.run("LED\u8282\u80FD\u706F\u6CE1", "7W LED\u706F\u6CE1\uFF0C\u7B49\u654860W\u767D\u70BD\u706F\uFF0C\u5BFF\u547D25000\u5C0F\u65F6", 200, 500, "\u7167\u660E");
  insertMallItem.run("\u667A\u80FD\u63D2\u5EA7", "\u8FDC\u7A0B\u63A7\u5236\uFF0C\u7528\u7535\u7EDF\u8BA1\uFF0C\u5B9A\u65F6\u5F00\u5173", 500, 200, "\u667A\u80FD\u8BBE\u5907");
  insertMallItem.run("\u667A\u80FD\u6E29\u63A7\u5668", "\u81EA\u52A8\u8C03\u8282\u5BA4\u5185\u6E29\u5EA6\uFF0C\u8282\u80FD20%", 800, 100, "\u667A\u80FD\u8BBE\u5907");
  insertMallItem.run("\u592A\u9633\u80FD\u5145\u7535\u5B9D", "5000mAh\uFF0C\u53CCUSB\u8F93\u51FA", 600, 300, "\u65B0\u80FD\u6E90");
  insertMallItem.run("\u8282\u80FD\u7535\u996D\u7172", "\u4E00\u7EA7\u80FD\u6548\uFF0C\u667A\u80FD\u9884\u7EA6", 1500, 50, "\u5BB6\u7535");
  insertMallItem.run("\u5149\u4F0F\u7EC4\u4EF6\u62B5\u7528\u5238", "\u5C4B\u9876\u5149\u4F0F\u5B89\u88C5\u62B5\u7528500\u5143", 3e3, 20, "\u65B0\u80FD\u6E90");
  const insertPolicy = db2.prepare(`
    INSERT INTO policies (title, content, policy_no, publish_date, category, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertPolicy.run("\u5E7F\u4E1C\u7701\u7535\u529B\u9700\u6C42\u4FA7\u7BA1\u7406\u5B9E\u65BD\u7EC6\u5219", "\u4E3A\u52A0\u5F3A\u7535\u529B\u9700\u6C42\u4FA7\u7BA1\u7406\uFF0C\u63D0\u9AD8\u7535\u529B\u5229\u7528\u6548\u7387\uFF0C\u4FC3\u8FDB\u8282\u80FD\u51CF\u6392\uFF0C\u6839\u636E\u300A\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u7535\u529B\u6CD5\u300B\u7B49\u6CD5\u5F8B\u6CD5\u89C4\uFF0C\u5236\u5B9A\u672C\u7EC6\u5219\u3002\u9002\u7528\u4E8E\u5E7F\u4E1C\u7701\u884C\u653F\u533A\u57DF\u5185\u7535\u529B\u9700\u6C42\u4FA7\u7BA1\u7406\u76F8\u5173\u6D3B\u52A8\u3002", "GD-DL-2024-001", "2024-03-15", "\u9700\u6C42\u4FA7\u7BA1\u7406", "\u9700\u6C42\u4FA7\u7BA1\u7406,\u7535\u529B\u6CD5\u89C4,\u5E7F\u4E1C");
  insertPolicy.run("\u5206\u5E03\u5F0F\u5149\u4F0F\u53D1\u7535\u9879\u76EE\u7BA1\u7406\u6682\u884C\u529E\u6CD5", "\u4E3A\u89C4\u8303\u5206\u5E03\u5F0F\u5149\u4F0F\u53D1\u7535\u9879\u76EE\u5EFA\u8BBE\u7BA1\u7406\uFF0C\u4FC3\u8FDB\u5149\u4F0F\u4EA7\u4E1A\u5065\u5EB7\u53D1\u5C55\uFF0C\u5236\u5B9A\u672C\u529E\u6CD5\u3002\u6DB5\u76D6\u9879\u76EE\u5907\u6848\u3001\u5E76\u7F51\u63A5\u5165\u3001\u7535\u8D39\u7ED3\u7B97\u3001\u8865\u8D34\u7533\u8BF7\u7B49\u5168\u6D41\u7A0B\u7BA1\u7406\u8981\u6C42\u3002", "GF-GF-2024-002", "2024-05-20", "\u65B0\u80FD\u6E90", "\u5149\u4F0F,\u5206\u5E03\u5F0F\u53D1\u7535,\u5E76\u7F51");
  insertPolicy.run("\u7535\u529B\u5B89\u5168\u751F\u4EA7\u76D1\u7763\u7BA1\u7406\u529E\u6CD5", "\u4E3A\u52A0\u5F3A\u7535\u529B\u5B89\u5168\u751F\u4EA7\u76D1\u7763\u7BA1\u7406\uFF0C\u4FDD\u969C\u7535\u529B\u7CFB\u7EDF\u5B89\u5168\u7A33\u5B9A\u8FD0\u884C\u548C\u7535\u529B\u53EF\u9760\u4F9B\u5E94\uFF0C\u5236\u5B9A\u672C\u529E\u6CD5\u3002\u660E\u786E\u4E86\u7535\u529B\u4F01\u4E1A\u5B89\u5168\u751F\u4EA7\u4E3B\u4F53\u8D23\u4EFB\u3001\u76D1\u7BA1\u90E8\u95E8\u7684\u76D1\u7763\u7BA1\u7406\u804C\u8D23\u3002", "DL-AQ-2024-003", "2024-07-10", "\u5B89\u5168\u751F\u4EA7", "\u5B89\u5168\u751F\u4EA7,\u76D1\u7BA1,\u7535\u529B\u4F01\u4E1A");
  insertPolicy.run("\u7EFF\u8272\u7535\u529B\u8BC1\u4E66\u4EA4\u6613\u5B9E\u65BD\u7EC6\u5219", "\u4E3A\u5EFA\u7ACB\u7EFF\u8272\u7535\u529B\u8BC1\u4E66\u4EA4\u6613\u673A\u5236\uFF0C\u4FC3\u8FDB\u53EF\u518D\u751F\u80FD\u6E90\u53D1\u5C55\uFF0C\u63A8\u52A8\u80FD\u6E90\u7EFF\u8272\u4F4E\u78B3\u8F6C\u578B\uFF0C\u5236\u5B9A\u672C\u7EC6\u5219\u3002\u7EFF\u8BC11\u4E2A\u5BF9\u5E941MWh\u53EF\u518D\u751F\u80FD\u6E90\u7535\u91CF\u3002", "LS-ZS-2024-004", "2024-09-01", "\u7EFF\u8272\u80FD\u6E90", "\u7EFF\u8BC1,\u78B3\u4EA4\u6613,\u53EF\u518D\u751F\u80FD\u6E90");
  const insertSafety = db2.prepare(`
    INSERT INTO safety_entries (title, content, category, tags)
    VALUES (?, ?, ?, ?)
  `);
  insertSafety.run("\u5BB6\u5EAD\u7528\u7535\u5B89\u5168\u5B88\u5219", "1. \u4E0D\u7528\u6E7F\u624B\u89E6\u6478\u7535\u5668\u548C\u5F00\u5173\n2. \u4E0D\u5728\u4E00\u4E2A\u63D2\u5EA7\u4E0A\u4F7F\u7528\u591A\u4E2A\u5927\u529F\u7387\u7535\u5668\n3. \u5B9A\u671F\u68C0\u67E5\u7535\u7EBF\u662F\u5426\u8001\u5316\u7834\u635F\n4. \u96F7\u96E8\u5929\u6C14\u62D4\u6389\u7535\u5668\u63D2\u5934\n5. \u5B89\u88C5\u6F0F\u7535\u4FDD\u62A4\u5668\u5E76\u5B9A\u671F\u6D4B\u8BD5", "\u5BB6\u5EAD\u5B89\u5168", "\u5BB6\u5EAD,\u7528\u7535\u5B89\u5168,\u9632\u62A4");
  insertSafety.run("\u9AD8\u538B\u7EBF\u8DEF\u5B89\u5168\u8DDD\u79BB", "1kV\u4EE5\u4E0B: 1\u7C73; 1-10kV: 1.5\u7C73; 35kV: 3\u7C73; 110kV: 4\u7C73; 220kV: 5\u7C73\u3002\u65BD\u5DE5\u3001\u540A\u88C5\u7B49\u4F5C\u4E1A\u5FC5\u987B\u4FDD\u6301\u5B89\u5168\u8DDD\u79BB\uFF0C\u5FC5\u8981\u65F6\u8054\u7CFB\u4F9B\u7535\u90E8\u95E8\u505C\u7535\u4F5C\u4E1A\u3002", "\u7EBF\u8DEF\u5B89\u5168", "\u9AD8\u538B,\u5B89\u5168\u8DDD\u79BB,\u65BD\u5DE5");
  insertSafety.run("\u89E6\u7535\u6025\u6551\u65B9\u6CD5", "1. \u7ACB\u5373\u5207\u65AD\u7535\u6E90\u6216\u7528\u7EDD\u7F18\u7269\u4F53\u5206\u79BB\n2. \u62E8\u6253120\u6025\u6551\u7535\u8BDD\n3. \u5BF9\u547C\u5438\u5FC3\u8DF3\u505C\u6B62\u8005\u8FDB\u884C\u5FC3\u80BA\u590D\u82CF\n4. \u4E0D\u53EF\u76F4\u63A5\u7528\u624B\u62C9\u89E6\u7535\u8005\n5. \u4FDD\u6301\u4F24\u8005\u5E73\u5367\uFF0C\u7B49\u5F85\u6551\u63F4", "\u6025\u6551", "\u89E6\u7535,\u6025\u6551,\u5FC3\u80BA\u590D\u82CF");
  insertSafety.run("\u4F01\u4E1A\u914D\u7535\u623F\u5B89\u5168\u7BA1\u7406", "1. \u914D\u7535\u623F\u5E94\u8BBE\u7F6E\u8B66\u793A\u6807\u5FD7\n2. \u975E\u4E13\u4E1A\u4EBA\u5458\u7981\u6B62\u5165\u5185\n3. \u5B9A\u671F\u5DE1\u68C0\u8BBE\u5907\u8FD0\u884C\u72B6\u6001\n4. \u4FDD\u6301\u901A\u98CE\u6563\u70ED\u826F\u597D\n5. \u914D\u5907\u706D\u706B\u5668\u6750\u548C\u7EDD\u7F18\u5DE5\u5177", "\u4F01\u4E1A\u5B89\u5168", "\u914D\u7535\u623F,\u4F01\u4E1A,\u7BA1\u7406");
  const insertLive = db2.prepare(`
    INSERT INTO livestreams (title, speaker, description, video_url, live_date, duration, view_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertLive.run("2026\u5E74\u7535\u4EF7\u653F\u7B56\u89E3\u8BFB", "\u674E\u660E\u8F89 \u9AD8\u7EA7\u7ECF\u6D4E\u5E08", "\u89E3\u8BFB\u6700\u65B0\u7535\u4EF7\u8C03\u6574\u653F\u7B56\uFF0C\u5206\u6790\u5DE5\u5546\u4E1A\u7528\u6237\u7528\u7535\u6210\u672C\u53D8\u5316\u8D8B\u52BF\uFF0C\u63D0\u4F9B\u7535\u4EF7\u4F18\u5316\u5EFA\u8BAE\u3002", "/videos/policy-2026.mp4", "2026-03-15", 3600, 12500);
  insertLive.run("\u4F01\u4E1A\u80FD\u6548\u63D0\u5347\u5B9E\u6218\u5206\u4EAB", "\u738B\u5EFA\u56FD \u80FD\u6E90\u7BA1\u7406\u4E13\u5BB6", "\u5206\u4EAB\u591A\u5BB6\u4F01\u4E1A\u80FD\u6548\u63D0\u5347\u6210\u529F\u6848\u4F8B\uFF0C\u4ECB\u7ECD\u8282\u80FD\u6539\u9020\u6280\u672F\u8DEF\u7EBF\u548C\u6295\u8D44\u56DE\u62A5\u5206\u6790\u3002", "/videos/efficiency.mp4", "2026-04-20", 5400, 8900);
  insertLive.run("\u5206\u5E03\u5F0F\u5149\u4F0F\u5E76\u7F51\u6280\u672F\u8981\u70B9", "\u9648\u5FD7\u8FDC \u7535\u529B\u7CFB\u7EDF\u5DE5\u7A0B\u5E08", "\u8BB2\u89E3\u5206\u5E03\u5F0F\u5149\u4F0F\u5E76\u7F51\u6280\u672F\u6807\u51C6\u3001\u63A5\u5165\u65B9\u6848\u8BBE\u8BA1\u548C\u8FD0\u7EF4\u7BA1\u7406\u8981\u70B9\u3002", "/videos/pv-grid.mp4", "2026-05-10", 4200, 6700);
  const insertMetric = db2.prepare(`
    INSERT INTO enterprise_metrics (user_id, metric_date, peak_kwh, valley_kwh, flat_kwh, peak_cost, valley_cost, flat_cost, max_load_kw, avg_load_kw)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const metricDates = ["2026-01-15", "2026-02-15", "2026-03-15", "2026-04-15", "2026-05-15"];
  metricDates.forEach((date) => {
    insertMetric.run(3, date, 8500, 2800, 4200, 8500 * 1.05, 2800 * 0.38, 4200 * 0.65, 320, 180);
    insertMetric.run(4, date, 55e3, 18e3, 27e3, 55e3 * 1.05, 18e3 * 0.38, 27e3 * 0.65, 1200, 680);
  });
  const insertAlert = db2.prepare(`
    INSERT INTO load_alerts (user_id, device_name, load_percentage, threshold, alert_time, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAlert.run(3, "\u751F\u4EA7\u7EBFA\u7535\u673A\u7EC4", 92.5, 80, "2026-06-04 14:30", "active");
  insertAlert.run(3, "\u4E2D\u592E\u7A7A\u8C03\u538B\u7F29\u673A", 85.2, 80, "2026-06-04 15:10", "active");
  insertAlert.run(4, "\u56ED\u533A\u4E3B\u53D8\u538B\u5668", 88.7, 85, "2026-06-05 09:45", "active");
  insertAlert.run(4, "\u6570\u636E\u4E2D\u5FC3UPS", 78.3, 80, "2026-06-03 22:00", "resolved");
  const insertPattern = db2.prepare(`
    INSERT INTO usage_patterns (user_id, season, avg_daily_kwh, avg_monthly_kwh, peak_hour_start, peak_hour_end, pattern_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertPattern.run(1, "spring", 6.5, 195, 18, 22, "evening_peak");
  insertPattern.run(1, "summer", 12, 360, 12, 16, "afternoon_peak");
  insertPattern.run(1, "autumn", 7, 210, 18, 22, "evening_peak");
  insertPattern.run(1, "winter", 10.5, 315, 7, 10, "morning_peak");
  insertPattern.run(2, "spring", 13, 390, 18, 22, "evening_peak");
  insertPattern.run(2, "summer", 22, 660, 12, 16, "afternoon_peak");
  insertPattern.run(2, "autumn", 14, 420, 18, 22, "evening_peak");
  insertPattern.run(2, "winter", 18, 540, 7, 10, "morning_peak");
  const insertCredit = db2.prepare(`
    INSERT INTO green_credits (user_id, credit_type, amount, source, status, issued_at, verified_at, expired_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertCredit.run(1, "\u8282\u80FD", 50, "\u6708\u5EA6\u8282\u80FD\u8FBE\u6807", "verified", "2026-05-01", "2026-05-05", "2027-05-01");
  insertCredit.run(2, "\u5149\u4F0F", 200, "\u5BB6\u5EAD\u5149\u4F0F\u53D1\u7535", "verified", "2026-04-01", "2026-04-10", "2027-04-01");
  insertCredit.run(3, "\u78B3\u4E2D\u548C", 5e3, "\u4F01\u4E1A\u78B3\u51CF\u6392\u91CF", "issued", "2026-03-01", null, "2027-03-01");
  insertCredit.run(3, "\u7EFF\u7535", 3e3, "\u7EFF\u7535\u91C7\u8D2D\u8BC1\u660E", "verified", "2026-02-01", "2026-02-15", "2027-02-01");
  insertCredit.run(4, "\u78B3\u4E2D\u548C", 15e3, "\u56ED\u533A\u78B3\u51CF\u6392\u91CF", "issued", "2026-03-01", null, "2027-03-01");
  insertCredit.run(4, "\u7EFF\u7535", 8e3, "\u7EFF\u7535\u91C7\u8D2D\u8BC1\u660E", "verified", "2026-01-01", "2026-01-20", "2027-01-01");
  const insertVerification = db2.prepare(`
    INSERT INTO credit_verifications (credit_id, verifier, action, remark)
    VALUES (?, ?, ?, ?)
  `);
  insertVerification.run(1, "\u7CFB\u7EDF\u81EA\u52A8", "approve", "\u6708\u5EA6\u8282\u80FD\u6570\u636E\u6838\u5B9E\u901A\u8FC7");
  insertVerification.run(2, "\u5F20\u5BA1\u6838\u5458", "approve", "\u5149\u4F0F\u53D1\u7535\u91CF\u6838\u5B9E\u901A\u8FC7");
  insertVerification.run(4, "\u674E\u5BA1\u6838\u5458", "approve", "\u7EFF\u7535\u91C7\u8D2D\u51ED\u8BC1\u6838\u5B9E\u901A\u8FC7");
  insertVerification.run(6, "\u674E\u5BA1\u6838\u5458", "approve", "\u56ED\u533A\u7EFF\u7535\u91C7\u8D2D\u6838\u5B9E\u901A\u8FC7");
  const insertAudit = db2.prepare(`
    INSERT INTO price_audits (user_id, audit_period, price_standard, actual_price, deviation, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(1, "2026-05", 0.62, 0.62, 0, "passed");
  insertAudit.run(2, "2026-05", 0.58, 0.58, 0, "passed");
  insertAudit.run(3, "2026-05", 0.85, 0.85, 0, "passed");
  insertAudit.run(4, "2026-05", 0.75, 0.76, 0.01, "deviation");
  const insertSubsidy = db2.prepare(`
    INSERT INTO subsidy_records (user_id, subsidy_type, amount, policy_ref, issued_at, status, audit_trail)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertSubsidy.run(2, "\u5149\u4F0F\u53D1\u7535\u8865\u8D34", 2400, "GF-GF-2024-002", "2026-04-15", "issued", "2026-04-01 \u7533\u8BF7; 2026-04-10 \u5BA1\u6838; 2026-04-15 \u53D1\u653E");
  insertSubsidy.run(3, "\u8282\u80FD\u6539\u9020\u8865\u8D34", 15e3, "GD-DL-2024-001", "2026-05-10", "issued", "2026-04-20 \u7533\u8BF7; 2026-05-01 \u5BA1\u6838; 2026-05-10 \u53D1\u653E");
  insertSubsidy.run(4, "\u56ED\u533A\u5149\u4F0F\u8865\u8D34", 8e4, "GF-GF-2024-002", null, "pending", "2026-05-01 \u7533\u8BF7; \u5BA1\u6838\u4E2D");
  console.log("Database seeded successfully");
}

// api/routes/auth.ts
import { Router } from "express";
import bcrypt2 from "bcryptjs";
import jwt from "jsonwebtoken";
var router = Router();
var JWT_SECRET = process.env.JWT_SECRET || "csg-energy-platform-secret";
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "\u672A\u63D0\u4F9B\u8BA4\u8BC1\u4EE4\u724C" });
    return;
  }
  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: "\u4EE4\u724C\u65E0\u6548\u6216\u5DF2\u8FC7\u671F" });
  }
}
router.post("/register", async (req, res) => {
  try {
    const { username, password, name, email, phone, customer_type, company_name } = req.body;
    if (!username || !password || !name) {
      res.status(400).json({ success: false, error: "\u7528\u6237\u540D\u3001\u5BC6\u7801\u548C\u59D3\u540D\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const db2 = getDb();
    const existing = db2.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
      res.status(409).json({ success: false, error: "\u7528\u6237\u540D\u5DF2\u5B58\u5728" });
      return;
    }
    const hashed = await bcrypt2.hash(password, 10);
    const role = "user";
    const cType = customer_type || "individual";
    const result = db2.prepare(
      "INSERT INTO users (username, password, name, email, phone, customer_type, role, company_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(username, hashed, name, email || null, phone || null, cType, role, company_name || null);
    const userId = result.lastInsertRowid;
    db2.prepare("INSERT INTO points_accounts (user_id, balance, total_earned, total_redeemed) VALUES (?, 0, 0, 0)").run(userId);
    const token = jwt.sign({ id: userId, username, customer_type: cType, role }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ success: true, data: { token, user: { id: userId, username, name, customer_type: cType, role, company_name: company_name || null } } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: "\u7528\u6237\u540D\u548C\u5BC6\u7801\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const db2 = getDb();
    const user = db2.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user) {
      res.status(401).json({ success: false, error: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF" });
      return;
    }
    const valid = await bcrypt2.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ success: false, error: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF" });
      return;
    }
    const token = jwt.sign({ id: user.id, username: user.username, customer_type: user.customer_type, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, data: { token, user: { id: user.id, username: user.username, name: user.name, customer_type: user.customer_type, role: user.role, company_name: user.company_name } } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const user = db2.prepare("SELECT id, username, name, email, phone, customer_type, role, company_name, created_at FROM users WHERE id = ?").get(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: "\u7528\u6237\u4E0D\u5B58\u5728" });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var auth_default = router;

// api/routes/power.ts
import { Router as Router2 } from "express";
var router2 = Router2();
router2.get("/bills", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const bills = db2.prepare("SELECT * FROM electricity_bills WHERE user_id = ? ORDER BY billing_period DESC").all(req.user.id).map((bill) => ({
      id: String(bill.id),
      period: bill.billing_period,
      amount: Number(bill.amount) || 0,
      usage: Number(bill.usage_kwh) || 0,
      status: bill.status,
      dueDate: bill.due_date,
      paidDate: bill.paid_at,
      meterNo: bill.meter_no
    }));
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.get("/bills/analysis", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const bills = db2.prepare("SELECT billing_period, usage_kwh, amount, status FROM electricity_bills WHERE user_id = ? ORDER BY billing_period ASC").all(req.user.id);
    const monthlyTotals = bills.reduce((acc, b) => {
      acc[b.billing_period] = { usage_kwh: b.usage_kwh, amount: b.amount, status: b.status };
      return acc;
    }, {});
    const totalUsage = bills.reduce((s, b) => s + b.usage_kwh, 0);
    const totalAmount = bills.reduce((s, b) => s + b.amount, 0);
    const avgUsage = bills.length ? totalUsage / bills.length : 0;
    const avgAmount = bills.length ? totalAmount / bills.length : 0;
    const paidCount = bills.filter((b) => b.status === "paid").length;
    const unpaidCount = bills.filter((b) => b.status === "unpaid").length;
    res.json({
      success: true,
      data: {
        monthly_totals: monthlyTotals,
        summary: { total_usage: totalUsage, total_amount: totalAmount, avg_usage: avgUsage, avg_amount: avgAmount, paid_count: paidCount, unpaid_count: unpaidCount, bill_count: bills.length },
        trend: bills.map((b) => ({ period: b.billing_period, usage_kwh: b.usage_kwh, amount: b.amount }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.get("/bill-analysis", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const bills = db2.prepare(
      "SELECT billing_period, usage_kwh, amount FROM electricity_bills WHERE user_id = ? ORDER BY billing_period ASC LIMIT 12"
    ).all(req.user.id);
    const monthLabel = (period) => {
      const month = String(period || "").slice(5);
      return month ? `${Number(month)}\u6708` : String(period || "");
    };
    const costTrend = bills.map((bill) => ({
      month: monthLabel(bill.billing_period),
      cost: Math.round(Number(bill.amount || 0) * 100) / 100,
      lastYear: Math.round(Number(bill.amount || 0) * 0.92 * 100) / 100
    }));
    const usageComparison = bills.map((bill) => ({
      month: monthLabel(bill.billing_period),
      current: Math.round(Number(bill.usage_kwh || 0) * 10) / 10,
      previous: Math.round(Number(bill.usage_kwh || 0) * 0.9 * 10) / 10
    }));
    const totalCost = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const costBreakdown = [
      { name: "\u5CF0\u65F6\u7535\u8D39", value: Math.round(totalCost * 0.46 * 100) / 100 },
      { name: "\u5E73\u65F6\u7535\u8D39", value: Math.round(totalCost * 0.34 * 100) / 100 },
      { name: "\u8C37\u65F6\u7535\u8D39", value: Math.round(totalCost * 0.14 * 100) / 100 },
      { name: "\u57FA\u672C\u7535\u8D39", value: Math.round(totalCost * 0.06 * 100) / 100 }
    ];
    res.json({ success: true, data: { costTrend, usageComparison, costBreakdown } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.get("/bills/:id", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const bill = db2.prepare("SELECT * FROM electricity_bills WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!bill) {
      res.status(404).json({ success: false, error: "\u8D26\u5355\u4E0D\u5B58\u5728" });
      return;
    }
    res.json({
      success: true,
      data: {
        id: String(bill.id),
        period: bill.billing_period,
        amount: Number(bill.amount) || 0,
        usage: Number(bill.usage_kwh) || 0,
        status: bill.status,
        dueDate: bill.due_date,
        paidDate: bill.paid_at,
        meterNo: bill.meter_no
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.post("/bills/:id/pay", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const bill = db2.prepare("SELECT * FROM electricity_bills WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!bill) {
      res.status(404).json({ success: false, error: "\u8D26\u5355\u4E0D\u5B58\u5728" });
      return;
    }
    if (bill.status === "paid") {
      res.status(400).json({ success: false, error: "\u8D26\u5355\u5DF2\u652F\u4ED8" });
      return;
    }
    db2.prepare("UPDATE electricity_bills SET status = 'paid', paid_at = datetime('now','localtime') WHERE id = ?").run(req.params.id);
    res.json({ success: true, data: { id: req.params.id, status: "paid" } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.get("/outages", async (req, res) => {
  try {
    const db2 = getDb();
    const outages = db2.prepare("SELECT * FROM outage_notifications ORDER BY created_at DESC").all();
    res.json({ success: true, data: outages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router2.get("/outages/:id", async (req, res) => {
  try {
    const db2 = getDb();
    const outage = db2.prepare("SELECT * FROM outage_notifications WHERE id = ?").get(req.params.id);
    if (!outage) {
      res.status(404).json({ success: false, error: "\u505C\u7535\u901A\u77E5\u4E0D\u5B58\u5728" });
      return;
    }
    res.json({ success: true, data: outage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var power_default = router2;

// api/routes/energy.ts
import { Router as Router3 } from "express";
var router3 = Router3();
router3.get("/efficiency", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const reports = db2.prepare("SELECT * FROM efficiency_reports WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.post("/efficiency/generate", authMiddleware, async (req, res) => {
  try {
    const { company_name, report_period, peak_usage, valley_usage, peak_ratio, load_rate, suggestions } = req.body;
    if (!report_period) {
      res.status(400).json({ success: false, error: "\u62A5\u544A\u5468\u671F\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const db2 = getDb();
    const result = db2.prepare(
      "INSERT INTO efficiency_reports (user_id, company_name, report_period, peak_usage, valley_usage, peak_ratio, load_rate, suggestions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(req.user.id, company_name || null, report_period, peak_usage || 0, valley_usage || 0, peak_ratio || 0, load_rate || 0, suggestions || null);
    const report = db2.prepare("SELECT * FROM efficiency_reports WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.get("/pv-plans", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const plans = db2.prepare("SELECT * FROM pv_plans WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.post("/pv-plans/recommend", authMiddleware, async (req, res) => {
  try {
    const { roof_area, monthly_usage } = req.body;
    if (!roof_area || !monthly_usage) {
      res.status(400).json({ success: false, error: "\u5C4B\u9876\u9762\u79EF\u548C\u6708\u7528\u7535\u91CF\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const recommendedCapacity = Math.min(roof_area / 10, monthly_usage / 120);
    const estimatedGeneration = recommendedCapacity * 120;
    const investment = recommendedCapacity * 5e3;
    const paybackYears = investment / (estimatedGeneration * 0.65 * 12);
    const db2 = getDb();
    const result = db2.prepare(
      "INSERT INTO pv_plans (user_id, roof_area, monthly_usage, recommended_capacity, estimated_generation, investment, payback_years) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(req.user.id, roof_area, monthly_usage, Math.round(recommendedCapacity * 10) / 10, Math.round(estimatedGeneration), Math.round(investment), Math.round(paybackYears * 10) / 10);
    const plan = db2.prepare("SELECT * FROM pv_plans WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.get("/carbon", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const footprints = db2.prepare("SELECT * FROM carbon_footprints WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json({ success: true, data: footprints });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.post("/carbon/calculate", authMiddleware, async (req, res) => {
  try {
    const { period, electricity_kwh, gas_m3, transport_km } = req.body;
    if (!period) {
      res.status(400).json({ success: false, error: "\u5468\u671F\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const electricityCo2 = (electricity_kwh || 0) * 0.581;
    const gasCo2 = (gas_m3 || 0) * 2.16;
    const transportCo2 = (transport_km || 0) * 0.21;
    const totalCo2 = electricityCo2 + gasCo2 + transportCo2;
    let suggestion = "";
    if (electricityCo2 > gasCo2 && electricityCo2 > transportCo2) {
      suggestion = "\u7528\u7535\u662F\u4E3B\u8981\u78B3\u6392\u653E\u6765\u6E90\uFF0C\u5EFA\u8BAE\u8282\u7EA6\u7528\u7535\u6216\u8003\u8651\u4F7F\u7528\u6E05\u6D01\u80FD\u6E90";
    } else if (transportCo2 > gasCo2) {
      suggestion = "\u4EA4\u901A\u662F\u4E3B\u8981\u78B3\u6392\u653E\u6765\u6E90\uFF0C\u5EFA\u8BAE\u4F7F\u7528\u516C\u5171\u4EA4\u901A\u6216\u65B0\u80FD\u6E90\u8F66\u8F86";
    } else {
      suggestion = "\u71C3\u6C14\u662F\u4E3B\u8981\u78B3\u6392\u653E\u6765\u6E90\uFF0C\u5EFA\u8BAE\u63A8\u8FDB\u7535\u6C14\u5316\u6539\u9020";
    }
    const db2 = getDb();
    const result = db2.prepare(
      "INSERT INTO carbon_footprints (user_id, period, electricity_co2, gas_co2, transport_co2, total_co2, reduction_suggestion) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(req.user.id, period, Math.round(electricityCo2 * 100) / 100, Math.round(gasCo2 * 100) / 100, Math.round(transportCo2 * 100) / 100, Math.round(totalCo2 * 100) / 100, suggestion);
    const footprint = db2.prepare("SELECT * FROM carbon_footprints WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: footprint });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var energy_default = router3;

// api/routes/living.ts
import { Router as Router4 } from "express";
var router4 = Router4();
router4.get("/devices", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const devices = db2.prepare("SELECT * FROM smart_devices WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json({ success: true, data: devices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router4.post("/devices", authMiddleware, async (req, res) => {
  try {
    const { device_name, device_type, status, power_consumption } = req.body;
    if (!device_name || !device_type) {
      res.status(400).json({ success: false, error: "\u8BBE\u5907\u540D\u79F0\u548C\u7C7B\u578B\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const db2 = getDb();
    const result = db2.prepare(
      "INSERT INTO smart_devices (user_id, device_name, device_type, status, power_consumption, last_active) VALUES (?, ?, ?, ?, ?, datetime('now','localtime'))"
    ).run(req.user.id, device_name, device_type, status || "offline", power_consumption || 0);
    const device = db2.prepare("SELECT * FROM smart_devices WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router4.put("/devices/:id", authMiddleware, async (req, res) => {
  try {
    const { status, power_consumption } = req.body;
    const db2 = getDb();
    const device = db2.prepare("SELECT * FROM smart_devices WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!device) {
      res.status(404).json({ success: false, error: "\u8BBE\u5907\u4E0D\u5B58\u5728" });
      return;
    }
    db2.prepare(
      "UPDATE smart_devices SET status = ?, power_consumption = ?, last_active = datetime('now','localtime') WHERE id = ?"
    ).run(status || device.status, power_consumption !== void 0 ? power_consumption : device.power_consumption, req.params.id);
    const updated = db2.prepare("SELECT * FROM smart_devices WHERE id = ?").get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router4.get("/tips", async (req, res) => {
  try {
    const db2 = getDb();
    const { category, season } = req.query;
    let sql = "SELECT * FROM energy_tips WHERE 1=1";
    const params = [];
    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }
    if (season) {
      sql += " AND (season = ? OR season IS NULL)";
      params.push(season);
    }
    sql += " ORDER BY created_at DESC";
    const seasonLabels = {
      spring: "\u6625\u5B63",
      summer: "\u590F\u5B63",
      autumn: "\u79CB\u5B63",
      winter: "\u51AC\u5B63"
    };
    const tips = db2.prepare(sql).all(...params).map((tip) => ({
      id: String(tip.id),
      title: tip.title,
      content: tip.content,
      category: tip.category,
      season: tip.season ? seasonLabels[tip.season] || tip.season : "\u5168\u5E74",
      savingPotential: tip.category === "\u7A7A\u8C03" ? "\u53EF\u8282\u770115%-20%\u7A7A\u8C03\u7528\u7535" : "\u53EF\u964D\u4F4E\u65E5\u5E38\u7528\u7535\u6210\u672C"
    }));
    res.json({ success: true, data: tips });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router4.get("/points", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    let account = db2.prepare("SELECT * FROM points_accounts WHERE user_id = ?").get(req.user.id);
    if (!account) {
      db2.prepare("INSERT INTO points_accounts (user_id, balance, total_earned, total_redeemed) VALUES (?, 0, 0, 0)").run(req.user.id);
      account = db2.prepare("SELECT * FROM points_accounts WHERE user_id = ?").get(req.user.id);
    }
    res.json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router4.get("/points/transactions", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const transactions = db2.prepare("SELECT * FROM points_transactions WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router4.get("/mall", async (req, res) => {
  try {
    const db2 = getDb();
    const { category } = req.query;
    let sql = "SELECT * FROM mall_items WHERE stock > 0";
    const params = [];
    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }
    sql += " ORDER BY created_at DESC";
    const items = db2.prepare(sql).all(...params);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router4.post("/mall/redeem", authMiddleware, async (req, res) => {
  try {
    const { item_id, quantity } = req.body;
    if (!item_id) {
      res.status(400).json({ success: false, error: "\u5546\u54C1ID\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const qty = quantity || 1;
    const db2 = getDb();
    const item = db2.prepare("SELECT * FROM mall_items WHERE id = ?").get(item_id);
    if (!item) {
      res.status(404).json({ success: false, error: "\u5546\u54C1\u4E0D\u5B58\u5728" });
      return;
    }
    if (item.stock < qty) {
      res.status(400).json({ success: false, error: "\u5E93\u5B58\u4E0D\u8DB3" });
      return;
    }
    const totalCost = item.points_cost * qty;
    const account = db2.prepare("SELECT * FROM points_accounts WHERE user_id = ?").get(req.user.id);
    if (!account || account.balance < totalCost) {
      res.status(400).json({ success: false, error: "\u79EF\u5206\u4E0D\u8DB3" });
      return;
    }
    const redeemOrder = db2.transaction(() => {
      db2.prepare("UPDATE mall_items SET stock = stock - ? WHERE id = ?").run(qty, item_id);
      db2.prepare("UPDATE points_accounts SET balance = balance - ?, total_redeemed = total_redeemed + ?, updated_at = datetime('now','localtime') WHERE user_id = ?").run(totalCost, totalCost, req.user.id);
      db2.prepare("INSERT INTO points_transactions (user_id, type, amount, description, reference_id) VALUES (?, ?, ?, ?, ?)").run(req.user.id, "redeem", -totalCost, `\u5151\u6362${item.name}x${qty}`, item_id);
      const orderResult = db2.prepare("INSERT INTO redeem_orders (user_id, item_id, quantity, points_cost, status) VALUES (?, ?, ?, ?, ?)").run(req.user.id, item_id, qty, totalCost, "pending");
      return db2.prepare("SELECT * FROM redeem_orders WHERE id = ?").get(orderResult.lastInsertRowid);
    })();
    res.status(201).json({ success: true, data: redeemOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var living_default = router4;

// api/routes/knowledge.ts
import { Router as Router5 } from "express";
var router5 = Router5();
function parseTags(value, fallback = []) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== "string") return fallback;
  const tags = value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
  return tags.length > 0 ? tags : fallback;
}
function summaryFrom(content, length = 96) {
  const text = String(content || "").replace(/\s+/g, " ").trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}
function formatDuration(minutes) {
  const totalMinutes = Number(minutes) || 0;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m || 30}:00`;
}
router5.get("/policies", async (req, res) => {
  try {
    const db2 = getDb();
    const { search, tag } = req.query;
    let sql = "SELECT * FROM policies WHERE 1=1";
    const params = [];
    if (search) {
      sql += " AND (title LIKE ? OR content LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (tag) {
      sql += " AND tags LIKE ?";
      params.push(`%${tag}%`);
    }
    sql += " ORDER BY publish_date DESC";
    const policies = db2.prepare(sql).all(...params).map((policy) => ({
      id: String(policy.id),
      title: policy.title,
      summary: summaryFrom(policy.content),
      tags: parseTags(policy.tags, policy.category ? [policy.category] : ["\u653F\u7B56"]),
      publishDate: policy.publish_date || policy.created_at,
      source: policy.policy_no || policy.category || "\u5357\u65B9\u7535\u7F51",
      content: policy.content,
      category: policy.category,
      policyNo: policy.policy_no
    }));
    res.json({ success: true, data: policies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router5.get("/policies/:id", async (req, res) => {
  try {
    const db2 = getDb();
    const policy = db2.prepare("SELECT * FROM policies WHERE id = ?").get(req.params.id);
    if (!policy) {
      res.status(404).json({ success: false, error: "\u653F\u7B56\u4E0D\u5B58\u5728" });
      return;
    }
    res.json({
      success: true,
      data: {
        id: String(policy.id),
        title: policy.title,
        summary: summaryFrom(policy.content),
        tags: parseTags(policy.tags, policy.category ? [policy.category] : ["\u653F\u7B56"]),
        publishDate: policy.publish_date || policy.created_at,
        source: policy.policy_no || policy.category || "\u5357\u65B9\u7535\u7F51",
        content: policy.content,
        category: policy.category,
        policyNo: policy.policy_no
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router5.get("/safety", async (req, res) => {
  try {
    const db2 = getDb();
    const { tag } = req.query;
    let sql = "SELECT * FROM safety_entries WHERE 1=1";
    const params = [];
    if (tag) {
      sql += " AND tags LIKE ?";
      params.push(`%${tag}%`);
    }
    sql += " ORDER BY created_at DESC";
    const entries = db2.prepare(sql).all(...params).map((entry) => ({
      id: String(entry.id),
      title: entry.title,
      summary: summaryFrom(entry.content),
      tags: parseTags(entry.tags, entry.category ? [entry.category] : ["\u5B89\u5168"]),
      content: entry.content,
      category: entry.category
    }));
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router5.get("/safety/:id", async (req, res) => {
  try {
    const db2 = getDb();
    const entry = db2.prepare("SELECT * FROM safety_entries WHERE id = ?").get(req.params.id);
    if (!entry) {
      res.status(404).json({ success: false, error: "\u5B89\u5168\u6761\u76EE\u4E0D\u5B58\u5728" });
      return;
    }
    res.json({
      success: true,
      data: {
        id: String(entry.id),
        title: entry.title,
        summary: summaryFrom(entry.content),
        tags: parseTags(entry.tags, entry.category ? [entry.category] : ["\u5B89\u5168"]),
        content: entry.content,
        category: entry.category
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router5.get("/livestreams", async (req, res) => {
  try {
    const db2 = getDb();
    const streams = db2.prepare("SELECT * FROM livestreams ORDER BY live_date DESC").all().map((stream) => ({
      id: String(stream.id),
      title: stream.title,
      expert: stream.speaker || "\u80FD\u6E90\u670D\u52A1\u4E13\u5BB6",
      thumbnail: stream.video_url || "",
      viewCount: Number(stream.view_count) || 0,
      duration: formatDuration(stream.duration),
      date: stream.live_date || stream.created_at,
      tags: ["\u76F4\u64AD", stream.description ? "\u80FD\u6E90\u8BFE\u5802" : "\u56DE\u653E"],
      description: stream.description
    }));
    res.json({ success: true, data: streams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var knowledge_default = router5;

// api/routes/enterprise.ts
import { Router as Router6 } from "express";
var router6 = Router6();
router6.get("/metrics", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const { start_date, end_date } = req.query;
    let sql = "SELECT * FROM enterprise_metrics WHERE user_id = ?";
    const params = [req.user.id];
    if (start_date) {
      sql += " AND metric_date >= ?";
      params.push(start_date);
    }
    if (end_date) {
      sql += " AND metric_date <= ?";
      params.push(end_date);
    }
    sql += " ORDER BY metric_date ASC";
    const metrics = db2.prepare(sql).all(...params);
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router6.get("/metrics/peak-valley", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const metrics = db2.prepare("SELECT * FROM enterprise_metrics WHERE user_id = ? ORDER BY metric_date ASC").all(req.user.id);
    const totalPeak = metrics.reduce((s, m) => s + m.peak_kwh, 0);
    const totalValley = metrics.reduce((s, m) => s + m.valley_kwh, 0);
    const totalFlat = metrics.reduce((s, m) => s + m.flat_kwh, 0);
    const total = totalPeak + totalValley + totalFlat;
    const peakCostTotal = metrics.reduce((s, m) => s + m.peak_cost, 0);
    const valleyCostTotal = metrics.reduce((s, m) => s + m.valley_cost, 0);
    const flatCostTotal = metrics.reduce((s, m) => s + m.flat_cost, 0);
    res.json({
      success: true,
      data: {
        peak: { kwh: totalPeak, cost: peakCostTotal, ratio: total ? totalPeak / total : 0 },
        valley: { kwh: totalValley, cost: valleyCostTotal, ratio: total ? totalValley / total : 0 },
        flat: { kwh: totalFlat, cost: flatCostTotal, ratio: total ? totalFlat / total : 0 },
        monthly: metrics.map((m) => ({
          date: m.metric_date,
          peak_kwh: m.peak_kwh,
          valley_kwh: m.valley_kwh,
          flat_kwh: m.flat_kwh,
          peak_cost: m.peak_cost,
          valley_cost: m.valley_cost,
          flat_cost: m.flat_cost
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router6.get("/load-alerts", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const alerts = db2.prepare("SELECT * FROM load_alerts WHERE user_id = ? ORDER BY alert_time DESC").all(req.user.id);
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router6.put("/load-alerts/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const db2 = getDb();
    const alert = db2.prepare("SELECT * FROM load_alerts WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!alert) {
      res.status(404).json({ success: false, error: "\u544A\u8B66\u4E0D\u5B58\u5728" });
      return;
    }
    db2.prepare("UPDATE load_alerts SET status = ? WHERE id = ?").run(status || alert.status, req.params.id);
    const updated = db2.prepare("SELECT * FROM load_alerts WHERE id = ?").get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var enterprise_default = router6;

// api/routes/residential.ts
import { Router as Router7 } from "express";
var router7 = Router7();
router7.get("/patterns", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const patterns = db2.prepare("SELECT * FROM usage_patterns WHERE user_id = ? ORDER BY season ASC").all(req.user.id);
    res.json({ success: true, data: patterns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router7.get("/patterns/seasonal", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const patterns = db2.prepare("SELECT * FROM usage_patterns WHERE user_id = ? ORDER BY season ASC").all(req.user.id);
    const seasonal = {};
    const seasonOrder = ["spring", "summer", "autumn", "winter"];
    for (const p of patterns) {
      seasonal[p.season] = {
        avg_daily_kwh: p.avg_daily_kwh,
        avg_monthly_kwh: p.avg_monthly_kwh,
        peak_hour_start: p.peak_hour_start,
        peak_hour_end: p.peak_hour_end,
        pattern_type: p.pattern_type
      };
    }
    const peakMonths = patterns.reduce((max, p) => p.avg_monthly_kwh > (max?.avg_monthly_kwh || 0) ? p : max, null);
    const lowMonths = patterns.reduce((min, p) => p.avg_monthly_kwh < (min?.avg_monthly_kwh || Infinity) ? p : min, null);
    res.json({
      success: true,
      data: {
        seasonal,
        seasons: seasonOrder.filter((s) => seasonal[s]),
        peak_season: peakMonths ? { season: peakMonths.season, kwh: peakMonths.avg_monthly_kwh } : null,
        low_season: lowMonths ? { season: lowMonths.season, kwh: lowMonths.avg_monthly_kwh } : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router7.get("/clustering", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const patterns = db2.prepare("SELECT * FROM usage_patterns WHERE user_id = ?").all(req.user.id);
    const clusters = {};
    for (const p of patterns) {
      const type = p.pattern_type || "unknown";
      if (!clusters[type]) clusters[type] = [];
      clusters[type].push({
        season: p.season,
        avg_daily_kwh: p.avg_daily_kwh,
        avg_monthly_kwh: p.avg_monthly_kwh,
        peak_hours: `${p.peak_hour_start}:00-${p.peak_hour_end}:00`
      });
    }
    const patternTypes = Object.keys(clusters);
    const dominant = patternTypes.reduce((a, b) => clusters[a].length >= clusters[b].length ? a : b, patternTypes[0] || "");
    res.json({
      success: true,
      data: {
        clusters,
        pattern_types: patternTypes,
        dominant_pattern: dominant || null,
        total_patterns: patterns.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var residential_default = router7;

// api/routes/green.ts
import { Router as Router8 } from "express";
var router8 = Router8();
function mapCredit(credit) {
  return {
    id: String(credit.id),
    type: credit.credit_type,
    amount: Number(credit.amount || 0),
    source: credit.source || "",
    status: credit.status,
    issuedAt: credit.issued_at || credit.created_at,
    verifiedAt: credit.verified_at || void 0
  };
}
function mapVerification(record) {
  return {
    id: String(record.id),
    creditId: String(record.credit_id),
    verifier: record.verifier,
    result: record.action === "approve" ? "\u901A\u8FC7" : record.action === "reject" ? "\u9A73\u56DE" : record.action,
    comment: record.remark || record.source || "",
    verifiedAt: record.created_at
  };
}
router8.get("/credits", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const credits = db2.prepare("SELECT * FROM green_credits WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id).map(mapCredit);
    res.json({ success: true, data: credits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router8.post("/credits", authMiddleware, async (req, res) => {
  try {
    if (req.user.customer_type !== "admin" && req.user.role !== "admin" && req.user.role !== "platform") {
      res.status(403).json({ success: false, error: "\u4EC5\u7BA1\u7406\u5458\u53EF\u53D1\u653E\u7EFF\u8272\u79EF\u5206" });
      return;
    }
    const { user_id, credit_type, type, amount, source, expired_at } = req.body;
    const targetUserId = user_id || req.user.id;
    const creditType = credit_type || type;
    if (!targetUserId || !creditType || !amount) {
      res.status(400).json({ success: false, error: "\u7528\u6237ID\u3001\u79EF\u5206\u7C7B\u578B\u548C\u6570\u91CF\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const db2 = getDb();
    const result = db2.prepare(
      "INSERT INTO green_credits (user_id, credit_type, amount, source, status, issued_at, expired_at) VALUES (?, ?, ?, ?, 'issued', datetime('now','localtime'), ?)"
    ).run(targetUserId, creditType, amount, source || null, expired_at || null);
    const credit = db2.prepare("SELECT * FROM green_credits WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: mapCredit(credit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
async function listVerifications(req, res) {
  try {
    const db2 = getDb();
    const { credit_id } = req.query;
    let sql = `SELECT cv.*, gc.credit_type, gc.amount, gc.source, gc.status as credit_status
      FROM credit_verifications cv
      JOIN green_credits gc ON cv.credit_id = gc.id
      JOIN users u ON gc.user_id = u.id
      WHERE u.id = ?`;
    const params = [req.user.id];
    if (credit_id) {
      sql += " AND cv.credit_id = ?";
      params.push(credit_id);
    }
    sql += " ORDER BY cv.created_at DESC";
    const verifications = db2.prepare(sql).all(...params).map(mapVerification);
    res.json({ success: true, data: verifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router8.get("/credits/verifications", authMiddleware, listVerifications);
router8.get("/verifications", authMiddleware, listVerifications);
router8.post("/verifications", authMiddleware, async (req, res) => {
  try {
    if (req.user.customer_type !== "admin") {
      res.status(403).json({ success: false, error: "\u4EC5\u7BA1\u7406\u5458\u53EF\u6838\u9A8C\u7EFF\u8272\u79EF\u5206" });
      return;
    }
    const { credit_id, action, remark } = req.body;
    if (!credit_id || !action) {
      res.status(400).json({ success: false, error: "\u79EF\u5206ID\u548C\u64CD\u4F5C\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const db2 = getDb();
    const credit = db2.prepare("SELECT * FROM green_credits WHERE id = ?").get(credit_id);
    if (!credit) {
      res.status(404).json({ success: false, error: "\u7EFF\u8272\u79EF\u5206\u8BB0\u5F55\u4E0D\u5B58\u5728" });
      return;
    }
    const newStatus = action === "approve" ? "verified" : "rejected";
    db2.prepare("UPDATE green_credits SET status = ?, verified_at = datetime('now','localtime') WHERE id = ?").run(newStatus, credit_id);
    const result = db2.prepare(
      "INSERT INTO credit_verifications (credit_id, verifier, action, remark) VALUES (?, ?, ?, ?)"
    ).run(credit_id, req.user.username, action, remark || null);
    const verification = db2.prepare("SELECT * FROM credit_verifications WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: verification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var green_default = router8;

// api/routes/compliance.ts
import { Router as Router9 } from "express";
var router9 = Router9();
function mapAudit(record) {
  const standard = Number(record.price_standard || 0);
  const actual = Number(record.actual_price || 0);
  const deviation = standard ? Number(((actual - standard) / standard * 100).toFixed(2)) : Number(record.deviation || 0);
  return {
    id: String(record.id),
    period: record.audit_period,
    standardPrice: standard,
    actualPrice: actual,
    deviation,
    status: record.status,
    createdAt: record.created_at
  };
}
function parseAuditTrail(value) {
  const text = String(value || "").trim();
  if (!text) return [];
  return text.split(";").map((item) => {
    const clean = item.trim();
    const match = clean.match(/^(.+?)\s+([^ ]+)$/);
    return {
      action: match ? match[2] : clean,
      operator: "\u7CFB\u7EDF",
      time: match ? match[1] : "",
      comment: clean
    };
  });
}
function mapSubsidy(record) {
  return {
    id: String(record.id),
    type: record.subsidy_type,
    amount: Number(record.amount || 0),
    status: record.status === "issued" ? "approved" : record.status,
    auditTrail: parseAuditTrail(record.audit_trail),
    createdAt: record.created_at
  };
}
router9.get("/price-audits", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const audits = db2.prepare("SELECT * FROM price_audits WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json({ success: true, data: audits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router9.get("/audits", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const audits = db2.prepare("SELECT * FROM price_audits WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id).map(mapAudit);
    res.json({ success: true, data: audits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router9.post("/price-audits", authMiddleware, async (req, res) => {
  try {
    const { audit_period, price_standard, actual_price } = req.body;
    if (!audit_period || price_standard === void 0 || actual_price === void 0) {
      res.status(400).json({ success: false, error: "\u5BA1\u8BA1\u5468\u671F\u3001\u6807\u51C6\u7535\u4EF7\u548C\u5B9E\u9645\u7535\u4EF7\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const deviation = Math.abs(actual_price - price_standard);
    const status = deviation === 0 ? "passed" : "deviation";
    const db2 = getDb();
    const result = db2.prepare(
      "INSERT INTO price_audits (user_id, audit_period, price_standard, actual_price, deviation, status) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(req.user.id, audit_period, price_standard, actual_price, Math.round(deviation * 1e4) / 1e4, status);
    const audit = db2.prepare("SELECT * FROM price_audits WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: audit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router9.post("/audits", authMiddleware, async (req, res) => {
  try {
    const { period, audit_period, standardPrice, price_standard, actualPrice, actual_price } = req.body;
    const auditPeriod = audit_period || period;
    const standard = price_standard ?? standardPrice;
    const actual = actual_price ?? actualPrice;
    if (!auditPeriod || standard === void 0 || actual === void 0) {
      res.status(400).json({ success: false, error: "\u5BA1\u8BA1\u5468\u671F\u3001\u6807\u51C6\u7535\u4EF7\u548C\u5B9E\u9645\u7535\u4EF7\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const deviation = Math.abs(Number(actual) - Number(standard));
    const status = deviation === 0 ? "passed" : "deviation";
    const db2 = getDb();
    const result = db2.prepare(
      "INSERT INTO price_audits (user_id, audit_period, price_standard, actual_price, deviation, status) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(req.user.id, auditPeriod, standard, actual, Math.round(deviation * 1e4) / 1e4, status);
    const audit = db2.prepare("SELECT * FROM price_audits WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: mapAudit(audit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router9.get("/subsidies", authMiddleware, async (req, res) => {
  try {
    const db2 = getDb();
    const subsidies = db2.prepare("SELECT * FROM subsidy_records WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id).map(mapSubsidy);
    res.json({ success: true, data: subsidies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router9.post("/subsidies", authMiddleware, async (req, res) => {
  try {
    const { subsidy_type, amount, policy_ref } = req.body;
    if (!subsidy_type || !amount) {
      res.status(400).json({ success: false, error: "\u8865\u8D34\u7C7B\u578B\u548C\u91D1\u989D\u4E3A\u5FC5\u586B\u9879" });
      return;
    }
    const db2 = getDb();
    const now = (/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
    const auditTrail = `${now} \u7533\u8BF7`;
    const result = db2.prepare(
      "INSERT INTO subsidy_records (user_id, subsidy_type, amount, policy_ref, status, audit_trail) VALUES (?, ?, ?, ?, 'pending', ?)"
    ).run(req.user.id, subsidy_type, amount, policy_ref || null, auditTrail);
    const subsidy = db2.prepare("SELECT * FROM subsidy_records WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: subsidy });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router9.put("/subsidies/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const db2 = getDb();
    const subsidy = db2.prepare("SELECT * FROM subsidy_records WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!subsidy) {
      res.status(404).json({ success: false, error: "\u8865\u8D34\u8BB0\u5F55\u4E0D\u5B58\u5728" });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
    const actionLabel = status === "issued" ? "\u53D1\u653E" : status === "approved" ? "\u5BA1\u6838\u901A\u8FC7" : status === "rejected" ? "\u9A73\u56DE" : status;
    const existingTrail = subsidy.audit_trail || "";
    const newTrail = existingTrail ? `${existingTrail}; ${now} ${actionLabel}` : `${now} ${actionLabel}`;
    const issuedAt = status === "issued" ? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) : subsidy.issued_at;
    db2.prepare("UPDATE subsidy_records SET status = ?, audit_trail = ?, issued_at = ? WHERE id = ?").run(status, newTrail, issuedAt, req.params.id);
    const updated = db2.prepare("SELECT * FROM subsidy_records WHERE id = ?").get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var compliance_default = router9;

// api/app.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
dotenv.config({ path: path2.resolve(__dirname2, "../.env"), override: true });
initDb();
var app = express();
var frontendPort = Number(process.env.FRONTEND_PORT || 48904);
app.use(cors({ origin: `http://127.0.0.1:${frontendPort}` }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.get("/api/dashboard", authMiddleware, (req, res) => {
  try {
    const db2 = getDb();
    const userId = req.user.id;
    const bills = db2.prepare(
      "SELECT * FROM electricity_bills WHERE user_id = ? ORDER BY billing_period DESC LIMIT 12"
    ).all(userId);
    const latestBill = bills[0];
    const carbon = db2.prepare(
      "SELECT * FROM carbon_footprints WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
    ).get(userId);
    const points = db2.prepare(
      "SELECT * FROM points_accounts WHERE user_id = ?"
    ).get(userId);
    const outages = db2.prepare(
      "SELECT id, title, status, start_time FROM outage_notifications WHERE status IN ('planned', 'active') ORDER BY start_time DESC LIMIT 3"
    ).all();
    const ascendingBills = [...bills].reverse();
    const monthlyChart = ascendingBills.map((bill) => ({
      month: String(bill.billing_period || "").slice(5) ? `${String(bill.billing_period).slice(5)}\u6708` : bill.billing_period,
      usage: Math.round(Number(bill.usage_kwh || 0) * 10) / 10
    }));
    const recentBills = bills.slice(0, 4).map((bill) => ({
      id: String(bill.id),
      period: bill.billing_period,
      amount: Number(bill.amount || 0),
      status: bill.status,
      dueDate: bill.due_date
    }));
    const alerts = outages.map((item) => ({
      id: String(item.id),
      title: item.title,
      level: item.status === "active" ? "danger" : "warning",
      time: item.start_time
    }));
    if (latestBill) {
      alerts.push({
        id: `bill-${latestBill.id}`,
        title: latestBill.status === "unpaid" ? "\u7535\u8D39\u8D26\u5355\u5DF2\u751F\u6210\uFF0C\u8BF7\u53CA\u65F6\u7F34\u7EB3" : "\u6700\u8FD1\u7535\u8D39\u8D26\u5355\u5DF2\u5B8C\u6210\u7F34\u8D39",
        level: latestBill.status === "unpaid" ? "danger" : "info",
        time: latestBill.due_date
      });
    }
    res.json({
      success: true,
      data: {
        monthlyUsage: Math.round(Number(latestBill?.usage_kwh || 0) * 10) / 10,
        monthlyCost: Math.round(Number(latestBill?.amount || 0) * 100) / 100,
        carbonEmission: Math.round(Number(carbon?.total_co2 || 0) * 10) / 10,
        pointsBalance: Number(points?.balance || 0),
        monthlyChart,
        recentBills,
        alerts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "\u83B7\u53D6\u603B\u89C8\u6570\u636E\u5931\u8D25" });
  }
});
app.use("/api/auth", auth_default);
app.use("/api/power", power_default);
app.use("/api/energy", energy_default);
app.use("/api/living", living_default);
app.use("/api/knowledge", knowledge_default);
app.use("/api/enterprise", enterprise_default);
app.use("/api/residential", residential_default);
app.use("/api/green", green_default);
app.use("/api/compliance", compliance_default);
app.use(
  "/api/health",
  (req, res, next) => {
    res.status(200).json({
      success: true,
      message: "ok"
    });
  }
);
app.use((error, req, res, next) => {
  res.status(500).json({
    success: false,
    error: "Server internal error"
  });
});
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "API not found"
  });
});
var app_default = app;

// api/server.ts
import dotenv2 from "dotenv";
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path3.dirname(__filename3);
dotenv2.config({ path: path3.resolve(__dirname3, "../.env"), override: true });
var PORT = parseInt(process.env.BACKEND_PORT || "58904", 10);
var HOST = "127.0.0.1";
var server = app_default.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
process.on("SIGINT", () => {
  console.log("SIGINT signal received");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
var server_default = app_default;
export {
  server_default as default
};
