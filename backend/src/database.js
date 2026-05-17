const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/app.db';
const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const initDatabase = async () => {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nickname TEXT,
        avatar TEXT,
        phone TEXT UNIQUE,
        email TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        avatar TEXT,
        department TEXT NOT NULL,
        hospital_id INTEGER,
        hospital_address TEXT,
        consultation_count INTEGER DEFAULT 0,
        reply_rate REAL DEFAULT 0,
        specialties TEXT,
        introduction TEXT,
        price_image REAL DEFAULT 0,
        price_phone REAL DEFAULT 0,
        price_video REAL DEFAULT 0,
        rating REAL DEFAULT 5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        latitude REAL,
        longitude REAL,
        business_hours TEXT,
        description TEXT,
        images TEXT,
        rating REAL DEFAULT 5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        photo TEXT,
        age INTEGER,
        gender TEXT,
        species TEXT NOT NULL,
        breed TEXT,
        sterilized BOOLEAN DEFAULT 0,
        registration_number TEXT UNIQUE,
        weight REAL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS health_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        images TEXT,
        tags TEXT,
        record_date DATETIME NOT NULL,
        type TEXT DEFAULT 'normal',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        question TEXT,
        answer TEXT,
        images TEXT,
        rating INTEGER,
        review TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (doctor_id) REFERENCES doctors(id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        images TEXT,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        views_count INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        parent_id INTEGER,
        likes_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES community_posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (parent_id) REFERENCES comments(id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        comment_id INTEGER,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES community_posts(id),
        FOREIGN KEY (comment_id) REFERENCES comments(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS symptoms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        possible_diseases TEXT,
        advice TEXT,
        species TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS consultation_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consultation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        sender_type TEXT NOT NULL,
        content TEXT NOT NULL,
        images TEXT,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consultation_id) REFERENCES consultations(id)
      )
    `);

    const userCount = await get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('123456', 10);
      
      await run(
        'INSERT INTO users (username, password, nickname, phone, role) VALUES (?, ?, ?, ?, ?)',
        ['admin', hashedPassword, '管理员', '13800138000', 'admin']
      );
      await run(
        'INSERT INTO users (username, password, nickname, phone, role) VALUES (?, ?, ?, ?, ?)',
        ['user1', hashedPassword, '养宠达人', '13800138001', 'user']
      );
    }

    const deptCount = await get('SELECT COUNT(*) as count FROM departments');
    if (deptCount.count === 0) {
      const depts = [
        ['内科', '🏥', '宠物内科疾病诊治'],
        ['外科', '🔪', '宠物外科手术治疗'],
        ['皮肤科', '🧴', '宠物皮肤疾病治疗'],
        ['眼科', '👁️', '宠物眼部疾病治疗'],
        ['牙科', '🦷', '宠物口腔健康护理'],
        ['骨科', '🦴', '宠物骨骼关节疾病'],
        ['产科', '🐾', '宠物生育繁殖服务'],
        ['中医科', '🌿', '中兽医特色治疗'],
      ];
      for (const dept of depts) {
        await run(
          'INSERT INTO departments (name, icon, description) VALUES (?, ?, ?)',
          dept
        );
      }
    }

    const hospitalCount = await get('SELECT COUNT(*) as count FROM hospitals');
    if (hospitalCount.count === 0) {
      const hospitals = [
        ['爱心宠物医院', '北京市朝阳区建国路88号', '010-12345678', '09:00-21:00', '专业宠物医疗服务机构，拥有20年临床经验的医疗团队', 4.8],
        ['康美宠物诊疗中心', '北京市海淀区中关村大街1号', '010-87654321', '24小时营业', '24小时急诊服务，配备先进医疗设备', 4.9],
        ['阳光宠物诊所', '北京市西城区西单北大街100号', '010-11112222', '08:30-20:30', '社区连锁宠物诊所，性价比高', 4.6],
      ];
      for (const h of hospitals) {
        await run(
          'INSERT INTO hospitals (name, address, phone, business_hours, description, rating) VALUES (?, ?, ?, ?, ?, ?)',
          h
        );
      }
    }

    const doctorCount = await get('SELECT COUNT(*) as count FROM doctors');
    if (doctorCount.count === 0) {
      const doctors = [
        ['张医生', '内科', 1, '北京市朝阳区建国路88号', 1256, 98.5, '犬猫内科疾病、消化系统疾病、呼吸系统疾病', '从事宠物临床工作15年，擅长犬猫内科疾病的诊断与治疗', 29.9, 49.9, 99.9],
        ['李医生', '外科', 1, '北京市朝阳区建国路88号', 892, 96.2, '软组织外科、骨科手术、创伤急救', '外科专家，完成各类手术3000余例', 39.9, 59.9, 119.9],
        ['王医生', '皮肤科', 2, '北京市海淀区中关村大街1号', 756, 99.1, '皮肤病、过敏性疾病、寄生虫感染', '皮肤病专科医生，对疑难皮肤病有丰富经验', 29.9, 49.9, 89.9],
        ['赵医生', '牙科', 2, '北京市海淀区中关村大街1号', 523, 97.8, '口腔清洁、牙齿矫正、牙周病治疗', '牙科专家，专注宠物口腔健康', 24.9, 39.9, 69.9],
        ['刘医生', '产科', 3, '北京市西城区西单北大街100号', 389, 95.5, '孕期保健、接生服务、绝育手术', '温柔细致，深受宠物主人信赖', 34.9, 54.9, 99.9],
      ];
      for (const d of doctors) {
        await run(
          'INSERT INTO doctors (name, department, hospital_id, hospital_address, consultation_count, reply_rate, specialties, introduction, price_image, price_phone, price_video) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          d
        );
      }
    }

    const symptomCount = await get('SELECT COUNT(*) as count FROM symptoms');
    if (symptomCount.count === 0) {
      const symptoms = [
        ['呕吐', '宠物频繁呕吐，可能伴有食欲不振', '胃肠炎、食物中毒、寄生虫感染、消化系统疾病', '暂时禁食，观察情况，如持续请及时就医', '犬猫通用'],
        ['腹泻', '排便次数增多，粪便稀软', '消化不良、肠道感染、寄生虫、换粮应激', '补充水分，禁食观察，严重时就医', '犬猫通用'],
        ['发烧', '体温升高，精神萎靡', '感染、炎症、免疫性疾病', '物理降温，及时就医确诊病因', '犬猫通用'],
        ['咳嗽', '频繁咳嗽，呼吸异常', '感冒、支气管炎、肺炎、心脏病', '保持环境温暖，避免刺激，及时就医', '犬猫通用'],
        ['皮肤瘙痒', '频繁抓挠，皮肤红肿脱毛', '寄生虫感染、过敏、真菌性皮炎', '检查体表，佩戴伊丽莎白圈，及时就医', '犬猫通用'],
      ];
      for (const s of symptoms) {
        await run(
          'INSERT INTO symptoms (name, description, possible_diseases, advice, species) VALUES (?, ?, ?, ?, ?)',
          s
        );
      }
    }

    const postCount = await get('SELECT COUNT(*) as count FROM community_posts');
    if (postCount.count === 0) {
      const posts = [
        [2, '专家讲座', '如何正确给狗狗刷牙？专家详解口腔护理', '狗狗的口腔健康非常重要，今天给大家分享正确的刷牙方法...', 256, 45, 1892],
        [2, '萌宠知识', '猫咪为什么喜欢踩奶？', '踩奶是猫咪从小养成的习惯，代表它们感到安全和舒适...', 512, 89, 3456],
        [2, '新手养宠', '新手指南：幼犬到家第一周注意事项', '幼犬到家的第一周是关键的适应期，需要注意以下几点...', 389, 67, 2678],
        [2, '交流分享', '我家金毛的成长日记', '分享我家金毛从两个月到一岁的成长历程...', 123, 34, 987],
        [2, '健康饮食', '狗粮怎么选？看这篇就够了', '选择狗粮需要考虑成分、营养配比、适口性等多个因素...', 445, 78, 3123],
      ];
      for (const p of posts) {
        await run(
          'INSERT INTO community_posts (user_id, category, title, content, likes_count, comments_count, views_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
          p
        );
      }
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

module.exports = { db, run, get, all, initDatabase };
