require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const AdminUser = require('../models/AdminUser');
const DormitoryBuilding = require('../models/DormitoryBuilding');
const Device = require('../models/Device');
const StudentAccount = require('../models/StudentAccount');
const Transaction = require('../models/Transaction');
const EnergyUsage = require('../models/EnergyUsage');
const Alert = require('../models/Alert');
const WorkOrder = require('../models/WorkOrder');
const { generateCardNumber, generateDeviceId, generateTransactionId, generateEnergyRecordId } = require('../utils/generateId');

const buildingNames = [
  { id: 'BLD001', name: '1号学生公寓', type: 'male', floors: 6 },
  { id: 'BLD002', name: '2号学生公寓', type: 'male', floors: 6 },
  { id: 'BLD003', name: '3号学生公寓', type: 'female', floors: 6 },
  { id: 'BLD004', name: '4号学生公寓', type: 'female', floors: 6 },
  { id: 'BLD005', name: '5号学生公寓', type: 'mixed', floors: 8 },
  { id: 'BLD006', name: '6号学生公寓', type: 'mixed', floors: 8 }
];

const deviceTypes = ['shower', 'washing', 'drinking'];
const deviceLocations = ['浴室', '洗衣房', '开水间'];
const manufacturers = ['华为技术', '中兴通讯', '海尔智家', '美的IoT'];
const grades = ['2021级', '2022级', '2023级', '2024级'];
const majors = ['计算机科学', '软件工程', '电子工程', '机械工程', '土木工程', '会计学', '金融学', '市场营销'];
const departments = ['信息工程学院', '机械工程学院', '土木工程学院', '经济管理学院', '外国语学院'];
const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高'];
const lastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明'];

function generatePhone() {
  return '1' + ['3', '5', '7', '8', '9'][Math.floor(Math.random() * 5)] + Math.random().toString().slice(2, 11);
}

