import type { Designer } from '../types';

export const mockDesigners: Designer[] = [
  {
    id: 'd001',
    userId: 'u002',
    name: '李雨晴',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20chinese%20female%20designer%20portrait&image_size=square',
    specializations: ['现代简约', '北欧风格', '日式禅意'],
    completedProjects: 86,
    averageRating: 4.9,
    complaintRate: 0.012,
    yearsExperience: 12,
    radarScores: {
      designAbility: 95,
      communication: 92,
      costControl: 88,
      scheduleAdherence: 94,
      afterSales: 90,
    },
    portfolio: [
      {
        id: 'p001',
        title: '阳光花园 · 静谧之光',
        images: [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20living%20room%20interior%20design%20natural%20light&image_size=landscape_16_9',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20kitchen%20design%20white%20cabinets%20wooden%20floor&image_size=landscape_16_9',
        ],
        area: 120,
        budget: 280000,
        style: '现代简约',
        ownerRating: 5.0,
      },
      {
        id: 'p002',
        title: '城市之星 · 北欧童话',
        images: [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=scandinavian%20style%20bedroom%20cozy%20white%20and%20wood&image_size=landscape_16_9',
        ],
        area: 95,
        budget: 198000,
        style: '北欧风格',
        ownerRating: 4.8,
      },
    ],
  },
  {
    id: 'd002',
    userId: 'u003',
    name: '王浩然',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20chinese%20male%20architect%20portrait&image_size=square',
    specializations: ['新中式', '欧式古典', '轻奢风'],
    completedProjects: 64,
    averageRating: 4.7,
    complaintRate: 0.028,
    yearsExperience: 9,
    radarScores: {
      designAbility: 90,
      communication: 85,
      costControl: 82,
      scheduleAdherence: 88,
      afterSales: 86,
    },
    portfolio: [
      {
        id: 'p003',
        title: '东方明珠 · 古韵新唱',
        images: [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=new%20chinese%20style%20living%20room%20elegant%20wooden%20furniture&image_size=landscape_16_9',
        ],
        area: 160,
        budget: 450000,
        style: '新中式',
        ownerRating: 4.9,
      },
    ],
  },
  {
    id: 'd003',
    userId: 'u006',
    name: '陈思琪',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20chinese%20female%20interior%20designer%20portrait&image_size=square',
    specializations: ['工业风', '极简主义', 'LOFT'],
    completedProjects: 42,
    averageRating: 4.8,
    complaintRate: 0.018,
    yearsExperience: 7,
    radarScores: {
      designAbility: 92,
      communication: 90,
      costControl: 85,
      scheduleAdherence: 91,
      afterSales: 88,
    },
    portfolio: [
      {
        id: 'p004',
        title: '艺术区LOFT · 工业美学',
        images: [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20loft%20interior%20exposed%20brick%20metal%20pipes&image_size=landscape_16_9',
        ],
        area: 85,
        budget: 168000,
        style: '工业风',
        ownerRating: 4.9,
      },
    ],
  },
];
