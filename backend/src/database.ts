import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const projectRoot = path.join(__dirname, '..', '..');
const dataDir = path.join(projectRoot, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      phone TEXT UNIQUE,
      email TEXT,
      real_name TEXT,
      id_card TEXT,
      is_verified INTEGER DEFAULT 0,
      city_id INTEGER,
      district TEXT,
      street TEXT,
      ip_address TEXT,
      is_admin INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      province TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      population INTEGER,
      area REAL,
      dialect TEXT,
      description TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS districts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS streets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (district_id) REFERENCES districts(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      city_id INTEGER NOT NULL,
      district TEXT,
      street TEXT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      images TEXT,
      is_approved INTEGER DEFAULT 1,
      is_deleted INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      credibility_score REAL DEFAULT 0,
      location_lat REAL,
      location_lng REAL,
      meta_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS post_rental (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      orientation TEXT,
      floor TEXT,
      subway_station TEXT,
      price REAL,
      area REAL,
      rooms INTEGER,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS post_job (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      job_type TEXT,
      salary_min REAL,
      salary_max REAL,
      experience_required TEXT,
      education_required TEXT,
      company_name TEXT,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS post_dating (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      gender TEXT,
      age INTEGER,
      height INTEGER,
      education TEXT,
      occupation TEXT,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS post_secondhand (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      price REAL,
      condition TEXT,
      category TEXT,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      city_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      license_number TEXT,
      is_verified INTEGER DEFAULT 0,
      category TEXT,
      address TEXT,
      phone TEXT,
      rating REAL DEFAULT 5.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      share_chain TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      action TEXT NOT NULL,
      reason TEXT,
      admin_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      merchant_id INTEGER,
      appointment_type TEXT NOT NULL,
      appointment_time DATETIME,
      status TEXT DEFAULT 'pending',
      contact_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sensitive_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT UNIQUE NOT NULL,
      level INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const cityCount = db.prepare('SELECT COUNT(*) as count FROM cities').get() as { count: number };
  if (cityCount.count === 0) {
    const insertCity = db.prepare(`
      INSERT INTO cities (name, province, code, population, dialect, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const cities = [
      { name: '杭州市', province: '浙江省', code: '330100', population: 1237, dialect: '吴语-杭州话', desc: '浙江省省会，互联网之都' },
      { name: '宁波市', province: '浙江省', code: '330200', population: 954, dialect: '吴语-宁波话', desc: '港口城市，制造业基地' },
      { name: '南京市', province: '江苏省', code: '320100', population: 942, dialect: '江淮官话-南京话', desc: '六朝古都，科教名城' },
      { name: '苏州市', province: '江苏省', code: '320500', population: 1291, dialect: '吴语-苏州话', desc: '经济强市，园林之城' },
      { name: '成都市', province: '四川省', code: '510100', population: 2119, dialect: '西南官话-成都话', desc: '天府之国，休闲之都' },
    ];
    
    cities.forEach(city => {
      insertCity.run(city.name, city.province, city.code, city.population, city.dialect, city.desc);
    });

    const insertDistrict = db.prepare('INSERT INTO districts (city_id, name, code) VALUES (?, ?, ?)');
    const districts = [
      { cityId: 1, name: '西湖区', code: '330106' },
      { cityId: 1, name: '滨江区', code: '330108' },
      { cityId: 1, name: '余杭区', code: '330110' },
      { cityId: 5, name: '武侯区', code: '510107' },
      { cityId: 5, name: '锦江区', code: '510104' },
    ];
    districts.forEach(d => insertDistrict.run(d.cityId, d.name, d.code));

    const insertStreet = db.prepare('INSERT INTO streets (district_id, name) VALUES (?, ?)');
    const streets = [
      { districtId: 1, name: '文三路' },
      { districtId: 1, name: '古墩路' },
      { districtId: 2, name: '西兴路' },
      { districtId: 4, name: '科华路' },
    ];
    streets.forEach(s => insertStreet.run(s.districtId, s.name));
  }

  const wordCount = db.prepare('SELECT COUNT(*) as count FROM sensitive_words').get() as { count: number };
  if (wordCount.count === 0) {
    const insertWord = db.prepare('INSERT INTO sensitive_words (word, level) VALUES (?, ?)');
    const words = [
      ['违禁词1', 2],
      ['敏感词2', 1],
      ['广告推销', 1],
    ];
    words.forEach(w => insertWord.run(w[0], w[1]));
  }

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin') as { count: number };
  if (adminCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    db.prepare(`
      INSERT INTO users (username, password, nickname, is_admin, is_verified, city_id, real_name, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, '系统管理员', 1, 1, 1, '管理员', 'admin');
    console.log('Admin account created: admin / 123456');
  }

  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
  } catch (_e) {}

  db.prepare("UPDATE users SET role = 'admin' WHERE is_admin = 1 AND (role IS NULL OR role = 'user')").run();
  db.prepare("UPDATE users SET role = 'merchant' WHERE username = 'merchant' AND (role IS NULL OR role = 'user')").run();

  const reviewerCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'reviewer'").get() as { count: number };
  if (reviewerCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    db.prepare(`
      INSERT INTO users (username, password, nickname, is_admin, is_verified, city_id, real_name, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('reviewer', hashedPassword, '内容审核员', 0, 1, 1, '审核员', 'reviewer');
    console.log('Reviewer account created: reviewer / 123456');
  }

  const merchantUserCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'merchant'").get() as { count: number };
  if (merchantUserCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    db.prepare(`
      INSERT INTO users (username, password, nickname, is_admin, is_verified, city_id, real_name, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('merchant', hashedPassword, '商户代表', 0, 1, 1, '商户', 'merchant');
    console.log('Merchant account created: merchant / 123456');
  }

  console.log('Database initialized successfully');
}

export { db };
