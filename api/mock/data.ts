import { CATEGORIES, PROVINCES } from '../../shared/types';
import type { MarketPrice, PricePoint, RegionalPrice, Supply, Station, AllianceNode, AllianceTask, Settlement, DashboardMetrics, FunnelStep, DataPoint, User, PriceAlert, Certification } from '../../shared/types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const basePrices: Record<string, number> = {
  '1': 58000, '2': 14500, '3': 12800, '4': 18500, '5': 16800, '6': 145000,
  '7': 8500, '8': 2800, '9': 4200, '10': 1650, '11': 2200, '12': 980,
};

export const mockUsers: User[] = [
  { id: 'u1', phone: '13800138001', role: 'supplier', companyName: '北京鑫源回收站', status: 'approved', createdAt: '2024-01-15T00:00:00Z' },
  { id: 'u2', phone: '13800138002', role: 'supplier', companyName: '上海宏达物资回收有限公司', status: 'approved', createdAt: '2024-02-20T00:00:00Z' },
  { id: 'u3', phone: '13800138003', role: 'buyer', companyName: '江西铜业集团', status: 'approved', createdAt: '2024-01-10T00:00:00Z' },
  { id: 'u4', phone: '13800138004', role: 'buyer', companyName: '山东魏桥铝业', status: 'approved', createdAt: '2024-03-05T00:00:00Z' },
  { id: 'u5', phone: '13800138005', role: 'operator', companyName: '平台运营管理', status: 'approved', createdAt: '2023-12-01T00:00:00Z' },
];

export const mockCurrentUser: User = mockUsers[2];

export function generateMarketPrices(): MarketPrice[] {
  return CATEGORIES.map(cat => {
    const basePrice = basePrices[cat.id];
    const change = (Math.random() - 0.5) * basePrice * 0.08;
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      price: Math.round(basePrice + change),
      change: Math.round(change),
      changePercent: Number((change / basePrice * 100).toFixed(2)),
      unit: cat.unit,
      recordedAt: new Date().toISOString(),
    };
  });
}

export function generatePriceHistory(categoryId: string, days: number = 30): PricePoint[] {
  const basePrice = basePrices[categoryId] || 50000;
  const data: PricePoint[] = [];
  let currentPrice = basePrice;
  const category = CATEGORIES.find(c => c.id === categoryId);

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const volatility = (Math.random() - 0.5) * basePrice * 0.03;
    currentPrice = Math.max(currentPrice + volatility, basePrice * 0.8);
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice),
      category: category?.name,
    });
  }
  return data;
}

export function generateRegionalPrices(categoryId: string): RegionalPrice[] {
  const basePrice = basePrices[categoryId] || 50000;
  return PROVINCES.map(p => {
    const variance = (Math.random() - 0.5) * 0.15;
    const price = Math.round(basePrice * (1 + variance));
    return {
      region: p.name,
      province: p.name,
      provinceCode: p.code,
      price,
      avgPrice: basePrice,
      diff: price - basePrice,
      diffPercent: Number((variance * 100).toFixed(2)),
    };
  });
}

export function generateSupplies(count: number = 50): Supply[] {
  const suppliers = mockUsers.filter(u => u.role === 'supplier');
  const supplies: Supply[] = [];

  for (let i = 0; i < count; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const province = PROVINCES[Math.floor(Math.random() * PROVINCES.length)];
    const basePrice = basePrices[category.id];
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));

    supplies.push({
      id: generateId(),
      categoryId: category.id,
      categoryName: category.name,
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      tonnage: Math.round((Math.random() * 50 + 5) * 10) / 10,
      purity: Math.round((Math.random() * 25 + 75) * 10) / 10,
      price: Math.round(basePrice * (0.9 + Math.random() * 0.2)),
      unit: category.unit,
      province: province.name,
      city: `${province.name}市`,
      address: `${province.name}市XX区XX路${Math.floor(Math.random() * 100 + 1)}号`,
      description: `长期供应优质${category.name}，货源稳定，质量保证，欢迎来电洽谈合作。`,
      images: [
        `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`industrial ${category.name} scrap metal pile, recycling yard, realistic photography`)}&image_size=square`,
      ],
      certified: Math.random() > 0.3,
      status: Math.random() > 0.2 ? 'active' : 'sold',
      createdAt: createdDate.toISOString(),
      viewCount: Math.floor(Math.random() * 500 + 50),
      inquiryCount: Math.floor(Math.random() * 30 + 1),
    });
  }
  return supplies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const mockCertifications: Certification[] = [
  { id: 'c1', stationId: 's1', type: 'business_license', typeName: '营业执照', number: '91110000MA01234567', expiryDate: '2028-12-31', imageUrl: '', status: 'valid' },
  { id: 'c2', stationId: 's1', type: 'operation_permit', typeName: '经营许可证', number: 'HJ2024001234', expiryDate: '2027-06-30', imageUrl: '', status: 'valid' },
  { id: 'c3', stationId: 's2', type: 'business_license', typeName: '营业执照', number: '91310000MA12345678', expiryDate: '2029-03-15', imageUrl: '', status: 'valid' },
];

