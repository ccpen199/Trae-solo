const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

function initDB() {
  const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      balance REAL NOT NULL DEFAULT 0,
      avatar TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      animation TEXT,
      price REAL NOT NULL DEFAULT 0,
      rarity TEXT NOT NULL DEFAULT 'normal',
      scene TEXT,
      status TEXT NOT NULL DEFAULT 'offline',
      stock INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      online_time TEXT,
      offline_time TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gift_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      gift_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      receiver_id INTEGER,
      scene TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      fail_reason TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (gift_id) REFERENCES gifts(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS balance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      order_id INTEGER,
      remark TEXT,
      balance_after REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      start_time TEXT,
      end_time TEXT,
      discount REAL,
      config TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      gift_id INTEGER NOT NULL,
      discount_price REAL,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS risk_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      user_id INTEGER,
      order_id INTEGER,
      amount REAL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      handler_id INTEGER,
      handle_remark TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      handled_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES gift_orders(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS frozen_income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      order_id INTEGER,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'frozen',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES gift_orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON gift_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_gift ON gift_orders(gift_id);
    CREATE INDEX IF NOT EXISTS idx_orders_receiver ON gift_orders(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON gift_orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON gift_orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_gifts_status ON gifts(status);
    CREATE INDEX IF NOT EXISTS idx_gifts_rarity ON gifts(rarity);
    CREATE INDEX IF NOT EXISTS idx_risk_type ON risk_records(type);
    CREATE INDEX IF NOT EXISTS idx_risk_status ON risk_records(status);
  `);

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
  if (adminCount.count === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, password, nickname, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', hash, '系统管理员', 'admin');

    db.prepare(`
      INSERT INTO users (username, password, nickname, role, balance)
      VALUES (?, ?, ?, ?, ?)
    `).run('testuser', hash, '测试用户', 'user', 10000);

    db.prepare(`
      INSERT INTO users (username, password, nickname, role, balance)
      VALUES (?, ?, ?, ?, ?)
    `).run('anchor1', hash, '主播小明', 'anchor', 0);
  }

  const giftCount = db.prepare('SELECT COUNT(*) as count FROM gifts').get();
  if (giftCount.count === 0) {
    const gifts = [
      { name: '小心心', icon: '❤️', animation: 'heart', price: 1, rarity: 'normal', scene: '直播,社区', status: 'online', stock: 99999, sort_order: 1 },
      { name: '棒棒糖', icon: '🍭', animation: 'lollipop', price: 5, rarity: 'normal', scene: '直播,社区', status: 'online', stock: 99999, sort_order: 2 },
      { name: '玫瑰花', icon: '🌹', animation: 'rose', price: 10, rarity: 'normal', scene: '直播,社区', status: 'online', stock: 99999, sort_order: 3 },
      { name: '皇冠', icon: '👑', animation: 'crown', price: 100, rarity: 'rare', scene: '直播', status: 'online', stock: 9999, sort_order: 4 },
      { name: '火箭', icon: '🚀', animation: 'rocket', price: 500, rarity: 'epic', scene: '直播', status: 'online', stock: 999, sort_order: 5 },
      { name: '城堡', icon: '🏰', animation: 'castle', price: 1000, rarity: 'legendary', scene: '直播', status: 'online', stock: 99, sort_order: 6 },
    ];

    const stmt = db.prepare(`
      INSERT INTO gifts (name, icon, animation, price, rarity, scene, status, stock, sort_order, online_time)
      VALUES (@name, @icon, @animation, @price, @rarity, @scene, @status, @stock, @sort_order, CURRENT_TIMESTAMP)
    `);

    for (const gift of gifts) {
      stmt.run(gift);
    }
  }

  const activityCount = db.prepare('SELECT COUNT(*) as count FROM activities').get();
  if (activityCount.count === 0) {
    const activities = [
      { 
        name: '新用户首充折扣', 
        type: 'discount', 
        description: '新用户首次充值享受8折优惠',
        start_time: '2026-05-01 00:00:00',
        end_time: '2026-06-30 23:59:59',
        discount: 20,
        status: 'published'
      },
      { 
        name: '520情人节主题', 
        type: 'festival', 
        description: '情人节专属礼物，浪漫升级',
        start_time: '2026-05-20 00:00:00',
        end_time: '2026-05-22 23:59:59',
        discount: 10,
        status: 'published'
      },
      { 
        name: '周末主播排行榜', 
        type: 'ranking', 
        description: '周末礼物值双倍加成，冲榜必备',
        start_time: '2026-05-24 00:00:00',
        end_time: '2026-05-26 23:59:59',
        discount: null,
        status: 'published'
      },
      { 
        name: '豪华套餐组合', 
        type: 'combo', 
        description: '组合购买更划算，火箭+城堡套餐',
        start_time: '2026-05-15 00:00:00',
        end_time: '2026-06-15 23:59:59',
        discount: 15,
        status: 'draft'
      }
    ];

    const activityStmt = db.prepare(`
      INSERT INTO activities (name, type, description, start_time, end_time, discount, status)
      VALUES (@name, @type, @description, @start_time, @end_time, @discount, @status)
    `);

    for (const activity of activities) {
      activityStmt.run(activity);
    }

    const giftIds = [1, 2, 3, 4, 5, 6];
    for (let activityId = 1; activityId <= 4; activityId++) {
      const numGifts = activityId === 4 ? 2 : 3;
      for (let i = 0; i < numGifts; i++) {
        const giftId = giftIds[i];
        const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(giftId);
        const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId);
        const discountPrice = activity.discount ? gift.price * (1 - activity.discount / 100) : gift.price;
        db.prepare(`
          INSERT INTO activity_gifts (activity_id, gift_id, discount_price)
          VALUES (?, ?, ?)
        `).run(activityId, giftId, discountPrice);
      }
    }
  }

  const orderCount = db.prepare('SELECT COUNT(*) as count FROM gift_orders').get();
  if (orderCount.count === 0) {
    const orders = [
      {
        order_no: 'ORD202605250001',
        user_id: 2,
        gift_id: 1,
        receiver_id: 3,
        quantity: 10,
        unit_price: 1,
        total_amount: 10,
        scene: '直播',
        message: '主播加油！',
        activity_id: 1,
        status: 'success',
        fail_reason: null,
        created_at: '2026-05-25 19:30:00'
      },
      {
        order_no: 'ORD202605250002',
        user_id: 2,
        gift_id: 3,
        receiver_id: 3,
        quantity: 5,
        unit_price: 10,
        total_amount: 50,
        scene: '直播',
        message: '送你玫瑰花',
        activity_id: 2,
        status: 'success',
        fail_reason: null,
        created_at: '2026-05-25 19:35:00'
      },
      {
        order_no: 'ORD202605250003',
        user_id: 2,
        gift_id: 4,
        receiver_id: 3,
        quantity: 2,
        unit_price: 100,
        total_amount: 200,
        scene: '直播',
        message: '皇冠给你',
        activity_id: 3,
        status: 'success',
        fail_reason: null,
        created_at: '2026-05-25 20:00:00'
      },
      {
        order_no: 'ORD202605250004',
        user_id: 2,
        gift_id: 2,
        receiver_id: 3,
        quantity: 3,
        unit_price: 5,
        total_amount: 15,
        scene: '社区',
        message: '棒棒哒',
        activity_id: null,
        status: 'success',
        fail_reason: null,
        created_at: '2026-05-25 20:10:00'
      },
      {
        order_no: 'ORD202605250005',
        user_id: 2,
        gift_id: 5,
        receiver_id: 3,
        quantity: 1,
        unit_price: 500,
        total_amount: 500,
        scene: '直播',
        message: '火箭起飞！',
        activity_id: 3,
        status: 'success',
        fail_reason: null,
        created_at: '2026-05-25 21:00:00'
      },
      {
        order_no: 'ORD202605260001',
        user_id: 2,
        gift_id: 6,
        receiver_id: 3,
        quantity: 1,
        unit_price: 1000,
        total_amount: 1000,
        scene: '直播',
        message: '城堡送给你',
        activity_id: 2,
        status: 'success',
        fail_reason: null,
        created_at: '2026-05-26 14:00:00'
      },
      {
        order_no: 'ORD202605260002',
        user_id: 2,
        gift_id: 4,
        receiver_id: 3,
        quantity: 5,
        unit_price: 100,
        total_amount: 500,
        scene: '直播',
        message: '再来几个皇冠',
        activity_id: null,
        status: 'success',
        fail_reason: null,
        created_at: '2026-05-26 15:30:00'
      },
      {
        order_no: 'ORD202605260003',
        user_id: 2,
        gift_id: 2,
        receiver_id: 3,
        quantity: 10,
        unit_price: 5,
        total_amount: 50,
        scene: '社区',
        message: '支持一下',
        activity_id: null,
        status: 'success',
        fail_reason: null,
        created_at: '2026-05-26 16:00:00'
      },
      {
        order_no: 'ORD202605260004',
        user_id: 2,
        gift_id: 3,
        receiver_id: 3,
        quantity: 20,
        unit_price: 10,
        total_amount: 200,
        scene: '直播',
        message: '520快乐！',
        activity_id: 2,
        status: 'success',
        fail_reason: null,
        created_at: '2026-05-26 18:00:00'
      },
      {
        order_no: 'ORD202605260005',
        user_id: 2,
        gift_id: 6,
        receiver_id: 3,
        quantity: 20,
        unit_price: 1000,
        total_amount: 20000,
        scene: '直播',
        message: '包场了',
        activity_id: null,
        status: 'failed',
        fail_reason: '余额不足，当前余额: 1000.00，需要: 20000.00',
        created_at: '2026-05-26 19:00:00'
      }
    ];

    const orderStmt = db.prepare(`
      INSERT INTO gift_orders (order_no, user_id, gift_id, receiver_id, quantity, unit_price, total_amount, scene, message, activity_id, status, fail_reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const order of orders) {
      orderStmt.run(
        order.order_no, order.user_id, order.gift_id, order.receiver_id,
        order.quantity, order.unit_price, order.total_amount,
        order.scene, order.message, order.activity_id,
        order.status, order.fail_reason, order.created_at
      );
    }

    db.prepare("UPDATE users SET balance = 1000 WHERE id = 2");
    db.prepare("UPDATE users SET balance = 1500 WHERE id = 3");
  }

  const riskCount = db.prepare('SELECT COUNT(*) as count FROM risk_records').get();
  if (riskCount.count === 0) {
    const riskRecords = [
      {
        type: 'abnormal_recharge',
        user_id: 2,
        amount: 50000,
        reason: '短时间内大额充值，疑似异常充值行为',
        status: 'pending'
      },
      {
        type: 'malicious_ranking',
        user_id: 2,
        order_id: null,
        amount: null,
        reason: '同一IP多个账号给同一主播刷礼物，疑似恶意刷榜',
        status: 'pending'
      },
      {
        type: 'refund_dispute',
        user_id: 2,
        order_id: null,
        amount: 1000,
        reason: '用户申请退款，称账号被盗用',
        status: 'handled',
        handler_id: 1,
        handle_remark: '已核实情况，同意退款，金额已返还',
        handled_at: '2026-05-20 14:30:00'
      },
      {
        type: 'minor_consumption',
        user_id: 2,
        order_id: null,
        amount: 2999,
        reason: '疑似未成年人消费，家长申诉',
        status: 'pending'
      }
    ];

    const riskStmt = db.prepare(`
      INSERT INTO risk_records (type, user_id, order_id, amount, reason, status, handler_id, handle_remark, handled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const record of riskRecords) {
      riskStmt.run(record.type, record.user_id, record.order_id, record.amount, record.reason, record.status, record.handler_id, record.handle_remark, record.handled_at);
    }

    db.prepare(`
      INSERT INTO frozen_income (user_id, amount, order_id, reason, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(3, 1500, null, '风控冻结-恶意刷榜', 'frozen');
  }

  return db;
}

module.exports = initDB;
