import type { AudienceFilterReq } from './types';

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(arr: T[]) => arr[randInt(0, arr.length - 1)];

export function generateRealtimeBoxOffice() {
  const base = 38000;
  const hour = new Date().getHours();
  const hourFactor = 1 + 0.3 * Math.sin((hour - 10) * Math.PI / 12);
  return {
    totalBoxOffice: Math.round((base + rand(0, 5000)) * hourFactor),
    totalShowCount: randInt(420000, 480000),
    totalAudience: randInt(3200000, 3800000),
    avgOccupancy: +rand(38, 52).toFixed(1),
    avgTicketPrice: +rand(38, 48).toFixed(2),
    perShowAudience: randInt(7, 12),
    updateTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    boxOfficeChange: +rand(-8, 15).toFixed(1),
  };
}

export function generateTrendData() {
  const data = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 60) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const hourFactor = Math.max(0, Math.sin((h - 8) * Math.PI / 14)) * 0.9 + 0.1;
      const weekendBoost = new Date().getDay() === 0 || new Date().getDay() === 6 ? 1.3 : 1;
      data.push({
        time,
        boxOffice: Math.round(rand(800, 3500) * hourFactor * weekendBoost),
        samePeriodLastYear: Math.round(rand(700, 3000) * hourFactor),
        samePeriodLastMonth: Math.round(rand(750, 3200) * hourFactor),
      });
    }
  }
  return data;
}

const filmNames = [
  '星河长明', '山海谣', '长安诡事录', '霓虹夜色', '逆战苍穹',
  '小镇来信', '黎明前的约定', '代号:猎鹰', '归途列车', '浮生若梦',
  '冰川之上', '剑雨江湖', '青春纪念册', '量子迷局', '山海异闻录',
];

export function generateFilmRanking() {
  const totalBoxOffice = 48000 + rand(0, 3000);
  const list = filmNames.map((name, i) => {
    const ratio = (1 - i * 0.08) * rand(0.85, 1.15);
    const bo = Math.round(totalBoxOffice * ratio * 0.22);
    return {
      rank: i + 1,
      filmId: `F${String(i + 1).padStart(3, '0')}`,
      filmName: name,
      poster: '',
      boxOffice: bo,
      totalBoxOffice: Math.round(bo * rand(4, 28)),
      boxOfficeRatio: +(ratio * 22).toFixed(1),
      showCountRatio: +rand(3, 18).toFixed(1),
      occupancy: +rand(22, 78).toFixed(1),
      changeIndicator: pick(['up', 'down', 'flat', 'up', 'flat']) as 'up' | 'down' | 'flat',
      changeValue: randInt(0, 3),
    };
  }).sort((a, b) => b.boxOffice - a.boxOffice).map((it, i) => ({ ...it, rank: i + 1 }));
  return list;
}

export function generatePipelineStatus() {
  return [
    {
      webhookName: '猫眼票务实时流水',
      source: '猫眼专业版',
      status: 'online' as const,
      latencyMs: randInt(180, 450),
      eventsPerSecond: randInt(3200, 5800),
      lastEventTime: new Date(Date.now() - randInt(200, 800)).toLocaleTimeString('zh-CN', { hour12: false }),
      errorCount24h: randInt(0, 3),
    },
    {
      webhookName: '淘票票排片同步',
      source: '阿里影业',
      status: 'online' as const,
      latencyMs: randInt(220, 520),
      eventsPerSecond: randInt(2400, 4200),
      lastEventTime: new Date(Date.now() - randInt(400, 1200)).toLocaleTimeString('zh-CN', { hour12: false }),
      errorCount24h: randInt(0, 5),
    },
    {
      webhookName: '院线上座率上报',
      source: '全国院线联盟',
      status: rand(0, 1) > 0.85 ? 'degraded' : 'online' as 'online' | 'degraded',
      latencyMs: randInt(350, 900),
      eventsPerSecond: randInt(1800, 3200),
      lastEventTime: new Date(Date.now() - randInt(800, 2400)).toLocaleTimeString('zh-CN', { hour12: false }),
      errorCount24h: randInt(2, 12),
    },
  ];
}