export function generateStations(): Station[] {
  const suppliers = mockUsers.filter(u => u.role === 'supplier');
  return [
    {
      id: 's1',
      ownerId: suppliers[0].id,
      name: '北京鑫源回收站',
      address: '北京市朝阳区建国路88号',
      serviceRadius: 50,
      province: '北京',
      city: '北京市',
      longitude: 116.4074,
      latitude: 39.9042,
      phone: '010-12345678',
      description: '专业回收各类有色金属、黑色金属、电子废料等，拥有20年行业经验，资金雄厚，诚信经营。',
      coverImage: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('recycling station warehouse exterior, industrial facility, green recycling theme')}&image_size=landscape_16_9`,
      certifications: mockCertifications.filter(c => c.stationId === 's1'),
      rating: 4.8,
      dealCount: 328,
      createdAt: '2020-03-15T00:00:00Z',
    },
    {
      id: 's2',
      ownerId: suppliers[1].id,
      name: '上海宏达物资回收有限公司',
      address: '上海市浦东新区张江高科技园区',
      serviceRadius: 80,
      province: '上海',
      city: '上海市',
      longitude: 121.4737,
      latitude: 31.2304,
      phone: '021-87654321',
      description: '大型物资回收企业，专注于工业废料回收处理，拥有先进的分拣设备和环保处理工艺。',
      coverImage: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('modern recycling facility interior, sorting machinery, clean industrial environment')}&image_size=landscape_16_9`,
      certifications: mockCertifications.filter(c => c.stationId === 's2'),
      rating: 4.9,
      dealCount: 567,
      createdAt: '2018-06-20T00:00:00Z',
    },
  ];
}

export function generateAllianceStructure(): AllianceNode {
  return {
    id: 'alliance-1',
    name: '全国再生资源产业联盟',
    level: 'leader',
    leaderId: 'u1',
    leaderName: '联盟盟主 - 张总',
    members: [
      { id: 'm1', userId: 'u1', userName: '张盟主', role: 'leader', phone: '13800138001', joinedAt: '2023-06-01T00:00:00Z' },
    ],
    children: [
      {
        id: 'branch-1',
        name: '华东区分盟',
        level: 'branch',
        leaderId: 'u2',
        leaderName: '分盟主 - 李总',
        members: [
          { id: 'm2', userId: 'u2', userName: '李分盟主', role: 'branch', phone: '13800138002', joinedAt: '2023-07-15T00:00:00Z' },
        ],
        children: [
          {
            id: 'station-1',
            name: '上海浦东回收站',
            level: 'station',
            leaderId: 'u1',
            leaderName: '站长 - 王站长',
            members: [
              { id: 'm3', userId: 'u1', userName: '王站长', role: 'station', phone: '13800138011', joinedAt: '2023-08-01T00:00:00Z' },
              { id: 'm4', userId: 'u2', userName: '刘采购员', role: 'station', phone: '13800138012', joinedAt: '2023-09-10T00:00:00Z' },
            ],
            children: [],
          },
          {
            id: 'station-2',
            name: '南京江宁回收站',
            level: 'station',
            leaderId: 'u1',
            leaderName: '站长 - 赵站长',
            members: [
              { id: 'm5', userId: 'u1', userName: '赵站长', role: 'station', phone: '13800138013', joinedAt: '2023-10-05T00:00:00Z' },
            ],
            children: [],
          },
        ],
      },
      {
        id: 'branch-2',
        name: '华南区分盟',
        level: 'branch',
        leaderId: 'u1',
        leaderName: '分盟主 - 陈总',
        members: [
          { id: 'm6', userId: 'u1', userName: '陈分盟主', role: 'branch', phone: '13800138003', joinedAt: '2023-08-20T00:00:00Z' },
        ],
        children: [
          {
            id: 'station-3',
            name: '广州佛山回收站',
            level: 'station',
            leaderId: 'u2',
            leaderName: '站长 - 孙站长',
            members: [
              { id: 'm7', userId: 'u2', userName: '孙站长', role: 'station', phone: '13800138014', joinedAt: '2023-11-01T00:00:00Z' },
            ],
            children: [],
          },
        ],
      },
    ],
  };
}

