import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const db: Database.Database = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_admin INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      template_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS delivery_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resume_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      tracking_code TEXT UNIQUE NOT NULL,
      qr_code TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_user_id ON delivery_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_tracking ON delivery_records(tracking_code);
  `);

  const adminCheck = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get() as { count: number };
  if (adminCheck.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123456', 10);
    db.prepare('INSERT INTO users (email, name, password_hash, is_admin) VALUES (?, ?, ?, 1)').run(
      'admin@resume.com',
      '系统管理员',
      hash
    );
  }

  const testCheck = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get('test@example.com') as { count: number };
  if (testCheck.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('123456', 10);
    db.prepare('INSERT INTO users (email, name, password_hash, is_admin) VALUES (?, ?, ?, 0)').run(
      'test@example.com',
      '演示求职者',
      hash
    );
  }

  const demoResumeContent = {
    basicInfo: {
      name: '林夏',
      phone: '13800138088',
      email: 'linxia@example.com',
      location: '上海',
      website: 'https://github.com/linxia'
    },
    summary: '面向应届生与职场新人的全栈开发候选人，熟悉 React、TypeScript、Node.js 与数据可视化。曾主导校园招聘平台、简历解析工具和投递追踪看板，能够把业务需求拆解为可落地的端到端功能。',
    education: [
      {
        id: 'edu-1',
        school: '复旦大学',
        degree: '本科',
        major: '软件工程',
        startDate: '2020-09',
        endDate: '2024-06',
        gpa: '3.7/4.0',
        description: '获得校级优秀毕业设计，主修数据结构、数据库系统、Web 工程与机器学习。'
      }
    ],
    experience: [
      {
        id: 'exp-1',
        company: '字节跳动',
        position: '前端开发实习生',
        startDate: '2023-06',
        endDate: '2023-12',
        description: '主导简历投递数据看板改版，优化筛选与导出流程，使 HR 日常处理效率提升 35%；推动组件拆分与单元测试补齐，降低后续维护成本。'
      }
    ],
    projects: [
      {
        id: 'proj-1',
        name: '智能简历解析与诊断平台',
        role: '项目负责人',
        startDate: '2024-01',
        endDate: '2024-05',
        description: '实现 Word/PDF/TXT 导入、教育/实习/项目字段抽取、ATS 纯文本生成和扫码投递追踪。诊断模块覆盖关键词缺失、经历动词强度和排版可读性评分。',
        technologies: ['React', 'TypeScript', 'Node.js', 'SQLite']
      }
    ],
    skills: [
      { id: 'skill-1', name: '前端工程', category: '前端工程', items: ['React', 'TypeScript', 'Vite', 'Ant Design'] },
      { id: 'skill-2', name: '后端与数据', category: '后端与数据', items: ['Node.js', 'Express', 'SQLite', 'REST API'] },
      { id: 'skill-3', name: '求职材料', category: '求职材料', items: ['ATS 优化', '中英文混排', '技能图表', '投递追踪'] }
    ]
  };

  const seedDemoForUser = (email: string) => {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
    if (!user) return;

    const resumeCount = db.prepare('SELECT COUNT(*) as count FROM resumes WHERE user_id = ?').get(user.id) as { count: number };
    if (resumeCount.count === 0) {
      db.prepare('INSERT INTO resumes (user_id, title, template_id, content) VALUES (?, ?, ?, ?)').run(
        user.id,
        '【示例】全栈开发工程师简历',
        'tech-modern',
        JSON.stringify(demoResumeContent)
      );
    }

    const resume = db.prepare('SELECT id FROM resumes WHERE user_id = ? ORDER BY id LIMIT 1').get(user.id) as { id: number } | undefined;
    if (!resume) return;

    const deliveryCount = db.prepare('SELECT COUNT(*) as count FROM delivery_records WHERE user_id = ?').get(user.id) as { count: number };
    if (deliveryCount.count === 0) {
      const trackingCode = `DEL-DEMO-${user.id}`.toUpperCase();
      const qrSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="96" text-anchor="middle" font-size="18" fill="#1a365d">DEMO QR</text><text x="100" y="122" text-anchor="middle" font-size="12" fill="#1a365d">${trackingCode}</text></svg>`);
      db.prepare(
        'INSERT INTO delivery_records (resume_id, user_id, company, position, tracking_code, qr_code, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        resume.id,
        user.id,
        '未来科技有限公司',
        '前端开发工程师',
        trackingCode,
        `data:image/svg+xml;utf8,${qrSvg}`,
        'viewed'
      );
    }
  };

  seedDemoForUser('test@example.com');
  seedDemoForUser('admin@resume.com');
}

initDb();

export default db;
