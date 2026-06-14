const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'app.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS farmers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      id_card TEXT,
      phone TEXT,
      village TEXT,
      land_area REAL,
      land_cert_no TEXT,
      ocr_status TEXT DEFAULT 'pending',
      planting_tags TEXT DEFAULT '[]',
      breeding_tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS finance_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      params TEXT DEFAULT '{}',
      rate TEXT,
      term TEXT,
      max_amount TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS finance_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      amount TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      review_note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (farmer_id) REFERENCES farmers(id),
      FOREIGN KEY (product_id) REFERENCES finance_products(id)
    );

    CREATE TABLE IF NOT EXISTS village_blockchain (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '{}',
      tx_hash TEXT,
      block_height INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS village_affairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT DEFAULT 'draft',
      publisher TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      options TEXT DEFAULT '[]',
      start_time TEXT,
      end_time TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vote_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vote_id INTEGER NOT NULL,
      voter_name TEXT,
      voter_phone TEXT,
      option_index INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (vote_id) REFERENCES votes(id)
    );

    CREATE TABLE IF NOT EXISTS discussions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      author TEXT,
      type TEXT DEFAULT 'discussion',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS discussion_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discussion_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      author TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (discussion_id) REFERENCES discussions(id)
    );

    CREATE TABLE IF NOT EXISTS policy_qa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'town_admin',
      town TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sms_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT,
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      town TEXT NOT NULL,
      menu_config TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL,
      amount TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      order_no TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (farmer_id) REFERENCES farmers(id)
    );
  `);

  seedData();
}

function ensureAdminUser() {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    `INSERT INTO admin_users (username, password_hash, role, town)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(username) DO UPDATE SET
       password_hash = excluded.password_hash,
       role = excluded.role,
       town = excluded.town`
  ).run('admin', hash, 'super_admin', '青山镇');
}

function seedData() {
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  ensureAdminUser();
  if (adminCount.count > 0) return;

  const insertFarmer = db.prepare(
    `INSERT INTO farmers (name, id_card, phone, village, land_area, land_cert_no, ocr_status, planting_tags, breeding_tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const farmers = [
    ['张三', '360121199001011234', '13800138001', '青山村', 5.2, 'LC20240001', 'completed', JSON.stringify(['水稻', '小麦']), JSON.stringify(['鸡', '鸭'])],
    ['李四', '360121199202022345', '13800138002', '绿水村', 3.8, 'LC20240002', 'completed', JSON.stringify(['玉米', '大豆']), JSON.stringify(['猪'])],
    ['王五', '360121199303033456', '13800138003', '白云村', 8.1, 'LC20240003', 'pending', JSON.stringify(['水稻', '油菜']), JSON.stringify(['牛', '羊'])],
    ['赵六', '360121199404044567', '13800138004', '青山村', 2.5, 'LC20240004', 'pending', JSON.stringify(['蔬菜', '果树']), JSON.stringify([])],
    ['孙七', '360121199505055678', '13800138005', '绿水村', 6.3, 'LC20240005', 'completed', JSON.stringify(['茶叶', '药材']), JSON.stringify(['蜜蜂'])],
    ['周八', '360121199606066789', '13800138006', '白云村', 4.0, 'LC20240006', 'pending', JSON.stringify(['水稻']), JSON.stringify(['鱼'])],
    ['吴九', '360121199707077890', '13800138007', '红桥村', 7.2, 'LC20240007', 'pending', JSON.stringify(['小麦', '棉花']), JSON.stringify(['鸡'])],
    ['郑十', '360121199808088901', '13800138008', '红桥村', 1.8, 'LC20240008', 'completed', JSON.stringify(['蔬菜']), JSON.stringify(['猪', '鸡'])],
  ];

  const farmerIds = [];
  for (const f of farmers) {
    const result = insertFarmer.run(...f);
    farmerIds.push(result.lastInsertRowid);
  }

  const insertProduct = db.prepare(
    `INSERT INTO finance_products (name, type, params, rate, term, max_amount, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const products = [
    ['惠农信用贷', 'credit_loan', JSON.stringify({ min_credit: 600 }), '3.85%', '12个月', '500000', 'active'],
    ['农机购置贷', 'machinery_loan', JSON.stringify({ machinery_type: '收割机' }), '4.20%', '24个月', '300000', 'active'],
    ['农业种植险', 'insurance', JSON.stringify({ coverage: '自然灾害' }), '1.50%', '12个月', '200000', 'active'],
    ['畜牧养殖贷', 'credit_loan', JSON.stringify({ min_livestock: 50 }), '4.00%', '18个月', '400000', 'active'],
    ['水稻种植险', 'insurance', JSON.stringify({ coverage: '洪水+干旱' }), '2.10%', '6个月', '150000', 'active'],
    ['新农村建设贷', 'machinery_loan', JSON.stringify({ purpose: '房屋改造' }), '3.65%', '36个月', '600000', 'active'],
  ];

  const productIds = [];
  for (const p of products) {
    const result = insertProduct.run(...p);
    productIds.push(result.lastInsertRowid);
  }

  const insertApp = db.prepare(
    `INSERT INTO finance_applications (farmer_id, product_id, amount, status, review_note)
     VALUES (?, ?, ?, ?, ?)`
  );

  insertApp.run(farmerIds[0], productIds[0], '200000', 'approved', '信用良好，审批通过');
  insertApp.run(farmerIds[1], productIds[1], '150000', 'pending', null);
  insertApp.run(farmerIds[2], productIds[2], '100000', 'disbursed', '已放款');
  insertApp.run(farmerIds[3], productIds[0], '80000', 'rejected', '信用评分不足');

  const insertAffair = db.prepare(
    `INSERT INTO village_affairs (type, title, content, status, publisher)
     VALUES (?, ?, ?, ?, ?)`
  );

  const affairs = [
    ['three_assets', '2024年第三季度集体资产公示', '本村集体资产总额为580万元，其中固定资产320万元，流动资产260万元。详细清单已张贴于村务公开栏。', 'published', '村委会'],
    ['welfare', '2024年低保户补助名单公示', '经村民代表大会审议，以下15户家庭纳入2024年度低保补助：张某某、李某某等。公示期7天，如有异议请向村委会反映。', 'published', '村委会'],
    ['project_bid', '村道硬化工程招标公告', '本项目为青山村至绿水村道路硬化工程，全长3.2公里，预算85万元。投标截止日期为2024年12月15日。', 'published', '镇政府'],
    ['three_assets', '集体鱼塘承包经营权转让公告', '经村委会研究决定，将村集体鱼塘（面积15亩）承包经营权公开转让，承包期限5年，起拍价3万元/年。', 'published', '村委会'],
    ['welfare', '高龄老人生活补贴发放通知', '2024年度高龄老人生活补贴已到位，80-89岁每月100元，90岁以上每月200元，请符合条件的老人携带身份证到村委会登记。', 'published', '村委会'],
    ['project_bid', '饮水安全改造工程招标', '本项目涉及全村自来水管网改造，预算120万元，要求施工单位具备市政公用工程施工总承包三级及以上资质。', 'draft', '镇政府'],
  ];

  for (const a of affairs) {
    insertAffair.run(...a);
  }

  const insertBlockchain = db.prepare(
    `INSERT INTO village_blockchain (type, title, content, tx_hash, block_height)
     VALUES (?, ?, ?, ?, ?)`
  );

  const blockchainData = [
    ['three_assets', '集体资产公示上链', JSON.stringify({ affair_id: 1, hash: 'abc123' }), '0x7a3f8b2c1d9e4f6a5b8c3d7e2f1a9b4c6d8e5f3a7b2c1d9e4f6a8b3c5d7e2f1a', 100001],
    ['welfare', '低保户补助公示上链', JSON.stringify({ affair_id: 2, hash: 'def456' }), '0x9b4c6d8e5f3a7b2c1d9e4f6a8b3c5d7e2f1a4c6d8e5f3a7b2c1d9e4f6a5b8c3d7', 100002],
    ['project_bid', '村道工程招标上链', JSON.stringify({ affair_id: 3, hash: 'ghi789' }), '0x2f1a9b4c6d8e5f3a7b2c1d9e4f6a8b3c5d7e1a3f8b2c1d9e4f6a5b8c3d7e2f9b', 100003],
  ];

  for (const b of blockchainData) {
    insertBlockchain.run(...b);
  }

  const insertVote = db.prepare(
    `INSERT INTO votes (title, description, options, start_time, end_time, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const now = new Date().toISOString();
  const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  insertVote.run(
    '是否同意新建村级文化活动中心',
    '根据村民需求调查，拟在村中心位置新建文化活动中心，面积约200平方米，预算约60万元。请各位村民投票表决。',
    JSON.stringify(['同意', '不同意', '弃权']),
    now, endTime, 'active'
  );
  insertVote.run(
    '村道绿化方案选择',
    '拟对村主干道两侧进行绿化，现提供两种方案供村民选择。',
    JSON.stringify(['方案一：种植桂花树', '方案二：种植银杏树']),
    now, endTime, 'active'
  );

  const insertDiscussion = db.prepare(
    `INSERT INTO discussions (title, content, author, type) VALUES (?, ?, ?, ?)`
  );

  insertDiscussion.run('关于改善村容村貌的建议', '建议在全村范围内开展人居环境整治行动，重点解决垃圾分类和污水处理问题。', '张三', 'discussion');
  insertDiscussion.run('2024年粮食补贴政策通知', '根据上级文件精神，2024年粮食直补标准为每亩120元，请符合条件的农户及时到村委会登记确认。', '村委会', 'notice');
  insertDiscussion.run('今日助农直播：本地土特产专场', '今天下午2点，将在本平台进行助农直播，推介我村土特产，欢迎收看！', '镇政府', 'livestream');

  const insertQA = db.prepare(
    `INSERT INTO policy_qa (question, answer, category) VALUES (?, ?, ?)`
  );

  const qas = [
    ['粮食补贴怎么申请？', '粮食补贴由村委会统一登记造册，农户需携带身份证、土地承包合同到村委会登记。一般在每年6月前完成登记，补贴款在8-9月直接打入农户一卡通账户。', '补贴政策'],
    ['农村宅基地能否买卖？', '根据法律规定，农村宅基地不能向本集体经济组织以外的人出售。本村村民之间的宅基地流转需经村委会同意并报乡镇政府备案。', '土地政策'],
    ['如何申请低保？', '申请低保需满足以下条件：1.具有本地户籍；2.家庭人均收入低于当地低保标准；3.家庭财产符合规定。申请流程：向村委会提出申请→民主评议→乡镇审核→县级审批→公示。', '社保政策'],
    ['农机购置补贴政策是什么？', '购买列入国家补贴目录的农机具，可享受购机价格30%以内的补贴，单机补贴额最高不超过5万元。购机后携带购机发票、身份证到当地农机管理部门申请。', '补贴政策'],
    ['农村合作医疗报销比例是多少？', '乡镇卫生院住院报销比例约80%，县级医院约65%，市级医院约55%。门诊统筹在村卫生室报销约60%。具体比例以当地政策为准。', '医疗政策'],
    ['返乡创业有哪些优惠政策？', '返乡创业可享受：1.创业担保贷款最高20万元；2.创业培训补贴；3.税收优惠；4.场地租金减免。具体政策咨询当地人社局或乡镇政府。', '创业政策'],
    ['农业保险如何参保？', '农业保险由政府补贴保费80%，农户自付20%。参保方式：在村委会统一登记或通过保险公司代办。主要险种包括水稻、玉米、小麦等种植险和能繁母猪、育肥猪等养殖险。', '保险政策'],
    ['农村危房改造怎么申请？', '农村危房改造补助对象为建档立卡贫困户、低保户、农村分散供养特困人员、贫困残疾人家庭。申请流程：农户申请→村委会评议→乡镇审核→县级审批。补助标准根据改造方式不同，一般为1-3万元。', '住房政策'],
  ];

  for (const q of qas) {
    insertQA.run(...q);
  }

  const insertMenu = db.prepare(
    `INSERT INTO service_menus (town, menu_config) VALUES (?, ?)`
  );

  insertMenu.run('青山镇', JSON.stringify({
    categories: [
      { name: '政务服务', items: ['社保查询', '医保缴费', '户籍办理'] },
      { name: '便民服务', items: ['水电缴费', '快递代收', '家政服务'] },
      { name: '农业服务', items: ['农技咨询', '农机租赁', '农资购买'] }
    ]
  }));

  const insertPayment = db.prepare(
    `INSERT INTO payments (farmer_id, amount, channel, status, order_no) VALUES (?, ?, ?, ?, ?)`
  );

  insertPayment.run(farmerIds[0], '5000', 'unionpay', 'completed', 'PAY20240001');
  insertPayment.run(farmerIds[1], '3200', 'abc', 'completed', 'PAY20240002');
  insertPayment.run(farmerIds[2], '8000', 'unionpay', 'pending', 'PAY20240003');
}

module.exports = { db, init };
