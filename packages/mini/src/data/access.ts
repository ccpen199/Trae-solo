import type { AccessDevice, AccessLog } from '@/types';

export const mockDevices: AccessDevice[] = [
  { id: '1', name: '小区东门门禁', type: 'QRCODE', location: '东门入口', isOnline: true },
  { id: '2', name: '小区西门门禁', type: 'NFC', location: '西门入口', isOnline: true },
  { id: '3', name: '1号楼单元门', type: 'BLUETOOTH', location: '1号楼', isOnline: true },
  { id: '4', name: '小区北门门禁', type: 'FACE', location: '北门入口', isOnline: false },
];

export const mockAccessLogs: AccessLog[] = [
  { id: '1', deviceName: '小区东门门禁', location: '东门入口', accessType: 'QRCODE', accessResult: true, accessedAt: '2026-06-19 08:30:00' },
  { id: '2', deviceName: '1号楼单元门', location: '1号楼', accessType: 'BLUETOOTH', accessResult: true, accessedAt: '2026-06-19 08:32:15' },
  { id: '3', deviceName: '小区西门门禁', location: '西门入口', accessType: 'NFC', accessResult: true, accessedAt: '2026-06-18 18:45:20' },
  { id: '4', deviceName: '小区东门门禁', location: '东门入口', accessType: 'QRCODE', accessResult: true, accessedAt: '2026-06-18 07:50:10' },
  { id: '5', deviceName: '1号楼单元门', location: '1号楼', accessType: 'BLUETOOTH', accessResult: true, accessedAt: '2026-06-17 22:15:33' },
  { id: '6', deviceName: '小区南门门禁', location: '南门入口', accessType: 'QRCODE', accessResult: false, accessedAt: '2026-06-17 20:00:00' },
];
