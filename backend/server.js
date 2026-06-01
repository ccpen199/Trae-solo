const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const dbDir = path.join(rootDir, 'data');
const dbPath = path.join(dbDir, 'app.sqlite');
const env = readEnv(path.join(rootDir, '.env'));
const host = '127.0.0.1';
const port = Number.parseInt(env.BACKEND_PORT || '53466', 10);
const frontendPort = Number.parseInt(env.FRONTEND_PORT || '43466', 10);
const frontendOrigin = `http://${host}:${frontendPort}`;

function readEnv(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index > -1) result[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return result;
}

function sql(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`;
}

function execSql(statement) {
  execFileSync('/usr/bin/sqlite3', [dbPath], { input: statement, encoding: 'utf8' });
}

function query(statement) {
  const output = execFileSync('/usr/bin/sqlite3', ['-json', dbPath, statement], { encoding: 'utf8' });
  return output.trim() ? JSON.parse(output) : [];
}

function getOne(statement) {
  return query(statement)[0] || null;
}

function withTags(row) {
  return { ...row, personality_tags: String(row.personality_tags || '').split(',').filter(Boolean) };
}

function initDb() {
  fs.mkdirSync(dbDir, { recursive: true });
  execSql(`
    PRAGMA journal_mode=WAL;

    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      breed TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      health_status TEXT NOT NULL,
      vaccination_status TEXT NOT NULL,
      neutered_status TEXT NOT NULL,
      personality_tags TEXT NOT NULL,
      status TEXT NOT NULL,
      organization TEXT NOT NULL,
      image_url TEXT NOT NULL,
      rescue_story TEXT NOT NULL,
      rescue_date TEXT DEFAULT CURRENT_DATE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pet_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER NOT NULL,
      pet_name TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      home_condition TEXT NOT NULL,
      pet_experience TEXT NOT NULL,
      living_environment TEXT NOT NULL,
      agreement_signed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT '初筛中',
      current_stage TEXT NOT NULL DEFAULT 'initial_screening',
      supplementary_info TEXT,
      reject_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS application_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      stage TEXT NOT NULL,
      reviewer TEXT NOT NULL,
      result TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      pet_id INTEGER NOT NULL,
      pet_name TEXT NOT NULL,
      adopter_name TEXT,
      adopter_phone TEXT,
      type TEXT NOT NULL DEFAULT 'trial',
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      feedback TEXT,
      health_status TEXT,
      appetite_status TEXT,
      weight TEXT,
      abnormal_alert TEXT,
      photo_urls TEXT,
      volunteer_id INTEGER,
      volunteer_name TEXT,
      completed_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS return_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      pet_id INTEGER NOT NULL,
      pet_name TEXT NOT NULL,
      adopter_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      reason_category TEXT NOT NULL,
      description TEXT,
      return_date TEXT DEFAULT CURRENT_DATE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS volunteer_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      task_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT DEFAULT 'normal',
      assignee TEXT,
      due_date TEXT,
      related_type TEXT,
      related_id INTEGER,
      description TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS organization_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      current_level INTEGER DEFAULT 0,
      needed_level INTEGER DEFAULT 0,
      unit TEXT,
      urgency TEXT DEFAULT 'medium',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const petCount = getOne('SELECT COUNT(*) AS cnt FROM pets').cnt;
  if (petCount === 0) {
    execSql(`
      INSERT INTO pets (name, species, breed, age, gender, health_status, vaccination_status, neutered_status, personality_tags, status, organization, image_url, rescue_story, rescue_date) VALUES
      ('栗子', '猫', '中华田园猫', 2, 'female', '已体检，轻微软便观察中', '三联疫苗已完成', '已绝育', '亲人,安静,适合公寓', 'available', '城南流浪动物救助站', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80', '雨夜被志愿者在小区车底救回，现在喜欢趴在窗边晒太阳。', '2026-03-15'),
      ('阿布', '狗', '柯基混血', 4, 'male', '健康', '狂犬和六联已完成', '已绝育', '活泼,会握手,亲小孩', 'available', '暖窝动物保护中心', 'https://images.unsplash.com/photo-1557973557-ddfa9ee8c7e8?auto=format&fit=crop&w=900&q=80', '原主人搬家后弃养，经过行为训练后已适合家庭陪伴。', '2026-02-20'),
      ('团团', '猫', '英短混血', 1, 'male', '健康', '三联第二针完成', '未绝育', '好奇,爱玩,需要陪伴', 'trial', '北城领养之家', 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=900&q=80', '从工地救助的小猫，正在试养家庭适应新环境。', '2026-04-10'),
      ('豆花', '狗', '柴犬混血', 3, 'female', '皮肤恢复期', '疫苗齐全', '已绝育', '谨慎,护家,适合有经验家庭', 'available', '城南流浪动物救助站', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80', '曾经长期拴养，现已完成基础社会化训练。', '2026-01-08'),
      ('橘子', '猫', '橘猫', 2, 'male', '健康', '三联已完成', '已绝育', '黏人,贪吃,爱撒娇', 'adopted', '暖窝动物保护中心', 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?auto=format&fit=crop&w=900&q=80', '小区流浪二代，成功被爱心家庭领养。', '2025-11-20'),
      ('布丁', '猫', '布偶混血', 1, 'female', '健康', '三联已完成', '未绝育', '温柔,安静,黏人', 'available', '北城领养之家', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=900&q=80', '品种猫繁育场遗弃，已完全康复。', '2026-03-28');

      INSERT INTO pet_photos (pet_id, url, description, is_primary) VALUES
      (1, 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80', '主图', 1),
      (1, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80', '生活照', 0),
      (2, 'https://images.unsplash.com/photo-1557973557-ddfa9ee8c7e8?auto=format&fit=crop&w=900&q=80', '主图', 1),
      (3, 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=900&q=80', '主图', 1),
      (4, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80', '主图', 1),
      (5, 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?auto=format&fit=crop&w=900&q=80', '主图', 1),
      (6, 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=900&q=80', '主图', 1);

      INSERT INTO applications (pet_id, pet_name, applicant_name, contact_phone, home_condition, pet_experience, living_environment, agreement_signed, status, current_stage) VALUES
      (2, '阿布', '陈晓', '13900001111', '三口之家，固定住所', '有犬类饲养经验，养过金毛8年', '电梯两居室，附近有公园', 1, '家访待安排', 'home_visit'),
      (1, '栗子', '刘敏', '13900002222', '独居，远程办公，收入稳定', '照顾过两只猫，其中一只自然终老', '封窗公寓，有猫爬架', 1, '初筛中', 'initial_screening'),
      (5, '橘子', '张伟', '13900003333', '两居室，夫妻二人', '首次养猫，已做充分功课', '朝南阳台，已封窗', 1, '已领养', 'adopted'),
      (3, '团团', '周女士', '13900004444', '独居，自有房产', '养猫3年经验', '三居室，有独立猫房', 1, '试养中', 'trial');

      INSERT INTO application_reviews (application_id, stage, reviewer, result, notes) VALUES
      (3, 'initial_screening', '平台审核员', 'pass', '资料完整，符合基本条件'),
      (3, 'interview', '李审核', 'pass', '面谈顺利，养猫知识充分'),
      (3, 'home_visit', '王志愿者', 'pass', '封窗完善，环境整洁'),
      (3, 'trial', '李审核', 'pass', '试养7天反馈良好，正式通过'),
      (1, 'initial_screening', '平台审核员', 'pass', '资料完整，养狗经验丰富'),
      (1, 'interview', '张审核', 'pass', '面谈通过，家人支持'),
      (4, 'initial_screening', '平台审核员', 'pass', '资料完整，有养猫经验'),
      (4, 'interview', '李审核', 'pass', '面谈通过，环境评估良好'),
      (4, 'home_visit', '刘志愿者', 'pass', '家访通过，猫房准备充分'),
      (2, 'initial_screening', '平台审核员', 'hold', '补充工作证明');

      INSERT INTO follow_ups (application_id, pet_id, pet_name, adopter_name, adopter_phone, type, scheduled_date, status, feedback, health_status, appetite_status, weight, volunteer_name) VALUES
      (4, 3, '团团', '周女士', '13900004444', 'trial', '2026-06-02', 'in_progress', '试养第3天，小猫适应良好', '正常', '良好', '2.1kg', '刘志愿者'),
      (3, 5, '橘子', '张伟', '13900003333', 'post_adoption', '2026-06-10', 'planned', NULL, NULL, NULL, NULL, '王志愿者'),
      (NULL, 4, '豆花', NULL, NULL, 'medical', '2026-06-01', 'planned', NULL, NULL, NULL, NULL, NULL);

      INSERT INTO volunteer_tasks (title, task_type, status, priority, assignee, due_date, related_type, related_id, description) VALUES
      ('阿布领养家庭家访', 'home_visit', 'open', 'high', NULL, '2026-05-31', 'application', 1, '核实居住环境、家庭成员态度和遛狗安排'),
      ('栗子补充照片拍摄', 'photo', 'assigned', 'medium', '张志愿者', '2026-06-01', 'pet', 1, '为档案补充疫苗本和生活照'),
      ('团团试养第7天回访', 'follow_up', 'in_progress', 'high', '刘志愿者', '2026-06-02', 'follow_up', 1, '视频回访，观察适应情况'),
      ('豆花皮肤复查', 'medical', 'open', 'high', NULL, '2026-06-01', 'pet', 4, '陪同皮肤复查，记录恢复情况'),
      ('物资搬运', 'transport', 'available', 'low', NULL, '2026-06-03', NULL, NULL, '新到捐赠猫砂狗粮，需要协助搬运');

      INSERT INTO return_records (application_id, pet_id, pet_name, adopter_name, reason, reason_category, description, return_date) VALUES
      (0, 0, '小白', '王某某', '对猫毛过敏', 'health', '领养两周后发现严重过敏，药物无法控制', '2026-02-15'),
      (0, 0, '大黄', '李某某', '房东禁止养宠', 'housing', '之前以为房东同意，事后沟通失败', '2026-03-20'),
      (0, 0, '花花', '赵某某', '经济原因', 'finance', '失业，无法负担猫粮和医疗费用', '2026-04-05'),
      (0, 0, '豆豆', '孙某某', '行为问题', 'behavior', '护食咬人，家人反对继续饲养', '2026-04-18');

      INSERT INTO organization_resources (organization, resource_type, current_level, needed_level, unit, urgency) VALUES
      ('城南流浪动物救助站', '猫粮', 15, 40, '袋', 'high'),
      ('城南流浪动物救助站', '狗粮', 8, 25, '袋', 'high'),
      ('城南流浪动物救助站', '猫砂', 20, 30, '袋', 'medium'),
      ('城南流浪动物救助站', '志愿者', 8, 15, '人', 'high'),
      ('暖窝动物保护中心', '猫粮', 30, 50, '袋', 'medium'),
      ('暖窝动物保护中心', '医疗基金', 5000, 20000, '元', 'high'),
      ('暖窝动物保护中心', '寄养家庭', 3, 8, '户', 'high'),
      ('北城领养之家', '猫笼', 5, 12, '个', 'medium'),
      ('北城领养之家', '志愿者', 6, 10, '人', 'medium');
    `);
  }
}

