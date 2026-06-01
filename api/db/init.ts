import db from './connection.js';
import bcrypt from 'bcryptjs';

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'operator',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      theme VARCHAR(100) NOT NULL DEFAULT 'default',
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft',
      participation_rules TEXT NOT NULL,
      lottery_rules TEXT NOT NULL,
      page_config TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prizes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      type VARCHAR(20) NOT NULL,
      value DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_stock INTEGER NOT NULL DEFAULT 0,
      used_stock INTEGER NOT NULL DEFAULT 0,
      image_url VARCHAR(500),
      expire_time DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prize_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      prize_id INTEGER NOT NULL,
      probability DECIMAL(5,4) NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (prize_id) REFERENCES prizes(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      phone VARCHAR(20),
      nickname VARCHAR(100),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS participations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      channel VARCHAR(50) NOT NULL DEFAULT 'direct',
      device_id VARCHAR(100),
      ip VARCHAR(45),
      qualified BOOLEAN NOT NULL DEFAULT 1,
      disqualify_reason VARCHAR(500),
      draw_count INTEGER NOT NULL DEFAULT 0,
      tasks_completed TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS lottery_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participation_id INTEGER NOT NULL,
      activity_id INTEGER NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      prize_id INTEGER,
      is_win BOOLEAN NOT NULL DEFAULT 0,
      draw_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      risk_status VARCHAR(20) NOT NULL DEFAULT 'normal',
      FOREIGN KEY (participation_id) REFERENCES participations(id),
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (prize_id) REFERENCES prizes(id)
    );

    CREATE TABLE IF NOT EXISTS winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lottery_record_id INTEGER NOT NULL,
      activity_id INTEGER NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      prize_id INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      shipping_info TEXT,
      distribute_time DATETIME,
      redeem_time DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lottery_record_id) REFERENCES lottery_records(id),
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (prize_id) REFERENCES prizes(id)
    );

    CREATE TABLE IF NOT EXISTS risk_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type VARCHAR(30) NOT NULL,
      level VARCHAR(10) NOT NULL DEFAULT 'medium',
      lottery_record_id INTEGER,
      user_id VARCHAR(64),
      evidence TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      processed_by INTEGER,
      processed_at DATETIME,
      process_note TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lottery_record_id) REFERENCES lottery_records(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (processed_by) REFERENCES admins(id)
    );

    CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
    CREATE INDEX IF NOT EXISTS idx_participations_activity_user ON participations(activity_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_lottery_records_activity ON lottery_records(activity_id);
    CREATE INDEX IF NOT EXISTS idx_lottery_records_user ON lottery_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_winners_status ON winners(status);
    CREATE INDEX IF NOT EXISTS idx_winners_user ON winners(user_id);
    CREATE INDEX IF NOT EXISTS idx_risk_items_status ON risk_items(status);
  `);

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
  if (adminCount.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('admin123', salt);
    
    const insertAdmin = db.prepare(`
      INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)
    `);
    
    insertAdmin.run('admin', passwordHash, 'admin');
    insertAdmin.run('operator', passwordHash, 'operator');
    insertAdmin.run('risk', passwordHash, 'risk');
    insertAdmin.run('finance', passwordHash, 'finance');
    console.log('Created default admin accounts');
  }

  const prizeCount = db.prepare('SELECT COUNT(*) as count FROM prizes').get() as { count: number };
  if (prizeCount.count === 0) {
    const insertPrize = db.prepare(`
      INSERT INTO prizes (name, type, value, total_stock, used_stock) VALUES (?, ?, ?, ?, ?)
    `);
    
    insertPrize.run('iPhone 15 Pro', 'physical', 7999.00, 10, 0);
    insertPrize.run('100元优惠券', 'coupon', 100.00, 1000, 0);
    insertPrize.run('1000积分', 'points', 10.00, 5000, 0);
    insertPrize.run('VIP会员月卡', 'virtual', 30.00, 500, 0);
    insertPrize.run('谢谢参与', 'virtual', 0.00, 99999, 0);
    console.log('Created default prizes');
  }

  console.log('Database initialized successfully');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  initDb();
}

export default initDb;