const cities = [
  { cityCode: '110000', cityName: '北京', province: '北京', lat: 39.9, lng: 116.4, factor: 1.0 },
  { cityCode: '310000', cityName: '上海', province: '上海', lat: 31.2, lng: 121.5, factor: 1.05 },
  { cityCode: '440100', cityName: '广州', province: '广东', lat: 23.1, lng: 113.3, factor: 0.85 },
  { cityCode: '440300', cityName: '深圳', province: '广东', lat: 22.5, lng: 114.1, factor: 0.9 },
  { cityCode: '510100', cityName: '成都', province: '四川', lat: 30.7, lng: 104.1, factor: 0.78 },
  { cityCode: '330100', cityName: '杭州', province: '浙江', lat: 30.3, lng: 120.2, factor: 0.82 },
  { cityCode: '420100', cityName: '武汉', province: '湖北', lat: 30.6, lng: 114.3, factor: 0.72 },
  { cityCode: '500000', cityName: '重庆', province: '重庆', lat: 29.6, lng: 106.5, factor: 0.76 },
  { cityCode: '320100', cityName: '南京', province: '江苏', lat: 32.1, lng: 118.8, factor: 0.74 },
  { cityCode: '610100', cityName: '西安', province: '陕西', lat: 34.3, lng: 109.0, factor: 0.68 },
  { cityCode: '120000', cityName: '天津', province: '天津', lat: 39.1, lng: 117.2, factor: 0.66 },
  { cityCode: '370100', cityName: '济南', province: '山东', lat: 36.7, lng: 117.0, factor: 0.62 },
  { cityCode: '210100', cityName: '沈阳', province: '辽宁', lat: 41.8, lng: 123.4, factor: 0.58 },
  { cityCode: '430100', cityName: '长沙', province: '湖南', lat: 28.2, lng: 113.0, factor: 0.64 },
  { cityCode: '350100', cityName: '福州', province: '福建', lat: 26.1, lng: 119.3, factor: 0.56 },
  { cityCode: '230100', cityName: '哈尔滨', province: '黑龙江', lat: 45.8, lng: 126.5, factor: 0.5 },
  { cityCode: '410100', cityName: '郑州', province: '河南', lat: 34.7, lng: 113.6, factor: 0.64 },
  { cityCode: '370200', cityName: '青岛', province: '山东', lat: 36.1, lng: 120.4, factor: 0.6 },
  { cityCode: '220100', cityName: '长春', province: '吉林', lat: 43.9, lng: 125.3, factor: 0.48 },
  { cityCode: '530100', cityName: '昆明', province: '云南', lat: 25.0, lng: 102.7, factor: 0.5 },
  { cityCode: '130100', cityName: '石家庄', province: '河北', lat: 38.0, lng: 114.5, factor: 0.52 },
  { cityCode: '140100', cityName: '太原', province: '山西', lat: 37.9, lng: 112.5, factor: 0.46 },
  { cityCode: '340100', cityName: '合肥', province: '安徽', lat: 31.8, lng: 117.3, factor: 0.54 },
  { cityCode: '360100', cityName: '南昌', province: '江西', lat: 28.7, lng: 115.9, factor: 0.5 },
  { cityCode: '450100', cityName: '南宁', province: '广西', lat: 22.8, lng: 108.4, factor: 0.48 },
  { cityCode: '520100', cityName: '贵阳', province: '贵州', lat: 26.6, lng: 106.6, factor: 0.44 },
  { cityCode: '620100', cityName: '兰州', province: '甘肃', lat: 36.1, lng: 103.8, factor: 0.38 },
  { cityCode: '150100', cityName: '呼和浩特', province: '内蒙古', lat: 40.8, lng: 111.7, factor: 0.34 },
  { cityCode: '640100', cityName: '银川', province: '宁夏', lat: 38.5, lng: 106.3, factor: 0.3 },
  { cityCode: '650100', cityName: '乌鲁木齐', province: '新疆', lat: 43.8, lng: 87.6, factor: 0.32 },
];

export function generateCityHeatmap() {
  return cities.map(c => {
    const occ = +(rand(28, 68) * c.factor).toFixed(1);
    const bo = Math.round(rand(200, 4500) * c.factor);
    return {
      ...c,
      occupancy: occ,
      boxOffice: bo,
      value: [c.lng, c.lat, occ * 10] as [number, number, number],
    };
  });
}

const theaterNames = ['万达影城(CBD店)', 'CGV影城(万象城店)', '金逸影城(大悦城店)', '博纳国际影城', '耀莱成龙影城', '首都电影院', 'UME国际影城', '华谊兄弟影院', '百老汇影城', '保利国际影城', '卢米埃影城', '大地影院', '橙天嘉禾影城', '中影国际影城', '横店影视城'];

