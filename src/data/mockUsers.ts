import type { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'u001',
    phone: '13800138001',
    email: 'user001@huizhou.com',
    nickname: '惠州小市民',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huizhou1',
    role: 'user',
    points: 1250,
    level: 3,
    location: {
      district: '惠城区',
      address: '惠州市惠城区河南岸街道南岸路123号'
    },
    createdAt: new Date('2024-01-15'),
    lastLoginAt: new Date('2026-06-20'),
    isSignedInToday: true
  },
  {
    id: 'u002',
    phone: '13800138002',
    email: 'user002@huizhou.com',
    nickname: '西湖摄影师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huizhou2',
    role: 'creator',
    points: 5680,
    level: 6,
    location: {
      district: '惠城区',
      address: '惠州市惠城区桥西街道环城西路88号'
    },
    createdAt: new Date('2023-06-20'),
    lastLoginAt: new Date('2026-06-21'),
    isSignedInToday: true
  },
  {
    id: 'u003',
    phone: '13800138003',
    email: 'user003@huizhou.com',
    nickname: '美食探店达人',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huizhou3',
    role: 'circle_admin',
    points: 8900,
    level: 8,
    location: {
      district: '惠阳区',
      address: '惠州市惠阳区淡水街道白云五路66号'
    },
    createdAt: new Date('2023-03-10'),
    lastLoginAt: new Date('2026-06-20'),
    isSignedInToday: false
  },
  {
    id: 'u004',
    phone: '13800138004',
    email: 'user004@huizhou.com',
    nickname: '小编辑',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huizhou4',
    role: 'editor',
    points: 3200,
    level: 4,
    location: {
      district: '惠城区',
      address: '惠州市惠城区江北街道文明一路5号'
    },
    createdAt: new Date('2024-05-01'),
    lastLoginAt: new Date('2026-06-21'),
    isSignedInToday: true
  },
  {
    id: 'u005',
    phone: '13800138005',
    email: 'user005@huizhou.com',
    nickname: '政务服务专员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huizhou5',
    role: 'government',
    points: 2100,
    level: 3,
    location: {
      district: '惠城区',
      address: '惠州市惠城区江北街道云山西路6号'
    },
    createdAt: new Date('2024-02-28'),
    lastLoginAt: new Date('2026-06-20'),
    isSignedInToday: false
  },
  {
    id: 'u006',
    phone: '13800138006',
    email: 'user006@huizhou.com',
    nickname: '巽寮湾海鲜店',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huizhou6',
    role: 'merchant',
    points: 15600,
    level: 10,
    location: {
      district: '惠东县',
      address: '惠州市惠东县巽寮滨海旅游度假区'
    },
    createdAt: new Date('2022-11-15'),
    lastLoginAt: new Date('2026-06-21'),
    isSignedInToday: true
  },
  {
    id: 'u007',
    phone: '13800138007',
    email: 'user007@huizhou.com',
    nickname: '罗浮山居民',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huizhou7',
    role: 'user',
    points: 450,
    level: 1,
    location: {
      district: '博罗县',
      address: '惠州市博罗县长宁镇罗浮大道'
    },
    createdAt: new Date('2025-01-10'),
    lastLoginAt: new Date('2026-06-19'),
    isSignedInToday: false
  },
  {
    id: 'u008',
    phone: '13800138008',
    email: 'user008@huizhou.com',
    nickname: '大亚湾户外',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huizhou8',
    role: 'creator',
    points: 4200,
    level: 5,
    location: {
      district: '大亚湾区',
      address: '惠州市大亚湾区澳头街道中兴中路'
    },
    createdAt: new Date('2024-08-22'),
    lastLoginAt: new Date('2026-06-21'),
    isSignedInToday: true
  },
  {
    id: 'u009',
    phone: '13800138009',
    email: 'user009@huizhou.com',
    nickname: '龙门笋干',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huizhou9',
    role: 'merchant',
    points: 7800,
    level: 7,
    location: {
      district: '龙门县',
      address: '惠州市龙门县龙城街道西林路'
    },
    createdAt: new Date('2023-09-05'),
    lastLoginAt: new Date('2026-06-20'),
    isSignedInToday: false
  },
  {
    id: 'u010',
    phone: '13800138010',
    email: 'user010@huizhou.com',
    nickname: '仲恺创客',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huizhou10',
    role: 'user',
    points: 1800,
    level: 2,
    location: {
      district: '仲恺区',
      address: '惠州市仲恺高新区陈江街道'
    },
    createdAt: new Date('2025-03-15'),
    lastLoginAt: new Date('2026-06-21'),
    isSignedInToday: true
  }
];
