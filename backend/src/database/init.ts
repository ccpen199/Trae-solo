import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
  }
});

const runAsync = (sql: string, params: any[] = []): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const getAsync = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allAsync = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const initDatabase = async () => {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS grids (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      town TEXT,
      town_code TEXT,
      city TEXT,
      city_code TEXT,
      province TEXT,
      province_code TEXT,
      lat REAL,
      lng REAL
    )
  `);

  try {
    const gridColumns = await allAsync("PRAGMA table_info(grids)");
    const columnNames = gridColumns.map((c) => (c as { name: string }).name);
    
    if (!columnNames.includes('province')) {
      await runAsync('ALTER TABLE grids ADD COLUMN province TEXT');
    }
    if (!columnNames.includes('city')) {
      await runAsync('ALTER TABLE grids ADD COLUMN city TEXT');
    }
    if (!columnNames.includes('town')) {
      await runAsync('ALTER TABLE grids ADD COLUMN town TEXT');
    }
  } catch (e) {
    console.log('检查grids表字段时出错，跳过字段检查');
  }

  try {
    const announcementColumns = await allAsync("PRAGMA table_info(announcements)");
    const annColumnNames = announcementColumns.map((c) => (c as { name: string }).name);
    
    if (!annColumnNames.includes('priority')) {
      await runAsync('ALTER TABLE announcements ADD COLUMN priority INTEGER DEFAULT 0');
    }
  } catch (e) {
    console.log('检查announcements表字段时出错，跳过字段检查');
  }

  try {
    const settlementColumns = await allAsync("PRAGMA table_info(settlements)");
    const settColumnNames = settlementColumns.map((c) => (c as { name: string }).name);
    
    if (!settColumnNames.includes('demand_id')) {
      await runAsync('ALTER TABLE settlements ADD COLUMN demand_id INTEGER');
    }
  } catch (e) {
    console.log('检查settlements表字段时出错，跳过字段检查');
  }

  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      grid_code TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'resident',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      grid_code TEXT NOT NULL,
      street_certified INTEGER DEFAULT 0,
      certification_no TEXT,
      contact_name TEXT,
      phone TEXT,
      annual_review_date TEXT,
      review_status TEXT DEFAULT 'pending',
      reviewer TEXT,
      review_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS pois (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      grid_code TEXT NOT NULL,
      address TEXT,
      lat REAL,
      lng REAL,
      business_status TEXT DEFAULT 'open',
      avg_cost REAL,
      service_hours TEXT,
      provider_id INTEGER,
      rating REAL DEFAULT 5.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS demands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      grid_code TEXT NOT NULL,
      publisher_id INTEGER,
      publisher_name TEXT,
      acceptor_id INTEGER,
      acceptor_name TEXT,
      reward REAL DEFAULT 0,
      status TEXT DEFAULT 'open',
      service_time TEXT,
      address TEXT,
      scene TEXT,
      recommend_chain TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      reviewer TEXT,
      grid_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demand_id INTEGER,
      provider_id INTEGER,
      complainant_id INTEGER,
      respondent_id INTEGER,
      description TEXT,
      status TEXT DEFAULT 'pending',
      resolution TEXT,
      reviewer TEXT,
      grid_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      grid_code TEXT,
      type TEXT DEFAULT 'notice',
      priority INTEGER DEFAULT 0,
      publisher TEXT,
      status TEXT DEFAULT 'active',
      expire_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS dialect_search (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      pinyin TEXT,
      dialect TEXT,
      standard_text TEXT,
      type TEXT,
      grid_code TEXT,
      search_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS recommend_chains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demand_id INTEGER,
      from_user_id INTEGER,
      to_user_id INTEGER,
      chain_type TEXT,
      chain_detail TEXT,
      share_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS demand_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demand_id INTEGER NOT NULL,
      operator_id INTEGER,
      operator_name TEXT,
      operation TEXT NOT NULL,
      detail TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS provider_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      reviewer_id INTEGER,
      reviewer_name TEXT,
      rating INTEGER,
      comment TEXT,
      review_type TEXT,
      status TEXT DEFAULT 'approved',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const gridCount = await getAsync('SELECT COUNT(*) as count FROM grids');
  if (gridCount.count === 0) {
    await seedGrids();
    await seedProviders();
    await seedPOIs();
    await seedDemands();
    await seedSettlements();
    await seedDisputes();
    await seedAnnouncements();
    await seedDialectSearch();
  } else {
    const sampleGrid = await getAsync('SELECT * FROM grids LIMIT 1');
    if (!sampleGrid.province || !sampleGrid.city || !sampleGrid.town) {
      console.log('正在更新grids表字段数据...');
      const cities = [
        { province: '山东', city: '济南市', code: '370101' },
        { province: '山东', city: '青岛市', code: '370201' },
        { province: '山东', city: '淄博市', code: '370301' },
        { province: '山东', city: '烟台市', code: '370601' },
        { province: '河南', city: '郑州市', code: '410101' },
        { province: '河南', city: '洛阳市', code: '410301' },
        { province: '河南', city: '新乡市', code: '410701' },
        { province: '河南', city: '安阳市', code: '410501' },
        { province: '河北', city: '石家庄市', code: '130101' },
        { province: '河北', city: '唐山市', code: '130201' },
        { province: '河北', city: '保定市', code: '130601' },
        { province: '河北', city: '邯郸市', code: '130401' },
        { province: '湖北', city: '武汉市', code: '420101' },
        { province: '湖北', city: '宜昌市', code: '420501' },
        { province: '湖北', city: '襄阳市', code: '420601' },
        { province: '湖北', city: '荆州市', code: '421001' },
        { province: '江苏', city: '南京市', code: '320101' },
        { province: '江苏', city: '苏州市', code: '320501' },
        { province: '江苏', city: '无锡市', code: '320201' },
        { province: '江苏', city: '常州市', code: '320401' },
      ];
      
      for (const city of cities) {
        for (let i = 1; i <= 2; i++) {
          const code = `${city.code}${i.toString().padStart(2, '0')}`;
          await runAsync(
            'UPDATE grids SET province = ?, city = ?, town = ?, town_code = ? WHERE code = ?',
            [city.province, city.city, `${city.city}城关镇`, code, code]
          );
        }
      }
      console.log('grids表字段数据更新完成');
    }
  }

  const dialectCount = await getAsync('SELECT COUNT(*) as count FROM dialect_search');
  if (dialectCount.count === 0) {
    console.log('正在插入方言搜索种子数据...');
    await seedDialectSearch();
    console.log('方言搜索种子数据插入完成');
  }

  await seedUsers();
};

const seedUsers = async () => {
  const admin = await getAsync('SELECT id FROM users WHERE phone = ?', ['admin']);
  const firstGrid = await getAsync('SELECT code FROM grids ORDER BY code LIMIT 1');
  const defaultGrid = firstGrid?.code || '37010101';

  if (!admin) {
    await runAsync(
      'INSERT INTO users (phone, name, grid_code, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      ['admin', '管理员', defaultGrid, bcrypt.hashSync('admin123', 10), 'admin']
    );
  }

  const residentCount = await getAsync("SELECT COUNT(*) as count FROM users WHERE role = 'resident'");
  if (residentCount.count > 0) {
    return;
  }

  const grids = await allAsync('SELECT code FROM grids ORDER BY code LIMIT 20');
  for (let i = 0; i < 20; i++) {
    const grid = grids[i % Math.max(grids.length, 1)];
    await runAsync(
      'INSERT OR IGNORE INTO users (phone, name, grid_code, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [
        `1380000${(1000 + i).toString()}`,
        `居民${i + 1}`,
        grid?.code || defaultGrid,
        bcrypt.hashSync('123456', 6),
        'resident',
      ]
    );
  }
};

const seedGrids = async () => {
  const cities = [
    { province: '山东', city: '济南市', code: '370101' },
    { province: '山东', city: '青岛市', code: '370201' },
    { province: '山东', city: '淄博市', code: '370301' },
    { province: '山东', city: '烟台市', code: '370601' },
    { province: '河南', city: '郑州市', code: '410101' },
    { province: '河南', city: '洛阳市', code: '410301' },
    { province: '河南', city: '新乡市', code: '410701' },
    { province: '河南', city: '安阳市', code: '410501' },
    { province: '河北', city: '石家庄市', code: '130101' },
    { province: '河北', city: '唐山市', code: '130201' },
    { province: '河北', city: '保定市', code: '130601' },
    { province: '河北', city: '邯郸市', code: '130401' },
    { province: '湖北', city: '武汉市', code: '420101' },
    { province: '湖北', city: '宜昌市', code: '420501' },
    { province: '湖北', city: '襄阳市', code: '420601' },
    { province: '湖北', city: '荆州市', code: '421001' },
    { province: '江苏', city: '南京市', code: '320101' },
    { province: '江苏', city: '苏州市', code: '320501' },
    { province: '江苏', city: '无锡市', code: '320201' },
    { province: '江苏', city: '常州市', code: '320401' },
  ];

  const sql = 'INSERT INTO grids (code, name, town, town_code, city, city_code, province, province_code, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  for (const city of cities) {
    for (let i = 1; i <= 2; i++) {
      const code = `${city.code}${i.toString().padStart(2, '0')}`;
      const townCode = `${city.code}${i.toString().padStart(2, '0')}`;
      const lat = 30 + Math.random() * 10;
      const lng = 110 + Math.random() * 10;
      await runAsync(sql, [code, `${city.city}${i}号社区`, `${city.city}城关镇`, townCode, city.city, city.code, city.province, city.province, lat, lng]);
    }
  }
};

const seedProviders = async () => {
  const grids = await allAsync('SELECT code FROM grids LIMIT 20');
  const serviceTypes = ['家政服务', '家电维修', '拼车出行', '餐饮外卖', '二手交易', '求职招聘'];
  const reviewStatuses = ['approved', 'pending', 'expired', 'approved', 'approved', 'pending', 'approved', 'expired'];
  const reviewers = ['张主任（街道办）', '李科长（民政科）', '王书记（社区）', '赵委员（综治办）'];
  const reviewNotes = [
    '资质齐全，经营规范',
    '服务质量良好，居民满意度高',
    '需补充健康证明材料',
    '经营场所检查合格',
    '从业人员培训合格',
  ];

  const sql = `
    INSERT INTO providers (name, service_type, grid_code, street_certified, certification_no, contact_name, phone, annual_review_date, review_status, reviewer, review_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const today = new Date();
  
  for (let i = 0; i < 20; i++) {
    const grid = grids[i % grids.length];
    const type = serviceTypes[i % serviceTypes.length];
    const status = reviewStatuses[i % reviewStatuses.length];
    const daysOffset = [15, 30, 45, 60, 90, -15, -30, -60][i % 8];
    const reviewDate = new Date(today);
    reviewDate.setDate(reviewDate.getDate() + daysOffset);
    const reviewer = reviewers[i % reviewers.length];
    const note = reviewNotes[i % reviewNotes.length];
    
    await runAsync(sql, [
      `${type}服务商${i + 1}号`,
      type,
      grid.code,
      1,
      `BA${2024000 + i}`,
      `联系人${i + 1}`,
      `138${(10000000 + i).toString().slice(-8)}`,
      reviewDate.toISOString().split('T')[0],
      status,
      reviewer,
      note
    ]);
  }
};

const seedPOIs = async () => {
  const grids = await allAsync('SELECT code, lat, lng FROM grids LIMIT 32');
  const poiTypes = [
    { type: 'restaurant', name: '美食坊', cost: 50, hours: '08:00-22:00' },
    { type: 'takeaway', name: '外卖店', cost: 35, hours: '10:00-21:00' },
    { type: 'home_service', name: '家政中心', cost: 80, hours: '09:00-18:00' },
    { type: 'repair', name: '维修店', cost: 60, hours: '09:00-19:00' },
    { type: 'carpool', name: '拼车站', cost: 25, hours: '06:00-22:00' },
    { type: 'market', name: '便民市场', cost: 40, hours: '07:00-21:00' },
    { type: 'secondhand', name: '二手交易点', cost: 0, hours: '10:00-18:00' },
    { type: 'job', name: '招聘服务站', cost: 0, hours: '09:00-18:00' },
    { type: 'express', name: '快递代取点', cost: 10, hours: '08:00-20:00' },
  ];
  const statuses = ['open', 'closed', 'resting'];

  const sql = `
    INSERT INTO pois (name, type, grid_code, address, lat, lng, business_status, avg_cost, service_hours, provider_id, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (let gIdx = 0; gIdx < grids.length; gIdx++) {
    const grid = grids[gIdx];
    for (let ptIdx = 0; ptIdx < poiTypes.length; ptIdx++) {
      const pt = poiTypes[ptIdx];
      const idx = gIdx * poiTypes.length + ptIdx + 1;
      const status = statuses[idx % statuses.length];
      
      await runAsync(sql, [
        `${pt.name}${idx}号`,
        pt.type,
        grid.code,
        `${grid.code}街道${idx}号`,
        grid.lat + (Math.random() - 0.5) * 0.02,
        grid.lng + (Math.random() - 0.5) * 0.02,
        status,
        pt.cost + Math.floor(Math.random() * 30),
        pt.hours,
        (idx % 20) + 1,
        3.5 + Math.random() * 1.5
      ]);
    }
  }
};

const seedDemands = async () => {
  const grids = await allAsync('SELECT code FROM grids LIMIT 10');
  const demandTypes = ['代取快递', '照看老人', '家政清洁', '家电维修', '拼车出行', '二手转让'];
  const statuses = ['open', 'accepted', 'completed', 'open', 'open'];
  const scenes = ['neighbor', 'recommend', 'notice', 'urgent'];
  const chains = ['same_community', 'same_work', 'same_school', 'friend'];

  const sql = `
    INSERT INTO demands (type, title, description, grid_code, publisher_id, publisher_name, reward, status, service_time, address, scene, recommend_chain)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (let i = 0; i < 15; i++) {
    const type = demandTypes[i % demandTypes.length];
    const grid = grids[i % grids.length];
    const status = statuses[i % statuses.length];
    const scene = scenes[i % scenes.length];
    const chain = chains[i % chains.length];
    
    await runAsync(sql, [
      type,
      `急需${type}服务`,
      `需要一位靠谱的${type}服务商，价格可谈`,
      grid.code,
      i + 1,
      `居民${i + 1}`,
      Math.floor(Math.random() * 100) + 10,
      status,
      ['今天下午', '明天上午', '周末全天', '下班后'][i % 4],
      `${grid.code}小区${i + 1}号楼`,
      scene,
      chain
    ]);
  }
};

const seedSettlements = async () => {
  const providers = await allAsync('SELECT id, grid_code FROM providers');
  const periods = ['2026-04', '2026-05', '2026-06'];
  const statuses = ['completed', 'paid', 'pending', 'completed'];
  const reviewers = ['张主任（街道办）', '李科长（民政科）', '王书记（社区）', '赵委员（综治办）'];

  const sql = `
    INSERT INTO settlements (provider_id, period, amount, status, reviewer, grid_code)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  for (let idx = 0; idx < providers.length; idx++) {
    const p = providers[idx];
    for (let pIdx = 0; pIdx < periods.length; pIdx++) {
      const period = periods[pIdx];
      await runAsync(sql, [
        p.id,
        period,
        Math.floor(Math.random() * 2000) + 500,
        statuses[(idx + pIdx) % statuses.length],
        reviewers[(idx + pIdx) % reviewers.length],
        p.grid_code
      ]);
    }
  }
};

const seedDisputes = async () => {
  const providers = await allAsync('SELECT id, grid_code FROM providers LIMIT 10');
  const descriptions = [
    '服务时间与约定不符',
    '服务质量未达预期',
    '酬金结算存在争议',
    '服务商临时爽约',
    '需求描述与实际不符',
  ];
  const statuses = ['resolved', 'pending', 'rejected', 'resolved', 'pending'];
  const resolutions = [
    '双方协商一致，退还50%酬金',
    '服务商致歉并重新服务',
    '驳回申诉，维持原约定',
    '社区调解，各承担一半责任',
    null,
  ];
  const reviewers = ['张主任（街道办）', '李科长（民政科）', '王书记（社区）', '赵委员（综治办）'];

  const sql = `
    INSERT INTO disputes (demand_id, provider_id, description, status, resolution, reviewer, grid_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  for (let idx = 0; idx < providers.length; idx++) {
    const p = providers[idx];
    const status = statuses[idx % statuses.length];
    await runAsync(sql, [
      idx + 1,
      p.id,
      descriptions[idx % descriptions.length],
      status,
      status === 'pending' ? null : resolutions[idx % resolutions.length],
      reviewers[idx % reviewers.length],
      p.grid_code
    ]);
  }
};

const seedAnnouncements = async () => {
  const grids = await allAsync('SELECT code FROM grids LIMIT 10');
  const announcements = [
    { title: '关于开展社区老年人家政服务补贴的通知', type: 'policy', priority: 2 },
    { title: '本周末社区便民服务大集活动预告', type: 'activity', priority: 1 },
    { title: '2026年第二季度服务商年审通知', type: 'notice', priority: 2 },
    { title: '夏季安全用电温馨提示', type: 'warning', priority: 1 },
    { title: '社区网格员招聘启事', type: 'job', priority: 0 },
    { title: '邻里互助积分兑换活动开始啦', type: 'activity', priority: 1 },
    { title: '关于规范拼车出行服务的公告', type: 'policy', priority: 2 },
    { title: '街道政务服务中心办事指南更新', type: 'notice', priority: 0 },
  ];
  const publishers = ['街道办事处', '社区居委会', '民政科', '综治办', '安监办'];
  const today = new Date();

  for (let idx = 0; idx < announcements.length; idx++) {
    const ann = announcements[idx];
    const grid = grids[idx % grids.length];
    const expireDate = new Date(today);
    expireDate.setDate(today.getDate() + 30);
    
    await runAsync(`
      INSERT INTO announcements (title, content, grid_code, category, priority, publisher_name, status, expire_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ann.title,
      `尊敬的居民朋友：${ann.title}。请广大居民相互转告，积极参与。如有疑问，请联系社区居委会。`,
      grid?.code,
      ann.type,
      ann.priority,
      publishers[idx % publishers.length],
      'active',
      expireDate.toISOString().split('T')[0]
    ]);
  }
};

const seedDialectSearch = async () => {
  const dialects = [
    { keyword: '拉呱', pinyin: 'lagua', dialect: '山东话', standard: '聊天', type: 'social' },
    { keyword: '弄啥嘞', pinyin: 'nongshalei', dialect: '河南话', standard: '干什么', type: 'query' },
    { keyword: '俺', pinyin: 'an', dialect: '北方方言', standard: '我/我们', type: 'pronoun' },
    { keyword: '中', pinyin: 'zhong', dialect: '河南话', standard: '可以/好', type: 'modal' },
    { keyword: '啥', pinyin: 'sha', dialect: '北方方言', standard: '什么', type: 'pronoun' },
    { keyword: '咋', pinyin: 'za', dialect: '北方方言', standard: '怎么', type: 'pronoun' },
    { keyword: '唠嗑', pinyin: 'laoke', dialect: '东北话', standard: '聊天', type: 'social' },
    { keyword: '搭把手', pinyin: 'dashou', dialect: '北方方言', standard: '帮忙', type: 'action' },
    { keyword: '待见', pinyin: 'daijian', dialect: '河北话', standard: '喜欢/看得起', type: 'emotion' },
    { keyword: '刺挠', pinyin: 'cinao', dialect: '山东话', standard: '痒痒', type: 'feeling' },
    { keyword: '嬢嬢', pinyin: 'niangniang', dialect: '湖北话', standard: '阿姨', type: 'title' },
    { keyword: '晓得', pinyin: 'xiaode', dialect: '湖北话', standard: '知道', type: 'verb' },
    { keyword: '阿拉', pinyin: 'ala', dialect: '江苏话', standard: '我/我们', type: 'pronoun' },
    { keyword: '囡囡', pinyin: 'nannan', dialect: '江苏话', standard: '孩子', type: 'noun' },
    { keyword: '妥', pinyin: 'tuo', dialect: '河南话', standard: '好/完成', type: 'modal' },
    { keyword: '倍儿', pinyin: 'beier', dialect: '河北话', standard: '非常', type: 'adverb' },
  ];
  const grids = await allAsync('SELECT code FROM grids LIMIT 5');

  for (let idx = 0; idx < dialects.length; idx++) {
    const d = dialects[idx];
    const grid = grids[idx % grids.length];
    await runAsync(`
      INSERT INTO dialect_search (keyword, pinyin, dialect, standard_text, type, grid_code, search_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      d.keyword,
      d.pinyin,
      d.dialect,
      d.standard,
      d.type,
      grid?.code,
      Math.floor(Math.random() * 100) + 10
    ]);
  }
};

export { db, initDatabase, runAsync, getAsync, allAsync };
