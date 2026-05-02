const { v4: uuidv4 } = require('uuid');
const {
  User,
  Enterprise,
  MonitorPoint,
  MonitorData,
  ViolationEvent,
} = require('./models');
const moment = require('moment');

const ADMIN_REGULATOR = {
  id: uuidv4(),
  username: 'admin',
  password: 'admin123',
  role: 'regulator',
  name: '系统管理员',
  phone: '13800138000',
  email: 'admin@env-monitor.gov',
  status: 'active',
};

const REGULATORS = [
  {
    id: uuidv4(),
    username: 'regulator1',
    password: '123456',
    role: 'regulator',
    name: '张监管员',
    phone: '13800138001',
    email: 'zhangsan@env-monitor.gov',
    status: 'active',
  },
  {
    id: uuidv4(),
    username: 'regulator2',
    password: '123456',
    role: 'regulator',
    name: '李监管员',
    phone: '13800138002',
    email: 'lisi@env-monitor.gov',
    status: 'active',
  },
];

const ENTERPRISES = [
  {
    id: uuidv4(),
    name: '蓝天化工有限公司',
    code: 'ENTER-001',
    industryType: '化工',
    address: '上海市浦东新区张江高科技园区科苑路88号',
    latitude: 31.2304,
    longitude: 121.4737,
    legalPerson: '王蓝天',
    contactPhone: '13900139001',
    creditScore: 85,
    complianceStatus: 'compliant',
    status: 'active',
  },
  {
    id: uuidv4(),
    name: '碧水环保科技股份有限公司',
    code: 'ENTER-002',
    industryType: '环保',
    address: '上海市杨浦区国定路335号',
    latitude: 31.2904,
    longitude: 121.5037,
    legalPerson: '赵碧水',
    contactPhone: '13900139002',
    creditScore: 92,
    complianceStatus: 'compliant',
    status: 'active',
  },
  {
    id: uuidv4(),
    name: '金茂钢铁集团',
    code: 'ENTER-003',
    industryType: '冶金',
    address: '上海市宝山区牡丹江路1813号',
    latitude: 31.4050,
    longitude: 121.4900,
    legalPerson: '钱金茂',
    contactPhone: '13900139003',
    creditScore: 72,
    complianceStatus: 'warning',
    status: 'active',
  },
  {
    id: uuidv4(),
    name: '绿源新能源有限公司',
    code: 'ENTER-004',
    industryType: '新能源',
    address: '上海市嘉定区安亭镇墨玉路28号',
    latitude: 31.2804,
    longitude: 121.2737,
    legalPerson: '孙绿源',
    contactPhone: '13900139004',
    creditScore: 95,
    complianceStatus: 'compliant',
    status: 'active',
  },
];

