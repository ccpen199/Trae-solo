import {
  Device,
  DeviceGroup,
  FamilyMember,
  AlertEvent,
  Scene,
  StoragePlan,
  FirmwareVersion,
  OTATask,
  AuditLog,
  DeviceHealth,
} from '../types';

export const mockDevices: Device[] = [
  {
    id: 'dev001',
    name: '客厅摄像头',
    type: 'IPC',
    model: 'YST-IPC-A3Pro',
    firmwareVersion: 'v3.2.1',
    status: 'online',
    groupId: 'grp001',
    ipAddress: '192.168.1.101',
    macAddress: 'AA:BB:CC:11:22:33',
    storage: {
      total: 128,
      used: 45,
      sdCard: true,
      sdTotal: 128,
      sdUsed: 45,
    },
    privacy: {
      cameraEnabled: true,
      audioEnabled: true,
      physicalLock: false,
    },
    lastOnline: new Date().toISOString(),
    location: '客厅',
    signalStrength: 95,
  },
  {
    id: 'dev002',
    name: '门口摄像头',
    type: 'doorbell',
    model: 'YST-DB-M2',
    firmwareVersion: 'v2.8.0',
    status: 'online',
    groupId: 'grp001',
    ipAddress: '192.168.1.102',
    macAddress: 'AA:BB:CC:11:22:34',
    storage: {
      total: 64,
      used: 12,
      sdCard: true,
      sdTotal: 64,
      sdUsed: 12,
    },
    privacy: {
      cameraEnabled: true,
      audioEnabled: true,
      physicalLock: false,
    },
    lastOnline: new Date().toISOString(),
    location: '门口',
    signalStrength: 88,
  },
  {
    id: 'dev003',
    name: '卧室摄像头',
    type: 'IPC',
    model: 'YST-IPC-A3Pro',
    firmwareVersion: 'v3.2.1',
    status: 'online',
    groupId: 'grp002',
    ipAddress: '192.168.1.103',
    macAddress: 'AA:BB:CC:11:22:35',
    storage: {
      total: 128,
      used: 78,
      sdCard: true,
      sdTotal: 128,
      sdUsed: 78,
    },
    privacy: {
      cameraEnabled: false,
      audioEnabled: false,
      physicalLock: true,
    },
    lastOnline: new Date().toISOString(),
    location: '主卧',
    signalStrength: 72,
  },
  {
    id: 'dev004',
    name: '车库摄像头',
    type: 'IPC',
    model: 'YST-IPC-B5',
    firmwareVersion: 'v3.1.5',
    status: 'offline',
    groupId: 'grp001',
    ipAddress: '192.168.1.104',
    macAddress: 'AA:BB:CC:11:22:36',
    storage: {
      total: 256,
      used: 120,
      sdCard: true,
      sdTotal: 256,
      sdUsed: 120,
    },
    privacy: {
      cameraEnabled: true,
      audioEnabled: false,
      physicalLock: false,
    },
    lastOnline: new Date(Date.now() - 3600000 * 2).toISOString(),
    location: '车库',
    signalStrength: 45,
  },
  {
    id: 'dev005',
    name: 'NVR录像机',
    type: 'NVR',
    model: 'YST-NVR-8CH',
    firmwareVersion: 'v4.0.2',
    status: 'online',
    groupId: 'grp001',
    ipAddress: '192.168.1.105',
    macAddress: 'AA:BB:CC:11:22:37',
    storage: {
      total: 4096,
      used: 2800,
      sdCard: false,
      sdTotal: 0,
      sdUsed: 0,
    },
    privacy: {
      cameraEnabled: true,
      audioEnabled: true,
      physicalLock: false,
    },
    lastOnline: new Date().toISOString(),
    location: '弱电箱',
    signalStrength: 100,
  },
];

export const mockDeviceGroups: DeviceGroup[] = [
  { id: 'grp001', name: '公共区域', deviceIds: ['dev001', 'dev002', 'dev004', 'dev005'] },
  { id: 'grp002', name: '私人区域', deviceIds: ['dev003'] },
];

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: 'user001',
    name: '张先生',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
    role: 'owner',
    permissions: ['all'],
    joinTime: '2023-01-15T08:00:00Z',
  },
  {
    id: 'user002',
    name: '张太太',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    role: 'admin',
    permissions: ['device:view', 'device:control', 'alert:view', 'scene:manage'],
    joinTime: '2023-01-16T10:00:00Z',
  },
  {
    id: 'user003',
    name: '小宝',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=member',
    role: 'member',
    permissions: ['device:view', 'alert:view'],
    joinTime: '2023-03-20T14:30:00Z',
  },
  {
    id: 'user004',
    name: '王阿姨',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
    role: 'viewer',
    permissions: ['device:view'],
    joinTime: '2024-01-10T09:00:00Z',
  },
];

