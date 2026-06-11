import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const dbDir = path.join(projectRoot, 'data');
const dbPath = path.join(dbDir, 'app.db');
const wasmPath = path.join(projectRoot, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');

let dbInstance: Database | null = null;
let SQL: SqlJsStatic | null = null;

export async function initDatabase(): Promise<Database> {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!SQL) {
    const wasmBuffer = fs.readFileSync(wasmPath);
    SQL = await initSqlJs({ wasmBinary: wasmBuffer });
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    dbInstance = new SQL.Database(buffer);
  } else {
    dbInstance = new SQL.Database();
  }

  dbInstance.run('PRAGMA foreign_keys = ON');

  createTables(dbInstance);
  seedInitialData(dbInstance);
  saveDatabase();

  return dbInstance;
}

export function saveDatabase(): void {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function createTables(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT,
      accessibility_config TEXT NOT NULL,
      chronic_diseases TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS family_bindings (
      id TEXT PRIMARY KEY,
      elder_id TEXT NOT NULL,
      family_id TEXT NOT NULL,
      relation TEXT NOT NULL,
      status TEXT NOT NULL,
      notification_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (elder_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (family_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS health_contents (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      age_groups TEXT NOT NULL,
      chronic_diseases TEXT NOT NULL,
      content TEXT NOT NULL,
      audio_url TEXT,
      status TEXT NOT NULL,
      accessibility_level INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS medication_reminders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      times TEXT NOT NULL,
      days TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      note TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      elder_id TEXT NOT NULL,
      family_id TEXT NOT NULL,
      message TEXT NOT NULL,
      level TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (elder_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (family_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS content_reviews (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      status TEXT NOT NULL,
      comment TEXT,
      accessibility_level INTEGER NOT NULL,
      reviewed_at TEXT NOT NULL,
      FOREIGN KEY (content_id) REFERENCES health_contents(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS usage_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      page TEXT NOT NULL,
      duration INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS anniversaries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      remind_days INTEGER NOT NULL DEFAULT 7,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    db.run('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)');
    db.run('CREATE INDEX IF NOT EXISTS idx_family_bindings_elder ON family_bindings(elder_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_family_bindings_family ON family_bindings(family_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_health_contents_status ON health_contents(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_health_contents_type ON health_contents(type)');
    db.run('CREATE INDEX IF NOT EXISTS idx_alerts_elder ON alerts(elder_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_alerts_family ON alerts(family_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read)');
    db.run('CREATE INDEX IF NOT EXISTS idx_usage_records_user ON usage_records(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_usage_records_date ON usage_records(created_at)');
  } catch (_) {
    // ignore index create errors if they exist
  }
}

function seedInitialData(db: Database): void {
  const result = db.exec('SELECT COUNT(*) as count FROM users');
  const userCount = result[0]?.values[0]?.[0] as number;
  if (userCount > 0) {
    return;
  }

  const now = new Date().toISOString();

  const users = [
    {
      id: 'user_001', phone: '13800138001', name: '张大爷', age: 72, role: 'elder',
      avatar: null,
      accessibilityConfig: JSON.stringify({ fontSize: 'large', contrast: 'high', voiceEnabled: true, voiceSpeed: 0.8 }),
      chronicDiseases: JSON.stringify(['高血压', '糖尿病']),
      createdAt: now, lastActiveAt: now
    },
    {
      id: 'user_002', phone: '13800138002', name: '李奶奶', age: 68, role: 'elder',
      avatar: null,
      accessibilityConfig: JSON.stringify({ fontSize: 'normal', contrast: 'normal', voiceEnabled: false, voiceSpeed: 1.0 }),
      chronicDiseases: JSON.stringify(['关节炎']),
      createdAt: now, lastActiveAt: now
    },
    {
      id: 'user_003', phone: '13900139001', name: '张小华', age: 45, role: 'family',
      avatar: null,
      accessibilityConfig: JSON.stringify({ fontSize: 'normal', contrast: 'normal', voiceEnabled: false, voiceSpeed: 1.0 }),
      chronicDiseases: JSON.stringify([]),
      createdAt: now, lastActiveAt: now
    },
    {
      id: 'user_004', phone: '13900139002', name: '王医生', age: 38, role: 'auditor',
      avatar: null,
      accessibilityConfig: JSON.stringify({ fontSize: 'normal', contrast: 'normal', voiceEnabled: false, voiceSpeed: 1.0 }),
      chronicDiseases: JSON.stringify([]),
      createdAt: now, lastActiveAt: now
    },
    {
      id: 'user_005', phone: '13700137001', name: '管理员', age: 35, role: 'admin',
      avatar: null,
      accessibilityConfig: JSON.stringify({ fontSize: 'normal', contrast: 'normal', voiceEnabled: false, voiceSpeed: 1.0 }),
      chronicDiseases: JSON.stringify([]),
      createdAt: now, lastActiveAt: now
    },
    {
      id: 'user_006', phone: '13800138003', name: '王大爷', age: 75, role: 'elder',
      avatar: null,
      accessibilityConfig: JSON.stringify({ fontSize: 'xlarge', contrast: 'high', voiceEnabled: true, voiceSpeed: 0.7 }),
      chronicDiseases: JSON.stringify(['高血压', '心脏病']),
      createdAt: now,
      lastActiveAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, name, age, role, avatar, accessibility_config, chronic_diseases, created_at, last_active_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const u of users) {
    insertUser.run([u.id, u.phone, u.name, u.age, u.role, u.avatar, u.accessibilityConfig, u.chronicDiseases, u.createdAt, u.lastActiveAt]);
  }

  const familyBindings = [
    { id: 'binding_001', elderId: 'user_001', familyId: 'user_003', relation: '父子', status: 'active', notificationEnabled: 1, createdAt: now },
    { id: 'binding_002', elderId: 'user_002', familyId: 'user_003', relation: '母子', status: 'active', notificationEnabled: 1, createdAt: now }
  ];
  const insertBinding = db.prepare(`
    INSERT INTO family_bindings (id, elder_id, family_id, relation, status, notification_enabled, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const b of familyBindings) {
    insertBinding.run([b.id, b.elderId, b.familyId, b.relation, b.status, b.notificationEnabled, b.createdAt]);
  }

  const healthContents = [
    {
      id: 'content_001', type: 'recipe', title: '降压养生粥',
      description: '适合高血压老年人的营养粥品，清淡易消化',
      imageUrl: 'https://images.unsplash.com/photo-1604908554199-1baeb2a7a0c2?w=400&h=300&fit=crop',
      ageGroups: JSON.stringify(['60-70', '70+']),
      chronicDiseases: JSON.stringify(['高血压']),
      content: JSON.stringify({
        ingredients: ['大米100g', '芹菜50g', '胡萝卜30g', '枸杞10g'],
        steps: ['大米洗净浸泡30分钟', '芹菜、胡萝卜切小丁', '大米加水煮沸后转小火煮20分钟', '加入蔬菜丁再煮10分钟', '最后加入枸杞焖5分钟'],
        tips: '低盐少油，每天早餐食用效果最佳'
      }),
      audioUrl: null, status: 'approved', accessibilityLevel: 3, createdAt: now
    },
    {
      id: 'content_002', type: 'exercise', title: '八段锦基础动作',
      description: '适合老年人的温和健身运动，强身健体',
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
      ageGroups: JSON.stringify(['50-60', '60-70', '70+']),
      chronicDiseases: JSON.stringify([]),
      content: JSON.stringify({
        duration: '15分钟', frequency: '每天早晚各一次',
        moves: [
          { name: '两手托天理三焦', reps: 6 },
          { name: '左右开弓似射雕', reps: 6 },
          { name: '调理脾胃须单举', reps: 6 },
          { name: '五劳七伤往后瞧', reps: 6 }
        ],
        tips: '动作要缓，呼吸要匀，量力而行'
      }),
      audioUrl: null, status: 'approved', accessibilityLevel: 2, createdAt: now
    },
    {
      id: 'content_003', type: 'medication', title: '糖尿病用药指南',
      description: '糖尿病患者常见用药注意事项',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
      ageGroups: JSON.stringify(['60-70', '70+']),
      chronicDiseases: JSON.stringify(['糖尿病']),
      content: JSON.stringify({
        medications: [
          { name: '二甲双胍', time: '餐后服用', dosage: '0.5g/次' },
          { name: '格列美脲', time: '早餐前服用', dosage: '2mg/次' }
        ],
        precautions: ['定时监测血糖', '注意饮食配合', '出现低血糖症状及时处理'],
        tips: '随身携带糖果，以备低血糖时食用'
      }),
      audioUrl: null, status: 'approved', accessibilityLevel: 3, createdAt: now
    },
    {
      id: 'content_004', type: 'recipe', title: '补钙排骨汤',
      description: '富含钙质，适合骨质疏松的老年人',
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      ageGroups: JSON.stringify(['60-70', '70+']),
      chronicDiseases: JSON.stringify(['骨质疏松']),
      content: JSON.stringify({
        ingredients: ['排骨500g', '山药200g', '枸杞15g', '生姜3片'],
        steps: ['排骨焯水去血沫', '山药去皮切块', '所有材料放入砂锅', '大火煮沸后转小火炖1.5小时', '加盐调味即可'],
        tips: '每周食用2-3次，补钙效果好'
      }),
      audioUrl: null, status: 'pending', accessibilityLevel: 2, createdAt: now
    },
    {
      id: 'content_005', type: 'exercise', title: '关节养护操',
      description: '针对关节炎患者的关节活动训练',
      imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
      ageGroups: JSON.stringify(['60-70', '70+']),
      chronicDiseases: JSON.stringify(['关节炎']),
      content: JSON.stringify({
        duration: '10分钟', frequency: '每天2-3次',
        moves: [
          { name: '膝关节旋转', reps: 10 },
          { name: '手指屈伸', reps: 15 },
          { name: '手腕绕环', reps: 10 },
          { name: '踝关节活动', reps: 10 }
        ],
        tips: '疼痛时停止，不要勉强'
      }),
      audioUrl: null, status: 'approved', accessibilityLevel: 1, createdAt: now
    }
  ];

  const insertContent = db.prepare(`
    INSERT INTO health_contents (id, type, title, description, image_url, age_groups, chronic_diseases, content, audio_url, status, accessibility_level, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of healthContents) {
    insertContent.run([c.id, c.type, c.title, c.description, c.imageUrl, c.ageGroups, c.chronicDiseases, c.content, c.audioUrl, c.status, c.accessibilityLevel, c.createdAt]);
  }

  const anniversaries = [
    { id: 'anniv_001', userId: 'user_001', date: '08-15', title: '生日', type: 'birthday', remindDays: 7 },
    { id: 'anniv_002', userId: 'user_001', date: '10-01', title: '结婚纪念日', type: 'memorial', remindDays: 3 },
    { id: 'anniv_003', userId: 'user_002', date: '03-12', title: '生日', type: 'birthday', remindDays: 7 }
  ];
  const insertAnniv = db.prepare(`
    INSERT INTO anniversaries (id, user_id, date, title, type, remind_days)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const a of anniversaries) {
    insertAnniv.run([a.id, a.userId, a.date, a.title, a.type, a.remindDays]);
  }

  const medicationReminders = [
    { id: 'med_001', userId: 'user_001', medicineName: '降压药', dosage: '1片', times: JSON.stringify(['08:00', '20:00']), days: JSON.stringify([1,2,3,4,5,6,7]), enabled: 1, note: '饭后服用' },
    { id: 'med_002', userId: 'user_001', medicineName: '二甲双胍', dosage: '0.5g', times: JSON.stringify(['07:00', '12:00', '18:00']), days: JSON.stringify([1,2,3,4,5,6,7]), enabled: 1, note: '餐中服用' },
    { id: 'med_003', userId: 'user_002', medicineName: '钙片', dosage: '2片', times: JSON.stringify(['21:00']), days: JSON.stringify([1,2,3,4,5,6,7]), enabled: 1, note: '睡前服用吸收更好' }
  ];
  const insertMed = db.prepare(`
    INSERT INTO medication_reminders (id, user_id, medicine_name, dosage, times, days, enabled, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const m of medicationReminders) {
    insertMed.run([m.id, m.userId, m.medicineName, m.dosage, m.times, m.days, m.enabled, m.note]);
  }
}

export default initDatabase;
