const db = require('./db');

function initDatabase() {
  db.exec(`
    -- 经销商表
    CREATE TABLE IF NOT EXISTS dealers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      region TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 内训任务表
    CREATE TABLE IF NOT EXISTS training_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      task_type TEXT NOT NULL DEFAULT 'A', -- A: 主机厂下发, B: 经销商自建
      scope TEXT NOT NULL, -- 范围: 全部经销商 / 指定经销商
      training_method TEXT NOT NULL, -- 内训方式
      exam_method TEXT NOT NULL, -- 考核方式
      duration INTEGER NOT NULL, -- 学时时长(小时)
      content TEXT, -- 任务内容
      start_time DATE,
      end_time DATE,
      status TEXT NOT NULL DEFAULT 'draft', -- draft:草稿, published:已发布, submitted:已提交, approved:已通过, rejected:已驳回
      is_published INTEGER DEFAULT 0, -- 是否已发布
      published_at DATETIME,
      dealer_id INTEGER, -- B类任务关联的经销商
      created_by TEXT NOT NULL DEFAULT 'factory', -- factory / dealer
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 任务经销商关联表 (A类任务发布给哪些经销商)
    CREATE TABLE IF NOT EXISTS task_dealers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      dealer_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES training_tasks(id),
      FOREIGN KEY (dealer_id) REFERENCES dealers(id),
      UNIQUE(task_id, dealer_id)
    );

    -- 课程计划表
    CREATE TABLE IF NOT EXISTS course_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      dealer_id INTEGER NOT NULL,
      course_name TEXT NOT NULL,
      lecturer TEXT NOT NULL,
      start_time DATETIME,
      end_time DATETIME,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES training_tasks(id),
      FOREIGN KEY (dealer_id) REFERENCES dealers(id)
    );

    -- 报名人员表
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      dealer_id INTEGER NOT NULL,
      person_name TEXT NOT NULL,
      person_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES training_tasks(id),
      FOREIGN KEY (dealer_id) REFERENCES dealers(id)
    );

    -- 执行提交表
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      dealer_id INTEGER NOT NULL,
      photos TEXT, -- JSON数组存储照片路径
      videos TEXT, -- JSON数组存储视频路径
      attachments TEXT, -- JSON数组存储附件路径
      actual_hours INTEGER DEFAULT 0, -- 实际执行课时
      status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress:进行中, submitted:已提交
      submitted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES training_tasks(id),
      FOREIGN KEY (dealer_id) REFERENCES dealers(id),
      UNIQUE(task_id, dealer_id)
    );

    -- 审核记录表
    CREATE TABLE IF NOT EXISTS audit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      dealer_id INTEGER NOT NULL,
      submission_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- pending:待审核, approved:已通过, rejected:已驳回
      comment TEXT,
      auditor TEXT,
      audited_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES training_tasks(id),
      FOREIGN KEY (dealer_id) REFERENCES dealers(id),
      FOREIGN KEY (submission_id) REFERENCES submissions(id)
    );

    -- 任务文件表 (任务创建时上传的文件)
    CREATE TABLE IF NOT EXISTS task_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES training_tasks(id)
    );

    -- 人员表 (经销商内训人员)
    CREATE TABLE IF NOT EXISTS personnel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dealer_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      employee_id TEXT,
      position TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dealer_id) REFERENCES dealers(id)
    );
  `);

  const dealerCount = db.prepare('SELECT COUNT(*) as count FROM dealers').get();
  if (dealerCount.count === 0) {
    const insertDealer = db.prepare(`
      INSERT INTO dealers (name, code, region) VALUES (?, ?, ?)
    `);
    insertDealer.run('杭州领克4S店', 'LK-HZ-001', '华东区域');
    insertDealer.run('上海领克4S店', 'LK-SH-001', '华东区域');
    insertDealer.run('北京领克4S店', 'LK-BJ-001', '华北区域');
    insertDealer.run('广州领克4S店', 'LK-GZ-001', '华南区域');
    insertDealer.run('成都领克4S店', 'LK-CD-001', '西南区域');

    const insertPersonnel = db.prepare(`
      INSERT INTO personnel (dealer_id, name, employee_id, position) VALUES (?, ?, ?, ?)
    `);
    for (let i = 1; i <= 5; i++) {
      insertPersonnel.run(i, `张${i}`, `EMP00${i}`, '销售顾问');
      insertPersonnel.run(i, `李${i}`, `EMP01${i}`, '服务顾问');
      insertPersonnel.run(i, `王${i}`, `EMP02${i}`, '技术主管');
    }
  }

  console.log('✅ 数据库初始化完成');
}

module.exports = initDatabase;