export function generateTheaterHeatmap(cityCode: string) {
  const city = cities.find(c => c.cityCode === cityCode) || cities[0];
  const count = randInt(8, 15);
  const arr = Array.from({ length: count }).map((_, i) => {
    const hourly: Record<string, number> = {};
    for (let h = 9; h <= 23; h++) {
      const hf = Math.max(0, Math.sin((h - 11) * Math.PI / 10));
      hourly[`${h}:00`] = +(rand(15, 45) + hf * rand(20, 45) * city.factor).toFixed(1);
    }
    return {
      theaterId: `T${cityCode}${String(i + 1).padStart(3, '0')}`,
      theaterName: pick(theaterNames) + (rand(0, 1) > 0.5 ? ` ${randInt(1, 3)}号店` : ''),
      address: `${city.cityName}${pick(['朝阳区', '海淀区', '西城区', '东城区', '天河区', '静安区', '徐汇区', '锦江区'])}${pick(['建国路', '南京路', '人民大道', '中山大道'])}${randInt(1, 999)}号`,
      totalScreens: randInt(5, 18),
      avgOccupancy: +rand(32, 62).toFixed(1),
      totalBoxOffice: Math.round(rand(18, 280)),
      rankInCity: i + 1,
      hourlyOccupancy: hourly,
    };
  }).sort((a, b) => b.totalBoxOffice - a.totalBoxOffice).map((it, i) => ({ ...it, rankInCity: i + 1 }));
  return arr;
}

export function generateScreenHeatmap() {
  const timeSlots = ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00', '21:00-23:00'];
  return Array.from({ length: randInt(6, 12) }).map((_, i) => {
    const goldenShows: string[] = [];
    const timeMatrix = timeSlots.map(slot => {
      const idx = timeSlots.indexOf(slot);
      const goldenFactor = idx === 5 ? 1.6 : (idx === 4 || idx === 6 ? 1.25 : (idx === 3 ? 1.05 : 0.8));
      const wk = +(rand(18, 52) * goldenFactor * 0.85).toFixed(1);
      const we = +(rand(28, 72) * goldenFactor).toFixed(1);
      if (we >= 60) goldenShows.push(slot);
      return { timeSlot: slot, weekdayOccupancy: Math.min(98, wk), weekendOccupancy: Math.min(98, we) };
    });
    return {
      screenId: `S${String(i + 1).padStart(3, '0')}`,
      screenName: `${pick(['1', '2', '3', '4', '5', '6', '7', '8', 'IMAX', '杜比', 'CINITY', '巨幕', 'LUXE'])}号厅${pick(['', '', '', ' 激光', ' 4K', ' ATMOS'])}`,
      seatCount: randInt(88, 368),
      timeMatrix,
      goldenShows,
    };
  });
}

export function generateCompetitors() {
  return filmNames.slice(0, 6).map((name, i) => {
    const levels: ('S' | 'A' | 'B' | 'C')[] = ['S', 'A', 'A', 'B', 'B', 'C'];
    return {
      filmId: `F${String(i + 1).padStart(3, '0')}`,
      filmName: name,
      type: pick(['科幻', '动作', '爱情', '悬疑', '喜剧', '动画', '历史', '剧情']),
      castLevel: levels[i],
      marketingBudget: Math.round(rand(30, 95) - i * 5),
      expectedOpening: Math.round(rand(6000, 48000) * (1 - i * 0.12)),
      radarScores: {
        story: randInt(60, 95),
        cast: randInt(55, 98) - i * 3,
        marketing: randInt(50, 95) - i * 2,
        schedule: randInt(65, 95),
        wordOfMouth: randInt(58, 92),
      },
    };
  });
}

export function generateSchedulePrediction() {
  const theaterNames = ['万达院线', 'CGV影城', '金逸影视', '博纳院线', '耀莱影城', '首都电影', 'UME影城', '华谊兄弟', '百老汇', '保利影业'];
  const total = randInt(38000, 62000);
  return {
    expectedTotalBoxOffice: total,
    confidenceInterval: [Math.round(total * 0.86), Math.round(total * 1.18)] as [number, number],
    perTheaterPrediction: theaterNames.map((name, i) => {
      const bo = Math.round(total * rand(0.06, 0.14));
      return {
        theaterId: `TH${String(i + 1).padStart(3, '0')}`,
        theaterName: name,
        expectedBoxOffice: bo,
        expectedOccupancy: +rand(42, 72).toFixed(1),
        suggestion: pick([
          '建议增加晚间黄金场次排片占比 3-5%',
          '建议优化 IMAX/巨幕厅票价策略',
          '周末上座率预期提升显著，可适度增加场次',
          '与同区域竞品对比有优势，建议维持排片',
          '午间场次可考虑推出优惠套餐提升人次',
          '建议重点关注情侣座/家庭座需求匹配',
        ]),
      };
    }),
  };
}

