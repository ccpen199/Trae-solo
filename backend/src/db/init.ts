import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db: Database.Database = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    lat REAL,
    lng REAL,
    developer TEXT,
    developer_qualification TEXT,
    floor_area_ratio REAL,
    greening_rate REAL,
    building_type TEXT CHECK(building_type IN ('住宅','商业','办公')),
    total_units INTEGER,
    completion_year INTEGER,
    district TEXT,
    subway_lines TEXT,
    school_district TEXT,
    avg_price REAL,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    updated_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    type TEXT CHECK(type IN ('二手房','新房','租赁')),
    price REAL,
    area REAL,
    unit_price REAL,
    rooms TEXT,
    floor TEXT,
    orientation TEXT,
    decoration TEXT,
    vr_url TEXT,
    property_status TEXT CHECK(property_status IN ('verified','pending','mortgaged')),
    transaction_history TEXT,
    deals_history TEXT,
    agent_id INTEGER,
    owner_name TEXT,
    owner_phone TEXT,
    description TEXT,
    images TEXT,
    status TEXT CHECK(status IN ('在售','已售','已下架')) DEFAULT '在售',
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    updated_at DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (building_id) REFERENCES buildings(id)
  );

  CREATE TABLE IF NOT EXISTS property_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    property_certificate_no TEXT,
    has_mortgage INTEGER DEFAULT 0,
    has_seizure INTEGER DEFAULT 0,
    verification_conclusion TEXT,
    reviewer_name TEXT,
    reviewer_id INTEGER,
    verification_time DATETIME,
    status TEXT CHECK(status IN ('pending','verified','rejected')) DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (listing_id) REFERENCES listings(id)
  );

  CREATE TABLE IF NOT EXISTS vr_annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    description TEXT,
    room TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (listing_id) REFERENCES listings(id)
  );

  CREATE TABLE IF NOT EXISTS vr_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    share_code TEXT UNIQUE,
    share_type TEXT CHECK(share_type IN ('agent','client','public')),
    agent_id INTEGER,
    client_name TEXT,
    client_phone TEXT,
    view_count INTEGER DEFAULT 0,
    expires_at DATETIME,
    can_annotate INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    last_viewed_at DATETIME,
    FOREIGN KEY (listing_id) REFERENCES listings(id)
  );

  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    avatar TEXT,
    license_no TEXT,
    agency TEXT,
    rating REAL DEFAULT 0,
    showing_count INTEGER DEFAULT 0,
    deal_count INTEGER DEFAULT 0,
    commission_total REAL DEFAULT 0,
    specialties TEXT,
    status TEXT CHECK(status IN ('在岗','离岗')) DEFAULT '在岗',
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    updated_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS buyers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    id_card TEXT,
    has_local_hukou INTEGER DEFAULT 0,
    social_insurance_years INTEGER DEFAULT 0,
    existing_properties INTEGER DEFAULT 0,
    marital_status TEXT,
    budget_min REAL,
    budget_max REAL,
    preferred_districts TEXT,
    preferred_rooms TEXT,
    mortgage_pre_approved INTEGER DEFAULT 0,
    preference_tags TEXT,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    updated_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    reviewer_name TEXT,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    content TEXT,
    sentiment TEXT CHECK(sentiment IN ('正面','中性','负面')),
    keywords TEXT,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (building_id) REFERENCES buildings(id)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    appointment_time DATETIME,
    status TEXT CHECK(status IN ('待确认','已确认','已完成','已取消')) DEFAULT '待确认',
    notes TEXT,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (buyer_id) REFERENCES buyers(id)
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    contract_no TEXT,
    amount REAL,
    status TEXT CHECK(status IN ('起草中','待签署','已签署','已作废')) DEFAULT '起草中',
    signed_at DATETIME,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (buyer_id) REFERENCES buyers(id)
  );

  CREATE TABLE IF NOT EXISTS price_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district TEXT NOT NULL,
    month TEXT NOT NULL,
    avg_price REAL,
    volume INTEGER,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
  );
`);

function ensureColumn(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((item) => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('listings', 'deals_history', 'TEXT');

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_buildings_lat_lng ON buildings(lat, lng);
  CREATE INDEX IF NOT EXISTS idx_listings_building_id ON listings(building_id);
  CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
  CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
  CREATE INDEX IF NOT EXISTS idx_listings_property_status ON listings(property_status);
  CREATE INDEX IF NOT EXISTS idx_agents_license_no ON agents(license_no);
  CREATE INDEX IF NOT EXISTS idx_reviews_building_id ON reviews(building_id);
  CREATE INDEX IF NOT EXISTS idx_property_verifications_listing_id ON property_verifications(listing_id);
  CREATE INDEX IF NOT EXISTS idx_vr_annotations_listing_id ON vr_annotations(listing_id);
  CREATE INDEX IF NOT EXISTS idx_vr_shares_listing_id ON vr_shares(listing_id);
  CREATE INDEX IF NOT EXISTS idx_vr_shares_share_code ON vr_shares(share_code);
`);

