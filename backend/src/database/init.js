const { db, initDatabase } = require('./index');
const bcrypt = require('bcryptjs');

function seedData() {
  initDatabase();

  const adminPassword = bcrypt.hashSync('admin123', 10);
  const userPassword = bcrypt.hashSync('user123', 10);

  const adminCheck = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminCheck) {
    db.prepare(`
      INSERT INTO users (username, email, password_hash, nickname, role, n_coins)
      VALUES (?, ?, ?, ?, 'admin', 10000)
    `).run('admin', 'admin@smart-mobility.com', adminPassword, '系统管理员');
    console.log('✅ Admin user created: admin / admin123');
  }

  const userCheck = db.prepare('SELECT id FROM users WHERE username = ?').get('zhangsan');
  if (!userCheck) {
    db.prepare(`
      INSERT INTO users (username, email, password_hash, nickname, n_coins, phone)
      VALUES (?, ?, ?, ?, 500, ?)
    `).run('zhangsan', 'zhangsan@example.com', userPassword, '张三', '13800138001');
    console.log('✅ Test user created: zhangsan / user123');
  }

  const userId = db.prepare("SELECT id FROM users WHERE username = 'zhangsan'").get().id;

  const devices = [
    { vin: 'SMART001SCOOTER0001', model: 'X-Pro 2024', status: 'active', battery_level: 85, mileage: 1250.5 },
    { vin: 'SMART001SCOOTER0002', model: 'X-Pro 2024', status: 'inactive', battery_level: 100, mileage: 0 },
    { vin: 'SMART002BIKE00003', model: 'E-Bike S1', status: 'active', battery_level: 60, mileage: 890.2 },
    { vin: 'SMART003WHEEL0004', model: 'OneWheel X', status: 'inactive', battery_level: 45, mileage: 320.0 }
  ];

  devices.forEach(d => {
    const existing = db.prepare('SELECT id FROM devices WHERE vin = ?').get(d.vin);
    if (!existing) {
      const stmt = db.prepare(`
        INSERT INTO devices (vin, model, firmware_version, status, user_id, battery_level, mileage, activated_at)
        VALUES (?, ?, '1.2.0', ?, ?, ?, ?, ?)
      `);
      const activatedAt = d.status === 'active' ? '2024-01-15 10:00:00' : null;
      const uid = d.status === 'active' ? userId : null;
      stmt.run(d.vin, d.model, d.status, uid, d.battery_level, d.mileage, activatedAt);
    }
  });
  console.log('✅ Devices seeded');

  const firmwares = [
    { version: '1.0.0', model: 'X-Pro 2024', changelog: '初始版本' },
    { version: '1.1.0', model: 'X-Pro 2024', changelog: '优化电池管理、新增骑行统计' },
    { version: '1.2.0', model: 'X-Pro 2024', changelog: '固件安全更新、性能优化' },
    { version: '1.3.0', model: 'X-Pro 2024', changelog: '新增电子围栏功能、修复已知问题', is_forced: 1 },
    { version: '1.0.0', model: 'E-Bike S1', changelog: '初始版本' },
    { version: '1.1.0', model: 'E-Bike S1', changelog: '优化助力模式' },
    { version: '1.0.0', model: 'OneWheel X', changelog: '初始版本' }
  ];

  firmwares.forEach(f => {
    const existing = db.prepare('SELECT id FROM firmware_versions WHERE version = ? AND model = ?').get(f.version, f.model);
    if (!existing) {
      db.prepare(`
        INSERT INTO firmware_versions (version, model, changelog, size, is_forced)
        VALUES (?, ?, ?, 15240000, ?)
      `).run(f.version, f.model, f.changelog, f.is_forced || 0);
    }
  });
  console.log('✅ Firmware versions seeded');

  const fences = [
    { name: '天安门禁行区', type: 'forbidden', city: '北京', speed_limit: 0, coords: [[39.9087, 116.3975], [39.9120, 116.4030], [39.9050, 116.4030], [39.9050, 116.3920]] },
    { name: '故宫周边限速区', type: 'speed_limit', city: '北京', speed_limit: 15, coords: [[39.9200, 116.3900], [39.9250, 116.4050], [39.9150, 116.4050], [39.9150, 116.3900]] },
    { name: '西湖景区禁行区', type: 'forbidden', city: '杭州', speed_limit: 0, coords: [[30.2500, 120.1400], [30.2600, 120.1500], [30.2400, 120.1500], [30.2400, 120.1300]] },
    { name: '陆家嘴限速区', type: 'speed_limit', city: '上海', speed_limit: 20, coords: [[31.2300, 121.5000], [31.2400, 121.5200], [31.2200, 121.5200], [31.2200, 121.4900]] }
  ];

  fences.forEach(f => {
    const existing = db.prepare('SELECT id FROM geo_fences WHERE name = ?').get(f.name);
    if (!existing) {
      db.prepare(`
        INSERT INTO geo_fences (name, type, geom_type, coordinates, speed_limit, city, description)
        VALUES (?, ?, 'polygon', ?, ?, ?, ?)
      `).run(f.name, f.type, JSON.stringify(f.coords), f.speed_limit, f.city, `${f.city}${f.type === 'forbidden' ? '禁行' : '限速'}区域`);
    }
  });
  console.log('✅ Geo fences seeded');

  const parkingSpots = [
    { name: '中关村地铁站A口', lat: 39.9831, lng: 116.3160, city: '北京', capacity: 50, available: 38, address: '海淀区中关村大街' },
    { name: '西二旗地铁站', lat: 40.0500, lng: 116.3000, city: '北京', capacity: 80, available: 65, address: '海淀区西二旗大街' },
    { name: '望京SOHO', lat: 39.9950, lng: 116.4750, city: '北京', capacity: 60, available: 42, address: '朝阳区望京街' },
    { name: '人民广场', lat: 31.2300, lng: 121.4737, city: '上海', capacity: 100, available: 78, address: '黄浦区人民大道' },
    { name: '西湖文化广场', lat: 30.2800, lng: 120.1500, city: '杭州', capacity: 40, available: 25, address: '西湖区文三路' }
  ];

  parkingSpots.forEach(p => {
    const existing = db.prepare('SELECT id FROM parking_spots WHERE name = ?').get(p.name);
    if (!existing) {
      db.prepare(`
        INSERT INTO parking_spots (name, lat, lng, capacity, available, address, city)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(p.name, p.lat, p.lng, p.capacity, p.available, p.address, p.city);
    }
  });
  console.log('✅ Parking spots seeded');

  const device1 = db.prepare("SELECT id FROM devices WHERE vin = 'SMART001SCOOTER0001'").get().id;
  
  const rideCheck = db.prepare('SELECT COUNT(*) as count FROM ride_records WHERE device_id = ?').get(device1).count;
  if (rideCheck === 0) {
    const rides = [
      { date: '2024-05-01 08:30:00', distance: 5.2, duration: 1200, avg_speed: 15.6, max_speed: 25.3, elevation: 45 },
      { date: '2024-05-02 18:00:00', distance: 8.7, duration: 2100, avg_speed: 14.9, max_speed: 28.1, elevation: 78 },
      { date: '2024-05-03 09:15:00', distance: 3.4, duration: 900, avg_speed: 13.6, max_speed: 22.0, elevation: 23 }
    ];

    rides.forEach((r, idx) => {
      const startDate = new Date(r.date);
      const endDate = new Date(startDate.getTime() + r.duration * 1000);
      
      const result = db.prepare(`
        INSERT INTO ride_records (device_id, user_id, start_time, end_time, distance, duration, avg_speed, max_speed, start_lat, start_lng, end_lat, end_lng, elevation_gain, avg_battery_temp, max_battery_temp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(device1, userId, startDate.toISOString(), endDate.toISOString(), r.distance, r.duration, r.avg_speed, r.max_speed, 
             39.98 + idx * 0.01, 116.31 + idx * 0.01, 39.99 + idx * 0.01, 116.33 + idx * 0.01, r.elevation, 32 + idx * 2, 38 + idx * 3);

      const rideId = result.lastInsertRowid;
      
      for (let i = 0; i < 20; i++) {
        const t = new Date(startDate.getTime() + (r.duration * i / 20) * 1000);
        const lat = 39.98 + idx * 0.01 + (0.01 * i / 20);
        const lng = 116.31 + idx * 0.01 + (0.02 * i / 20);
        const speed = r.avg_speed + Math.sin(i * 0.5) * 5;
        const altitude = 50 + Math.sin(i * 0.3) * 20 + r.elevation * i / 20;
        const batteryTemp = 30 + i * 0.3 + idx * 2;
        const batteryLevel = 85 - (i * 0.5);

        db.prepare(`
          INSERT INTO ride_points (ride_id, timestamp, lat, lng, speed, altitude, slope, battery_temp, battery_level)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(rideId, t.toISOString(), lat, lng, speed, altitude, Math.random() * 5 - 2.5, batteryTemp, batteryLevel);
      }
    });
    console.log('✅ Ride records seeded');
  }

  const clubs = [
    { name: '北京骑行俱乐部', desc: '北京地区最大的智能骑行爱好者社区', owner: 'zhangsan' },
    { name: '魔都电动滑板车友会', desc: '上海滑板爱好者聚集地', owner: 'admin' },
    { name: '西湖慢骑团', desc: '杭州休闲骑行社团', owner: 'zhangsan' }
  ];

  clubs.forEach(c => {
    const existing = db.prepare('SELECT id FROM clubs WHERE name = ?').get(c.name);
    if (!existing) {
      const ownerId = db.prepare('SELECT id FROM users WHERE username = ?').get(c.owner).id;
      const result = db.prepare(`
        INSERT INTO clubs (name, description, owner_id, member_count)
        VALUES (?, ?, ?, 1)
      `).run(c.name, c.desc, ownerId);
      
      db.prepare(`
        INSERT INTO club_members (club_id, user_id, role)
        VALUES (?, ?, 'owner')
      `).run(result.lastInsertRowid, ownerId);
    }
  });
  console.log('✅ Clubs seeded');

  const faultCodes = [
    { code: 'E001', description: '电池通信异常', severity: 'warning', action: '检查电池连接，重启设备', cost: 0 },
    { code: 'E002', description: '刹车系统故障', severity: 'danger', action: '请立即停止使用，联系售后', cost: 200 },
    { code: 'E003', description: '轮胎压力异常', severity: 'info', action: '请检查轮胎气压', cost: 50 },
    { code: 'E004', description: '控制器过热', severity: 'warning', action: '停机冷却，避免长时间高速行驶', cost: 0 },
    { code: 'E005', description: '电机故障', severity: 'danger', action: '请联系专业维修人员', cost: 800 },
    { code: 'E006', description: '灯光系统异常', severity: 'info', action: '检查灯泡和线路', cost: 100 }
  ];

  faultCodes.forEach(f => {
    const existing = db.prepare('SELECT id FROM fault_codes WHERE code = ?').get(f.code);
    if (!existing) {
      db.prepare(`
        INSERT INTO fault_codes (code, description, severity, recommended_action, estimated_cost)
        VALUES (?, ?, ?, ?, ?)
      `).run(f.code, f.description, f.severity, f.action, f.cost);
    }
  });
  console.log('✅ Fault codes seeded');

  const serviceShops = [
    { name: '北京中关村服务中心', address: '海淀区中关村大街1号', city: '北京', lat: 39.9831, lng: 116.3160, phone: '010-12345678', hours: '周一至周日 9:00-20:00' },
    { name: '北京朝阳服务站', address: '朝阳区建国路88号', city: '北京', lat: 39.9087, lng: 116.4550, phone: '010-87654321', hours: '周一至周日 10:00-19:00' },
    { name: '上海陆家嘴服务中心', address: '浦东新区世纪大道100号', city: '上海', lat: 31.2300, lng: 121.5000, phone: '021-12345678', hours: '周一至周日 9:00-21:00' },
    { name: '杭州西湖服务站', address: '西湖区文三路200号', city: '杭州', lat: 30.2800, lng: 120.1500, phone: '0571-12345678', hours: '周一至周日 9:30-18:30' }
  ];

  serviceShops.forEach(s => {
    const existing = db.prepare('SELECT id FROM service_shops WHERE name = ?').get(s.name);
    if (!existing) {
      db.prepare(`
        INSERT INTO service_shops (name, address, city, lat, lng, phone, business_hours, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, 4.8)
      `).run(s.name, s.address, s.city, s.lat, s.lng, s.phone, s.hours);
    }
  });
  console.log('✅ Service shops seeded');

  const spareParts = [
    { sku: 'BAT-001', name: '锂电池组 36V/10Ah', category: '电池', price: 899, stock: 50 },
    { sku: 'BAT-002', name: '锂电池组 48V/15Ah', category: '电池', price: 1299, stock: 30 },
    { sku: 'TIRE-001', name: '8.5寸真空胎', category: '轮胎', price: 99, stock: 200 },
    { sku: 'TIRE-002', name: '10寸充气轮胎', category: '轮胎', price: 129, stock: 150 },
    { sku: 'BRK-001', name: '碟刹器总成', category: '刹车', price: 259, stock: 80 },
    { sku: 'BRK-002', name: '刹车片（一对）', category: '刹车', price: 49, stock: 300 },
    { sku: 'MTR-001', name: '轮毂电机 350W', category: '电机', price: 599, stock: 20 },
    { sku: 'CTL-001', name: '控制器 36V', category: '控制器', price: 399, stock: 40 },
    { sku: 'LGT-001', name: 'LED前大灯', category: '灯光', price: 159, stock: 100 },
    { sku: 'ACC-001', name: '手机支架', category: '配件', price: 79, stock: 500 }
  ];

  spareParts.forEach(p => {
    const existing = db.prepare('SELECT id FROM spare_parts WHERE sku = ?').get(p.sku);
    if (!existing) {
      db.prepare(`
        INSERT INTO spare_parts (sku, name, category, price, stock, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(p.sku, p.name, p.category, p.price, p.stock, `${p.name} - 原厂正品`);
    }
  });
  console.log('✅ Spare parts seeded');

  const products = [
    { sku: 'SCT-XPRO', name: 'X-Pro 2024 电动滑板车', category: '整车', price: 3999, original_price: 4599, stock: 50, desc: '高性能电动滑板车，续航50km', preorder: false },
    { sku: 'BIKE-S1', name: 'E-Bike S1 电动自行车', category: '整车', price: 5999, original_price: 6499, stock: 30, desc: '轻便助力自行车，长续航', preorder: false },
    { sku: 'WHL-X', name: 'OneWheel X 独轮平衡车', category: '整车', price: 8999, stock: 15, desc: '极限运动独轮车', preorder: false },
    { sku: 'SCT-XPRO-MAX', name: 'X-Pro Max 2024 旗舰版', category: '整车', price: 5999, stock: 0, desc: '超长续航旗舰版，续航80km', preorder: true, deposit: 599, release: '2024-12-01' },
    { sku: 'ACC-HELMET', name: '智能安全头盔', category: '配件', price: 399, stock: 200, desc: '带转向灯和尾灯的智能头盔', preorder: false },
    { sku: 'ACC-BAG', name: '车首包', category: '配件', price: 129, stock: 300, desc: '防水车首包，容量5L', preorder: false },
    { sku: 'ACC-LOCK', name: '指纹防盗锁', category: '配件', price: 299, stock: 150, desc: '智能指纹锁，APP解锁', preorder: false }
  ];

  products.forEach(p => {
    const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(p.sku);
    if (!existing) {
      db.prepare(`
        INSERT INTO products (sku, name, category, price, original_price, stock, description, is_preorder, preorder_deposit, preorder_release_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(p.sku, p.name, p.category, p.price, p.original_price || null, p.stock, p.desc, 
             p.preorder ? 1 : 0, p.deposit || null, p.release || null);
    }
  });
  console.log('✅ Products seeded');

  const technicians = [
    { name: '李师傅', shop: '北京中关村服务中心', phone: '13800000001', skills: '电池更换,电机维修,控制器维修' },
    { name: '王师傅', shop: '北京中关村服务中心', phone: '13800000002', skills: '轮胎更换,刹车调试,灯光维修' },
    { name: '张师傅', shop: '上海陆家嘴服务中心', phone: '13900000001', skills: '全面维修,故障诊断' },
    { name: '陈师傅', shop: '杭州西湖服务站', phone: '13700000001', skills: '电池维修,电路检修' }
  ];

  technicians.forEach(t => {
    const existing = db.prepare('SELECT id FROM technicians WHERE name = ?').get(t.name);
    if (!existing) {
      const shopId = db.prepare('SELECT id FROM service_shops WHERE name = ?').get(t.shop)?.id;
      if (shopId) {
        db.prepare(`
          INSERT INTO technicians (name, shop_id, phone, skills, rating, status)
          VALUES (?, ?, ?, ?, 4.9, 'available')
        `).run(t.name, shopId, t.phone, t.skills);
      }
    }
  });
  console.log('✅ Technicians seeded');

  const topics = [
    { user: 'zhangsan', title: '分享我的X-Pro 500公里使用心得', content: '入手X-Pro已经三个月了，总体非常满意...', city: '北京', status: 'approved' },
    { user: 'admin', title: '新款X-Pro Max即将发布，敬请期待', content: '旗舰版车型，续航升级到80km...', city: '北京', status: 'approved' },
    { user: 'zhangsan', title: '求问北京哪里有靠谱的改装店', content: '想改一下车灯和刹车，有推荐的吗？', city: '北京', status: 'pending' }
  ];

  topics.forEach(t => {
    const existing = db.prepare('SELECT id FROM topics WHERE title = ?').get(t.title);
    if (!existing) {
      const userId = db.prepare('SELECT id FROM users WHERE username = ?').get(t.user).id;
      db.prepare(`
        INSERT INTO topics (user_id, title, content, city, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, t.title, t.content, t.city, t.status);
    }
  });
  console.log('✅ Topics seeded');

  console.log('\n🎉 All seed data loaded successfully!');
}

if (require.main === module) {
  seedData();
  db.close();
}

module.exports = { seedData };
