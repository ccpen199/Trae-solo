import { db } from './database.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

function seedTestData() {
  const venueCount = db.prepare('SELECT COUNT(*) as count FROM venues').get().count;
  if (venueCount > 0) {
    console.log('Test data already exists, skipping seed');
    return;
  }

  const insertVenue = db.prepare(`INSERT INTO venues (id, name, city, address, capacity, seat_config) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertSection = db.prepare(`INSERT INTO seat_sections (id, venue_id, name, rows, seats_per_row, price_level, base_price, is_blind_zone, coordinates) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertSeat = db.prepare(`INSERT INTO seats (id, section_id, row_label, seat_number, status, x, y, z) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  const venue1Id = uuidv4();
  insertVenue.run(venue1Id, '国家大剧院', '北京', '北京市西城区西长安街2号', 800, JSON.stringify({ has3D: true }));

  const venue1Sections = [
    { name: 'VIP区', rows: 3, seatsPerRow: 8, priceLevel: 'vip', basePrice: 880, isBlindZone: 0, x: 300, y: 50 },
    { name: 'A区', rows: 5, seatsPerRow: 10, priceLevel: 'premium', basePrice: 580, isBlindZone: 0, x: 300, y: 140 },
    { name: 'B区', rows: 6, seatsPerRow: 12, priceLevel: 'normal', basePrice: 380, isBlindZone: 0, x: 300, y: 260 },
    { name: 'C区(盲区)', rows: 4, seatsPerRow: 10, priceLevel: 'economy', basePrice: 180, isBlindZone: 1, x: 300, y: 400 }
  ];

  const allSections = [];

  venue1Sections.forEach(section => {
    const sectionId = uuidv4();
    allSections.push({ id: sectionId, venueId: venue1Id, ...section });
    insertSection.run(sectionId, venue1Id, section.name, section.rows, section.seatsPerRow, section.priceLevel, section.basePrice, section.isBlindZone, JSON.stringify({ x: section.x, y: section.y }));
    for (let r = 0; r < section.rows; r++) {
      const rowLabel = String.fromCharCode(65 + r);
      for (let s = 1; s <= section.seatsPerRow; s++) {
        const seatId = uuidv4();
        const x = section.x - (section.seatsPerRow * 20 / 2) + (s - 1) * 20 + 10;
        const y = section.y + r * 25;
        insertSeat.run(seatId, sectionId, rowLabel, s, 'available', x, y, 0);
      }
    }
  });

  const venue2Id = uuidv4();
  insertVenue.run(venue2Id, '上海文化广场', '上海', '上海市黄浦区永嘉路36号', 600, JSON.stringify({ has3D: true }));

  const venue2Sections = [
    { name: '池座', rows: 5, seatsPerRow: 10, priceLevel: 'vip', basePrice: 680, isBlindZone: 0, x: 280, y: 80 },
    { name: '楼座', rows: 6, seatsPerRow: 12, priceLevel: 'normal', basePrice: 380, isBlindZone: 0, x: 280, y: 240 }
  ];

  venue2Sections.forEach(section => {
    const sectionId = uuidv4();
    allSections.push({ id: sectionId, venueId: venue2Id, ...section });
    insertSection.run(sectionId, venue2Id, section.name, section.rows, section.seatsPerRow, section.priceLevel, section.basePrice, section.isBlindZone, JSON.stringify({ x: section.x, y: section.y }));
    for (let r = 0; r < section.rows; r++) {
      const rowLabel = String.fromCharCode(65 + r);
      for (let s = 1; s <= section.seatsPerRow; s++) {
        const seatId = uuidv4();
        const x = section.x - (section.seatsPerRow * 20 / 2) + (s - 1) * 20 + 10;
        const y = section.y + r * 25;
        insertSeat.run(seatId, sectionId, rowLabel, s, 'available', x, y, 0);
      }
    }
  });

  const venue3Id = uuidv4();
  insertVenue.run(venue3Id, '广州大剧院', '广州', '广州市天河区珠江西路1号', 500, JSON.stringify({ has3D: true }));
  const v3s1 = uuidv4();
  allSections.push({ id: v3s1, venueId: venue3Id, name: '普通区', rows: 5, seatsPerRow: 10, priceLevel: 'normal', basePrice: 280, isBlindZone: 0, x: 250, y: 150 });
  insertSection.run(v3s1, venue3Id, '普通区', 5, 10, 'normal', 280, 0, JSON.stringify({ x: 250, y: 150 }));
  for (let r = 0; r < 5; r++) {
    for (let s = 1; s <= 10; s++) {
      insertSeat.run(uuidv4(), v3s1, String.fromCharCode(65 + r), s, 'available', 250 - 100 + (s - 1) * 20 + 10, 150 + r * 25, 0);
    }
  }

  const insertEvent = db.prepare(`INSERT INTO events (id, title, type, category, description, poster_url, duration) VALUES (?, ?, ?, ?, ?, ?, ?)`);

  const posterBase = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=';

  const events = [
    { id: uuidv4(), title: '《巴黎圣母院》音乐剧', type: 'performance', category: 'musical', duration: 150, desc: '法国经典音乐剧中文版，震撼视听盛宴', poster: posterBase + 'musical%20notre%20dame%20stage' },
    { id: uuidv4(), title: '《茶馆》话剧', type: 'performance', category: 'drama', duration: 165, desc: '老舍经典话剧，北京人民艺术剧院出品', poster: posterBase + 'drama%20teahouse%20theater' },
    { id: uuidv4(), title: '周杰伦嘉年华巡演', type: 'concert', category: 'pop', duration: 180, desc: '周杰伦世界巡回演唱会', poster: posterBase + 'jay%20chou%20concert%20stage' },
    { id: uuidv4(), title: '五月天好好好想见到你', type: 'concert', category: 'rock', duration: 200, desc: '五月天巡回演唱会', poster: posterBase + 'mayday%20rock%20concert' },
    { id: uuidv4(), title: '梵高沉浸式艺术展', type: 'exhibition', category: 'art', duration: 120, desc: '梵高名作沉浸式光影体验', poster: posterBase + 'van%20gogh%20immersive%20art%20exhibition' },
    { id: uuidv4(), title: '莫奈的花园光影展', type: 'exhibition', category: 'art', duration: 90, desc: '莫奈印象派光影互动展', poster: posterBase + 'monet%20garden%20light%20exhibition' },
    { id: uuidv4(), title: '儿童剧《冰雪奇缘》', type: 'kids', category: 'children', duration: 90, desc: '迪士尼经典动画改编儿童舞台剧', poster: posterBase + 'frozen%20kids%20theater%20show' },
    { id: uuidv4(), title: '小猪佩奇舞台剧', type: 'kids', category: 'children', duration: 70, desc: '小猪佩奇亲子互动舞台剧', poster: posterBase + 'peppa%20pig%20kids%20show' },
  ];

  events.forEach(event => {
    insertEvent.run(event.id, event.title, event.type, event.category, event.desc, event.poster, event.duration);
  });

  const insertSession = db.prepare(`INSERT INTO sessions (id, event_id, venue_id, start_time, end_time, status, sale_start_time, sale_end_time, is_seckill, refund_policy, fee_rate, total_inventory, sold_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const now = dayjs();
  const allSessions = [];

  const sessionsConfig = [
    { eventIdx: 0, venueId: venue1Id, days: 3, isSeckill: 0, status: 'onsale', price: 580 },
    { eventIdx: 0, venueId: venue1Id, days: 10, isSeckill: 1, status: 'seckill', price: 380 },
    { eventIdx: 0, venueId: venue3Id, days: 15, isSeckill: 0, status: 'presale', price: 480 },
    { eventIdx: 1, venueId: venue1Id, days: 5, isSeckill: 0, status: 'onsale', price: 380 },
    { eventIdx: 1, venueId: venue2Id, days: 12, isSeckill: 0, status: 'onsale', price: 320 },
    { eventIdx: 2, venueId: venue2Id, days: 7, isSeckill: 0, status: 'presale', price: 680 },
    { eventIdx: 2, venueId: venue1Id, days: 14, isSeckill: 0, status: 'onsale', price: 880 },
    { eventIdx: 3, venueId: venue2Id, days: 8, isSeckill: 0, status: 'onsale', price: 580 },
    { eventIdx: 3, venueId: venue3Id, days: 20, isSeckill: 1, status: 'seckill', price: 480 },
    { eventIdx: 4, venueId: venue1Id, days: 1, isSeckill: 0, status: 'onsale', price: 280 },
    { eventIdx: 4, venueId: venue2Id, days: 6, isSeckill: 0, status: 'onsale', price: 220 },
    { eventIdx: 5, venueId: venue2Id, days: 4, isSeckill: 0, status: 'presale', price: 180 },
    { eventIdx: 6, venueId: venue2Id, days: 2, isSeckill: 0, status: 'onsale', price: 280 },
    { eventIdx: 6, venueId: venue1Id, days: 9, isSeckill: 0, status: 'onsale', price: 320 },
    { eventIdx: 7, venueId: venue3Id, days: 4, isSeckill: 0, status: 'onsale', price: 180 },
    { eventIdx: 7, venueId: venue2Id, days: 11, isSeckill: 0, status: 'presale', price: 160 },
  ];

  sessionsConfig.forEach(cfg => {
    const sessionId = uuidv4();
    const startTime = now.add(cfg.days, 'day').hour(19).minute(30);
    const endTime = now.add(cfg.days, 'day').hour(22);
    const venueCapacity = cfg.venueId === venue1Id ? 800 : cfg.venueId === venue2Id ? 600 : 500;
    const soldCount = Math.floor(Math.random() * venueCapacity * 0.4) + Math.floor(venueCapacity * 0.1);

    insertSession.run(
      sessionId, events[cfg.eventIdx].id, cfg.venueId,
      startTime.toISOString(), endTime.toISOString(), cfg.status,
      now.subtract(1, 'day').toISOString(),
      now.add(cfg.days, 'day').hour(18).toISOString(),
      cfg.isSeckill,
      JSON.stringify({ type: 'flexible', before24h: 0.1, before7d: 0.05, beforeStart: 0 }),
      cfg.isSeckill ? 0.2 : 0.1,
      venueCapacity, soldCount
    );

    allSessions.push({ id: sessionId, eventId: events[cfg.eventIdx].id, venueId: cfg.venueId, price: cfg.price, soldCount });

    const venueSeats = db.prepare('SELECT id, section_id FROM seats WHERE section_id IN (SELECT id FROM seat_sections WHERE venue_id = ?)').all(cfg.venueId);
    const insertSessionSeat = db.prepare(`INSERT INTO session_seats (id, session_id, seat_id, status, price) VALUES (?, ?, ?, ?, ?)`);
    const sectionMap = {};
    allSections.filter(s => s.venueId === cfg.venueId).forEach(s => { sectionMap[s.id] = s.basePrice; });

    venueSeats.forEach(seat => {
      const seatPrice = sectionMap[seat.section_id] || cfg.price;
      const isSold = Math.random() < (soldCount / venueCapacity);
      insertSessionSeat.run(uuidv4(), sessionId, seat.id, isSold ? 'sold' : 'available', seatPrice);
    });
  });

  const insertUser = db.prepare(`INSERT INTO users (id, phone, nickname, total_orders, total_spent, preference_tags, price_sensitivity, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  const testUsers = [
    { id: uuidv4(), phone: '13800138001', nickname: '文艺青年小王', orders: 23, spent: 8650, tags: 'performance,musical,drama', sensitivity: 0.3, risk: 0 },
    { id: uuidv4(), phone: '13800138002', nickname: '演唱会达人', orders: 45, spent: 23400, tags: 'concert,pop,rock', sensitivity: 0.5, risk: 1 },
    { id: uuidv4(), phone: '13800138003', nickname: '亲子家庭', orders: 12, spent: 4200, tags: 'kids,children,exhibition', sensitivity: 0.7, risk: 0 },
    { id: uuidv4(), phone: '13800138004', nickname: '展览爱好者', orders: 18, spent: 5600, tags: 'exhibition,art', sensitivity: 0.4, risk: 0 },
    { id: uuidv4(), phone: '13800138005', nickname: '黄牛嫌疑号', orders: 156, spent: 89000, tags: 'concert,pop', sensitivity: 0.1, risk: 3 },
    { id: uuidv4(), phone: '13800138006', nickname: '中等风险用户', orders: 67, spent: 34000, tags: 'concert,performance', sensitivity: 0.2, risk: 2 },
  ];

  testUsers.forEach(user => {
    insertUser.run(user.id, user.phone, user.nickname, user.orders, user.spent, user.tags, user.sensitivity, user.risk);
  });

  const insertOrder = db.prepare(`INSERT INTO orders (id, user_id, session_id, total_amount, status, payment_method, payment_time, refund_amount, refund_time, channel, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertOrderItem = db.prepare(`INSERT INTO order_items (id, order_id, session_seat_id, seat_id, price, ticket_id) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertTicket = db.prepare(`INSERT INTO tickets (id, order_id, user_id, session_id, seat_id, seat_info, qr_code, verify_code, watermark, status, verify_count, last_verify_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertVerifyRecord = db.prepare(`INSERT INTO verify_records (id, ticket_id, verify_method, verify_time, operator, result) VALUES (?, ?, ?, ?, ?, ?)`);

  const orderSeeds = [
    { userIdx: 0, sessionIdx: 0, seatCount: 2, status: 'paid', daysBefore: 3, channel: 'online' },
    { userIdx: 0, sessionIdx: 4, seatCount: 1, status: 'paid', daysBefore: 5, channel: 'online' },
    { userIdx: 1, sessionIdx: 5, seatCount: 3, status: 'paid', daysBefore: 2, channel: 'online' },
    { userIdx: 1, sessionIdx: 7, seatCount: 2, status: 'paid', daysBefore: 7, channel: 'online' },
    { userIdx: 2, sessionIdx: 12, seatCount: 3, status: 'paid', daysBefore: 1, channel: 'online' },
    { userIdx: 2, sessionIdx: 13, seatCount: 2, status: 'paid', daysBefore: 4, channel: 'online' },
    { userIdx: 3, sessionIdx: 9, seatCount: 1, status: 'paid', daysBefore: 6, channel: 'online' },
    { userIdx: 3, sessionIdx: 10, seatCount: 2, status: 'paid', daysBefore: 3, channel: 'online' },
    { userIdx: 0, sessionIdx: 1, seatCount: 1, status: 'paid', daysBefore: 8, channel: 'online' },
    { userIdx: 1, sessionIdx: 8, seatCount: 2, status: 'paid', daysBefore: 10, channel: 'online' },
    { userIdx: 4, sessionIdx: 5, seatCount: 5, status: 'paid', daysBefore: 1, channel: 'online' },
    { userIdx: 4, sessionIdx: 6, seatCount: 4, status: 'paid', daysBefore: 3, channel: 'online' },
    { userIdx: 5, sessionIdx: 7, seatCount: 3, status: 'paid', daysBefore: 2, channel: 'online' },
    { userIdx: 0, sessionIdx: 9, seatCount: 2, status: 'refunded', daysBefore: 12, channel: 'online' },
    { userIdx: 1, sessionIdx: 12, seatCount: 1, status: 'refunded', daysBefore: 9, channel: 'online' },
  ];

  orderSeeds.forEach(seed => {
    const orderId = uuidv4();
    const session = allSessions[seed.sessionIdx];
    const user = testUsers[seed.userIdx];
    const createdAt = now.subtract(seed.daysBefore, 'day');
    const paymentTime = createdAt.add(5, 'minute');
    const pricePerSeat = session.price;
    const totalAmount = pricePerSeat * seed.seatCount;

    const availableSeats = db.prepare(`
      SELECT ss.id, ss.seat_id, ss.price FROM session_seats ss
      JOIN seats s ON s.id = ss.seat_id
      WHERE ss.session_id = ? AND ss.status = 'available'
      LIMIT ?
    `).all(session.id, seed.seatCount);

    if (availableSeats.length < seed.seatCount) return;

    const actualTotal = availableSeats.reduce((sum, s) => sum + (s.price || pricePerSeat), 0);
    let refundAmount = 0;
    let refundTime = null;
    if (seed.status === 'refunded') {
      refundAmount = actualTotal * 0.9;
      refundTime = createdAt.add(1, 'day').toISOString();
    }

    insertOrder.run(orderId, user.id, session.id, actualTotal, seed.status, 'online', paymentTime.toISOString(), refundAmount, refundTime, seed.channel, createdAt.toISOString());

    availableSeats.forEach(seat => {
      const itemId = uuidv4();
      const ticketId = uuidv4();
      const verifyCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const qrData = `ticket:${ticketId}:${verifyCode}`;
      const watermark = `${user.id}:${Date.now()}`;

      insertOrderItem.run(itemId, orderId, seat.id, seat.seat_id, seat.price || pricePerSeat, ticketId);

      const seatInfo = db.prepare('SELECT s.row_label, s.seat_number, sec.name as section_name FROM seats s JOIN seat_sections sec ON sec.id = s.section_id WHERE s.id = ?').get(seat.seat_id);
      const seatInfoStr = seatInfo ? JSON.stringify({ row: seatInfo.row_label, number: seatInfo.seat_number, section: seatInfo.section_name }) : JSON.stringify({ seat_id: seat.seat_id });

      const ticketStatus = seed.status === 'refunded' ? 'refunded' : 'valid';
      insertTicket.run(ticketId, orderId, user.id, session.id, seat.seat_id, seatInfoStr, qrData, verifyCode, watermark, ticketStatus, 0, null, paymentTime.toISOString());

      if (seed.status === 'paid') {
        db.prepare('UPDATE session_seats SET status = ? WHERE id = ?').run('sold', seat.id);
      }
    });
  });

  const paidTickets = db.prepare("SELECT * FROM tickets WHERE status = 'valid' LIMIT 5").all();
  paidTickets.forEach((ticket, idx) => {
    if (idx < 2) {
      db.prepare("UPDATE tickets SET status = 'verified', verify_count = 1, last_verify_time = ? WHERE id = ?").run(now.subtract(1, 'day').toISOString(), ticket.id);
      insertVerifyRecord.run(uuidv4(), ticket.id, 'qrcode', now.subtract(1, 'day').toISOString(), '闸机系统', 'success');
    }
    if (idx === 2) {
      insertVerifyRecord.run(uuidv4(), ticket.id, 'nfc', now.subtract(2, 'hour').toISOString(), '手环核验', 'failed');
    }
  });

  const insertRiskRecord = db.prepare(`INSERT INTO user_risk_records (id, user_id, risk_type, risk_score, details) VALUES (?, ?, ?, ?, ?)`);

  const riskSeeds = [
    { userIdx: 4, type: 'batch_purchase', score: 85, details: '短时间大量购票，疑似黄牛囤票' },
    { userIdx: 4, type: 'high_frequency', score: 90, details: '1小时内购买5张不同场次票券' },
    { userIdx: 5, type: 'abnormal_pattern', score: 60, details: '购票频率异常，持续关注' },
    { userIdx: 4, type: 'resale_suspect', score: 75, details: '同一设备多账号购票' },
  ];

  riskSeeds.forEach(r => {
    insertRiskRecord.run(uuidv4(), testUsers[r.userIdx].id, r.type, r.score, r.details);
  });

  const insertMarketing = db.prepare(`INSERT INTO marketing_activities (id, name, type, config, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertABGroup = db.prepare(`INSERT INTO ab_test_groups (id, activity_id, group_name, weight, config, conversion_count, click_count) VALUES (?, ?, ?, ?, ?, ?, ?)`);

  const mkt1Id = uuidv4();
  insertMarketing.run(mkt1Id, '暑期演出优惠券', 'coupon', JSON.stringify({ discount: 50, minSpend: 200 }), now.subtract(3, 'day').toISOString(), now.add(30, 'day').toISOString(), 'active');
  insertABGroup.run(uuidv4(), mkt1Id, '对照组', 50, JSON.stringify({ couponValue: 30 }), 120, 580);
  insertABGroup.run(uuidv4(), mkt1Id, '实验组A', 50, JSON.stringify({ couponValue: 50 }), 185, 620);

  const mkt2Id = uuidv4();
  insertMarketing.run(mkt2Id, '亲子场立减活动', 'discount', JSON.stringify({ discount: 0.15 }), now.subtract(1, 'day').toISOString(), now.add(15, 'day').toISOString(), 'active');
  insertABGroup.run(uuidv4(), mkt2Id, '对照组', 50, JSON.stringify({ discount: 0.1 }), 45, 200);
  insertABGroup.run(uuidv4(), mkt2Id, '实验组B', 50, JSON.stringify({ discount: 0.15 }), 68, 210);

  const insertInventorySync = db.prepare(`INSERT INTO inventory_sync (id, session_id, channel, external_id, available_count, last_sync_time, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)`);

  const channels = ['maoyan', 'damai', 'offline'];
  allSessions.slice(0, 10).forEach(session => {
    channels.forEach(channel => {
      const available = Math.floor(Math.random() * 200) + 50;
      insertInventorySync.run(uuidv4(), session.id, channel, `EXT-${channel}-${Math.random().toString(36).substring(2, 8)}`, available, now.subtract(Math.floor(Math.random() * 60), 'minute').toISOString(), Math.random() > 0.1 ? 'success' : 'failed');
    });
  });

  const insertRiskRule = db.prepare(`INSERT INTO risk_rules (id, name, rule_type, config, is_active) VALUES (?, ?, ?, ?, ?)`);
  insertRiskRule.run(uuidv4(), '单用户限购', 'purchase_limit', JSON.stringify({ maxPerSession: 4, maxPerDay: 8 }), 1);
  insertRiskRule.run(uuidv4(), '高频购票拦截', 'frequency_limit', JSON.stringify({ maxPerHour: 3, windowMinutes: 60 }), 1);
  insertRiskRule.run(uuidv4(), '异常设备检测', 'device_fingerprint', JSON.stringify({ maxAccountsPerDevice: 2 }), 1);

  console.log('Test data seeded successfully');
}

export { seedTestData };
