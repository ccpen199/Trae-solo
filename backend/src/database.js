const sqlite3 = require('sqlite3').verbose();
const deasync = require('deasync');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new sqlite3.Database(dbPath);

function syncQuery(method, sql, params = []) {
  let result = null;
  let error = null;
  let done = false;

  const callback = (err, rows) => {
    error = err;
    result = rows;
    done = true;
  };

  if (method === 'run') {
    db.run(sql, params, function(err) {
      error = err;
      result = { changes: this.changes, lastInsertRowid: this.lastID };
      done = true;
    });
  } else if (method === 'exec') {
    db.exec(sql, (err) => {
      error = err;
      result = undefined;
      done = true;
    });
  } else {
    db[method](sql, params, callback);
  }

  while (!done) {
    deasync.runLoopOnce();
  }

  if (error) {
    throw error;
  }

  return result;
}

class Statement {
  constructor(sql) {
    this.sql = sql;
  }

  all(...params) {
    return syncQuery('all', this.sql, params);
  }

  get(...params) {
    return syncQuery('get', this.sql, params);
  }

  run(...params) {
    return syncQuery('run', this.sql, params);
  }
}

const dbWrapper = {
  prepare(sql) {
    return new Statement(sql);
  },

  exec(sql) {
    return syncQuery('exec', sql, []);
  },

  pragma(sql) {
    return syncQuery('run', `PRAGMA ${sql}`, []);
  }
};

dbWrapper.pragma('journal_mode = WAL');
dbWrapper.pragma('foreign_keys = ON');

