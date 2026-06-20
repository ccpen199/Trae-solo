// MSW REST Handlers：所有 Mock API 路由

import { http, HttpResponse } from 'msw';
import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import type {
  Category, Brand, ProductModel, SerialRule,
  AIAnalyzeResult, QuoteResult, TieredPrice,
  Order, ReturnRecord, FlyCheckTask,
  Inspector, EcoMetrics, EcoCertificate,
  InventoryOverview, AgeDistribution, SlowMovingItem, ChannelProfit,
  AdminDashboard, PageResult, OverallGrade, ReturnStatus,
} from '@/types';

import { categories, brands, productModels, getSerialRuleByModelId } from './data/products';
import { inspectors, getInspectorById, getInspectorDeviationTrend } from './data/inspectors';
import {
  orders as allOrders, getOrderById, getOrdersByUser,
  returnRecords as allReturns, getReturnsByUser,
} from './data/orders';
import { flyCheckTasks, createFlyCheckTask } from './data/flycheck';
import {
  inventoryOverview, channelProfits, slowMovingItems, ageDistributions,
} from './data/inventory';
import {
  CARBON_COEFFICIENTS, ecoMetrics, getCertificatesByUser,
  calcCarbon, calcWater, calcMaterial, lookupCategoryName,
} from './data/eco';

const ok = <T>(data: T) => HttpResponse.json({ code: 0, message: 'ok', data });

const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function genAIAnalyze(seed = 0): AIAnalyzeResult {
  const scratch = Math.max(1, Math.min(5, 2 + Math.floor(Math.random() * 4 + seed * 0.1)));
  const wear = Math.max(1, Math.min(5, 2 + Math.floor(Math.random() * 4 + seed * 0.07)));
  const oxidation = Math.max(1, Math.min(5, 1 + Math.floor(Math.random() * 4 + seed * 0.05)));
  const functionScore = Math.max(70, Math.min(100, Math.round(92 - (scratch + wear) * 1.4 - Math.random() * 8)));
  const avg = (scratch + wear + oxidation) / 3;
  let overallGrade: OverallGrade;
  if (avg <= 1.4 && functionScore >= 95) overallGrade = 'S';
  else if (avg <= 1.9 && functionScore >= 90) overallGrade = 'A+';
  else if (avg <= 2.4 && functionScore >= 85) overallGrade = 'A';
  else if (avg <= 3.0 && functionScore >= 80) overallGrade = 'B+';
  else if (avg <= 3.8) overallGrade = 'B';
  else overallGrade = 'C';
  const aiConfidence = Math.max(0.72, Math.min(0.99, 0.92 + (Math.random() - 0.5) * 0.12));
  const defectDetailPool = [
    { area: '屏幕', type: '划痕', severity: 'minor', desc: '顶部可见0.5mm发丝划痕' },
    { area: '屏幕', type: '划痕', severity: 'moderate', desc: '中部3cm轻微划痕' },
    { area: '边框', type: '磕碰', severity: 'minor', desc: '左上角轻微磕碰' },
    { area: '边框', type: '磨损', severity: 'moderate', desc: '底部充电口两侧掉漆' },
    { area: '背板', type: '划痕', severity: 'minor', desc: '摄像头下方细微划痕' },
    { area: '按键', type: '功能异常', severity: 'moderate', desc: '音量下键偏软但可用' },
    { area: '摄像头', type: '进灰', severity: 'minor', desc: '长焦镜头轻微进灰，不影响成像' },
    { area: '电池', type: '老化', severity: 'moderate', desc: '健康度83%，轻微鼓包趋势' },
  ];
  const dCount = Math.max(1, Math.min(5, 2 + Math.floor((scratch + wear) / 2)));
  const defectDetails = Array.from({ length: dCount }, (_, i) => {
    const p = rand(defectDetailPool);
    return {
      area: p.area,
      type: p.type,
      severity: p.severity as 'minor' | 'moderate' | 'major',
      description: p.desc,
      imageIndex: i % 3,
    };
  });
  return {
    scratchLevel: scratch as 1 | 2 | 3 | 4 | 5,
    wearLevel: wear as 1 | 2 | 3 | 4 | 5,
    oxidationLevel: oxidation as 1 | 2 | 3 | 4 | 5,
    functionScore,
    overallGrade,
    aiConfidence: +aiConfidence.toFixed(2),
    defectDetails,
  };
}

