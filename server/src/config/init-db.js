require('dotenv').config();
const { sequelize, User, Department, TimeSlot, SystemConfig } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    await sequelize.sync({ force: true });
    console.log('数据库表创建完成');
    
    await createAdminUser();
    await createDefaultDepartments();
    await createDefaultTimeSlots();
    await createDefaultConfigs();
    
    console.log('\n数据库初始化完成！');
    console.log('默认管理员账号：admin / admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

async function createAdminUser() {
  console.log('创建默认管理员账号...');
  
  const adminUser = await User.create({
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    realName: '系统管理员',
    role: 'admin',
    status: true
  });
  
  console.log('管理员账号创建成功:', adminUser.username);
}

async function createDefaultDepartments() {
  console.log('创建默认部门...');
  
  const departments = [
    {
      name: '组委会',
      code: 'ORG001',
      description: '会展组委会',
      sort: 1,
      status: true
    },
    {
      name: 'VIP区',
      code: 'VIP001',
      description: 'VIP贵宾区',
      sort: 2,
      status: true
    },
    {
      name: '参展商区',
      code: 'EXH001',
      description: '参展商区域',
      sort: 3,
      status: true
    },
    {
      name: '观众区',
      code: 'AUD001',
      description: '观众入场区域',
      sort: 4,
      status: true
    },
    {
      name: '餐饮区',
      code: 'CAT001',
      description: '餐饮服务区域',
      sort: 5,
      status: true
    },
    {
      name: '签到区',
      code: 'REG001',
      description: '签到登记区域',
      sort: 6,
      status: true
    }
  ];
  
  for (const dept of departments) {
    await Department.create(dept);
  }
  
  console.log('默认部门创建完成，共', departments.length, '个部门');
}

async function createDefaultTimeSlots() {
  console.log('创建默认时段...');
  
  const timeSlots = [
    {
      name: '上午入场时段',
      code: 'ENTRY_MORNING',
      type: 'entry',
      startTime: '08:00:00',
      endTime: '12:00:00',
      description: '上午入场时段',
      sort: 1,
      status: true
    },
    {
      name: '下午入场时段',
      code: 'ENTRY_AFTERNOON',
      type: 'entry',
      startTime: '13:00:00',
      endTime: '18:00:00',
      description: '下午入场时段',
      sort: 2,
      status: true
    },
    {
      name: '早餐时段',
      code: 'CATERING_BREAKFAST',
      type: 'catering',
      startTime: '07:00:00',
      endTime: '09:00:00',
      description: '早餐服务时段',
      sort: 3,
      status: true
    },
    {
      name: '午餐时段',
      code: 'CATERING_LUNCH',
      type: 'catering',
      startTime: '11:30:00',
      endTime: '14:00:00',
      description: '午餐服务时段',
      sort: 4,
      status: true
    },
    {
      name: '晚餐时段',
      code: 'CATERING_DINNER',
      type: 'catering',
      startTime: '17:30:00',
      endTime: '20:00:00',
      description: '晚餐服务时段',
      sort: 5,
      status: true
    },
    {
      name: '图册领取时段',
      code: 'BOOKLET_GENERAL',
      type: 'booklet',
      startTime: '08:00:00',
      endTime: '18:00:00',
      description: '图册领取时段',
      sort: 6,
      status: true
    }
  ];
  
  for (const slot of timeSlots) {
    await TimeSlot.create(slot);
  }
  
  console.log('默认时段创建完成，共', timeSlots.length, '个时段');
}

async function createDefaultConfigs() {
  console.log('创建默认系统配置...');
  
  const configs = [
    {
      group: 'general',
      key: 'system.name',
      value: process.env.SYSTEM_NAME || '会展管理系统',
      type: 'string',
      description: '系统名称',
      sort: 1
    },
    {
      group: 'general',
      key: 'system.version',
      value: '1.0.0',
      type: 'string',
      description: '系统版本',
      sort: 2
    },
    {
      group: 'barcode',
      key: 'barcode.maxEntryCount',
      value: '1',
      type: 'number',
      description: '默认最大入场次数',
      sort: 1
    },
    {
      group: 'barcode',
      key: 'barcode.maxCateringCount',
      value: '1',
      type: 'number',
      description: '默认最大餐饮次数',
      sort: 2
    },
    {
      group: 'barcode',
      key: 'barcode.maxBookletCount',
      value: '1',
      type: 'number',
      description: '默认最大图册领取次数',
      sort: 3
    },
    {
      group: 'device',
      key: 'device.heartbeat.interval',
      value: '60',
      type: 'number',
      description: '设备心跳间隔（秒）',
      sort: 1
    },
    {
      group: 'device',
      key: 'device.heartbeat.timeout',
      value: '180',
      type: 'number',
      description: '设备离线超时（秒）',
      sort: 2
    }
  ];
  
  for (const config of configs) {
    await SystemConfig.create(config);
  }
  
  console.log('默认系统配置创建完成，共', configs.length, '个配置项');
}

initDatabase();
