const db = require('./database');

module.exports = function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      phone TEXT,
      identity_type TEXT DEFAULT 'student',
      identity_verified INTEGER DEFAULT 0,
      student_id TEXT,
      employee_id TEXT,
      popularity INTEGER DEFAULT 0,
      good_karma INTEGER DEFAULT 0,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      building TEXT,
      manager TEXT,
      contact TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lost_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      images TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      station_id INTEGER,
      verify_question TEXT,
      verify_answer TEXT,
      locker_location TEXT,
      status TEXT DEFAULT 'pending',
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (station_id) REFERENCES service_stations(id)
    );

    CREATE TABLE IF NOT EXISTS secondhand_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      price REAL,
      images TEXT,
      category TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'active',
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS errands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      location TEXT,
      reward REAL,
      restrictions TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'pending',
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT NOT NULL,
      images TEXT,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      is_announcement INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER,
      to_user_id INTEGER,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const stationCount = db.prepare('SELECT COUNT(*) as count FROM service_stations').get().count;
  if (stationCount === 0) {
    const stations = [
      { name: '一教服务站', location: '第一教学楼大厅', building: '一教', manager: '张保安', contact: '13800138001' },
      { name: '二教服务站', location: '第二教学楼入口处', building: '二教', manager: '李保安', contact: '13800138002' },
      { name: '食堂服务站', location: '第一食堂一楼', building: '食堂', manager: '王同学', contact: '13800138003' },
      { name: '图书馆服务站', location: '图书馆二楼大厅', building: '图书馆', manager: '赵保安', contact: '13800138004' }
    ];
    
    const insertStation = db.prepare('INSERT INTO service_stations (name, location, building, manager, contact) VALUES (?, ?, ?, ?, ?)');
    stations.forEach(s => insertStation.run(s.name, s.location, s.building, s.manager, s.contact));
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('123456', 10);
    db.prepare('INSERT INTO users (username, password, nickname, phone, identity_type, identity_verified) VALUES (?, ?, ?, ?, ?, ?)')
      .run('demo', hash, '演示用户', '13800000000', 'student', 1);
  }

  const lostItemCount = db.prepare('SELECT COUNT(*) as count FROM lost_items').get().count;
  if (lostItemCount === 0) {
    const insertLostItem = db.prepare('INSERT INTO lost_items (user_id, title, description, category, contact_name, station_id, verify_question, verify_answer, locker_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertLostItem.run(1, '黑色钱包', '黑色皮质钱包，内有身份证和少量现金', '证件', '张同学', 1, '钱包里有什么卡？', '身份证', 'A01 储物柜');
    insertLostItem.run(1, '苹果耳机 AirPods Pro', '白色充电盒，外壳有轻微划痕', '数码产品', '李同学', 2, '耳机颜色是？', '白色', 'B03 储物柜');
    insertLostItem.run(1, '蓝色保温杯', '象印品牌，蓝色，500ml容量', '生活用品', '王同学', 3, '品牌是什么？', '象印', 'C02 储物柜');
    insertLostItem.run(1, '高等数学教材', '同济大学第七版，有笔记', '书籍', '赵同学', 4, '书的作者是？', '同济大学', 'D01 储物柜');
  }

  const secondhandCount = db.prepare('SELECT COUNT(*) as count FROM secondhand_items').get().count;
  if (secondhandCount === 0) {
    const insertSecondhand = db.prepare('INSERT INTO secondhand_items (user_id, title, description, price, category, contact_name) VALUES (?, ?, ?, ?, ?, ?)');
    insertSecondhand.run(1, 'iPad Air 4', '深空灰色，64GB，成色95新，配件齐全', 3500, '数码', '陈同学');
    insertSecondhand.run(1, '考研英语资料', '全新未拆封，包含真题、词汇、作文', 80, '书籍', '周同学');
    insertSecondhand.run(1, '山地自行车', '捷安特品牌，9成新，适合校园代步', 800, '交通', '吴同学');
    insertSecondhand.run(1, '机械键盘', '青轴，RGB背光，使用3个月', 150, '数码', '郑同学');
  }

  const errandCount = db.prepare('SELECT COUNT(*) as count FROM errands').get().count;
  if (errandCount === 0) {
    const insertErrand = db.prepare('INSERT INTO errands (user_id, title, description, tags, location, reward, contact_name) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertErrand.run(1, '食堂代取餐', '帮忙从一食堂三楼取外卖送到宿舍', JSON.stringify(['取餐', '跑腿']), '一食堂', 5, '孙同学');
    insertErrand.run(1, '图书馆取快递', '菜鸟驿站取快递送到图书馆', JSON.stringify(['快递', '取件']), '图书馆', 3, '钱同学');
    insertErrand.run(1, '打印资料', '帮忙打印50页PPT，双面黑白', JSON.stringify(['打印', '资料']), '打印店', 8, '冯同学');
  }

  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
  if (postCount === 0) {
    const insertPost = db.prepare('INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)');
    insertPost.run(1, '考研经验分享：数学一140+备考心得', '大家好！我是今年考上的学长，今天分享一下数学一的备考经验。首先是基础阶段...', '经验分享');
    insertPost.run(1, '校园美食推荐：食堂三楼新开窗口测评', '最近食堂三楼新开了几个窗口，我试了一下黄焖鸡米饭，味道很不错！鸡肉很嫩，汤汁浓郁...', '生活分享');
    insertPost.run(1, '图书馆自习攻略：最佳位置和时间段', '作为一个经常泡图书馆的人，给大家分享一些找位置的技巧...', '攻略');
  }
};
