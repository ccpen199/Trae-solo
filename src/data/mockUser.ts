import { User, DeviceInfo } from '@/types/user';

export const mockCurrentUser: User = {
  id: 'u001',
  name: '张明',
  avatar: 'https://picsum.photos/id/1005/200/200',
  phone: '13800138000',
  email: 'zhangming@company.com',
  position: '信息中心主任',
  departmentId: 'dept001',
  departmentName: '省公司信息中心',
  orgLevel: 'province',
  roles: ['admin', 'user'],
  permissions: ['approval:view', 'approval:create', 'document:edit', 'admin:all'],
  status: 'active',
  lastLoginTime: '2026-06-21 08:30:00',
  bioAuthEnabled: true,
  encryptKey: '0123456789abcdef0123456789abcdef',
  orgId: 'org001'
};

export const mockDevices: DeviceInfo[] = [
  {
    id: 'd001',
    deviceName: 'iPhone 14 Pro',
    deviceType: 'ios',
    lastLoginTime: '2026-06-21 08:30:00',
    ipAddress: '192.168.1.101',
    isCurrent: true,
    model: 'iPhone 14 Pro',
    system: 'iOS',
    systemVersion: '17.0',
    deviceId: 'd001'
  },
  {
    id: 'd002',
    deviceName: '华为 Mate 50',
    deviceType: 'android',
    lastLoginTime: '2026-06-20 18:45:00',
    ipAddress: '192.168.1.102',
    isCurrent: false,
    model: '华为 Mate 50',
    system: 'HarmonyOS',
    systemVersion: '4.0',
    deviceId: 'd002'
  },
  {
    id: 'd003',
    deviceName: 'MacBook Pro',
    deviceType: 'web',
    lastLoginTime: '2026-06-19 14:20:00',
    ipAddress: '192.168.1.103',
    isCurrent: false,
    model: 'MacBook Pro 14"',
    system: 'macOS',
    systemVersion: '14.0',
    deviceId: 'd003'
  }
];
