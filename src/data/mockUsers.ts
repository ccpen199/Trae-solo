import type { User, CreditHistory } from '../types';

export const mockUsers: User[] = [
  {
    id: 'u001',
    role: 'owner',
    name: '张明远',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20chinese%20man%20portrait%20business%20attire&image_size=square',
    phone: '138****1234',
    creditScore: 920,
    creditLevel: 'S',
  },
  {
    id: 'u002',
    role: 'designer',
    name: '李雨晴',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20chinese%20female%20designer%20portrait&image_size=square',
    phone: '139****5678',
    creditScore: 945,
    creditLevel: 'S',
  },
  {
    id: 'u003',
    role: 'designer',
    name: '王浩然',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20chinese%20male%20architect%20portrait&image_size=square',
    phone: '137****9012',
    creditScore: 880,
    creditLevel: 'A',
  },
  {
    id: 'u004',
    role: 'contractor',
    name: '陈建国',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20chinese%20construction%20manager%20portrait&image_size=square',
    phone: '136****3456',
    creditScore: 895,
    creditLevel: 'A',
  },
  {
    id: 'u005',
    role: 'supplier',
    name: '红星美凯龙',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=company%20logo%20furniture%20store%20modern&image_size=square',
    phone: '400****7890',
    creditScore: 910,
    creditLevel: 'S',
  },
];

export const mockCurrentUser: User = mockUsers[0];

export const mockCreditHistory: CreditHistory[] = [
  {
    id: 'ch001',
    userId: 'u002',
    type: 'increase',
    amount: 15,
    reason: '项目「阳光花园120㎡」按时高质量交付，业主好评',
    timestamp: new Date('2026-06-15'),
  },
  {
    id: 'ch002',
    userId: 'u002',
    type: 'increase',
    amount: 10,
    reason: '连续3个月无投诉记录',
    timestamp: new Date('2026-06-01'),
  },
  {
    id: 'ch003',
    userId: 'u002',
    type: 'decrease',
    amount: -5,
    reason: '「城市之星」项目设计方案修改延迟2天',
    timestamp: new Date('2026-05-20'),
  },
  {
    id: 'ch004',
    userId: 'u002',
    type: 'increase',
    amount: 20,
    reason: '获得「年度最佳设计师」平台认证',
    timestamp: new Date('2026-05-10'),
  },
];