function calcConditionMultiplier(r: AIAnalyzeResult): number {
  const gradeMul: Record<OverallGrade, number> = {
    S: 0.98, 'A+': 0.93, A: 0.88, 'B+': 0.80, B: 0.72, C: 0.60,
  };
  const fnMul = Math.max(0.92, Math.min(1.0, r.functionScore / 100 + 0.08));
  return gradeMul[r.overallGrade] * fnMul;
}

function genQuote(model: ProductModel, ai: AIAnalyzeResult): QuoteResult {
  const base = model.basePrice * calcConditionMultiplier(ai);
  const tieredPrices: TieredPrice[] = [
    {
      tier: 'instant', label: '极速回收',
      price: Math.round(base * 0.88),
      settlementDays: '1'.toString(),
      description: '24小时内验货回款，价格最稳妥',
    },
    {
      tier: 'standard', label: '标准回收',
      price: Math.round(base * 0.95),
      settlementDays: '3'.toString(),
      description: '3个工作日检测结算，性价比之选',
    },
    {
      tier: 'consignment', label: '寄售模式',
      price: Math.round(base * 1.02),
      settlementDays: '30'.toString(),
      description: '30天内售出结算，最高价',
    },
  ];
  const priceComparison = [
    { platform: '京东拍拍', price: Math.round(base * 0.86 + (Math.random() - 0.3) * 300) },
    { platform: '闲鱼优品', price: Math.round(base * 0.90 + (Math.random() - 0.3) * 400) },
    { platform: '蜂鸟二手', price: Math.round(base * 0.84 + (Math.random() - 0.3) * 200) },
    { platform: '爱回收', price: Math.round(base * 0.82 + (Math.random() - 0.3) * 150) },
  ];
  const priceHistory: QuoteResult['priceHistory'] = [];
  const ref = model.basePrice ?? 0;
  const msrpVal = (model.msrp ?? 0) as number;
  for (let i = 29; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day');
    const trend = ref * (0.96 + Math.sin(i / 7 + msrpVal * 0.00001) * 0.03 + (Math.random() - 0.5) * 0.01);
    priceHistory.push({
      date: d.format('YYYY-MM-DD'),
      price: Math.round(trend),
    });
  }
  return {
    tieredPrices,
    priceComparison: priceComparison.map(p => ({ ...p, trend: 'flat' as const, trendPercent: 0 })),
    priceHistory,
    serialVerifyRule: getSerialRuleByModelId(model.id),
  };
}

