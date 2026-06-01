const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/app.db');
const db = new Database(dbPath);

try {
  // 清空现有数据（先清空有外键的表）
  db.exec('DELETE FROM exceptions');
  db.exec('DELETE FROM container_nodes');
  db.exec('DELETE FROM containers');
  
  console.log('已清空现有数据');

  // 重置自增ID
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('containers', 'container_nodes', 'exceptions')");
  
  // 插入箱号测试数据
  const insertContainer = db.prepare(`
    INSERT INTO containers (
      container_number, booking_number, bill_of_lading, container_type,
      seal_number, shipper, origin_port, destination_port, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const containers = [
    ['MSKU1234567', 'BKG001234', 'BL789012', '40HQ', 'SEAL12345', 'ABC贸易有限公司', '上海', '洛杉矶', 'active', '2026-05-15 10:00:00'],
    ['CMAU7654321', 'BKG005678', 'BL345678', '20GP', 'SEAL67890', 'XYZ进出口公司', '深圳', '新加坡', 'active', '2026-05-16 14:30:00'],
    ['HLCU1122334', 'BKG009999', 'BL901234', '40GP', 'SEAL11111', 'DEF物流有限公司', '宁波', '汉堡', 'active', '2026-05-17 09:15:00'],
    ['APLU5566778', 'BKG008888', 'BL567890', '40HQ', 'SEAL22222', 'GHI供应链公司', '青岛', '长滩', 'active', '2026-05-18 16:45:00'],
    ['OOLU9988776', 'BKG007777', 'BL123901', '20RF', 'SEAL33333', 'JKL冷链物流', '广州', '东京', 'active', '2026-05-19 08:00:00'],
  ];

  containers.forEach(c => insertContainer.run(...c));
  console.log(`已插入 ${containers.length} 条箱号数据`);

  // 获取实际的容器ID
  const containerIds = db.prepare('SELECT id, container_number FROM containers').all();
  console.log('容器ID映射:', containerIds.map(c => `${c.container_number} -> ${c.id}`).join(', '));

  // 插入节点追踪测试数据
  const insertNode = db.prepare(`
    INSERT INTO container_nodes (
      container_id, node_type, node_time, source, remarks, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  // 使用实际的容器ID
  const c1 = containerIds[0].id; // MSKU1234567
  const c2 = containerIds[1].id; // CMAU7654321
  const c3 = containerIds[2].id; // HLCU1122334
  const c4 = containerIds[3].id; // APLU5566778

  const nodes = [
    // 第一个箱号的完整节点
    [c1, 'PICKUP_EMPTY', '2026-05-15 08:00:00', '车队系统', '已完成提空箱', '2026-05-15 08:00:00'],
    [c1, 'IN_WAREHOUSE', '2026-05-15 14:00:00', '仓库系统', '货物已入仓待装', '2026-05-15 14:00:00'],
    [c1, 'IN_PORT', '2026-05-16 10:30:00', '码头系统', '已进入港区', '2026-05-16 10:30:00'],
    [c1, 'LOADED', '2026-05-16 18:00:00', '船公司EDI', '已完成装船', '2026-05-16 18:00:00'],
    [c1, 'DEPARTED', '2026-05-17 06:00:00', '船公司EDI', '船舶已离港', '2026-05-17 06:00:00'],
    // 第二个箱号的部分节点
    [c2, 'PICKUP_EMPTY', '2026-05-16 12:00:00', '车队系统', '已完成提空箱', '2026-05-16 12:00:00'],
    [c2, 'IN_WAREHOUSE', '2026-05-16 20:00:00', '仓库系统', '货物已入仓', '2026-05-16 20:00:00'],
    [c2, 'IN_PORT', '2026-05-17 15:00:00', '码头系统', '已进入港区等待装船', '2026-05-17 15:00:00'],
    // 第三个箱号
    [c3, 'PICKUP_EMPTY', '2026-05-17 07:30:00', '车队系统', '已完成提空箱', '2026-05-17 07:30:00'],
    [c3, 'IN_WAREHOUSE', '2026-05-17 16:00:00', '仓库系统', '正在装柜中', '2026-05-17 16:00:00'],
    // 第四个箱号
    [c4, 'PICKUP_EMPTY', '2026-05-18 09:00:00', '车队系统', '待提空箱', '2026-05-18 09:00:00'],
  ];

  nodes.forEach(n => insertNode.run(...n));
  console.log(`已插入 ${nodes.length} 条节点数据`);

  // 插入异常测试数据
  const insertException = db.prepare(`
    INSERT INTO exceptions (
      container_id, exception_type, description, responsible_party,
      action_taken, status, reported_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const c5 = containerIds[4].id; // OOLU9988776

  const exceptions = [
    [c1, 'DETENTION', '码头堆存超过7天，产生滞箱费约USD 150', 'CARRIER', '已通知客户确认费用，待处理', 'open', '2026-05-18 10:00:00', '2026-05-18 10:00:00'],
    [c2, 'ROLLED', '原定船期5月18日被甩柜，改配5月22日船期', 'CARRIER', '已通知客户，更新船期信息', 'open', '2026-05-19 09:30:00', '2026-05-19 09:30:00'],
    [c3, 'INSPECTION', '海关要求开箱查验，预计延误2-3天', 'CUSTOMER', '已安排报关行跟进查验进度', 'open', '2026-05-19 11:00:00', '2026-05-19 11:00:00'],
    [c5, 'DAMAGED', '还箱时发现箱体有轻微划痕，需维修', 'TRUCKING', '已拍照留证，待与车队确认责任', 'resolved', '2026-05-18 15:00:00', '2026-05-18 15:00:00'],
  ];

  exceptions.forEach(e => insertException.run(...e));
  console.log(`已插入 ${exceptions.length} 条异常数据`);

  console.log('\n测试数据插入完成！');
  
  // 统计数据
  const containerCount = db.prepare('SELECT COUNT(*) as count FROM containers').get().count;
  const nodeCount = db.prepare('SELECT COUNT(*) as count FROM container_nodes').get().count;
  const exceptionCount = db.prepare('SELECT COUNT(*) as count FROM exceptions').get().count;
  
  console.log(`\n数据库统计:`);
  console.log(`箱号数量: ${containerCount}`);
  console.log(`节点数量: ${nodeCount}`);
  console.log(`异常数量: ${exceptionCount}`);

} catch (error) {
  console.error('插入测试数据失败:', error);
} finally {
  db.close();
}
