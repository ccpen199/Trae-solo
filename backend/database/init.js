const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS creators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    nickname TEXT,
    bio TEXT,
    verified INTEGER DEFAULT 0,
    verified_at DATETIME,
    follower_count INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_income REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    cover_url TEXT,
    video_url TEXT,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    topics TEXT,
    copyright_declaration TEXT,
    scheduled_at DATETIME,
    published_at DATETIME,
    views INTEGER DEFAULT 0,
    exposures INTEGER DEFAULT 0,
    plays INTEGER DEFAULT 0,
    completion_rate REAL DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    new_followers INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES creators(id)
  );

  CREATE TABLE IF NOT EXISTS audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER NOT NULL,
    auditor_id INTEGER,
    status TEXT DEFAULT 'pending',
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (work_id) REFERENCES works(id)
  );

  CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    work_id INTEGER,
    type TEXT NOT NULL,
    description TEXT,
    penalty TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES creators(id),
    FOREIGN KEY (work_id) REFERENCES works(id)
  );

  CREATE TABLE IF NOT EXISTS incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    work_id INTEGER,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    settlement_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES creators(id),
    FOREIGN KEY (work_id) REFERENCES works(id)
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    bank_info TEXT,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (creator_id) REFERENCES creators(id)
  );

  CREATE TABLE IF NOT EXISTS fan_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    age_group TEXT,
    gender TEXT,
    region TEXT,
    percentage REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES creators(id)
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    action TEXT NOT NULL,
    related_id INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES creators(id)
  );

  CREATE TABLE IF NOT EXISTS daily_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER NOT NULL,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    exposures INTEGER DEFAULT 0,
    plays INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    new_followers INTEGER DEFAULT 0,
    income REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(work_id, date),
    FOREIGN KEY (work_id) REFERENCES works(id)
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATETIME,
    end_date DATETIME,
    status TEXT DEFAULT 'active',
    reward TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS campaign_signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (creator_id) REFERENCES creators(id)
  );

  CREATE TABLE IF NOT EXISTS appeals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    violation_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reply TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (creator_id) REFERENCES creators(id),
    FOREIGN KEY (violation_id) REFERENCES violations(id)
  );
`);

const insertCreator = db.prepare(`
  INSERT OR IGNORE INTO creators (username, email, password, nickname, bio, verified, follower_count, total_views, total_income)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertCreator.run(
  'demo_creator',
  'demo@example.com',
  '$2a$10$demo',
  '演示创作者',
  '专注于优质内容创作',
  1,
  12580,
  895600,
  15860.50
);