function initDatabase() {
  dbWrapper.exec(`
    CREATE TABLE IF NOT EXISTS volunteers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      id_card TEXT UNIQUE,
      avatar TEXT,
      total_hours REAL DEFAULT 0,
      blockchain_hash TEXT,
      skills TEXT,
      organization_history TEXT,
      current_org_id INTEGER,
      last_active_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      registration_number TEXT UNIQUE,
      ocr_result TEXT,
      credit_score INTEGER DEFAULT 100,
      activity_count INTEGER DEFAULT 0,
      contact_person TEXT,
      contact_phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      org_id INTEGER,
      location_name TEXT,
      latitude REAL,
      longitude REAL,
      geofence_radius REAL DEFAULT 500,
      risk_level TEXT DEFAULT 'low',
      insurance_covered INTEGER DEFAULT 0,
      start_time DATETIME,
      end_time DATETIME,
      required_hours REAL,
      required_skills TEXT,
      max_volunteers INTEGER,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS activity_signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER,
      volunteer_id INTEGER,
      status TEXT DEFAULT 'pending',
      checkin_time DATETIME,
      checkout_time DATETIME,
      checkin_lat REAL,
      checkin_lng REAL,
      checkout_lat REAL,
      checkout_lng REAL,
      gps_trajectory TEXT,
      actual_hours REAL,
      blockchain_hash TEXT,
      synced_to_provincial INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
    );

    CREATE TABLE IF NOT EXISTS yicoins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      volunteer_id INTEGER,
      balance INTEGER DEFAULT 0,
      total_earned INTEGER DEFAULT 0,
      total_spent INTEGER DEFAULT 0,
      last_earned_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
    );

    CREATE TABLE IF NOT EXISTS yicoin_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      volunteer_id INTEGER,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT,
      activity_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id),
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    );

    CREATE TABLE IF NOT EXISTS yicoin_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      hours_required REAL,
      coins_per_hour INTEGER DEFAULT 10,
      min_hours REAL DEFAULT 0,
      max_daily INTEGER DEFAULT 100,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      volunteer_id INTEGER,
      activity_id INTEGER,
      content TEXT NOT NULL,
      images TEXT,
      service_location TEXT,
      service_hours REAL,
      watermark_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id),
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    );

    CREATE TABLE IF NOT EXISTS org_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_org_id INTEGER,
      child_org_id INTEGER,
      relation_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_org_id) REFERENCES organizations(id),
      FOREIGN KEY (child_org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS anti_fraud_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      volunteer_id INTEGER,
      activity_id INTEGER,
      check_type TEXT,
      result TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id),
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'volunteer',
      volunteer_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
    );
  `);

  const ruleCount = dbWrapper.prepare('SELECT COUNT(*) as count FROM yicoin_rules').get().count;
  if (ruleCount === 0) {
    dbWrapper.prepare(`
      INSERT INTO yicoin_rules (name, description, hours_required, coins_per_hour, min_hours, max_daily)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('基础服务奖励', '常规志愿服务的益币奖励', null, 10, 0.5, 100);
  }

  const orgCount = dbWrapper.prepare('SELECT COUNT(*) as count FROM organizations').get().count;
  if (orgCount === 0) {
    const org1 = dbWrapper.prepare(`
      INSERT INTO organizations (name, registration_number, credit_score, activity_count, contact_person, contact_phone, address, ocr_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('阳光公益联盟', 'MZ-2024-001', 95, 15, '张主任', '13800138000', '北京市朝阳区公益路88号', 
      JSON.stringify({ code: 'MZ-2024-001', name: '阳光公益联盟', verified: true })).lastInsertRowid;
    
    const org2 = dbWrapper.prepare(`
      INSERT INTO organizations (name, registration_number, credit_score, activity_count, contact_person, contact_phone, address, ocr_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('青年志愿者协会', 'MZ-2024-002', 88, 8, '李秘书长', '13800138001', '上海市浦东新区志愿者大厦',
      JSON.stringify({ code: 'MZ-2024-002', name: '青年志愿者协会', verified: true })).lastInsertRowid;
    
    const org3 = dbWrapper.prepare(`
      INSERT INTO organizations (name, registration_number, credit_score, activity_count, contact_person, contact_phone, address, ocr_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('社区服务中心', 'MZ-2024-003', 92, 12, '王主任', '13800138002', '广州市天河区社区服务中心',
      JSON.stringify({ code: 'MZ-2024-003', name: '社区服务中心', verified: true })).lastInsertRowid;

    dbWrapper.prepare(`INSERT INTO org_relations (parent_org_id, child_org_id, relation_type) VALUES (?, ?, ?)`).run(org1, org2, 'member');
    dbWrapper.prepare(`INSERT INTO org_relations (parent_org_id, child_org_id, relation_type) VALUES (?, ?, ?)`).run(org1, org3, 'affiliate');

    const adminPass = require('bcryptjs').hashSync('admin123', 10);
    dbWrapper.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run('admin', adminPass, 'admin');

    const v1 = dbWrapper.prepare(`
      INSERT INTO volunteers (name, phone, id_card, total_hours, blockchain_hash, skills, organization_history, current_org_id, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('李明', '13900139001', '110101199001010001', 125.5, 
      'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      '急救,护理,社区服务',
      JSON.stringify([{org_id:1,org_name:'阳光公益联盟',period:'2024-01至2025-12'}]),
      org1, '2026-06-01 10:30:00').lastInsertRowid;
    
    const v2 = dbWrapper.prepare(`
      INSERT INTO volunteers (name, phone, id_card, total_hours, blockchain_hash, skills, organization_history, current_org_id, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('王芳', '13900139002', '110101199202020002', 86.0,
      'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      '翻译,教育,心理咨询',
      JSON.stringify([{org_id:2,org_name:'青年志愿者协会',period:'2024-03至今'}]),
      org2, '2026-05-28 14:20:00').lastInsertRowid;
    
    const v3 = dbWrapper.prepare(`
      INSERT INTO volunteers (name, phone, id_card, total_hours, blockchain_hash, skills, organization_history, current_org_id, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('张伟', '13900139003', '110101198803030003', 210.5,
      'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
      '驾驶,环保,文体活动',
      JSON.stringify([{org_id:3,org_name:'社区服务中心',period:'2023-06至今'}]),
      org3, '2026-06-02 08:15:00').lastInsertRowid;
    
    const v4 = dbWrapper.prepare(`
      INSERT INTO volunteers (name, phone, id_card, total_hours, blockchain_hash, skills, organization_history, current_org_id, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('刘洋', '13900139004', '110101199504040004', 42.0,
      'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
      '教育,翻译,社区服务',
      JSON.stringify([{org_id:1,org_name:'阳光公益联盟',period:'2024-08至今'}]),
      org1, '2026-05-15 09:00:00').lastInsertRowid;
    
    const v5 = dbWrapper.prepare(`
      INSERT INTO volunteers (name, phone, id_card, total_hours, blockchain_hash, skills, organization_history, current_org_id, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('陈静', '13900139005', '110101199105050005', 158.5,
      'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
      '护理,心理咨询,法律援助',
      JSON.stringify([{org_id:2,org_name:'青年志愿者协会',period:'2023-11至2025-05'},{org_id:1,org_name:'阳光公益联盟',period:'2025-06至今'}]),
      org1, '2026-06-01 16:45:00').lastInsertRowid;

    const v6 = dbWrapper.prepare(`
      INSERT INTO volunteers (name, phone, id_card, total_hours, blockchain_hash, skills, organization_history, current_org_id, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('赵强', '13900139006', '110101198706060006', 12.5,
      'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
      '急救,环保',
      JSON.stringify([{org_id:3,org_name:'社区服务中心',period:'2024-02至2026-03'}]),
      org3, '2026-04-20 11:30:00').lastInsertRowid;

    dbWrapper.prepare('INSERT INTO yicoins (volunteer_id, balance, total_earned, total_spent, last_earned_at) VALUES (?, ?, ?, ?, ?)').run(v1, 850, 1255, 405, '2026-06-01 10:30:00');
    dbWrapper.prepare('INSERT INTO yicoins (volunteer_id, balance, total_earned, total_spent, last_earned_at) VALUES (?, ?, ?, ?, ?)').run(v2, 620, 860, 240, '2026-05-28 14:20:00');
    dbWrapper.prepare('INSERT INTO yicoins (volunteer_id, balance, total_earned, total_spent, last_earned_at) VALUES (?, ?, ?, ?, ?)').run(v3, 1420, 2105, 685, '2026-06-02 08:15:00');
    dbWrapper.prepare('INSERT INTO yicoins (volunteer_id, balance, total_earned, total_spent, last_earned_at) VALUES (?, ?, ?, ?, ?)').run(v4, 310, 420, 110, '2026-05-15 09:00:00');
    dbWrapper.prepare('INSERT INTO yicoins (volunteer_id, balance, total_earned, total_spent, last_earned_at) VALUES (?, ?, ?, ?, ?)').run(v5, 1080, 1585, 505, '2026-06-01 16:45:00');
    dbWrapper.prepare('INSERT INTO yicoins (volunteer_id, balance, total_earned, total_spent, last_earned_at) VALUES (?, ?, ?, ?, ?)').run(v6, 85, 125, 40, '2026-04-20 11:30:00');

    dbWrapper.prepare('INSERT INTO yicoin_transactions (volunteer_id, type, amount, reason, created_at) VALUES (?, ?, ?, ?, ?)').run(v1, 'earn', 80, '社区志愿服务8小时', '2026-06-01 10:30:00');
    dbWrapper.prepare('INSERT INTO yicoin_transactions (volunteer_id, type, amount, reason, created_at) VALUES (?, ?, ?, ?, ?)').run(v1, 'spend', -50, '兑换培训课程', '2026-05-20 15:00:00');
    dbWrapper.prepare('INSERT INTO yicoin_transactions (volunteer_id, type, amount, reason, created_at) VALUES (?, ?, ?, ?, ?)').run(v3, 'earn', 60, '环保宣传活动6小时', '2026-06-02 08:15:00');
    dbWrapper.prepare('INSERT INTO yicoin_transactions (volunteer_id, type, amount, reason, created_at) VALUES (?, ?, ?, ?, ?)').run(v5, 'earn', 45, '心理咨询服务4.5小时', '2026-06-01 16:45:00');

    const a1 = dbWrapper.prepare(`
      INSERT INTO activities (title, description, org_id, location_name, latitude, longitude, geofence_radius, risk_level, insurance_covered, start_time, end_time, required_hours, required_skills, max_volunteers, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('社区敬老爱老志愿服务', '为社区孤寡老人提供陪伴、生活照料、健康检查等服务',
      org1, '北京市朝阳区幸福社区活动中心', 39.9288, 116.4472, 500, 'low', 1,
      '2026-06-10 09:00:00', '2026-06-10 17:00:00', 6.0, '护理,社区服务,心理咨询', 30, 'published').lastInsertRowid;
    
    const a2 = dbWrapper.prepare(`
      INSERT INTO activities (title, description, org_id, location_name, latitude, longitude, geofence_radius, risk_level, insurance_covered, start_time, end_time, required_hours, required_skills, max_volunteers, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('城市河道环保清洁行动', '清理城市河道垃圾，开展环保知识宣传，保护母亲河',
      org2, '上海市浦东新区黄浦江畔', 31.2304, 121.4737, 800, 'medium', 1,
      '2026-06-15 08:00:00', '2026-06-15 16:00:00', 7.0, '环保,驾驶,社区服务', 50, 'published').lastInsertRowid;
    
    const a3 = dbWrapper.prepare(`
      INSERT INTO activities (title, description, org_id, location_name, latitude, longitude, geofence_radius, risk_level, insurance_covered, start_time, end_time, required_hours, required_skills, max_volunteers, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('山区小学支教活动', '为山区小学提供语文、英语、艺术等学科的短期支教服务',
      org3, '云南省丽江市宁蒗县希望小学', 27.0465, 100.9350, 1000, 'high', 1,
      '2026-07-01 08:00:00', '2026-07-15 18:00:00', 80.0, '教育,翻译,文体活动', 20, 'published').lastInsertRowid;
    
    const a4 = dbWrapper.prepare(`
      INSERT INTO activities (title, description, org_id, location_name, latitude, longitude, geofence_radius, risk_level, insurance_covered, start_time, end_time, required_hours, required_skills, max_volunteers, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('大型招聘会志愿服务', '为春季大型人才招聘会提供现场引导、咨询、秩序维护等服务',
      org1, '广州市天河区体育中心', 23.1375, 113.3299, 600, 'medium', 0,
      '2026-06-20 08:30:00', '2026-06-21 18:00:00', 12.0, '社区服务,驾驶,文体活动', 40, 'published').lastInsertRowid;
    
    const a5 = dbWrapper.prepare(`
      INSERT INTO activities (title, description, org_id, location_name, latitude, longitude, geofence_radius, risk_level, insurance_covered, start_time, end_time, required_hours, required_skills, max_volunteers, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('法律援助进社区', '为社区居民提供免费法律咨询、法律援助文书撰写等服务',
      org2, '深圳市南山区科技园社区', 22.5431, 113.9411, 500, 'low', 0,
      '2026-06-08 14:00:00', '2026-06-08 18:00:00', 3.5, '法律援助,心理咨询,社区服务', 10, 'published').lastInsertRowid;
    
    const a6 = dbWrapper.prepare(`
      INSERT INTO activities (title, description, org_id, location_name, latitude, longitude, geofence_radius, risk_level, insurance_covered, start_time, end_time, required_hours, required_skills, max_volunteers, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('应急救护培训演练', '面向志愿者的专业急救技能培训，含心肺复苏、止血包扎等实操演练',
      org3, '成都市武侯区应急指挥中心', 30.5728, 104.0668, 400, 'medium', 1,
      '2026-06-25 09:00:00', '2026-06-25 17:00:00', 7.0, '急救,护理', 25, 'published').lastInsertRowid;

    const a7 = dbWrapper.prepare(`
      INSERT INTO activities (title, description, org_id, location_name, latitude, longitude, geofence_radius, risk_level, insurance_covered, start_time, end_time, required_hours, required_skills, max_volunteers, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('国际会议外语翻译服务', '为大型国际会议提供多语种同声传译和随行翻译服务',
      org1, '北京市朝阳区国家会议中心', 40.0027, 116.3894, 500, 'low', 0,
      '2026-07-05 08:00:00', '2026-07-08 20:00:00', 40.0, '翻译,教育,文体活动', 15, 'published').lastInsertRowid;

    const s1 = dbWrapper.prepare(`
      INSERT INTO activity_signups (activity_id, volunteer_id, status, checkin_time, checkout_time, checkin_lat, checkin_lng, checkout_lat, checkout_lng, actual_hours, blockchain_hash, gps_trajectory, synced_to_provincial)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(a1, v1, 'completed', '2026-05-10 09:05:00', '2026-05-10 15:05:00',
      39.9288, 116.4472, 39.9289, 116.4473, 6.0,
      'f1e2d3c4b5a697887766554433221100ffeeddccbbaa99887766554433221100',
      JSON.stringify([{lat:39.9288,lng:116.4472,time:1715312700000},{lat:39.9289,lng:116.4473,time:1715334300000}]), 1).lastInsertRowid;
    
    const s2 = dbWrapper.prepare(`
      INSERT INTO activity_signups (activity_id, volunteer_id, status, checkin_time, checkout_time, checkin_lat, checkin_lng, checkout_lat, checkout_lng, actual_hours, blockchain_hash, gps_trajectory, synced_to_provincial)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(a2, v3, 'completed', '2026-05-15 08:03:00', '2026-05-15 15:03:00',
      31.2304, 121.4737, 31.2305, 121.4738, 7.0,
      'a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
      JSON.stringify([{lat:31.2304,lng:121.4737,time:1715743380000},{lat:31.2305,lng:121.4738,time:1715768580000}]), 1).lastInsertRowid;
    
    const s3 = dbWrapper.prepare(`
      INSERT INTO activity_signups (activity_id, volunteer_id, status, checkin_time, checkout_time, checkin_lat, checkin_lng, checkout_lat, checkout_lng, actual_hours, blockchain_hash, gps_trajectory, synced_to_provincial)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(a5, v5, 'completed', '2026-05-08 14:02:00', '2026-05-08 17:32:00',
      22.5431, 113.9411, 22.5432, 113.9412, 3.5,
      'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
      JSON.stringify([{lat:22.5431,lng:113.9411,time:1715151720000}]), 0).lastInsertRowid;

    dbWrapper.prepare(`INSERT INTO activity_signups (activity_id, volunteer_id, status) VALUES (?, ?, ?)`).run(a1, v2, 'approved');
    dbWrapper.prepare(`INSERT INTO activity_signups (activity_id, volunteer_id, status) VALUES (?, ?, ?)`).run(a3, v2, 'approved');
    dbWrapper.prepare(`INSERT INTO activity_signups (activity_id, volunteer_id, status) VALUES (?, ?, ?)`).run(a6, v1, 'approved');
    dbWrapper.prepare(`INSERT INTO activity_signups (activity_id, volunteer_id, status) VALUES (?, ?, ?)`).run(a4, v3, 'approved');
    dbWrapper.prepare(`INSERT INTO activity_signups (activity_id, volunteer_id, status) VALUES (?, ?, ?)`).run(a7, v4, 'approved');

    const p1 = dbWrapper.prepare(`
      INSERT INTO posts (volunteer_id, activity_id, content, images, service_location, service_hours, watermark_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(v1, a1, '今天在幸福社区陪伴了5位孤寡老人，帮他们打扫卫生、测量血压。王奶奶还给我们看了她年轻时的照片，特别感动。志愿服务让我们的城市更温暖！',
      JSON.stringify(['photo1.jpg', 'photo2.jpg']), '北京市朝阳区幸福社区', 6.0,
      'wm_' + Math.random().toString(36).substring(2, 15)).lastInsertRowid;
    
    const p2 = dbWrapper.prepare(`
      INSERT INTO posts (volunteer_id, activity_id, content, images, service_location, service_hours, watermark_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(v3, a2, '今天在黄浦江畔清理了满满3袋垃圾，看到河水变清感觉一切都值得。保护环境，人人有责！下次活动还要来！',
      JSON.stringify(['river1.jpg', 'river2.jpg', 'river3.jpg']), '上海市浦东新区黄浦江畔', 7.0,
      'wm_' + Math.random().toString(36).substring(2, 15)).lastInsertRowid;
    
    const p3 = dbWrapper.prepare(`
      INSERT INTO posts (volunteer_id, activity_id, content, images, service_location, service_hours, watermark_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(v5, a5, '今天为社区3位居民提供了法律咨询服务，帮张阿姨解决了房产继承的问题，她握着我的手说谢谢的时候真的很有成就感。',
      JSON.stringify(['law1.jpg']), '深圳市南山区科技园社区', 3.5,
      'wm_' + Math.random().toString(36).substring(2, 15)).lastInsertRowid;
    
    const p4 = dbWrapper.prepare(`
      INSERT INTO posts (volunteer_id, activity_id, content, service_location, service_hours, watermark_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(v2, null, '刚报名了云南山区支教活动，准备出发！希望能用我的英语知识帮助更多的孩子看到外面的世界。',
      '北京市朝阳区', 0,
      'wm_' + Math.random().toString(36).substring(2, 15)).lastInsertRowid;

    const volunteerPass = require('bcryptjs').hashSync('volunteer123', 10);
    dbWrapper.prepare(`INSERT INTO users (username, password, role, volunteer_id) VALUES (?, ?, ?, ?)`).run('liming', volunteerPass, 'volunteer', v1);
    dbWrapper.prepare(`INSERT INTO users (username, password, role, volunteer_id) VALUES (?, ?, ?, ?)`).run('wangfang', volunteerPass, 'volunteer', v2);
    dbWrapper.prepare(`INSERT INTO users (username, password, role, volunteer_id) VALUES (?, ?, ?, ?)`).run('zhangwei', volunteerPass, 'volunteer', v3);
  }
}

initDatabase();

module.exports = dbWrapper;