const generateMockAlerts = (): AlertEvent[] => {
  const alerts: AlertEvent[] = [];
  const types = [
    { type: 'motion' as const, desc: '移动侦测', level: 'warning' as const },
    { type: 'person' as const, desc: '人形识别', level: 'critical' as const },
    { type: 'sound' as const, desc: '声音异常', level: 'warning' as const },
    { type: 'occlusion' as const, desc: '画面遮挡', level: 'info' as const },
    { type: 'low_storage' as const, desc: '存储空间不足', level: 'info' as const },
  ];

  const devices = mockDevices.filter((d) => d.type !== 'NVR');
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const typeInfo = types[Math.floor(Math.random() * types.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const time = new Date(now - Math.random() * 7 * 24 * 3600 * 1000);

    alerts.push({
      id: `alert_${i}`,
      deviceId: device.id,
      deviceName: device.name,
      type: typeInfo.type,
      level: typeInfo.level,
      timestamp: time.toISOString(),
      thumbnail: `https://picsum.photos/320/240?random=${i}`,
      videoUrl: '#',
      read: i > 30,
      locked: i % 15 === 0,
      description: `${device.name} 检测到${typeInfo.desc}`,
    });
  }

  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const mockAlerts: AlertEvent[] = generateMockAlerts();

export const mockScenes: Scene[] = [
  {
    id: 'scene001',
    name: '有人经过自动录像',
    description: '检测到人形时自动录像并推送消息',
    enabled: true,
    trigger: {
      type: 'person_detect',
      deviceIds: ['dev001', 'dev002'],
    },
    actions: [
      { type: 'record', params: { duration: 30 } },
      { type: 'push_notification', params: { channel: 'wechat', template: 'person_alert' } },
    ],
  },
  {
    id: 'scene002',
    name: '夜间警戒模式',
    description: '夜间开启移动侦测和灯光联动',
    enabled: true,
    trigger: {
      type: 'schedule',
      deviceIds: ['dev001', 'dev002', 'dev004'],
      condition: { timeStart: '22:00', timeEnd: '06:00' },
    },
    actions: [
      { type: 'light_on', params: { brightness: 80 } },
      { type: 'record', params: { duration: 15 } },
    ],
  },
  {
    id: 'scene003',
    name: '离家布防',
    description: '离家时所有设备进入警戒状态',
    enabled: false,
    trigger: {
      type: 'manual',
      deviceIds: ['dev001', 'dev002', 'dev003', 'dev004'],
    },
    actions: [
      { type: 'siren', params: { duration: 0 } },
      { type: 'push_notification', params: { channel: 'all' } },
    ],
  },
  {
    id: 'scene004',
    name: '睡眠隐私保护',
    description: '睡眠时间自动开启隐私保护',
    enabled: true,
    trigger: {
      type: 'schedule',
      deviceIds: ['dev003'],
      condition: { timeStart: '23:00', timeEnd: '07:00' },
    },
    actions: [
      { type: 'privacy_mode', params: { camera: true, audio: true, lock: true } },
    ],
  },
];

export const mockStoragePlans: StoragePlan[] = [
  {
    type: 'cloud_7d',
    name: '7天云存储',
    description: '云端循环录制7天，支持事件标记',
    price: 9.9,
    cycleDays: 7,
  },
  {
    type: 'cloud_30d',
    name: '30天云存储',
    description: '云端循环录制30天，更长久的保护',
    price: 29.9,
    cycleDays: 30,
  },
  {
    type: 'sd_card',
    name: 'SD卡存储',
    description: '本地SD卡循环录制，免费使用',
    price: 0,
    cycleDays: 0,
  },
];

export const mockFirmwares: FirmwareVersion[] = [
  {
    id: 'fw001',
    version: 'v3.2.1',
    model: 'YST-IPC-A3Pro',
    releaseDate: '2024-05-10',
    releaseNotes: '优化人形识别准确率；修复偶发性离线问题；新增隐私保护物理锁定功能',
    fileSize: 15728640,
    md5: 'a1b2c3d4e5f6',
    status: 'full',
    grayRegions: [],
    grayPercentage: 100,
  },
  {
    id: 'fw002',
    version: 'v3.3.0',
    model: 'YST-IPC-A3Pro',
    releaseDate: '2024-06-10',
    releaseNotes: '新增AI场景识别；优化H.265编码效率；提升夜视效果',
    fileSize: 16777216,
    md5: 'f6e5d4c3b2a1',
    status: 'gray',
    grayRegions: ['华东', '华南'],
    grayPercentage: 30,
  },
  {
    id: 'fw003',
    version: 'v2.8.0',
    model: 'YST-DB-M2',
    releaseDate: '2024-04-20',
    releaseNotes: '优化电池续航；新增叮咚铃声自定义；修复双向对讲杂音问题',
    fileSize: 8388608,
    md5: '1234567890ab',
    status: 'full',
    grayRegions: [],
    grayPercentage: 100,
  },
  {
    id: 'fw004',
    version: 'v4.0.2',
    model: 'YST-NVR-8CH',
    releaseDate: '2024-05-25',
    releaseNotes: '支持8路1080P同时录制；新增智能检索功能；优化硬盘管理',
    fileSize: 33554432,
    md5: 'abcdef123456',
    status: 'full',
    grayRegions: [],
    grayPercentage: 100,
  },
];

export const mockOTATasks: OTATask[] = [
  {
    id: 'ota001',
    firmwareId: 'fw002',
    version: 'v3.3.0',
    status: 'running',
    totalDevices: 1500,
    successDevices: 320,
    failedDevices: 12,
    startTime: '2024-06-12T02:00:00Z',
    strategy: 'region',
    regions: ['华东', '华南'],
    models: ['YST-IPC-A3Pro'],
  },
  {
    id: 'ota002',
    firmwareId: 'fw001',
    version: 'v3.2.1',
    status: 'completed',
    totalDevices: 5000,
    successDevices: 4985,
    failedDevices: 15,
    startTime: '2024-05-15T02:00:00Z',
    endTime: '2024-05-20T18:00:00Z',
    strategy: 'all',
    regions: [],
    models: ['YST-IPC-A3Pro'],
  },
  {
    id: 'ota003',
    firmwareId: 'fw004',
    version: 'v4.0.2',
    status: 'completed',
    totalDevices: 800,
    successDevices: 790,
    failedDevices: 10,
    startTime: '2024-05-28T02:00:00Z',
    endTime: '2024-05-30T12:00:00Z',
    strategy: 'all',
    regions: [],
    models: ['YST-NVR-8CH'],
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log001',
    userId: 'user001',
    userName: '张先生',
    action: '开启隐私模式',
    deviceId: 'dev003',
    deviceName: '卧室摄像头',
    ip: '114.247.50.123',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    details: '通过微信小程序开启卧室摄像头隐私模式',
  },
  {
    id: 'log002',
    userId: 'user002',
    userName: '张太太',
    action: '查看实时画面',
    deviceId: 'dev001',
    deviceName: '客厅摄像头',
    ip: '114.247.50.123',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    details: '查看客厅摄像头实时画面，时长5分23秒',
  },
  {
    id: 'log003',
    userId: 'user001',
    userName: '张先生',
    action: '固件升级',
    deviceId: 'dev002',
    deviceName: '门口摄像头',
    ip: '123.125.71.100',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    details: '手动触发门口摄像头固件升级到v2.8.0',
  },
  {
    id: 'log004',
    userId: 'user001',
    userName: '张先生',
    action: '添加成员',
    ip: '123.125.71.100',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    details: '邀请王阿姨加入家庭组，角色：查看者',
  },
  {
    id: 'log005',
    userId: 'user003',
    userName: '小宝',
    action: '设备分享',
    deviceId: 'dev001',
    deviceName: '客厅摄像头',
    ip: '223.104.38.255',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    details: '临时分享客厅摄像头权限给同学',
  },
];

export const mockDeviceHealths: DeviceHealth[] = mockDevices.map((device) => ({
  deviceId: device.id,
  deviceName: device.name,
  onlineRate: device.status === 'online' ? 98.5 : 72.3,
  offlineCount: device.status === 'online' ? 2 : 15,
  lastOfflineTime: device.status === 'offline' ? device.lastOnline : undefined,
  recordingIntegrity: device.storage.used / device.storage.total > 0.9 ? 65 : 95,
  storageWarning: device.storage.used / device.storage.total > 0.8,
  firmwareOutdated: device.firmwareVersion === 'v3.1.5',
  overallScore: device.status === 'online' ? 92 : 68,
}));

export const mockUser = {
  id: 'user001',
  name: '张先生',
  phone: '138****8888',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
  homeId: 'home001',
  homeName: '我的家',
};
