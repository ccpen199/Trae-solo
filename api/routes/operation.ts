import express, { type Request, type Response } from 'express';
import {
  subsidies,
  userSubsidies,
  userJourneyFunnel,
  properties,
} from '../data/mockData.js';
import type { UserSubsidy } from '../types/index.js';

const router = express.Router();

router.get('/subsidies', (req: Request, res: Response) => {
  const { status, type } = req.query;

  let filtered = [...subsidies];

  if (status && status !== 'all') {
    filtered = filtered.filter((s) => s.status === status);
  }

  if (type && type !== 'all') {
    filtered = filtered.filter((s) => s.type === type);
  }

  res.json({
    success: true,
    data: filtered,
  });
});

router.get('/subsidies/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const subsidy = subsidies.find((s) => s.id === id);

  if (!subsidy) {
    res.status(404).json({
      success: false,
      error: '补贴不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: subsidy,
  });
});

function calculateRiskScore(phone: string, userId: string): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  const userClaimCount = userSubsidies.filter(
    (us) => us.phone === phone || us.userId === userId,
  ).length;

  if (userClaimCount >= 3) {
    score += 30;
    flags.push('同一用户多次领取');
  }

  const phonePattern = /^1[3-9]\d{9}$/;
  if (!phonePattern.test(phone)) {
    score += 10;
  }

  if (phone.includes('13800138') || phone.includes('13900139')) {
    score += 20;
    flags.push('号码段异常');
  }

  const hour = new Date().getHours();
  if (hour < 6 || hour > 23) {
    score += 15;
    flags.push('异常时段领取');
  }

  return { score: Math.min(score, 100), flags };
}

router.post('/subsidies/:id/claim', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, userName, phone } = req.body;

  const subsidyIndex = subsidies.findIndex((s) => s.id === id);

  if (subsidyIndex === -1) {
    res.status(404).json({
      success: false,
      error: '补贴不存在',
    });
    return;
  }

  const subsidy = subsidies[subsidyIndex];

  if (subsidy.status !== 'active') {
    res.status(400).json({
      success: false,
      error: '该补贴活动已结束',
    });
    return;
  }

  if (subsidy.claimedCount >= subsidy.totalCount) {
    res.status(400).json({
      success: false,
      error: '补贴已被领取完毕',
    });
    return;
  }

  const alreadyClaimed = userSubsidies.some(
    (us) => us.subsidyId === id && (us.userId === userId || us.phone === phone),
  );

  if (alreadyClaimed) {
    res.status(400).json({
      success: false,
      error: '您已领取过该补贴',
    });
    return;
  }

  const risk = calculateRiskScore(phone, userId);

  if (risk.score >= 70) {
    res.status(403).json({
      success: false,
      error: '风控验证未通过，存在异常领取风险',
      riskScore: risk.score,
      riskFlags: risk.flags,
    });
    return;
  }

  const verificationCode = `${subsidy.type === 'red_packet' ? 'HB' : subsidy.type === 'coupon' ? 'YH' : 'FK'}${Date.now().toString().slice(-8)}`;

  const newUserSubsidy: UserSubsidy = {
    id: `us-${Date.now()}`,
    userId: userId || 'user-001',
    userName: userName || '用户',
    phone: phone || '',
    subsidyId: id,
    subsidy: subsidy,
    claimedAt: new Date().toLocaleString('zh-CN'),
    used: false,
    usedAt: '',
    propertyId: '',
    riskScore: risk.score,
    riskFlags: risk.flags,
    verificationCode,
  };

  userSubsidies.push(newUserSubsidy);

  subsidy.claimedCount++;

  res.json({
    success: true,
    data: newUserSubsidy,
    message: `恭喜您成功领取${subsidy.name}！`,
  });
});

