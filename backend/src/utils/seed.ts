import { getDb, initTables, safeStringify } from '../database';
import { hashPassword } from './password';

async function seed() {
  const db = getDb();
  initTables();

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount > 0) {
    console.log('核心数据已存在，检查补充数据...');

    const lockerCount = (db.prepare('SELECT COUNT(*) as count FROM locker_stations').get() as any).count;
    if (lockerCount === 0) {
      const branch1Id = (db.prepare('SELECT id FROM branches WHERE code = ?').get('CY-001') as any)?.id || 1;
      const branch2Id = (db.prepare('SELECT id FROM branches WHERE code = ?').get('HD-001') as any)?.id || 2;
      const insertLS = db.prepare('INSERT INTO locker_stations (name, code, type, address, total_slots, used_slots, branch_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      [{ n:'朝阳智能柜A1', c:'LK-CY-001', t:'locker', a:'北京市朝阳区建国路88号1楼', ts:60, us:42, b:branch1Id },
       { n:'朝阳驿站中心', c:'ST-CY-001', t:'station', a:'北京市朝阳区望京SOHO T1底商', ts:200, us:156, b:branch1Id },
       { n:'海淀智能柜B1', c:'LK-HD-001', t:'locker', a:'北京市海淀区中关村大街66号B座', ts:80, us:55, b:branch2Id },
       { n:'海淀柜机C1', c:'CB-HD-001', t:'locker', a:'北京市海淀区西二旗辉煌国际1楼', ts:40, us:28, b:branch2Id },
      ].forEach(s => insertLS.run(s.n, s.c, s.t, s.a, s.ts, s.us, s.b, 'active'));
      console.log('- 补充柜机驿站数据');
    }

    const cgCount = (db.prepare('SELECT COUNT(*) as count FROM customer_groups').get() as any).count;
    if (cgCount === 0) {
      const branch1Id = (db.prepare('SELECT id FROM branches WHERE code = ?').get('CY-001') as any)?.id || 1;
      const branch2Id = (db.prepare('SELECT id FROM branches WHERE code = ?').get('HD-001') as any)?.id || 2;
      const insertCG = db.prepare('INSERT INTO customer_groups (name, type, customer_count, total_orders, avg_fee, branch_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?)');
      [{ n:'朝阳VIP客户群', t:'vip', cc:120, to:1560, af:12.5, b:branch1Id, tg:'高频,优质' },
       { n:'朝阳普通客户群', t:'normal', cc:580, to:3200, af:8.2, b:branch1Id, tg:'常规' },
       { n:'海淀VIP客户群', t:'vip', cc:95, to:1280, af:13.8, b:branch2Id, tg:'高频,优质' },
       { n:'海淀普通客户群', t:'normal', cc:420, to:2100, af:7.6, b:branch2Id, tg:'常规' },
       { n:'企业客户群', t:'enterprise', cc:35, to:890, af:25.0, b:branch1Id, tg:'批量,大客户' },
      ].forEach(g => insertCG.run(g.n, g.t, g.cc, g.to, g.af, g.b, g.tg));
      console.log('- 补充客户分群数据');
    }

    const prCount = (db.prepare('SELECT COUNT(*) as count FROM performance_records').get() as any).count;
    if (prCount === 0) {
      const userIds = (db.prepare('SELECT id FROM users WHERE role = ?').all('ops') as any[]).map(u => u.id);
      const branch1Id = (db.prepare('SELECT id FROM branches WHERE code = ?').get('CY-001') as any)?.id || 1;
      const branch2Id = (db.prepare('SELECT id FROM branches WHERE code = ?').get('HD-001') as any)?.id || 2;
      const insertPR = db.prepare('INSERT INTO performance_records (user_id, period, total_tasks, completed_tasks, failed_tasks, on_time_rate, customer_score, total_fee, bonus, deduction, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      [{ u:userIds[0]||4, p:'2024-05', tt:45, ct:42, ft:3, or:93.3, cs:4.5, tf:680, bn:120, dn:15, b:branch1Id },
       { u:userIds[0]||4, p:'2024-06', tt:52, ct:50, ft:2, or:96.2, cs:4.7, tf:780, bn:150, dn:10, b:branch1Id },
       { u:userIds[1]||5, p:'2024-05', tt:38, ct:36, ft:2, or:94.7, cs:4.3, tf:560, bn:80, dn:20, b:branch1Id },
       { u:userIds[1]||5, p:'2024-06', tt:41, ct:39, ft:2, or:95.1, cs:4.4, tf:610, bn:100, dn:15, b:branch2Id },
       { u:userIds[2]||6, p:'2024-05', tt:33, ct:31, ft:2, or:93.9, cs:4.6, tf:490, bn:90, dn:25, b:branch2Id },
       { u:userIds[2]||6, p:'2024-06', tt:40, ct:38, ft:2, or:95.0, cs:4.8, tf:600, bn:130, dn:10, b:branch2Id },
      ].forEach(r => insertPR.run(r.u, r.p, r.tt, r.ct, r.ft, r.or, r.cs, r.tf, r.bn, r.dn, r.b));
      console.log('- 补充绩效数据');
    }

    const soCount = (db.prepare('SELECT COUNT(*) as count FROM shop_orders').get() as any).count;
    if (soCount === 0) {
      const userIds = (db.prepare('SELECT id FROM users WHERE role = ?').all('ops') as any[]).map(u => u.id);
      const branch1Id = (db.prepare('SELECT id FROM branches WHERE code = ?').get('CY-001') as any)?.id || 1;
      const branch2Id = (db.prepare('SELECT id FROM branches WHERE code = ?').get('HD-001') as any)?.id || 2;
      const insertSO = db.prepare('INSERT INTO shop_orders (order_no, customer_name, customer_phone, product_name, quantity, amount, status, tracking_no, branch_id, courier_id, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      [{ on:'WD20240601001', cn:'陈先生', cp:'13900001001', pn:'快递袋(大号)x50', q:1, a:25, s:'completed', tn:null, b:branch1Id, ci:userIds[0]||4, sr:'wechat' },
       { on:'WD20240601002', cn:'周女士', cp:'13900001002', pn:'包装纸箱x20', q:2, a:48, s:'shipped', tn:'SF20240601000001', b:branch1Id, ci:userIds[0]||4, sr:'wechat' },
       { on:'WD20240601003', cn:'吴先生', cp:'13900001003', pn:'气泡膜卷x5', q:5, a:75, s:'processing', tn:null, b:branch1Id, ci:null, sr:'douyin' },
       { on:'WD20240601004', cn:'孙女士', cp:'13900001004', pn:'封箱胶带x10', q:10, a:30, s:'pending', tn:null, b:branch1Id, ci:null, sr:'taobao' },
       { on:'WD20240601005', cn:'郑先生', cp:'13900001005', pn:'快递袋(小号)x100', q:1, a:35, s:'completed', tn:null, b:branch2Id, ci:userIds[1]||5, sr:'wechat' },
       { on:'WD20240601006', cn:'冯女士', cp:'13900001006', pn:'标签纸x3', q:3, a:18, s:'cancelled', tn:null, b:branch2Id, ci:null, sr:'wechat' },
       { on:'WD20240601007', cn:'褚先生', cp:'13900001007', pn:'包装纸箱x50', q:1, a:120, s:'processing', tn:null, b:branch2Id, ci:null, sr:'douyin' },
       { on:'WD20240601008', cn:'卫女士', cp:'13900001008', pn:'快递袋(中号)x80', q:2, a:56, s:'shipped', tn:'SF20240601000010', b:branch2Id, ci:userIds[2]||6, sr:'wechat' },
      ].forEach(o => insertSO.run(o.on, o.cn, o.cp, o.pn, o.q, o.a, o.s, o.tn, o.b, o.ci, o.sr));
      console.log('- 补充微店订单数据');
    }

    return;
  }

  console.log('开始初始化种子数据...');

  const insertUser = db.prepare(`
    INSERT INTO users (username, phone, password_hash, name, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const adminHash = await hashPassword('admin123');
  const platformHash = await hashPassword('platform123');
  const opsHash = await hashPassword('ops123');

  const users = [
    { username: 'admin', phone: '13800000001', hash: adminHash, name: '系统管理员', role: 'admin' as const },
    { username: 'platform01', phone: '13800000002', hash: platformHash, name: '张经理', role: 'platform' as const },
    { username: 'platform02', phone: '13800000003', hash: platformHash, name: '李经理', role: 'platform' as const },
    { username: 'ops01', phone: '13800000004', hash: opsHash, name: '王快递', role: 'ops' as const },
    { username: 'ops02', phone: '13800000005', hash: opsHash, name: '赵快递', role: 'ops' as const },
    { username: 'ops03', phone: '13800000006', hash: opsHash, name: '刘快递', role: 'ops' as const },
  ];

  const userIds: number[] = [];
  for (const u of users) {
    const result = insertUser.run(u.username, u.phone, u.hash, u.name, u.role, 'active');
    userIds.push(Number(result.lastInsertRowid));
  }

  const insertBranch = db.prepare(`
    INSERT INTO branches (name, code, address, manager_id, brand_partners, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const branch1 = insertBranch.run(
    '朝阳快递网点',
    'CY-001',
    '北京市朝阳区建国路88号',
    userIds[1],
    safeStringify(['顺丰', '中通', '圆通']),
    'active'
  );
  const branch1Id = Number(branch1.lastInsertRowid);

  const branch2 = insertBranch.run(
    '海淀快递网点',
    'HD-001',
    '北京市海淀区中关村大街66号',
    userIds[2],
    safeStringify(['韵达', '极兔', '中通']),
    'active'
  );
  const branch2Id = Number(branch2.lastInsertRowid);

  const brands = ['顺丰', '中通', '圆通', '韵达', '极兔'] as const;
  const statuses = ['pending', 'inbound', 'stored', 'outbound', 'signed', 'exception'] as const;
  const insertPackage = db.prepare(`
    INSERT INTO packages (tracking_no, brand, type, status, branch_id, courier_id, sender_name, sender_phone, receiver_name, receiver_phone, weight, fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const senderNames = ['陈先生', '周女士', '吴先生', '孙女士', '郑先生', '冯女士', '褚先生', '卫女士', '蒋先生', '沈女士'];
  const receiverNames = ['韩先生', '杨女士', '朱先生', '秦女士', '许先生', '何女士', '吕先生', '施女士', '张先生', '孔女士'];

  for (let i = 0; i < 30; i++) {
    const brand = brands[i % 5];
    const status = statuses[i % 6];
    const branchId = i < 15 ? branch1Id : branch2Id;
    const courierId = i < 15 ? userIds[3 + (i % 3)] : userIds[3 + ((i + 1) % 3)];
    const pkgType = i % 3 === 0 ? 'outbound' : 'inbound';
    const weight = +(0.5 + Math.random() * 9.5).toFixed(1);
    const fee = +(5 + Math.random() * 25).toFixed(1);
    const senderIdx = i % 10;
    const receiverIdx = (i + 3) % 10;
    const trackingNo = `SF${String(20240601000001 + i).padStart(14, '0')}`;

    insertPackage.run(
      trackingNo,
      brand,
      pkgType,
      status,
      branchId,
      ['pending', 'inbound'].includes(status) ? null : courierId,
      senderNames[senderIdx],
      `1390000${String(1001 + senderIdx).padStart(4, '0')}`,
      receiverNames[receiverIdx],
      `1390000${String(2001 + receiverIdx).padStart(4, '0')}`,
      weight,
      fee
    );
  }

  const insertTask = db.prepare(`
    INSERT INTO pickup_tasks (task_no, type, status, branch_id, courier_id, tracking_no, sender_name, sender_phone, receiver_name, receiver_phone, address, scheduled_time, fee, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const taskTypes = ['pickup', 'delivery'] as const;
  const taskStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'failed'] as const;
  const addresses = [
    '北京市朝阳区望京SOHO T1', '北京市朝阳区三里屯路19号',
    '北京市海淀区五道口华联商场', '北京市海淀区西二旗辉煌国际',
    '北京市朝阳区国贸CBD建外SOHO', '北京市海淀区上地十街百度大厦',
  ];

  for (let i = 0; i < 20; i++) {
    const taskType = taskTypes[i % 2];
    const taskStatus = taskStatuses[i % 5];
    const branchId = i < 10 ? branch1Id : branch2Id;
    const courierId = ['pending'].includes(taskStatus) ? null : userIds[3 + (i % 3)];
    const senderIdx = i % 10;
    const receiverIdx = (i + 2) % 10;
    const taskNo = `TK${String(20240601001 + i).padStart(11, '0')}`;
    const fee = +(3 + Math.random() * 15).toFixed(1);

    insertTask.run(
      taskNo,
      taskType,
      taskStatus,
      branchId,
      courierId,
      i < 30 ? `SF${String(20240601000001 + i).padStart(14, '0')}` : null,
      senderNames[senderIdx],
      `1390000${String(1001 + senderIdx).padStart(4, '0')}`,
      receiverNames[receiverIdx],
      `1390000${String(2001 + receiverIdx).padStart(4, '0')}`,
      addresses[i % addresses.length],
      `2024-06-0${1 + (i % 9)} ${9 + (i % 8)}:00:00`,
      fee,
      i % 4 === 0 ? '请轻拿轻放' : null
    );
  }

  const insertSettlement = db.prepare(`
    INSERT INTO settlements (period, branch_id, courier_id, total_tasks, total_fee, bonus, deduction, net_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const periods = ['2024-05', '2024-06'];
  for (let i = 0; i < 5; i++) {
    const period = periods[i % 2];
    const branchId = i < 3 ? branch1Id : branch2Id;
    const courierId = userIds[3 + (i % 3)];
    const totalTasks = 15 + Math.floor(Math.random() * 30);
    const totalFee = +(totalTasks * (5 + Math.random() * 10)).toFixed(2);
    const bonus = +(Math.random() * 200).toFixed(2);
    const deduction = +(Math.random() * 50).toFixed(2);
    const netAmount = +(totalFee + bonus - deduction).toFixed(2);
    const status = i < 2 ? 'paid' : i < 4 ? 'confirmed' : 'pending';

    insertSettlement.run(period, branchId, courierId, totalTasks, totalFee, bonus, deduction, netAmount, status);
  }

  const insertAlert = db.prepare(`
    INSERT INTO alerts (type, level, title, description, branch_id, package_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const alertData = [
    { type: 'overdue', level: 'warning', title: '快件超时未签收', desc: '快件SF20240601000003已超过48小时未签收', branch: branch1Id, pkg: 3, status: 'active' },
    { type: 'exception', level: 'critical', title: '快件破损异常', desc: '快件SF20240601000008配送过程中发现外包装破损', branch: branch1Id, pkg: 8, status: 'active' },
    { type: 'inventory_overflow', level: 'warning', title: '库存容量预警', desc: '朝阳网点库存量已达85%，请及时处理', branch: branch1Id, pkg: null, status: 'active' },
    { type: 'fee_anomaly', level: 'critical', title: '运费异常波动', desc: '本周运费收入较上周下降30%，存在异常', branch: branch1Id, pkg: null, status: 'active' },
    { type: 'overdue', level: 'critical', title: '多件快件严重超时', desc: '海淀网点有5件快件超过72小时未签收', branch: branch2Id, pkg: null, status: 'active' },
    { type: 'exception', level: 'warning', title: '快件地址异常', desc: '快件SF20240601000015收件地址不完整', branch: branch2Id, pkg: 15, status: 'active' },
    { type: 'inventory_overflow', level: 'critical', title: '库存严重超载', desc: '海淀网点库存量已达120%，超出安全范围', branch: branch2Id, pkg: null, status: 'resolved' },
    { type: 'fee_anomaly', level: 'warning', title: '结算金额异常', desc: '快递员刘快递上月结算金额与实际工作量差异较大', branch: branch2Id, pkg: null, status: 'active' },
  ];

  for (const a of alertData) {
    insertAlert.run(a.type, a.level, a.title, a.desc, a.branch, a.pkg, a.status);
  }

  const insertAuditLog = db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const auditEntries = [
    { uid: userIds[0], name: '系统管理员', role: 'admin', action: '用户登录', type: 'user', id: userIds[0], detail: '管理员登录系统', ip: '127.0.0.1' },
    { uid: userIds[1], name: '张经理', role: 'platform', action: '快件入库', type: 'package', id: 1, detail: '入库快件SF20240601000001', ip: '127.0.0.1' },
    { uid: userIds[3], name: '王快递', role: 'ops', action: '快件出库', type: 'package', id: 4, detail: '出库配送快件SF20240601000004', ip: '127.0.0.1' },
    { uid: userIds[3], name: '王快递', role: 'ops', action: '快件签收', type: 'package', id: 5, detail: '签收快件SF20240601000005', ip: '127.0.0.1' },
    { uid: userIds[1], name: '张经理', role: 'platform', action: '创建取件任务', type: 'pickup_task', id: 1, detail: '创建取件任务TK0202406010', ip: '127.0.0.1' },
    { uid: userIds[2], name: '李经理', role: 'platform', action: '分配任务', type: 'pickup_task', id: 2, detail: '将任务TK020240601001分配给赵快递', ip: '127.0.0.1' },
    { uid: userIds[1], name: '张经理', role: 'platform', action: '生成结算单', type: 'settlement', id: 1, detail: '生成2024-05月结算单', ip: '127.0.0.1' },
    { uid: userIds[0], name: '系统管理员', role: 'admin', action: '确认支付', type: 'settlement', id: 1, detail: '确认支付结算单', ip: '127.0.0.1' },
  ];

  for (const a of auditEntries) {
    insertAuditLog.run(a.uid, a.name, a.role, a.action, a.type, a.id, a.detail, a.ip);
  }

  const insertLockerStation = db.prepare(`
    INSERT INTO locker_stations (name, code, type, address, total_slots, used_slots, branch_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const lockerStationData = [
    { name: '朝阳智能柜A1', code: 'LK-CY-001', type: 'locker', address: '北京市朝阳区建国路88号1楼', total_slots: 60, used_slots: 42, branch_id: branch1Id },
    { name: '朝阳驿站中心', code: 'ST-CY-001', type: 'station', address: '北京市朝阳区望京SOHO T1底商', total_slots: 200, used_slots: 156, branch_id: branch1Id },
    { name: '海淀智能柜B1', code: 'LK-HD-001', type: 'locker', address: '北京市海淀区中关村大街66号B座', total_slots: 80, used_slots: 55, branch_id: branch2Id },
    { name: '海淀柜机C1', code: 'CB-HD-001', type: 'cabinet', address: '北京市海淀区西二旗辉煌国际1楼', total_slots: 40, used_slots: 28, branch_id: branch2Id },
  ];

  for (const s of lockerStationData) {
    insertLockerStation.run(s.name, s.code, s.type, s.address, s.total_slots, s.used_slots, s.branch_id, 'active');
  }

  const insertCustomerGroup = db.prepare(`
    INSERT INTO customer_groups (name, type, customer_count, total_orders, avg_fee, branch_id, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const customerGroupData = [
    { name: '朝阳VIP客户群', type: 'vip', customer_count: 120, total_orders: 1560, avg_fee: 12.5, branch_id: branch1Id, tags: '高频,优质' },
    { name: '朝阳普通客户群', type: 'normal', customer_count: 580, total_orders: 3200, avg_fee: 8.2, branch_id: branch1Id, tags: '常规' },
    { name: '海淀VIP客户群', type: 'vip', customer_count: 95, total_orders: 1280, avg_fee: 13.8, branch_id: branch2Id, tags: '高频,优质' },
    { name: '海淀普通客户群', type: 'normal', customer_count: 420, total_orders: 2100, avg_fee: 7.6, branch_id: branch2Id, tags: '常规' },
    { name: '企业客户群', type: 'enterprise', customer_count: 35, total_orders: 890, avg_fee: 25.0, branch_id: branch1Id, tags: '批量,大客户' },
  ];

  for (const g of customerGroupData) {
    insertCustomerGroup.run(g.name, g.type, g.customer_count, g.total_orders, g.avg_fee, g.branch_id, g.tags);
  }

  const insertPerformance = db.prepare(`
    INSERT INTO performance_records (user_id, period, total_tasks, completed_tasks, failed_tasks, on_time_rate, customer_score, total_fee, bonus, deduction, branch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const performanceData = [
    { uid: userIds[3], period: '2024-05', total_tasks: 45, completed_tasks: 42, failed_tasks: 3, on_time_rate: 93.3, customer_score: 4.5, total_fee: 680.0, bonus: 120.0, deduction: 15.0, branch_id: branch1Id },
    { uid: userIds[3], period: '2024-06', total_tasks: 52, completed_tasks: 50, failed_tasks: 2, on_time_rate: 96.2, customer_score: 4.7, total_fee: 780.0, bonus: 150.0, deduction: 10.0, branch_id: branch1Id },
    { uid: userIds[4], period: '2024-05', total_tasks: 38, completed_tasks: 36, failed_tasks: 2, on_time_rate: 94.7, customer_score: 4.3, total_fee: 560.0, bonus: 80.0, deduction: 20.0, branch_id: branch1Id },
    { uid: userIds[4], period: '2024-06', total_tasks: 41, completed_tasks: 39, failed_tasks: 2, on_time_rate: 95.1, customer_score: 4.4, total_fee: 610.0, bonus: 100.0, deduction: 15.0, branch_id: branch2Id },
    { uid: userIds[5], period: '2024-05', total_tasks: 33, completed_tasks: 31, failed_tasks: 2, on_time_rate: 93.9, customer_score: 4.6, total_fee: 490.0, bonus: 90.0, deduction: 25.0, branch_id: branch2Id },
    { uid: userIds[5], period: '2024-06', total_tasks: 40, completed_tasks: 38, failed_tasks: 2, on_time_rate: 95.0, customer_score: 4.8, total_fee: 600.0, bonus: 130.0, deduction: 10.0, branch_id: branch2Id },
  ];

  for (const p of performanceData) {
    insertPerformance.run(p.uid, p.period, p.total_tasks, p.completed_tasks, p.failed_tasks, p.on_time_rate, p.customer_score, p.total_fee, p.bonus, p.deduction, p.branch_id);
  }

  const insertShopOrder = db.prepare(`
    INSERT INTO shop_orders (order_no, customer_name, customer_phone, product_name, quantity, amount, status, tracking_no, branch_id, courier_id, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const shopOrderData = [
    { order_no: 'WD20240601001', customer_name: '陈先生', customer_phone: '13900001001', product_name: '快递袋(大号)x50', quantity: 1, amount: 25.0, status: 'completed', tracking_no: null, branch_id: branch1Id, courier_id: userIds[3], source: 'wechat' },
    { order_no: 'WD20240601002', customer_name: '周女士', customer_phone: '13900001002', product_name: '包装纸箱x20', quantity: 2, amount: 48.0, status: 'shipped', tracking_no: 'SF20240601000001', branch_id: branch1Id, courier_id: userIds[3], source: 'wechat' },
    { order_no: 'WD20240601003', customer_name: '吴先生', customer_phone: '13900001003', product_name: '气泡膜卷x5', quantity: 5, amount: 75.0, status: 'processing', tracking_no: null, branch_id: branch1Id, courier_id: null, source: 'douyin' },
    { order_no: 'WD20240601004', customer_name: '孙女士', customer_phone: '13900001004', product_name: '封箱胶带x10', quantity: 10, amount: 30.0, status: 'pending', tracking_no: null, branch_id: branch1Id, courier_id: null, source: 'taobao' },
    { order_no: 'WD20240601005', customer_name: '郑先生', customer_phone: '13900001005', product_name: '快递袋(小号)x100', quantity: 1, amount: 35.0, status: 'completed', tracking_no: null, branch_id: branch2Id, courier_id: userIds[4], source: 'wechat' },
    { order_no: 'WD20240601006', customer_name: '冯女士', customer_phone: '13900001006', product_name: '标签纸x3', quantity: 3, amount: 18.0, status: 'cancelled', tracking_no: null, branch_id: branch2Id, courier_id: null, source: 'other' },
    { order_no: 'WD20240601007', customer_name: '褚先生', customer_phone: '13900001007', product_name: '包装纸箱x50', quantity: 1, amount: 120.0, status: 'processing', tracking_no: null, branch_id: branch2Id, courier_id: null, source: 'douyin' },
    { order_no: 'WD20240601008', customer_name: '卫女士', customer_phone: '13900001008', product_name: '快递袋(中号)x80', quantity: 2, amount: 56.0, status: 'shipped', tracking_no: 'SF20240601000010', branch_id: branch2Id, courier_id: userIds[5], source: 'wechat' },
  ];

  for (const o of shopOrderData) {
    insertShopOrder.run(o.order_no, o.customer_name, o.customer_phone, o.product_name, o.quantity, o.amount, o.status, o.tracking_no, o.branch_id, o.courier_id, o.source);
  }

  console.log('种子数据初始化完成');
  console.log(`- 用户: ${users.length} 条`);
  console.log(`- 网点: 2 条`);
  console.log(`- 快件: 30 条`);
  console.log(`- 取件任务: 20 条`);
  console.log(`- 结算单: 5 条`);
  console.log(`- 告警: ${alertData.length} 条`);
  console.log(`- 审计日志: ${auditEntries.length} 条`);
  console.log(`- 柜机驿站: ${lockerStationData.length} 条`);
  console.log(`- 客户分群: ${customerGroupData.length} 条`);
  console.log(`- 绩效记录: ${performanceData.length} 条`);
  console.log(`- 微店订单: ${shopOrderData.length} 条`);
}

seed().catch(console.error);
