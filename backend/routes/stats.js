const { Router } = require('express');

const router = Router();

function pad(n) {
  return String(n).padStart(2, '0');
}

function buildDashboardData() {
  const today = new Date();
  const trendPoints = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    trendPoints.push({
      date: `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      count: Math.floor(2800 + Math.random() * 1500),
      avgHours: Number((3 + Math.random() * 2).toFixed(1)),
    });
  }

  const bureaus = [
    '人力资源和社会保障局', '卫生健康委员会', '医疗保障局', '住房公积金管理中心',
    '公安局', '教育局', '民政局', '税务局', '住房和城乡建设局', '交通运输局',
    '市场监督管理局', '规划和自然资源局',
  ];
  const bureauOverdues = bureaus.map((name) => ({
    name,
    overdueCount: Math.floor(Math.random() * 12),
    overdueRate: Number((Math.random() * 3.2).toFixed(2)),
  }));

  const lowReviews = [
    { serviceName: '失业保险金申领', rating: 2, content: '材料要求不清楚，跑了两次。', time: '2026-06-12 15:30' },
    { serviceName: '户籍迁移办理', rating: 1, content: '等待时间太长，流程复杂。', time: '2026-06-12 10:12' },
    { serviceName: '保障性住房申请', rating: 3, content: '审核周期太长，希望能加快。', time: '2026-06-11 16:48' },
    { serviceName: '公租房申请', rating: 2, content: '咨询电话难打通，希望改进。', time: '2026-06-11 09:22' },
  ];

  const bureauStatuses = bureaus.map((name, i) => ({
    name,
    connected: Math.random() > 0.1,
    responseMs: Math.floor(80 + Math.random() * 380),
    serviceCount: Math.floor(2 + Math.random() * 8),
    lastUpdate: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())} ${pad(today.getHours() - i)}:${pad(Math.floor(Math.random() * 60))}:00`,
  }));

  return {
    todayCount: Math.floor(4500 + Math.random() * 1800),
    avgDurationHours: Number((3.5 + Math.random() * 1.5).toFixed(1)),
    onTimeRate: Number((90 + Math.random() * 8).toFixed(1)),
    satisfactionRate: Number((92 + Math.random() * 6).toFixed(1)),
    positiveCount: Math.floor(2200 + Math.random() * 900),
    neutralCount: Math.floor(500 + Math.random() * 300),
    negativeCount: Math.floor(100 + Math.random() * 120),
    trendPoints,
    bureauOverdues,
    lowReviews,
    bureauStatuses,
    lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
}

function buildHeatmapData() {
  const districtConfig = {
    chengdu: ['锦江区', '青羊区', '武侯区', '成华区', '金牛区', '高新区', '天府新区', '龙泉驿区'],
    deyang: ['旌阳区', '罗江区', '广汉市', '什邡市', '绵竹市', '中江县'],
    meishan: ['东坡区', '彭山区', '仁寿县', '洪雅县', '丹棱县', '青神县'],
    ziyang: ['雁江区', '安岳县', '乐至县'],
  };
  const districtHeats = [];
  const cityNames = { chengdu: '成都', deyang: '德阳', meishan: '眉山', ziyang: '资阳' };
  for (const [city, districts] of Object.entries(districtConfig)) {
    districts.forEach((name) => {
      districtHeats.push({
        city,
        cityName: cityNames[city],
        district: name,
        count: Math.floor(300 + Math.random() * 3500),
        avgWaitMinutes: Math.floor(2 + Math.random() * 25),
      });
    });
  }
  districtHeats.sort((a, b) => b.count - a.count);

  const ageRanges = ['18-25', '26-35', '36-45', '46-55', '56+'];
  const ageHeats = ageRanges.map((range) => {
    const male = Math.floor(400 + Math.random() * 2500);
    const female = Math.floor(400 + Math.random() * 2500);
    return { ageRange: range, maleCount: male, femaleCount: female, total: male + female };
  });

  const timeSlotHeats = [];
  for (let h = 0; h < 24; h++) {
    const isPeak = (h >= 9 && h <= 11) || (h >= 14 && h <= 16);
    const weight = isPeak ? 1.8 : h < 7 || h > 21 ? 0.2 : 1;
    timeSlotHeats.push({
      hour: h,
      timeSlot: `${pad(h)}:00-${pad(h + 1)}:00`,
      timeRange: `${pad(h)}:00-${pad(h + 1)}:00`,
      count: Math.floor((200 + Math.random() * 500) * weight),
      avgWaitMinutes: Math.round((2 + Math.random() * 15) * weight),
    });
  }

  const serviceNames = [
    '社保参保证明开具', '医保个人账户查询', '预约挂号', '公积金提取申请',
    '电子医保凭证申领', '居民医保参保登记', '社保缴费证明', '养老金资格认证',
    '驾驶证期满换证', '公交卡办理', '老年人优待证办理', '社保卡激活',
  ];
  const categories = ['人社', '医疗保障', '卫健', '公积金', '公安', '交通', '民政'];
  const topServices = serviceNames.map((name, i) => ({
    rank: i + 1,
    name,
    category: categories[i % categories.length],
    count: Math.floor(2500 - i * 180 + Math.random() * 200),
    trend: Math.random() > 0.65 ? 'up' : Math.random() > 0.5 ? 'down' : 'flat',
  }));

  return { districtHeats, ageHeats, timeSlotHeats, topServices, lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 19) };
}

router.get('/dashboard', (req, res) => {
  res.json({ code: 0, message: 'ok', data: buildDashboardData() });
});

router.get('/heatmap', (req, res) => {
  res.json({ code: 0, message: 'ok', data: buildHeatmapData() });
});

router.get('/bureaus', (req, res) => {
  const { BUREAU_MAP } = require('../data');
  const list = Object.entries(BUREAU_MAP).map(([category, name]) => ({ category, name }));
  res.json({ code: 0, message: 'ok', data: list });
});

module.exports = router;