const generateMonitorPoints = (enterprise, count, type) => {
  const points = [];
  const baseLat = parseFloat(enterprise.latitude);
  const baseLng = parseFloat(enterprise.longitude);

  for (let i = 0; i < count; i++) {
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;

    const thresholds = {
      air: { PM25: 35, PM10: 70, SO2: 150, NO2: 80, CO: 10, O3: 160 },
      water: { PH: 6.5, PH_MAX: 8.5, COD: 20, BOD: 4, NH3N: 1.0, TP: 0.2 },
      noise: { dB: 55 },
      soil: { Cd: 0.3, Hg: 0.3, As: 40, Pb: 80, Cr: 150 },
    };

    const indicators = {
      air: ['PM25', 'PM10', 'SO2', 'NO2', 'CO', 'O3'],
      water: ['PH', 'COD', 'BOD', 'NH3N', 'TP'],
      noise: ['dB'],
      soil: ['Cd', 'Hg', 'As', 'Pb', 'Cr'],
    };

    const names = {
      air: ['废气排放口A', '废气排放口B', '厂区监测点', '周边敏感点'],
      water: ['污水排放口A', '污水排放口B', '雨水排放口', '在线监测点'],
      noise: ['厂界北侧', '厂界东侧', '厂界南侧', '厂界西侧'],
      soil: ['土壤监测点A', '土壤监测点B', '地下水监测点', '周边土壤'],
    };

    points.push({
      id: uuidv4(),
      code: `${enterprise.code}-${type.toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
      name: names[type][i] || `${enterprise.name}${type === 'air' ? '空气' : type === 'water' ? '水质' : type === 'noise' ? '噪声' : '土壤'}监测点${i + 1}`,
      type,
      latitude: baseLat + latOffset,
      longitude: baseLng + lngOffset,
      enterpriseId: enterprise.id,
      address: enterprise.address,
      indicators: indicators[type],
      thresholds: thresholds[type],
      status: 'active',
      isMonitored: true,
    });
  }

  return points;
};

const generateMonitorData = (monitorPoint, hours = 24) => {
  const dataPoints = [];
  const baseTime = moment();

  const normalRanges = {
    air: {
      PM25: { min: 10, max: 60 },
      PM10: { min: 20, max: 120 },
      SO2: { min: 5, max: 80 },
      NO2: { min: 10, max: 100 },
      CO: { min: 1, max: 8 },
      O3: { min: 20, max: 140 },
    },
    water: {
      PH: { min: 6.8, max: 8.2 },
      COD: { min: 5, max: 18 },
      BOD: { min: 1, max: 3.5 },
      NH3N: { min: 0.1, max: 0.8 },
      TP: { min: 0.02, max: 0.15 },
    },
    noise: {
      dB: { min: 40, max: 65 },
    },
    soil: {
      Cd: { min: 0.05, max: 0.25 },
      Hg: { min: 0.02, max: 0.25 },
      As: { min: 5, max: 35 },
      Pb: { min: 10, max: 70 },
      Cr: { min: 20, max: 120 },
    },
  };

  const ranges = normalRanges[monitorPoint.type] || {};

  for (let i = 0; i < hours * 2; i++) {
    const dataTime = moment(baseTime).subtract(i * 30, 'minutes').toDate();
    const rawData = {};

    for (const indicator of monitorPoint.indicators) {
      const range = ranges[indicator];
      if (range) {
        rawData[indicator] = parseFloat((range.min + Math.random() * (range.max - range.min)).toFixed(2));
      }
    }

    rawData.sensorId = `SNS-${monitorPoint.code}`;
    rawData.signalStrength = 85 + Math.floor(Math.random() * 15);
    rawData.batteryLevel = parseFloat((80 + Math.random() * 20).toFixed(1));

    dataPoints.push({
      id: uuidv4(),
      monitorPointId: monitorPoint.id,
      rawData,
      dataTime,
      isAnomaly: Math.random() < 0.02,
    });
  }

  return dataPoints;
};

async function initData() {
  console.log('开始初始化数据...');

  const existingAdmin = await User.findOne({ where: { username: 'admin' } });
  if (existingAdmin) {
    console.log('数据已存在，跳过初始化');
    return;
  }

  console.log('创建用户账号...');

  await User.create(ADMIN_REGULATOR);

  for (const regulator of REGULATORS) {
    await User.create(regulator);
  }

  const enterpriseUsers = [
    {
      id: uuidv4(),
      username: 'lantian_user',
      password: '123456',
      role: 'enterprise',
      name: '蓝天化工管理员',
      phone: '13800138010',
      email: 'admin@lantian.com',
      enterpriseId: ENTERPRISES[0].id,
      status: 'active',
    },
    {
      id: uuidv4(),
      username: 'bishui_user',
      password: '123456',
      role: 'enterprise',
      name: '碧水环保管理员',
      phone: '13800138011',
      email: 'admin@bishui.com',
      enterpriseId: ENTERPRISES[1].id,
      status: 'active',
    },
    {
      id: uuidv4(),
      username: 'jinmao_user',
      password: '123456',
      role: 'enterprise',
      name: '金茂钢铁管理员',
      phone: '13800138012',
      email: 'admin@jinmao.com',
      enterpriseId: ENTERPRISES[2].id,
      status: 'active',
    },
  ];

  for (const enterprise of ENTERPRISES) {
    await Enterprise.create(enterprise);
  }

  for (const eu of enterpriseUsers) {
    await User.create(eu);
  }

  console.log('创建监测点数据...');

  const allMonitorPoints = [];

  for (const enterprise of ENTERPRISES) {
    const airPoints = generateMonitorPoints(enterprise, 2, 'air');
    const waterPoints = generateMonitorPoints(enterprise, 2, 'water');
    const noisePoints = generateMonitorPoints(enterprise, 1, 'noise');

    allMonitorPoints.push(...airPoints, ...waterPoints, ...noisePoints);
  }

  for (const point of allMonitorPoints) {
    await MonitorPoint.create(point);
  }

  console.log('创建监测数据...');

  for (const point of allMonitorPoints) {
    const dataPoints = generateMonitorData(point, 12);
    for (const data of dataPoints) {
      await MonitorData.create(data);
    }
  }

  console.log('初始化数据完成！');
  console.log('========================================');
  console.log('  可用账号信息:');
  console.log('========================================');
  console.log('  监管员账号:');
  console.log('    - admin / admin123 (系统管理员)');
  console.log('    - regulator1 / 123456 (张监管员)');
  console.log('    - regulator2 / 123456 (李监管员)');
  console.log('  企业账号:');
  console.log('    - lantian_user / 123456 (蓝天化工)');
  console.log('    - bishui_user / 123456 (碧水环保)');
  console.log('    - jinmao_user / 123456 (金茂钢铁)');
  console.log('========================================');
}

module.exports = initData;
