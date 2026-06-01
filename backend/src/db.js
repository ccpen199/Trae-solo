const Database = require('better-sqlite3');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
let db;

function resolveDatabasePath() {
  const configuredPath = process.env.DATABASE_PATH || process.env.DB_PATH || './data/app.sqlite';
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(projectRoot, configuredPath);
}

function getDb() {
  if (!db) {
    db = new Database(resolveDatabasePath());
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS pet_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_name TEXT NOT NULL,
      species TEXT NOT NULL,
      breed TEXT DEFAULT '',
      color TEXT DEFAULT '',
      features TEXT DEFAULT '',
      chip_number TEXT DEFAULT '',
      photo_urls TEXT DEFAULT '',
      lost_location TEXT DEFAULT '',
      lost_lat REAL DEFAULT 0,
      lost_lng REAL DEFAULT 0,
      lost_time TEXT DEFAULT '',
      area TEXT NOT NULL,
      reward TEXT DEFAULT '',
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      contact_public_scope TEXT NOT NULL DEFAULT 'phone',
      status TEXT NOT NULL DEFAULT 'lost',
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      sighting_location TEXT NOT NULL,
      sighting_lat REAL DEFAULT 0,
      sighting_lng REAL DEFAULT 0,
      photo_url TEXT DEFAULT '',
      sighting_time TEXT NOT NULL,
      credibility TEXT NOT NULL DEFAULT 'medium',
      description TEXT DEFAULT '',
      submitter_name TEXT NOT NULL,
      submitter_phone TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES pet_reports(id)
    );

    CREATE TABLE IF NOT EXISTS verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clue_id INTEGER NOT NULL,
      report_id INTEGER NOT NULL,
      owner_action TEXT NOT NULL DEFAULT 'pending',
      contact_made INTEGER DEFAULT 0,
      meeting_arranged INTEGER DEFAULT 0,
      meeting_time TEXT DEFAULT '',
      meeting_location TEXT DEFAULT '',
      result TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clue_id) REFERENCES clues(id),
      FOREIGN KEY (report_id) REFERENCES pet_reports(id)
    );

    CREATE TABLE IF NOT EXISTS volunteer_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER DEFAULT 0,
      task_type TEXT NOT NULL,
      title TEXT NOT NULL,
      area TEXT DEFAULT '',
      description TEXT DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'medium',
      volunteer_count INTEGER DEFAULT 0,
      max_volunteers INTEGER DEFAULT 10,
      status TEXT NOT NULL DEFAULT 'open',
      proof_urls TEXT DEFAULT '',
      assigned_volunteers TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT DEFAULT '',
      FOREIGN KEY (report_id) REFERENCES pet_reports(id)
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      closure_type TEXT NOT NULL,
      summary TEXT DEFAULT '',
      reward_settled INTEGER DEFAULT 0,
      reward_note TEXT DEFAULT '',
      experience TEXT DEFAULT '',
      closed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES pet_reports(id)
    );
  `);

  seedData(database);
}

function seedData(database) {
  const reportCount = database.prepare('SELECT COUNT(*) AS count FROM pet_reports').get().count;
  if (reportCount === 0) {
    database.exec(`
      DELETE FROM cases;
      DELETE FROM verifications;
      DELETE FROM clues;
      DELETE FROM volunteer_tasks;
      DELETE FROM pet_reports;
      DELETE FROM sqlite_sequence WHERE name IN ('cases', 'verifications', 'clues', 'volunteer_tasks', 'pet_reports');
    `);
    const insertReport = database.prepare(`
      INSERT INTO pet_reports (pet_name, species, breed, color, features, chip_number, photo_urls,
        lost_location, lost_lat, lost_lng, lost_time, area, reward, contact_name, contact_phone,
        contact_public_scope, status, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    [
      ['糯米', '猫', '中华田园猫', '白橘相间', '戴蓝色项圈，左耳有缺口，胆小会躲车底', 'CN2024001234', '',
       '浦东新区 世纪公园3号门', 31.2156, 121.5427, '2026-05-27 08:30',
       '浦东新区', '500元', '王女士', '135-0000-2468', 'phone',
       'lost', '糯米于5月27日早晨从家中溜出，可能在世纪公园附近徘徊。', now, now],
      ['可乐', '狗', '柴犬', '黑色', '右后腿有旧伤疤，很亲人', '', '',
       '静安区 南京西路1266号', 31.2295, 121.4498, '2026-05-28 14:00',
       '静安区', '1000元', '李先生', '136-0000-1357', 'all',
       'lost', '可乐今天下午在南京西路附近走失，很亲人。', now, now],
      ['豆包', '猫', '狸花猫', '狸花', '尾巴尖白色，已绝育', '', '',
       '徐汇区 漕河泾开发区', 31.1785, 121.4312, '2026-05-26 19:00',
       '徐汇区', '', '赵女士', '137-0000-8642', 'phone',
       'found', '豆包于5月26日傍晚在小区内被发现，已被志愿者临时安置。', now, now],
      ['小橘', '猫', '橘猫', '橘色', '体型偏胖，很亲人', 'CN2024005678', '',
       '长宁区 中山公园', 31.2198, 121.4175, '2026-05-28 06:00',
       '长宁区', '300元', '张先生', '138-0000-9999', 'all',
       'lost', '小橘今早从阳台跳下后走失，体型偏胖很亲人，有芯片。', now, now],
      ['旺财', '狗', '金毛', '金色', '左眼上方有小块白毛', '', '',
       '杨浦区 五角场', 31.2994, 121.5143, '2026-05-27 17:30',
       '杨浦区', '800元', '陈女士', '139-0000-7777', 'phone',
       'lost', '旺财傍晚散步时被鞭炮惊吓跑走。', now, now]
    ].forEach(row => insertReport.run(...row));
  }

  const clueCount = database.prepare('SELECT COUNT(*) AS count FROM clues').get().count;
  if (clueCount === 0) {
    const insertClue = database.prepare(`
      INSERT INTO clues (report_id, sighting_location, sighting_lat, sighting_lng, photo_url,
        sighting_time, credibility, description, submitter_name, submitter_phone, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    [
      [1, '浦东新区 世纪公园1号门花坛', 31.2175, 121.5445, '', '2026-05-28 07:15', 'high',
       '在世纪公园1号门花坛看到一只白橘猫，很像糯米', '刘先生', '158-0000-1111', 'pending', now],
      [1, '浦东新区 世纪大道地铁站', 31.2205, 121.5378, '', '2026-05-28 09:30', 'low',
       '在地铁站出口看到一只猫跑过，颜色很像', '路人甲', '', 'pending', now],
      [2, '静安区 恒隆广场门口', 31.2288, 121.4488, '', '2026-05-28 15:00', 'high',
       '在恒隆广场门口看到一只黑色柴犬在徘徊', '张小姐', '159-0000-2222', 'pending', now],
      [4, '长宁区 中山公园围墙边', 31.2205, 121.4185, '', '2026-05-28 07:30', 'medium',
       '在公园围墙边看到一只橘猫，体型偏胖', '王大爷', '150-0000-3333', 'pending', now],
      [5, '杨浦区 淞沪路', 31.2985, 121.5155, '', '2026-05-27 18:00', 'medium',
       '在淞沪路看到一只金毛在跑', '快递员小王', '151-0000-4444', 'pending', now]
    ].forEach(row => insertClue.run(...row));
  }

  const verificationCount = database.prepare('SELECT COUNT(*) AS count FROM verifications').get().count;
  if (verificationCount === 0) {
    const insertVerification = database.prepare(`
      INSERT INTO verifications (clue_id, report_id, owner_action, contact_made, meeting_arranged,
        meeting_time, meeting_location, result, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    [
      [1, 1, 'confirmed', 1, 1, '2026-05-28 10:00', '世纪公园1号门', '已联系发现者，安排上午10点见面确认', now, now],
      [2, 1, 'dismissed', 0, 0, '', '', '描述不够具体，颜色可能不匹配', now, now]
    ].forEach(row => insertVerification.run(...row));
  }

  const taskCount = database.prepare('SELECT COUNT(*) AS count FROM volunteer_tasks').get().count;
  if (taskCount === 0) {
    const insertTask = database.prepare(`
      INSERT INTO volunteer_tasks (report_id, task_type, title, area, description, priority,
        volunteer_count, max_volunteers, status, proof_urls, assigned_volunteers, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    [
      [1, 'poster', '张贴寻猫启事', '浦东新区', '在世纪公园周边张贴寻猫启事', 'high', 2, 6, 'in_progress', '', '志愿者A,志愿者B', now, ''],
      [1, 'patrol', '夜间巡查世纪公园', '浦东新区', '夜间巡查世纪公园周边', 'high', 3, 4, 'in_progress', '', '志愿者C,志愿者D,志愿者E', now, ''],
      [2, 'mobilize', '转发寻狗信息', '静安区', '在社交媒体和社区群转发可乐走失信息', 'high', 5, 10, 'open', '', '', now, ''],
      [3, 'shelter', '临时安置豆包', '徐汇区', '照顾已安置的豆包，喂食并观察健康状况', 'medium', 1, 2, 'completed', '证明照片已上传', '志愿者F', now, now],
      [4, 'patrol', '巡查中山公园', '长宁区', '在中山公园巡查寻找小橘', 'medium', 2, 5, 'open', '', '', now, ''],
      [5, 'poster', '联系周边宠物医院', '杨浦区', '联系五角场周边宠物医院', 'high', 1, 3, 'in_progress', '', '志愿者G', now, '']
    ].forEach(row => insertTask.run(...row));
  }

  const caseCount = database.prepare('SELECT COUNT(*) AS count FROM cases').get().count;
  if (caseCount === 0) {
    const insertCase = database.prepare(`
      INSERT INTO cases (report_id, closure_type, summary, reward_settled, reward_note, experience, closed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    [
      [3, 'found', '豆包被志愿者发现并安置，经确认身份后归还失主', 0, '无悬赏', '社区志愿者巡查发现，芯片比对确认身份，过程顺利。建议加强社区巡查覆盖。', now]
    ].forEach(row => insertCase.run(...row));
  }
}

function listReports(filters) {
  let sql = 'SELECT * FROM pet_reports WHERE 1=1';
  const params = [];
  if (filters) {
    if (filters.status && filters.status !== 'all') { sql += ' AND status = ?'; params.push(filters.status); }
    if (filters.area) { sql += ' AND area LIKE ?'; params.push('%' + filters.area + '%'); }
    if (filters.species) { sql += ' AND species = ?'; params.push(filters.species); }
    if (filters.search) {
      sql += ' AND (pet_name LIKE ? OR features LIKE ? OR chip_number LIKE ?)';
      const term = '%' + filters.search + '%';
      params.push(term, term, term);
    }
  }
  sql += ' ORDER BY updated_at DESC';
  if (filters && filters.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  return getDb().prepare(sql).all(...params);
}

function getReport(id) {
  return getDb().prepare('SELECT * FROM pet_reports WHERE id = ?').get(id);
}

function createReport(report) {
  const stmt = getDb().prepare(`
    INSERT INTO pet_reports (pet_name, species, breed, color, features, chip_number, photo_urls,
      lost_location, lost_lat, lost_lng, lost_time, area, reward, contact_name, contact_phone,
      contact_public_scope, status, description)
    VALUES (@pet_name, @species, @breed, @color, @features, @chip_number, @photo_urls,
      @lost_location, @lost_lat, @lost_lng, @lost_time, @area, @reward, @contact_name, @contact_phone,
      @contact_public_scope, @status, @description)
  `);
  const result = stmt.run(report);
  return getReport(result.lastInsertRowid);
}

function updateReport(id, updates) {
  const fields = [];
  const params = {};
  const allowedFields = ['pet_name', 'species', 'breed', 'color', 'features', 'chip_number',
    'photo_urls', 'lost_location', 'lost_lat', 'lost_lng', 'lost_time', 'area', 'reward',
    'contact_name', 'contact_phone', 'contact_public_scope', 'status', 'description'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) { fields.push(field + ' = @' + field); params[field] = updates[field]; }
  }
  if (fields.length === 0) return null;
  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.id = id;
  getDb().prepare('UPDATE pet_reports SET ' + fields.join(', ') + ' WHERE id = @id').run(params);
  return getReport(id);
}

function listCluesWithDistance(filters) {
  let sql = `
    SELECT c.*, r.pet_name, r.lost_lat AS report_lat, r.lost_lng AS report_lng,
      CASE
        WHEN (c.sighting_lat != 0 AND c.sighting_lng != 0 AND r.lost_lat != 0 AND r.lost_lng != 0)
        THEN ROUND(
          6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(c.sighting_lat - r.lost_lat) / 2), 2) +
            COS(RADIANS(r.lost_lat)) * COS(RADIANS(c.sighting_lat)) *
            POWER(SIN(RADIANS(c.sighting_lng - r.lost_lng) / 2), 2)
          ))
        )
        ELSE NULL
      END AS distance_meters
    FROM clues c
    LEFT JOIN pet_reports r ON c.report_id = r.id
    WHERE 1=1
  `;
  const params = [];
  if (filters) {
    if (filters.report_id) { sql += ' AND c.report_id = ?'; params.push(filters.report_id); }
    if (filters.status && filters.status !== 'all') { sql += ' AND c.status = ?'; params.push(filters.status); }
    if (filters.credibility && filters.credibility !== 'all') { sql += ' AND c.credibility = ?'; params.push(filters.credibility); }
    if (filters.time_from) { sql += ' AND c.sighting_time >= ?'; params.push(filters.time_from); }
    if (filters.time_to) { sql += ' AND c.sighting_time <= ?'; params.push(filters.time_to); }
    if (filters.max_distance) {
      sql += ` AND (6371000 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(c.sighting_lat - r.lost_lat) / 2), 2) +
        COS(RADIANS(r.lost_lat)) * COS(RADIANS(c.sighting_lat)) *
        POWER(SIN(RADIANS(c.sighting_lng - r.lost_lng) / 2), 2)
      ))) <= ?`;
      params.push(filters.max_distance);
    }
  }
  sql += ' ORDER BY distance_meters IS NULL, distance_meters ASC, c.sighting_time DESC';
  if (filters && filters.limit) { sql += ' LIMIT ?'; params.push(filters.limit); }
  return getDb().prepare(sql).all(...params);
}

function listClues(filters) {
  let sql = 'SELECT * FROM clues WHERE 1=1';
  const params = [];
  if (filters) {
    if (filters.report_id) { sql += ' AND report_id = ?'; params.push(filters.report_id); }
    if (filters.status && filters.status !== 'all') { sql += ' AND status = ?'; params.push(filters.status); }
    if (filters.credibility && filters.credibility !== 'all') { sql += ' AND credibility = ?'; params.push(filters.credibility); }
    if (filters.time_from) { sql += ' AND sighting_time >= ?'; params.push(filters.time_from); }
    if (filters.time_to) { sql += ' AND sighting_time <= ?'; params.push(filters.time_to); }
  }
  sql += ' ORDER BY sighting_time DESC';
  return getDb().prepare(sql).all(...params);
}

function getClue(id) {
  return getDb().prepare('SELECT * FROM clues WHERE id = ?').get(id);
}

function createClue(clue) {
  const stmt = getDb().prepare(`
    INSERT INTO clues (report_id, sighting_location, sighting_lat, sighting_lng, photo_url,
      sighting_time, credibility, description, submitter_name, submitter_phone, status)
    VALUES (@report_id, @sighting_location, @sighting_lat, @sighting_lng, @photo_url,
      @sighting_time, @credibility, @description, @submitter_name, @submitter_phone, @status)
  `);
  const result = stmt.run(clue);
  return getClue(result.lastInsertRowid);
}

function updateClue(id, updates) {
  const fields = [];
  const params = {};
  const allowedFields = ['sighting_location', 'sighting_lat', 'sighting_lng', 'photo_url',
    'sighting_time', 'credibility', 'description', 'status'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) { fields.push(field + ' = @' + field); params[field] = updates[field]; }
  }
  if (fields.length === 0) return null;
  params.id = id;
  getDb().prepare('UPDATE clues SET ' + fields.join(', ') + ' WHERE id = @id').run(params);
  return getClue(id);
}

function listVerifications(filters) {
  let sql = 'SELECT * FROM verifications WHERE 1=1';
  const params = [];
  if (filters) {
    if (filters.report_id) { sql += ' AND report_id = ?'; params.push(filters.report_id); }
    if (filters.clue_id) { sql += ' AND clue_id = ?'; params.push(filters.clue_id); }
    if (filters.owner_action && filters.owner_action !== 'all') { sql += ' AND owner_action = ?'; params.push(filters.owner_action); }
  }
  sql += ' ORDER BY updated_at DESC';
  return getDb().prepare(sql).all(...params);
}

function createVerification(verification) {
  const stmt = getDb().prepare(`
    INSERT INTO verifications (clue_id, report_id, owner_action, contact_made, meeting_arranged,
      meeting_time, meeting_location, result)
    VALUES (@clue_id, @report_id, @owner_action, @contact_made, @meeting_arranged,
      @meeting_time, @meeting_location, @result)
  `);
  const result = stmt.run(verification);
  return getDb().prepare('SELECT * FROM verifications WHERE id = ?').get(result.lastInsertRowid);
}

function updateVerification(id, updates) {
  const fields = [];
  const params = {};
  const allowedFields = ['owner_action', 'contact_made', 'meeting_arranged', 'meeting_time',
    'meeting_location', 'result'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) { fields.push(field + ' = @' + field); params[field] = updates[field]; }
  }
  if (fields.length === 0) return null;
  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.id = id;
  getDb().prepare('UPDATE verifications SET ' + fields.join(', ') + ' WHERE id = @id').run(params);
  return getDb().prepare('SELECT * FROM verifications WHERE id = ?').get(id);
}

function listTasks(filters) {
  let sql = 'SELECT * FROM volunteer_tasks WHERE 1=1';
  const params = [];
  if (filters) {
    if (filters.report_id) { sql += ' AND report_id = ?'; params.push(filters.report_id); }
    if (filters.task_type && filters.task_type !== 'all') { sql += ' AND task_type = ?'; params.push(filters.task_type); }
    if (filters.status && filters.status !== 'all') { sql += ' AND status = ?'; params.push(filters.status); }
  }
  sql += ' ORDER BY created_at DESC';
  return getDb().prepare(sql).all(...params);
}

function getTask(id) {
  return getDb().prepare('SELECT * FROM volunteer_tasks WHERE id = ?').get(id);
}

function createTask(task) {
  const stmt = getDb().prepare(`
    INSERT INTO volunteer_tasks (report_id, task_type, title, area, description, priority,
      max_volunteers, status, assigned_volunteers)
    VALUES (@report_id, @task_type, @title, @area, @description, @priority,
      @max_volunteers, @status, @assigned_volunteers)
  `);
  const result = stmt.run(task);
  return getTask(result.lastInsertRowid);
}

function updateTask(id, updates) {
  const fields = [];
  const params = {};
  const allowedFields = ['title', 'area', 'description', 'priority', 'volunteer_count',
    'max_volunteers', 'status', 'proof_urls', 'assigned_volunteers', 'completed_at'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) { fields.push(field + ' = @' + field); params[field] = updates[field]; }
  }
  if (fields.length === 0) return null;
  params.id = id;
  getDb().prepare('UPDATE volunteer_tasks SET ' + fields.join(', ') + ' WHERE id = @id').run(params);
  return getTask(id);
}

