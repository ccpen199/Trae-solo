import type { BusArrival, PopulationProfile, AppealCluster, Activity, TimeSlot, Grid } from '../../shared/types';

export function generateMockBusArrivals(stationName: string): BusArrival[] {
  const lines = ['1路', '21路', '45路', '96路', '122路', '857路', 'B3路', 'J102路'];
  const directions = ['开往第一码头', '开往火车站', '开往会展中心', '开往湖里大道', '开往软件园'];

  return lines.slice(0, 5).map((lineName, index) => ({
    lineName,
    stationName,
    direction: directions[index % directions.length],
    nextBus: {
      plateNo: `闽D${Math.floor(Math.random() * 90000 + 10000)}`,
      eta: Math.floor(Math.random() * 15 + 1),
      distance: Math.floor(Math.random() * 2000 + 200),
    },
    followingBuses: [
      {
        plateNo: `闽D${Math.floor(Math.random() * 90000 + 10000)}`,
        eta: Math.floor(Math.random() * 15 + 16),
      },
      {
        plateNo: `闽D${Math.floor(Math.random() * 90000 + 10000)}`,
        eta: Math.floor(Math.random() * 15 + 31),
      },
    ],
  }));
}

export function generateMockPopulationProfile(): PopulationProfile {
  const total = 2218565;
  const ageDistribution = [
    { range: '0-14岁', count: 312800, percentage: 14.1 },
    { range: '15-29岁', count: 489500, percentage: 22.1 },
    { range: '30-44岁', count: 687800, percentage: 31.0 },
    { range: '45-59岁', count: 458200, percentage: 20.7 },
    { range: '60岁以上', count: 270265, percentage: 12.2 },
  ];

  const male = 1123000;
  const female = 1095565;

  return {
    total,
    ageDistribution,
    genderDistribution: {
      male,
      female,
      malePercentage: Math.round((male / total) * 1000) / 10,
      femalePercentage: Math.round((female / total) * 1000) / 10,
    },
    householdDistribution: {
      local: 1352000,
      nonLocal: 866565,
      localPercentage: Math.round((1352000 / total) * 1000) / 10,
      nonLocalPercentage: Math.round((866565 / total) * 1000) / 10,
    },
    educationDistribution: [
      { level: '小学及以下', count: 185000, percentage: 8.3 },
      { level: '初中', count: 398000, percentage: 17.9 },
      { level: '高中/中专', count: 512000, percentage: 23.1 },
      { level: '大专', count: 445000, percentage: 20.1 },
      { level: '本科', count: 523000, percentage: 23.6 },
      { level: '硕士及以上', count: 155565, percentage: 7.0 },
    ],
    employmentRate: 94.6,
    yearOverYearGrowth: 2.8,
  };
}

