require('dotenv').config({ path: '../../.env' })
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '../../data/app.sqlite')
const dataDir = path.dirname(dbPath)

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'owner',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS master_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    real_name TEXT NOT NULL,
    id_card TEXT NOT NULL,
    face_photo TEXT,
    id_card_front TEXT,
    id_card_back TEXT,
    skill_certificates TEXT,
    skills TEXT,
    status TEXT DEFAULT 'pending',
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS master_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    response_speed INTEGER DEFAULT 0,
    on_time_rate REAL DEFAULT 100,
    complaint_rate REAL DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    rating REAL DEFAULT 5,
    area TEXT,
    daily_order_limit INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    owner_id INTEGER NOT NULL,
    master_id INTEGER,
    service_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    fault_images TEXT,
    expected_time TEXT,
    address TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    budget_price REAL,
    final_price REAL,
    status TEXT DEFAULT 'pending',
    deposit_paid INTEGER DEFAULT 0,
    balance_paid INTEGER DEFAULT 0,
    accepted_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (master_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_negotiations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    sender_role TEXT NOT NULL,
    price REAL NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS order_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    photo_type TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    description TEXT,
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE NOT NULL,
    owner_id INTEGER NOT NULL,
    master_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    content TEXT,
    images TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS rework_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_type TEXT NOT NULL,
    status TEXT DEFAULT 'success',
    transaction_no TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS acceptances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE NOT NULL,
    signature TEXT,
    feedback TEXT,
    issues TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS service_standards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    steps TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dispute_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    complainant_id INTEGER NOT NULL,
    respondent_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    evidence TEXT,
    status TEXT DEFAULT 'pending',
    result TEXT,
    handled_by INTEGER,
    handled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS knowledge_graph (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fault_type TEXT NOT NULL,
    symptoms TEXT,
    possible_causes TEXT,
    solutions TEXT,
    related_services TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS high_risk_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    work_type TEXT NOT NULL,
    qualification TEXT,
    status TEXT DEFAULT 'pending',
    approved_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE INDEX IF NOT EXISTS idx_orders_owner ON orders(owner_id);
  CREATE INDEX IF NOT EXISTS idx_orders_master ON orders(master_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_reviews_master ON reviews(master_id);
`)

const initData = db.transaction(() => {
  const standards = [
    { service_type: 'air_conditioner', title: '空调加氟SOP', content: '1. 安全检查\n2. 连接压力表\n3. 启动空调\n4. 检测压力\n5. 补充冷媒\n6. 检漏测试\n7. 清理现场', steps: JSON.stringify(['安全检查', '连接压力表', '启动空调', '检测压力', '补充冷媒', '检漏测试', '清理现场']) },
    { service_type: 'plumbing', title: '水管维修SOP', content: '1. 关闭水源\n2. 排水泄压\n3. 拆卸损坏部件\n4. 安装新部件\n5. 密封测试\n6. 恢复供水\n7. 清理现场', steps: JSON.stringify(['关闭水源', '排水泄压', '拆卸损坏部件', '安装新部件', '密封测试', '恢复供水', '清理现场']) },
    { service_type: 'electrical', title: '电路维修SOP', content: '1. 断电确认\n2. 故障检测\n3. 维修更换\n4. 通电测试\n5. 绝缘检测\n6. 清理现场', steps: JSON.stringify(['断电确认', '故障检测', '维修更换', '通电测试', '绝缘检测', '清理现场']) }
  ]
  
  const insertStandard = db.prepare('INSERT OR IGNORE INTO service_standards (service_type, title, content, steps) VALUES (?, ?, ?, ?)')
  standards.forEach(s => insertStandard.run(s.service_type, s.title, s.content, s.steps))

  const knowledge = [
    { fault_type: '空调不制冷', symptoms: '出风口无风/微风,制冷效果差', possible_causes: JSON.stringify(['冷媒不足', '滤网堵塞', '压缩机故障']), solutions: JSON.stringify(['加氟', '清洗滤网', '更换压缩机']), related_services: JSON.stringify(['air_conditioner']) },
    { fault_type: '水管漏水', symptoms: '地面潮湿,水表异常转动', possible_causes: JSON.stringify(['管道老化', '接口松动', '水压过高']), solutions: JSON.stringify(['更换管道', '紧固接口', '安装减压阀']), related_services: JSON.stringify(['plumbing']) },
    { fault_type: '开关跳闸', symptoms: '频繁跳闸,无法送电', possible_causes: JSON.stringify(['线路短路', '过载', '漏电']), solutions: JSON.stringify(['排除短路', '分路供电', '检查绝缘']), related_services: JSON.stringify(['electrical']) }
  ]
  
  const insertKnowledge = db.prepare('INSERT OR IGNORE INTO knowledge_graph (fault_type, symptoms, possible_causes, solutions, related_services) VALUES (?, ?, ?, ?, ?)')
  knowledge.forEach(k => insertKnowledge.run(k.fault_type, k.symptoms, k.possible_causes, k.solutions, k.related_services))

  const bcrypt = require('bcryptjs')
  const hashedPassword = bcrypt.hashSync('123456', 10)
  
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)')
  insertUser.run('13800138001', hashedPassword, '测试业主', 'owner')
  insertUser.run('13800138002', hashedPassword, '测试师傅', 'master')
  insertUser.run('13800138000', hashedPassword, '管理员', 'admin')

  const owner = db.prepare('SELECT id FROM users WHERE phone = ?').get('13800138001')
  const master = db.prepare('SELECT id FROM users WHERE phone = ?').get('13800138002')

  const insertMasterProfile = db.prepare('INSERT OR IGNORE INTO master_profiles (user_id, area, rating) VALUES (?, ?, ?)')
  insertMasterProfile.run(master.id, '朝阳区', 4.8)
  db.prepare('UPDATE master_profiles SET area = ?, rating = ?, total_orders = ?, completed_orders = ? WHERE user_id = ?')
    .run('朝阳区', 4.8, 4, 1, master.id)

  db.prepare(`
    INSERT OR IGNORE INTO master_verifications
      (user_id, real_name, id_card, face_photo, id_card_front, id_card_back, skill_certificates, skills, status, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    master.id,
    '测试师傅',
    '110101198801011234',
    '/demo/master-face.jpg',
    '/demo/id-front.jpg',
    '/demo/id-back.jpg',
    JSON.stringify(['电工证', '高空作业证']),
    JSON.stringify(['electrical', 'plumbing', 'air_conditioner']),
    'approved'
  )

  const insertOrder = db.prepare(`
    INSERT OR IGNORE INTO orders
      (order_no, owner_id, master_id, service_type, title, description, fault_images, expected_time, address, contact_name, contact_phone, budget_price, final_price, status, deposit_paid, balance_paid, accepted_at, started_at, completed_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const demoOrders = [
    ['HS-20260604-001', owner.id, master.id, 'air_conditioner', '客厅空调不制冷检修', '空调运行 20 分钟仍无冷风，需要检测冷媒和滤网。', JSON.stringify(['/demo/ac-issue.jpg']), '2026-06-04 15:00', '北京市朝阳区望京 SOHO T2', '王女士', '13800138001', 260, 320, 'in_progress', 1, 0, '2026-06-04 09:10:00', '2026-06-04 10:20:00', null],
    ['HS-20260604-002', owner.id, master.id, 'plumbing', '厨房水槽下水漏水', '下水软管接口松动，橱柜底部有积水。', JSON.stringify(['/demo/pipe-leak.jpg']), '2026-06-04 16:30', '北京市海淀区中关村软件园 A 座', '李先生', '13800138001', 180, 220, 'negotiated', 0, 0, '2026-06-04 10:30:00', null, null],
    ['HS-20260604-003', owner.id, master.id, 'electrical', '卧室插座频繁跳闸', '开启空调后卧室分路跳闸，需要排查线路负载。', JSON.stringify(['/demo/electric.jpg']), '2026-06-05 09:00', '北京市丰台区丽泽商务区 18 号', '赵女士', '13800138001', 200, 260, 'pending', 0, 0, null, null, null],
    ['HS-20260604-004', owner.id, master.id, 'air_conditioner', '卧室空调深度清洗', '挂机空调出风有异味，需要拆洗滤网和蒸发器。', JSON.stringify(['/demo/ac-clean.jpg']), '2026-06-03 14:00', '北京市朝阳区三里屯太古里 8 号楼', '陈先生', '13800138001', 160, 180, 'completed', 1, 1, '2026-06-03 09:00:00', '2026-06-03 14:10:00', '2026-06-03 15:30:00']
  ]
  demoOrders.forEach(order => insertOrder.run(...order))

  const disputeOrder = db.prepare('SELECT id FROM orders WHERE order_no = ?').get('HS-20260604-001')
  if (disputeOrder) {
    db.prepare(`
      INSERT OR IGNORE INTO dispute_cases
        (order_id, complainant_id, respondent_id, reason, description, evidence, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      disputeOrder.id,
      owner.id,
      master.id,
      '维修进度争议',
      '业主反馈预约时间后仍需补充材料，希望平台介入确认处理进度。',
      JSON.stringify(['/demo/dispute-progress.jpg']),
      'pending'
    )
  }
})

initData()

console.log('数据库初始化完成')
db.close()