function listCases(filters) {
  let sql = 'SELECT * FROM cases WHERE 1=1';
  const params = [];
  if (filters) {
    if (filters.report_id) { sql += ' AND report_id = ?'; params.push(filters.report_id); }
    if (filters.closure_type && filters.closure_type !== 'all') { sql += ' AND closure_type = ?'; params.push(filters.closure_type); }
  }
  sql += ' ORDER BY closed_at DESC';
  return getDb().prepare(sql).all(...params);
}

function createCase(c) {
  const stmt = getDb().prepare(`
    INSERT INTO cases (report_id, closure_type, summary, reward_settled, reward_note, experience)
    VALUES (@report_id, @closure_type, @summary, @reward_settled, @reward_note, @experience)
  `);
  const result = stmt.run(c);
  return getDb().prepare('SELECT * FROM cases WHERE id = ?').get(result.lastInsertRowid);
}

function stats() {
  const database = getDb();
  const reportStats = database.prepare('SELECT status, COUNT(*) AS count FROM pet_reports GROUP BY status').all();
  const result = { total: 0, lost: 0, sighting: 0, found: 0 };
  reportStats.forEach(row => { result[row.status] = row.count; result.total += row.count; });
  const clueCount = database.prepare('SELECT COUNT(*) AS count FROM clues').get().count;
  const taskStats = database.prepare('SELECT status, COUNT(*) AS count FROM volunteer_tasks GROUP BY status').all();
  const taskResult = { total: 0, open: 0, in_progress: 0, completed: 0 };
  taskStats.forEach(row => { taskResult[row.status] = row.count; taskResult.total += row.count; });
  const caseCount = database.prepare('SELECT COUNT(*) AS count FROM cases').get().count;
  const closureTypes = database.prepare('SELECT closure_type, COUNT(*) AS count FROM cases GROUP BY closure_type').all();
  const caseResult = { total: caseCount, found: 0, false_report: 0, withdrawn: 0, expired: 0 };
  closureTypes.forEach(row => { caseResult[row.closure_type] = row.count; });
  const highRiskAreas = database.prepare(`
    SELECT r.lost_location,
      COUNT(*) AS total,
      SUM(CASE WHEN c.closure_type = 'found' THEN 1 ELSE 0 END) AS found_count,
      SUM(CASE WHEN c.closure_type = 'false_report' THEN 1 ELSE 0 END) AS false_count,
      SUM(CASE WHEN c.closure_type = 'withdrawn' THEN 1 ELSE 0 END) AS withdrawn_count,
      SUM(CASE WHEN c.closure_type = 'expired' THEN 1 ELSE 0 END) AS expired_count,
      SUM(CASE WHEN c.reward_settled = 1 THEN 1 ELSE 0 END) AS reward_count
    FROM pet_reports r
    LEFT JOIN cases c ON r.id = c.report_id
    WHERE r.lost_location != ''
    GROUP BY r.lost_location
    ORDER BY total DESC
    LIMIT 5
  `).all();
  const recentExperience = database.prepare(`
    SELECT c.experience, c.closure_type, c.reward_settled, c.reward_note, r.pet_name, r.area
    FROM cases c
    LEFT JOIN pet_reports r ON c.report_id = r.id
    WHERE c.experience != ''
    ORDER BY c.closed_at DESC
    LIMIT 5
  `).all();
  return { reports: result, clues: clueCount, tasks: taskResult, cases: caseResult, high_risk_areas: highRiskAreas, recent_experience: recentExperience };
}