function generateStudentId() {
  return '202' + Math.floor(Math.random() * 9 + 1) + Math.floor(Math.random() * 9000 + 1000).toString();
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedDatabase() {
  console.log('🌱 开始初始化数据库...\n');

  await connectDB();

  console.log('🗑️  清理旧数据...');
  await Promise.all([
    AdminUser.deleteMany({}),
    DormitoryBuilding.deleteMany({}),
    Device.deleteMany({}),
    StudentAccount.deleteMany({}),
    Transaction.deleteMany({}),
    EnergyUsage.deleteMany({}),
    Alert.deleteMany({}),
    WorkOrder.deleteMany({})
  ]);
  console.log('✅ 旧数据清理完成\n');

  console.log('👤 创建管理员账户...');
  const admins = await AdminUser.create([
    {
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      email: 'admin@campus.edu',
      phone: '13800138000',
      role: 'super_admin',
      permissions: ['*']
    },
    {
      username: 'operator',
      password: 'operator123',
      name: '运维操作员',
      email: 'operator@campus.edu',
      phone: '13800138001',
      role: 'operator',
      permissions: ['device:view', 'device:edit', 'alert:view', 'workorder:view', 'workorder:edit']
    },
    {
      username: 'maintenance',
      password: 'maintenance123',
      name: '维修工程师',
      email: 'maintenance@campus.edu',
      phone: '13800138002',
      role: 'maintenance',
      permissions: ['workorder:view', 'workorder:edit']
    },
    {
      username: 'finance',
      password: 'finance123',
      name: '财务管理员',
      email: 'finance@campus.edu',
      phone: '13800138003',
      role: 'finance',
      permissions: ['transaction:view', 'transaction:refund', 'reconciliation:*']
    }
  ]);
  console.log(`✅ 创建 ${admins.length} 个管理员账户\n`);

  console.log('🏢 创建宿舍楼...');
  const buildings = [];
  for (const b of buildingNames) {
    const faultHeatMap = [];
    for (let i = 1; i <= b.floors; i++) {
      faultHeatMap.push({
        floor: i,
        faultCount: Math.floor(Math.random() * 5),
        lastFaultDate: Math.random() > 0.5 ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()) : null
      });
    }

    const building = await DormitoryBuilding.create({
      buildingId: b.id,
      buildingName: b.name,
      buildingType: b.type,
      totalFloors: b.floors,
      roomsPerFloor: 20,
      totalStudents: Math.floor(Math.random() * 400 + 200),
      address: `校园北路${b.id.slice(-1)}号`,
      waterMeterId: `WM-${b.id}`,
      electricityMeterId: `EM-${b.id}`,
      monthlyWaterQuota: Math.floor(Math.random() * 500 + 800),
      monthlyElectricityQuota: Math.floor(Math.random() * 1000 + 1500),
      managerName: firstNames[Math.floor(Math.random() * firstNames.length)] + lastNames[Math.floor(Math.random() * lastNames.length)],
      managerPhone: generatePhone(),
      faultHeatMap,
      constructionYear: 2010 + Math.floor(Math.random() * 10)
    });
    buildings.push(building);
  }
  console.log(`✅ 创建 ${buildings.length} 栋宿舍楼\n`);

  console.log('📱 创建水控终端设备...');
  const devices = [];
  for (const building of buildings) {
    for (let floor = 1; floor <= building.totalFloors; floor++) {
      const deviceCount = Math.floor(Math.random() * 3 + 2);
      for (let i = 0; i < deviceCount; i++) {
        const typeIndex = Math.floor(Math.random() * deviceTypes.length);
        const device = await Device.create({
          deviceId: generateDeviceId(),
          deviceName: `${deviceLocations[typeIndex]}${i + 1}号`,
          deviceType: deviceTypes[typeIndex],
          buildingId: building._id,
          floor,
          roomNumber: `${floor}${String(i + 1).padStart(2, '0')}`,
          location: `${building.buildingName} ${floor}楼 ${deviceLocations[typeIndex]}`,
          status: Math.random() > 0.1 ? 'online' : (Math.random() > 0.5 ? 'offline' : 'fault'),
          firmwareVersion: '1.0.0',
          nbIotImei: '86' + Math.random().toString().slice(2, 17),
          simCardNumber: '89860' + Math.random().toString().slice(2, 17),
          signalStrength: Math.floor(Math.random() * 20 + 10),
          lastHeartbeat: new Date(Date.now() - Math.floor(Math.random() * 60000)),
          totalWaterUsage: Math.floor(Math.random() * 10000),
          powerStatus: 'normal',
          valveStatus: 'closed',
          currentFlowRate: 0,
          currentTemperature: Math.floor(Math.random() * 15 + 35),
          manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
          modelNumber: 'HW-' + Math.floor(Math.random() * 9000 + 1000),
          installDate: randomDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date()),
          faultCode: Math.random() > 0.9 ? 'E' + Math.floor(Math.random() * 999 + 100) : undefined,
          faultMessage: Math.random() > 0.9 ? ['电磁阀故障', '温度传感器异常', '水压过低'][Math.floor(Math.random() * 3)] : undefined
        });
        devices.push(device);

        building.deviceCount++;
      }
    }
    await building.save();
  }
  console.log(`✅ 创建 ${devices.length} 台水控终端设备\n`);

  console.log('👨‍🎓 创建学生账户...');
  const students = [];
  for (let i = 0; i < 100; i++) {
    const building = buildings[Math.floor(Math.random() * buildings.length)];
    const floor = Math.floor(Math.random() * building.totalFloors + 1);
    const room = Math.floor(Math.random() * building.roomsPerFloor + 1);
    const studentId = generateStudentId();
    const phone = generatePhone();
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const name = firstNames[Math.floor(Math.random() * firstNames.length)] + 
                 lastNames[Math.floor(Math.random() * lastNames.length)] +
                 (gender === 'male' ? '' : (Math.random() > 0.5 ? '儿' : '婷'));
    
    const balance = parseFloat((Math.random() * 200).toFixed(2));
    const totalRecharge = parseFloat((Math.random() * 1000 + 100).toFixed(2));
    const totalConsumption = parseFloat((totalRecharge - balance).toFixed(2));

    const student = await StudentAccount.create({
      studentId,
      name,
      gender,
      grade: grades[Math.floor(Math.random() * grades.length)],
      major: majors[Math.floor(Math.random() * majors.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      phone,
      email: `${studentId}@campus.edu`,
      idCardNumber: '110101' + Math.random().toString().slice(2, 14),
      buildingId: building._id,
      roomNumber: `${floor}${String(room).padStart(2, '0')}`,
      balance,
      overdraftThreshold: -10,
      totalRecharge,
      totalConsumption,
      status: Math.random() > 0.1 ? 'active' : (Math.random() > 0.5 ? 'frozen' : 'lost'),
      cards: [{
        cardNumber: generateCardNumber(),
        cardType: 'physical',
        status: 'active',
        isDefault: true
      }],
      registrationDate: randomDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date()),
      lastLoginTime: randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date())
    });
    students.push(student);
  }
  console.log(`✅ 创建 ${students.length} 个学生账户\n`);

  console.log('💳 创建交易记录...');
  const transactions = [];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const endDate = new Date();

  for (let i = 0; i < 500; i++) {
    const student = students[Math.floor(Math.random() * students.length)];
    const isRecharge = Math.random() > 0.7;
    const amount = isRecharge ? 
      [10, 20, 50, 100, 200][Math.floor(Math.random() * 5)] :
      -parseFloat((Math.random() * 15 + 1).toFixed(2));
    
    const transactionDate = randomDate(startDate, endDate);

    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      studentId: student.studentId,
      accountId: student._id,
      type: isRecharge ? 'recharge' : 'consumption',
      subType: isRecharge ? undefined : 'hot_water',
      amount,
      balanceAfter: parseFloat((student.balance + amount).toFixed(2)),
      paymentMethod: isRecharge ? ['wechat', 'alipay'][Math.floor(Math.random() * 2)] : 'balance',
      thirdPartyTransactionId: isRecharge ? 'TP' + Date.now() + i : undefined,
      deviceId: isRecharge ? undefined : devices[Math.floor(Math.random() * devices.length)].deviceId,
      waterUsage: isRecharge ? undefined : Math.abs(amount) / 0.05,
      waterTemperature: isRecharge ? undefined : Math.floor(Math.random() * 15 + 40),
      duration: isRecharge ? undefined : Math.floor(Math.random() * 600 + 60),
      status: 'success',
      channel: isRecharge ? 'mini_program' : 'device',
      createdAt: transactionDate,
      completedAt: transactionDate
    });
    transactions.push(transaction);
  }
  console.log(`✅ 创建 ${transactions.length} 条交易记录\n`);

  console.log('📊 创建能耗记录...');
  const energyRecords = [];
  for (let i = 0; i < 300; i++) {
    const device = devices[Math.floor(Math.random() * devices.length)];
    const student = students[Math.floor(Math.random() * students.length)];
    const duration = Math.floor(Math.random() * 600 + 60);
    const waterVolume = parseFloat((Math.random() * 50 + 10).toFixed(1));
    const avgTemperature = parseFloat((Math.random() * 15 + 40).toFixed(1));
    const startTime = randomDate(startDate, endDate);
    const endTime = new Date(startTime.getTime() + duration * 1000);
    const cost = parseFloat((waterVolume * 0.05).toFixed(2));

    const month = startTime.getMonth() + 1;
    let season;
    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    else season = 'winter';

    const energy = await EnergyUsage.create({
      recordId: generateEnergyRecordId(),
      deviceId: device.deviceId,
      buildingId: device.buildingId,
      floor: device.floor,
      studentId: Math.random() > 0.2 ? student.studentId : undefined,
      usageType: 'hot_water',
      startTime,
      endTime,
      duration,
      waterVolume,
      avgFlowRate: parseFloat((waterVolume / (duration / 60)).toFixed(2)),
      avgTemperature,
      cost,
      unitPrice: 0.05,
      season,
      hourOfDay: startTime.getHours(),
      dayOfWeek: startTime.getDay(),
      month,
      year: startTime.getFullYear(),
      isAbnormal: Math.random() > 0.95,
      abnormalReason: Math.random() > 0.95 ? '连续运行超过2小时' : undefined
    });
    energyRecords.push(energy);
  }
  console.log(`✅ 创建 ${energyRecords.length} 条能耗记录\n`);

  console.log('🚨 创建告警记录...');
  const alerts = [];
  const alertTypes = ['device_offline', 'device_fault', 'abnormal_usage', 'low_balance', 'low_signal'];
  const severities = ['info', 'warning', 'critical'];

  for (let i = 0; i < 30; i++) {
    const device = devices[Math.floor(Math.random() * devices.length)];
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const severity = alertType === 'low_balance' ? 'info' : 
                     alertType === 'device_offline' || alertType === 'device_fault' ? 'critical' : 'warning';
    
    const alertTitles = {
      device_offline: `设备离线告警: ${device.deviceName}`,
      device_fault: `设备故障告警: ${device.deviceName}`,
      abnormal_usage: `异常用水检测: ${device.deviceName}`,
      low_balance: '账户余额不足提醒',
      low_signal: `设备信号弱: ${device.deviceName}`
    };

    const alert = await Alert.create({
      alertId: 'ALT' + Date.now() + i,
      alertType,
      severity,
      deviceId: device.deviceId,
      buildingId: device.buildingId,
      studentId: alertType === 'low_balance' ? students[Math.floor(Math.random() * students.length)].studentId : undefined,
      title: alertTitles[alertType],
      description: '系统自动检测生成',
      status: ['new', 'acknowledged', 'processing', 'resolved', 'closed'][Math.floor(Math.random() * 5)],
      data: {
        deviceName: device.deviceName,
        location: device.location
      },
      createdAt: randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date())
    });
    alerts.push(alert);
  }
  console.log(`✅ 创建 ${alerts.length} 条告警记录\n`);

  console.log('🔧 创建运维工单...');
  const workOrders = [];
  const orderTypes = ['repair', 'maintenance', 'inspection'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
  const maintainers = admins.filter(a => a.role === 'maintenance' || a.role === 'operator');

  for (let i = 0; i < 20; i++) {
    const device = devices[Math.floor(Math.random() * devices.length)];
    const alert = Math.random() > 0.5 ? alerts[Math.floor(Math.random() * alerts.length)] : null;
    const maintainer = maintainers[Math.floor(Math.random() * maintainers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const workOrder = await WorkOrder.create({
      orderId: 'WO' + Date.now() + i,
      orderType: orderTypes[Math.floor(Math.random() * orderTypes.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status,
      deviceId: device.deviceId,
      deviceInfo: {
        deviceName: device.deviceName,
        location: device.location,
        buildingId: device.buildingId,
        floor: device.floor,
        faultCode: device.faultCode,
        faultMessage: device.faultMessage
      },
      title: `${device.deviceName} 维修工单`,
      description: '设备异常需要维修处理',
      triggerSource: alert ? 'alert' : 'manual',
      sourceAlertId: alert?._id,
      assigneeId: status !== 'pending' ? maintainer._id : undefined,
      assigneeName: status !== 'pending' ? maintainer.name : undefined,
      estimatedTime: Math.floor(Math.random() * 120 + 30),
      actualTime: status === 'completed' ? Math.floor(Math.random() * 120 + 30) : undefined,
      totalCost: status === 'completed' ? parseFloat((Math.random() * 500 + 50).toFixed(2)) : 0,
      createdBy: admins[0]._id,
      createdAt: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
      assignedAt: status !== 'pending' ? new Date() : undefined,
      startedAt: status === 'in_progress' || status === 'completed' ? new Date() : undefined,
      completedAt: status === 'completed' ? new Date() : undefined,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      resolution: status === 'completed' ? '已更换故障部件，设备恢复正常' : undefined
    });
    workOrders.push(workOrder);
  }
  console.log(`✅ 创建 ${workOrders.length} 条运维工单\n`);

  console.log('🎉 数据库初始化完成！');
  console.log('\n📋 数据统计:');
  console.log(`  管理员账户: ${admins.length}`);
  console.log(`  宿舍楼: ${buildings.length}`);
  console.log(`  水控终端: ${devices.length}`);
  console.log(`  学生账户: ${students.length}`);
  console.log(`  交易记录: ${transactions.length}`);
  console.log(`  能耗记录: ${energyRecords.length}`);
  console.log(`  告警记录: ${alerts.length}`);
  console.log(`  运维工单: ${workOrders.length}`);
  
  console.log('\n🔑 默认登录账户:');
  console.log('  超级管理员: admin / admin123');
  console.log('  运维操作员: operator / operator123');
  console.log('  维修工程师: maintenance / maintenance123');
  console.log('  财务管理员: finance / finance123');
  console.log('\n  学生登录: 使用学生ID，密码为手机号后6位（默认123456）');
  console.log('  示例学生ID:', students[0].studentId);

  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('❌ 数据初始化失败:', err);
  process.exit(1);
});
