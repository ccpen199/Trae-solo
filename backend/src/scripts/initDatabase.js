require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/dormitory.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const initDatabase = async () => {
  console.log('开始初始化 SQLite 数据库...');
  console.log('数据库路径:', dbPath);

  try {
    const db = new Database(dbPath);

    console.log('开始创建数据表...');

    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'student',
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS dormitories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        building_code VARCHAR(20) UNIQUE NOT NULL,
        building_name VARCHAR(100) NOT NULL,
        description TEXT,
        gender_type VARCHAR(10) DEFAULT 'mixed',
        total_rooms INTEGER DEFAULT 0,
        total_beds INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number VARCHAR(20) UNIQUE NOT NULL,
        dormitory_id INTEGER,
        floor INTEGER,
        room_type VARCHAR(50),
        total_beds INTEGER DEFAULT 4,
        gender_type VARCHAR(10),
        status VARCHAR(20) DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dormitory_id) REFERENCES dormitories(id)
      )`,

      `CREATE TABLE IF NOT EXISTS beds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bed_number VARCHAR(20) NOT NULL,
        room_id INTEGER,
        bed_code VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        UNIQUE(room_id, bed_number)
      )`,

      `CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id VARCHAR(50) UNIQUE NOT NULL,
        user_id INTEGER,
        name VARCHAR(100) NOT NULL,
        gender VARCHAR(10),
        birthday DATE,
        major VARCHAR(100),
        class VARCHAR(50),
        grade INTEGER,
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      `CREATE TABLE IF NOT EXISTS check_in_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        bed_id INTEGER,
        room_id INTEGER,
        dormitory_id INTEGER,
        check_in_date DATE NOT NULL,
        expected_check_out_date DATE,
        actual_check_out_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (bed_id) REFERENCES beds(id),
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (dormitory_id) REFERENCES dormitories(id)
      )`,

      `CREATE TABLE IF NOT EXISTS room_change_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        old_bed_id INTEGER,
        new_bed_id INTEGER,
        old_room_id INTEGER,
        new_room_id INTEGER,
        old_dormitory_id INTEGER,
        new_dormitory_id INTEGER,
        request_date DATE,
        approval_date DATE,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        operator_id INTEGER,
        operator_name VARCHAR(100),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (old_bed_id) REFERENCES beds(id),
        FOREIGN KEY (new_bed_id) REFERENCES beds(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )`,

      `CREATE TABLE IF NOT EXISTS maintenance_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'pending',
        student_id INTEGER,
        student_no VARCHAR(50),
        student_name VARCHAR(100),
        student_phone VARCHAR(20),
        room_id INTEGER,
        room_number VARCHAR(20),
        dormitory_id INTEGER,
        building_code VARCHAR(20),
        building_name VARCHAR(100),
        assigned_to_id INTEGER,
        assigned_to_name VARCHAR(100),
        processed_at DATETIME,
        completed_at DATETIME,
        solution TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (dormitory_id) REFERENCES dormitories(id)
      )`,

      `CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        module VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS role_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role VARCHAR(20) NOT NULL,
        permission_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (permission_id) REFERENCES permissions(id),
        UNIQUE(role, permission_id)
      )`,

      `CREATE TABLE IF NOT EXISTS operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        module VARCHAR(50),
        target_type VARCHAR(50),
        target_id INTEGER,
        details TEXT,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
    ];

    for (const tableSql of tables) {
      db.exec(tableSql);
    }

    console.log('✓ 数据表创建成功');

    console.log('创建索引...');
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_dormitories_building_code ON dormitories(building_code)',
      'CREATE INDEX IF NOT EXISTS idx_rooms_dormitory_id ON rooms(dormitory_id)',
      'CREATE INDEX IF NOT EXISTS idx_beds_room_id ON beds(room_id)',
      'CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status)',
      'CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id)',
      'CREATE INDEX IF NOT EXISTS idx_check_in_records_student_id ON check_in_records(student_id)',
      'CREATE INDEX IF NOT EXISTS idx_check_in_records_status ON check_in_records(status)',
      'CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_status ON maintenance_tickets(status)',
      'CREATE INDEX IF NOT EXISTS idx_operation_logs_user_id ON operation_logs(user_id)',
    ];

    for (const indexSql of indexQueries) {
      db.exec(indexSql);
    }
    console.log('✓ 索引创建成功');

    console.log('插入初始数据...');

    const hashedPassword = bcrypt.hashSync('123456', 10);

    const insertUsers = db.prepare(`
      INSERT OR IGNORE INTO users (username, password, role, name, email, phone) VALUES 
      ('admin', ?, 'admin', '系统管理员', 'admin@example.com', '13800138000'),
      ('dorm_admin', ?, 'dormitory_admin', '宿舍管理员', 'dorm_admin@example.com', '13800138001'),
      ('student1', ?, 'student', '张三', 'student1@example.com', '13800138002'),
      ('student2', ?, 'student', '李四', 'student2@example.com', '13800138003'),
      ('student3', ?, 'student', '王五', 'student3@example.com', '13800138004')
    `);
    insertUsers.run(hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword);
    console.log('✓ 用户数据插入成功');

    const insertDormitories = db.prepare(`
      INSERT OR IGNORE INTO dormitories (building_code, building_name, description, gender_type, total_rooms, total_beds, status) VALUES 
      ('A1', '一号男生宿舍楼', '男生宿舍，共6层', 'male', 30, 120, 'active'),
      ('A2', '二号男生宿舍楼', '男生宿舍，共6层', 'male', 30, 120, 'active'),
      ('B1', '一号女生宿舍楼', '女生宿舍，共6层', 'female', 30, 120, 'active'),
      ('B2', '二号女生宿舍楼', '女生宿舍，共6层', 'female', 30, 120, 'active')
    `);
    insertDormitories.run();
    console.log('✓ 宿舍楼数据插入成功');

    const dormitories = db.prepare('SELECT id, building_code FROM dormitories').all();
    const insertRoom = db.prepare(`
      INSERT OR IGNORE INTO rooms (room_number, dormitory_id, floor, room_type, total_beds, gender_type, status) VALUES (?, ?, ?, ?, ?, ?, 'available')
    `);
    const insertBed = db.prepare(`
      INSERT OR IGNORE INTO beds (bed_number, room_id, bed_code, status) VALUES (?, ?, ?, 'available')
    `);

    for (const dorm of dormitories) {
      const genderType = dorm.building_code.startsWith('A') ? 'male' : 'female';
      for (let floor = 1; floor <= 3; floor++) {
        for (let roomNum = 1; roomNum <= 3; roomNum++) {
          const roomNumber = `${floor}${String(roomNum).padStart(2, '0')}`;
          const fullRoomNumber = `${dorm.building_code}-${roomNumber}`;
          
          const result = insertRoom.run(fullRoomNumber, dorm.id, floor, '四人间', 4, genderType);
          const roomId = result.lastInsertRowid;
          
          if (roomId) {
            for (let bedNum = 1; bedNum <= 4; bedNum++) {
              const bedCode = `${fullRoomNumber}-${bedNum}`;
              insertBed.run(String(bedNum), roomId, bedCode);
            }
          }
        }
      }
    }
    console.log('✓ 房间和床位数据插入成功');

    const insertStudents = db.prepare(`
      INSERT OR IGNORE INTO students (student_id, user_id, name, gender, major, class, grade, phone, status) VALUES 
      ('2024001', 3, '张三', 'male', '计算机科学与技术', '计算机2401班', 2024, '13800138002', 'active'),
      ('2024002', 4, '李四', 'male', '计算机科学与技术', '计算机2401班', 2024, '13800138003', 'active'),
      ('2024003', 5, '王五', 'female', '软件工程', '软件2401班', 2024, '13800138004', 'active')
    `);
    insertStudents.run();
    console.log('✓ 学生数据插入成功');

    db.close();
    console.log('\n✓ SQLite 数据库初始化完成！');
    console.log('\n默认账号：');
    console.log('  系统管理员: admin / 123456');
    console.log('  宿舍管理员: dorm_admin / 123456');
    console.log('  学生账号: student1 / 123456 (张三)');
    console.log('  学生账号: student2 / 123456 (李四)');
    console.log('  学生账号: student3 / 123456 (王五)');

  } catch (err) {
    console.error('SQLite 数据库初始化失败:', err.message);
    throw err;
  }
};

initDatabase().catch((err) => {
  console.error(err);
  process.exit(1);
});