const countBuildings = db.prepare('SELECT COUNT(*) as cnt FROM buildings').get() as { cnt: number };
if (countBuildings.cnt === 0) {
  const insertBuilding = db.prepare(`
    INSERT INTO buildings (name, address, lat, lng, developer, developer_qualification, floor_area_ratio, greening_rate, building_type, total_units, completion_year, district, subway_lines, school_district, avg_price)
    VALUES (@name, @address, @lat, @lng, @developer, @developer_qualification, @floor_area_ratio, @greening_rate, @building_type, @total_units, @completion_year, @district, @subway_lines, @school_district, @avg_price)
  `);

  const buildings = [
    {
      name: '汤臣一品', address: '浦东新区花园石桥路28弄', lat: 31.2397, lng: 121.4998,
      developer: '汤臣集团有限公司', developer_qualification: '一级', floor_area_ratio: 4.8,
      greening_rate: 35.0, building_type: '住宅', total_units: 220, completion_year: 2009,
      district: '浦东', subway_lines: JSON.stringify(['2号线','14号线']),
      school_district: '建平中学', avg_price: 180000
    },
    {
      name: '翠湖天地御苑', address: '黄浦区顺昌路168弄', lat: 31.2245, lng: 121.4737,
      developer: '瑞安房地产', developer_qualification: '一级', floor_area_ratio: 3.5,
      greening_rate: 40.0, building_type: '住宅', total_units: 316, completion_year: 2006,
      district: '黄浦', subway_lines: JSON.stringify(['10号线','13号线']),
      school_district: '卢湾中学', avg_price: 155000
    },
    {
      name: '陆家嘴金融中心', address: '浦东新区银城中路200号', lat: 31.2365, lng: 121.5015,
      developer: '陆家嘴股份', developer_qualification: '一级', floor_area_ratio: 6.2,
      greening_rate: 25.0, building_type: '办公', total_units: 800, completion_year: 2012,
      district: '浦东', subway_lines: JSON.stringify(['2号线','14号线']),
      school_district: '', avg_price: 65000
    },
    {
      name: '静安府', address: '静安区昌平路88号', lat: 31.2328, lng: 121.4488,
      developer: '华润置地', developer_qualification: '一级', floor_area_ratio: 3.2,
      greening_rate: 38.0, building_type: '住宅', total_units: 480, completion_year: 2020,
      district: '静安', subway_lines: JSON.stringify(['2号线','7号线','12号线']),
      school_district: '静安一中心小学', avg_price: 135000
    },
    {
      name: '万科翡翠公园', address: '徐汇区龙吴路558号', lat: 31.1782, lng: 121.4415,
      developer: '万科集团', developer_qualification: '一级', floor_area_ratio: 2.8,
      greening_rate: 42.0, building_type: '住宅', total_units: 650, completion_year: 2018,
      district: '徐汇', subway_lines: JSON.stringify(['1号线','3号线','11号线']),
      school_district: '位育中学', avg_price: 120000
    },
    {
      name: '仁恒河滨城', address: '浦东新区临沂北路168号', lat: 31.2158, lng: 121.5062,
      developer: '仁恒置地', developer_qualification: '一级', floor_area_ratio: 3.8,
      greening_rate: 45.0, building_type: '住宅', total_units: 520, completion_year: 2015,
      district: '浦东', subway_lines: JSON.stringify(['4号线','6号线']),
      school_district: '洋泾中学', avg_price: 105000
    },
    {
      name: '中粮海景壹号', address: '虹口区吴淞路588号', lat: 31.2541, lng: 121.4855,
      developer: '中粮集团', developer_qualification: '一级', floor_area_ratio: 4.1,
      greening_rate: 32.0, building_type: '住宅', total_units: 390, completion_year: 2017,
      district: '虹口', subway_lines: JSON.stringify(['3号线','10号线']),
      school_district: '复兴高级中学', avg_price: 98000
    },
    {
      name: '长宁来福士广场', address: '长宁区长宁路1133号', lat: 31.2203, lng: 121.4223,
      developer: '凯德集团', developer_qualification: '一级', floor_area_ratio: 5.0,
      greening_rate: 28.0, building_type: '商业', total_units: 600, completion_year: 2019,
      district: '长宁', subway_lines: JSON.stringify(['2号线','3号线','4号线']),
      school_district: '', avg_price: 55000
    },
    {
      name: '保利西岸', address: '徐汇区瑞宁路288号', lat: 31.1895, lng: 121.4538,
      developer: '保利发展', developer_qualification: '一级', floor_area_ratio: 2.5,
      greening_rate: 44.0, building_type: '住宅', total_units: 280, completion_year: 2021,
      district: '徐汇', subway_lines: JSON.stringify(['7号线','11号线','12号线']),
      school_district: '南洋模范中学', avg_price: 128000
    },
    {
      name: '绿地海珀外滩', address: '黄浦区中山南路100弄', lat: 31.2185, lng: 121.4876,
      developer: '绿地集团', developer_qualification: '一级', floor_area_ratio: 3.6,
      greening_rate: 36.0, building_type: '住宅', total_units: 410, completion_year: 2022,
      district: '黄浦', subway_lines: JSON.stringify(['4号线','8号线','9号线']),
      school_district: '大同中学', avg_price: 142000
    }
  ];

  const insertManyBuildings = db.transaction((items: any[]) => {
    for (const item of items) insertBuilding.run(item);
  });
  insertManyBuildings(buildings);

  const insertAgent = db.prepare(`
    INSERT INTO agents (name, phone, avatar, license_no, agency, rating, showing_count, deal_count, commission_total, specialties, status)
    VALUES (@name, @phone, @avatar, @license_no, @agency, @rating, @showing_count, @deal_count, @commission_total, @specialties, @status)
  `);

  const agents = [
    {
      name: '张明辉', phone: '13901234567', avatar: '/avatars/agent1.jpg',
      license_no: 'SH20200001', agency: '链家地产', rating: 4.8,
      showing_count: 156, deal_count: 42, commission_total: 680000,
      specialties: JSON.stringify(['豪宅', '浦东新区', '学区房']), status: '在岗'
    },
    {
      name: '李婉如', phone: '13802345678', avatar: '/avatars/agent2.jpg',
      license_no: 'SH20200002', agency: '中原地产', rating: 4.6,
      showing_count: 98, deal_count: 28, commission_total: 420000,
      specialties: JSON.stringify(['新房', '徐汇区', '改善型']), status: '在岗'
    },
    {
      name: '王建国', phone: '13703456789', avatar: '/avatars/agent3.jpg',
      license_no: 'SH20200003', agency: '我爱我家', rating: 4.9,
      showing_count: 210, deal_count: 56, commission_total: 920000,
      specialties: JSON.stringify(['二手房', '黄浦区', '投资型']), status: '在岗'
    },
    {
      name: '陈丽华', phone: '13604567890', avatar: '/avatars/agent4.jpg',
      license_no: 'SH20200004', agency: '太平洋房屋', rating: 4.5,
      showing_count: 78, deal_count: 18, commission_total: 280000,
      specialties: JSON.stringify(['租赁', '静安区', '商业地产']), status: '在岗'
    },
    {
      name: '赵伟强', phone: '13505678901', avatar: '/avatars/agent5.jpg',
      license_no: 'SH20200005', agency: '链家地产', rating: 4.7,
      showing_count: 132, deal_count: 35, commission_total: 550000,
      specialties: JSON.stringify(['学区房', '虹口区', '首次置业']), status: '离岗'
    }
  ];

  const insertManyAgents = db.transaction((items: any[]) => {
    for (const item of items) insertAgent.run(item);
  });
  insertManyAgents(agents);

  const insertListing = db.prepare(`
    INSERT INTO listings (building_id, title, type, price, area, unit_price, rooms, floor, orientation, decoration, vr_url, property_status, transaction_history, deals_history, agent_id, owner_name, owner_phone, description, images, status)
    VALUES (@building_id, @title, @type, @price, @area, @unit_price, @rooms, @floor, @orientation, @decoration, @vr_url, @property_status, @transaction_history, @deals_history, @agent_id, @owner_name, @owner_phone, @description, @images, @status)
  `);

  const listings = [
    { building_id: 1, title: '汤臣一品江景大平层', type: '二手房', price: 4500, area: 250, unit_price: 180000, rooms: '4室2厅', floor: '28/38', orientation: '南', decoration: '豪装', vr_url: '/vr/tcyp-01.html', property_status: 'verified', transaction_history: JSON.stringify([{ date: '2019-06', price: 3800 }, { date: '2022-03', price: 4200 }]), deals_history: JSON.stringify([{ id: 1, date: '2019-06-15', buyer_name: '李先生', price: 38000000, type: '买入' }, { id: 2, date: '2022-03-20', buyer_name: '王女士', price: 42000000, type: '转让' }]), agent_id: 1, owner_name: '刘先生', owner_phone: '139****1234', description: '黄浦江一线江景，俯瞰外滩万国建筑群。270度观景客厅，全景落地窗。', images: JSON.stringify(['/img/tc1.jpg', '/img/tc2.jpg', '/img/tc3.jpg']), status: '在售' },
    { building_id: 1, title: '汤臣一品精装三房', type: '二手房', price: 3200, area: 180, unit_price: 177778, rooms: '3室2厅', floor: '15/38', orientation: '东南', decoration: '精装', vr_url: '/vr/tcyp-02.html', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 1, owner_name: '陈女士', owner_phone: '138****5678', description: '东南向通透三房，可观陆家嘴天际线，品质社区。', images: JSON.stringify(['/img/tc4.jpg', '/img/tc5.jpg']), status: '在售' },
    { building_id: 2, title: '翠湖天地御苑湖景四房', type: '二手房', price: 3800, area: 245, unit_price: 155102, rooms: '4室2厅', floor: '22/30', orientation: '南', decoration: '豪装', vr_url: '/vr/chtd-01.html', property_status: 'verified', transaction_history: JSON.stringify([{ date: '2020-09', price: 3200 }]), deals_history: JSON.stringify([{ id: 1, date: '2020-09-10', buyer_name: '张先生', price: 32000000, type: '买入' }]), agent_id: 3, owner_name: '王先生', owner_phone: '137****3456', description: '新天地核心地段，法式园林社区，私密性强，顶配物业服务。', images: JSON.stringify(['/img/ch1.jpg', '/img/ch2.jpg', '/img/ch3.jpg']), status: '在售' },
    { building_id: 2, title: '翠湖天地温馨两房', type: '二手房', price: 1680, area: 108, unit_price: 155556, rooms: '2室1厅', floor: '8/30', orientation: '南', decoration: '精装', vr_url: '', property_status: 'pending', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 3, owner_name: '赵女士', owner_phone: '136****7890', description: '新天地商圈，出行便利，学区优质。', images: JSON.stringify(['/img/ch4.jpg', '/img/ch5.jpg']), status: '在售' },
    { building_id: 4, title: '静安府全新交付三房', type: '新房', price: 2100, area: 155, unit_price: 135484, rooms: '3室2厅', floor: '18/28', orientation: '南', decoration: '精装', vr_url: '/vr/jaf-01.html', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 2, owner_name: '开发商', owner_phone: '400****8888', description: '静安核心，全新交付，品质精装，地铁上盖。', images: JSON.stringify(['/img/ja1.jpg', '/img/ja2.jpg']), status: '在售' },
    { building_id: 4, title: '静安府精装两房', type: '新房', price: 1480, area: 108, unit_price: 137037, rooms: '2室1厅', floor: '10/28', orientation: '东南', decoration: '精装', vr_url: '/vr/jaf-02.html', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 4, owner_name: '开发商', owner_phone: '400****8888', description: '低区东南向两房，采光充足，动静分离。', images: JSON.stringify(['/img/ja3.jpg', '/img/ja4.jpg']), status: '在售' },
    { building_id: 5, title: '万科翡翠公园舒适三房', type: '二手房', price: 1200, area: 100, unit_price: 120000, rooms: '3室1厅', floor: '12/22', orientation: '南', decoration: '精装', vr_url: '/vr/wkfc-01.html', property_status: 'verified', transaction_history: JSON.stringify([{ date: '2021-05', price: 1050 }]), deals_history: JSON.stringify([{ id: 1, date: '2021-05-18', buyer_name: '孙先生', price: 10500000, type: '买入' }]), agent_id: 2, owner_name: '孙先生', owner_phone: '135****2345', description: '万科品质社区，配套齐全，学区优质，自住首选。', images: JSON.stringify(['/img/wk1.jpg', '/img/wk2.jpg']), status: '在售' },
    { building_id: 5, title: '万科翡翠公园复式四房', type: '二手房', price: 1800, area: 150, unit_price: 120000, rooms: '4室2厅', floor: '5-6/22', orientation: '南', decoration: '豪装', vr_url: '/vr/wkfc-02.html', property_status: 'mortgaged', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 2, owner_name: '周女士', owner_phone: '134****6789', description: '稀缺复式户型，超大露台，花园洋房品质。', images: JSON.stringify(['/img/wk3.jpg', '/img/wk4.jpg']), status: '在售' },
    { building_id: 6, title: '仁恒河滨城河景三房', type: '二手房', price: 1050, area: 100, unit_price: 105000, rooms: '3室2厅', floor: '16/32', orientation: '南', decoration: '精装', vr_url: '/vr/ryhb-01.html', property_status: 'verified', transaction_history: JSON.stringify([{ date: '2020-12', price: 920 }]), deals_history: JSON.stringify([{ id: 1, date: '2020-12-05', buyer_name: '吴先生', price: 9200000, type: '买入' }]), agent_id: 1, owner_name: '吴先生', owner_phone: '133****0123', description: '浦东核心地段，河景房，国际社区，配套成熟。', images: JSON.stringify(['/img/ry1.jpg', '/img/ry2.jpg']), status: '在售' },
    { building_id: 6, title: '仁恒河滨城精装两房', type: '租赁', price: 1.5, area: 88, unit_price: 17045, rooms: '2室1厅', floor: '9/32', orientation: '东南', decoration: '精装', vr_url: '', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 4, owner_name: '郑女士', owner_phone: '132****4567', description: '月租15000元，拎包入住，近地铁6号线。', images: JSON.stringify(['/img/ry3.jpg']), status: '在售' },
    { building_id: 7, title: '中粮海景壹号江景三房', type: '二手房', price: 980, area: 100, unit_price: 98000, rooms: '3室2厅', floor: '20/35', orientation: '南', decoration: '精装', vr_url: '/vr/zlhj-01.html', property_status: 'verified', transaction_history: JSON.stringify([{ date: '2021-08', price: 850 }]), deals_history: JSON.stringify([{ id: 1, date: '2021-08-22', buyer_name: '黄先生', price: 8500000, type: '买入' }]), agent_id: 5, owner_name: '黄先生', owner_phone: '131****8901', description: '北外滩江景三房，视野开阔，生活便利。', images: JSON.stringify(['/img/zl1.jpg', '/img/zl2.jpg']), status: '在售' },
    { building_id: 7, title: '中粮海景壹号一房公寓', type: '租赁', price: 0.8, area: 55, unit_price: 14545, rooms: '1室1厅', floor: '12/35', orientation: '东', decoration: '精装', vr_url: '', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 4, owner_name: '林先生', owner_phone: '130****2345', description: '月租8000元，商务人士首选，近地铁10号线。', images: JSON.stringify(['/img/zl3.jpg']), status: '在售' },
    { building_id: 9, title: '保利西岸改善四房', type: '新房', price: 1600, area: 125, unit_price: 128000, rooms: '4室2厅', floor: '15/25', orientation: '南', decoration: '精装', vr_url: '/vr/blxa-01.html', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 2, owner_name: '开发商', owner_phone: '400****6666', description: '徐汇滨江核心，新盘首开，学区优质。', images: JSON.stringify(['/img/bl1.jpg', '/img/bl2.jpg']), status: '在售' },
    { building_id: 9, title: '保利西岸精致三房', type: '新房', price: 1120, area: 88, unit_price: 127273, rooms: '3室1厅', floor: '8/25', orientation: '东南', decoration: '精装', vr_url: '', property_status: 'pending', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 5, owner_name: '开发商', owner_phone: '400****6666', description: '紧凑三房，功能齐全，低总价上车徐汇。', images: JSON.stringify(['/img/bl3.jpg', '/img/bl4.jpg']), status: '在售' },
    { building_id: 10, title: '绿地海珀外滩江景三房', type: '二手房', price: 1560, area: 110, unit_price: 141818, rooms: '3室2厅', floor: '25/35', orientation: '南', decoration: '豪装', vr_url: '/vr/ldhp-01.html', property_status: 'verified', transaction_history: JSON.stringify([{ date: '2023-01', price: 1380 }]), deals_history: JSON.stringify([{ id: 1, date: '2023-01-15', buyer_name: '何先生', price: 13800000, type: '买入' }]), agent_id: 3, owner_name: '何先生', owner_phone: '129****5678', description: '南外滩新地标，江景视野，品质社区。', images: JSON.stringify(['/img/ld1.jpg', '/img/ld2.jpg']), status: '在售' },
    { building_id: 10, title: '绿地海珀外滩两房', type: '二手房', price: 850, area: 62, unit_price: 137097, rooms: '2室1厅', floor: '6/35', orientation: '东南', decoration: '精装', vr_url: '', property_status: 'mortgaged', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 3, owner_name: '方女士', owner_phone: '128****9012', description: '低区两房，总价可控，学区加持。', images: JSON.stringify(['/img/ld3.jpg']), status: '在售' },
    { building_id: 3, title: '陆家嘴金融中心甲级写字楼', type: '租赁', price: 12, area: 320, unit_price: 375, rooms: '办公', floor: '38/55', orientation: '南', decoration: '毛坯', vr_url: '/vr/ljz-01.html', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 4, owner_name: '物业公司', owner_phone: '021-****8888', description: '甲级写字楼，月租12万，陆家嘴核心区位。', images: JSON.stringify(['/img/ljz1.jpg', '/img/ljz2.jpg']), status: '在售' },
    { building_id: 3, title: '陆家嘴金融中心小面积办公', type: '租赁', price: 3.5, area: 100, unit_price: 350, rooms: '办公', floor: '15/55', orientation: '东', decoration: '精装', vr_url: '', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 4, owner_name: '物业公司', owner_phone: '021-****8888', description: '精装小面积办公，月租3.5万，拎包入驻。', images: JSON.stringify(['/img/ljz3.jpg']), status: '在售' },
    { building_id: 8, title: '长宁来福士商铺', type: '租赁', price: 8, area: 200, unit_price: 400, rooms: '商业', floor: '1/6', orientation: '南', decoration: '精装', vr_url: '/vr/cnlfs-01.html', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 4, owner_name: '凯德商管', owner_phone: '021-****5555', description: '一楼临街商铺，月租8万，中山公园商圈。', images: JSON.stringify(['/img/cn1.jpg', '/img/cn2.jpg']), status: '在售' },
    { building_id: 8, title: '长宁来福士办公位', type: '租赁', price: 0.6, area: 15, unit_price: 400, rooms: '办公', floor: '3/6', orientation: '北', decoration: '简装', vr_url: '', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 4, owner_name: '凯德商管', owner_phone: '021-****5555', description: '共享办公工位，月租6000元，含物业费。', images: JSON.stringify(['/img/cn3.jpg']), status: '在售' },
    { building_id: 1, title: '汤臣一品复式五房', type: '二手房', price: 6800, area: 380, unit_price: 178947, rooms: '5室3厅', floor: '35-36/38', orientation: '南', decoration: '豪装', vr_url: '/vr/tcyp-03.html', property_status: 'verified', transaction_history: JSON.stringify([{ date: '2018-11', price: 5200 }]), deals_history: JSON.stringify([{ id: 1, date: '2018-11-20', buyer_name: '许先生', price: 52000000, type: '买入' }]), agent_id: 1, owner_name: '许先生', owner_phone: '139****0001', description: '顶层复式，私家泳池，360度环幕江景。', images: JSON.stringify(['/img/tc6.jpg', '/img/tc7.jpg', '/img/tc8.jpg']), status: '在售' },
    { building_id: 2, title: '翠湖天地御苑一房', type: '租赁', price: 1.2, area: 65, unit_price: 18462, rooms: '1室1厅', floor: '5/30', orientation: '南', decoration: '精装', vr_url: '', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 4, owner_name: '钱先生', owner_phone: '138****0002', description: '月租12000元，新天地核心，生活便利。', images: JSON.stringify(['/img/ch6.jpg']), status: '在售' },
    { building_id: 5, title: '万科翡翠公园一房', type: '租赁', price: 0.6, area: 48, unit_price: 12500, rooms: '1室1厅', floor: '15/22', orientation: '南', decoration: '精装', vr_url: '', property_status: 'verified', transaction_history: JSON.stringify([]), deals_history: JSON.stringify([]), agent_id: 4, owner_name: '冯女士', owner_phone: '135****0003', description: '月租6000元，精装一房，拎包入住。', images: JSON.stringify(['/img/wk5.jpg']), status: '在售' }
  ];

  const insertManyListings = db.transaction((items: any[]) => {
    for (const item of items) insertListing.run(item);
  });
  insertManyListings(listings);

  const insertBuyer = db.prepare(`
    INSERT INTO buyers (name, phone, id_card, has_local_hukou, social_insurance_years, existing_properties, marital_status, budget_min, budget_max, preferred_districts, preferred_rooms, mortgage_pre_approved, preference_tags)
    VALUES (@name, @phone, @id_card, @has_local_hukou, @social_insurance_years, @existing_properties, @marital_status, @budget_min, @budget_max, @preferred_districts, @preferred_rooms, @mortgage_pre_approved, @preference_tags)
  `);

  const buyers = [
    {
      name: '陈小明', phone: '13912345678', id_card: '310101199001011234',
      has_local_hukou: 1, social_insurance_years: 8, existing_properties: 0,
      marital_status: '已婚', budget_min: 800, budget_max: 1500,
      preferred_districts: JSON.stringify(['浦东', '黄浦']), preferred_rooms: '3室2厅',
      mortgage_pre_approved: 1, preference_tags: JSON.stringify(['学区房', '地铁房', '首次置业'])
    },
    {
      name: '王大伟', phone: '13823456789', id_card: '320102198805052345',
      has_local_hukou: 0, social_insurance_years: 6, existing_properties: 0,
      marital_status: '已婚', budget_min: 500, budget_max: 1000,
      preferred_districts: JSON.stringify(['徐汇', '长宁']), preferred_rooms: '2室1厅',
      mortgage_pre_approved: 1, preference_tags: JSON.stringify(['改善型', '近地铁'])
    },
    {
      name: '李小红', phone: '13734567890', id_card: '310103199503033456',
      has_local_hukou: 1, social_insurance_years: 3, existing_properties: 1,
      marital_status: '已婚', budget_min: 1000, budget_max: 2000,
      preferred_districts: JSON.stringify(['静安', '黄浦']), preferred_rooms: '3室2厅',
      mortgage_pre_approved: 0, preference_tags: JSON.stringify(['投资', '江景房'])
    },
    {
      name: '张伟', phone: '13645678901', id_card: '410104199207074567',
      has_local_hukou: 0, social_insurance_years: 2, existing_properties: 0,
      marital_status: '单身', budget_min: 300, budget_max: 600,
      preferred_districts: JSON.stringify(['虹口', '浦东']), preferred_rooms: '1室1厅',
      mortgage_pre_approved: 0, preference_tags: JSON.stringify(['首次置业', '刚需'])
    }
  ];

  const insertManyBuyers = db.transaction((items: any[]) => {
    for (const item of items) insertBuyer.run(item);
  });
  insertManyBuyers(buyers);

  const insertReview = db.prepare(`
    INSERT INTO reviews (building_id, reviewer_name, rating, content, sentiment, keywords)
    VALUES (@building_id, @reviewer_name, @rating, @content, @sentiment, @keywords)
  `);

  const reviews = [
    { building_id: 1, reviewer_name: '业主刘先生', rating: 5, content: '江景非常好，物业管理也很棒，住着非常舒适，值得推荐！', sentiment: '正面', keywords: JSON.stringify(['江景', '物业', '舒适', '推荐']) },
    { building_id: 1, reviewer_name: '访客小王', rating: 4, content: '位置确实不错，但是价格太贵了，性价比一般。', sentiment: '中性', keywords: JSON.stringify(['位置', '价格', '性价比']) },
    { building_id: 2, reviewer_name: '业主赵女士', rating: 5, content: '新天地核心位置，生活非常方便，学区也很优秀！', sentiment: '正面', keywords: JSON.stringify(['新天地', '生活便利', '学区']) },
    { building_id: 2, reviewer_name: '租客小李', rating: 3, content: '小区有点老了，停车不太方便，但是地段确实好。', sentiment: '中性', keywords: JSON.stringify(['老旧', '停车', '地段']) },
    { building_id: 4, reviewer_name: '业主孙先生', rating: 5, content: '华润品质确实好，精装标准高，物业服务满意！', sentiment: '正面', keywords: JSON.stringify(['品质', '精装', '物业', '满意']) },
    { building_id: 5, reviewer_name: '业主周女士', rating: 4, content: '万科社区很棒，绿化好，学区也不错。就是周边配套还在完善。', sentiment: '正面', keywords: JSON.stringify(['社区', '绿化', '学区', '配套']) },
    { building_id: 6, reviewer_name: '业主吴先生', rating: 4, content: '国际社区氛围好，邻居素质高。就是物业费贵了点。', sentiment: '正面', keywords: JSON.stringify(['国际社区', '素质', '物业费']) },
    { building_id: 7, reviewer_name: '业主黄先生', rating: 3, content: '江景不错但隔音差，有漏水问题，投诉过好几次了。', sentiment: '负面', keywords: JSON.stringify(['江景', '隔音', '漏水', '投诉']) },
    { building_id: 7, reviewer_name: '租客小张', rating: 2, content: '噪音太大，隔壁装修太吵，差评，避坑！', sentiment: '负面', keywords: JSON.stringify(['噪音', '装修', '差评', '避坑']) },
    { building_id: 9, reviewer_name: '业主何先生', rating: 5, content: '徐汇滨江新盘，品质很棒，学区优质，值得入手！', sentiment: '正面', keywords: JSON.stringify(['滨江', '品质', '学区', '值得']) },
    { building_id: 10, reviewer_name: '业主方女士', rating: 4, content: '新楼盘设计很现代，住着舒适满意，就是交房有点晚。', sentiment: '正面', keywords: JSON.stringify(['设计', '舒适', '满意', '交房']) },
    { building_id: 3, reviewer_name: '企业租户', rating: 3, content: '地段顶级，但租金偏贵，性价比一般。', sentiment: '中性', keywords: JSON.stringify(['地段', '租金', '性价比']) },
    { building_id: 5, reviewer_name: '访客老王', rating: 2, content: '小区管理混乱，差！停车难问题严重，投诉无果。', sentiment: '负面', keywords: JSON.stringify(['管理', '停车', '投诉']) }
  ];

  const insertManyReviews = db.transaction((items: any[]) => {
    for (const item of items) insertReview.run(item);
  });
  insertManyReviews(reviews);

  const insertPriceTrend = db.prepare(`
    INSERT INTO price_trends (district, month, avg_price, volume)
    VALUES (@district, @month, @avg_price, @volume)
  `);

  const priceTrends = [
    { district: '浦东', month: '2026-01', avg_price: 108000, volume: 2450 },
    { district: '浦东', month: '2026-02', avg_price: 109500, volume: 2180 },
    { district: '浦东', month: '2026-03', avg_price: 112000, volume: 2890 },
    { district: '浦东', month: '2026-04', avg_price: 115000, volume: 3100 },
    { district: '浦东', month: '2026-05', avg_price: 118000, volume: 3250 },
    { district: '黄浦', month: '2026-01', avg_price: 135000, volume: 1120 },
    { district: '黄浦', month: '2026-02', avg_price: 136800, volume: 980 },
    { district: '黄浦', month: '2026-03', avg_price: 138500, volume: 1250 },
    { district: '黄浦', month: '2026-04', avg_price: 140200, volume: 1180 },
    { district: '黄浦', month: '2026-05', avg_price: 142000, volume: 1300 },
    { district: '静安', month: '2026-01', avg_price: 120000, volume: 1580 },
    { district: '静安', month: '2026-02', avg_price: 121500, volume: 1350 },
    { district: '静安', month: '2026-03', avg_price: 123000, volume: 1620 },
    { district: '静安', month: '2026-04', avg_price: 128000, volume: 1750 },
    { district: '静安', month: '2026-05', avg_price: 135000, volume: 1900 },
    { district: '徐汇', month: '2026-01', avg_price: 105000, volume: 1890 },
    { district: '徐汇', month: '2026-02', avg_price: 106200, volume: 1680 },
    { district: '徐汇', month: '2026-03', avg_price: 107800, volume: 1950 },
    { district: '徐汇', month: '2026-04', avg_price: 109500, volume: 2010 },
    { district: '徐汇', month: '2026-05', avg_price: 112000, volume: 2150 },
    { district: '虹口', month: '2026-01', avg_price: 88000, volume: 1230 },
    { district: '虹口', month: '2026-02', avg_price: 88500, volume: 1100 },
    { district: '虹口', month: '2026-03', avg_price: 89200, volume: 1280 },
    { district: '虹口', month: '2026-04', avg_price: 90000, volume: 1350 },
    { district: '虹口', month: '2026-05', avg_price: 91000, volume: 1400 },
    { district: '长宁', month: '2026-01', avg_price: 82000, volume: 980 },
    { district: '长宁', month: '2026-02', avg_price: 82500, volume: 880 },
    { district: '长宁', month: '2026-03', avg_price: 83000, volume: 1020 },
    { district: '长宁', month: '2026-04', avg_price: 83500, volume: 1080 },
    { district: '长宁', month: '2026-05', avg_price: 84000, volume: 1120 }
  ];

  const insertManyPriceTrends = db.transaction((items: any[]) => {
    for (const item of items) insertPriceTrend.run(item);
  });
  insertManyPriceTrends(priceTrends);

  const insertVerification = db.prepare(`
    INSERT INTO property_verifications (listing_id, property_certificate_no, has_mortgage, has_seizure, verification_conclusion, reviewer_name, reviewer_id, verification_time, status, notes)
    VALUES (@listing_id, @property_certificate_no, @has_mortgage, @has_seizure, @verification_conclusion, @reviewer_name, @reviewer_id, @verification_time, @status, @notes)
  `);

  const verifications = [
    { listing_id: 1, property_certificate_no: '沪(2022)浦字不动产权第001234号', has_mortgage: 0, has_seizure: 0, verification_conclusion: '产权清晰，无抵押无查封，可正常交易', reviewer_name: '李审核', reviewer_id: 1, verification_time: '2026-05-20 10:30:00', status: 'verified', notes: '已核验不动产权证原件，产权人身份证明齐全' },
    { listing_id: 3, property_certificate_no: '沪(2021)黄字不动产权第005678号', has_mortgage: 0, has_seizure: 0, verification_conclusion: '产权清晰，交易无限制', reviewer_name: '王审核', reviewer_id: 2, verification_time: '2026-05-25 14:20:00', status: 'verified', notes: '核验通过' },
    { listing_id: 8, property_certificate_no: '沪(2020)徐字不动产权第009012号', has_mortgage: 1, has_seizure: 0, verification_conclusion: '存在银行抵押贷款500万，需结清后方可过户', reviewer_name: '张审核', reviewer_id: 1, verification_time: '2026-06-01 09:15:00', status: 'verified', notes: '抵押权人为工商银行徐汇支行' },
    { listing_id: 16, property_certificate_no: '沪(2023)黄字不动产权第003456号', has_mortgage: 1, has_seizure: 0, verification_conclusion: '有抵押贷款200万，需业主自行结清', reviewer_name: '李审核', reviewer_id: 1, verification_time: '2026-06-02 16:45:00', status: 'verified', notes: '预计2026年6月15日前结清' },
    { listing_id: 4, property_certificate_no: '', has_mortgage: 0, has_seizure: 0, verification_conclusion: '', reviewer_name: '', reviewer_id: null, verification_time: null, status: 'pending', notes: '待业主提供产权证' },
    { listing_id: 14, property_certificate_no: '', has_mortgage: 0, has_seizure: 0, verification_conclusion: '', reviewer_name: '', reviewer_id: null, verification_time: null, status: 'pending', notes: '新房未办理产证，需等开发商大产证' },
  ];

  const insertManyVerifications = db.transaction((items: any[]) => {
    for (const item of items) insertVerification.run(item);
  });
  insertManyVerifications(verifications);

  const insertAnnotation = db.prepare(`
    INSERT INTO vr_annotations (listing_id, name, position_x, position_y, description, room, created_by)
    VALUES (@listing_id, @name, @position_x, @position_y, @description, @room, @created_by)
  `);

  const annotations = [
    { listing_id: 1, name: '江景落地窗', position_x: 35.5, position_y: 42.0, description: '270度全景落地窗，直面黄浦江，采光极佳', room: '客厅', created_by: 1 },
    { listing_id: 1, name: '开放式厨房', position_x: 68.2, position_y: 55.0, description: '德国进口厨电，中西厨岛台设计', room: '厨房', created_by: 1 },
    { listing_id: 1, name: '主卧套房', position_x: 25.0, position_y: 65.0, description: '带步入式衣帽间和独立卫浴，双台盆设计', room: '主卧', created_by: 2 },
    { listing_id: 3, name: '湖景阳台', position_x: 45.0, position_y: 38.0, description: '南向大阳台，俯瞰社区中心湖景', room: '客厅', created_by: 3 },
    { listing_id: 3, name: '步入式衣帽间', position_x: 55.0, position_y: 70.0, description: '定制衣柜系统，收纳空间充足', room: '主卧', created_by: 3 },
    { listing_id: 7, name: '北外滩江景', position_x: 30.0, position_y: 40.0, description: '远眺陆家嘴天际线，夜景绝佳', room: '客厅', created_by: 5 },
    { listing_id: 15, name: '顶层露台', position_x: 50.0, position_y: 30.0, description: '60㎡超大私家露台，配户外泳池', room: '顶层', created_by: 1 },
  ];

  const insertManyAnnotations = db.transaction((items: any[]) => {
    for (const item of items) insertAnnotation.run(item);
  });
  insertManyAnnotations(annotations);

  const insertShare = db.prepare(`
    INSERT INTO vr_shares (listing_id, share_code, share_type, agent_id, client_name, client_phone, view_count, expires_at, can_annotate, created_by, last_viewed_at)
    VALUES (@listing_id, @share_code, @share_type, @agent_id, @client_name, @client_phone, @view_count, @expires_at, @can_annotate, @created_by, @last_viewed_at)
  `);

  const shares = [
    { listing_id: 1, share_code: 'VR-TCYP-20260601', share_type: 'client', agent_id: 1, client_name: '陈总', client_phone: '139****8888', view_count: 15, expires_at: '2026-06-15 23:59:59', can_annotate: 1, created_by: 1, last_viewed_at: '2026-06-03 10:25:00' },
    { listing_id: 1, share_code: 'VR-TCYP-20260602', share_type: 'agent', agent_id: 1, client_name: '', client_phone: '', view_count: 8, expires_at: '2026-12-31 23:59:59', can_annotate: 1, created_by: 1, last_viewed_at: '2026-06-03 09:10:00' },
    { listing_id: 3, share_code: 'VR-CHTD-20260601', share_type: 'client', agent_id: 3, client_name: '王女士', client_phone: '138****6666', view_count: 6, expires_at: '2026-06-20 23:59:59', can_annotate: 0, created_by: 3, last_viewed_at: '2026-06-02 16:30:00' },
    { listing_id: 7, share_code: 'VR-ZLHJ-20260601', share_type: 'client', agent_id: 5, client_name: '张先生', client_phone: '137****5555', view_count: 3, expires_at: '2026-06-10 23:59:59', can_annotate: 1, created_by: 5, last_viewed_at: '2026-06-01 20:15:00' },
    { listing_id: 15, share_code: 'VR-LDHP-20260601', share_type: 'public', agent_id: null, client_name: '', client_phone: '', view_count: 128, expires_at: '2026-12-31 23:59:59', can_annotate: 0, created_by: 2, last_viewed_at: '2026-06-03 18:45:00' },
  ];

  const insertManyShares = db.transaction((items: any[]) => {
    for (const item of items) insertShare.run(item);
  });
  insertManyShares(shares);
}

export default db;
