const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || '../data/app.sqlite';
const resolvedPath = path.resolve(__dirname, '../../', dbPath);

const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(resolvedPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

const seedData = () => {
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE user_type = ?').get('admin').count;
  if (adminCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    const insertAdmin = db.prepare(`
      INSERT INTO users (username, password, user_type, real_name, id_verified, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run('admin', hashedPassword, 'admin', '系统管理员', 1, 'active');
    console.log('Default admin created: admin/admin123');
  }

  const sampleEmployerCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('employer_demo').count;
  if (sampleEmployerCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    const insertEmployerUser = db.prepare(`
      INSERT INTO users (username, password, phone, email, user_type, real_name, id_verified, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insertEmployerUser.run('employer_demo', hashedPassword, '13800138001', 'employer@demo.com', 'employer', '演示企业', 1, 'active');
    
    const insertEmployer = db.prepare(`
      INSERT INTO employers (user_id, company_name, business_license, contact_name, contact_phone, verified, credit_rating)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertEmployer.run(result.lastInsertRowid, '演示科技有限公司', '91110000MA00A1B2C3', '张经理', '13800138001', 1, 'A');
    console.log('Sample employer created: employer_demo/123456');
  }

  const sampleWorkerCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('worker_demo').count;
  if (sampleWorkerCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    const insertWorker = db.prepare(`
      INSERT INTO users (username, password, phone, email, user_type, real_name, id_verified, skills, location, credit_score, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertWorker.run('worker_demo', hashedPassword, '13800138002', 'worker@demo.com', 'student', '李同学', 1, '["问卷填写","内容审核","数据录入"]', '北京市海淀区', 100, 'active');
    console.log('Sample worker created: worker_demo/123456');
  }

  const sampleTaskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  if (sampleTaskCount === 0) {
    const employer = db.prepare('SELECT id FROM employers WHERE company_name = ?').get('演示科技有限公司');
    if (employer) {
      const insertTask = db.prepare(`
        INSERT INTO tasks (employer_id, title, description, task_type, category, skills_required, budget, unit, total_count, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertTask.run(
        employer.id,
        '市场调研问卷填写',
        '完成一份关于消费习惯的调查问卷，约10分钟，填写完成后提交截图',
        'online',
        '问卷填写',
        '["问卷填写"]',
        15.00,
        'per_task',
        50,
        'published'
      );
      
      insertTask.run(
        employer.id,
        'APP试玩推广任务',
        '下载指定APP并注册账号，完成新手引导任务，截图提交',
        'online',
        '试玩推广',
        '["试玩推广","手机操作"]',
        25.00,
        'per_task',
        100,
        'published'
      );
      
      insertTask.run(
        employer.id,
        '商超促销活动促销员',
        '周末在指定商超进行产品促销活动，8小时/天，提供培训',
        'offline',
        '快闪活动',
        '["促销活动","沟通表达"]',
        200.00,
        'per_day',
        10,
        'published'
      );
      
      insertTask.run(
        employer.id,
        '社区团购团长招募',
        '负责社区内的团购推广和订单收集，按销售额提成',
        'hybrid',
        '社区团购',
        '["社区运营","销售推广"]',
        0.00,
        'commission',
        50,
        'published'
      );
      
      console.log('Sample tasks created');
    }
  }
};

seedData();

module.exports = db;
