import { getDb, initTables, safeStringify } from '../database';
import { hashPassword } from './password';

async function seed() {
  const db = getDb();
  initTables();

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount > 0) {
    console.log('数据已存在，跳过种子数据');
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

  console.log('种子数据初始化完成');
  console.log(`- 用户: ${users.length} 条`);
  console.log(`- 网点: 2 条`);
  console.log(`- 快件: 30 条`);
  console.log(`- 取件任务: 20 条`);
  console.log(`- 结算单: 5 条`);
  console.log(`- 告警: ${alertData.length} 条`);
  console.log(`- 审计日志: ${auditEntries.length} 条`);
}

seed().catch(console.error);