export function generateMockAppealClusters(): AppealCluster[] {
  return [
    {
      id: 'cluster_001',
      category: '市容环境',
      count: 1256,
      percentage: 28.5,
      trend: 'down',
      trendValue: -5.2,
      hotWords: ['垃圾清运', '占道经营', '违章搭建', '绿化养护', '路灯故障'],
      locations: [
        { area: '思明区', count: 456 },
        { area: '湖里区', count: 389 },
        { area: '集美区', count: 215 },
        { area: '海沧区', count: 120 },
        { area: '同安区', count: 76 },
      ],
      avgResolutionTime: 12.5,
      satisfactionRate: 92.3,
    },
    {
      id: 'cluster_002',
      category: '交通出行',
      count: 987,
      percentage: 22.4,
      trend: 'up',
      trendValue: 8.7,
      hotWords: ['拥堵', '违停', '信号灯', '公交延误', '共享单车'],
      locations: [
        { area: '思明区', count: 412 },
        { area: '湖里区', count: 356 },
        { area: '集美区', count: 128 },
        { area: '海沧区', count: 58 },
        { area: '同安区', count: 33 },
      ],
      avgResolutionTime: 18.2,
      satisfactionRate: 87.5,
    },
    {
      id: 'cluster_003',
      category: '物业管理',
      count: 756,
      percentage: 17.1,
      trend: 'stable',
      trendValue: 1.2,
      hotWords: ['物业服务', '电梯故障', '停车难', '噪音扰民', '消防通道'],
      locations: [
        { area: '思明区', count: 298 },
        { area: '湖里区', count: 267 },
        { area: '集美区', count: 112 },
        { area: '海沧区', count: 48 },
        { area: '同安区', count: 31 },
      ],
      avgResolutionTime: 24.8,
      satisfactionRate: 81.2,
    },
    {
      id: 'cluster_004',
      category: '噪音污染',
      count: 589,
      percentage: 13.3,
      trend: 'up',
      trendValue: 12.5,
      hotWords: ['夜间施工', '酒吧噪音', '广场舞', '装修噪音', '商业宣传'],
      locations: [
        { area: '思明区', count: 245 },
        { area: '湖里区', count: 198 },
        { area: '集美区', count: 89 },
        { area: '海沧区', count: 37 },
        { area: '同安区', count: 20 },
      ],
      avgResolutionTime: 8.6,
      satisfactionRate: 89.8,
    },
    {
      id: 'cluster_005',
      category: '公共设施',
      count: 423,
      percentage: 9.6,
      trend: 'down',
      trendValue: -3.8,
      hotWords: ['健身器材', '公共厕所', '座椅破损', '无障碍设施', '休息亭'],
      locations: [
        { area: '思明区', count: 168 },
        { area: '湖里区', count: 134 },
        { area: '集美区', count: 65 },
        { area: '海沧区', count: 35 },
        { area: '同安区', count: 21 },
      ],
      avgResolutionTime: 36.4,
      satisfactionRate: 84.6,
    },
    {
      id: 'cluster_006',
      category: '市场监管',
      count: 398,
      percentage: 9.0,
      trend: 'stable',
      trendValue: 0.5,
      hotWords: ['无证经营', '价格欺诈', '食品安全', '虚假宣传', '消费纠纷'],
      locations: [
        { area: '思明区', count: 156 },
        { area: '湖里区', count: 128 },
        { area: '集美区', count: 58 },
        { area: '海沧区', count: 32 },
        { area: '同安区', count: 24 },
      ],
      avgResolutionTime: 48.2,
      satisfactionRate: 78.9,
    },
  ];
}

export function generateMockActivities(): Activity[] {
  return [
    {
      id: 'act_001',
      name: '羽毛球场地预订',
      time: '09:00-22:00',
      type: '体育运动',
      available: true,
      capacity: 8,
      booked: 3,
    },
    {
      id: 'act_002',
      name: '乒乓球场地预订',
      time: '09:00-22:00',
      type: '体育运动',
      available: true,
      capacity: 12,
      booked: 5,
    },
    {
      id: 'act_003',
      name: '图书借阅',
      time: '09:00-21:00',
      type: '文化服务',
      available: true,
      capacity: 500,
      booked: 156,
    },
    {
      id: 'act_004',
      name: '电子阅览室',
      time: '09:00-21:00',
      type: '文化服务',
      available: true,
      capacity: 80,
      booked: 42,
    },
    {
      id: 'act_005',
      name: '古琴艺术展',
      time: '10:00-17:00',
      type: '展览',
      available: true,
      capacity: 200,
      booked: 89,
    },
    {
      id: 'act_006',
      name: '厦门历史文化展厅',
      time: '09:00-17:00',
      type: '展览',
      available: true,
      capacity: 300,
      booked: 124,
    },
    {
      id: 'act_007',
      name: '芭蕾舞剧《天鹅湖》',
      time: '19:30-21:30',
      type: '演出',
      available: true,
      capacity: 1200,
      booked: 986,
    },
    {
      id: 'act_008',
      name: '少儿钢琴培训',
      time: '周末班',
      type: '培训',
      available: true,
      capacity: 20,
      booked: 15,
    },
  ];
}

export function generateMockTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 8;
  const endHour = 17;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const available = Math.random() > 0.4;
      slots.push({
        time,
        available,
        fee: hour < 12 ? 30 : 40,
      });
    }
  }

  return slots;
}

export function generateGridStats(grid: Grid): { eventCount: number; unresolvedCount: number } {
  const baseEvent = Math.floor(Math.random() * 15 + 5);
  const unresolved = Math.floor(Math.random() * 5 + 1);
  return {
    eventCount: baseEvent,
    unresolvedCount: unresolved,
  };
}
