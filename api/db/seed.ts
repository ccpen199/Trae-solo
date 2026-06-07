/**
 * Database seed - initial test data
 */
import db from '../db.js';
import bcrypt from 'bcryptjs';

const hashPwd = (pwd: string) => bcrypt.hashSync(pwd, 10);

export function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (userCount.c > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (phone, password, name, role, credit_score)
    VALUES (?, ?, ?, ?, ?)
  `);

  const users = [
    { phone: '13800000001', pwd: '123456', name: '系统管理员', role: 'admin', credit: 750 },
    { phone: '13800000002', pwd: '123456', name: '李明', role: 'agent_self', credit: 720 },
    { phone: '13800000003', pwd: '123456', name: '王芳', role: 'agent_franchise', credit: 700 },
    { phone: '13800000004', pwd: '123456', name: '张伟', role: 'owner', credit: 710 },
    { phone: '13800000005', pwd: '123456', name: '刘洋', role: 'tenant', credit: 680 },
    { phone: '13800000006', pwd: '123456', name: '陈浩', role: 'buyer', credit: 690 },
  ];

  users.forEach(u => {
    insertUser.run(u.phone, hashPwd(u.pwd), u.name, u.role, u.credit);
  });

  const insertProperty = db.prepare(`
    INSERT INTO properties (name, type, address, area, price, owner_id, agent_id, status, vr_url, floor_plan_json, floor, total_floor, decoration_level, community, rooms, halls, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleFloorPlan = JSON.stringify({
    rooms: [
      { id: 'living', name: '客厅', x: 0, y: 0, width: 8, height: 6, area: 48 },
      { id: 'bedroom1', name: '主卧', x: 8, y: 0, width: 6, height: 5, area: 30 },
      { id: 'bedroom2', name: '次卧', x: 8, y: 5, width: 5, height: 4, area: 20 },
      { id: 'kitchen', name: '厨房', x: 0, y: 6, width: 4, height: 3, area: 12 },
      { id: 'bathroom', name: '卫生间', x: 4, y: 6, width: 4, height: 3, area: 12 },
    ],
    totalArea: 122
  });

  const properties = [
    {
      name: '阳光花园精装三居室',
      type: 'second_hand',
      address: '朝阳区阳光花园小区3号楼2单元1502',
      area: 122,
      price: 5800000,
      ownerId: 4,
      agentId: 2,
      status: 'active',
      vrUrl: 'https://example.com/vr/1001',
      floorPlan: sampleFloorPlan,
      floor: 15,
      totalFloor: 28,
      decoration: 'luxury',
      community: '阳光花园',
      rooms: 3,
      halls: 2,
      desc: '南北通透，满五唯一，精装修拎包入住。'
    },
    {
      name: '绿城公寓精装一居室',
      type: 'apartment',
      address: '海淀区中关村大街100号绿城公寓8层801',
      area: 58,
      price: 6500,
      ownerId: 4,
      agentId: 3,
      status: 'active',
      vrUrl: 'https://example.com/vr/1002',
      floorPlan: JSON.stringify({
        rooms: [
          { id: 'living', name: '客卧一体', x: 0, y: 0, width: 7, height: 6, area: 42 },
          { id: 'kitchen', name: '厨房', x: 0, y: 6, width: 4, height: 3, area: 12 },
          { id: 'bathroom', name: '卫生间', x: 4, y: 6, width: 3, height: 3, area: 9 },
        ],
        totalArea: 63
      }),
      floor: 8,
      totalFloor: 20,
      decoration: 'medium',
      community: '绿城公寓',
      rooms: 1,
      halls: 1,
      desc: '集中式品牌公寓，配套齐全，管家服务。'
    },
    {
      name: '中央公园两室一厅合租主卧',
      type: 'shared_rent',
      address: '丰台区中央公园小区5号楼3单元702',
      area: 18,
      price: 3200,
      ownerId: 4,
      agentId: 2,
      status: 'active',
      vrUrl: 'https://example.com/vr/1003',
      floorPlan: JSON.stringify({
        rooms: [
          { id: 'bedroom', name: '主卧', x: 0, y: 0, width: 4.5, height: 4, area: 18 },
          { id: 'shared_living', name: '共享客厅', x: 4.5, y: 0, width: 6, height: 5, area: 30 },
          { id: 'shared_kitchen', name: '共享厨房', x: 0, y: 4, width: 6, height: 3, area: 18 },
        ],
        totalArea: 66
      }),
      floor: 7,
      totalFloor: 18,
      decoration: 'simple',
      community: '中央公园',
      rooms: 2,
      halls: 1,
      desc: '朝南主卧带独卫，距地铁站800米。'
    },
    {
      name: '保利香槟国际整租两居',
      type: 'whole_rent',
      address: '朝阳区保利香槟国际花园12号楼1单元1101',
      area: 89,
      price: 8500,
      ownerId: 4,
      agentId: 3,
      status: 'active',
      vrUrl: 'https://example.com/vr/1004',
      floorPlan: JSON.stringify({
        rooms: [
          { id: 'living', name: '客厅', x: 0, y: 0, width: 7, height: 5, area: 35 },
          { id: 'bedroom1', name: '主卧', x: 7, y: 0, width: 5, height: 4, area: 20 },
          { id: 'bedroom2', name: '次卧', x: 7, y: 4, width: 4, height: 4, area: 16 },
          { id: 'kitchen', name: '厨房', x: 0, y: 5, width: 4, height: 3, area: 12 },
          { id: 'bathroom', name: '卫生间', x: 4, y: 5, width: 3, height: 3, area: 9 },
        ],
        totalArea: 92
      }),
      floor: 11,
      totalFloor: 25,
      decoration: 'medium',
      community: '保利香槟国际',
      rooms: 2,
      halls: 1,
      desc: '小区环境优美，交通便利，家电齐全。'
    },
    {
      name: '万科城市花园四居室',
      type: 'second_hand',
      address: '海淀区万科城市花园6号楼4单元2201',
      area: 156,
      price: 12800000,
      ownerId: 4,
      agentId: 2,
      status: 'pending',
      vrUrl: 'https://example.com/vr/1005',
      floorPlan: JSON.stringify({
        rooms: [
          { id: 'living', name: '客厅', x: 0, y: 0, width: 10, height: 6, area: 60 },
          { id: 'bedroom1', name: '主卧', x: 10, y: 0, width: 6, height: 5, area: 30 },
          { id: 'bedroom2', name: '次卧', x: 10, y: 5, width: 5, height: 4, area: 20 },
          { id: 'bedroom3', name: '书房', x: 10, y: 9, width: 4, height: 3, area: 12 },
          { id: 'kitchen', name: '厨房', x: 0, y: 6, width: 4, height: 4, area: 16 },
          { id: 'bathroom1', name: '主卫', x: 16, y: 0, width: 3, height: 5, area: 15 },
          { id: 'bathroom2', name: '客卫', x: 0, y: 10, width: 4, height: 3, area: 12 },
        ],
        totalArea: 165
      }),
      floor: 22,
      totalFloor: 30,
      decoration: 'luxury',
      community: '万科城市花园',
      rooms: 4,
      halls: 2,
      desc: '豪华装修，视野开阔，学区房。'
    },
  ];

  properties.forEach(p => {
    insertProperty.run(
      p.name, p.type, p.address, p.area, p.price, p.ownerId, p.agentId, p.status,
      p.vrUrl, p.floorPlan, p.floor, p.totalFloor, p.decoration, p.community,
      p.rooms, p.halls, p.desc
    );
  });

  const insertValuation = db.prepare(`
    INSERT INTO valuations (property_id, base_price, decoration_index, floor_coefficient, community_avg, estimated_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertValuation.run(1, 48000, 1.12, 1.03, 46000, 5658000);
  insertValuation.run(5, 82000, 1.15, 0.98, 78000, 12088000);

  const insertContract = db.prepare(`
    INSERT INTO contracts (property_id, owner_id, agent_id, template_type, sign_hash, status, signed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertContract.run(
    1, 4, 2, 'sale_commission',
    '0x7a3f9d2c8e1b4f5a6d7c9e2f8a1b3c5d7e9f2a4b6c8d0e2f4a6b8c0d2e4f6a8b',
    'signed', '2025-01-15 10:30:00'
  );

  const insertTransaction = db.prepare(`
    INSERT INTO transactions (property_id, buyer_id, seller_id, agent_id, price, commission_rate, commission_amount, fund_status, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txId = insertTransaction.run(1, 6, 4, 2, 5800000, 0.025, 72500, 'deposited', 'transferring').lastInsertRowid;

  const insertNode = db.prepare(`
    INSERT INTO transfer_nodes (transaction_id, node_name, status, sort_order, completed_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertNode.run(txId, '签订买卖合同', 'completed', 1, '2025-02-01');
  insertNode.run(txId, '支付意向金', 'completed', 2, '2025-02-03');
  insertNode.run(txId, '资金监管账户存入首付', 'completed', 3, '2025-02-10');
  insertNode.run(txId, '银行贷款审批', 'completed', 4, '2025-02-20');
  insertNode.run(txId, '网签备案', 'processing', 5, null);
  insertNode.run(txId, '缴税过户', 'pending', 6, null);
  insertNode.run(txId, '领取不动产证', 'pending', 7, null);
  insertNode.run(txId, '资金划转业主', 'pending', 8, null);
  insertNode.run(txId, '物业交接', 'pending', 9, null);

  const insertLease = db.prepare(`
    INSERT INTO leases (property_id, tenant_id, agent_id, start_date, end_date, monthly_rent, deposit, deposit_status, payment_method, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const leaseId = insertLease.run(4, 5, 3, '2025-03-01', '2026-02-28', 8500, 17000, 'held', 'auto', 'active').lastInsertRowid;

  const insertPayment = db.prepare(`
    INSERT INTO rent_payments (lease_id, amount, due_date, paid_date, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertPayment.run(leaseId, 8500, '2025-03-01', '2025-03-01', 'paid');
  insertPayment.run(leaseId, 8500, '2025-04-01', '2025-04-01', 'paid');
  insertPayment.run(leaseId, 8500, '2025-05-01', '2025-05-01', 'paid');
  insertPayment.run(leaseId, 8500, '2025-06-01', null, 'pending');

  const insertSupplier = db.prepare(`
    INSERT INTO suppliers (name, type, contact, phone, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertSupplier.run('宜家建材', 'material', '采购经理-王经理', '13900000001', 'active');
  insertSupplier.run('洁净家政', 'housekeeping', '张主管', '13900000002', 'active');
  insertSupplier.run('顺丰搬家', 'moving', '李队长', '13900000003', 'active');
  insertSupplier.run('尚层装饰', 'renovation', '刘设计总监', '13900000004', 'active');
  insertSupplier.run('东易日盛装修', 'renovation', '陈项目经理', '13900000005', 'suspended');

  const insertWO = db.prepare(`
    INSERT INTO work_orders (type, property_id, reporter_id, assignee_id, supplier_id, description, priority, status, sla_hours, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+48 hours'))
  `);
  const woId1 = insertWO.run('repair', 4, 5, 2, 4, '卫生间水龙头漏水，需要维修更换', 'high', 'in_progress', 24).lastInsertRowid;
  const woId2 = insertWO.run('cleaning', 4, 5, 3, 2, '入住前深度保洁', 'normal', 'completed', 48).lastInsertRowid;
  const woId3 = insertWO.run('repair', 2, 5, null, null, '空调不制冷', 'urgent', 'pending', 24).lastInsertRowid;

  db.exec(`UPDATE work_orders SET completed_at = datetime('now', '-6 hours'), status = 'completed' WHERE id = ${woId2}`);

  const insertWOLog = db.prepare(`
    INSERT INTO work_order_logs (work_order_id, action, remark, operator_id)
    VALUES (?, ?, ?, ?)
  `);
  insertWOLog.run(woId1, 'create', '用户报修', 5);
  insertWOLog.run(woId1, 'assign', '分配给李明处理', 1);
  insertWOLog.run(woId1, 'start', '上门检查中', 2);
  insertWOLog.run(woId2, 'create', '申请入住保洁', 5);
  insertWOLog.run(woId2, 'assign', '分配给王芳处理', 1);
  insertWOLog.run(woId2, 'complete', '已完成深度保洁，用户满意', 3);

  const insertSetting = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`);
  insertSetting.run('commission_rate_sale', '0.025');
  insertSetting.run('commission_discount', '0.5');
  insertSetting.run('sla_cleaning', '48');
  insertSetting.run('sla_repair', '24');
  insertSetting.run('sla_moving', '72');
  insertSetting.run('sla_renovation', '168');
  insertSetting.run('credit_score_on_time_bonus', '5');
  insertSetting.run('credit_score_overdue_penalty', '10');
}
