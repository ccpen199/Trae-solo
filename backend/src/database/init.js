const db = require('./index');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('jobseeker', 'hr', 'admin')),
      avatar TEXT,
      phone TEXT,
      device_fingerprint TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'frozen', 'pending')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      industry TEXT,
      scale TEXT,
      description TEXT,
      license_number TEXT,
      license_image TEXT,
      verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'verified', 'rejected')),
      bank_account TEXT,
      bank_verified INTEGER DEFAULT 0,
      verification_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobseekers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      real_name TEXT,
      gender TEXT,
      age INTEGER,
      city TEXT,
      location_lat REAL,
      location_lng REAL,
      work_years INTEGER,
      education TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobseeker_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      skills TEXT,
      expected_salary_min INTEGER,
      expected_salary_max INTEGER,
      available_date DATE,
      work_experience TEXT,
      education_experience TEXT,
      self_intro TEXT,
      is_active INTEGER DEFAULT 1,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jobseeker_id) REFERENCES jobseekers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      hr_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      requirements TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      city TEXT,
      location_lat REAL,
      location_lng REAL,
      address TEXT,
      work_type TEXT,
      experience_required TEXT,
      education_required TEXT,
      video_url TEXT,
      office_images TEXT,
      team_vlog_url TEXT,
      is_active INTEGER DEFAULT 1,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (hr_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      resume_id INTEGER NOT NULL,
      jobseeker_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'interview', 'offer', 'rejected')),
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
      FOREIGN KEY (jobseeker_id) REFERENCES jobseekers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobseeker_id INTEGER NOT NULL,
      hr_id INTEGER NOT NULL,
      job_id INTEGER,
      last_message TEXT,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jobseeker_id) REFERENCES jobseekers(id) ON DELETE CASCADE,
      FOREIGN KEY (hr_id) REFERENCES users(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'text' CHECK(type IN ('text', 'voice', 'file', 'image')),
      file_url TEXT,
      file_name TEXT,
      duration INTEGER,
      intent TEXT,
      intent_data TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS live_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      hr_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      stream_url TEXT,
      status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'live', 'ended')),
      viewer_count INTEGER DEFAULT 0,
      start_time DATETIME,
      end_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (hr_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS live_danmakus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      live_room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (live_room_id) REFERENCES live_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS communities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('industry', 'company', 'alumni')),
      category TEXT,
      city TEXT,
      description TEXT,
      member_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS community_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(community_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      is_anonymous INTEGER DEFAULT 0,
      type TEXT DEFAULT 'question' CHECK(type IN ('question', 'discussion', 'referral')),
      view_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      job_id INTEGER,
      company_name TEXT,
      position TEXT,
      reward TEXT,
      contact_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      target_type TEXT NOT NULL CHECK(target_type IN ('user', 'job', 'post', 'message', 'resume')),
      target_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved', 'rejected')),
      handled_by INTEGER,
      handled_at DATETIME,
      handling_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS behavior_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      ip TEXT,
      user_agent TEXT,
      device_fingerprint TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS browse_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      job_id INTEGER,
      resume_id INTEGER,
      browse_time INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedule_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      message_id INTEGER NOT NULL,
      suggested_date DATE,
      suggested_time TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);
    CREATE INDEX IF NOT EXISTS idx_resumes_active ON resumes(is_active);
    CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_chats_jobseeker ON chats(jobseeker_id);
    CREATE INDEX IF NOT EXISTS idx_chats_hr ON chats(hr_id);
    CREATE INDEX IF NOT EXISTS idx_browse_user ON browse_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_behavior_user ON behavior_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_behavior_fp ON behavior_logs(device_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  `);

  console.log('Database tables initialized successfully.');
}

function seedData() {
  const bcrypt = require('bcryptjs');
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('Data already seeded, skipping.');
    return;
  }

  const hashedPassword = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  const adminId = insertUser.run('admin', 'admin@jobmatch.com', hashedPassword, 'admin', '13800000000').lastInsertRowid;
  const hrId = insertUser.run('hr_tech', 'hr@techcorp.com', hashedPassword, 'hr', '13800000001').lastInsertRowid;
  const hr2Id = insertUser.run('hr_finance', 'hr@finance.com', hashedPassword, 'hr', '13800000002').lastInsertRowid;
  const js1Id = insertUser.run('zhangsan', 'zhangsan@email.com', hashedPassword, 'jobseeker', '13800000003').lastInsertRowid;
  const js2Id = insertUser.run('lisi', 'lisi@email.com', hashedPassword, 'jobseeker', '13800000004').lastInsertRowid;
  const js3Id = insertUser.run('wangwu', 'wangwu@email.com', hashedPassword, 'jobseeker', '13800000005').lastInsertRowid;

  const insertCompany = db.prepare(`
    INSERT INTO companies (user_id, name, industry, scale, description, verification_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const company1Id = insertCompany.run(hrId, '科技创新有限公司', '互联网/科技', '500-1000人', '致力于人工智能和大数据研发的高科技企业', 'verified').lastInsertRowid;
  const company2Id = insertCompany.run(hr2Id, '金融控股集团', '金融/投资', '1000-5000人', '大型综合性金融服务集团', 'verified').lastInsertRowid;

  const insertJobseeker = db.prepare(`
    INSERT INTO jobseekers (user_id, real_name, gender, age, city, location_lat, location_lng, work_years, education)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const js1 = insertJobseeker.run(js1Id, '张三', '男', 26, '北京市朝阳区', 39.9087, 116.4074, 3, '本科').lastInsertRowid;
  const js2 = insertJobseeker.run(js2Id, '李四', '女', 24, '北京市海淀区', 39.9599, 116.2985, 1, '硕士').lastInsertRowid;
  const js3 = insertJobseeker.run(js3Id, '王五', '男', 30, '北京市西城区', 39.9128, 116.3634, 6, '本科').lastInsertRowid;

  const insertResume = db.prepare(`
    INSERT INTO resumes (jobseeker_id, title, skills, expected_salary_min, expected_salary_max, available_date, self_intro, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertResume.run(js1, '高级前端工程师', JSON.stringify(['React', 'Vue', 'TypeScript', 'Node.js', 'Webpack']), 25000, 35000, '2024-06-01', '5年前端开发经验，熟悉React生态，有大型项目架构经验。', 1);
  insertResume.run(js2, '产品经理', JSON.stringify(['需求分析', '原型设计', '数据分析', 'Axure', 'Figma']), 20000, 28000, '2024-05-20', '硕士毕业，1年互联网产品经验，善于用户研究和数据驱动决策。', 1);
  insertResume.run(js3, 'Java后端开发工程师', JSON.stringify(['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker', 'Kubernetes']), 30000, 45000, '2024-06-15', '6年Java开发经验，有高并发系统设计经验，熟悉微服务架构。', 1);

  const insertJob = db.prepare(`
    INSERT INTO jobs (company_id, hr_id, title, description, requirements, salary_min, salary_max, city, location_lat, location_lng, address, work_type, experience_required, education_required, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertJob.run(
    company1Id, hrId, '资深前端开发工程师',
    '负责公司核心产品的前端架构设计和开发工作，参与技术选型和性能优化。',
    JSON.stringify(['3年以上前端开发经验', '精通React/Vue框架', '熟悉TypeScript', '有大型项目经验优先']),
    25000, 40000, '北京市朝阳区', 39.9219, 116.4435, '朝阳区望京SOHO T3', '全职', '3-5年', '本科', 1
  );
  insertJob.run(
    company1Id, hrId, 'AI算法工程师',
    '负责公司AI产品的算法研发和模型优化工作，包括NLP、CV等方向。',
    JSON.stringify(['硕士以上学历', '熟悉深度学习框架', '有NLP/CV项目经验', '发表过论文优先']),
    35000, 60000, '北京市朝阳区', 39.9219, 116.4435, '朝阳区望京SOHO T3', '全职', '1-3年', '硕士', 1
  );
  insertJob.run(
    company2Id, hr2Id, '高级Java开发工程师',
    '负责金融核心系统的设计与开发，保障系统的稳定性和可扩展性。',
    JSON.stringify(['5年以上Java开发经验', '熟悉Spring Cloud微服务架构', '有金融行业经验优先', '熟悉分布式系统设计']),
    30000, 50000, '北京市西城区', 39.9163, 116.3504, '西城区金融街15号', '全职', '5-10年', '本科', 1
  );
  insertJob.run(
    company2Id, hr2Id, '数据分析师',
    '负责业务数据分析，提供数据驱动的决策支持，搭建数据分析体系。',
    JSON.stringify(['3年以上数据分析经验', '熟练使用SQL/Python', '有金融行业经验优先', '熟悉BI工具']),
    20000, 35000, '北京市西城区', 39.9163, 116.3504, '西城区金融街15号', '全职', '1-3年', '本科', 1
  );

  const insertCommunity = db.prepare(`
    INSERT INTO communities (name, type, category, city, description, member_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertCommunity.run('北京互联网从业者圈', 'industry', '互联网', '北京市', '北京地区互联网行业从业者交流社区', 2580);
  insertCommunity.run('北京金融精英汇', 'industry', '金融', '北京市', '北京金融行业从业者专业交流平台', 1850);
  insertCommunity.run('科技创新有限公司', 'company', '互联网', '北京市', '公司内部员工交流社区', 320);
  insertCommunity.run('北京大学校友圈', 'alumni', '综合', '北京市', '北京大学校友交流平台', 5680);
  insertCommunity.run('清华校友职业发展群', 'alumni', '综合', '北京市', '清华大学校友职业交流平台', 4200);

  const insertPost = db.prepare(`
    INSERT INTO community_posts (community_id, user_id, title, content, is_anonymous, type, view_count, reply_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPost.run(1, js1Id, '前端面试一般问什么？', '下周要去面一家大厂，想问问大家前端3年经验一般会问哪些技术点？', 0, 'question', 156, 23);
  insertPost.run(2, js2Id, '匿名：金融行业996严重吗？', '最近收到金融公司offer，想了解下真实工作强度，麻烦各位前辈解答。', 1, 'question', 342, 45);
  insertPost.run(1, hrId, '【内推】字节跳动前端HC多多', '部门扩招，前端多岗位，有意向的同学可以发简历到我邮箱，附内推码直通面试。', 0, 'referral', 892, 67);
  insertPost.run(3, hr2Id, '公司年会节目征集', '一年一度的年会即将到来，欢迎大家积极报名节目，有丰厚奖品！', 0, 'discussion', 78, 12);

  console.log('Sample data seeded successfully.');
  console.log('Test accounts created:');
  console.log('  Admin: admin / 123456');
  console.log('  HR: hr_tech / 123456, hr_finance / 123456');
  console.log('  Jobseeker: zhangsan / 123456, lisi / 123456, wangwu / 123456');
}

if (require.main === module) {
  initDatabase();
  seedData();
}

module.exports = { initDatabase, seedData };
