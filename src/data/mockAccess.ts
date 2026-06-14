import type { AccessDevice, AccessLog, AccessAuth, VisitorInvite } from '@/types';

export const mockDevices: (AccessDevice & { todayCount?: number; signal?: string; lastHeartbeat?: string; })[] = [
  { id: 'D001', name: '小区东门', location: '小区东侧主入口', type: 'gate', status: 'online', lastOnline: '2026-06-10 08:32:15', batteryLevel: 92, buildingScope: ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋'], todayCount: 186, signal: '-62', lastHeartbeat: '2026-06-10 08:32:15' },
  { id: 'D002', name: '小区西门', location: '小区西侧次入口', type: 'gate', status: 'online', lastOnline: '2026-06-10 08:30:22', batteryLevel: 85, buildingScope: ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋'], todayCount: 142, signal: '-58', lastHeartbeat: '2026-06-10 08:30:22' },
  { id: 'D003', name: '5栋1单元门', location: '5栋1单元入口', type: 'ble', status: 'online', lastOnline: '2026-06-10 08:31:45', batteryLevel: 76, buildingScope: ['5栋'], todayCount: 98, signal: '-72', lastHeartbeat: '2026-06-10 08:31:45' },
  { id: 'D004', name: '5栋2单元门', location: '5栋2单元入口', type: 'ble', status: 'online', lastOnline: '2026-06-10 08:32:01', batteryLevel: 81, buildingScope: ['5栋'], todayCount: 124, signal: '-68', lastHeartbeat: '2026-06-10 08:32:01' },
  { id: 'D005', name: '地下车库入口A', location: 'B1层车库入口', type: 'gate', status: 'online', lastOnline: '2026-06-10 08:29:50', buildingScope: ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋'], todayCount: 76, signal: '-55', lastHeartbeat: '2026-06-10 08:29:50' },
  { id: 'D006', name: '8栋1单元门', location: '8栋1单元入口', type: 'ble', status: 'offline', lastOnline: '2026-06-09 22:15:30', batteryLevel: 12, buildingScope: ['8栋'], todayCount: 0, signal: '--', lastHeartbeat: '2026-06-09 22:15:30' },
  { id: 'D007', name: '小区北门', location: '小区北侧行人入口', type: 'gate', status: 'warning', lastOnline: '2026-06-09 18:45:22', buildingScope: ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋'], todayCount: 15, signal: '-91', lastHeartbeat: '2026-06-10 08:15:22' },
  { id: 'D008', name: '6栋1单元门', location: '6栋1单元入口', type: 'ble', status: 'online', lastOnline: '2026-06-10 08:31:08', batteryLevel: 88, buildingScope: ['6栋'], todayCount: 82, signal: '-70', lastHeartbeat: '2026-06-10 08:31:08' },
];

export const mockAccessLogs: AccessLog[] = [
  { id: 'L001', deviceId: 'D004', deviceName: '5栋2单元门', userId: 'U001', userName: '张明', method: 'ble', result: true, timestamp: '2026-06-10 08:05:23' },
  { id: 'L002', deviceId: 'D001', deviceName: '小区东门', userId: 'U001', userName: '张明', method: 'qr', result: true, timestamp: '2026-06-10 07:52:10' },
  { id: 'L003', deviceId: 'D004', deviceName: '5栋2单元门', userId: 'U002', userName: '李芳', method: 'nfc', result: true, timestamp: '2026-06-10 07:40:15' },
  { id: 'L004', deviceId: 'D005', deviceName: '地下车库入口A', userId: 'U001', userName: '张明', method: 'nfc', result: true, timestamp: '2026-06-09 19:28:44' },
  { id: 'L005', deviceId: 'D001', deviceName: '小区东门', userId: 'V001', userName: '访客·王磊', method: 'qr', result: true, timestamp: '2026-06-09 15:30:22' },
  { id: 'L006', deviceId: 'D004', deviceName: '5栋2单元门', userId: 'V001', userName: '访客·王磊', method: 'qr', result: true, timestamp: '2026-06-09 15:35:08' },
  { id: 'L007', deviceId: 'D004', deviceName: '5栋2单元门', userId: 'U003', userName: '张晓', method: 'ble', result: true, timestamp: '2026-06-09 12:15:33' },
  { id: 'L008', deviceId: 'D002', deviceName: '小区西门', userId: 'U099', userName: '未知用户', method: 'qr', result: false, timestamp: '2026-06-09 03:22:11' },
  { id: 'L009', deviceId: 'D004', deviceName: '5栋2单元门', userId: 'U001', userName: '张明', method: 'ble', result: true, timestamp: '2026-06-08 18:45:12' },
  { id: 'L010', deviceId: 'D001', deviceName: '小区东门', userId: 'U001', userName: '张明', method: 'ble', result: true, timestamp: '2026-06-08 08:10:55' },
];

export const mockAuths: AccessAuth[] = [
  { id: 'A001', userId: 'U001', userName: '张明', deviceIds: ['D001', 'D002', 'D003', 'D004', 'D005'], validFrom: '2024-01-01', validTo: '2027-12-31', grantedBy: '系统自动', grantedAt: '2024-01-01 10:00:00', status: 'active' },
  { id: 'A002', userId: 'U002', userName: '李芳', deviceIds: ['D001', 'D002', 'D004', 'D005'], validFrom: '2024-01-01', validTo: '2027-12-31', grantedBy: '张明', grantedAt: '2024-01-02 14:20:00', status: 'active' },
  { id: 'A003', userId: 'U003', userName: '张晓', deviceIds: ['D001', 'D002', 'D004', 'D005'], validFrom: '2024-03-15', validTo: '2027-12-31', grantedBy: '张明', grantedAt: '2024-03-15 09:30:00', status: 'active' },
  { id: 'A004', userId: 'U005', userName: '王阿姨', deviceIds: ['D001', 'D002', 'D006', 'D005'], validFrom: '2025-11-01', validTo: '2026-10-31', grantedBy: '张明', grantedAt: '2025-10-28 16:10:00', status: 'active' },
];

export const mockVisitorInvites: (VisitorInvite & { validStart?: string; validEnd?: string; timesUsed?: number; maxTimes?: number; status?: string; methods?: string[]; purpose?: string; accessDeviceIds?: string[]; })[] = [
  { id: 'V001', inviterId: 'U001', inviterName: '张明', visitorName: '王磊', visitorPhone: '136****1234', qrCode: 'VIS_20260609_X8K2M9', validFrom: '2026-06-09 14:00:00', validTo: '2026-06-09 20:00:00', validStart: '2026-06-09 14:00:00', validEnd: '2026-06-09 20:00:00', deviceIds: ['D001', 'D004'], accessDeviceIds: ['D001', 'D004'], used: true, timesUsed: 2, maxTimes: 5, usedAt: '2026-06-09 15:30:22', createdAt: '2026-06-09 13:45:00', status: 'expired', purpose: '朋友拜访', methods: ['qr', 'ble'] },
  { id: 'V002', inviterId: 'U001', inviterName: '张明', visitorName: '刘姐', visitorPhone: '135****5678', qrCode: 'VIS_20260610_A3B7D1', validFrom: '2026-06-10 10:00:00', validTo: '2026-06-10 18:00:00', validStart: '2026-06-10 10:00:00', validEnd: '2026-06-10 18:00:00', deviceIds: ['D001', 'D004'], accessDeviceIds: ['D001', 'D004'], used: false, timesUsed: 0, maxTimes: 10, createdAt: '2026-06-10 09:20:00', status: 'active', purpose: '家政服务', methods: ['qr', 'ble'] },
  { id: 'V003', inviterId: 'U001', inviterName: '张明', visitorName: '陈师傅', visitorPhone: '137****9012', qrCode: 'VIS_20260610_C9F4E2', validFrom: '2026-06-10 14:00:00', validTo: '2026-06-10 17:00:00', validStart: '2026-06-10 14:00:00', validEnd: '2026-06-10 17:00:00', deviceIds: ['D001', 'D004', 'D005'], accessDeviceIds: ['D001', 'D004', 'D005'], used: false, timesUsed: 0, maxTimes: 3, createdAt: '2026-06-10 08:50:00', status: 'pending', purpose: '家电维修上门', methods: ['qr'] },
];

export const mockLogs = mockAccessLogs;
export const mockVisitors = mockVisitorInvites;
export const mockAlerts = [
  { id: 'AL001', deviceId: 'D006', deviceName: '8栋1单元门', level: 'critical', message: '设备离线超过10小时，请现场检查电源和网络', timestamp: '2026-06-10 08:15:30', resolved: false },
  { id: 'AL002', deviceId: 'D006', deviceName: '8栋1单元门', level: 'warning', message: '设备电量不足(12%)，请尽快更换电池', timestamp: '2026-06-10 05:30:00', resolved: false },
  { id: 'AL003', deviceId: 'D007', deviceName: '小区北门', level: 'critical', message: '二维码扫描模块异常，建议派人检修', timestamp: '2026-06-09 18:45:22', resolved: false },
  { id: 'AL004', deviceId: 'D003', deviceName: '5栋1单元门', level: 'warning', message: '蓝牙信号强度偏弱，建议检查天线', timestamp: '2026-06-10 03:10:00', resolved: false },
  { id: 'AL005', deviceId: 'D001', deviceName: '小区东门', level: 'info', message: '检测到撬动告警，已拍照留存', timestamp: '2026-06-09 03:22:11', resolved: true },
  { id: 'AL006', deviceId: 'D005', deviceName: '地下车库入口A', level: 'info', message: '网络短暂中断已自动恢复', timestamp: '2026-06-09 22:15:30', resolved: true },
];

export const mockAccess = {
  devices: mockDevices,
  logs: mockAccessLogs,
  auths: mockAuths,
  visitors: mockVisitorInvites,
  alerts: mockAlerts,
};
