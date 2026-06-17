import { Router } from 'express';

const router = Router();

const QUALITY_RULES = [
  { id: '1', name: '准时到达率', description: '服务人员需准时到达', enabled: true, threshold: 90, category: 'service' },
  { id: '2', name: '服务完成率', description: '订单按时完成比例', enabled: true, threshold: 95, category: 'service' },
  { id: '3', name: '用户满意度', description: '用户评价平均分', enabled: true, threshold: 4.5, category: 'quality' },
  { id: '4', name: '投诉率', description: '订单投诉比例低于阈值', enabled: false, threshold: 2, category: 'quality' },
  { id: '5', name: '车辆合规率', description: '车辆证件齐全合规', enabled: true, threshold: 100, category: 'vehicle' }
];

router.get('/heatmap', (req, res) => {
  try {
    const { cityId } = req.query;
    const grid: Array<Record<string, unknown>> = [];
    const centerLat = 39.9042;
    const centerLng = 116.4074;

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        grid.push({
          id: `grid-${i}-${j}`,
          lat: centerLat + (i - 5) * 0.02,
          lng: centerLng + (j - 5) * 0.02,
          workerCount: Math.floor(Math.random() * 50),
          driverCount: Math.floor(Math.random() * 30),
          demandCount: Math.floor(Math.random() * 80),
          heatLevel: Math.floor(Math.random() * 5)
        });
      }
    }

    res.json({
      code: 0,
      message: 'ok',
      data: {
        cityId: cityId || '1',
        grid,
        totalWorkers: grid.reduce((s, g) => s + (g.workerCount as number), 0),
        totalDrivers: grid.reduce((s, g) => s + (g.driverCount as number), 0),
        totalDemand: grid.reduce((s, g) => s + (g.demandCount as number), 0)
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/pricing', (req, res) => {
  try {
    const { category = 'vehicle', days = '7' } = req.query;
    const dayCount = parseInt(days as string, 10) || 7;
    const priceHistory: Array<Record<string, unknown>> = [];
    let basePrice = category === 'labor' ? 150 : category === 'moving' ? 400 : 300;

    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const change = (Math.random() - 0.5) * 0.1;
      const avgPrice = Math.round(basePrice * (1 + change));
      priceHistory.push({
        date: d.toISOString().split('T')[0],
        avgPrice,
        change: Math.round(change * 1000) / 10,
        isAbnormal: Math.abs(change) > 0.08
      });
      basePrice = avgPrice;
    }

    const latest = priceHistory[priceHistory.length - 1];
    const previous = priceHistory[priceHistory.length - 2];
    const trend = (latest.avgPrice as number) > (previous.avgPrice as number) ? 'up' : 'down';

    res.json({
      code: 0,
      message: 'ok',
      data: {
        category,
        currentAvgPrice: latest.avgPrice,
        trend,
        changePercent: latest.change,
        priceHistory,
        abnormalCount: priceHistory.filter(p => p.isAbnormal).length
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/disputes', (req, res) => {
  try {
    const disputes: Array<Record<string, unknown>> = [];
    for (let i = 0; i < 10; i++) {
      disputes.push({
        id: `disp-${i}`,
        orderId: `order-${i}`,
        orderTitle: `订单${i}`,
        complainantId: `user-${i}`,
        complainantName: `投诉人${i}`,
        respondentId: `user-${i + 100}`,
        respondentName: `被投诉人${i}`,
        disputeType: ['服务质量', '价格争议', '损坏赔偿', '超时延误'][i % 4],
        description: '纠纷描述示例',
        evidence: [],
        status: i < 3 ? 'open' : 'resolved',
        arbitratorId: null,
        resolution: '',
        compensationAmount: 0,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 86400000).toISOString()
      });
    }
    res.json({ code: 0, message: 'ok', data: disputes });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/disputes/:id', (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      code: 0,
      message: 'ok',
      data: {
        id,
        orderId: 'order-1',
        orderTitle: '示例订单',
        orderType: 'labor',
        orderPrice: 200,
        complainant: { id: 'user-1', name: '投诉人', phone: '13800000001' },
        respondent: { id: 'user-2', name: '被投诉人', phone: '13800000002' },
        employerInfo: { name: '雇主', phone: '13800000003' },
        disputeType: '服务质量',
        description: '纠纷描述',
        status: 'open',
        evidenceList: [
          { id: '1', type: 'image', url: 'https://example.com/e1.jpg', uploadedBy: '投诉人', uploadedAt: new Date().toISOString() }
        ],
        arbitrator: null,
        resolution: '',
        compensationAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/disputes/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, compensationAmount, responsibleParty } = req.body as Record<string, unknown>;
    const now = new Date().toISOString();
    res.json({ code: 0, message: 'ok', data: { success: true, resolvedAt: now, responsibleParty, resolution, compensationAmount } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/quality/rules', (req, res) => {
  try {
    res.json({ code: 0, message: 'ok', data: QUALITY_RULES });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/quality/rules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body as { enabled: boolean };
    const rule = QUALITY_RULES.find((r: { id: string }) => r.id === id);
    if (rule) {
      rule.enabled = enabled;
    }
    res.json({ code: 0, message: 'ok', data: { success: true, enabled } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/quality/logs', (req, res) => {
  try {
    const logs: Array<Record<string, unknown>> = [];
    for (let i = 0; i < 20; i++) {
      const d = new Date();
      d.setHours(d.getHours() - i * 3);
      logs.push({
        id: `log-${i}`,
        ruleId: QUALITY_RULES[i % QUALITY_RULES.length].id,
        ruleName: QUALITY_RULES[i % QUALITY_RULES.length].name,
        targetType: i % 2 === 0 ? 'worker' : 'driver',
        targetId: `user-${i}`,
        targetName: i % 2 === 0 ? '李工人' : '赵司机',
        orderId: `order-${i}`,
        severity: ['low', 'medium', 'high'][i % 3],
        description: `${QUALITY_RULES[i % QUALITY_RULES.length].name}不达标`,
        createdAt: d.toISOString()
      });
    }
    res.json({ code: 0, message: 'ok', data: logs });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/insurance/claims', (req, res) => {
  try {
    const claims: Array<Record<string, unknown>> = [];
    for (let i = 0; i < 10; i++) {
      claims.push({
        id: `claim-${i}`,
        policyId: `pol-${i}`,
        policyNo: `POL${10000 + i}`,
        orderId: `order-${i}`,
        orderTitle: `订单${i}`,
        claimantId: `user-${i}`,
        claimantName: `申请人${i}`,
        claimType: ['damage', 'loss', 'delay'][i % 3],
        insuranceType: 'cargo',
        insuredAmount: 1000 + i * 500,
        amount: 200 + i * 100,
        description: '理赔描述',
        evidence: [],
        status: i < 3 ? 'pending' : 'resolved',
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 86400000).toISOString()
      });
    }
    res.json({ code: 0, message: 'ok', data: claims });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/stats', (req, res) => {
  try {
    const totalOrders = 500 + Math.floor(Math.random() * 500);
    const pendingOrders = 20 + Math.floor(Math.random() * 30);
    const inServiceOrders = 10 + Math.floor(Math.random() * 20);
    const completedOrders = totalOrders - pendingOrders - inServiceOrders;
    const totalRevenue = 50000 + Math.floor(Math.random() * 50000);

    const orderTrend: Array<Record<string, unknown>> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      orderTrend.push({
        date: d.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50 + 20),
        revenue: Math.floor(Math.random() * 20000 + 5000)
      });
    }

    res.json({
      code: 0,
      message: 'ok',
      data: {
        totalOrders,
        pendingOrders,
        inServiceOrders,
        completedOrders,
        totalWorkers: 50,
        onlineWorkers: 30,
        totalDrivers: 30,
        onlineDrivers: 18,
        openDisputes: 5,
        pendingClaims: 3,
        totalRevenue,
        orderTrend,
        categoryStats: {
          labor: { count: Math.floor(totalOrders * 0.4), revenue: Math.floor(totalRevenue * 0.3) },
          vehicle: { count: Math.floor(totalOrders * 0.35), revenue: Math.floor(totalRevenue * 0.4) },
          moving: { count: Math.floor(totalOrders * 0.25), revenue: Math.floor(totalRevenue * 0.3) }
        }
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

export default router;
