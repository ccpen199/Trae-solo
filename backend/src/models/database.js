const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS houses (
      id TEXT PRIMARY KEY,
      house_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      area REAL,
      rooms INTEGER,
      price REAL,
      status TEXT DEFAULT 'available',
      developer_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (developer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS panoramic_images (
      id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      is_locked INTEGER DEFAULT 0,
      locked_by TEXT,
      locked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (house_id) REFERENCES houses(id),
      FOREIGN KEY (locked_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS floor_plans (
      id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      is_locked INTEGER DEFAULT 0,
      locked_by TEXT,
      locked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (house_id) REFERENCES houses(id),
      FOREIGN KEY (locked_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS hotspots (
      id TEXT PRIMARY KEY,
      panoramic_id TEXT NOT NULL,
      name TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      z REAL NOT NULL,
      type TEXT NOT NULL,
      target_id TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (panoramic_id) REFERENCES panoramic_images(id)
    );

    CREATE TABLE IF NOT EXISTS navigation_points (
      id TEXT PRIMARY KEY,
      panoramic_id TEXT NOT NULL,
      name TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      z REAL NOT NULL,
      target_panoramic_id TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (panoramic_id) REFERENCES panoramic_images(id),
      FOREIGN KEY (target_panoramic_id) REFERENCES panoramic_images(id)
    );

    CREATE TABLE IF NOT EXISTS viewing_sessions (
      id TEXT PRIMARY KEY,
      session_no TEXT UNIQUE NOT NULL,
      house_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      agent_id TEXT,
      status TEXT DEFAULT 'pending_house_selection',
      current_step TEXT DEFAULT 'house_selection',
      panoramic_id TEXT,
      floor_plan_id TEXT,
      hotspot_id TEXT,
      appointment_id TEXT,
      expected_completion_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (house_id) REFERENCES houses(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (agent_id) REFERENCES users(id),
      FOREIGN KEY (panoramic_id) REFERENCES panoramic_images(id),
      FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(id),
      FOREIGN KEY (hotspot_id) REFERENCES hotspots(id)
    );

    CREATE TABLE IF NOT EXISTS session_details (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      step TEXT NOT NULL,
      status TEXT NOT NULL,
      data TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES viewing_sessions(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS status_flow (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES viewing_sessions(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      appointment_time DATETIME NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES viewing_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      buyer_phone TEXT NOT NULL,
      buyer_email TEXT,
      interest_level TEXT,
      remark TEXT,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES viewing_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      house_id TEXT,
      panoramic_id TEXT,
      floor_plan_id TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      uploaded_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES viewing_sessions(id),
      FOREIGN KEY (house_id) REFERENCES houses(id),
      FOREIGN KEY (panoramic_id) REFERENCES panoramic_images(id),
      FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (session_id) REFERENCES viewing_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      detail TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (session_id) REFERENCES viewing_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS conflict_records (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      conflict_type TEXT NOT NULL,
      original_data TEXT,
      conflict_data TEXT,
      resolved_by TEXT,
      resolved_at DATETIME,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES viewing_sessions(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    
    const saltRounds = 10;
    
    const users = [
      { id: uuidv4(), username: 'admin', password: bcrypt.hashSync('admin123', saltRounds), role: 'admin', name: '系统管理员', phone: '13800138000' },
      { id: uuidv4(), username: 'developer1', password: bcrypt.hashSync('dev123', saltRounds), role: 'developer', name: '开发商用户', phone: '13800138001' },
      { id: uuidv4(), username: 'agent1', password: bcrypt.hashSync('agent123', saltRounds), role: 'agent', name: '经纪人张三', phone: '13800138002' },
      { id: uuidv4(), username: 'buyer1', password: bcrypt.hashSync('buyer123', saltRounds), role: 'buyer', name: '购房者李四', phone: '13800138003' },
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, role, name, phone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    for (const user of users) {
      insertUser.run(user.id, user.username, user.password, user.role, user.name, user.phone);
    }

    const house1Id = uuidv4();
    const house2Id = uuidv4();

    const insertHouse = db.prepare(`
      INSERT INTO houses (id, house_no, name, address, area, rooms, price, status, developer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertHouse.run(house1Id, 'H2024001', '阳光花园1栋101室', '北京市朝阳区阳光路100号', 120.5, 3, 5000000, users[1].id);
    insertHouse.run(house2Id, 'H2024002', '锦绣家园2栋202室', '北京市海淀区锦绣路200号', 98.0, 2, 3800000, users[1].id);

    const panoramic1Id = uuidv4();
    const panoramic2Id = uuidv4();

    const insertPanoramic = db.prepare(`
      INSERT INTO panoramic_images (id, house_id, name, file_path, description, status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertPanoramic.run(panoramic1Id, house1Id, '客厅全景', '/uploads/panoramic/house1_living.jpg', '阳光花园1栋101室客厅360度全景');
    insertPanoramic.run(panoramic2Id, house1Id, '卧室全景', '/uploads/panoramic/house1_bedroom.jpg', '阳光花园1栋101室主卧全景');

    const floorPlan1Id = uuidv4();
    const floorPlan2Id = uuidv4();

    const insertFloorPlan = db.prepare(`
      INSERT INTO floor_plans (id, house_id, name, file_path, description, status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertFloorPlan.run(floorPlan1Id, house1Id, '标准户型图', '/uploads/floorplan/house1_plan.jpg', '阳光花园1栋101室标准户型平面图');
    insertFloorPlan.run(floorPlan2Id, house2Id, '两居室户型图', '/uploads/floorplan/house2_plan.jpg', '锦绣家园2栋202室两居室户型图');

    const hotspot1Id = uuidv4();
    const hotspot2Id = uuidv4();

    const insertHotspot = db.prepare(`
      INSERT INTO hotspots (id, panoramic_id, name, x, y, z, type, target_id, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertHotspot.run(hotspot1Id, panoramic1Id, '进入卧室', 0.5, 0.5, 0.0, 'navigation', panoramic2Id, '点击进入卧室全景');
    insertHotspot.run(hotspot2Id, panoramic1Id, '沙发信息', 0.3, 0.6, 0.0, 'info', null, '真皮沙发，意大利进口');

    const navPoint1Id = uuidv4();

    const insertNavPoint = db.prepare(`
      INSERT INTO navigation_points (id, panoramic_id, name, x, y, z, target_panoramic_id, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    insertNavPoint.run(navPoint1Id, panoramic1Id, '前往卧室', 0.8, 0.5, 0.0, panoramic2Id, '从客厅导航到卧室');
  }
};

initDatabase();

module.exports = db;