export function generateAudienceProfile(_filter: Partial<AudienceFilterReq> = {}) {
  return {
    totalUsers: randInt(850000, 3200000),
    genderRatio: {
      male: +rand(42, 54).toFixed(1),
      female: 0,
    },
    ageDistribution: [
      { range: '18岁以下', ratio: +rand(4, 9).toFixed(1) },
      { range: '18-24岁', ratio: +rand(18, 26).toFixed(1) },
      { range: '25-34岁', ratio: +rand(28, 36).toFixed(1) },
      { range: '35-44岁', ratio: +rand(16, 24).toFixed(1) },
      { range: '45-54岁', ratio: +rand(7, 13).toFixed(1) },
      { range: '55岁以上', ratio: +rand(2, 6).toFixed(1) },
    ],
    regionTop10: cities.slice(0, 10).map(c => ({
      region: c.cityName,
      ratio: +rand(2.5, 10.5).toFixed(1),
    })).sort((a, b) => b.ratio - a.ratio),
    frequencyDistribution: [
      { level: '低频 (≤3次/年)', ratio: +rand(28, 36).toFixed(1), avgTimes: 1.8 },
      { level: '中频 (4-12次/年)', ratio: +rand(32, 40).toFixed(1), avgTimes: 7.2 },
      { level: '高频 (13-30次/年)', ratio: +rand(16, 22).toFixed(1), avgTimes: 20.5 },
      { level: '极高频 (>30次/年)', ratio: +rand(6, 12).toFixed(1), avgTimes: 48.3 },
    ],
    preferredTypes: [
      { type: '科幻', score: randInt(68, 92) },
      { type: '悬疑犯罪', score: randInt(62, 88) },
      { type: '动作冒险', score: randInt(60, 86) },
      { type: '爱情', score: randInt(55, 82) },
      { type: '喜剧', score: randInt(58, 84) },
      { type: '动画', score: randInt(48, 78) },
      { type: '剧情', score: randInt(52, 80) },
      { type: '历史传记', score: randInt(38, 62) },
    ].sort((a, b) => b.score - a.score),
    radarProfile: {
      consumption: randInt(58, 88),
      frequency: randInt(52, 86),
      diversity: randInt(48, 82),
      social: randInt(42, 78),
      loyalty: randInt(50, 80),
      decisionCycle: randInt(46, 84),
    },
  };
}

export function generateAudienceMigration() {
  const nodes = [
    { id: 'N1', name: '流浪地球3受众', value: 1280000, category: 'source' as const },
    { id: 'N2', name: '满江红受众', value: 980000, category: 'source' as const },
    { id: 'N3', name: '消失的她受众', value: 860000, category: 'source' as const },
    { id: 'N4', name: '封神受众', value: 760000, category: 'source' as const },
    { id: 'N5', name: '星河长明(目标)', value: 0, category: 'target' as const },
    { id: 'N6', name: '山海谣(竞品)', value: 0, category: 'target' as const },
    { id: 'N7', name: '长安诡事录(竞品)', value: 0, category: 'target' as const },
  ];
  const links = [
    { source: 'N1', target: 'N5', value: 386000, overlapRatio: 30.2 },
    { source: 'N1', target: 'N6', value: 264000, overlapRatio: 20.6 },
    { source: 'N2', target: 'N5', value: 168000, overlapRatio: 17.1 },
    { source: 'N2', target: 'N7', value: 312000, overlapRatio: 31.8 },
    { source: 'N3', target: 'N7', value: 286000, overlapRatio: 33.3 },
    { source: 'N3', target: 'N5', value: 142000, overlapRatio: 16.5 },
    { source: 'N4', target: 'N5', value: 224000, overlapRatio: 29.5 },
    { source: 'N4', target: 'N6', value: 158000, overlapRatio: 20.8 },
    { source: 'N1', target: 'N7', value: 128000, overlapRatio: 10.0 },
  ];
  return { nodes, links };
}

