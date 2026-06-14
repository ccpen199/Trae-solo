const db = require('../db');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT,
      id_card TEXT,
      user_type TEXT DEFAULT 'normal',
      avatar TEXT,
      address TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tianfutong_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_no TEXT UNIQUE NOT NULL,
      card_type TEXT NOT NULL,
      card_status TEXT DEFAULT 'active',
      balance REAL DEFAULT 0,
      times_count INTEGER DEFAULT 0,
      expiry_date TEXT,
      region TEXT,
      nfc_enabled INTEGER DEFAULT 0,
      qr_token TEXT,
      qr_expires_at TEXT,
      last_used_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      card_id INTEGER,
      card_no TEXT,
      transaction_type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_before REAL,
      balance_after REAL,
      payment_channel TEXT,
      transport_type TEXT,
      route_name TEXT,
      station_in TEXT,
      station_out TEXT,
      status TEXT DEFAULT 'success',
      risk_level INTEGER DEFAULT 0,
      is_flagged INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (card_id) REFERENCES tianfutong_cards(id)
    );

    CREATE TABLE IF NOT EXISTS payment_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      channel_type TEXT NOT NULL,
      channel_name TEXT NOT NULL,
      account_info TEXT,
      is_default INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recharge_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      card_id INTEGER NOT NULL,
      recharge_type TEXT NOT NULL,
      amount REAL NOT NULL,
      times INTEGER DEFAULT 0,
      payment_method TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      paid_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (card_id) REFERENCES tianfutong_cards(id)
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_no TEXT NOT NULL,
      route_name TEXT NOT NULL,
      transport_type TEXT NOT NULL,
      start_station TEXT NOT NULL,
      end_station TEXT NOT NULL,
      first_departure TEXT,
      last_departure TEXT,
      fare REAL DEFAULT 0,
      stations TEXT,
      crowding_data TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_code TEXT UNIQUE NOT NULL,
      station_name TEXT NOT NULL,
      lines TEXT,
      transfer_lines TEXT,
      facilities TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parking_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lot_code TEXT UNIQUE NOT NULL,
      lot_name TEXT NOT NULL,
      address TEXT,
      station_nearby TEXT,
      total_spaces INTEGER DEFAULT 0,
      available_spaces INTEGER DEFAULT 0,
      price_per_hour REAL DEFAULT 0,
      is_pr INTEGER DEFAULT 1,
      status INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS intercity_buses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_no TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT,
      price REAL NOT NULL,
      total_seats INTEGER DEFAULT 45,
      available_seats INTEGER DEFAULT 45,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bus_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      bus_route_id INTEGER NOT NULL,
      passenger_name TEXT NOT NULL,
      passenger_id TEXT NOT NULL,
      seat_no TEXT,
      price REAL NOT NULL,
      status TEXT DEFAULT 'booked',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (bus_route_id) REFERENCES intercity_buses(id)
    );

    CREATE TABLE IF NOT EXISTS pois (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poi_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      phone TEXT,
      rating REAL DEFAULT 0,
      tags TEXT,
      metro_line TEXT,
      metro_station TEXT,
      discount_info TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weather_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region TEXT NOT NULL,
      date TEXT NOT NULL,
      weather TEXT,
      temperature_min REAL,
      temperature_max REAL,
      humidity INTEGER,
      wind_speed REAL,
      aqi INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(region, date)
    );

    CREATE TABLE IF NOT EXISTS user_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      points INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      total_points INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS point_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_code TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL,
      stock INTEGER DEFAULT 0,
      image_url TEXT,
      category TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS point_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      points_cost INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_info TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES point_products(id)
    );

    CREATE TABLE IF NOT EXISTS point_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      type TEXT NOT NULL,
      reason TEXT,
      related_transaction_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region_code TEXT UNIQUE NOT NULL,
      region_name TEXT NOT NULL,
      parent_code TEXT,
      level INTEGER DEFAULT 1,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS card_renewals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      renewal_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      card_id INTEGER NOT NULL,
      renewal_type TEXT NOT NULL,
      documents TEXT,
      review_status TEXT DEFAULT 'pending',
      reviewer_id INTEGER,
      review_comment TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (card_id) REFERENCES tianfutong_cards(id)
    );

    CREATE TABLE IF NOT EXISTS risk_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_code TEXT UNIQUE NOT NULL,
      rule_name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      threshold_value REAL,
      time_window INTEGER,
      action TEXT,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blocked_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      rule_code TEXT NOT NULL,
      reason TEXT,
      blocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved INTEGER DEFAULT 0,
      resolved_by INTEGER,
      resolved_at TEXT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT,
      role TEXT DEFAULT 'operator',
      region TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_card ON transactions(card_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_cards_user ON tianfutong_cards(user_id);
    CREATE INDEX IF NOT EXISTS idx_pois_category ON pois(category);
    CREATE INDEX IF NOT EXISTS idx_pois_metro ON pois(metro_line, metro_station);
  `);

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
  if (adminCount === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO admins (username, password, real_name, role, region)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', hash, '系统管理员', 'super_admin', '成都市');
  }

  const bcrypt = require('bcryptjs');
  const demoPhone = '13800000000';
  const demoPasswordHash = bcrypt.hashSync('123456', 10);
  let demoUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(demoPhone);

  if (!demoUser) {
    const result = db.prepare(`
      INSERT INTO users (phone, password, real_name, id_card, user_type, address, status)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(demoPhone, demoPasswordHash, '演示用户', '510100199001010018', 'student', '成都市锦江区春熙路');
    demoUser = { id: result.lastInsertRowid };
  } else {
    db.prepare(`
      UPDATE users
      SET password = ?, real_name = COALESCE(NULLIF(real_name, ''), '演示用户'), user_type = COALESCE(user_type, 'student'), status = 1
      WHERE id = ?
    `).run(demoPasswordHash, demoUser.id);
  }

  let demoCard = db.prepare('SELECT id, card_no FROM tianfutong_cards WHERE user_id = ? ORDER BY id LIMIT 1').get(demoUser.id);
  if (!demoCard) {
    const cardResult = db.prepare(`
      INSERT INTO tianfutong_cards (user_id, card_no, card_type, balance, times_count, expiry_date, region, nfc_enabled)
      VALUES (?, ?, 'student', 126.50, 38, '2027-12-31', '成都市', 1)
    `).run(demoUser.id, 'TF2026060701');
    demoCard = { id: cardResult.lastInsertRowid, card_no: 'TF2026060701' };
  }

  const demoPoints = db.prepare('SELECT id FROM user_points WHERE user_id = ?').get(demoUser.id);
  if (!demoPoints) {
    db.prepare('INSERT INTO user_points (user_id, points, level, total_points) VALUES (?, 2680, 3, 5280)').run(demoUser.id);
  } else {
    db.prepare('UPDATE user_points SET points = MAX(points, 2680), total_points = MAX(total_points, 5280), level = MAX(level, 3), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(demoUser.id);
  }

  const demoTransactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?').get(demoUser.id).count;
  if (demoTransactionCount < 3) {
    const insertTransaction = db.prepare(`
      INSERT OR IGNORE INTO transactions
      (transaction_no, user_id, card_id, card_no, transaction_type, amount, balance_before, balance_after, payment_channel, transport_type, route_name, station_in, station_out, status, risk_level, is_flagged)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    [
      ['TX202606070001', 'ride_complete', 3.00, 129.50, 126.50, '天府通学生卡', 'metro', '地铁2号线', '春熙路', '天府广场', 'success', 0, 0],
      ['TX202606070002', 'ride_complete', 2.00, 131.50, 129.50, '天府通学生卡', 'bus', '公交G1路', '火车北站', '天府广场', 'success', 0, 0],
      ['TX202606070003', 'recharge', 100.00, 31.50, 131.50, '支付宝', 'metro', '地铁1号线', '省体育馆', '金融城', 'success', 0, 0],
    ].forEach((tx) => insertTransaction.run(tx[0], demoUser.id, demoCard.id, demoCard.card_no, ...tx.slice(1)));
  }

  const regionCount = db.prepare('SELECT COUNT(*) as count FROM regions').get().count;
  if (regionCount === 0) {
    const regions = [
      { code: '510100', name: '成都市', parent: null, level: 1 },
      { code: '510104', name: '锦江区', parent: '510100', level: 2 },
      { code: '510105', name: '青羊区', parent: '510100', level: 2 },
      { code: '510106', name: '金牛区', parent: '510100', level: 2 },
      { code: '510107', name: '武侯区', parent: '510100', level: 2 },
      { code: '510108', name: '成华区', parent: '510100', level: 2 },
      { code: '510112', name: '龙泉驿区', parent: '510100', level: 2 },
      { code: '510113', name: '青白江区', parent: '510100', level: 2 },
      { code: '510114', name: '新都区', parent: '510100', level: 2 },
      { code: '510115', name: '温江区', parent: '510100', level: 2 },
      { code: '510116', name: '双流区', parent: '510100', level: 2 },
      { code: '510117', name: '郫都区', parent: '510100', level: 2 },
      { code: '510118', name: '新津区', parent: '510100', level: 2 },
      { code: '510121', name: '金堂县', parent: '510100', level: 2 },
      { code: '510129', name: '大邑县', parent: '510100', level: 2 },
      { code: '510131', name: '蒲江县', parent: '510100', level: 2 },
      { code: '510181', name: '都江堰市', parent: '510100', level: 2 },
      { code: '510182', name: '彭州市', parent: '510100', level: 2 },
      { code: '510183', name: '邛崃市', parent: '510100', level: 2 },
      { code: '510184', name: '崇州市', parent: '510100', level: 2 },
      { code: '513200', name: '阿坝州', parent: null, level: 1 },
    ];
    
    const insertRegion = db.prepare('INSERT INTO regions (region_code, region_name, parent_code, level) VALUES (?, ?, ?, ?)');
    regions.forEach(r => insertRegion.run(r.code, r.name, r.parent, r.level));
  }

  const routeCount = db.prepare('SELECT COUNT(*) as count FROM routes').get().count;
  if (routeCount === 0) {
    const routes = [
      { no: '1', name: '地铁1号线', type: 'metro', start: '韦家碾', end: '五根松', first: '06:10', last: '23:00', fare: 2.0, stations: ['韦家碾', '升仙湖', '火车北站', '人民北路', '文殊院', '骡马市', '天府广场', '锦江宾馆', '华西坝', '省体育馆', '倪家桥', '桐梓林', '火车南站', '高新', '金融城', '孵化园', '世纪城', '天府三街', '天府五街', '华府大道', '四河', '广都', '五根松'] },
      { no: '2', name: '地铁2号线', type: 'metro', start: '犀浦', end: '龙泉驿', first: '06:20', last: '22:30', fare: 2.0, stations: ['犀浦', '天河路', '百草路', '金周路', '金科北路', '迎宾大道', '茶店子客运站', '羊犀立交', '一品天下', '蜀汉路东', '白果林', '中医大省医院', '通惠门', '人民公园', '天府广场', '春熙路', '东门大桥', '牛王庙', '牛市口', '东大路', '塔子山公园', '成都东客站', '成渝立交', '惠王陵', '洪河', '成都行政学院', '大面铺', '连山坡', '界牌', '书房', '龙平路', '龙泉驿'] },
      { no: '3', name: '地铁3号线', type: 'metro', start: '成都医学院', end: '双流西站', first: '06:15', last: '23:05', fare: 2.0, stations: ['成都医学院', '石油大学', '钟楼', '马超西路', '团结新区', '锦水河', '三河场', '金华寺东路', '植物园', '军区总医院', '熊猫大道', '动物园', '昭觉寺南路', '驷马桥', '李家沱', '前锋路', '红星桥', '市二医院', '春熙路', '新南门', '磨子桥', '省体育馆', '衣冠庙', '高升桥', '红牌楼', '太平园', '川藏立交', '武青南路', '双凤桥', '龙桥路', '航都大街', '迎春桥', '东升', '双流广场', '三里坝', '双流西站'] },
      { no: '4', name: '地铁4号线', type: 'metro', start: '万盛', end: '西河', first: '06:10', last: '22:50', fare: 2.0, stations: ['万盛', '杨柳河', '凤溪河', '南熏大道', '光华公园', '涌泉', '凤凰大街', '马厂坝', '中坝', '成都西站', '清江西路', '文化宫', '西南财大', '草堂北路', '中医大省医院', '宽窄巷子', '骡马市', '太升南路', '市二医院', '玉双路', '双桥路', '万年场', '槐树店', '来龙', '十陵', '成都大学', '明蜀王陵', '西河'] },
      { no: '5', name: '地铁5号线', type: 'metro', start: '华桂路', end: '回龙', first: '06:10', last: '22:55', fare: 2.0, stations: ['华桂路', '柏水场', '廖家湾', '北部商贸城', '幸福桥', '九道堰', '杜家碾', '大丰', '石犀公园', '皇花园', '陆家桥', '泉水路', '洞子口', '福宁路', '五块石', '赛云台', '火车北站', '西北桥', '花牌坊', '抚琴', '中医大省医院', '青羊宫', '省骨科医院', '高升桥', '科园', '九兴大道', '神仙树', '石羊立交', '市一医院', '交子大道', '锦城大道', '锦城湖', '大源', '民乐', '骑龙', '警官学院', '二江寺', '南湖立交', '高峰', '回龙'] },
      { no: 'G1', name: '公交G1路', type: 'bus', start: '火车北站', end: '天府广场', first: '06:00', last: '23:00', fare: 2.0, stations: ['火车北站', '人民北路', '文武路', '顺城大街', '天府广场'] },
      { no: 'TR1', name: '有轨电车蓉1号线', type: 'tram', start: '火车北站', end: '郫县西站', first: '06:30', last: '22:30', fare: 2.0, stations: ['火车北站', '西南交大', '茶店子', '土桥', '犀浦', '郫县东', '郫县', '郫县西站'] },
      { no: 'S1', name: '市域铁路成灌线', type: 'suburban', start: '犀浦', end: '青城山', first: '06:30', last: '22:30', fare: 10.0, stations: ['犀浦', '红光镇', '郫县西', '安德', '都江堰', '青城山'] },
    ];
    
    const insertRoute = db.prepare('INSERT INTO routes (route_no, route_name, transport_type, start_station, end_station, first_departure, last_departure, fare, stations, crowding_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    routes.forEach(r => {
      const crowding = {};
      for (let h = 6; h <= 23; h++) {
        crowding[`${h}:00`] = Math.floor(Math.random() * 100);
      }
      insertRoute.run(r.no, r.name, r.type, r.start, r.end, r.first, r.last, r.fare, JSON.stringify(r.stations), JSON.stringify(crowding));
    });
  }

  const parkingCount = db.prepare('SELECT COUNT(*) as count FROM parking_lots').get().count;
  if (parkingCount === 0) {
    const lots = [
      { code: 'P001', name: '天府广场P+R停车场', address: '人民南路一段', station: '天府广场', total: 500, price: 5.0, pr: 1 },
      { code: 'P002', name: '春熙路P+R停车场', address: '红星路三段', station: '春熙路', total: 300, price: 8.0, pr: 1 },
      { code: 'P003', name: '火车北站P+R停车场', address: '人民北路二段', station: '火车北站', total: 800, price: 4.0, pr: 1 },
      { code: 'P004', name: '犀浦P+R停车场', address: '郫县犀浦镇', station: '犀浦', total: 400, price: 3.0, pr: 1 },
      { code: 'P005', name: '成都东客站P+R停车场', address: '邛崃山路', station: '成都东客站', total: 1000, price: 6.0, pr: 1 },
    ];
    
    const insertLot = db.prepare('INSERT INTO parking_lots (lot_code, lot_name, address, station_nearby, total_spaces, available_spaces, price_per_hour, is_pr) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    lots.forEach(l => insertLot.run(l.code, l.name, l.address, l.station, l.total, Math.floor(Math.random() * l.total), l.price, l.pr));
  }

  const poiCount = db.prepare('SELECT COUNT(*) as count FROM pois').get().count;
  if (poiCount === 0) {
    const pois = [
      { id: 'POI001', name: 'IFS国际金融中心', cat: 'shopping', sub: 'mall', addr: '红星路三段1号', lat: 30.6538, lng: 104.0816, phone: '028-88888888', rating: 4.8, line: '2号线', station: '春熙路', discount: '刷天府通享9折' },
      { id: 'POI002', name: '太古里', cat: 'shopping', sub: 'mall', addr: '中纱帽街8号', lat: 30.6542, lng: 104.0822, phone: '028-86666666', rating: 4.9, line: '2号线', station: '春熙路', discount: '地铁沿线商户优惠' },
      { id: 'POI003', name: '成都博物院', cat: 'culture', sub: 'museum', addr: '青羊区人民南路', lat: 30.6598, lng: 104.0653, phone: '028-87788877', rating: 4.7, line: '1号线', station: '天府广场', discount: '免费开放' },
      { id: 'POI004', name: '宽窄巷子', cat: 'tourism', sub: 'scenic', addr: '青羊区长顺上街', lat: 30.6723, lng: 104.0612, phone: '028-86633214', rating: 4.6, line: '4号线', station: '宽窄巷子', discount: '无' },
      { id: 'POI005', name: '锦里古街', cat: 'tourism', sub: 'scenic', addr: '武侯区武侯祠大街', lat: 30.6461, lng: 104.0428, phone: '028-85538914', rating: 4.5, line: '3号线', station: '高升桥', discount: '无' },
      { id: 'POI006', name: '小龙坎火锅(春熙店)', cat: 'food', sub: 'hotpot', addr: '红星路四段', lat: 30.6512, lng: 104.0835, phone: '028-81234567', rating: 4.6, line: '2号线', station: '春熙路', discount: '刷天府通立减10元' },
      { id: 'POI007', name: '万达影城(锦华店)', cat: 'movie', sub: 'cinema', addr: '锦华路一段', lat: 30.6287, lng: 104.0956, phone: '028-84456789', rating: 4.5, line: '2号线', station: '牛市口', discount: '周五六折' },
      { id: 'POI008', name: '香格里拉大酒店', cat: 'hotel', sub: 'luxury', addr: '滨江东路9号', lat: 30.6512, lng: 104.0897, phone: '028-88889999', rating: 4.8, line: '2号线', station: '东门大桥', discount: '会员专享价' },
    ];
    
    const insertPoi = db.prepare('INSERT INTO pois (poi_id, name, category, sub_category, address, latitude, longitude, phone, rating, metro_line, metro_station, discount_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    pois.forEach(p => insertPoi.run(p.id, p.name, p.cat, p.sub, p.addr, p.lat, p.lng, p.phone, p.rating, p.line, p.station, p.discount));
  }

  const weatherCount = db.prepare('SELECT COUNT(*) as count FROM weather_data').get().count;
  if (weatherCount === 0) {
    const weather = [
      { region: '成都市', date: '2026-06-07', weather: '多云', tmin: 22, tmax: 30, humidity: 65, wind: 2.5, aqi: 58 },
      { region: '锦江区', date: '2026-06-07', weather: '多云', tmin: 23, tmax: 31, humidity: 63, wind: 2.8, aqi: 62 },
      { region: '青羊区', date: '2026-06-07', weather: '多云', tmin: 22, tmax: 30, humidity: 67, wind: 2.3, aqi: 55 },
      { region: '武侯区', date: '2026-06-07', weather: '多云转晴', tmin: 22, tmax: 31, humidity: 64, wind: 2.6, aqi: 57 },
      { region: '阿坝州', date: '2026-06-07', weather: '小雨', tmin: 15, tmax: 22, humidity: 85, wind: 3.2, aqi: 35 },
    ];
    
    const insertWeather = db.prepare('INSERT INTO weather_data (region, date, weather, temperature_min, temperature_max, humidity, wind_speed, aqi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    weather.forEach(w => insertWeather.run(w.region, w.date, w.weather, w.tmin, w.tmax, w.humidity, w.wind, w.aqi));
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM point_products').get().count;
  if (productCount === 0) {
    const products = [
      { code: 'PTS001', name: '地铁次卡10次', desc: '可乘坐地铁10次，有效期90天', points: 500, stock: 1000, cat: 'transport' },
      { code: 'PTS002', name: '公交月卡', desc: '公交无限制乘坐30天', points: 1000, stock: 500, cat: 'transport' },
      { code: 'PTS003', name: '星巴克中杯券', desc: '星巴克任意中杯饮品兑换券', points: 800, stock: 200, cat: 'coupon' },
      { code: 'PTS004', name: '电影票兑换券', desc: '万达影城2D/3D通兑', points: 1200, stock: 300, cat: 'coupon' },
      { code: 'PTS005', name: '天府通定制雨伞', desc: '天府通联名定制晴雨两用伞', points: 1500, stock: 100, cat: 'merchandise' },
      { code: 'PTS006', name: '成都博物馆文创礼盒', desc: '成都博物馆官方文创周边', points: 2000, stock: 50, cat: 'merchandise' },
    ];
    
    const insertProduct = db.prepare('INSERT INTO point_products (product_code, product_name, description, points_cost, stock, category) VALUES (?, ?, ?, ?, ?, ?)');
    products.forEach(p => insertProduct.run(p.code, p.name, p.desc, p.points, p.stock, p.cat));
  }

  const riskCount = db.prepare('SELECT COUNT(*) as count FROM risk_rules').get().count;
  if (riskCount === 0) {
    const rules = [
      { code: 'RISK001', name: '高频交易检测', type: 'frequency', threshold: 10, window: 60, action: 'block' },
      { code: 'RISK002', name: '大额交易检测', type: 'amount', threshold: 500, window: 1440, action: 'review' },
      { code: 'RISK003', name: '跨区域异常', type: 'location', threshold: 3, window: 120, action: 'block' },
      { code: 'RISK004', name: '余额异常波动', type: 'balance', threshold: 1000, window: 60, action: 'review' },
    ];
    
    const insertRule = db.prepare('INSERT INTO risk_rules (rule_code, rule_name, rule_type, threshold_value, time_window, action) VALUES (?, ?, ?, ?, ?, ?)');
    rules.forEach(r => insertRule.run(r.code, r.name, r.type, r.threshold, r.window, r.action));
  }

  const busCount = db.prepare('SELECT COUNT(*) as count FROM intercity_buses').get().count;
  if (busCount === 0) {
    const buses = [
      { no: 'CD001', origin: '成都茶店子客运站', dest: '都江堰客运中心', depart: '07:00', arrive: '08:30', price: 28.0, seats: 45 },
      { no: 'CD002', origin: '成都茶店子客运站', dest: '都江堰客运中心', depart: '09:00', arrive: '10:30', price: 28.0, seats: 45 },
      { no: 'CD003', origin: '成都新南门客运站', dest: '峨眉山旅游客运站', depart: '08:00', arrive: '10:00', price: 45.0, seats: 45 },
      { no: 'CD004', origin: '成都新南门客运站', dest: '九寨沟客运站', depart: '07:30', arrive: '13:30', price: 158.0, seats: 45 },
      { no: 'CD005', origin: '成都五桂桥客运站', dest: '重庆菜园坝', depart: '06:30', arrive: '11:00', price: 98.0, seats: 45 },
    ];
    
    const insertBus = db.prepare('INSERT INTO intercity_buses (route_no, origin, destination, departure_time, arrival_time, price, total_seats, available_seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    buses.forEach(b => insertBus.run(b.no, b.origin, b.dest, b.depart, b.arrive, b.price, b.seats, Math.floor(Math.random() * b.seats)));
  }

  console.log('数据库初始化完成');
}

module.exports = { initDatabase };