export function generateAllianceTasks(): AllianceTask[] {
  const tasks: AllianceTask[] = [];
  const statuses: AllianceTask['status'][] = ['pending', 'in_progress', 'completed', 'in_progress'];
  const titles = [
    '组织华东区废铜集中采购',
    '协调华南区废料运输车辆',
    '完成本月联盟成员资质审核',
    '开展废铝回收技术培训',
    '对接江西铜业集团采购需求',
  ];

  for (let i = 0; i < 5; i++) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 15 + 5));
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 10));

    tasks.push({
      id: `task-${i + 1}`,
      allianceId: 'alliance-1',
      allianceName: '全国再生资源产业联盟',
      assignerId: 'u1',
      assignerName: '张盟主',
      assigneeId: 'u2',
      assigneeName: i % 2 === 0 ? '李分盟主' : '陈分盟主',
      title: titles[i],
      description: `${titles[i]}，请尽快落实执行，确保任务按时保质完成。如有问题请及时沟通汇报。`,
      status: statuses[i],
      priority: i < 2 ? 'high' : 'medium',
      deadline: deadline.toISOString(),
      createdAt: createdAt.toISOString(),
      completedAt: statuses[i] === 'completed' ? new Date().toISOString() : undefined,
    });
  }
  return tasks;
}

export function generateSettlements(): Settlement[] {
  const settlements: Settlement[] = [];
  const roles = ['盟主', '分盟主', '站点'];
  const names = ['张盟主', '李分盟主', '王站长', '赵站长', '孙站长'];

  for (let i = 0; i < 8; i++) {
    const createdDate = new Date();
    createdDate.setMonth(createdDate.getMonth() - Math.floor(Math.random() * 3));

    settlements.push({
      id: `settle-${i + 1}`,
      allianceId: 'alliance-1',
      userId: `u${(i % 3) + 1}`,
      userName: names[i % names.length],
      role: roles[i % roles.length],
      amount: Math.round((Math.random() * 50000 + 5000) * 100) / 100,
      period: `${createdDate.getFullYear()}年${createdDate.getMonth() + 1}月`,
      status: i < 3 ? 'paid' : i < 6 ? 'pending' : 'rejected',
      description: `${createdDate.getFullYear()}年${createdDate.getMonth() + 1}月联盟交易分账`,
      createdAt: createdDate.toISOString(),
      paidAt: i < 3 ? new Date(createdDate.getTime() + 86400000 * 3).toISOString() : undefined,
    });
  }
  return settlements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateDashboardMetrics(): DashboardMetrics {
  return {
    totalTransaction: 1258000000,
    totalVolume: 186500,
    activeUsers: 3428,
    conversionRate: 23.5,
    yoyGrowth: 45.2,
    momGrowth: 8.6,
    totalSupplies: 5682,
    totalInquiries: 12456,
    dealRate: 18.7,
  };
}

export function generateSupplyDemandData(period: string): { supplyData: DataPoint[]; demandData: DataPoint[] } {
  const counts = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 12 : 12;
  const supplyData: DataPoint[] = [];
  const demandData: DataPoint[] = [];

  for (let i = counts - 1; i >= 0; i--) {
    const date = new Date();
    if (period === 'week') {
      date.setDate(date.getDate() - i);
    } else if (period === 'month') {
      date.setDate(date.getDate() - i);
    } else {
      date.setMonth(date.getMonth() - i);
    }
    const baseValue = 500 + Math.random() * 300;
    supplyData.push({
      date: period === 'week' || period === 'month' ? date.toISOString().split('T')[0] : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      value: Math.round(baseValue * (0.9 + Math.random() * 0.2)),
    });
    demandData.push({
      date: supplyData[supplyData.length - 1].date,
      value: Math.round(baseValue * (0.85 + Math.random() * 0.3)),
    });
  }
  return { supplyData, demandData };
}

export function generateFunnelData(): FunnelStep[] {
  return [
    { name: '货源发布', value: 5682, conversionRate: 100, dropRate: 0 },
    { name: '浏览曝光', value: 156780, conversionRate: 2759.0, dropRate: 0 },
    { name: '发起询价', value: 12456, conversionRate: 219.2, dropRate: 92.05 },
    { name: '双方沟通', value: 8967, conversionRate: 157.8, dropRate: 28.01 },
    { name: '报价确认', value: 5632, conversionRate: 99.1, dropRate: 37.19 },
    { name: '成交订单', value: 1063, conversionRate: 18.7, dropRate: 81.13 },
  ];
}

export function generatePriceAlerts(): PriceAlert[] {
  return [
    { id: 'a1', userId: 'u3', categoryId: '1', categoryName: '废铜', threshold: 60000, type: 'above', notifyChannels: ['sms', 'app'], enabled: true, createdAt: '2024-05-01T00:00:00Z' },
    { id: 'a2', userId: 'u3', categoryId: '2', categoryName: '废铝', threshold: 14000, type: 'below', notifyChannels: ['app'], enabled: true, createdAt: '2024-05-10T00:00:00Z' },
    { id: 'a3', userId: 'u3', categoryId: '3', categoryName: '不锈钢', threshold: 13500, type: 'above', notifyChannels: ['sms', 'email', 'app'], enabled: false, createdAt: '2024-05-15T00:00:00Z' },
  ];
}
