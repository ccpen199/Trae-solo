const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

function initDatabase() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      gesture_password TEXT,
      nickname TEXT,
      avatar TEXT,
      balance REAL DEFAULT 0,
      total_invest REAL DEFAULT 0,
      total_earnings REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      remaining_amount REAL NOT NULL,
      min_invest REAL DEFAULT 100,
      max_invest REAL,
      interest_rate REAL NOT NULL,
      term INTEGER NOT NULL,
      term_unit TEXT DEFAULT 'month',
      status TEXT DEFAULT 'funding',
      risk_level TEXT DEFAULT 'medium',
      borrower TEXT,
      purpose TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      expected_earnings REAL NOT NULL,
      status TEXT DEFAULT 'investing',
      invest_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      maturity_time DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'completed',
      description TEXT,
      related_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS repayment_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      interest REAL NOT NULL,
      total REAL NOT NULL,
      plan_date DATE NOT NULL,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      FOREIGN KEY (investment_id) REFERENCES investments(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image TEXT NOT NULL,
      link TEXT,
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const countProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  if (countProjects === 0) {
    const projects = [
      { title: '新手专享-30天', description: '新用户专属理财项目，安全稳健', amount: 100000, remaining_amount: 100000, min_invest: 100, interest_rate: 8.5, term: 30, term_unit: 'day', risk_level: 'low', borrower: '优质企业A', purpose: '资金周转' },
      { title: '稳健盈-3个月', description: '中短期稳健投资项目', amount: 500000, remaining_amount: 500000, min_invest: 1000, interest_rate: 7.2, term: 3, term_unit: 'month', risk_level: 'medium', borrower: '优质企业B', purpose: '扩大经营' },
      { title: '增值宝-6个月', description: '中期增值优选项目', amount: 800000, remaining_amount: 800000, min_invest: 1000, interest_rate: 8.8, term: 6, term_unit: 'month', risk_level: 'medium', borrower: '优质企业C', purpose: '项目投资' },
      { title: '财富通-12个月', description: '长期财富规划项目', amount: 1000000, remaining_amount: 1000000, min_invest: 5000, interest_rate: 10.5, term: 12, term_unit: 'month', risk_level: 'medium_high', borrower: '优质企业D', purpose: '战略发展' },
    ];

    const insertProject = db.prepare(`
      INSERT INTO projects (title, description, amount, remaining_amount, min_invest, interest_rate, term, term_unit, risk_level, borrower, purpose)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of projects) {
      insertProject.run(p.title, p.description, p.amount, p.remaining_amount, p.min_invest, p.interest_rate, p.term, p.term_unit, p.risk_level, p.borrower, p.purpose);
    }
  }

  const countBanners = db.prepare('SELECT COUNT(*) as count FROM banners').get().count;
  if (countBanners === 0) {
    const banners = [
      { title: '新手注册送888元红包', image: 'https://picsum.photos/800/400?random=1', link: '/guide', sort_order: 1 },
      { title: '邀请好友享高额返现', image: 'https://picsum.photos/800/400?random=2', link: '/invite', sort_order: 2 },
      { title: '会员专享加息2%', image: 'https://picsum.photos/800/400?random=3', link: '/vip', sort_order: 3 },
    ];

    const insertBanner = db.prepare('INSERT INTO banners (title, image, link, sort_order) VALUES (?, ?, ?, ?)');
    for (const b of banners) {
      insertBanner.run(b.title, b.image, b.link, b.sort_order);
    }
  }
}

module.exports = { db, initDatabase };