router.get('/user-subsidies', (req: Request, res: Response) => {
  const { userId, phone, used } = req.query;

  let filtered = [...userSubsidies];

  if (userId) {
    filtered = filtered.filter((us) => us.userId === userId);
  }

  if (phone) {
    filtered = filtered.filter((us) => us.phone === phone);
  }

  if (used !== undefined && used !== null) {
    const isUsed = used === 'true';
    filtered = filtered.filter((us) => us.used === isUsed);
  }

  filtered.sort(
    (a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime(),
  );

  res.json({
    success: true,
    data: filtered,
  });
});

router.post('/user-subsidies/:id/use', (req: Request, res: Response) => {
  const { id } = req.params;
  const { propertyId } = req.body;

  const userSubsidyIndex = userSubsidies.findIndex((us) => us.id === id);

  if (userSubsidyIndex === -1) {
    res.status(404).json({
      success: false,
      error: '用户补贴不存在',
    });
    return;
  }

  const userSubsidy = userSubsidies[userSubsidyIndex];

  if (userSubsidy.used) {
    res.status(400).json({
      success: false,
      error: '该补贴已使用',
    });
    return;
  }

  const property = properties.find((p) => p.id === propertyId);
  if (!property) {
    res.status(400).json({
      success: false,
      error: '楼盘不存在',
    });
    return;
  }

  const minPrice = userSubsidy.subsidy.minPurchaseAmount;
  if (property.price * 80 < minPrice) {
    res.status(400).json({
      success: false,
      error: `购房金额不满足使用条件，需满${minPrice / 10000}万以上`,
    });
    return;
  }

  userSubsidy.used = true;
  userSubsidy.usedAt = new Date().toLocaleString('zh-CN');
  userSubsidy.propertyId = propertyId;

  const subsidyIndex = subsidies.findIndex(
    (s) => s.id === userSubsidy.subsidyId,
  );
  if (subsidyIndex !== -1) {
    subsidies[subsidyIndex].usedCount++;
  }

  res.json({
    success: true,
    data: userSubsidy,
    message: '补贴核销成功',
  });
});

router.get('/subsidies/stats/summary', (req: Request, res: Response) => {
  const totalSubsidies = subsidies.length;
  const activeSubsidies = subsidies.filter((s) => s.status === 'active').length;
  const totalClaimed = subsidies.reduce((sum, s) => sum + s.claimedCount, 0);
  const totalUsed = subsidies.reduce((sum, s) => sum + s.usedCount, 0);
  const totalAmount = subsidies.reduce(
    (sum, s) => sum + s.amount * s.usedCount,
    0,
  );

  const highRiskCount = userSubsidies.filter((us) => us.riskScore >= 60).length;
  const blockedCount = 0;

  res.json({
    success: true,
    data: {
      totalSubsidies,
      activeSubsidies,
      totalClaimed,
      totalUsed,
      totalAmount,
      highRiskCount,
      blockedCount,
      usageRate: totalClaimed > 0 ? Math.round((totalUsed / totalClaimed) * 100) : 0,
    },
  });
});

router.get('/journey/funnel', (req: Request, res: Response) => {
  const { period = '2026年第一季度' } = req.query;

  res.json({
    success: true,
    data: userJourneyFunnel,
  });
});

router.get('/journey/funnel/details', (req: Request, res: Response) => {
  const stepDetails = {
    browse: {
      description: '用户首次访问平台，浏览房源信息',
      channels: [
        { name: '搜索引擎', count: 18000, percentage: 36 },
        { name: '直接访问', count: 12000, percentage: 24 },
        { name: '社交媒体', count: 10000, percentage: 20 },
        { name: '线下推广', count: 6000, percentage: 12 },
        { name: '朋友推荐', count: 4000, percentage: 8 },
      ],
      topPages: [
        { name: '首页', views: 45000 },
        { name: '楼盘列表', views: 38000 },
        { name: '地图找房', views: 25000 },
        { name: '购房管家', views: 15000 },
        { name: '补贴活动', views: 12000 },
      ],
    },
    favorite: {
      description: '用户对感兴趣的房源进行收藏关注',
      avgFavorites: 3.2,
      topFavorited: properties.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        favorites: Math.floor(Math.random() * 500) + 200,
      })),
      reasons: [
        { name: '价格合适', percentage: 35 },
        { name: '地段好', percentage: 28 },
        { name: '户型满意', percentage: 20 },
        { name: '学区优质', percentage: 12 },
        { name: '其他', percentage: 5 },
      ],
    },
    consult: {
      description: '用户通过在线客服或电话咨询楼盘详情',
      avgConsultTime: 8.5,
      consultationTypes: [
        { name: '价格优惠', count: 2800, percentage: 34 },
        { name: '户型详情', count: 2200, percentage: 27 },
        { name: '交付时间', count: 1500, percentage: 18 },
        { name: '配套设施', count: 1000, percentage: 12 },
        { name: '其他', count: 700, percentage: 9 },
      ],
      responseSatisfaction: 92,
    },
    visit: {
      description: '用户预约并实际到访楼盘现场看房',
      avgVisitDuration: 2.5,
      visitMethods: [
        { name: '专车带看', count: 1500, percentage: 58 },
        { name: '自行前往', count: 800, percentage: 31 },
        { name: '团购活动', count: 280, percentage: 11 },
      ],
      satisfaction: 85,
    },
    subscribe: {
      description: '用户最终认购签约',
      avgDecisionDays: 15,
      propertyDistribution: [
        { name: '和平区', count: 180, percentage: 29 },
        { name: '沈河区', count: 150, percentage: 24 },
        { name: '铁西区', count: 120, percentage: 19 },
        { name: '皇姑区', count: 90, percentage: 15 },
        { name: '其他区域', count: 80, percentage: 13 },
      ],
      cancelRate: 8,
    },
  };

  res.json({
    success: true,
    data: stepDetails,
  });
});