const roles = ['导演', '编剧', '制片人', '摄影指导', '美术指导', '音乐总监', '剪辑师', '特效总监', '主演', '配角', '动作指导', '服装造型'];
const positions = ['一线', '资深', '中坚', '新锐', '潜力'];
const creditWorks = ['流浪地球', '满江红', '封神第一部', '长津湖', '我不是药神', '消失的她', '孤注一掷', '热辣滚烫', '你好李焕英', '唐人街探案', '红海行动', '我和我的祖国', '夏洛特烦恼', '西虹市首富', '飞驰人生'];
const candidateNames = ['张艺谋', '陈思诚', '郭帆', '贾玲', '吴京', '沈腾', '刘德华', '周迅', '章子怡', '张译', '雷佳音', '于和伟', '易烊千玺', '张小斐', '马丽', '常远', '魏翔', '贾冰', '秦海璐', '陈道明', '李雪健', '王志文', '段奕宏', '廖凡'];

export function generateMatchMatrix(role?: string) {
  const selectedRole = role || pick(roles);
  return Array.from({ length: 12 }).map((_, i) => {
    const roleFit = randInt(70, 98);
    const positionFit = randInt(68, 96);
    const scheduleFit = randInt(60, 95);
    const creditLevel = randInt(65, 97);
    const matchScore = Math.round(roleFit * 0.3 + positionFit * 0.25 + scheduleFit * 0.25 + creditLevel * 0.2);
    return {
      candidateId: `C${String(i + 1).padStart(4, '0')}`,
      candidateName: pick(candidateNames),
      avatar: '',
      role: selectedRole,
      position: pick(positions),
      matchScore,
      dimensionScores: { roleFit, positionFit, scheduleFit, creditLevel },
      credits: Array.from({ length: randInt(2, 5) }).map(() => pick(creditWorks)),
      verifiedBadges: Array.from({ length: randInt(1, 4) }).map(() => pick(['实名认证', '中影协认证', '出品方背书', '作品验证', '一线认证', '平台金牌'])),
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export function generateCertificate() {
  return {
    candidateId: 'C0001',
    realNameVerified: true,
    issuerVerifications: [
      { issuerName: '中国电影家协会', issuerLogo: '', cooperationCount: 12, creditScore: 96, verifiedDate: '2025-08-15' },
      { issuerName: '中影股份', issuerLogo: '', cooperationCount: 8, creditScore: 94, verifiedDate: '2025-03-22' },
      { issuerName: '北京文化', issuerLogo: '', cooperationCount: 5, creditScore: 92, verifiedDate: '2024-11-08' },
      { issuerName: '万达影业', issuerLogo: '', cooperationCount: 6, creditScore: 90, verifiedDate: '2024-06-18' },
    ],
    pastWorks: Array.from({ length: 6 }).map((_, i) => ({
      title: pick(creditWorks) + (rand(0, 1) > 0.7 ? ` ${randInt(1, 3)}` : ''),
      role: pick(['导演', '联合导演', '监制', '总制片人', '制片人', '执行制片人', '主演', '联合主演']),
      releaseYear: randInt(2018, 2025),
      boxOffice: Math.round(rand(28000, 580000)),
      rating: +rand(6.5, 9.4).toFixed(1),
    })),
    overallCreditLevel: pick<'AAA' | 'AA' | 'A' | 'BBB'>(['AAA', 'AAA', 'AA', 'AA', 'A']),
  };
}

export function generatePermissions() {
  return {
    levels: [
      {
        level: 'public' as const,
        name: '公开数据版',
        description: '面向全行业免费开放的基础数据服务',
        modules: ['票房总览', '基础榜单', '公开资讯'],
        apiQuota: '100次/天',
        exportLimit: 'Excel 5次/月',
        price: '免费',
      },
      {
        level: 'subscription' as const,
        name: '订阅专业版',
        description: '为专业从业者提供的深度数据分析服务',
        modules: ['全量票房', '排片预测', '上座率热力图', '受众画像', '标准报告'],
        apiQuota: '10000次/天',
        exportLimit: 'Excel/PDF 100次/月',
        price: '¥9,999/月',
      },
      {
        level: 'custom' as const,
        name: '企业定制版',
        description: '为制片/发行/院线头部企业定制的专属数据方案',
        modules: ['全部模块', '定制API接口', '定制报告', '专属客户经理', '剧组协作高级版'],
        apiQuota: '不限量',
        exportLimit: '全格式不限',
        price: '面议',
      },
    ],
    roles: [
      { roleId: 'R001', roleName: '院线经理', permissionLevel: 'subscription', customPermissions: { boxOffice: true, heatmap: true, reports: true, audience: false, crew: false, admin: false } },
      { roleId: 'R002', roleName: '发行专员', permissionLevel: 'subscription', customPermissions: { boxOffice: true, heatmap: true, screening: true, audience: true, reports: true, crew: false, admin: false } },
      { roleId: 'R003', roleName: '制片总监', permissionLevel: 'custom', customPermissions: { boxOffice: true, heatmap: true, screening: true, audience: true, crew: true, reports: true, admin: false } },
      { roleId: 'R004', roleName: '独立从业者', permissionLevel: 'public', customPermissions: { boxOffice: true, crew: true, audience: false, admin: false } },
      { roleId: 'R005', roleName: '平台管理员', permissionLevel: 'custom', customPermissions: { boxOffice: true, heatmap: true, screening: true, audience: true, crew: true, reports: true, admin: true } },
    ],
  };
}

const userNames = ['张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '黄磊', '周敏', '吴强', '郑丽', '孙浩', '马超', '朱琳', '胡军', '郭涛'];
const dataTypes = ['票房明细数据', '排片预测结果', '受众画像报告', '上座率原始数据', '影院经营数据', '竞品分析报表', '剧组资质档案', '行业周报原始数据'];
const dataScopes = ['全国数据', '华北区域', '万达院线', 'TOP100影院', '2026暑期档', '科幻题材影片', '一线城市场次', '近30天'];
const purposes = ['制作发行决策参考', '季度经营复盘汇报', '投资方数据尽调', '行业研究报告撰写', '排片策略调整依据', '客户提案演示素材', '内部数据存档备份', '监管合规报送要求'];
const formats: ('Excel' | 'PDF' | 'CSV' | 'API')[] = ['Excel', 'PDF', 'CSV', 'API'];
const statuses: ('approved' | 'pending' | 'rejected')[] = ['approved', 'approved', 'approved', 'approved', 'pending', 'approved', 'rejected', 'approved'];

export function generateAuditLogs() {
  return Array.from({ length: 28 }).map((_, i) => {
    const t = Date.now() - i * 3600 * 1000 * randInt(1, 8) - randInt(0, 3600000);
    return {
      logId: `LOG${Date.now().toString().slice(-6)}${String(i).padStart(3, '0')}`,
      userId: `U${String(randInt(1, 120)).padStart(5, '0')}`,
      userName: pick(userNames),
      userRole: pick(['院线经理', '发行专员', '制片总监', '独立从业者', '数据分析师']),
      operationTime: new Date(t).toLocaleString('zh-CN', { hour12: false }),
      dataType: pick(dataTypes),
      dataScope: pick(dataScopes),
      purpose: pick(purposes),
      format: pick(formats),
      status: pick(statuses),
      fileHash: `0x${Math.random().toString(16).slice(2, 18)}${Math.random().toString(16).slice(2, 18)}`,
    };
  }).sort((a, b) => new Date(b.operationTime).getTime() - new Date(a.operationTime).getTime());
}

const reportTitles = [
  '2026年第24周中国电影市场周报',
  '2026年6月暑期档预热月度分析报告',
  '2026端午档影片票房表现复盘专报',
  '2026年Q2院线经营数据综合报告',
  '科幻题材影片受众迁移趋势专报',
  '重点档期竞品表现对比分析周报',
  '一线城市影院上座率洞察月报',
  '青年受众观影偏好变化季度报告',
];

export function generateReports() {
  return reportTitles.map((title, i) => {
    const st = i < 3 ? 'ready' : (i < 5 ? 'generating' : (rand(0, 1) > 0.7 ? 'failed' : 'ready'));
    const t = Date.now() - i * 86400000 * randInt(1, 14);
    return {
      reportId: `RPT${String(i + 1).padStart(5, '0')}`,
      reportType: pick(['weekly', 'monthly', 'special', 'weekly', 'special']),
      title,
      generatedAt: new Date(t).toLocaleString('zh-CN', { hour12: false }),
      downloadUrl: `/downloads/report_${i + 1}.pdf`,
      status: st as 'ready' | 'generating' | 'failed',
      fileSize: st === 'ready' ? `${randInt(2, 28)}.${randInt(1, 9)} MB` : '-',
    };
  });
}