export const handlers = [
  http.get('/api/categories', () => ok<Category[]>(categories)),

  http.get('/api/brands', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const result = category
      ? brands.filter((b) => b.categoryId === category)
      : brands;
    return ok<Brand[]>(result);
  }),

  http.get('/api/models', ({ request }) => {
    const url = new URL(request.url);
    const brandId = url.searchParams.get('brandId');
    const result = brandId
      ? productModels.filter((m) => m.brandId === brandId)
      : productModels;
    return ok<ProductModel[]>(result);
  }),

  http.get('/api/models/:id', ({ params }) => {
    const id = params.id as string;
    const model = productModels.find((m) => m.id === id);
    if (!model) return HttpResponse.json({ code: 404, message: 'not found' }, { status: 404 });
    const serialRule = getSerialRuleByModelId(id);
    return ok({ ...model, serialRule });
  }),

  http.post('/api/evaluate/ai-analyze', async ({ request }) => {
    const body = await request.json() as { modelId?: string; imageCount?: number } | undefined;
    const seed = body?.modelId?.length ?? 0 + (body?.imageCount ?? 0);
    const result = genAIAnalyze(seed);
    await new Promise((r) => setTimeout(r, 600));
    return ok<AIAnalyzeResult>(result);
  }),

  http.post('/api/evaluate/quote', async ({ request }) => {
    const body = await request.json() as { modelId: string; aiResult: AIAnalyzeResult } | undefined;
    if (!body || !body.modelId || !body.aiResult) {
      return HttpResponse.json({ code: 400, message: '参数错误' }, { status: 400 });
    }
    const model = productModels.find((m) => m.id === body.modelId);
    if (!model) return HttpResponse.json({ code: 404, message: '型号不存在' }, { status: 404 });
    const result = genQuote(model, body.aiResult);
    return ok<QuoteResult>(result);
  }),

  http.post('/api/orders', async ({ request }) => {
    const body = await request.json() as Partial<Order> | undefined;
    if (!body) return HttpResponse.json({ code: 400, message: '参数错误' }, { status: 400 });
    const newId = `ord_${String(allOrders.length + 1).padStart(5, '0')}`;
    const model = productModels.find((m) => m.id === body.modelId);
    const brand = model ? brands.find((b) => b.id === model.brandId) : undefined;
    const orderNo = `HX${dayjs().format('YYYYMMDD')}${String(1000 + allOrders.length).padStart(6, '0')}`;
    const order: Order = {
      id: newId,
      orderNo,
      userId: body.userId || 'user_001',
      modelId: body.modelId || 'mdl_001',
      status: 'pending_pickup',
      productInfo: body.productInfo || {
        brand: brand?.name || 'Apple',
        model: model?.name || 'iPhone 15 Pro',
        image: '📱',
        grade: 'A',
      },
      quotePrice: body.quotePrice || 0,
      pickupAddress: body.pickupAddress || {
        province: '上海市', city: '上海市', district: '浦东新区',
        detail: faker.location.streetAddress(false),
        contact: faker.person.firstName(),
        phone: '138' + faker.string.numeric(8),
      },
      pickupWindow: body.pickupWindow || {
        date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        period: 'afternoon',
      },
      signedAgreement: false,
      createdAt: new Date().toISOString(),
    };
    allOrders.unshift(order);
    return ok<Order>(order);
  }),

  http.get('/api/orders', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status') || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(url.searchParams.get('pageSize') || '10', 10));
    let list = userId ? getOrdersByUser(userId, status) : allOrders;
    if (status && !userId) list = list.filter((o) => o.status === status);
    const total = list.length;
    const start = (page - 1) * pageSize;
    const paged = list.slice(start, start + pageSize);
    return ok<PageResult<Order>>({ list: paged, total, page, pageSize });
  }),

  http.get('/api/orders/:id', ({ params }) => {
    const id = params.id as string;
    const order = getOrderById(id);
    if (!order) return HttpResponse.json({ code: 404, message: '订单不存在' }, { status: 404 });
    const inspector = order.inspectorId ? getInspectorById(order.inspectorId) : undefined;
    return ok({ ...order, inspector });
  }),

  http.post('/api/orders/:id/sign', async ({ params }) => {
    const id = params.id as string;
    const order = getOrderById(id);
    if (!order) return HttpResponse.json({ code: 404, message: '订单不存在' }, { status: 404 });
    order.signedAgreement = true;
    if (order.status === 'pending_pickup') order.status = 'inspecting';
    return ok<Order>(order);
  }),

  http.get('/api/inspectors/:id', ({ params }) => {
    const id = params.id as string;
    const inspector = getInspectorById(id);
    if (!inspector) return HttpResponse.json({ code: 404, message: '检测师不存在' }, { status: 404 });
    return ok<Inspector>(inspector);
  }),

  http.get('/api/inspectors/:id/stats', ({ params }) => {
    const id = params.id as string;
    const trend = getInspectorDeviationTrend(id);
    const inspector = getInspectorById(id);
    return ok({
      inspectorId: id,
      currentRate: inspector?.deviationRate30d ?? 2.5,
      threshold: 3.0,
      trend,
      alerts: trend.filter((t) => t.rate > 3.0).length,
    });
  }),

  http.post('/api/returns', async ({ request }) => {
    const body = await request.json() as { orderId: string; reason: string; userId: string } | undefined;
    if (!body) return HttpResponse.json({ code: 400, message: '参数错误' }, { status: 400 });
    const order = getOrderById(body.orderId);
    if (!order) return HttpResponse.json({ code: 404, message: '订单不存在' }, { status: 404 });
    order.status = 'returning';
    const newId = `ret_${String(allReturns.length + 1).padStart(5, '0')}`;
    const timeline: ReturnRecord['timeline'] = [
      { time: new Date().toISOString(), status: 'requested' as ReturnStatus, note: '用户提交退货申请' },
      { time: new Date().toISOString(), status: 'reviewing' as ReturnStatus, note: '客服审核中' },
    ];
    const rec: ReturnRecord = {
      id: newId,
      orderId: order.id,
      status: 'reviewing',
      reason: body.reason,
      timeline,
      estimatedRefundDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      refundAmount: order.finalPrice || order.quotePrice,
    };
    allReturns.unshift(rec);
    return ok<ReturnRecord>(rec);
  }),

  http.get('/api/returns', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const list = userId ? getReturnsByUser(userId) : allReturns;
    return ok<ReturnRecord[]>(list);
  }),

  http.get('/api/admin/inventory/overview', () => ok({
    overview: inventoryOverview as InventoryOverview,
    channelProfits: channelProfits as ChannelProfit[],
    slowMoving: slowMovingItems as SlowMovingItem[],
    ageDistributions: ageDistributions as AgeDistribution[],
  })),

  http.get('/api/admin/quality/flychecks', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as FlyCheckTask['status'] | null;
    const list = status ? flyCheckTasks.filter((f) => f.status === status) : flyCheckTasks;
    return ok<FlyCheckTask[]>(list);
  }),

  http.post('/api/admin/quality/flychecks', async ({ request }) => {
    const body = await request.json() as Parameters<typeof createFlyCheckTask>[0];
    const task = createFlyCheckTask(body);
    return ok<FlyCheckTask>(task);
  }),

  http.get('/api/eco/metrics', () => ok<EcoMetrics>(ecoMetrics)),

  http.get('/api/user/:id/certificates', ({ params }) => {
    const id = params.id as string;
    const list = getCertificatesByUser(id);
    return ok<EcoCertificate[]>(list);
  }),

  http.get('/api/admin/dashboard', () => {
    const statusDist = (['pending_pickup', 'inspecting', 'pending_confirm', 'paid', 'completed', 'returning', 'returned', 'cancelled'] as const)
      .map((s) => ({ status: s, count: allOrders.filter((o) => o.status === s).length }));
    const categoryDist = categories.map((c) => {
      const catBrandIds = new Set(brands.filter((b) => b.categoryId === c.id).map((b) => b.id));
      const count = allOrders.filter((o) => catBrandIds.has(
        productModels.find((m) => m.id === o.modelId)?.brandId || '',
      )).length;
      return { category: c.name, count };
    });
    const weeklyRevenue: AdminDashboard['weeklyRevenue'] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day');
      weeklyRevenue.push({
        day: d.format('MM-DD'),
        revenue: 280000 + Math.round(Math.sin(i * 1.2) * 85000 + Math.random() * 50000),
      });
    }
    const pendingPickup = allOrders.filter((o) => o.status === 'pending_pickup').length;
    const inspecting = allOrders.filter((o) => o.status === 'inspecting').length;
    const avgDeviation = inspectors.reduce((s, x) => s + x.deviationRate30d, 0) / inspectors.length;
    const carbonThisMonth = ecoMetrics.thisMonthCarbonKg;
    return ok<AdminDashboard>({
      todayOrders: 23 + Math.floor(Math.random() * 10),
      todayRevenue: weeklyRevenue[weeklyRevenue.length - 1].revenue,
      pendingPickup,
      inspecting,
      totalInspectors: inspectors.length,
      averageDeviationRate: +avgDeviation.toFixed(2),
      inventoryValue: inventoryOverview.totalValue,
      carbonSavedThisMonth: carbonThisMonth,
      weeklyRevenue,
      orderStatusDistribution: statusDist,
      categoryDistribution: categoryDist,
    });
  }),

  http.get('/api/eco/coefficients', () => ok({
    carbon: CARBON_COEFFICIENTS,
    lookup: {
      byModel: (id: string) => {
        const cat = lookupCategoryName(id);
        return {
          category: cat,
          carbonKg: calcCarbon(cat, 1),
          waterL: calcWater(cat, 1),
          materialKg: calcMaterial(cat, 1),
        };
      },
    },
  })),
];

export default handlers;
