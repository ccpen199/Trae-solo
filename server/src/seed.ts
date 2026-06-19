import { getDb } from './db';
import { v4 as uuidv4 } from 'uuid';

function seed(): void {
  const db = getDb();

  console.log('开始清理现有数据...');
  db.pragma('foreign_keys = OFF');
  db.exec(`
    DELETE FROM deviceCommands;
    DELETE FROM rewardRecords;
    DELETE FROM rewardCoupons;
    DELETE FROM userPackages;
    DELETE FROM packages;
    DELETE FROM workorders;
    DELETE FROM reservations;
    DELETE FROM orders;
    DELETE FROM devices;
    DELETE FROM areas;
    DELETE FROM users;
  `);
  db.pragma('foreign_keys = ON');
  console.log('数据清理完成');

  const now = new Date().toISOString();

  console.log('开始创建用户...');
  const users = [
    { id: uuidv4(), phone: '13800138000', nickname: '管理员', avatar: null, role: 'operator', balance: 0, createdAt: now },
    { id: uuidv4(), phone: '13800138001', nickname: '物业小王', avatar: null, role: 'property', balance: 0, createdAt: now },
    { id: uuidv4(), phone: '13800138002', nickname: '张三', avatar: null, role: 'resident', balance: 100.0, createdAt: now },
    { id: uuidv4(), phone: '13800138003', nickname: '李四', avatar: null, role: 'resident', balance: 50.5, createdAt: now },
    { id: uuidv4(), phone: '13800138004', nickname: '王五', avatar: null, role: 'resident', balance: 200.0, createdAt: now },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, nickname, avatar, role, balance, createdAt)
    VALUES (@id, @phone, @nickname, @avatar, @role, @balance, @createdAt)
  `);

  const insertUserTx = db.transaction((userList: typeof users) => {
    for (const u of userList) insertUser.run(u);
  });
  insertUserTx(users);
  console.log(`创建了 ${users.length} 个用户`);

  const operatorId = users[0].id;
  const propertyId = users[1].id;

  console.log('开始创建区域...');
  const areas = [
    { id: uuidv4(), name: '阳光花园A区', lat: 39.9042, lng: 116.4074, propertyManagerId: propertyId },
    { id: uuidv4(), name: '阳光花园B区', lat: 39.9052, lng: 116.4084, propertyManagerId: propertyId },
    { id: uuidv4(), name: '翠湖小区', lat: 39.9152, lng: 116.4184, propertyManagerId: null },
  ];

  const insertArea = db.prepare(`
    INSERT INTO areas (id, name, lat, lng, propertyManagerId)
    VALUES (@id, @name, @lat, @lng, @propertyManagerId)
  `);

  const insertAreaTx = db.transaction((areaList: typeof areas) => {
    for (const a of areaList) insertArea.run(a);
  });
  insertAreaTx(areas);
  console.log(`创建了 ${areas.length} 个区域`);

  console.log('开始创建设备...');
  const devices = [
    { id: uuidv4(), name: 'A区1号洗衣机', type: 'washer', status: 'idle', location: 'A区1号楼地下一层', lat: 39.9040, lng: 116.4072, areaId: areas[0].id, pricing: 3.0, lastHeartbeat: now, isOnline: 1 },
    { id: uuidv4(), name: 'A区2号洗衣机', type: 'washer', status: 'running', location: 'A区1号楼地下一层', lat: 39.9041, lng: 116.4073, areaId: areas[0].id, pricing: 3.0, lastHeartbeat: now, isOnline: 1 },
    { id: uuidv4(), name: 'A区3号洗衣机', type: 'washer', status: 'fault', location: 'A区2号楼地下一层', lat: 39.9043, lng: 116.4075, areaId: areas[0].id, pricing: 3.0, lastHeartbeat: now, isOnline: 1 },
    { id: uuidv4(), name: 'A区饮水机', type: 'water_dispenser', status: 'idle', location: 'A区1号楼大厅', lat: 39.9044, lng: 116.4076, areaId: areas[0].id, pricing: 0.5, lastHeartbeat: now, isOnline: 1 },
    { id: uuidv4(), name: 'A区淋浴间1', type: 'shower', status: 'idle', location: 'A区健身中心', lat: 39.9045, lng: 116.4077, areaId: areas[0].id, pricing: 2.0, lastHeartbeat: now, isOnline: 1 },
    { id: uuidv4(), name: 'B区1号洗衣机', type: 'washer', status: 'idle', location: 'B区1号楼地下一层', lat: 39.9050, lng: 116.4082, areaId: areas[1].id, pricing: 3.0, lastHeartbeat: now, isOnline: 1 },
    { id: uuidv4(), name: 'B区饮水机', type: 'water_dispenser', status: 'idle', location: 'B区1号楼大厅', lat: 39.9054, lng: 116.4086, areaId: areas[1].id, pricing: 0.5, lastHeartbeat: now, isOnline: 0 },
    { id: uuidv4(), name: '翠湖1号洗衣机', type: 'washer', status: 'idle', location: '翠湖1号楼', lat: 39.9150, lng: 116.4182, areaId: areas[2].id, pricing: 4.0, lastHeartbeat: now, isOnline: 1 },
  ];

  const insertDevice = db.prepare(`
    INSERT INTO devices (id, name, type, status, location, lat, lng, areaId, pricing, lastHeartbeat, isOnline)
    VALUES (@id, @name, @type, @status, @location, @lat, @lng, @areaId, @pricing, @lastHeartbeat, @isOnline)
  `);

  const insertDeviceTx = db.transaction((deviceList: typeof devices) => {
    for (const d of deviceList) insertDevice.run(d);
  });
  insertDeviceTx(devices);
  console.log(`创建了 ${devices.length} 台设备`);

  console.log('开始创建套餐...');
  const packages = [
    { id: uuidv4(), name: '洗衣10次卡', deviceType: 'washer', totalMinutes: 300, price: 25.0, description: '10次洗衣套餐，平均每次2.5元' },
    { id: uuidv4(), name: '洗衣月卡', deviceType: 'washer', totalMinutes: 1000, price: 80.0, description: '月卡不限次数，30天内有效' },
    { id: uuidv4(), name: '饮水50次卡', deviceType: 'water_dispenser', totalMinutes: 100, price: 20.0, description: '50次取水套餐' },
    { id: uuidv4(), name: '淋浴10次卡', deviceType: 'shower', totalMinutes: 200, price: 18.0, description: '10次淋浴套餐' },
  ];

  const insertPackage = db.prepare(`
    INSERT INTO packages (id, name, deviceType, totalMinutes, price, description)
    VALUES (@id, @name, @deviceType, @totalMinutes, @price, @description)
  `);

  const insertPackageTx = db.transaction((pkgList: typeof packages) => {
    for (const p of pkgList) insertPackage.run(p);
  });
  insertPackageTx(packages);
  console.log(`创建了 ${packages.length} 个套餐`);

  console.log('开始创建用户套餐...');
  const expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const userPackages = [
    { id: uuidv4(), userId: users[2].id, packageId: packages[0].id, remainingMinutes: 300, expireAt },
    { id: uuidv4(), userId: users[2].id, packageId: packages[2].id, remainingMinutes: 60, expireAt },
  ];

  const insertUserPackage = db.prepare(`
    INSERT INTO userPackages (id, userId, packageId, remainingMinutes, expireAt)
    VALUES (@id, @userId, @packageId, @remainingMinutes, @expireAt)
  `);

  const insertUserPackageTx = db.transaction((upList: typeof userPackages) => {
    for (const up of upList) insertUserPackage.run(up);
  });
  insertUserPackageTx(userPackages);
  console.log(`创建了 ${userPackages.length} 个用户套餐`);

  console.log('开始创建优惠券...');
  const couponExpireAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const coupons = [
    { id: uuidv4(), userId: users[2].id, name: '新用户立减券', type: 'cash' as const, value: 5.0, minAmount: 10.0, expireAt: couponExpireAt, isUsed: 0 },
    { id: uuidv4(), userId: users[2].id, name: '洗衣8折券', type: 'discount' as const, value: 0.8, minAmount: 0, expireAt: couponExpireAt, isUsed: 0 },
    { id: uuidv4(), userId: users[3].id, name: '新用户立减券', type: 'cash' as const, value: 5.0, minAmount: 10.0, expireAt: couponExpireAt, isUsed: 0 },
  ];

  const insertCoupon = db.prepare(`
    INSERT INTO rewardCoupons (id, userId, name, type, value, minAmount, expireAt, isUsed)
    VALUES (@id, @userId, @name, @type, @value, @minAmount, @expireAt, @isUsed)
  `);

  const insertCouponTx = db.transaction((couponList: typeof coupons) => {
    for (const c of couponList) insertCoupon.run(c);
  });
  insertCouponTx(coupons);
  console.log(`创建了 ${coupons.length} 张优惠券`);

  console.log('开始创建积分记录...');
  const rewardRecords = [
    { id: uuidv4(), userId: users[2].id, action: 'register', points: 100, description: '注册赠送', createdAt: now, deviceType: null },
    { id: uuidv4(), userId: users[2].id, action: 'use', points: 10, description: '使用洗衣机', createdAt: now, deviceType: 'washer' as const },
    { id: uuidv4(), userId: users[3].id, action: 'register', points: 100, description: '注册赠送', createdAt: now, deviceType: null },
  ];

  const insertRewardRecord = db.prepare(`
    INSERT INTO rewardRecords (id, userId, action, points, description, createdAt, deviceType)
    VALUES (@id, @userId, @action, @points, @description, @createdAt, @deviceType)
  `);

  const insertRewardRecordTx = db.transaction((rrList: typeof rewardRecords) => {
    for (const r of rrList) insertRewardRecord.run(r);
  });
  insertRewardRecordTx(rewardRecords);
  console.log(`创建了 ${rewardRecords.length} 条积分记录`);

  console.log('开始创建工单...');
  const workOrders = [
    { id: uuidv4(), deviceId: devices[2].id, reporterId: users[2].id, handlerId: null, type: 'repair' as const, description: '洗衣机开机后不启动，有异常声音', status: 'pending' as const, priority: 'high' as const, createdAt: now, resolvedAt: null },
    { id: uuidv4(), deviceId: devices[3].id, reporterId: users[3].id, handlerId: users[1].id, type: 'maintenance' as const, description: '饮水机滤芯需要更换', status: 'assigned' as const, priority: 'medium' as const, createdAt: now, resolvedAt: null },
  ];

  const insertWorkOrder = db.prepare(`
    INSERT INTO workorders (id, deviceId, reporterId, handlerId, type, description, status, priority, createdAt, resolvedAt)
    VALUES (@id, @deviceId, @reporterId, @handlerId, @type, @description, @status, @priority, @createdAt, @resolvedAt)
  `);

  const insertWorkOrderTx = db.transaction((woList: typeof workOrders) => {
    for (const w of woList) insertWorkOrder.run(w);
  });
  insertWorkOrderTx(workOrders);
  console.log(`创建了 ${workOrders.length} 个工单`);

  console.log('');
  console.log('=== 种子数据创建完成 ===');
  console.log('测试账号:');
  console.log('  运营方: 13800138000');
  console.log('  物业:   13800138001');
  console.log('  住户:   13800138002');
  console.log('  住户:   13800138003');
  console.log('  住户:   13800138004');
  console.log('  验证码统一使用: 123456');
}

seed();
