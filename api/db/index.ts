import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SALT_ROUNDS = 10;

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(50),
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'customer',
      city VARCHAR(50),
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name VARCHAR(100) NOT NULL,
      city VARCHAR(50) NOT NULL,
      district VARCHAR(50) NOT NULL,
      address VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'available',
      price DECIMAL(15,2) NOT NULL,
      area FLOAT NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms INTEGER NOT NULL,
      floor VARCHAR(20),
      orientation VARCHAR(20),
      decoration VARCHAR(50),
      discount DECIMAL(5,2) DEFAULT 100,
      promotion TEXT,
      vr_showroom_url TEXT,
      vr_sales_office_url TEXT,
      vr_panorama_url TEXT,
      vr_street_view_url TEXT,
      erp_source VARCHAR(50) DEFAULT '万科ERP',
      erp_sync_status VARCHAR(20) DEFAULT 'synced',
      erp_last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      erp_sync_count INTEGER DEFAULT 0,
      supply_batch VARCHAR(50),
      city_strategy TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS price_change_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      old_price DECIMAL(15,2) NOT NULL,
      new_price DECIMAL(15,2) NOT NULL,
      change_reason VARCHAR(255),
      changed_by INTEGER,
      erp_source VARCHAR(50) DEFAULT '万科ERP',
      discount_rate DECIMAL(5,2) DEFAULT 100,
      promotion_condition TEXT,
      effective_date DATE,
      expiry_date DATE,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      review_status VARCHAR(20) DEFAULT 'approved',
      review_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (changed_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS price_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      unit_no VARCHAR(20) NOT NULL,
      original_price DECIMAL(15,2) NOT NULL,
      current_price DECIMAL(15,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'available',
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no VARCHAR(50) UNIQUE NOT NULL,
      property_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      advisor_id INTEGER,
      status VARCHAR(30) NOT NULL DEFAULT 'eligibility_pending',
      amount DECIMAL(15,2) NOT NULL,
      ca_verified BOOLEAN DEFAULT 0,
      blockchain_hash VARCHAR(255),
      eligibility_status VARCHAR(20) DEFAULT 'pending',
      eligibility_feedback TEXT,
      eligibility_verified_at DATETIME,
      lock_status VARCHAR(20) DEFAULT 'pending',
      lock_expires_at DATETIME,
      lock_amount DECIMAL(15,2),
      subscribe_status VARCHAR(20) DEFAULT 'pending',
      subscribe_verified_at DATETIME,
      subscribe_certificate_no VARCHAR(50),
      sign_status VARCHAR(20) DEFAULT 'pending',
      sign_verified_at DATETIME,
      sign_contract_no VARCHAR(50),
      sign_blockchain_hash VARCHAR(255),
      supervise_status VARCHAR(20) DEFAULT 'pending',
      supervise_bank VARCHAR(100),
      supervise_account_no VARCHAR(50),
      supervise_amount DECIMAL(15,2),
      supervise_verified_at DATETIME,
      loan_status VARCHAR(20) DEFAULT 'pending',
      loan_bank VARCHAR(100),
      loan_amount DECIMAL(15,2),
      loan_approved_at DATETIME,
      loan_feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (advisor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id VARCHAR(50) PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      advisor_id INTEGER NOT NULL,
      property_id INTEGER,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (advisor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id VARCHAR(50) NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(20) DEFAULT 'text',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_read BOOLEAN DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS sop_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category VARCHAR(50) NOT NULL,
      title VARCHAR(100) NOT NULL,
      content TEXT NOT NULL,
      scenario VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      risk_level VARCHAR(20),
      ai_analysis TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      handler_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS commission_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city VARCHAR(50) NOT NULL,
      base_rate DECIMAL(5,4) NOT NULL,
      bonus_rate DECIMAL(5,4) DEFAULT 0,
      conditions TEXT
    );

    CREATE TABLE IF NOT EXISTS blockchain_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      hash VARCHAR(255) NOT NULL,
      block_number VARCHAR(50),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS eligibility_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      city_policy TEXT,
      id_number VARCHAR(50),
      hukou_status VARCHAR(50),
      house_count INTEGER DEFAULT 0,
      passed BOOLEAN,
      result TEXT,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER,
      type VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      discount_value DECIMAL(15,2) NOT NULL,
      start_time DATETIME,
      end_time DATETIME,
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS follow_up_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      advisor_id INTEGER NOT NULL,
      property_id INTEGER,
      type VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (advisor_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS customer_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tag VARCHAR(50) NOT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      advisor_id INTEGER,
      type VARCHAR(20) NOT NULL,
      title VARCHAR(100) NOT NULL,
      content TEXT,
      remind_at DATETIME NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (advisor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS city_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city VARCHAR(50) NOT NULL,
      district VARCHAR(50),
      strategy TEXT NOT NULL,
      target_price_min DECIMAL(15,2),
      target_price_max DECIMAL(15,2),
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  `);
};

const insertSeedData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const hashPassword = (pwd: string) => bcrypt.hashSync(pwd, SALT_ROUNDS);

  const insertUser = db.prepare(`
    INSERT INTO users (phone, name, password_hash, role, city, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'admin',
    '系统管理员',
    hashPassword('admin123'),
    'admin',
    '北京',
    JSON.stringify(['系统', '管理'])
  );

  insertUser.run(
    '13800138000',
    '李明',
    hashPassword('123456'),
    'customer',
    '上海',
    JSON.stringify(['刚需', '首次购房'])
  );

  const advisor1Id = insertUser.run(
    '13800138001',
    '张顾问',
    hashPassword('123456'),
    'advisor',
    '北京',
    JSON.stringify(['金牌顾问', '北京区域', '高端房源'])
  ).lastInsertRowid as number;

  const advisor2Id = insertUser.run(
    '13800138002',
    '李顾问',
    hashPassword('123456'),
    'advisor',
    '上海',
    JSON.stringify(['资深顾问', '上海区域', '学区房'])
  ).lastInsertRowid as number;

  const insertProperty = db.prepare(`
    INSERT INTO properties (
      project_name, city, district, address, status, price, area,
      bedrooms, bathrooms, floor, orientation, decoration, discount,
      promotion, vr_showroom_url, vr_sales_office_url, vr_panorama_url, vr_street_view_url,
      erp_source, erp_sync_status, erp_last_sync_at, erp_sync_count,
      supply_batch, city_strategy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const erpSources = ['万科ERP', '恒大销控系统', '碧桂园营销云', '融创EPR', '保利销控平台'];

  const properties = [
    {
      project_name: '北京星河湾',
      city: '北京',
      district: '朝阳区',
      address: '北京市朝阳区朝阳北路101号',
      status: 'available' as const,
      price: 8500000,
      area: 120.5,
      bedrooms: 3,
      bathrooms: 2,
      floor: '15/28层',
      orientation: '南北通透',
      decoration: '精装修',
      discount: 95,
      promotion: '限时优惠5万',
      vr_showroom_url: '/vr/showroom/1',
      vr_sales_office_url: '/vr/office/1',
      vr_panorama_url: '/vr/panorama/1',
      vr_street_view_url: '/vr/street/1',
      erp_source: erpSources[0],
      erp_sync_status: 'synced',
      erp_last_sync_at: '2026-06-07 10:30:00',
      erp_sync_count: 156,
      supply_batch: '2026年第2批',
      city_strategy: '朝阳区高端改善型房源，面向改善型需求客户，定价策略为区域均价上浮5%'
    },
    {
      project_name: '上海汤臣一品',
      city: '上海',
      district: '浦东新区',
      address: '上海市浦东新区滨江大道1号',
      status: 'available' as const,
      price: 25000000,
      area: 280,
      bedrooms: 4,
      bathrooms: 3,
      floor: '32/45层',
      orientation: '江景',
      decoration: '豪华装修',
      discount: 98,
      promotion: '送车位',
      vr_showroom_url: '/vr/showroom/2',
      vr_sales_office_url: '/vr/office/2',
      vr_panorama_url: '/vr/panorama/2',
      vr_street_view_url: '/vr/street/2',
      erp_source: erpSources[1],
      erp_sync_status: 'synced',
      erp_last_sync_at: '2026-06-07 10:28:00',
      erp_sync_count: 203,
      supply_batch: '一期A批次',
      city_strategy: '浦东区金融精英策略，面向金融从业者和高净值人群，定价策略为江景资源溢价20%'
    },
    {
      project_name: '深圳华润城',
      city: '深圳',
      district: '南山区',
      address: '深圳市南山区科技园路88号',
      status: 'locked' as const,
      price: 12000000,
      area: 145,
      bedrooms: 3,
      bathrooms: 2,
      floor: '22/35层',
      orientation: '朝南',
      decoration: '精装修',
      discount: 100,
      promotion: '',
      vr_showroom_url: '/vr/showroom/3',
      vr_sales_office_url: '/vr/office/3',
      vr_panorama_url: '/vr/panorama/3',
      vr_street_view_url: '/vr/street/3',
      erp_source: erpSources[2],
      erp_sync_status: 'synced',
      erp_last_sync_at: '2026-06-07 10:25:00',
      erp_sync_count: 89,
      supply_batch: '2026年第1批',
      city_strategy: '南山区科技创新策略，面向科创企业员工，定价策略匹配科技人才购买力'
    },
    {
      project_name: '广州保利天汇',
      city: '广州',
      district: '天河区',
      address: '广州市天河区珠江新城兴盛路66号',
      status: 'sold' as const,
      price: 9800000,
      area: 110,
      bedrooms: 3,
      bathrooms: 2,
      floor: '18/30层',
      orientation: '南北通透',
      decoration: '精装修',
      discount: 92,
      promotion: '老带新优惠',
      vr_showroom_url: '/vr/showroom/4',
      vr_sales_office_url: '/vr/office/4',
      vr_panorama_url: '/vr/panorama/4',
      vr_street_view_url: '/vr/street/4',
      erp_source: erpSources[4],
      erp_sync_status: 'synced',
      erp_last_sync_at: '2026-06-07 10:20:00',
      erp_sync_count: 278,
      supply_batch: '二期B批次',
      city_strategy: '天河区商务核心策略，面向企业高管和商务人士，定价策略为CBD核心区均价'
    },
    {
      project_name: '杭州绿城云栖',
      city: '杭州',
      district: '西湖区',
      address: '杭州市西湖区文一西路999号',
      status: 'offline' as const,
      price: 7500000,
      area: 135,
      bedrooms: 4,
      bathrooms: 2,
      floor: '8/18层',
      orientation: '朝南',
      decoration: '毛坯',
      discount: 100,
      promotion: '',
      vr_showroom_url: '/vr/showroom/5',
      vr_sales_office_url: '/vr/office/5',
      vr_panorama_url: '/vr/panorama/5',
      vr_street_view_url: '/vr/street/5',
      erp_source: erpSources[3],
      erp_sync_status: 'pending',
      erp_last_sync_at: '2026-06-06 18:00:00',
      erp_sync_count: 45,
      supply_batch: '2026年第3批',
      city_strategy: '西湖区文旅宜居策略，面向文旅爱好者和宜居需求客户，定价策略为景区周边溢价10%'
    }
  ];

  const propertyIds: number[] = [];
  for (const p of properties) {
    const result = insertProperty.run(
      p.project_name, p.city, p.district, p.address, p.status, p.price, p.area,
      p.bedrooms, p.bathrooms, p.floor, p.orientation, p.decoration, p.discount,
      p.promotion, p.vr_showroom_url, p.vr_sales_office_url, p.vr_panorama_url, p.vr_street_view_url,
      p.erp_source, p.erp_sync_status, p.erp_last_sync_at, p.erp_sync_count,
      p.supply_batch, p.city_strategy
    );
    propertyIds.push(result.lastInsertRowid as number);
  }

  const insertPriceChangeLog = db.prepare(`
    INSERT INTO price_change_logs (
      property_id, old_price, new_price, change_reason, changed_by,
      erp_source, discount_rate, promotion_condition,
      effective_date, expiry_date,
      reviewed_by, reviewed_at, review_status, review_comment
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const priceErpSources = ['万科ERP', '恒大销控系统', '碧桂园营销云', '融创ERP', '保利销控平台'];
  const priceChangeReasons = ['市场调价', '促销活动', '政策调整', '客户特殊申请', '楼层朝向差异'];
  const promotionConditions = [
    '7天内签约享受折扣',
    '全款支付额外98折',
    '老带新双方各减1年物业费',
    '限时优惠，过期不候',
    '团购5人以上再享99折'
  ];
  const reviewComments = [
    '价格调整合理，符合市场行情',
    '促销活动审批通过，有效期7天',
    '客户特殊申请，情况属实',
    '楼层朝向差异调价，正常流程',
    '政策调整，按规定执行'
  ];
  const today = new Date();
  for (let i = 0; i < propertyIds.length; i++) {
    const pid = propertyIds[i];
    const basePrice = properties[i].price;
    const erpSource = priceErpSources[i % priceErpSources.length];
    for (let j = 0; j < 3; j++) {
      const oldPrice = basePrice + (j - 1) * 100000;
      const newPrice = basePrice + j * 100000;
      if (oldPrice !== newPrice) {
        const changeDate = new Date(today.getTime() - (2 - j) * 86400000);
        const reviewDate = new Date(changeDate.getTime() + 3600000);
        const effectiveDate = new Date(changeDate.getTime() + 86400000);
        const expiryDate = new Date(effectiveDate.getTime() + 30 * 86400000);
        const discountRate = newPrice < oldPrice ? 95 + Math.random() * 4 : 100;
        insertPriceChangeLog.run(
          pid,
          oldPrice,
          newPrice,
          priceChangeReasons[Math.floor(Math.random() * priceChangeReasons.length)],
          1,
          erpSource,
          discountRate.toFixed(2),
          promotionConditions[Math.floor(Math.random() * promotionConditions.length)],
          effectiveDate.toISOString().split('T')[0],
          expiryDate.toISOString().split('T')[0],
          2,
          reviewDate.toISOString(),
          'approved',
          reviewComments[Math.floor(Math.random() * reviewComments.length)]
        );
      }
    }
  }

  const insertPriceSchedule = db.prepare(`
    INSERT INTO price_schedule (property_id, unit_no, original_price, current_price, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const pid of propertyIds) {
    for (let i = 1; i <= 5; i++) {
      const basePrice = 5000000 + i * 500000;
      insertPriceSchedule.run(
        pid,
        `${i}0${i}`,
        basePrice,
        basePrice * 0.95,
        i === 3 ? 'sold' : 'available'
      );
    }
  }

  const insertCityStrategy = db.prepare(`
    INSERT INTO city_strategies (city, district, strategy, target_price_min, target_price_max, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const cityStrategies = [
    { city: '北京', district: '朝阳区', strategy: '高端改善型房源，面向改善型需求客户，定价策略为区域均价上浮5%', target_price_min: 70000, target_price_max: 150000, priority: 1 },
    { city: '上海', district: '浦东新区', strategy: '金融精英策略，面向金融从业者和高净值人群，定价策略为江景资源溢价20%', target_price_min: 80000, target_price_max: 200000, priority: 1 },
    { city: '深圳', district: '南山区', strategy: '科技创新策略，面向科创企业员工，定价策略匹配科技人才购买力', target_price_min: 60000, target_price_max: 180000, priority: 1 },
    { city: '杭州', district: '西湖区', strategy: '文旅宜居策略，面向文旅爱好者和宜居需求客户，定价策略为景区周边溢价10%', target_price_min: 40000, target_price_max: 100000, priority: 2 },
    { city: '广州', district: '天河区', strategy: '商务核心策略，面向企业高管和商务人士，定价策略为CBD核心区均价', target_price_min: 50000, target_price_max: 120000, priority: 2 },
  ];

  for (const cs of cityStrategies) {
    insertCityStrategy.run(cs.city, cs.district, cs.strategy, cs.target_price_min, cs.target_price_max, cs.priority);
  }

  const insertSop = db.prepare(`
    INSERT INTO sop_templates (category, title, content, scenario)
    VALUES (?, ?, ?, ?)
  `);

  const sops = [
    { category: '房源介绍', title: '项目概况介绍', content: '您好，这个项目位于城市核心区域，交通便利，配套完善。项目总占地面积约10万平米，建筑面积约30万平米，由品牌开发商倾力打造。', scenario: '初次接触' },
    { category: '房源介绍', title: '户型亮点说明', content: '这套房源是我们的主力户型，格局方正，南北通透，采光极佳。主卧套房设计，私密性好；客餐厅一体化，空间感十足；U型厨房，操作流畅。', scenario: '户型讲解' },
    { category: '价格谈判', title: '优惠政策说明', content: '目前我们正在做限时促销活动，现在认购可以享受95折优惠，同时赠送价值10万的精装修大礼包。如果是全款支付，还可以再享受额外2个点的优惠。', scenario: '价格咨询' },
    { category: '购买流程', title: '认购流程指引', content: '购房流程是这样的：首先进行购房资格核验，通过后支付定金签订认购书，然后在7天内支付首付并签订正式购房合同，接着办理银行贷款，最后等待交房。', scenario: '流程咨询' },
    { category: '售后服务', title: '交房及办证说明', content: '我们会在合同约定的时间按时交房，交房时会有专业人员陪同验房。房产证会在交房后365个工作日内办理完成，我们会有专人跟进通知您。', scenario: '售后咨询' }
  ];

  for (const sop of sops) {
    insertSop.run(sop.category, sop.title, sop.content, sop.scenario);
  }

  const insertCommission = db.prepare(`
    INSERT INTO commission_rules (city, base_rate, bonus_rate, conditions)
    VALUES (?, ?, ?, ?)
  `);

  const commissions = [
    { city: '北京', base_rate: 0.025, bonus_rate: 0.005, conditions: '月销超5套额外奖励0.5%' },
    { city: '上海', base_rate: 0.03, bonus_rate: 0.005, conditions: '月销超5套额外奖励0.5%' },
    { city: '深圳', base_rate: 0.028, bonus_rate: 0.003, conditions: '月销超8套额外奖励0.3%' },
    { city: '广州', base_rate: 0.022, bonus_rate: 0.004, conditions: '月销超6套额外奖励0.4%' },
    { city: '杭州', base_rate: 0.02, bonus_rate: 0.005, conditions: '月销超4套额外奖励0.5%' }
  ];

  for (const c of commissions) {
    insertCommission.run(c.city, c.base_rate, c.bonus_rate, c.conditions);
  }

  const insertTicket = db.prepare(`
    INSERT INTO tickets (property_id, type, risk_level, ai_analysis, status, handler_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tickets = [
    { property_id: propertyIds[0], type: '价格异常', risk_level: 'low', ai_analysis: '该房源价格略低于同区域均价10%，建议核实', status: 'pending', handler_id: advisor1Id },
    { property_id: propertyIds[1], type: '客户投诉', risk_level: 'high', ai_analysis: '客户反映销售承诺与实际不符，需紧急处理', status: 'processing', handler_id: advisor1Id },
    { property_id: propertyIds[2], type: '合同审核', risk_level: 'medium', ai_analysis: '合同条款存在模糊表述，建议法务审核', status: 'pending', handler_id: advisor2Id }
  ];

  for (const t of tickets) {
    insertTicket.run(t.property_id, t.type, t.risk_level, t.ai_analysis, t.status, t.handler_id);
  }

  const insertFollowUpRecord = db.prepare(`
    INSERT INTO follow_up_records (user_id, advisor_id, property_id, type, content, result, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const followUpRecords = [
    { user_id: 2, advisor_id: 3, property_id: propertyIds[0], type: 'call', content: '客户咨询房源价格和优惠政策，对3室户型比较感兴趣', result: '已发送详细资料，客户表示周末来看房', created_at: '2026-06-05 14:30:00' },
    { user_id: 2, advisor_id: 3, property_id: propertyIds[0], type: 'visit', content: '客户到访售楼处，实地查看样板间和小区环境', result: '客户对户型和地段满意，已锁定意向房源', created_at: '2026-06-03 10:15:00' },
    { user_id: 2, advisor_id: 3, property_id: propertyIds[1], type: 'im', content: '客户通过IM咨询上海汤臣一品的房源信息和周边配套', result: '已回复客户咨询，预约下周末实地看房', created_at: '2026-06-01 16:00:00' },
  ];

  for (const fur of followUpRecords) {
    insertFollowUpRecord.run(fur.user_id, fur.advisor_id, fur.property_id, fur.type, fur.content, fur.result, fur.created_at);
  }

  const insertCustomerTag = db.prepare(`
    INSERT INTO customer_tags (user_id, tag, created_by, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const customerTags = [
    { user_id: 2, tag: '刚需首套', created_by: 3, created_at: '2026-06-01 10:00:00' },
    { user_id: 2, tag: '预算600-800万', created_by: 3, created_at: '2026-06-01 10:00:00' },
    { user_id: 2, tag: '学区优先', created_by: 3, created_at: '2026-06-02 14:30:00' },
    { user_id: 2, tag: '地铁房', created_by: 3, created_at: '2026-06-02 14:30:00' },
    { user_id: 2, tag: '2026年Q3购买', created_by: 3, created_at: '2026-06-03 09:00:00' },
  ];

  for (const ct of customerTags) {
    insertCustomerTag.run(ct.user_id, ct.tag, ct.created_by, ct.created_at);
  }

  const insertReminder = db.prepare(`
    INSERT INTO reminders (user_id, advisor_id, type, title, content, remind_at, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const reminders = [
    { user_id: 2, advisor_id: 3, type: 'property_launch', title: '房源开售提醒', content: '您关注的北京星河湾项目2026年第2批房源即将于6月15日正式开售，建议提前准备购房材料', remind_at: '2026-06-14 09:00:00', status: 'pending', created_at: '2026-06-07 10:00:00' },
    { user_id: 2, advisor_id: 3, type: 'eligibility_expiry', title: '限购核验到期提醒', content: '您的购房资格核验有效期将于2026年6月20日到期，请及时办理后续手续', remind_at: '2026-06-18 09:00:00', status: 'pending', created_at: '2026-06-07 10:00:00' },
    { user_id: 2, advisor_id: 3, type: 'loan_preparation', title: '贷款材料准备提醒', content: '为了顺利办理贷款，请准备以下材料：身份证、户口本、收入证明、银行流水、购房合同', remind_at: '2026-06-10 09:00:00', status: 'pending', created_at: '2026-06-07 10:00:00' },
  ];

  for (const r of reminders) {
    insertReminder.run(r.user_id, r.advisor_id, r.type, r.title, r.content, r.remind_at, r.status, r.created_at);
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_no, property_id, user_id, advisor_id, status, amount,
      eligibility_status, eligibility_feedback, eligibility_verified_at,
      lock_status, lock_expires_at, lock_amount,
      subscribe_status, subscribe_verified_at, subscribe_certificate_no,
      sign_status, sign_verified_at, sign_contract_no, sign_blockchain_hash,
      supervise_status, supervise_bank, supervise_account_no, supervise_amount, supervise_verified_at,
      loan_status, loan_bank, loan_amount, loan_approved_at, loan_feedback,
      ca_verified, blockchain_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const orderNo = `ORD${Date.now()}001`;
  insertOrder.run(
    orderNo,
    propertyIds[2],
    2,
    advisor1Id,
    'subscribed',
    12000000,
    'pass',
    '购房资格核验通过，符合限购政策要求',
    new Date(now.getTime() - 86400000 * 5).toISOString(),
    'completed',
    new Date(now.getTime() + 86400000 * 2).toISOString(),
    500000,
    'completed',
    new Date(now.getTime() - 86400000 * 3).toISOString(),
    `SUB${Date.now()}001`,
    'pending',
    null,
    null,
    null,
    'pending',
    '中国建设银行深圳分行',
    '44201001234567890123',
    12000000,
    null,
    'pending',
    '中国工商银行深圳分行',
    8400000,
    null,
    null,
    1,
    `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`
  );
};

const insertBusinessBackfillData = () => {
  const customer = db.prepare("SELECT id FROM users WHERE role = 'customer' ORDER BY id LIMIT 1").get() as { id: number } | undefined;
  const advisor = db.prepare("SELECT id FROM users WHERE role IN ('advisor', 'admin') ORDER BY CASE role WHEN 'advisor' THEN 0 ELSE 1 END, id LIMIT 1").get() as { id: number } | undefined;
  const properties = db.prepare('SELECT id, city, district, project_name, price FROM properties ORDER BY id LIMIT 3').all() as Array<{
    id: number;
    city: string;
    district: string;
    project_name: string;
    price: number;
  }>;

  if (properties.length > 0) {
    const strategyCount = db.prepare('SELECT COUNT(*) as count FROM city_strategies').get() as { count: number };
    if (strategyCount.count === 0) {
      const insertCityStrategy = db.prepare(`
        INSERT INTO city_strategies (city, district, strategy, target_price_min, target_price_max, priority)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      properties.forEach((property, index) => {
        const unitPrice = Math.round(Number(property.price || 0) / 100);
        insertCityStrategy.run(
          property.city,
          property.district,
          `${property.district}开发商供货策略：按${property.project_name}当前销控批次安排推盘，优先承接已完成限购核验和顾问跟进的客户。`,
          Math.max(30000, unitPrice * 0.8),
          Math.max(50000, unitPrice * 1.2),
          index + 1
        );
      });
    }
  }

  if (!customer || !advisor || properties.length === 0) return;

  const followUpCount = db.prepare('SELECT COUNT(*) as count FROM follow_up_records').get() as { count: number };
  if (followUpCount.count === 0) {
    const insertFollowUpRecord = db.prepare(`
      INSERT INTO follow_up_records (user_id, advisor_id, property_id, type, content, result, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    [
      ['im', `客户咨询${properties[0].project_name}供货批次和优惠条件`, '已同步ERP销控批次，预约顾问继续跟进', '2026-06-05 14:30:00'],
      ['call', '电话回访客户购房资格与贷款预算', '已完成限购核验预审，标记为重点跟进', '2026-06-03 10:15:00'],
      ['visit', `客户到访查看${properties[1]?.project_name || properties[0].project_name}`, '已登记开盘提醒和认购材料清单', '2026-06-01 16:00:00'],
    ].forEach(([type, content, result, createdAt], index) => {
      insertFollowUpRecord.run(customer.id, advisor.id, properties[index % properties.length].id, type, content, result, createdAt);
    });
  }

  const tagCount = db.prepare('SELECT COUNT(*) as count FROM customer_tags').get() as { count: number };
  if (tagCount.count === 0) {
    const insertCustomerTag = db.prepare(`
      INSERT INTO customer_tags (user_id, tag, created_by, created_at)
      VALUES (?, ?, ?, ?)
    `);
    ['刚需首套', '预算600-800万', '学区优先', '需要贷款', '2026年Q3购买'].forEach((tag, index) => {
      insertCustomerTag.run(customer.id, tag, advisor.id, `2026-06-0${Math.min(index + 1, 7)} 10:00:00`);
    });
  }

  const reminderCount = db.prepare('SELECT COUNT(*) as count FROM reminders').get() as { count: number };
  if (reminderCount.count === 0) {
    const insertReminder = db.prepare(`
      INSERT INTO reminders (user_id, advisor_id, type, title, content, remind_at, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    [
      ['property_launch', '房源开售提醒', `${properties[0].project_name}即将开售，建议提前准备购房材料`, '2026-06-14 09:00:00'],
      ['eligibility_expiry', '限购核验到期提醒', '购房资格核验有效期即将到期，请及时办理后续手续', '2026-06-18 09:00:00'],
      ['loan_preparation', '贷款材料准备提醒', '请准备身份证、户口本、收入证明、银行流水和购房合同', '2026-06-10 09:00:00'],
    ].forEach(([type, title, content, remindAt]) => {
      insertReminder.run(customer.id, advisor.id, type, title, content, remindAt, 'pending', '2026-06-07 10:00:00');
    });
  }
};

export const initDb = () => {
  createTables();
  insertSeedData();
  insertBusinessBackfillData();
  console.log('Database initialized successfully');
};

export default db;
