import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'neighborhood.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function getDb(): Database.Database {
  return db;
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS communities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subdomain TEXT NOT NULL UNIQUE,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      real_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_card_hash TEXT,
      access_card_id TEXT,
      unit_building TEXT,
      unit_number TEXT,
      role TEXT NOT NULL DEFAULT 'resident' CHECK(role IN ('resident','property_admin','platform_admin')),
      saml_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (community_id) REFERENCES communities(id)
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      resident_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      geo_lat REAL,
      geo_lng REAL,
      geo_label TEXT,
      category TEXT NOT NULL CHECK(category IN ('discussion','secondhand','activity','complaint')),
      view_count INTEGER NOT NULL DEFAULT 0,
      like_count INTEGER NOT NULL DEFAULT 0,
      comment_count INTEGER NOT NULL DEFAULT 0,
      is_filtered INTEGER NOT NULL DEFAULT 0,
      filter_reason TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (community_id) REFERENCES communities(id),
      FOREIGN KEY (resident_id) REFERENCES residents(id)
    );

    CREATE TABLE IF NOT EXISTS topic_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      resident_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_filtered INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (topic_id) REFERENCES topics(id),
      FOREIGN KEY (resident_id) REFERENCES residents(id)
    );

    CREATE TABLE IF NOT EXISTS skus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL,
      original_price REAL,
      images TEXT NOT NULL DEFAULT '[]',
      category TEXT NOT NULL DEFAULT '',
      lat REAL,
      lng REAL,
      radius_km REAL NOT NULL DEFAULT 5,
      stock_self INTEGER NOT NULL DEFAULT 0,
      stock_property INTEGER NOT NULL DEFAULT 0,
      is_self_operated INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (community_id) REFERENCES communities(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER,
      sku_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','shipped','delivered','confirmed','refunded')),
      escrow_status TEXT NOT NULL DEFAULT 'held' CHECK(escrow_status IN ('held','released','refunded')),
      payment_method TEXT,
      shipping_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      confirmed_at TEXT,
      FOREIGN KEY (community_id) REFERENCES communities(id),
      FOREIGN KEY (buyer_id) REFERENCES residents(id),
      FOREIGN KEY (sku_id) REFERENCES skus(id)
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL UNIQUE,
      balance REAL NOT NULL DEFAULT 0,
      frozen_amount REAL NOT NULL DEFAULT 0,
      total_earned REAL NOT NULL DEFAULT 0,
      total_withdrawn REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (resident_id) REFERENCES residents(id)
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('earning','withdrawal','red_packet','escrow_in','escrow_out','refund')),
      amount REAL NOT NULL,
      ref_type TEXT,
      ref_id INTEGER,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('check_in','invite','review','first_post')),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      reward_amount REAL NOT NULL DEFAULT 0,
      daily_limit INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (community_id) REFERENCES communities(id)
    );

    CREATE TABLE IF NOT EXISTS task_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      resident_id INTEGER NOT NULL,
      reward_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (resident_id) REFERENCES residents(id)
    );

    CREATE TABLE IF NOT EXISTS red_packets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      resident_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','issued','claimed','expired')),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (community_id) REFERENCES communities(id),
      FOREIGN KEY (resident_id) REFERENCES residents(id)
    );

    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      resident_id INTEGER NOT NULL,
      shop_name TEXT NOT NULL,
      shop_type TEXT NOT NULL DEFAULT '',
      commission_rate REAL NOT NULL DEFAULT 0,
      parent_partner_id INTEGER,
      level INTEGER NOT NULL DEFAULT 1,
      total_earnings REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (community_id) REFERENCES communities(id),
      FOREIGN KEY (resident_id) REFERENCES residents(id),
      FOREIGN KEY (parent_partner_id) REFERENCES partners(id)
    );

    CREATE TABLE IF NOT EXISTS partner_settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','settled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      settled_at TEXT,
      FOREIGN KEY (partner_id) REFERENCES partners(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS property_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      resident_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('access_control','payment','repair')),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      external_ref TEXT,
      response_data TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (community_id) REFERENCES communities(id),
      FOREIGN KEY (resident_id) REFERENCES residents(id)
    );

    CREATE TABLE IF NOT EXISTS fraud_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      actor_id INTEGER,
      actor_role TEXT,
      ip_address TEXT,
      user_agent TEXT,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS risk_controls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      rule_type TEXT NOT NULL CHECK(rule_type IN ('daily_withdraw_limit','anti_money_laundering','frequency_limit')),
      rule_value TEXT NOT NULL,
      is_triggered INTEGER NOT NULL DEFAULT 0,
      triggered_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (resident_id) REFERENCES residents(id)
    );
  `);

  seedData();
}

function seedData(): void {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM communities').get() as { cnt: number };
  if (count.cnt > 0) return;

  const insertCommunity = db.prepare(
    `INSERT INTO communities (name, subdomain, address, lat, lng) VALUES (?, ?, ?, ?, ?)`
  );

  const insertResident = db.prepare(
    `INSERT INTO residents (community_id, real_name, phone, access_card_id, unit_building, unit_number, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertTopic = db.prepare(
    `INSERT INTO topics (community_id, resident_id, title, content, category, view_count, like_count, comment_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertSku = db.prepare(
    `INSERT INTO skus (community_id, title, description, price, original_price, category, stock_self, stock_property, is_self_operated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertTask = db.prepare(
    `INSERT INTO tasks (community_id, type, title, description, reward_amount, daily_limit) VALUES (?, ?, ?, ?, ?, ?)`
  );

  const insertWallet = db.prepare(
    `INSERT INTO wallets (resident_id, balance, total_earned) VALUES (?, ?, ?)`
  );

  const insertRiskControl = db.prepare(
    `INSERT INTO risk_controls (resident_id, rule_type, rule_value) VALUES (?, ?, ?)`
  );

  const transaction = db.transaction(() => {
    const c1 = insertCommunity.run('花园小区', 'huayuan', '北京市朝阳区花园路1号', 39.9219, 116.4435);
    const c2 = insertCommunity.run('金山社区', 'jinshan', '上海市金山区金山大道100号', 30.7415, 121.3421);
    const c3 = insertCommunity.run('翠湖花园', 'cuihu', '杭州市西湖区翠湖路88号', 30.2592, 120.1388);

    const admin = insertResident.run(c1.lastInsertRowid as number, '平台管理员', '10000000000', null, null, null, 'platform_admin', 'active');
    const r1 = insertResident.run(c1.lastInsertRowid as number, '张三', '13800000001', 'AC001', '1栋', '101', 'property_admin', 'active');
    const r2 = insertResident.run(c2.lastInsertRowid as number, '李四', '13800000002', 'AC002', '2栋', '201', 'property_admin', 'active');
    const r3 = insertResident.run(c3.lastInsertRowid as number, '王五', '13800000003', 'AC003', '3栋', '301', 'property_admin', 'active');
    const r4 = insertResident.run(c1.lastInsertRowid as number, '赵六', '13800000004', 'AC004', '1栋', '202', 'resident', 'active');
    const r5 = insertResident.run(c1.lastInsertRowid as number, '钱七', '13800000005', 'AC005', '2栋', '103', 'resident', 'active');
    const r6 = insertResident.run(c2.lastInsertRowid as number, '孙八', '13800000006', 'AC006', '1栋', '102', 'resident', 'active');
    const r7 = insertResident.run(c3.lastInsertRowid as number, '周九', '13800000007', 'AC007', '2栋', '203', 'resident', 'active');

    const residentIds = [admin.lastInsertRowid, r1.lastInsertRowid, r2.lastInsertRowid, r3.lastInsertRowid, r4.lastInsertRowid, r5.lastInsertRowid, r6.lastInsertRowid, r7.lastInsertRowid];

    insertTopic.run(c1.lastInsertRowid, residentIds[4], '社区花园改造建议', '建议对社区花园进行绿化改造，增加儿童游乐设施。', 'discussion', 56, 12, 5);
    insertTopic.run(c1.lastInsertRowid, residentIds[4], '二手儿童自行车转让', '孩子长大了，九成新儿童自行车低价转让。', 'secondhand', 34, 3, 2);
    insertTopic.run(c1.lastInsertRowid, residentIds[5], '周末社区篮球赛', '本周六下午3点社区篮球场举行友谊赛，欢迎参加！', 'activity', 89, 25, 8);
    insertTopic.run(c1.lastInsertRowid, residentIds[1], '电梯维修投诉', '1栋2号电梯已故障一周，物业迟迟未修。', 'complaint', 120, 45, 15);
    insertTopic.run(c2.lastInsertRowid, residentIds[6], '金山区周末集市', '本周六金山区市民广场有创意集市活动。', 'activity', 67, 18, 6);
    insertTopic.run(c2.lastInsertRowid, residentIds[6], '社区停车难问题', '最近社区停车位越来越紧张，建议增加停车位。', 'complaint', 95, 30, 10);
    insertTopic.run(c3.lastInsertRowid, residentIds[7], '翠湖晨跑团招募', '每天早上6点半翠湖边晨跑，欢迎加入！', 'activity', 45, 15, 4);
    insertTopic.run(c3.lastInsertRowid, residentIds[7], '二手书交换', '家里藏书太多，想和大家交换阅读。', 'secondhand', 23, 5, 3);

    insertSku.run(c1.lastInsertRowid, '有机蔬菜礼盒', '本地农场直供有机蔬菜，新鲜配送', 128, 168, '食品', 50, 20, 1);
    insertSku.run(c1.lastInsertRowid, '家政保洁服务', '专业家政保洁，2小时深度清洁', 99, 149, '服务', 100, 0, 1);
    insertSku.run(c2.lastInsertRowid, '金山特产海鲜礼包', '金山渔港直供新鲜海鲜', 258, 328, '食品', 30, 15, 1);
    insertSku.run(c3.lastInsertRowid, '西湖龙井礼盒', '正宗西湖龙井明前茶', 368, 488, '食品', 20, 10, 1);
    insertSku.run(c3.lastInsertRowid, '家居维修工具套装', '家用多功能维修工具箱', 159, 219, '家居', 40, 0, 0);

    insertTask.run(c1.lastInsertRowid, 'check_in', '每日签到', '每天签到领取红包奖励', 0.5, 1);
    insertTask.run(c1.lastInsertRowid, 'invite', '邀请新邻居', '邀请邻居注册社区平台', 5.0, 10);
    insertTask.run(c1.lastInsertRowid, 'review', '发表评价', '对已购商品发表真实评价', 1.0, 3);
    insertTask.run(c1.lastInsertRowid, 'first_post', '首次发帖', '在社区论坛首次发帖', 2.0, 1);
    insertTask.run(c2.lastInsertRowid, 'check_in', '每日签到', '每天签到领取红包奖励', 0.5, 1);
    insertTask.run(c2.lastInsertRowid, 'invite', '邀请新邻居', '邀请邻居注册社区平台', 5.0, 10);
    insertTask.run(c3.lastInsertRowid, 'check_in', '每日签到', '每天签到领取红包奖励', 0.5, 1);
    insertTask.run(c3.lastInsertRowid, 'first_post', '首次发帖', '在社区论坛首次发帖', 2.0, 1);

    for (const rid of residentIds) {
      insertWallet.run(rid, 100.0, 100.0);
    }

    insertRiskControl.run(residentIds[4], 'daily_withdraw_limit', '5000');
    insertRiskControl.run(residentIds[4], 'anti_money_laundering', '10000');
    insertRiskControl.run(residentIds[5], 'frequency_limit', '10');
  });

  transaction();
}
