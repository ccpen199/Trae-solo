import db from './connection.js';
import bcrypt from 'bcryptjs';
import { initDatabase } from './init.js';

export function seedDatabase() {
  initDatabase();

  const hashPassword = (password: string) => bcrypt.hashSync(password, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (role, username, name, phone, password_hash, avatar)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertHouse = db.prepare(`
    INSERT INTO houses (owner_id, building, unit, room_number, area)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMerchant = db.prepare(`
    INSERT INTO merchants (user_id, name, license_no, description, status, rating)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertProduct = db.prepare(`
    INSERT INTO products (merchant_id, name, description, price, stock, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertCoupon = db.prepare(`
    INSERT INTO coupons (merchant_id, name, discount_type, discount_value, min_amount, total_quantity, valid_from, valid_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWorkOrder = db.prepare(`
    INSERT INTO work_orders (user_id, house_id, type, title, description, location, priority, status, assignee_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVisitorPass = db.prepare(`
    INSERT INTO visitor_passes (creator_id, visitor_name, visitor_phone, qr_code, access_areas, valid_from, valid_to, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAccessDevice = db.prepare(`
    INSERT INTO access_devices (name, type, location, status)
    VALUES (?, ?, ?, ?)
  `);

  const insertAccessRecord = db.prepare(`
    INSERT INTO access_records (pass_id, device_id, access_type, result, person_name)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertCircle = db.prepare(`
    INSERT INTO circles (name, description, member_count)
    VALUES (?, ?, ?)
  `);

  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, circle_id, title, content, type, like_count, comment_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertActivity = db.prepare(`
    INSERT INTO activities (title, description, start_time, end_time, location, max_participants, participant_count, organizer_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAlert = db.prepare(`
    INSERT INTO alerts (type, level, title, description, location, status, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMembership = db.prepare(`
    INSERT INTO memberships (user_id, level, points, balance, total_spent)
    VALUES (?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const ownerId = insertUser.run('owner', 'owner1', '张先生', '13800138001', hashPassword('123456'), 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner1').lastInsertRowid as number;
  const owner2Id = insertUser.run('owner', 'owner2', '李女士', '13800138002', hashPassword('123456'), 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner2').lastInsertRowid as number;
  const tenantId = insertUser.run('tenant', 'tenant1', '王先生', '13800138003', hashPassword('123456'), 'https://api.dicebear.com/7.x/avataaars/svg?seed=tenant1').lastInsertRowid as number;
  const propertyId = insertUser.run('property', 'property1', '物业管理员', '13800138004', hashPassword('123456'), 'https://api.dicebear.com/7.x/avataaars/svg?seed=property1').lastInsertRowid as number;
  const workerId = insertUser.run('property', 'worker1', '维修师傅', '13800138005', hashPassword('123456'), 'https://api.dicebear.com/7.x/avataaars/svg?seed=worker1').lastInsertRowid as number;
  const merchantUserId = insertUser.run('merchant', 'merchant1', '商户管理员', '13800138006', hashPassword('123456'), 'https://api.dicebear.com/7.x/avataaars/svg?seed=merchant1').lastInsertRowid as number;

  insertHouse.run(ownerId, '1号楼', '2单元', '101室', 120.5);
  insertHouse.run(ownerId, '1号楼', '2单元', '102室', 95.0);
  insertHouse.run(owner2Id, '2号楼', '1单元', '301室', 110.0);

  const merchantId = insertMerchant.run(merchantUserId, '美好便利店', '123456789012345', '社区便民超市，提供日常生活用品', 'approved', 4.8).lastInsertRowid as number;
  const merchant2Id = insertMerchant.run(merchantUserId, '美食小厨', '123456789012346', '家常菜馆，提供美味家常菜', 'approved', 4.6).lastInsertRowid as number;

  insertProduct.run(merchantId, '农夫山泉', '550ml瓶装矿泉水', 2.5, 100, '饮料');
  insertProduct.run(merchantId, '伊利牛奶', '纯牛奶250ml*12盒', 38.0, 50, '乳制品');
  insertProduct.run(merchantId, '卫生纸', '10卷装卫生纸', 25.0, 80, '日用品');
  insertProduct.run(merchant2Id, '红烧肉', '招牌红烧肉，肥而不腻', 48.0, 30, '热菜');
  insertProduct.run(merchant2Id, '清炒时蔬', '新鲜时令蔬菜', 18.0, 50, '素菜');

  insertCoupon.run(merchantId, '新用户满减券', 'fixed', 10.0, 50.0, 100, now.toISOString(), nextWeek.toISOString());
  insertCoupon.run(merchant2Id, '8折优惠券', 'percentage', 20.0, 100.0, 50, now.toISOString(), nextWeek.toISOString());

  insertWorkOrder.run(ownerId, 1, 'repair', '空调不制冷', '家里的空调不制冷，需要维修', '1号楼2单元101室', 'high', 'processing', workerId);
  insertWorkOrder.run(owner2Id, 3, 'complaint', '楼下噪音太大', '最近一周每晚都有噪音，影响休息', '2号楼1单元301室', 'medium', 'pending', null);
  insertWorkOrder.run(tenantId, null, 'consultation', '停车费咨询', '咨询小区月卡停车费用', '物业服务中心', 'low', 'completed', propertyId);

  insertVisitorPass.run(ownerId, '李访客', '13900139001', 'VP_' + Date.now(), JSON.stringify(['小区大门', '1号楼单元门']), now.toISOString(), tomorrow.toISOString(), 'active');

  insertAccessDevice.run('小区大门', 'gate', '小区主入口', 'online');
  insertAccessDevice.run('1号楼单元门', 'door', '1号楼1单元', 'online');
  insertAccessDevice.run('2号楼单元门', 'door', '2号楼1单元', 'offline');
  insertAccessDevice.run('1号楼电梯', 'elevator', '1号楼电梯间', 'online');

  insertAccessRecord.run(null, 1, 'face', 'success', '张先生');
  insertAccessRecord.run(null, 2, 'qr', 'success', '李女士');
  insertAccessRecord.run(1, 1, 'qr', 'success', '李访客');

  insertCircle.run('宝妈交流圈', '宝妈们交流育儿经验', 156);
  insertCircle.run('健身爱好者', '一起健身，分享健身心得', 89);
  insertCircle.run('宠物爱好者', '分享萌宠日常，交流养宠经验', 203);

  insertPost.run(ownerId, 1, '求推荐靠谱的育儿嫂', '宝宝6个月了，想找个靠谱的育儿嫂，求大家推荐', 'normal', 12, 8);
  insertPost.run(owner2Id, 2, '小区健身房什么时候开放？', '之前看到公告说要装修，现在装好了吗？', 'normal', 5, 3);
  insertPost.run(tenantId, null, '转让九成新婴儿车', '宝宝长大了，婴儿车用不上了，九成新，低价转让', 'idle', 23, 15);

  insertActivity.run('社区亲子运动会', '一年一度的亲子运动会，欢迎家长带小朋友参加', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), '小区广场', 100, 35, propertyId, 'active');
  insertActivity.run('业主座谈会', '与物业面对面交流，讨论社区建设问题', new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), '物业会议室', 30, 18, propertyId, 'active');

  insertAlert.run('high_fall', 'high', '检测到高空抛物', '1号楼东侧检测到疑似高空抛物，请立即处理', '1号楼东侧', 'pending', yesterday.toISOString());
  insertAlert.run('fire_channel', 'critical', '消防通道被占用', 'B区地下车库消防通道被车辆占用', 'B区地下车库', 'processing', now.toISOString());
  insertAlert.run('abnormal_visitor', 'medium', '异常访客行为', '同一访客24小时内频繁出入小区5次以上，请关注', '小区大门', 'pending', now.toISOString());
  insertAlert.run('device_offline', 'low', '门禁设备离线', '2号楼单元门门禁设备离线超过2小时', '2号楼1单元', 'resolved', yesterday.toISOString());

  insertMembership.run(ownerId, 3, 2580, 150.0, 5800.0);
  insertMembership.run(owner2Id, 2, 1250, 80.0, 2300.0);
  insertMembership.run(tenantId, 1, 350, 20.0, 560.0);

  console.log('Database seeded successfully');
}

if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase();
}

export default seedDatabase;