router.get('/data/sales-comparison', (req: Request, res: Response) => {
  const salesData = properties.map((p) => {
    const competitors = properties
      .filter((cp) => cp.id !== p.id && cp.district === p.district)
      .slice(0, 3)
      .map((cp) => ({
        propertyId: cp.id,
        propertyName: cp.name,
        priceDiff: Math.round(p.price - cp.price),
        salesRateDiff: Math.round(p.salesRate - cp.salesRate),
      }));

    return {
      propertyId: p.id,
      propertyName: p.name,
      governmentPrice: p.governmentPrice,
      secondhandPrice: p.secondhandPrice,
      salesRate: p.salesRate,
      monthlySales: p.monthlySales,
      competitorComparison: competitors,
    };
  });

  res.json({
    success: true,
    data: salesData,
  });
});

router.get('/data/market-overview', (req: Request, res: Response) => {
  const districts = [...new Set(properties.map((p) => p.district))];

  const districtStats = districts.map((d) => {
    const districtProps = properties.filter((p) => p.district === d);
    const avgPrice = Math.round(
      districtProps.reduce((sum, p) => sum + p.price, 0) / districtProps.length,
    );
    const avgGovPrice = Math.round(
      districtProps.reduce((sum, p) => sum + p.governmentPrice, 0) / districtProps.length,
    );
    const avgSecondhandPrice = Math.round(
      districtProps.reduce((sum, p) => sum + p.secondhandPrice, 0) / districtProps.length,
    );
    const avgSalesRate = Math.round(
      districtProps.reduce((sum, p) => sum + p.salesRate, 0) / districtProps.length,
    );
    const totalMonthlySales = districtProps.reduce((sum, p) => sum + p.monthlySales, 0);

    return {
      district: d,
      propertyCount: districtProps.length,
      avgPrice,
      avgGovPrice,
      avgSecondhandPrice,
      avgSalesRate,
      totalMonthlySales,
    };
  });

  const marketTrend = [
    { month: '2025-08', avgPrice: 15200, salesVolume: 1850 },
    { month: '2025-09', avgPrice: 15500, salesVolume: 2100 },
    { month: '2025-10', avgPrice: 15800, salesVolume: 2300 },
    { month: '2025-11', avgPrice: 16000, salesVolume: 2150 },
    { month: '2025-12', avgPrice: 16200, salesVolume: 2500 },
    { month: '2026-01', avgPrice: 16500, salesVolume: 1900 },
    { month: '2026-02', avgPrice: 16800, salesVolume: 1750 },
    { month: '2026-03', avgPrice: 17000, salesVolume: 2200 },
  ];

  const propertyTypeStats = [
    { type: '住宅', count: properties.filter((p) => p.propertyType === '住宅').length, avgPrice: 0 },
    { type: '公寓', count: properties.filter((p) => p.propertyType === '公寓').length, avgPrice: 0 },
    { type: '别墅', count: properties.filter((p) => p.propertyType === '别墅').length, avgPrice: 0 },
  ];

  propertyTypeStats.forEach((s) => {
    const typeProps = properties.filter((p) => p.propertyType === s.type);
    s.avgPrice = typeProps.length > 0
      ? Math.round(typeProps.reduce((sum, p) => sum + p.price, 0) / typeProps.length)
      : 0;
  });

  const summary = {
    totalProperties: properties.length,
    onSaleProperties: properties.filter((p) => p.status === '在售').length,
    avgPrice: Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length),
    avgGovPrice: Math.round(properties.reduce((sum, p) => sum + p.governmentPrice, 0) / properties.length),
    avgSecondhandPrice: Math.round(properties.reduce((sum, p) => sum + p.secondhandPrice, 0) / properties.length),
    totalMonthlySales: properties.reduce((sum, p) => sum + p.monthlySales, 0),
  };

  res.json({
    success: true,
    data: {
      districtStats,
      marketTrend,
      propertyTypeStats,
      summary,
    },
  });
});

export default router;
