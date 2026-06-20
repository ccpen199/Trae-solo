import db from './index';

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT,
      phone TEXT,
      email TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      real_name TEXT NOT NULL,
      id_card TEXT NOT NULL,
      license_no TEXT NOT NULL,
      agency TEXT NOT NULL,
      phone TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      verified_at DATETIME,
      rating REAL DEFAULT 5.0,
      deal_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS developers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      credit_level TEXT DEFAULT 'A',
      license_no TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      price_unit TEXT DEFAULT 'wan',
      area REAL NOT NULL,
      floor TEXT,
      total_floor INTEGER,
      orientation TEXT,
      decoration TEXT,
      building_age INTEGER,
      address TEXT NOT NULL,
      district TEXT,
      city TEXT DEFAULT '本地',
      community TEXT,
      room_count INTEGER,
      hall_count INTEGER,
      bathroom_count INTEGER,
      description TEXT,
      features TEXT,
      images TEXT,
      status TEXT DEFAULT 'pending',
      is_verified INTEGER DEFAULT 0,
      owner_id INTEGER,
      agent_id INTEGER,
      developer_id INTEGER,
      price_deviation REAL DEFAULT 0,
      price_warning INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      favorite_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (developer_id) REFERENCES developers(id)
    );

    CREATE TABLE IF NOT EXISTS property_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER UNIQUE NOT NULL,
      plot_ratio REAL,
      green_ratio REAL,
      parking_count INTEGER,
      property_fee REAL,
      property_company TEXT,
      school_district TEXT,
      developer_name TEXT,
      heating_type TEXT,
      elevator_count INTEGER,
      building_type TEXT,
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS property_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      image_hash TEXT,
      is_duplicate INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS user_behavior (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, property_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      agent_id INTEGER,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      property_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      agent_id INTEGER,
      type TEXT NOT NULL,
      price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      contract_signed INTEGER DEFAULT 0,
      contract_url TEXT,
      fund_escrow INTEGER DEFAULT 0,
      fund_amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      transfer_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (seller_id) REFERENCES users(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS transaction_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      step TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      operator TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );

    CREATE TABLE IF NOT EXISTS customer_followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      next_follow_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS viewing_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      view_time DATETIME NOT NULL,
      feedback TEXT,
      rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS owner_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER UNIQUE NOT NULL,
      owner_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      confirmed INTEGER DEFAULT 0,
      confirmed_at DATETIME,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS channel_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'online',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS market_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district TEXT NOT NULL,
      type TEXT NOT NULL,
      avg_price REAL NOT NULL,
      destocking_cycle REAL,
      loan_rate REAL,
      data_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS commission_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      transaction_id INTEGER,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );

    CREATE TABLE IF NOT EXISTS owner_entrustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      property_id INTEGER,
      type TEXT NOT NULL,
      expected_price REAL,
      description TEXT,
      status TEXT DEFAULT 'active',
      replacement_demand TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS regulatory_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      record_type TEXT NOT NULL,
      record_content TEXT,
      platform_ref_no TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
    CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district);
    CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
    CREATE INDEX IF NOT EXISTS idx_user_behavior_user ON user_behavior(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_behavior_property ON user_behavior(property_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
  `);
}

export function seedDatabase(): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO users (username, password, real_name, phone, email, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertAgent = db.prepare(
    'INSERT INTO agents (user_id, real_name, id_card, license_no, agency, phone, verified) VALUES (?, ?, ?, ?, ?, ?, 1)'
  );
  const insertDeveloper = db.prepare(
    'INSERT INTO developers (user_id, company_name, credit_level, license_no, contact_name, contact_phone, verified) VALUES (?, ?, ?, ?, ?, ?, 1)'
  );
  const insertProperty = db.prepare(
    `INSERT INTO properties (title, type, category, price, price_unit, area, floor, total_floor, orientation, decoration, building_age, address, district, community, room_count, hall_count, bathroom_count, description, features, images, status, is_verified, owner_id, agent_id, developer_id, price_deviation, price_warning, view_count, favorite_count) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?, ?, ?, 0, 0)`
  );
  const insertPropertyDetail = db.prepare(
    `INSERT INTO property_details (property_id, plot_ratio, green_ratio, parking_count, property_fee, property_company, school_district, developer_name, building_type) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertMarketData = db.prepare(
    'INSERT INTO market_data (district, type, avg_price, destocking_cycle, loan_rate, data_date) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertChannel = db.prepare(
    'INSERT INTO channel_sources (name, code, type) VALUES (?, ?, ?)'
  );

  const bcrypt = require('bcryptjs');
  const adminPwd = bcrypt.hashSync('admin123', 10);
  const userPwd = bcrypt.hashSync('user123', 10);
  const agentPwd = bcrypt.hashSync('agent123', 10);
  const devPwd = bcrypt.hashSync('dev123', 10);

  const adminId = insertUser.run('admin', adminPwd, '系统管理员', '13800000000', 'admin@example.com', 'admin', 'active').lastInsertRowid as number;
  const userId = insertUser.run('user001', userPwd, '张三', '13900000001', 'zhangsan@example.com', 'user', 'active').lastInsertRowid as number;
  const userId2 = insertUser.run('user002', userPwd, '李四', '13900000002', 'lisi@example.com', 'user', 'active').lastInsertRowid as number;
  const agentUserId = insertUser.run('agent001', agentPwd, '王经纪人', '13700000001', 'wangjj@example.com', 'agent', 'active').lastInsertRowid as number;
  const agentUserId2 = insertUser.run('agent002', agentPwd, '刘经纪人', '13700000002', 'liujj@example.com', 'agent', 'active').lastInsertRowid as number;
  const devUserId = insertUser.run('dev001', devPwd, '张经理', '13600000001', 'zhangjl@example.com', 'developer', 'active').lastInsertRowid as number;

  const agentId = insertAgent.run(agentUserId, '王大锤', '110101199001011234', 'JJD2024001', '诚信房产经纪公司', '13700000001').lastInsertRowid as number;
  insertAgent.run(agentUserId2, '刘芳芳', '110101199202025678', 'JJD2024002', '诚信房产经纪公司', '13700000002');

  const devId = insertDeveloper.run(devUserId, '金地置业开发有限公司', 'AAA', 'KFS2024001', '张经理', '13600000001').lastInsertRowid as number;

  const newHouseImages = JSON.stringify([
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20luxury%20apartment%20exterior%20building%20facade&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20living%20room%20interior%20design&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20bedroom%20interior%20cozy&image_size=square_hd'
  ]);
  const secondHandImages = JSON.stringify([
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20residential%20apartment%20building&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bright%20living%20room%20chinese%20style&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kitchen%20modern%20design&image_size=square_hd'
  ]);
  const rentalImages = JSON.stringify([
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20rental%20apartment%20living%20room&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small%20bedroom%20rental&image_size=square_hd'
  ]);
  const commercialImages = JSON.stringify([
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20office%20building%20exterior&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=office%20space%20interior%20open&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shopping%20mall%20interior&image_size=square_hd'
  ]);

  const newHouseProps = [
    { title: '金地·中央公园 精装三居', price: 580, area: 120, floor: '中楼层', total_floor: 32, orientation: '南北通透', decoration: '精装修', building_age: 1, address: '朝阳路88号', district: '朝阳区', community: '金地中央公园', rooms: 3, halls: 2, baths: 2, desc: 'CBD核心地段，地铁直达，配套成熟', features: '地铁房,学区房,精装修,南北通透', images: newHouseImages, devId },
    { title: '绿城·春江花月 品质两居', price: 420, area: 90, floor: '高楼层', total_floor: 28, orientation: '朝南', decoration: '精装修', building_age: 0, address: '建国路168号', district: '朝阳区', community: '绿城春江花月', rooms: 2, halls: 1, baths: 1, desc: '新品开盘，优惠多多，品质开发商', features: '新开盘,品牌开发商,南向,电梯房', images: newHouseImages, devId },
    { title: '万科·翡翠公园 叠拼别墅', price: 1280, area: 220, floor: '低楼层', total_floor: 6, orientation: '南北通透', decoration: '毛坯', building_age: 1, address: '学院南路66号', district: '海淀区', community: '万科翡翠公园', rooms: 4, halls: 3, baths: 3, desc: '学区别墅，高品质社区，私家庭院', features: '别墅,学区房,低密,品牌物业', images: newHouseImages, devId },
  ];

  const secondHandProps = [
    { title: '阳光花园 满五唯一 南北三居', price: 450, area: 115, floor: '中楼层', total_floor: 18, orientation: '南北', decoration: '简装', building_age: 12, address: '中关村大街58号', district: '海淀区', community: '阳光花园', rooms: 3, halls: 2, baths: 2, desc: '满五唯一，税费低，业主诚心出售', features: '满五唯一,南北通透,学区房', images: secondHandImages, owner: userId2 },
    { title: '金色家园 精装两居 拎包入住', price: 320, area: 85, floor: '高楼层', total_floor: 26, orientation: '朝南', decoration: '精装修', building_age: 8, address: '望京西路36号', district: '朝阳区', community: '金色家园', rooms: 2, halls: 1, baths: 1, desc: '精装修，保养好，可拎包入住', features: '精装修,拎包入住,南向,地铁近', images: secondHandImages, owner: userId2 },
    { title: '翠湖小区 经典一居 刚需首选', price: 180, area: 55, floor: '低楼层', total_floor: 6, orientation: '朝南', decoration: '中装', building_age: 20, address: '花园路12号', district: '西城区', community: '翠湖小区', rooms: 1, halls: 1, baths: 1, desc: '老小区，配套成熟，交通便利', features: '刚需,低总价,配套成熟', images: secondHandImages, owner: userId },
  ];

  const rentalProps = [
    { title: '现代城 精装一居 整租', price: 5500, area: 50, floor: '中楼层', total_floor: 30, orientation: '朝南', decoration: '精装修', building_age: 6, address: '国贸CBD旁', district: '朝阳区', community: '现代城', rooms: 1, halls: 1, baths: 1, desc: '精装一居，家电齐全，拎包入住', features: '整租,精装修,家电齐全,近地铁', images: rentalImages, owner: userId },
    { title: '华清嘉园 两居合租 主卧', price: 3200, area: 22, floor: '高楼层', total_floor: 12, orientation: '朝南', decoration: '简装', building_age: 15, address: '五道口地铁旁', district: '海淀区', community: '华清嘉园', rooms: 2, halls: 1, baths: 1, desc: '合租主卧，室友nice，交通便利', features: '合租,主卧,近地铁,学区周边', images: rentalImages, owner: userId },
    { title: '白领公寓 精装开间 月付', price: 4200, area: 38, floor: '中楼层', total_floor: 20, orientation: '朝南', decoration: '精装修', building_age: 3, address: '双井桥东', district: '朝阳区', community: '白领公寓', rooms: 1, halls: 0, baths: 1, desc: '品牌公寓，管家服务，月付无压力', features: '公寓,月付,管家服务,精装修', images: rentalImages, owner: userId2 },
  ];

  const commercialProps = [
    { title: '国贸中心 甲级写字楼 整层出售', price: 8500, area: 1200, floor: '高楼层', total_floor: 50, orientation: '东南', decoration: '精装修', building_age: 10, address: '国贸商圈核心', district: '朝阳区', community: '国贸中心', rooms: 0, halls: 0, baths: 8, desc: 'CBD核心甲级写字楼，整层出售，回报率高', features: '甲级写字楼,整层,核心商圈,投资回报', images: commercialImages, devId: devId },
    { title: '万达金街 临街旺铺 带租约', price: 2800, area: 200, floor: '低楼层', total_floor: 3, orientation: '临街', decoration: '简装', building_age: 5, address: '万达广场', district: '西城区', community: '万达金街', rooms: 0, halls: 0, baths: 2, desc: '临街旺铺，带稳定租约，投资首选', features: '商铺,临街,带租约,投资', images: commercialImages, devId: devId },
    { title: '创业园区 独栋办公楼 可冠名', price: 5200, area: 3500, floor: '独栋', total_floor: 6, orientation: '东南西北', decoration: '毛坯', building_age: 2, address: '中关村科技园', district: '海淀区', community: '创业园', rooms: 0, halls: 0, baths: 12, desc: '独栋办公楼，可冠名，花园式办公', features: '独栋,可冠名,花园办公,科技园', images: commercialImages, devId: devId },
  ];

  newHouseProps.forEach(p => {
    const propId = insertProperty.run(
      p.title, 'new', 'apartment', p.price, 'wan', p.area, p.floor, p.total_floor,
      p.orientation, p.decoration, p.building_age, p.address, p.district, p.community,
      p.rooms, p.halls, p.baths, p.desc, p.features, p.images, null, null, p.devId, 0, 0
    ).lastInsertRowid as number;
    insertPropertyDetail.run(propId, 2.5, 35, 800, 3.5, '金地物业', '朝阳区实验小学', '金地置业', '板楼');
  });

  secondHandProps.forEach(p => {
    const propId = insertProperty.run(
      p.title, 'secondhand', 'apartment', p.price, 'wan', p.area, p.floor, p.total_floor,
      p.orientation, p.decoration, p.building_age, p.address, p.district, p.community,
      p.rooms, p.halls, p.baths, p.desc, p.features, p.images, p.owner, agentId, null, -2.5, 0
    ).lastInsertRowid as number;
    insertPropertyDetail.run(propId, 2.8, 30, 300, 2.2, '阳光物业', '中关村三小', null, '板塔结合');
  });

  rentalProps.forEach(p => {
    const propId = insertProperty.run(
      p.title, 'rental', 'apartment', p.price, 'yuan/month', p.area, p.floor, p.total_floor,
      p.orientation, p.decoration, p.building_age, p.address, p.district, p.community,
      p.rooms, p.halls, p.baths, p.desc, p.features, p.images, p.owner, agentId, null, 1.2, 0
    ).lastInsertRowid as number;
    insertPropertyDetail.run(propId, 3.0, 25, 200, 2.8, '万科物业', null, null, '塔楼');
  });

  commercialProps.forEach(p => {
    const propId = insertProperty.run(
      p.title, 'commercial', 'office', p.price, 'wan', p.area, p.floor, p.total_floor,
      p.orientation, p.decoration, p.building_age, p.address, p.district, p.community,
      p.rooms, p.halls, p.baths, p.desc, p.features, p.images, null, null, p.devId, 0, 0
    ).lastInsertRowid as number;
    insertPropertyDetail.run(propId, 4.0, 20, 500, 15.0, '国贸物业', null, '金地置业', '塔楼');
  });

  insertMarketData.run('朝阳区', 'new', 52000, 8.5, 3.85, '2024-01-15');
  insertMarketData.run('海淀区', 'new', 68000, 10.2, 3.85, '2024-01-15');
  insertMarketData.run('西城区', 'new', 75000, 6.8, 3.85, '2024-01-15');
  insertMarketData.run('朝阳区', 'secondhand', 48000, 12.5, 3.85, '2024-01-15');
  insertMarketData.run('海淀区', 'secondhand', 62000, 15.0, 3.85, '2024-01-15');
  insertMarketData.run('西城区', 'secondhand', 70000, 9.0, 3.85, '2024-01-15');

  insertChannel.run('线上推广', 'online_promotion', 'online');
  insertChannel.run('转介绍', 'referral', 'offline');
  insertChannel.run('门店到访', 'store_visit', 'offline');
  insertChannel.run('电话咨询', 'phone_call', 'online');
}