function send(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': frontendOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,OPTIONS'
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

initDb();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`);
  if (req.method === 'OPTIONS') return send(res, 204, {});

  try {
    if (url.pathname === '/api/health') {
      const count = getOne('SELECT COUNT(*) AS count FROM pets').count;
      return send(res, 200, { success: true, data: { status: 'healthy', sqlite: 'ok', pets: count }, message: '宠物领养服务运行正常' });
    }

    if (url.pathname === '/api/dashboard/stats' && req.method === 'GET') {
      const totalPets = getOne('SELECT COUNT(*) AS cnt FROM pets').cnt;
      const availablePets = getOne("SELECT COUNT(*) AS cnt FROM pets WHERE status='available'").cnt;
      const pendingApplications = getOne("SELECT COUNT(*) AS cnt FROM applications WHERE status NOT IN ('已领养','已退养','已拒绝')").cnt;
      const adoptedCount = getOne("SELECT COUNT(*) AS cnt FROM applications WHERE status='已领养'").cnt;
      const returnedCount = getOne("SELECT COUNT(*) AS cnt FROM return_records").cnt;
      const totalAdoptions = adoptedCount + returnedCount;
      const successRate = totalAdoptions > 0 ? Math.round((adoptedCount / totalAdoptions) * 100) : 0;
      const returnRate = totalAdoptions > 0 ? Math.round((returnedCount / totalAdoptions) * 100) : 0;
      const pendingFollowUps = getOne("SELECT COUNT(*) AS cnt FROM follow_ups WHERE status IN ('planned','in_progress')").cnt;
      const pendingTasks = getOne("SELECT COUNT(*) AS cnt FROM volunteer_tasks WHERE status IN ('open','assigned')").cnt;
      const trialCount = getOne("SELECT COUNT(*) AS cnt FROM pets WHERE status='trial'").cnt;

      return send(res, 200, {
        success: true,
        data: {
          totalPets,
          availablePets,
          pendingApplications,
          adoptedCount,
          returnedCount,
          successRate,
          returnRate,
          pendingFollowUps,
          pendingTasks,
          trialCount,
          lastUpdated: new Date().toISOString()
        },
        message: '获取运营看板成功'
      });
    }

    if (url.pathname === '/api/dashboard/return-reasons' && req.method === 'GET') {
      const reasons = query(`
        SELECT reason_category AS category, reason, COUNT(*) AS count
        FROM return_records
        GROUP BY reason_category, reason
        ORDER BY count DESC
      `);
      const categories = query(`
        SELECT reason_category AS category, COUNT(*) AS count
        FROM return_records
        GROUP BY reason_category
        ORDER BY count DESC
      `);
      return send(res, 200, { success: true, data: { reasons, categories }, message: '获取退养原因成功' });
    }

    if (url.pathname === '/api/dashboard/resource-gaps' && req.method === 'GET') {
      const gaps = query(`
        SELECT organization, resource_type, current_level, needed_level, unit, urgency,
               (needed_level - current_level) AS gap
        FROM organization_resources
        WHERE needed_level > current_level
        ORDER BY urgency DESC, gap DESC
      `);
      return send(res, 200, { success: true, data: gaps, message: '获取资源缺口成功' });
    }

    if (url.pathname === '/api/pets' && req.method === 'GET') {
      const keyword = (url.searchParams.get('keyword') || '').toLowerCase();
      const species = url.searchParams.get('species') || '';
      const status = url.searchParams.get('status') || '';
      const organization = url.searchParams.get('organization') || '';
      const gender = url.searchParams.get('gender') || '';
      const health = url.searchParams.get('health') || '';

      let where = '1=1';
      if (species) where += ` AND species = ${sql(species)}`;
      if (status) where += ` AND status = ${sql(status)}`;
      if (organization) where += ` AND organization = ${sql(organization)}`;
      if (gender) where += ` AND gender = ${sql(gender)}`;
      if (health) where += ` AND health_status LIKE '%${health}%'`;

      const rows = query(`SELECT * FROM pets WHERE ${where} ORDER BY created_at DESC`).map(withTags);
      const list = rows.filter(item =>
        !keyword || `${item.name}${item.breed}${item.personality_tags.join('')}${item.rescue_story}`.toLowerCase().includes(keyword)
      );

      return send(res, 200, { success: true, data: { list, total: list.length }, message: '获取宠物列表成功' });
    }

    const petMatch = url.pathname.match(/^\/api\/pets\/(\d+)$/);
    if (petMatch && req.method === 'GET') {
      const petId = Number(petMatch[1]);
      const pet = getOne(`SELECT * FROM pets WHERE id = ${petId}`);
      if (!pet) return send(res, 404, { success: false, message: '宠物档案不存在' });

      const photos = query(`SELECT * FROM pet_photos WHERE pet_id = ${petId} ORDER BY is_primary DESC, created_at`);
      const applications = query(`SELECT * FROM applications WHERE pet_id = ${petId} ORDER BY created_at DESC`);
      const followUps = query(`SELECT * FROM follow_ups WHERE pet_id = ${petId} ORDER BY scheduled_date DESC`);

      return send(res, 200, {
        success: true,
        data: {
          pet: withTags(pet),
          photos,
          applications,
          followUps
        },
        message: '获取宠物详情成功'
      });
    }

    if (url.pathname === '/api/pets/filters' && req.method === 'GET') {
      const species = query('SELECT DISTINCT species FROM pets ORDER BY species');
      const organizations = query('SELECT DISTINCT organization FROM pets ORDER BY organization');
      const statuses = query('SELECT DISTINCT status FROM pets ORDER BY status');
      return send(res, 200, { success: true, data: { species, organizations, statuses }, message: '获取筛选选项成功' });
    }

    if (url.pathname === '/api/applications' && req.method === 'GET') {
      const status = url.searchParams.get('status') || '';
      let where = '1=1';
      if (status) where += ` AND status = ${sql(status)}`;
      const list = query(`SELECT * FROM applications WHERE ${where} ORDER BY created_at DESC`);
      return send(res, 200, { success: true, data: { list, total: list.length }, message: '获取申请列表成功' });
    }

    if (url.pathname === '/api/applications' && req.method === 'POST') {
      const body = await readBody(req);
      const pet = getOne(`SELECT id,name FROM pets WHERE id = ${Number(body.pet_id)}`);
      if (!pet || !body.applicant_name || !body.contact_phone || !body.agreement_signed) {
        return send(res, 400, { success: false, message: '请填写宠物、联系人并勾选领养承诺' });
      }
      execSql(`
        INSERT INTO applications (pet_id, pet_name, applicant_name, contact_phone, home_condition, pet_experience, living_environment, agreement_signed, status, current_stage)
        VALUES (${pet.id}, ${sql(pet.name)}, ${sql(body.applicant_name)}, ${sql(body.contact_phone)}, ${sql(body.home_condition || '')}, ${sql(body.pet_experience || '')}, ${sql(body.living_environment || '')}, 1, '初筛中', 'initial_screening');
      `);
      const newApp = getOne('SELECT * FROM applications ORDER BY id DESC LIMIT 1');
      return send(res, 201, { success: true, data: newApp, message: '领养申请已提交' });
    }

    const appMatch = url.pathname.match(/^\/api\/applications\/(\d+)$/);
    if (appMatch && req.method === 'GET') {
      const appId = Number(appMatch[1]);
      const application = getOne(`SELECT * FROM applications WHERE id = ${appId}`);
      if (!application) return send(res, 404, { success: false, message: '申请不存在' });
      const reviews = query(`SELECT * FROM application_reviews WHERE application_id = ${appId} ORDER BY created_at`);
      const followUps = query(`SELECT * FROM follow_ups WHERE application_id = ${appId} ORDER BY scheduled_date`);
      return send(res, 200, { success: true, data: { application, reviews, followUps }, message: '获取申请详情成功' });
    }

    if (appMatch && req.method === 'PUT') {
      const appId = Number(appMatch[1]);
      const body = await readBody(req);
      if (body.supplementary_info !== undefined) {
        execSql(`UPDATE applications SET supplementary_info = ${sql(body.supplementary_info)}, updated_at = CURRENT_TIMESTAMP WHERE id = ${appId}`);
        return send(res, 200, { success: true, data: getOne(`SELECT * FROM applications WHERE id = ${appId}`), message: '资料补充成功' });
      }
      return send(res, 200, { success: true, data: getOne(`SELECT * FROM applications WHERE id = ${appId}`), message: '更新成功' });
    }

    const reviewMatch = url.pathname.match(/^\/api\/applications\/(\d+)\/review$/);
    if (reviewMatch && req.method === 'POST') {
      const appId = Number(reviewMatch[1]);
      const body = await readBody(req);
      const { stage, result, reviewer, notes, reject_reason, new_status } = body;

      execSql(`
        INSERT INTO application_reviews (application_id, stage, reviewer, result, notes)
        VALUES (${appId}, ${sql(stage)}, ${sql(reviewer)}, ${sql(result)}, ${sql(notes || '')});
      `);

      let updates = `updated_at = CURRENT_TIMESTAMP`;
      if (new_status) updates += `, status = ${sql(new_status)}`;
      if (result === 'pass' && stage === 'initial_screening') updates += `, current_stage = 'interview'`;
      if (result === 'pass' && stage === 'interview') updates += `, current_stage = 'home_visit'`;
      if (result === 'pass' && stage === 'home_visit') updates += `, current_stage = 'trial'`;
      if (result === 'pass' && stage === 'trial') updates += `, current_stage = 'adopted'`;
      if (result === 'reject') {
        updates += `, status = '已拒绝'`;
        if (reject_reason) updates += `, reject_reason = ${sql(reject_reason)}`;
      }

      execSql(`UPDATE applications SET ${updates} WHERE id = ${appId}`);

      if (result === 'pass' && stage === 'trial') {
        const app = getOne(`SELECT pet_id FROM applications WHERE id = ${appId}`);
        execSql(`UPDATE pets SET status = 'adopted', updated_at = CURRENT_TIMESTAMP WHERE id = ${app.pet_id}`);
      }

      return send(res, 200, { success: true, data: getOne(`SELECT * FROM applications WHERE id = ${appId}`), message: '审核完成' });
    }

    if (url.pathname === '/api/reviews/pending' && req.method === 'GET') {
      const list = query("SELECT * FROM applications WHERE status NOT IN ('已领养','已退养','已拒绝') ORDER BY created_at DESC");
      return send(res, 200, { success: true, data: list, message: '获取待审核申请成功' });
    }

    if (url.pathname === '/api/follow-ups' && req.method === 'GET') {
      const status = url.searchParams.get('status') || '';
      let where = '1=1';
      if (status) where += ` AND status = ${sql(status)}`;
      const list = query(`SELECT * FROM follow_ups WHERE ${where} ORDER BY scheduled_date`);
      return send(res, 200, { success: true, data: list, message: '获取回访计划成功' });
    }

    if (url.pathname === '/api/follow-ups' && req.method === 'POST') {
      const body = await readBody(req);
      execSql(`
        INSERT INTO follow_ups (application_id, pet_id, pet_name, adopter_name, adopter_phone, type, scheduled_date, status, volunteer_name)
        VALUES (${body.application_id || 'NULL'}, ${body.pet_id}, ${sql(body.pet_name)}, ${sql(body.adopter_name || '')}, ${sql(body.adopter_phone || '')}, ${sql(body.type || 'post_adoption')}, ${sql(body.scheduled_date)}, 'planned', ${sql(body.volunteer_name || '')});
      `);
      return send(res, 201, { success: true, data: getOne('SELECT * FROM follow_ups ORDER BY id DESC LIMIT 1'), message: '回访计划已创建' });
    }

    const fuMatch = url.pathname.match(/^\/api\/follow-ups\/(\d+)$/);
    if (fuMatch && req.method === 'GET') {
      const fuId = Number(fuMatch[1]);
      const followUp = getOne(`SELECT * FROM follow_ups WHERE id = ${fuId}`);
      if (!followUp) return send(res, 404, { success: false, message: '回访记录不存在' });
      return send(res, 200, { success: true, data: followUp, message: '获取回访详情成功' });
    }

    const fuFeedbackMatch = url.pathname.match(/^\/api\/follow-ups\/(\d+)\/feedback$/);
    if (fuFeedbackMatch && req.method === 'POST') {
      const fuId = Number(fuFeedbackMatch[1]);
      const body = await readBody(req);
      const { feedback, health_status, appetite_status, weight, abnormal_alert, photo_urls, status } = body;
      let updates = 'updated_at = CURRENT_TIMESTAMP';
      if (feedback !== undefined) updates += `, feedback = ${sql(feedback)}`;
      if (health_status !== undefined) updates += `, health_status = ${sql(health_status)}`;
      if (appetite_status !== undefined) updates += `, appetite_status = ${sql(appetite_status)}`;
      if (weight !== undefined) updates += `, weight = ${sql(weight)}`;
      if (abnormal_alert !== undefined) updates += `, abnormal_alert = ${sql(abnormal_alert)}`;
      if (photo_urls !== undefined) updates += `, photo_urls = ${sql(JSON.stringify(photo_urls || []))}`;
      if (status) updates += `, status = ${sql(status)}`;
      if (status === 'completed') updates += `, completed_date = CURRENT_DATE`;
      execSql(`UPDATE follow_ups SET ${updates} WHERE id = ${fuId}`);
      return send(res, 200, { success: true, data: getOne(`SELECT * FROM follow_ups WHERE id = ${fuId}`), message: '回访反馈已提交' });
    }

    const fuReturnMatch = url.pathname.match(/^\/api\/follow-ups\/(\d+)\/return$/);
    if (fuReturnMatch && req.method === 'POST') {
      const fuId = Number(fuReturnMatch[1]);
      const body = await readBody(req);
      const followUp = getOne(`SELECT * FROM follow_ups WHERE id = ${fuId}`);
      if (!followUp) return send(res, 404, { success: false, message: '回访记录不存在' });

      execSql(`
        INSERT INTO return_records (application_id, pet_id, pet_name, adopter_name, reason, reason_category, description)
        VALUES (${followUp.application_id || 'NULL'}, ${followUp.pet_id}, ${sql(followUp.pet_name)}, ${sql(followUp.adopter_name || '')}, ${sql(body.reason)}, ${sql(body.reason_category)}, ${sql(body.description || '')});
      `);

      execSql(`UPDATE applications SET status = '已退养', updated_at = CURRENT_TIMESTAMP WHERE id = ${followUp.application_id}`);
      execSql(`UPDATE pets SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ${followUp.pet_id}`);
      execSql(`UPDATE follow_ups SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ${fuId}`);

      return send(res, 200, { success: true, message: '退养处理完成，宠物已重新待领养' });
    }

    if (url.pathname === '/api/volunteer/tasks' && req.method === 'GET') {
      const status = url.searchParams.get('status') || '';
      let where = '1=1';
      if (status) where += ` AND status = ${sql(status)}`;
      const list = query(`SELECT * FROM volunteer_tasks WHERE ${where} ORDER BY due_date`);
      return send(res, 200, { success: true, data: list, message: '获取志愿者任务成功' });
    }

    const taskMatch = url.pathname.match(/^\/api\/volunteer\/tasks\/(\d+)$/);
    if (taskMatch && req.method === 'PUT') {
      const taskId = Number(taskMatch[1]);
      const body = await readBody(req);
      let updates = '';
      if (body.status) updates += `status = ${sql(body.status)}`;
      if (body.assignee) updates += `${updates ? ',' : ''} assignee = ${sql(body.assignee)}`;
      if (body.notes) updates += `${updates ? ',' : ''} notes = ${sql(body.notes)}`;
      if (body.status === 'completed') updates += `${updates ? ',' : ''} completed_at = CURRENT_TIMESTAMP`;
      if (updates) {
        execSql(`UPDATE volunteer_tasks SET ${updates} WHERE id = ${taskId}`);
      }
      return send(res, 200, { success: true, data: getOne(`SELECT * FROM volunteer_tasks WHERE id = ${taskId}`), message: '任务更新成功' });
    }

    if (url.pathname === '/api/organizations/profile' && req.method === 'GET') {
      const org = url.searchParams.get('name') || '城南流浪动物救助站';
      const pets = getOne(`SELECT COUNT(*) AS cnt FROM pets WHERE organization = ${sql(org)}`);
      const available = getOne(`SELECT COUNT(*) AS cnt FROM pets WHERE organization = ${sql(org)} AND status='available'`);
      const resources = query(`SELECT * FROM organization_resources WHERE organization = ${sql(org)}`);
      return send(res, 200, {
        success: true,
        data: {
          name: org,
          totalPets: pets.cnt,
          availablePets: available.cnt,
          volunteers: 18,
          monthlyCapacity: 12,
          resources
        },
        message: '获取机构信息成功'
      });
    }

    send(res, 404, { success: false, message: '接口不存在' });
  } catch (err) {
    console.error('API Error:', err);
    send(res, 500, { success: false, message: `服务异常: ${err.message}` });
  }
});

server.listen(port, host, () => {
  console.log(`Backend started: http://${host}:${port}`);
  console.log(`Health check: http://${host}:${port}/api/health`);
});