const insertWorks = db.prepare(`
  INSERT OR IGNORE INTO works (creator_id, title, content, cover_url, type, status, topics, published_at, views, exposures, plays, likes, comments, favorites, new_followers)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleWorks = [
  [1, '如何打造爆款短视频', '详细讲解短视频创作技巧...', '/covers/1.jpg', 'video', 'published', '创作技巧,短视频', '2024-01-15 10:00:00', 45600, 128000, 38200, 2340, 156, 890, 45],
  [1, '2024年内容创作趋势', '分析今年最火的内容方向...', '/covers/2.jpg', 'article', 'published', '趋势分析,2024', '2024-01-10 14:30:00', 32100, 89000, 0, 1890, 89, 560, 32],
  [1, '待发布的美食教程', '教你做一道美味的家常菜...', '/covers/3.jpg', 'video', 'draft', '美食,教程', null, 0, 0, 0, 0, 0, 0, 0],
  [1, '生活VLOG：周末日常', '记录我的周末生活...', '/covers/4.jpg', 'video', 'auditing', 'VLOG,生活', null, 0, 0, 0, 0, 0, 0, 0],
];

sampleWorks.forEach(work => insertWorks.run(...work));

const insertAudits = db.prepare(`
  INSERT OR IGNORE INTO audits (work_id, status, reason, created_at)
  VALUES (?, ?, ?, ?)
`);

insertAudits.run(4, 'pending', null, '2024-01-20 09:00:00');

const insertViolations = db.prepare(`
  INSERT OR IGNORE INTO violations (creator_id, work_id, type, description, penalty, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertViolations.run(1, 1, 'copyright', '引用音乐未授权', 'warning', 'resolved', '2024-01-08 11:00:00');

const insertIncomes = db.prepare(`
  INSERT OR IGNORE INTO incomes (creator_id, work_id, type, amount, description, status, settlement_date, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleIncomes = [
  [1, 1, 'ad_share', 2340.50, '视频广告分成', 'settled', '2024-01-20 00:00:00', '2024-01-16 00:00:00'],
  [1, 2, 'ad_share', 1560.30, '文章广告分成', 'settled', '2024-01-15 00:00:00', '2024-01-11 00:00:00'],
  [1, null, 'reward', 500.00, '粉丝打赏', 'settled', '2024-01-18 00:00:00', '2024-01-17 00:00:00'],
  [1, 1, 'paid_content', 890.00, '付费专栏收入', 'pending', null, '2024-01-19 00:00:00'],
  [1, null, 'penalty', -200.00, '违规扣罚', 'settled', '2024-01-10 00:00:00', '2024-01-09 00:00:00'],
];

sampleIncomes.forEach(income => insertIncomes.run(...income));

const insertFanProfiles = db.prepare(`
  INSERT OR IGNORE INTO fan_profiles (creator_id, age_group, gender, region, percentage)
  VALUES (?, ?, ?, ?, ?)
`);

const fanData = [
  [1, '18-24', 'male', '广东', 15.5],
  [1, '25-34', 'male', '北京', 22.3],
  [1, '25-34', 'female', '上海', 18.7],
  [1, '35-44', 'male', '浙江', 12.1],
  [1, '18-24', 'female', '江苏', 14.2],
  [1, '45+', 'male', '四川', 8.2],
  [1, '35-44', 'female', '山东', 9.0],
];

fanData.forEach(f => insertFanProfiles.run(...f));

const insertActivities = db.prepare(`
  INSERT OR IGNORE INTO activities (creator_id, type, action, related_id, description, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const activities = [
  [1, 'publish', '发布作品', 1, '发布了《如何打造爆款短视频》', '2024-01-15 10:00:00'],
  [1, 'audit', '审核通过', 1, '作品《如何打造爆款短视频》审核通过', '2024-01-15 10:30:00'],
  [1, 'income', '获得收益', null, '获得广告分成 ¥2,340.50', '2024-01-16 00:00:00'],
  [1, 'violation', '违规提醒', 1, '作品存在版权问题，已警告', '2024-01-08 11:00:00'],
  [1, 'appeal', '申诉成功', null, '版权申诉已处理', '2024-01-09 15:00:00'],
];

activities.forEach(a => insertActivities.run(...a));

const insertWithdrawals = db.prepare(`
  INSERT OR IGNORE INTO withdrawals (creator_id, amount, status, bank_info, reason, created_at, processed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const getRecentDate = (daysAgo, timeStr = '10:00:00') => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0] + ' ' + timeStr;
};

const withdrawals = [
  [1, 500.00, 'settled', '招商银行 **** 8888', '已到账', getRecentDate(15, '09:30:00'), getRecentDate(15, '14:20:00')],
  [1, 1200.00, 'settled', '招商银行 **** 8888', '已到账', getRecentDate(8, '11:15:00'), getRecentDate(8, '16:45:00')],
  [1, 800.00, 'pending', '招商银行 **** 8888', '审核中，预计1-3个工作日到账', getRecentDate(2, '14:20:00'), null],
  [1, 3000.00, 'failed', '支付宝 138****5678', '账户信息有误，请核对后重新申请', getRecentDate(5, '16:30:00'), getRecentDate(4, '09:15:00')],
  [1, 2500.00, 'processing', '招商银行 **** 8888', '财务处理中', getRecentDate(3, '10:00:00'), null],
];

withdrawals.forEach(w => insertWithdrawals.run(...w));

const insertCampaigns = db.prepare(`
  INSERT OR IGNORE INTO campaigns (name, description, start_date, end_date, status, reward)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertCampaigns.run(
  '春节创作大赛',
  '春节期间创作相关内容，赢取丰厚奖励',
  '2024-01-20 00:00:00',
  '2024-02-20 23:59:59',
  'active',
  '一等奖：10000元现金奖励'
);

const insertDailyData = db.prepare(`
  INSERT OR IGNORE INTO daily_data (work_id, date, views, exposures, plays, likes, comments, favorites, new_followers, income)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getRecentDates = (days) => {
  const dates = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const recentDates = getRecentDates(7);
recentDates.forEach((date, i) => {
  const plays = 8000 + i * 2000;
  const completions = Math.round(plays * (0.65 + i * 0.02));
  insertDailyData.run(1, date, completions, 25000 + i * 5000, plays, 400 + i * 80, 30 + i * 10, 150 + i * 30, 8 + i * 2, 400 + i * 50);
});

const recentDates2 = getRecentDates(7);
recentDates2.forEach((date, i) => {
  const plays = 5000 + i * 1500;
  const completions = Math.round(plays * (0.58 + i * 0.03));
  insertDailyData.run(2, date, completions, 18000 + i * 4000, plays, 280 + i * 50, 15 + i * 8, 100 + i * 20, 5 + i * 1, 280 + i * 30);
});

db.close();
console.log('Database initialized successfully!');