function dashboardFull() {
  const database = getDb();
  const reports = database.prepare('SELECT * FROM pet_reports ORDER BY updated_at DESC LIMIT 20').all();
  const reportIds = reports.map(r => r.id).join(',');
  
  const cluesMap = {};
  const verificationsMap = {};
  const tasksMap = {};
  const casesMap = {};
  
  if (reportIds) {
    database.prepare(`SELECT * FROM clues WHERE report_id IN (${reportIds}) ORDER BY created_at DESC`).all().forEach(c => {
      if (!cluesMap[c.report_id]) cluesMap[c.report_id] = [];
      cluesMap[c.report_id].push(c);
    });
    database.prepare(`SELECT * FROM verifications WHERE report_id IN (${reportIds}) ORDER BY created_at DESC`).all().forEach(v => {
      if (!verificationsMap[v.report_id]) verificationsMap[v.report_id] = [];
      verificationsMap[v.report_id].push(v);
    });
    database.prepare(`SELECT * FROM volunteer_tasks WHERE report_id IN (${reportIds}) AND report_id != 0 ORDER BY created_at DESC`).all().forEach(t => {
      if (!tasksMap[t.report_id]) tasksMap[t.report_id] = [];
      tasksMap[t.report_id].push(t);
    });
    database.prepare(`SELECT * FROM cases WHERE report_id IN (${reportIds}) ORDER BY closed_at DESC`).all().forEach(c => {
      casesMap[c.report_id] = c;
    });
  }
  
  const reportChains = reports.map(report => ({
    report,
    clues: cluesMap[report.id] || [],
    verifications: verificationsMap[report.id] || [],
    tasks: tasksMap[report.id] || [],
    case: casesMap[report.id] || null,
    clue_count: (cluesMap[report.id] || []).length,
    verification_count: (verificationsMap[report.id] || []).length,
    task_count: (tasksMap[report.id] || []).length,
    has_case: !!casesMap[report.id]
  }));
  
  const clueReviewLinks = database.prepare(`
    SELECT c.id, c.sighting_location, c.credibility, c.submitter_name, c.created_at,
      v.id AS verification_id, v.owner_action, v.contact_made, v.meeting_arranged, v.updated_at,
      r.pet_name, r.lost_location,
      CASE
        WHEN (c.sighting_lat != 0 AND c.sighting_lng != 0 AND r.lost_lat != 0 AND r.lost_lng != 0)
        THEN ROUND(
          6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(c.sighting_lat - r.lost_lat) / 2), 2) +
            COS(RADIANS(r.lost_lat)) * COS(RADIANS(c.sighting_lat)) *
            POWER(SIN(RADIANS(c.sighting_lng - r.lost_lng) / 2), 2)
          ))
        )
        ELSE NULL
      END AS distance_meters
    FROM clues c
    LEFT JOIN pet_reports r ON c.report_id = r.id
    LEFT JOIN verifications v ON c.id = v.clue_id
    ORDER BY c.created_at DESC
    LIMIT 15
  `).all();
  
  return {
    stats: stats(),
    reports,
    clues: database.prepare('SELECT * FROM clues ORDER BY created_at DESC LIMIT 20').all(),
    verifications: database.prepare('SELECT * FROM verifications ORDER BY updated_at DESC LIMIT 20').all(),
    tasks: database.prepare('SELECT * FROM volunteer_tasks ORDER BY created_at DESC LIMIT 20').all(),
    cases: database.prepare('SELECT * FROM cases ORDER BY closed_at DESC LIMIT 10').all(),
    report_chains: reportChains,
    clue_review_links: clueReviewLinks
  };
}

module.exports = {
  getDb, initDb, listReports, getReport, createReport, updateReport,
  listClues, listCluesWithDistance, getClue, createClue, updateClue,
  listVerifications, createVerification, updateVerification,
  listTasks, getTask, createTask, updateTask,
  listCases, createCase, stats, dashboardFull
};
