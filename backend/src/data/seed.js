const bcrypt = require('bcryptjs');
const { db } = require('../models/db');
const { calculateBlockHash } = require('../utils/hash');

async function seedData() {
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count >= 4) {
    console.log('检查缺失角色账号...');
    const rolesToAdd = [
      { username: 'platform', role: 'platform', phone: '13800000004', desc: '平台管理员' },
      { username: 'ops', role: 'ops', phone: '13800000005', desc: '运营管理员' },
    ];
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (username, password_hash, phone, role)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const u of rolesToAdd) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username);
      if (!existing) {
        insertUser.run(u.username, hashedPassword, u.phone, u.role);
        console.log(`已添加 ${u.desc} 账号: ${u.username} / 123456`);
      }
    }
    
    if (db.prepare('SELECT id FROM users WHERE username = ?').get('platform') &&
        db.prepare('SELECT id FROM users WHERE username = ?').get('ops')) {
      console.log('种子数据已完整，跳过...');
      return;
    }
  }

  console.log('开始插入种子数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, phone, role)
    VALUES (?, ?, ?, ?)
  `);

  const adminResult = insertUser.run('admin', hashedPassword, '13800000000', 'admin');
  const adminId = adminResult.lastInsertRowid;

  const user1Result = insertUser.run('zhangsan', hashedPassword, '13800000001', 'user');
  const user1Id = user1Result.lastInsertRowid;

  const user2Result = insertUser.run('lisi', hashedPassword, '13800000002', 'user');
  const user2Id = user2Result.lastInsertRowid;

  const stationMasterResult = insertUser.run('stationmaster', hashedPassword, '13800000003', 'station_master');
  const stationMasterId = stationMasterResult.lastInsertRowid;

  const platformResult = insertUser.run('platform', hashedPassword, '13800000004', 'platform');
  const platformId = platformResult.lastInsertRowid;

  const opsResult = insertUser.run('ops', hashedPassword, '13800000005', 'ops');
  const opsId = opsResult.lastInsertRowid;

  console.log('插入用户数据完成');

  const insertCourierPrice = db.prepare(`
    INSERT INTO courier_prices (courier, min_weight, max_weight, price_per_kg, base_price, timeline)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const priceConfigs = [
    ['顺丰速运', 0, 1, 0, 18, 'express'],
    ['顺丰速运', 1, 5, 6, 18, 'express'],
    ['顺丰速运', 5, 20, 5, 18, 'express'],
    ['顺丰速运', 20, 100, 4, 18, 'express'],
    ['中通快递', 0, 1, 0, 10, 'standard'],
    ['中通快递', 1, 5, 4, 10, 'standard'],
    ['中通快递', 5, 20, 3.5, 10, 'standard'],
    ['中通快递', 20, 100, 3, 10, 'standard'],
    ['圆通速递', 0, 1, 0, 10, 'standard'],
    ['圆通速递', 1, 5, 4, 10, 'standard'],
    ['圆通速递', 5, 20, 3.5, 10, 'standard'],
    ['韵达快递', 0, 1, 0, 9, 'economy'],
    ['韵达快递', 1, 5, 3.5, 9, 'economy'],
    ['韵达快递', 5, 20, 3, 9, 'economy'],
    ['德邦快递', 0, 5, 0, 50, 'standard'],
    ['德邦快递', 5, 20, 8, 50, 'standard'],
    ['德邦快递', 20, 100, 6, 50, 'standard'],
    ['邮政EMS', 0, 1, 0, 15, 'standard'],
    ['邮政EMS', 1, 5, 5, 15, 'standard'],
    ['京东物流', 0, 1, 0, 12, 'express'],
    ['京东物流', 1, 5, 5, 12, 'express'],
    ['极兔速递', 0, 1, 0, 8, 'economy'],
    ['极兔速递', 1, 5, 3, 8, 'economy'],
  ];

  for (const config of priceConfigs) {
    insertCourierPrice.run(...config);
  }

  console.log('插入快递价格配置完成');

  const insertStation = db.prepare(`
    INSERT INTO stations (name, address, manager_id, contact, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const stations = [
    ['阳光社区驿站', '北京市朝阳区阳光路100号', stationMasterId, '13800000100', 'active'],
    ['幸福小区驿站', '北京市海淀区幸福路50号', stationMasterId, '13800000101', 'active'],
    ['和平花园驿站', '北京市西城区和平路30号', null, '13800000102', 'pending'],
  ];

  for (const station of stations) {
    insertStation.run(...station);
  }

  console.log('插入驿站数据完成');

  const insertParcel = db.prepare(`
    INSERT INTO parcels (tracking_number, courier, sender, receiver, receiver_phone, status, weight, volume, estimated_delivery, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertParcelEvent = db.prepare(`
    INSERT INTO parcel_events (parcel_id, event_type, location, description, operator, timestamp, hash, previous_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const parcels = [
    ['SF1234567890001', '顺丰速运', '王晓明', '张三', '13800000001', 'transit', 2.5, 0.05, '2024-01-20', user1Id],
    ['ZT1234567890002', '中通快递', '李小红', '张三', '13800000001', 'delivered', 1.2, 0.02, '2024-01-15', user1Id],
    ['YT1234567890003', '圆通速递', '赵小刚', '李四', '13800000002', 'out_for_delivery', 0.8, 0.01, '2024-01-18', user2Id],
    ['JD1234567890004', '京东物流', '孙小美', '张三', '13800000001', 'pending', 5.0, 0.1, '2024-01-22', user1Id],
    ['YD1234567890005', '韵达快递', '周大壮', '李四', '13800000002', 'exception', 3.0, 0.08, '2024-01-19', user2Id],
    ['DB1234567890006', '德邦快递', '吴大力', '李四', '13800000002', 'transit', 15.0, 0.5, '2024-01-25', user2Id],
  ];

  const eventTypes = ['已下单', '已揽收', '运输中', '到达中转站', '正在派送', '已签收'];
  const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市'];

  for (const parcel of parcels) {
    const result = insertParcel.run(...parcel);
    const parcelId = result.lastInsertRowid;

    const numEvents = parcel[5] === 'delivered' ? 6 : 
                      parcel[5] === 'pending' ? 1 :
                      Math.floor(Math.random() * 3) + 3;

    let previousHash = null;
    let baseTime = Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < numEvents; i++) {
      const eventType = i >= eventTypes.length ? eventTypes[eventTypes.length - 1] : eventTypes[i];
      const location = cities[Math.floor(Math.random() * cities.length)];
      const description = `${eventType}于${location}`;
      const operator = ['张师傅', '李师傅', '王师傅', '刘师傅'][Math.floor(Math.random() * 4)];
      const timestamp = new Date(baseTime + i * Math.random() * 24 * 60 * 60 * 1000).toISOString();

      const hash = calculateBlockHash(parcelId, eventType, location, timestamp, previousHash);
      insertParcelEvent.run(parcelId, eventType, location, description, operator, timestamp, hash, previousHash);
      previousHash = hash;
    }
  }

  console.log('插入包裹数据完成');

  const insertAnomaly = db.prepare(`
    INSERT INTO anomalies (parcel_id, type, description, status)
    VALUES (?, ?, ?, ?)
  `);

  const anomalyParcel = db.prepare('SELECT id FROM parcels WHERE tracking_number = ?').get('YD1234567890005');
  if (anomalyParcel) {
    insertAnomaly.run(
      anomalyParcel.id,
      'timeout',
      '包裹超过72小时未更新物流信息',
      'detected'
    );
  }

  console.log('插入异常数据完成');

  const insertPost = db.prepare(`
    INSERT INTO community_posts (user_id, type, title, content, reward, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const posts = [
    [user1Id, 'help_request', '求助代取快递', '今天加班，有没有邻居帮忙取一下快递，感谢！', 5.0, 'open'],
    [user2Id, 'help_offer', '提供代取快递服务', '本人时间充裕，可以帮邻居代取快递，服务费2元/件', 0, 'open'],
    [user1Id, 'help_request', '求帮忙搬运大件', '买了个洗衣机，有没有壮实的邻居帮忙搬上楼，有偿！', 20.0, 'claimed'],
    [stationMasterId, 'help_offer', '驿站代收服务', '阳光社区驿站提供快递代收服务，营业时间8:00-22:00', 0, 'open'],
  ];

  for (const post of posts) {
    insertPost.run(...post);
  }

  console.log('插入社区帖子数据完成');

  const insertRecycling = db.prepare(`
    INSERT INTO recycling_records (user_id, item_type, quantity, points)
    VALUES (?, ?, ?, ?)
  `);

  const recyclingRecords = [
    [user1Id, 'paper', 10, 50],
    [user1Id, 'plastic', 5, 15],
    [user2Id, 'glass', 3, 12],
    [user2Id, 'electronics', 2, 30],
    [user1Id, 'clothes', 8, 48],
  ];

  for (const record of recyclingRecords) {
    insertRecycling.run(...record);
  }

  console.log('插入回收记录数据完成');

  const insertPickupCode = db.prepare(`
    INSERT INTO pickup_codes (parcel_id, code, locker_id, expires_at, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const deliveredParcel = db.prepare('SELECT id FROM parcels WHERE status = ?').get('out_for_delivery');
  if (deliveredParcel) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    insertPickupCode.run(deliveredParcel.id, '123456', 'LOCKER-A01', expiresAt, 'active');
  }

  console.log('插入取件码数据完成');

  console.log('所有种子数据插入完成！');
  console.log('');
  console.log('测试账号：');
  console.log('  平台管理员: platform / 123456');
  console.log('  运营管理员: ops / 123456');
  console.log('  系统管理员: admin / 123456');
  console.log('  驿站站长: stationmaster / 123456');
  console.log('  普通用户: zhangsan / 123456');
  console.log('  普通用户: lisi / 123456');
}

module.exports = { seedData };
