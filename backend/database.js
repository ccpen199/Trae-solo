const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite')
const dataDir = path.dirname(dbPath)

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS couriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      brands TEXT DEFAULT '[]',
      service_area TEXT,
      grid_id INTEGER,
      performance_points INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cabinets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cabinet_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL,
      lng REAL,
      total_boxes INTEGER DEFAULT 0,
      available_boxes INTEGER DEFAULT 0,
      temperature_control INTEGER DEFAULT 0,
      has_fault INTEGER DEFAULT 0,
      fault_description TEXT,
      grid_id INTEGER,
      status TEXT DEFAULT 'online',
      last_heartbeat DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS boxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cabinet_id INTEGER NOT NULL,
      box_code TEXT NOT NULL,
      size TEXT NOT NULL,
      status TEXT DEFAULT 'empty',
      temperature_control INTEGER DEFAULT 0,
      current_package_id INTEGER,
      locked_until DATETIME,
      FOREIGN KEY (cabinet_id) REFERENCES cabinets(id),
      UNIQUE(cabinet_id, box_code)
    );

    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_number TEXT UNIQUE NOT NULL,
      courier_id INTEGER,
      cabinet_id INTEGER,
      box_id INTEGER,
      brand TEXT NOT NULL,
      receiver_name TEXT,
      receiver_phone TEXT,
      ocr_data TEXT,
      pickup_code TEXT,
      status TEXT DEFAULT 'pending',
      is_overdue INTEGER DEFAULT 0,
      overdue_hours INTEGER DEFAULT 24,
      stored_at DATETIME,
      picked_at DATETIME,
      pickup_code_expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courier_id) REFERENCES couriers(id),
      FOREIGN KEY (cabinet_id) REFERENCES cabinets(id),
      FOREIGN KEY (box_id) REFERENCES boxes(id)
    );

    CREATE TABLE IF NOT EXISTS rental_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      courier_id INTEGER NOT NULL,
      cabinet_id INTEGER NOT NULL,
      box_id INTEGER,
      box_size TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      duration_hours INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      auto_renew INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courier_id) REFERENCES couriers(id),
      FOREIGN KEY (cabinet_id) REFERENCES cabinets(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_no TEXT UNIQUE NOT NULL,
      courier_id INTEGER NOT NULL,
      cabinet_id INTEGER NOT NULL,
      box_size TEXT NOT NULL,
      reserved_time DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courier_id) REFERENCES couriers(id),
      FOREIGN KEY (cabinet_id) REFERENCES cabinets(id)
    );

    CREATE TABLE IF NOT EXISTS sms_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'custom',
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sms_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER,
      phone TEXT NOT NULL,
      content TEXT NOT NULL,
      template_id INTEGER,
      status TEXT DEFAULT 'sent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id)
    );

    CREATE TABLE IF NOT EXISTS tutorial_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT,
      duration INTEGER,
      category TEXT,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS faq_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courier_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      deliveries_count INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      rank INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courier_id) REFERENCES couriers(id),
      UNIQUE(courier_id, month)
    );

    CREATE TABLE IF NOT EXISTS cabinet_health_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cabinet_id INTEGER NOT NULL,
      metric_type TEXT NOT NULL,
      metric_value REAL,
      log_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cabinet_id) REFERENCES cabinets(id)
    );

    CREATE TABLE IF NOT EXISTS revenue_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courier_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      order_id INTEGER,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courier_id) REFERENCES couriers(id)
    );

    CREATE TABLE IF NOT EXISTS withdrawal_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courier_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      account_info TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courier_id) REFERENCES couriers(id)
    );

    CREATE TABLE IF NOT EXISTS device_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cabinet_id INTEGER,
      alert_type TEXT NOT NULL,
      message TEXT NOT NULL,
      level TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cabinet_id) REFERENCES cabinets(id)
    );
  `)

  const courierCount = db.prepare('SELECT COUNT(*) as count FROM couriers').get().count
  if (courierCount === 0) {
    const bcrypt = require('bcryptjs')
    const hashedPassword = bcrypt.hashSync('123456', 10)
    
    const insertCourier = db.prepare(`
      INSERT INTO couriers (username, password, name, phone, brands, service_area, performance_points)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    insertCourier.run('courier001', hashedPassword, '张三', '13800138001', JSON.stringify(['sto', 'yto']), '朝阳区A区', 1250)
    insertCourier.run('courier002', hashedPassword, '李四', '13800138002', JSON.stringify(['zto']), '朝阳区B区', 980)
    insertCourier.run('courier003', hashedPassword, '王五', '13800138003', JSON.stringify(['sf', 'jd']), '海淀区A区', 2100)
  }

  const cabinetCount = db.prepare('SELECT COUNT(*) as count FROM cabinets').get().count
  if (cabinetCount === 0) {
    const insertCabinet = db.prepare(`
      INSERT INTO cabinets (cabinet_code, name, address, lat, lng, total_boxes, available_boxes, temperature_control, grid_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const cabinets = [
      ['FCBJ0001', '朝阳园小区柜', '北京市朝阳区朝阳园小区北门', 39.92, 116.46, 48, 32, 1, 1, 'online'],
      ['FCBJ0002', '阳光花园柜', '北京市朝阳区阳光花园东门', 39.93, 116.47, 36, 15, 0, 1, 'online'],
      ['FCBJ0003', '海淀科技园柜', '北京市海淀区科技园A座', 39.98, 116.31, 60, 45, 1, 2, 'online'],
      ['FCBJ0004', '中关村大厦柜', '北京市海淀区中关村大厦B1层', 39.98, 116.32, 42, 8, 0, 2, 'online'],
      ['FCBJ0005', '西城商业中心柜', '北京市西城区商业中心广场', 39.91, 116.36, 54, 30, 1, 3, 'online']
    ]
    
    cabinets.forEach(c => insertCabinet.run(...c))

    const insertBox = db.prepare(`
      INSERT INTO boxes (cabinet_id, box_code, size, status, temperature_control)
      VALUES (?, ?, ?, ?, ?)
    `)

    for (let cabinetId = 1; cabinetId <= 5; cabinetId++) {
      const sizes = ['S', 'M', 'L']
      for (let i = 1; i <= 20; i++) {
        const size = sizes[i % 3]
        insertBox.run(cabinetId, `A${String(i).padStart(2, '0')}`, size, i % 3 === 0 ? 'occupied' : 'empty', cabinetId % 2)
      }
    }
  }

  const packageCount = db.prepare('SELECT COUNT(*) as count FROM packages').get().count
  if (packageCount === 0) {
    const insertPackage = db.prepare(`
      INSERT INTO packages (tracking_number, courier_id, cabinet_id, box_id, brand, receiver_name, receiver_phone, pickup_code, status, stored_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const brands = ['sto', 'yto', 'zto', 'sf', 'jd', 'ems', 'tt', 'yd', 'qf', 'dbl', 'jf', 'ups']
    const statuses = ['stored', 'stored', 'stored', 'picked', 'overdue']
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
    const now = new Date()

    for (let i = 1; i <= 30; i++) {
      const trackingNum = `SF${String(100000000000 + i).slice(-12)}`
      const brand = brands[i % brands.length]
      const status = statuses[i % statuses.length]
      const storedAt = new Date(now - Math.random() * 72 * 60 * 60 * 1000)
      
      insertPackage.run(
        trackingNum,
        (i % 3) + 1,
        (i % 5) + 1,
        ((i - 1) % 20) + 1,
        brand,
        names[i % names.length],
        `138${String(10000000 + i).slice(-8)}`,
        String(100000 + Math.floor(Math.random() * 900000)),
        status,
        storedAt.toISOString()
      )
    }
  }

  const reservationCount = db.prepare('SELECT COUNT(*) as count FROM reservations').get().count
  if (reservationCount === 0) {
    const insertReservation = db.prepare(`
      INSERT INTO reservations (reservation_no, courier_id, cabinet_id, box_size, reserved_time, expires_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const now = new Date()
    const demoReservations = [
      ['RESV-DEMO-001', 1, 1, 'M', new Date(now.getTime() + 10 * 60 * 1000), new Date(now.getTime() + 40 * 60 * 1000), 'pending'],
      ['RESV-DEMO-002', 1, 2, 'S', new Date(now.getTime() + 20 * 60 * 1000), new Date(now.getTime() + 50 * 60 * 1000), 'locked'],
      ['RESV-DEMO-003', 2, 4, 'L', new Date(now.getTime() - 90 * 60 * 1000), new Date(now.getTime() - 60 * 60 * 1000), 'expired']
    ]
    demoReservations.forEach((reservation) => {
      insertReservation.run(
        reservation[0],
        reservation[1],
        reservation[2],
        reservation[3],
        reservation[4].toISOString(),
        reservation[5].toISOString(),
        reservation[6]
      )
    })
  }

  const templateCount = db.prepare('SELECT COUNT(*) as count FROM sms_templates').get().count
  if (templateCount === 0) {
    const insertTemplate = db.prepare(`
      INSERT INTO sms_templates (name, content, type, is_default)
      VALUES (?, ?, ?, ?)
    `)
    
    insertTemplate.run('取件通知', '【丰巢】您的包裹已存入{cabinet}柜，取件码{code}，请及时取件。', 'system', 1)
    insertTemplate.run('滞留提醒', '【丰巢】您的包裹已滞留超过24小时，请尽快到{cabinet}柜取件，取件码{code}。', 'system', 0)
    insertTemplate.run('重发取件码', '【丰巢】您的包裹取件码为{code}，请凭码到{cabinet}柜取件。', 'system', 0)
  }

  const videoCount = db.prepare('SELECT COUNT(*) as count FROM tutorial_videos').get().count
  if (videoCount === 0) {
    const insertVideo = db.prepare(`
      INSERT INTO tutorial_videos (title, description, category, duration)
      VALUES (?, ?, ?, ?)
    `)
    
    insertVideo.run('新手入门：如何使用丰巢存件', '详细讲解快递员如何使用丰巢智能柜进行存件操作', '入门教程', 180)
    insertVideo.run('批量派件技巧', '教你如何高效完成批量派件，提升工作效率', '进阶技巧', 240)
    insertVideo.run('异常件处理流程', '遇到异常件时的正确处理方式', '问题处理', 300)
    insertVideo.run('温控柜使用指南', '生鲜冷链包裹如何使用温控柜', '特殊功能', 200)
  }

  const faqCount = db.prepare('SELECT COUNT(*) as count FROM faq_items').get().count
  if (faqCount === 0) {
    const insertFaq = db.prepare(`
      INSERT INTO faq_items (question, answer, category, tags)
      VALUES (?, ?, ?, ?)
    `)
    
    insertFaq.run('柜机满了怎么办？', '可以使用预约功能锁定格口，或者选择附近其他柜机。系统会推荐最优方案。', '柜机使用', '满柜,预约')
    insertFaq.run('取件码过期了怎么处理？', '可以在包裹详情页点击重发取件码，或者联系客服处理。', '取件问题', '取件码,过期')
    insertFaq.run('如何查看我的绩效积分？', '在"我的-绩效中心"可以查看详细的积分明细和排行榜。', '账户相关', '绩效,积分')
    insertFaq.run('滞留件会额外收费吗？', '超过24小时会产生滞留费，具体费用标准请参考资费说明。', '费用相关', '滞留,收费')
  }
}

initDatabase()

module.exports = db
