const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('./db');
const bcrypt = require('bcryptjs');

const init = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      level INTEGER NOT NULL,
      parent_code TEXT,
      lat REAL,
      lng REAL,
      poi_density INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name TEXT,
      id_card TEXT,
      region_code TEXT NOT NULL,
      address TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'resident',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (region_code) REFERENCES admin_regions(code)
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name TEXT,
      role TEXT NOT NULL,
      region_code TEXT,
      level INTEGER,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS poi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      region_code TEXT NOT NULL,
      address TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (region_code) REFERENCES admin_regions(code)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      employer_type TEXT NOT NULL,
      employer_name TEXT NOT NULL,
      employer_id INTEGER,
      region_code TEXT NOT NULL,
      address TEXT,
      lat REAL,
      lng REAL,
      salary_type TEXT NOT NULL,
      salary_min REAL,
      salary_max REAL,
      hourly_rate REAL,
      description TEXT,
      requirements TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      status INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (region_code) REFERENCES admin_regions(code)
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      applicant_id INTEGER NOT NULL,
      resume TEXT,
      status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (applicant_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS job_hourly_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      hourly_rate REAL NOT NULL,
      overtime_rate REAL,
      meal_allowance REAL,
      transport_allowance REAL,
      created_by INTEGER,
      is_public INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS e_signatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      applicant_id INTEGER,
      employer_id INTEGER,
      document_hash TEXT,
      signature_data TEXT,
      signer_name TEXT,
      signed_at DATETIME,
      status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      region_code TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL,
      lng REAL,
      area REAL,
      rooms INTEGER,
      price REAL NOT NULL,
      price_unit TEXT NOT NULL,
      property_reg_no TEXT,
      landlord_id INTEGER,
      landlord_name TEXT,
      landlord_id_card TEXT,
      landlord_id_verified INTEGER DEFAULT 0,
      property_verified INTEGER DEFAULT 0,
      description TEXT,
      images TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      status INTEGER DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (region_code) REFERENCES admin_regions(code)
    );

    CREATE TABLE IF NOT EXISTS property_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      verifier_id INTEGER,
      property_reg_no TEXT,
      verification_result TEXT,
      verified INTEGER DEFAULT 0,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS inspection_agencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      region_code TEXT NOT NULL,
      address TEXT,
      lat REAL,
      lng REAL,
      contact_phone TEXT,
      business_hours TEXT,
      services TEXT,
      rating REAL DEFAULT 5,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS used_cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      vin TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      year INTEGER,
      mileage REAL,
      accident_history TEXT,
      region_code TEXT NOT NULL,
      price REAL NOT NULL,
      color TEXT,
      transmission TEXT,
      fuel_type TEXT,
      description TEXT,
      images TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      vin_verified INTEGER DEFAULT 0,
      inspection_booked INTEGER DEFAULT 0,
      status INTEGER DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (region_code) REFERENCES admin_regions(code)
    );

    CREATE TABLE IF NOT EXISTS car_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER NOT NULL,
      agency_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      appointment_date DATE NOT NULL,
      appointment_time TEXT NOT NULL,
      status INTEGER DEFAULT 0,
      inspection_report TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (car_id) REFERENCES used_cars(id),
      FOREIGN KEY (agency_id) REFERENCES inspection_agencies(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      region_code TEXT,
      author_id INTEGER,
      author_name TEXT,
      status INTEGER DEFAULT 0,
      reviewer_id INTEGER,
      reviewed_at DATETIME,
      publish_time DATETIME,
      is_hot INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES admins(id)
    );

    CREATE TABLE IF NOT EXISTS news_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      news_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      review_comment TEXT,
      review_result INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (news_id) REFERENCES news(id),
      FOREIGN KEY (reviewer_id) REFERENCES admins(id)
    );

    CREATE TABLE IF NOT EXISTS sensitive_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT UNIQUE NOT NULL,
      category TEXT,
      severity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cross_validation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      source TEXT,
      check_result TEXT,
      confidence REAL,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS heatmap_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region_code TEXT NOT NULL,
      data_type TEXT NOT NULL,
      supply_count INTEGER DEFAULT 0,
      demand_count INTEGER DEFAULT 0,
      match_score REAL DEFAULT 0,
      record_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (region_code) REFERENCES admin_regions(code)
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_region ON jobs(region_code);
    CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_properties_region ON properties(region_code);
    CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
    CREATE INDEX IF NOT EXISTS idx_used_cars_region ON used_cars(region_code);
    CREATE INDEX IF NOT EXISTS idx_used_cars_status ON used_cars(status);
    CREATE INDEX IF NOT EXISTS idx_news_region ON news(region_code);
    CREATE INDEX IF NOT EXISTS idx_news_type ON news(type);
    CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
    CREATE INDEX IF NOT EXISTS idx_poi_region ON poi(region_code);
    CREATE INDEX IF NOT EXISTS idx_poi_type ON poi(type);
  `);

  const regions = [
    { code: '110000', name: '北京市', level: 1, lat: 39.9042, lng: 116.4074, poi_density: 8500 },
    { code: '110100', name: '北京市辖区', level: 2, parent_code: '110000', lat: 39.9042, lng: 116.4074, poi_density: 8500 },
    { code: '110101', name: '东城区', level: 3, parent_code: '110100', lat: 39.9289, lng: 116.4164, poi_density: 9200 },
    { code: '110102', name: '西城区', level: 3, parent_code: '110100', lat: 39.9128, lng: 116.3633, poi_density: 8800 },
    { code: '110105', name: '朝阳区', level: 3, parent_code: '110100', lat: 39.9215, lng: 116.4862, poi_density: 9500 },
    { code: '110106', name: '丰台区', level: 3, parent_code: '110100', lat: 39.8586, lng: 116.2869, poi_density: 7200 },
    { code: '110108', name: '海淀区', level: 3, parent_code: '110100', lat: 39.9590, lng: 116.2980, poi_density: 9800 },
    { code: '310000', name: '上海市', level: 1, lat: 31.2304, lng: 121.4737, poi_density: 9000 },
    { code: '310100', name: '上海市辖区', level: 2, parent_code: '310000', lat: 31.2304, lng: 121.4737, poi_density: 9000 },
    { code: '310101', name: '黄浦区', level: 3, parent_code: '310100', lat: 31.2304, lng: 121.4737, poi_density: 9600 },
    { code: '310104', name: '徐汇区', level: 3, parent_code: '310100', lat: 31.1927, lng: 121.4365, poi_density: 9100 },
    { code: '310105', name: '长宁区', level: 3, parent_code: '310100', lat: 31.2205, lng: 121.4255, poi_density: 8700 },
    { code: '310106', name: '静安区', level: 3, parent_code: '310100', lat: 31.2288, lng: 121.4482, poi_density: 9300 },
    { code: '440100', name: '广州市', level: 2, lat: 23.1291, lng: 113.2644, poi_density: 7800 },
    { code: '440103', name: '荔湾区', level: 3, parent_code: '440100', lat: 23.1336, lng: 113.2337, poi_density: 8200 },
    { code: '440104', name: '越秀区', level: 3, parent_code: '440100', lat: 23.1291, lng: 113.2644, poi_density: 8600 },
    { code: '440105', name: '海珠区', level: 3, parent_code: '440100', lat: 23.1025, lng: 113.3299, poi_density: 7900 },
    { code: '440106', name: '天河区', level: 3, parent_code: '440100', lat: 23.1247, lng: 113.3619, poi_density: 9100 },
  ];

  const insertRegion = db.prepare('INSERT OR IGNORE INTO admin_regions (code, name, level, parent_code, lat, lng, poi_density) VALUES (?, ?, ?, ?, ?, ?, ?)');
  regions.forEach(r => insertRegion.run(r.code, r.name, r.level, r.parent_code, r.lat, r.lng, r.poi_density));

  const poiTypes = ['restaurant', 'shopping', 'hospital', 'school', 'bank', 'park', 'station', 'gym', 'cafe', 'entertainment'];
  const samplePOIs = [];
  let poiId = 1;
  regions.slice(0, 8).forEach(region => {
    for (let i = 0; i < 10; i++) {
      samplePOIs.push({
        id: poiId++,
        name: `${region.name}${poiTypes[i % poiTypes.length]}${i + 1}号`,
        type: poiTypes[i % poiTypes.length],
        region_code: region.code,
        lat: region.lat + (Math.random() - 0.5) * 0.1,
        lng: region.lng + (Math.random() - 0.5) * 0.1,
      });
    }
  });

  const insertPOI = db.prepare('INSERT OR IGNORE INTO poi (id, name, type, region_code, lat, lng) VALUES (?, ?, ?, ?, ?, ?)');
  samplePOIs.forEach(p => insertPOI.run(p.id, p.name, p.type, p.region_code, p.lat, p.lng));

  const agencies = [
    { id: 1, name: '北京机动车检测中心', region_code: '110105', address: '朝阳区汽车城路88号', lat: 39.95, lng: 116.5, contact_phone: '010-12345678', business_hours: '周一至周六 8:00-18:00', services: '综合检测,尾气检测,事故鉴定', rating: 4.8 },
    { id: 2, name: '海淀车辆检测站', region_code: '110108', address: '海淀区科技路168号', lat: 39.98, lng: 116.3, contact_phone: '010-87654321', business_hours: '周一至周六 8:30-17:30', services: '综合检测,二手车评估', rating: 4.6 },
    { id: 3, name: '上海机动车检测总站', region_code: '310104', address: '徐汇区检测大道100号', lat: 31.18, lng: 121.45, contact_phone: '021-12345678', business_hours: '周一至周六 8:00-18:00', services: '综合检测,尾气检测,VIN核验', rating: 4.9 },
  ];
  const insertAgency = db.prepare('INSERT OR IGNORE INTO inspection_agencies (id, name, region_code, address, lat, lng, contact_phone, business_hours, services, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  agencies.forEach(a => insertAgency.run(a.id, a.name, a.region_code, a.address, a.lat, a.lng, a.contact_phone, a.business_hours, a.services, a.rating));

  const sensitiveWordsList = [
    { word: '违禁词1', category: 'political', severity: 3 },
    { word: '违禁词2', category: 'pornography', severity: 3 },
    { word: '违禁词3', category: 'violence', severity: 2 },
    { word: '诈骗', category: 'fraud', severity: 2 },
    { word: '虚假', category: 'misinformation', severity: 1 },
    { word: '高仿', category: 'counterfeit', severity: 2 },
  ];
  const insertSensitive = db.prepare('INSERT OR IGNORE INTO sensitive_words (word, category, severity) VALUES (?, ?, ?)');
  sensitiveWordsList.forEach(w => insertSensitive.run(w.word, w.category, w.severity));

  const adminPassword = bcrypt.hashSync('admin123', 10);
  const insertAdmin = db.prepare('INSERT OR IGNORE INTO admins (username, password_hash, real_name, role, level) VALUES (?, ?, ?, ?, ?)');
  insertAdmin.run('superadmin', adminPassword, '超级管理员', 'super_admin', 1);
  insertAdmin.run('beijing_admin', adminPassword, '北京管理员', 'region_admin', 2);
  insertAdmin.run('chaoyang_auditor', adminPassword, '朝阳区审核员', 'community_auditor', 3);
  insertAdmin.run('haidian_auditor', adminPassword, '海淀区审核员', 'community_auditor', 3);

  const userPassword = bcrypt.hashSync('user123', 10);
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, phone, password_hash, real_name, region_code, role) VALUES (?, ?, ?, ?, ?, ?)');
  insertUser.run('zhang_san', '13800138001', userPassword, '张三', '110105', 'resident');
  insertUser.run('li_si', '13800138002', userPassword, '李四', '110108', 'resident');
  insertUser.run('wang_wu', '13800138003', userPassword, '王五', '110105', 'individual_employer');
  insertUser.run('zhao_liu', '13800138004', userPassword, '赵六', '110108', 'enterprise_employer');
  insertUser.run('landlord1', '13800138005', userPassword, '房东甲', '110105', 'resident');
  insertUser.run('seller1', '13800138006', userPassword, '车主乙', '110108', 'resident');

  const sampleJobs = [
    { title: '朝阳区急招家政保洁', type: 'domestic', employer_type: 'individual', employer_name: '王先生', region_code: '110105', address: '朝阳区建国路88号', salary_type: 'hourly', hourly_rate: 35, description: '日常家庭保洁，每周3次，每次3小时', requirements: '有家政经验，身体健康', contact_name: '王先生', contact_phone: '13800138011', status: 1, verified: 1, created_by: 3 },
    { title: '招聘家电维修师傅', type: 'repair', employer_type: 'individual', employer_name: '李师傅家电维修', region_code: '110105', address: '朝阳区维修街12号', salary_type: 'hourly', hourly_rate: 80, overtime_rate: 120, description: '空调、冰箱、洗衣机等家电维修', requirements: '有电工证，3年以上经验', contact_name: '李师傅', contact_phone: '13800138012', status: 1, verified: 1, created_by: 3 },
    { title: '互联网公司招聘Java开发工程师', type: 'fulltime', employer_type: 'enterprise', employer_name: '北京科技有限公司', region_code: '110108', address: '海淀区中关村软件园', salary_type: 'monthly', salary_min: 20000, salary_max: 35000, description: '负责后端系统开发与维护', requirements: '3年以上Java开发经验，熟悉Spring Boot', contact_name: 'HR张', contact_phone: '13800138013', status: 1, verified: 1, created_by: 4 },
    { title: '餐厅招聘服务员', type: 'fulltime', employer_type: 'enterprise', employer_name: '朝阳餐饮集团', region_code: '110105', address: '朝阳区美食街56号', salary_type: 'monthly', salary_min: 4500, salary_max: 6000, description: '负责餐厅接待、点餐、送餐等工作', requirements: '年龄18-35岁，形象良好', contact_name: '餐厅经理', contact_phone: '13800138014', status: 1, verified: 1, created_by: 4 },
    { title: '兼职小时工-超市理货', type: 'parttime', employer_type: 'enterprise', employer_name: '朝阳连锁超市', region_code: '110105', address: '朝阳区超市路32号', salary_type: 'hourly', hourly_rate: 25, description: '货架整理、商品陈列、顾客引导', requirements: '工作认真负责，能吃苦耐劳', contact_name: '人事部', contact_phone: '13800138015', status: 1, verified: 1, created_by: 4 },
    { title: '钟点工-下午接孩子放学', type: 'domestic', employer_type: 'individual', employer_name: '陈女士', region_code: '110108', address: '海淀区学校附近小区', salary_type: 'hourly', hourly_rate: 40, description: '周一至周五下午4点接孩子放学，到家后做简单晚饭', requirements: '有育儿经验，有责任心', contact_name: '陈女士', contact_phone: '13800138016', status: 1, verified: 1, created_by: 3 },
  ];

  const insertJob = db.prepare(`INSERT OR IGNORE INTO jobs (id, title, type, employer_type, employer_name, region_code, address, salary_type, salary_min, salary_max, hourly_rate, description, requirements, contact_name, contact_phone, status, verified, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  sampleJobs.forEach((j, idx) => insertJob.run(idx + 1, j.title, j.type, j.employer_type, j.employer_name, j.region_code, j.address, j.salary_type, j.salary_min, j.salary_max, j.hourly_rate, j.description, j.requirements, j.contact_name, j.contact_phone, j.status, j.verified, j.created_by));

  const sampleProperties = [
    { type: 'secondhand', title: '海淀区中关村两居室急售', region_code: '110108', address: '海淀区中关村大街100号', area: 85, rooms: 2, price: 580, price_unit: 'wan', property_reg_no: 'BJ202401001', landlord_id: 5, landlord_name: '房东甲', landlord_id_card: '110101198001011234', landlord_id_verified: 1, property_verified: 1, description: '南北通透，学区房，满五唯一', contact_name: '房东甲', contact_phone: '13800138021', status: 1, created_by: 5 },
    { type: 'rent', title: '朝阳区国贸附近一居室出租', region_code: '110105', address: '朝阳区国贸大厦旁', area: 45, rooms: 1, price: 6500, price_unit: 'month', property_reg_no: 'BJ202401002', landlord_id: 5, landlord_name: '房东甲', landlord_id_card: '110101198001011234', landlord_id_verified: 1, property_verified: 1, description: '精装修，家电齐全，拎包入住', contact_name: '房东甲', contact_phone: '13800138022', status: 1, created_by: 5 },
    { type: 'secondhand', title: '西城区三居室学区房', region_code: '110102', address: '西城区教育街8号', area: 110, rooms: 3, price: 980, price_unit: 'wan', property_reg_no: 'BJ202401003', landlord_id: 5, landlord_name: '房东甲', landlord_id_verified: 1, property_verified: 1, description: '重点学区，交通便利', contact_name: '房东甲', contact_phone: '13800138023', status: 1, created_by: 5 },
    { type: 'rent', title: '海淀区软件园附近两居室', region_code: '110108', address: '海淀区软件园二期', area: 78, rooms: 2, price: 8500, price_unit: 'month', property_reg_no: 'BJ202401004', landlord_id: 5, landlord_id_verified: 1, property_verified: 1, description: '近地铁，适合程序员合租', contact_name: '房东甲', contact_phone: '13800138024', status: 1, created_by: 5 },
  ];

  const insertProperty = db.prepare(`INSERT OR IGNORE INTO properties (id, type, title, region_code, address, area, rooms, price, price_unit, property_reg_no, landlord_id, landlord_name, landlord_id_card, landlord_id_verified, property_verified, description, contact_name, contact_phone, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  sampleProperties.forEach((p, idx) => insertProperty.run(idx + 1, p.type, p.title, p.region_code, p.address, p.area, p.rooms, p.price, p.price_unit, p.property_reg_no, p.landlord_id, p.landlord_name, p.landlord_id_card, p.landlord_id_verified, p.property_verified, p.description, p.contact_name, p.contact_phone, p.status, p.created_by));

  const sampleCars = [
    { title: '2020款 大众帕萨特 豪华版', vin: 'LSVCZ6A48KN123456', brand: '大众', model: '帕萨特', year: 2020, mileage: 3.5, region_code: '110105', price: 16.8, color: '黑色', transmission: '自动', fuel_type: '汽油', description: '个人一手车，全程4S店保养，无事故', contact_name: '车主乙', contact_phone: '13800138031', vin_verified: 1, status: 1, created_by: 6 },
    { title: '2019款 丰田凯美瑞 运动版', vin: 'LVGBH40K9KG123789', brand: '丰田', model: '凯美瑞', year: 2019, mileage: 5.2, region_code: '110108', price: 15.5, color: '白色', transmission: '自动', fuel_type: '汽油', description: '车况良好，省油耐用', contact_name: '车主乙', contact_phone: '13800138032', vin_verified: 1, status: 1, created_by: 6 },
    { title: '2021款 特斯拉Model 3 标准续航', vin: '5YJ3E1EA2MF123456', brand: '特斯拉', model: 'Model 3', year: 2021, mileage: 2.1, region_code: '110105', price: 22.0, color: '白色', transmission: '自动', fuel_type: '纯电', description: '准新车，电池健康度98%', contact_name: '车主乙', contact_phone: '13800138033', vin_verified: 1, status: 1, created_by: 6 },
  ];

  const insertCar = db.prepare(`INSERT OR IGNORE INTO used_cars (id, title, vin, brand, model, year, mileage, region_code, price, color, transmission, fuel_type, description, contact_name, contact_phone, vin_verified, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  sampleCars.forEach((c, idx) => insertCar.run(idx + 1, c.title, c.vin, c.brand, c.model, c.year, c.mileage, c.region_code, c.price, c.color, c.transmission, c.fuel_type, c.description, c.contact_name, c.contact_phone, c.vin_verified, c.status, c.created_by));

  const sampleNews = [
    { title: '朝阳区2024年学区划分政策发布', content: '朝阳区教育局今日发布2024年义务教育阶段学区划分方案...', type: 'government', source: 'pgc', region_code: '110105', author_name: '朝阳区教育局', status: 2, is_hot: 1, views: 15680, publish_time: '2024-05-20 09:00:00' },
    { title: '地铁17号线北段预计年底通车', content: '据北京地铁消息，地铁17号线北段工程进展顺利...', type: 'life', source: 'pgc', region_code: '110000', author_name: '北京地铁', status: 2, is_hot: 1, views: 23450, publish_time: '2024-05-22 14:30:00' },
    { title: '居民爆料：某小区水管爆裂正在抢修', content: '今天上午8点左右，朝阳区某小区主水管爆裂，影响多栋楼供水...', type: 'local', source: 'ugc', region_code: '110105', author_id: 1, author_name: '热心居民', status: 2, is_hot: 1, views: 8900, publish_time: '2024-05-25 10:15:00' },
    { title: '本周末将有大范围降雨天气', content: '据市气象台预报，本周末我市将迎来今年入汛以来最强降雨...', type: 'life', source: 'pgc', region_code: '110000', author_name: '北京市气象局', status: 2, views: 12300, publish_time: '2024-05-24 17:00:00' },
    { title: '便民服务：新增10处社区养老服务驿站', content: '为进一步完善社区养老服务体系，今年我区计划新增10处...', type: 'government', source: 'pgc', region_code: '110108', author_name: '海淀区民政局', status: 2, views: 6700, publish_time: '2024-05-23 11:00:00' },
    { title: '爆料待审核：广场舞噪音扰民问题', content: '小区广场每天晚上广场舞音乐太大，影响孩子学习...', type: 'local', source: 'ugc', region_code: '110108', author_id: 2, author_name: '居民小李', status: 0, views: 0 },
    { title: '端午节社区包粽子活动邀请', content: '为弘扬传统文化，增进邻里感情，社区将于端午节当天举办包粽子活动...', type: 'event', source: 'pgc', region_code: '110105', author_name: '朝阳区社区服务中心', status: 2, views: 3200, publish_time: '2024-06-08 09:00:00' },
    { title: '北京2024年高考报名人数创历史新高', content: '据北京市教育考试院统计，今年高考报名人数突破7万人...', type: 'hot', source: 'pgc', region_code: '110000', author_name: '北京市教育考试院', status: 2, is_hot: 1, views: 35600, publish_time: '2024-05-26 08:00:00' },
    { title: '海淀区图书馆延长开放时间通知', content: '为满足市民阅读需求，海淀区图书馆自即日起延长开放时间至晚上9点...', type: 'life', source: 'pgc', region_code: '110108', author_name: '海淀区图书馆', status: 2, views: 4500, publish_time: '2024-05-21 10:00:00' },
  ];

  const insertNews = db.prepare(`INSERT OR IGNORE INTO news (id, title, content, type, source, region_code, author_id, author_name, status, is_hot, views, publish_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  sampleNews.forEach((n, idx) => insertNews.run(idx + 1, n.title, n.content, n.type, n.source, n.region_code, n.author_id, n.author_name, n.status, n.is_hot, n.views, n.publish_time));

  const templates = [
    { id: 1, name: '普通家政服务', hourly_rate: 35, overtime_rate: 52.5, meal_allowance: 20, transport_allowance: 10, is_public: 1 },
    { id: 2, name: '家电维修服务', hourly_rate: 80, overtime_rate: 120, meal_allowance: 30, transport_allowance: 20, is_public: 1 },
    { id: 3, name: '临时搬家服务', hourly_rate: 45, overtime_rate: 67.5, meal_allowance: 25, transport_allowance: 50, is_public: 1 },
    { id: 4, name: '育儿看护服务', hourly_rate: 50, overtime_rate: 75, meal_allowance: 30, transport_allowance: 15, is_public: 1 },
  ];
  const insertTemplate = db.prepare('INSERT OR IGNORE INTO job_hourly_templates (id, name, hourly_rate, overtime_rate, meal_allowance, transport_allowance, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)');
  templates.forEach(t => insertTemplate.run(t.id, t.name, t.hourly_rate, t.overtime_rate, t.meal_allowance, t.transport_allowance, t.is_public));

  const today = new Date().toISOString().split('T')[0];
  const heatmapData = [
    { region_code: '110105', data_type: 'job', supply_count: 156, demand_count: 230, match_score: 67.8, record_date: today },
    { region_code: '110108', data_type: 'job', supply_count: 245, demand_count: 310, match_score: 79.0, record_date: today },
    { region_code: '110105', data_type: 'rent', supply_count: 89, demand_count: 120, match_score: 74.2, record_date: today },
    { region_code: '110108', data_type: 'rent', supply_count: 120, demand_count: 95, match_score: 79.2, record_date: today },
    { region_code: '110105', data_type: 'used_car', supply_count: 45, demand_count: 62, match_score: 72.6, record_date: today },
    { region_code: '110108', data_type: 'used_car', supply_count: 58, demand_count: 48, match_score: 82.9, record_date: today },
  ];
  const insertHeatmap = db.prepare('INSERT OR IGNORE INTO heatmap_data (region_code, data_type, supply_count, demand_count, match_score, record_date) VALUES (?, ?, ?, ?, ?, ?)');
  heatmapData.forEach(h => insertHeatmap.run(h.region_code, h.data_type, h.supply_count, h.demand_count, h.match_score, h.record_date));

  console.log('数据库初始化完成！');
  console.log('默认账号:');
  console.log('  超级管理员: superadmin / admin123');
  console.log('  区域管理员: beijing_admin / admin123');
  console.log('  社区审核员: chaoyang_auditor / admin123');
  console.log('  普通用户: zhang_san / user123');
  console.log('  个体户雇主: wang_wu / user123');
  console.log('  企业雇主: zhao_liu / user123');
};

init();
