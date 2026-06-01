const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

let db;
const projectRoot = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

function resolveDbPath() {
  const configuredPath = process.env.DB_PATH || './data/app.sqlite';
  return path.isAbsolute(configuredPath) ? configuredPath : path.resolve(projectRoot, configuredPath);
}

function getDb() {
  if (!db) {
    const dbPath = resolveDbPath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function runQuery(sql, params = []) {
  const db = getDb();
  return db.prepare(sql).run(...params);
}

function getQuery(sql, params = []) {
  const db = getDb();
  return db.prepare(sql).get(...params);
}

function allQuery(sql, params = []) {
  const db = getDb();
  return db.prepare(sql).all(...params);
}

function initDb() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      age INTEGER NOT NULL,
      city TEXT NOT NULL,
      phone TEXT,
      occupation TEXT,
      education TEXT,
      marital_status TEXT,
      children TEXT,
      height INTEGER,
      weight INTEGER,
      income_range TEXT,
      housing TEXT,
      car TEXT,
      zodiac TEXT,
      personality TEXT,
      hobbies TEXT,
      about_me TEXT,
      photo_url TEXT,
      real_name_verified INTEGER DEFAULT 0,
      photo_verified INTEGER DEFAULT 0,
      work_verified INTEGER DEFAULT 0,
      education_verified INTEGER DEFAULT 0,
      privacy_scope TEXT DEFAULT 'public',
      is_vip INTEGER DEFAULT 0,
      vip_level INTEGER DEFAULT 0,
      vip_expires_at TEXT,
      status TEXT DEFAULT 'active',
      risk_score INTEGER DEFAULT 0,
      compatibility INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS profile_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      photo_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      verified_by INTEGER,
      verified_at TEXT,
      verification_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS mate_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      age_min INTEGER,
      age_max INTEGER,
      height_min INTEGER,
      height_max INTEGER,
      city TEXT,
      education TEXT,
      marital_status TEXT,
      income_range TEXT,
      must_have TEXT,
      must_not_have TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS values_assessment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      family_view TEXT,
      marriage_view TEXT,
      child_view TEXT,
      career_view TEXT,
      money_view TEXT,
      life_style TEXT,
      deal_breakers TEXT,
      score INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      blocked_profile_id INTEGER NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profile_id) REFERENCES profiles(id),
      FOREIGN KEY(blocked_profile_id) REFERENCES profiles(id),
      UNIQUE(profile_id, blocked_profile_id)
    );

    CREATE TABLE IF NOT EXISTS match_filters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      age_min INTEGER,
      age_max INTEGER,
      city TEXT,
      education TEXT,
      marital_status TEXT,
      verified_only INTEGER DEFAULT 0,
      exclude_blacklist INTEGER DEFAULT 1,
      hobbies_match TEXT,
      values_match_min INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_a_id INTEGER NOT NULL,
      profile_b_id INTEGER NOT NULL,
      match_score INTEGER DEFAULT 0,
      match_reasons TEXT,
      a_liked INTEGER DEFAULT 0,
      b_liked INTEGER DEFAULT 0,
      a_liked_at TEXT,
      b_liked_at TEXT,
      status TEXT DEFAULT 'pending',
      mutual_match_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profile_a_id) REFERENCES profiles(id),
      FOREIGN KEY(profile_b_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS matchmakers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      specialty TEXT,
      experience_years INTEGER,
      client_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS matchmaker_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matchmaker_id INTEGER NOT NULL,
      profile_id INTEGER NOT NULL,
      assignment_reason TEXT,
      status TEXT DEFAULT 'active',
      assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(matchmaker_id) REFERENCES matchmakers(id),
      FOREIGN KEY(profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS matchmaker_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matchmaker_id INTEGER NOT NULL,
      match_id INTEGER NOT NULL,
      recommendation_reason TEXT,
      recommendation_note TEXT,
      a_feedback TEXT,
      b_feedback TEXT,
      a_rating INTEGER,
      b_rating INTEGER,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(matchmaker_id) REFERENCES matchmakers(id),
      FOREIGN KEY(match_id) REFERENCES matches(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      matchmaker_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      location TEXT NOT NULL,
      a_confirmed INTEGER DEFAULT 0,
      b_confirmed INTEGER DEFAULT 0,
      a_attended INTEGER DEFAULT 0,
      b_attended INTEGER DEFAULT 0,
      a_feedback TEXT,
      b_feedback TEXT,
      result TEXT,
      follow_up_plan TEXT,
      status TEXT DEFAULT 'scheduled',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(match_id) REFERENCES matches(id),
      FOREIGN KEY(matchmaker_id) REFERENCES matchmakers(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      profile_id INTEGER NOT NULL,
      last_message TEXT,
      last_message_at TEXT,
      message_count INTEGER DEFAULT 0,
      has_sensitive_words INTEGER DEFAULT 0,
      last_sensitive_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(match_id) REFERENCES matches(id),
      FOREIGN KEY(profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_profile_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      has_sensitive_words INTEGER DEFAULT 0,
      sensitive_words_detected TEXT,
      blocked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id),
      FOREIGN KEY(sender_profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matchmaker_id INTEGER NOT NULL,
      match_id INTEGER,
      profile_id INTEGER,
      follow_up_type TEXT NOT NULL,
      follow_up_content TEXT NOT NULL,
      follow_up_date TEXT NOT NULL,
      result TEXT,
      next_follow_up_date TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(matchmaker_id) REFERENCES matchmakers(id),
      FOREIGN KEY(match_id) REFERENCES matches(id),
      FOREIGN KEY(profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      city TEXT NOT NULL,
      location TEXT,
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      seats INTEGER NOT NULL,
      registered INTEGER DEFAULT 0,
      fee REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      matchmaker_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(matchmaker_id) REFERENCES matchmakers(id)
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      profile_id INTEGER NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      amount REAL DEFAULT 0,
      paid_at TEXT,
      attended INTEGER DEFAULT 0,
      feedback TEXT,
      rating INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(event_id) REFERENCES events(id),
      FOREIGN KEY(profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_profile_id INTEGER NOT NULL,
      reported_profile_id INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      report_content TEXT NOT NULL,
      evidence TEXT,
      status TEXT DEFAULT 'pending',
      handled_by INTEGER,
      handled_at TEXT,
      handling_result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reporter_profile_id) REFERENCES profiles(id),
      FOREIGN KEY(reported_profile_id) REFERENCES profiles(id),
      FOREIGN KEY(handled_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS safety_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_id INTEGER,
      blocked_profile_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      duration TEXT,
      block_until TEXT,
      is_permanent INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(operator_id) REFERENCES users(id),
      FOREIGN KEY(blocked_profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS fraud_risks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      risk_type TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      risk_evidence TEXT,
      risk_score INTEGER DEFAULT 50,
      status TEXT DEFAULT 'pending',
      handled_by INTEGER,
      handled_at TEXT,
      handling_result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profile_id) REFERENCES profiles(id),
      FOREIGN KEY(handled_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sensitive_word_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      message_id INTEGER,
      sensitive_words TEXT NOT NULL,
      content TEXT,
      handled_by INTEGER,
      handled_at TEXT,
      handling_result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profile_id) REFERENCES profiles(id),
      FOREIGN KEY(message_id) REFERENCES messages(id),
      FOREIGN KEY(handled_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      payment_type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      transaction_id TEXT,
      status TEXT DEFAULT 'pending',
      paid_at TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_profile_id INTEGER NOT NULL,
      target_profile_id INTEGER,
      complaint_type TEXT NOT NULL,
      complaint_content TEXT NOT NULL,
      related_ticket_id INTEGER,
      status TEXT DEFAULT 'pending',
      handled_by INTEGER,
      handled_at TEXT,
      handling_result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reporter_profile_id) REFERENCES profiles(id),
      FOREIGN KEY(target_profile_id) REFERENCES profiles(id),
      FOREIGN KEY(handled_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS customer_service_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'open',
      assigned_to INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profile_id) REFERENCES profiles(id),
      FOREIGN KEY(assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      sender_id INTEGER,
      sender_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ticket_id) REFERENCES customer_service_tickets(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)');
    insertUser.run('admin', 'hash1', 'admin', 'active');
    insertUser.run('matchmaker1', 'hash2', 'matchmaker', 'active');
    insertUser.run('matchmaker2', 'hash3', 'matchmaker', 'active');
    insertUser.run('auditor', 'hash4', 'auditor', 'active');
    insertUser.run('service', 'hash5', 'service', 'active');
  }

  const mmCount = db.prepare('SELECT COUNT(*) AS count FROM matchmakers').get().count;
  if (mmCount === 0) {
    db.prepare('INSERT INTO matchmakers (user_id, name, phone, specialty, experience_years, status) VALUES (?, ?, ?, ?, ?, ?)').run(2, '李红娘', '13800000001', '高净值会员服务', 8, 'active');
    db.prepare('INSERT INTO matchmakers (user_id, name, phone, specialty, experience_years, status) VALUES (?, ?, ?, ?, ?, ?)').run(3, '王老师', '13800000002', '心理咨询与匹配', 6, 'active');
  }

  const profileCount = db.prepare('SELECT COUNT(*) AS count FROM profiles').get().count;
  if (profileCount === 0) {
    const insertProfile = db.prepare(`
      INSERT INTO profiles (name, gender, age, city, phone, occupation, education, marital_status, 
        children, height, weight, income_range, housing, car, zodiac, personality, hobbies, 
        about_me, photo_url, real_name_verified, photo_verified, work_verified, education_verified, 
        privacy_scope, is_vip, vip_level, status, compatibility)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const profiles = [
      ['林晨', '女', 31, '上海', '13900000001', '产品经理', '硕士', '未婚', '无', 165, 52, '30-50万', '有房', '有车', '处女座', '温柔稳重', '阅读,徒步,稳定沟通', '向往稳定的家庭生活，重视价值观契合', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face', 1, 1, 1, 1, 'public', 1, 1, 'active', 94],
      ['许诺', '女', 29, '杭州', '13900000002', '建筑设计师', '本科', '未婚', '无', 168, 55, '20-30万', '计划购房', '无车', '金牛座', '文艺清新', '城市漫步,摄影,猫', '热爱生活，追求品质，期待遇到懂我的人', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face', 1, 1, 1, 1, 'public', 1, 2, 'active', 89],
      ['周予安', '男', 34, '苏州', '13900000003', '数据工程师', '硕士', '未婚', '无', 180, 75, '50-80万', '有房', '有车', '摩羯座', '理性务实', '做饭,长跑,理财', '以结婚为目的，希望两年内组建家庭', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face', 1, 1, 1, 1, 'public', 1, 1, 'active', 91],
      ['沈清', '女', 30, '上海', '13900000004', '心理咨询师', '硕士', '离异', '有一女', 162, 50, '20-30万', '有房', '无车', '双鱼座', '善解人意', '公益,电影,慢旅行', '经历过婚姻，更懂珍惜，渴望灵魂共鸣', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face', 1, 1, 1, 1, 'friends', 0, 0, 'active', 87],
      ['陈浩宇', '男', 36, '上海', '13900000005', '投资总监', '硕士', '未婚', '无', 182, 78, '100万+', '有房多套', '有车', '狮子座', '自信果断', '高尔夫,红酒,旅行', '事业稳定，寻找温柔贤惠的伴侣', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face', 1, 1, 1, 1, 'public', 1, 3, 'active', 85],
      ['王雅婷', '女', 27, '南京', '13900000006', '大学讲师', '博士', '未婚', '无', 166, 53, '15-20万', '有房', '无车', '双子座', '活泼开朗', '读书,音乐,烘焙', '书香门第，寻找学历相当的伴侣', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face', 1, 1, 1, 1, 'public', 0, 0, 'active', 88],
      ['赵子轩', '男', 32, '杭州', '13900000007', '创业者', '本科', '未婚', '无', 178, 72, '80-100万', '有房', '有车', '射手座', '乐观开朗', '健身,登山,科技', '正在创业，期待共同成长的另一半', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face', 0, 1, 0, 1, 'public', 1, 1, 'active', 82],
      ['李思琪', '女', 28, '上海', '13900000008', '时尚编辑', '本科', '未婚', '无', 170, 50, '20-30万', '计划购房', '无车', '天秤座', '时尚知性', '时尚,艺术,瑜伽', '追求品质生活，寻找有品味的另一半', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face', 1, 0, 1, 1, 'public', 0, 0, 'active', 84],
    ];

    const profileIds = [];
    profiles.forEach((row, idx) => {
      const result = insertProfile.run(...row);
      profileIds.push(result.lastInsertRowid);

      db.prepare('INSERT INTO mate_preferences (profile_id, age_min, age_max, education, marital_status) VALUES (?, ?, ?, ?, ?)').run(result.lastInsertRowid, row[2]-10, row[2]+5, '本科以上', row[7]==='离异'?'不限':'未婚');
      db.prepare('INSERT INTO values_assessment (profile_id, family_view, marriage_view, child_view, score) VALUES (?, ?, ?, ?, ?)').run(result.lastInsertRowid, '家庭至上', '以结婚为目的', '婚后生育', 75+idx);
      db.prepare('INSERT INTO match_filters (profile_id, age_min, age_max, verified_only) VALUES (?, ?, ?, ?)').run(result.lastInsertRowid, row[2]-10, row[2]+5, 1);
      db.prepare('INSERT INTO profile_photos (profile_id, photo_url, is_primary, status) VALUES (?, ?, 1, ?)').run(result.lastInsertRowid, row[18], row[19]?'approved':'pending');
      db.prepare('INSERT INTO matchmaker_assignments (matchmaker_id, profile_id, assignment_reason, status) VALUES (?, ?, ?, ?)').run((idx%2)+1, result.lastInsertRowid, '初始分配', 'active');
    });

    const insertMatch = db.prepare('INSERT INTO matches (profile_a_id, profile_b_id, match_score, match_reasons, a_liked, b_liked, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const matches = [
      [1, 3, 92, '同城市,学历匹配,价值观接近,年龄匹配', 1, 1, 'matched'],
      [2, 7, 85, '同城市,兴趣相近,年龄匹配', 1, 1, 'matched'],
      [1, 5, 78, '同城市,经济条件匹配', 1, 0, 'pending'],
      [3, 2, 88, '地域接近,学历匹配,兴趣互补', 0, 1, 'pending'],
      [4, 3, 75, '价值观接近,经济条件匹配', 1, 0, 'pending'],
      [6, 3, 82, '学历匹配,年龄匹配', 0, 0, 'pending'],
      [8, 5, 80, '同城市,兴趣相近', 1, 1, 'dating'],
    ];
    const matchIds = [];
    matches.forEach(row => { const r = insertMatch.run(...row); matchIds.push(r.lastInsertRowid); });

    const insertConv = db.prepare('INSERT INTO conversations (match_id, profile_id, last_message, last_message_at, message_count) VALUES (?, ?, ?, ?, ?)');
    insertConv.run(matchIds[0], 1, '今晚可以继续聊聊彼此的长期规划。', '2026-05-28 18:12', 156);
    insertConv.run(matchIds[0], 3, '期待周末见面，我来安排餐厅。', '2026-05-28 17:30', 156);
    insertConv.run(matchIds[1], 2, '我把周末展览信息发给你了。', '2026-05-28 17:48', 89);
    insertConv.run(matchIds[6], 5, '关于城市选择，我倾向于先保持双城节奏。', '2026-05-28 16:30', 45);

    const insertMsg = db.prepare('INSERT INTO messages (conversation_id, sender_profile_id, content) VALUES (?, ?, ?)');
    insertMsg.run(1, 3, '你好林晨，很高兴认识你！');
    insertMsg.run(1, 1, '你好周予安，看了你的资料感觉很靠谱。');
    insertMsg.run(2, 2, '周末有个摄影展要不要一起去？');
    insertMsg.run(4, 5, '你平时喜欢什么运动？');

    const insertRec = db.prepare('INSERT INTO matchmaker_recommendations (matchmaker_id, match_id, recommendation_reason, recommendation_note, status) VALUES (?, ?, ?, ?, ?)');
    insertRec.run(1, matchIds[0], '双方都已实名认证，价值观高度契合，都在上海工作，家长已见过面，强烈推荐线下见面。', '林晨温柔稳重，周予安理性务实，性格互补。', 'success');
    insertRec.run(2, matchIds[1], '都在杭州，兴趣相近，许诺喜欢摄影，赵子轩喜欢登山，性格互补。', '许诺文艺清新，赵子轩乐观开朗，很般配。', 'pending');
    insertRec.run(1, matchIds[6], '都是上海高端会员，经济条件匹配，已交往3个月。', '双方家长都很满意，建议加快进度。', 'dating');

    const insertAppt = db.prepare('INSERT INTO appointments (match_id, matchmaker_id, appointment_date, appointment_time, location, a_confirmed, b_confirmed, a_attended, b_attended, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertAppt.run(matchIds[0], 1, '2026-06-01', '19:00', '上海外滩18号法餐厅', 1, 1, 1, 1, 'completed');
    insertAppt.run(matchIds[1], 2, '2026-06-08', '14:00', '杭州西湖美术馆', 1, 1, 0, 0, 'scheduled');
    insertAppt.run(matchIds[6], 1, '2026-06-15', '11:00', '上海外滩W酒店', 0, 0, 0, 0, 'scheduled');

    const insertFU = db.prepare('INSERT INTO follow_ups (matchmaker_id, match_id, profile_id, follow_up_type, follow_up_content, follow_up_date, next_follow_up_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertFU.run(1, matchIds[0], null, 'appointment_followup', '首次见面后回访，双方都很满意，计划第二次见面。', '2026-06-02', '2026-06-10', 'completed');
    insertFU.run(2, matchIds[1], null, 'appointment_reminder', '提醒明天下午的美术馆约会，已发送详细地址。', '2026-06-07', '2026-06-09', 'completed');
    insertFU.run(1, null, 1, 'client_call', '每周回访，了解近期交往情况，收集用户反馈。', '2026-05-29', '2026-06-05', 'pending');

    const insertEvent = db.prepare('INSERT INTO events (title, description, city, location, starts_at, ends_at, seats, registered, fee, status, matchmaker_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertEvent.run('周末小桌晚餐局', '8对优质单身男女，温馨小桌交流，红娘全程陪同', '上海', '外滩18号法餐厅', '2026-06-06 19:00', '2026-06-06 22:00', 16, 11, 399, 'active', 1);
    insertEvent.run('户外轻徒步同行', '西湖群山徒步，在自然中认识彼此，含午餐', '杭州', '西湖龙井村', '2026-06-13 09:30', '2026-06-13 17:00', 20, 14, 199, 'active', 2);
    insertEvent.run('价值观深聊沙龙', '深度交流婚恋观、家庭观，找到灵魂共鸣的TA', '苏州', '平江路文化空间', '2026-06-20 15:00', '2026-06-20 18:00', 12, 9, 149, 'active', 1);
    insertEvent.run('海归精英专场', '仅限海外背景会员参与，高端红酒品鉴', '上海', '陆家嘴IFC', '2026-06-27 19:00', '2026-06-27 22:00', 24, 18, 599, 'active', 1);
    insertEvent.run('8090后单身派对', '轻松愉快的派对氛围，互动游戏认识彼此', '南京', '1912街区', '2026-07-04 18:00', '2026-07-04 21:00', 30, 22, 129, 'active', 2);

    const insertReg = db.prepare('INSERT INTO event_registrations (event_id, profile_id, payment_status, amount, attended) VALUES (?, ?, ?, ?, ?)');
    insertReg.run(1, 1, 'completed', 399, 0);
    insertReg.run(1, 3, 'completed', 399, 0);
    insertReg.run(1, 5, 'completed', 399, 0);
    insertReg.run(2, 2, 'completed', 199, 0);
    insertReg.run(2, 7, 'completed', 199, 0);
    insertReg.run(3, 4, 'completed', 149, 0);
    insertReg.run(4, 5, 'completed', 599, 0);
    insertReg.run(4, 8, 'completed', 599, 0);

    db.prepare('INSERT INTO reports (reporter_profile_id, reported_profile_id, report_type, report_content, evidence, status) VALUES (?, ?, ?, ?, ?, ?)').run(4, 7, 'harassment', '对方发送骚扰信息，言语低俗，要求拉黑处理。', '聊天记录截图', 'pending');
    db.prepare('INSERT INTO reports (reporter_profile_id, reported_profile_id, report_type, report_content, evidence, status) VALUES (?, ?, ?, ?, ?, ?)').run(6, 8, 'fake_profile', '怀疑对方资料造假，学历和职业与实际不符。', '资料对比证据', 'pending');

    db.prepare('INSERT INTO safety_blocks (operator_id, blocked_profile_id, reason, duration, status) VALUES (?, ?, ?, ?, ?)').run(4, 2, '多次发送敏感词被检测', '30天', 'active');
    db.prepare('INSERT INTO blacklist (profile_id, blocked_profile_id, reason) VALUES (?, ?, ?)').run(4, 7, '骚扰');

    db.prepare('INSERT INTO fraud_risks (profile_id, risk_type, risk_level, risk_evidence, risk_score, status) VALUES (?, ?, ?, ?, ?, ?)').run(7, 'fake_identity', 'high', '学历证书与学信网查询不符，职业信息无法核实', 75, 'pending');
    db.prepare('INSERT INTO fraud_risks (profile_id, risk_type, risk_level, risk_evidence, risk_score, status) VALUES (?, ?, ?, ?, ?, ?)').run(8, 'money_laundering', 'medium', '频繁询问其他会员的财务状况，推荐投资产品', 55, 'pending');

    db.prepare('INSERT INTO sensitive_word_logs (profile_id, sensitive_words, content) VALUES (?, ?, ?)').run(2, '中奖,红包', '恭喜你中奖了！加我微信发红包。');
    db.prepare('INSERT INTO sensitive_word_logs (profile_id, sensitive_words, content) VALUES (?, ?, ?)').run(7, '包养,小姐', '我可以包养你，做我小姐吧。');

    db.prepare('INSERT INTO payments (profile_id, payment_type, amount, status, paid_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(1, 'vip_member', 2999, 'success', '2026-05-01', '2027-05-01');
    db.prepare('INSERT INTO payments (profile_id, payment_type, amount, status, paid_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(2, 'vip_member', 5999, 'success', '2026-04-15', '2027-04-15');
    db.prepare('INSERT INTO payments (profile_id, payment_type, amount, status, paid_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(3, 'vip_member', 2999, 'success', '2026-05-10', '2027-05-10');
    db.prepare('INSERT INTO payments (profile_id, payment_type, amount, status, paid_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(5, 'vip_member', 12999, 'success', '2026-03-01', '2027-03-01');
    db.prepare('INSERT INTO payments (profile_id, payment_type, amount, status, paid_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(7, 'vip_member', 2999, 'success', '2026-05-20', '2027-05-20');

    db.prepare('INSERT INTO complaints (reporter_profile_id, target_profile_id, complaint_type, complaint_content, status) VALUES (?, ?, ?, ?, ?)').run(1, null, 'matchmaker_service', '对红娘服务不满意，回访不及时，匹配推荐质量下降。', 'pending');
    db.prepare('INSERT INTO complaints (reporter_profile_id, target_profile_id, complaint_type, complaint_content, status) VALUES (?, ?, ?, ?, ?)').run(2, null, 'platform_service', 'APP经常闪退，消息发送失败，技术支持响应慢。', 'pending');

    db.prepare('INSERT INTO customer_service_tickets (profile_id, subject, description, category, priority, status, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)').run(1, '无法查看对方联系方式', '已实名认证并开通VIP，但仍无法查看对方的联系方式', 'profile_issue', 'high', 'open', 5);
    db.prepare('INSERT INTO customer_service_tickets (profile_id, subject, description, category, priority, status, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)').run(3, '修改资料性别错误', '注册时性别选错了，需要后台帮忙修改', 'account_issue', 'normal', 'in_progress', 5);

    db.prepare('INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, content) VALUES (?, ?, ?, ?)').run(1, 1, 'user', '已实名认证，VIP有效期到2027年，还是看不了对方联系方式。');
    db.prepare('INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, content) VALUES (?, ?, ?, ?)').run(1, 5, 'staff', '您好，已帮您检查权限，现在应该可以正常查看了，请刷新重试。');
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
    CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
    CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);
    CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(real_name_verified, photo_verified);
    CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
    CREATE INDEX IF NOT EXISTS idx_matches_profiles ON matches(profile_a_id, profile_b_id);
    CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(match_score);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_fraud_risks_status ON fraud_risks(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
  `);
}

module.exports = { getDb, initDb, runQuery, getQuery, allQuery };
