// 模拟数据服务，当MongoDB连接失败时使用

// 模拟用户数据
const mockUsers = [
  {
    _id: '1',
    username: 'admin',
    password: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // admin123
    role: 'admin',
    name: '系统管理员',
    email: 'admin@example.com',
    phone: '13800000001'
  },
  {
    _id: '2',
    username: 'technician1',
    password: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // tech123
    role: 'technician',
    name: '维修工张师傅',
    email: 'tech1@example.com',
    phone: '13800000002'
  },
  {
    _id: '3',
    username: 'technician2',
    password: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // tech123
    role: 'technician',
    name: '维修工李师傅',
    email: 'tech2@example.com',
    phone: '13800000003'
  },
  {
    _id: '4',
    username: 'user1',
    password: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // user123
    role: 'user',
    name: '操作员小王',
    email: 'user1@example.com',
    phone: '13800000004'
  },
  {
    _id: '5',
    username: 'sparepart',
    password: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // spare123
    role: 'sparePartManager',
    name: '备件管理员小李',
    email: 'spare@example.com',
    phone: '13800000005'
  }
];

// 模拟设备数据
const mockEquipments = [
  {
    _id: '1',
    name: '数控车床',
    code: 'EQ-001',
    type: '加工设备',
    model: 'CJK-6136',
    manufacturer: '沈阳机床厂',
    purchaseDate: new Date('2023-01-15'),
    installDate: new Date('2023-02-01'),
    location: '生产车间A区',
    status: 'normal',
    maintenanceCycle: 30,
    nextMaintenanceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    associatedSpareParts: [
      { sparePartId: '1', quantity: 5 },
      { sparePartId: '2', quantity: 10 }
    ],
    createdBy: '1'
  },
  {
    _id: '2',
    name: '激光切割机',
    code: 'EQ-002',
    type: '切割设备',
    model: 'LCT-3000',
    manufacturer: '大族激光',
    purchaseDate: new Date('2023-03-20'),
    installDate: new Date('2023-04-01'),
    location: '生产车间B区',
    status: 'normal',
    maintenanceCycle: 45,
    nextMaintenanceDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    associatedSpareParts: [
      { sparePartId: '4', quantity: 1 }
    ],
    createdBy: '1'
  },
  {
    _id: '3',
    name: '空压机',
    code: 'EQ-003',
    type: '动力设备',
    model: 'KA-200',
    manufacturer: '阿特拉斯',
    purchaseDate: new Date('2022-11-10'),
    installDate: new Date('2022-12-01'),
    location: '动力站房',
    status: 'repair',
    maintenanceCycle: 60,
    nextMaintenanceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    associatedSpareParts: [],
    createdBy: '1'
  }
];

// 模拟备件数据
const mockSpareParts = [
  {
    _id: '1',
    name: '车刀刀片',
    code: 'SP-001',
    type: '刀具',
    model: 'DCGT11T308',
    manufacturer: '山特维克',
    stockQuantity: 100,
    minimumStock: 20,
    unit: '片',
    price: 85,
    createdBy: '1'
  },
  {
    _id: '2',
    name: '轴承',
    code: 'SP-002',
    type: '标准件',
    model: '6205-2Z',
    manufacturer: 'SKF',
    stockQuantity: 50,
    minimumStock: 10,
    unit: '个',
    price: 120,
    createdBy: '1'
  },
  {
    _id: '3',
    name: '液压油',
    code: 'SP-003',
    type: '润滑油',
    model: 'HM-46',
    manufacturer: '壳牌',
    stockQuantity: 200,
    minimumStock: 50,
    unit: '升',
    price: 35,
    createdBy: '1'
  },
  {
    _id: '4',
    name: '激光发生器',
    code: 'SP-004',
    type: '核心部件',
    model: 'Fiber-1000',
    manufacturer: '大族激光',
    stockQuantity: 5,
    minimumStock: 2,
    unit: '个',
    price: 15000,
    createdBy: '1'
  }
];

// 模拟保养计划数据
const mockMaintenancePlans = [
  {
    _id: '1',
    equipmentId: '1',
    planDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    executor: null,
    status: 'pending',
    createdBy: '1'
  },
  {
    _id: '2',
    equipmentId: '2',
    planDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    executor: null,
    status: 'pending',
    createdBy: '1'
  },
  {
    _id: '3',
    equipmentId: '3',
    planDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    executor: '2',
    status: 'inProgress',
    createdBy: '1'
  }
];

// 模拟维修工单数据
const mockRepairOrders = [
  {
    _id: '1',
    equipmentId: '3',
    requester: '4',
    technician: '2',
    status: 'inProgress',
    faultDescription: '空压机运行异响',
    faultReason: '轴承磨损',
    solution: '更换轴承',
    repairTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    usedSpareParts: [
      { sparePartId: '2', quantity: 2 }
    ],
    acceptanceStatus: 'pending'
  }
];

// 模拟日志数据
const mockLogs = [
  {
    _id: '1',
    user: '1',
    action: 'create',
    resourceType: 'equipment',
    resourceId: '1',
    description: '系统管理员 created equipment',
    ip: '127.0.0.1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  },
  {
    _id: '2',
    user: '4',
    action: 'create',
    resourceType: 'repair',
    resourceId: '1',
    description: '操作员小王 created repair order',
    ip: '127.0.0.1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
];

// 模拟统计数据
const mockStatistics = {
  failureRate: 33.33,
  mtbf: 180,
  mttr: 8,
  maintenanceCost: 240,
  healthScores: [
    {
      equipmentId: '1',
      equipmentName: '数控车床',
      healthScore: 90
    },
    {
      equipmentId: '2',
      equipmentName: '激光切割机',
      healthScore: 85
    },
    {
      equipmentId: '3',
      equipmentName: '空压机',
      healthScore: 60
    }
  ]
};

module.exports = {
  mockUsers,
  mockEquipments,
  mockSpareParts,
  mockMaintenancePlans,
  mockRepairOrders,
  mockLogs,
  mockStatistics
};