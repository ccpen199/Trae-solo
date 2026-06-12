import { http, HttpResponse, delay } from 'msw';
import type {
  User,
  DecorationCompany,
  InspirationItem,
  ConstructionProcess,
  PitfallGuide,
  CommunityQuestion,
  Project,
  MaterialSKU,
  DisputeCase,
  MeasurementAppointment,
  DesignPlan3D,
  DecorationQuote,
  SupplierAPIConfig,
  ComparisonPlan,
  DesignStyle,
  ColorPalette,
  CommunityAnswer,
  QualificationDoc,
  MeasurementRecord,
} from '@/types';
import {
  createUsers,
  createCompanies,
  createInspirations,
  createProcesses,
  createPitfalls,
  createQuestions,
  createProjects,
  createSKUs,
  createDisputes,
  createAppointments,
  create3DPlans,
  createQuotes,
  createSupplierConfigs,
  createComparisonPlans,
} from '@/mocks/data/seed';

const users: User[] = createUsers();
const companies: DecorationCompany[] = createCompanies(8);
const inspirations: InspirationItem[] = createInspirations(60);
const processes: ConstructionProcess[] = createProcesses();
const pitfalls: PitfallGuide[] = createPitfalls(30);
const questions: CommunityQuestion[] = createQuestions(20);
const projects: Project[] = createProjects(5);
const skus: MaterialSKU[] = createSKUs(200);
const disputes: DisputeCase[] = createDisputes(4);
const appointments: MeasurementAppointment[] = createAppointments(6);
const designPlans: DesignPlan3D[] = create3DPlans('user-owner-001');
const quotes: DecorationQuote[] = createQuotes();
const supplierConfigs: SupplierAPIConfig[] = createSupplierConfigs();
const comparisonPlans: ComparisonPlan[] = createComparisonPlans(companies);

interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

function success<T>(data: T, message = 'success'): HttpResponse<ApiResponse<T>> {
  return HttpResponse.json({
    code: 0,
    message,
    data,
  });
}

function paginate<T>(list: T[], page: number, pageSize: number): PaginatedResult<T> {
  const start = (page - 1) * pageSize;
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  };
}

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as { phone?: string; role?: string };
    const targetRole = (body.role || 'owner') as User['role'];
    const matchedUser = users.find((u) => u.role === targetRole) || users[0];
    return success({
      token: `mock-token-${Date.now()}`,
      user: matchedUser,
    }, '登录成功');
  }),

  http.post('/api/owner/3d-plan', async () => {
    await delay(800);
    const newPlan = {
      ...designPlans[0],
      id: `3dplan-new-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    designPlans.unshift(newPlan);
    return success(newPlan, '3D方案创建成功');
  }),

  http.get('/api/owner/3d-plan/:id', async ({ params }) => {
    await delay(300);
    const { id } = params;
    const plan = designPlans.find((p) => p.id === id) || designPlans[0];
    return success(plan);
  }),

  http.put('/api/owner/3d-plan/:id', async ({ params, request }) => {
    await delay(500);
    const { id } = params;
    const body = await request.json();
    const plan = designPlans.find((p) => p.id === id);
    if (plan) {
      Object.assign(plan, body);
    }
    return success(plan || body, '3D方案更新成功');
  }),

  http.post('/api/owner/3d-plan/recognize', async () => {
    await delay(1500);
    const walls = [
      { id: 'w1', position: 'north' as const, width: 4.5, openings: [{ type: 'window' as const, width: 1.8, height: 1.5, offsetFromLeft: 1.2 }] },
      { id: 'w2', position: 'south' as const, width: 4.5, openings: [{ type: 'door' as const, width: 0.9, height: 2.1, offsetFromLeft: 1.8 }] },
      { id: 'w3', position: 'east' as const, width: 3.6, openings: [] },
      { id: 'w4', position: 'west' as const, width: 3.6, openings: [] },
    ];
    return success({
      rooms: [
        { id: 'r1', type: 'living' as const, name: '客厅', width: 4.5, length: 3.6, height: 2.8, walls },
      ],
      confidence: 0.92,
    }, '户型图识别完成');
  }),

  http.post('/api/owner/3d-plan/furniture-suggest', async ({ request }) => {
    await delay(800);
    const body = (await request.json()) as { style?: DesignStyle; roomType?: string };
    const style = body.style || 'modern';
    const styleFurniture: Record<DesignStyle, string[]> = {
      modern: ['三人布艺沙发', '玻璃茶几', '轻奢电视柜', '落地灯'],
      nordic: ['实木框架沙发', '原木茶几', '简约边柜', '木质落地灯'],
      chinese: ['新中式实木沙发', '雕花茶几', '红木电视柜', '宫灯吊灯'],
      luxury: ['意大利真皮沙发', '大理石茶几', '金属电视柜', '水晶吊灯'],
      industrial: ['铆钉皮质沙发', '铁艺茶几', '做旧柜子', '复古灯泡'],
      japanese: ['原木低矮沙发', '竹编茶几', '和式柜', '和纸灯笼'],
      mediterranean: ['蓝白条纹沙发', '马赛克茶几', '铁艺柜', '贝壳吊灯'],
    };
    return success({
      style,
      suggestions: styleFurniture[style].map((name, i) => ({
        id: `sug-${i}`,
        name,
        category: i === 0 ? 'sofa' as const : i === 1 ? 'table' as const : i === 2 ? 'cabinet' as const : 'lamp' as const,
        modelUrl: `/models/${style}/${i}.glb`,
        matchScore: 0.85 + i * 0.03,
      })),
    });
  }),

  http.post('/api/owner/quote/calculate', async ({ request }) => {
    await delay(600);
    const body = (await request.json()) as { area?: number; city?: string; tier?: DecorationQuote['tier'] };
    const area = body.area || 100;
    const city = body.city || '北京';
    const tier = body.tier || 'quality';
    const matched = quotes.find((q) => q.city === city && q.tier === tier);
    if (matched) {
      return success({
        ...matched,
        area,
        totalPrice: Math.round(matched.totalPrice * (area / matched.area)),
      });
    }
    return success(quotes[0]);
  }),

  http.get('/api/owner/quote/tiers', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const city = url.searchParams.get('city') || '北京';
    const area = Number(url.searchParams.get('area')) || 100;
    const cityQuotes = quotes.filter((q) => q.city === city);
    const tiers = ['economy', 'quality', 'luxury'] as const;
    const result = tiers.map((tier) => {
      const base = cityQuotes.find((q) => q.tier === tier);
      if (!base) return quotes.find((q) => q.tier === tier)!;
      return {
        ...base,
        area,
        totalPrice: Math.round(base.totalPrice * (area / base.area)),
      };
    });
    return success(result);
  }),

  http.get('/api/owner/companies', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 10;
    const city = url.searchParams.get('city');
    const auditStatus = url.searchParams.get('auditStatus') as DecorationCompany['auditStatus'] | null;

    let list = companies.filter((c) => c.auditStatus === 'approved');
    if (city) list = list.filter((c) => c.city === city);
    if (auditStatus) list = companies.filter((c) => c.auditStatus === auditStatus);

    return success(paginate(list, page, pageSize));
  }),

  http.get('/api/owner/companies/:id', async ({ params }) => {
    await delay(400);
    const { id } = params;
    const company = companies.find((c) => c.id === id) || companies[0];
    return success(company);
  }),

  http.get('/api/owner/appointments', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as MeasurementAppointment['status'] | null;
    let list = [...appointments];
    if (status) list = list.filter((a) => a.status === status);
    return success({ list, total: list.length });
  }),

  http.post('/api/owner/appointments', async ({ request }) => {
    await delay(500);
    const body = await request.json();
    const newAppt: MeasurementAppointment = {
      id: `appointment-${Date.now()}`,
      ownerId: 'user-owner-001',
      companyId: (body as { companyId?: string }).companyId || companies[0].id,
      address: (body as { address?: string }).address || '默认地址',
      contactName: (body as { contactName?: string }).contactName || '张先生',
      contactPhone: (body as { contactPhone?: string }).contactPhone || '13800000001',
      scheduledTime: (body as { scheduledTime?: string }).scheduledTime || new Date().toISOString(),
      status: 'pending',
      remark: (body as { remark?: string }).remark,
    };
    appointments.unshift(newAppt);
    return success(newAppt, '预约提交成功');
  }),

  http.get('/api/owner/compare-plans', async () => {
    await delay(400);
    return success({
      plans: comparisonPlans,
      comparisonMatrix: {
        totalPrice: comparisonPlans.map((p) => p.totalPrice),
        period: comparisonPlans.map((p) => p.constructionPeriod),
        materialCount: comparisonPlans.map((p) => p.materials.length),
        warrantyAvg: comparisonPlans.map((p) =>
          Math.round(p.warrantyTerms.reduce((s, w) => s + w.durationMonths, 0) / p.warrantyTerms.length)
        ),
      },
    });
  }),

  http.get('/api/owner/inspiration', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;
    const style = url.searchParams.get('style') as DesignStyle | null;
    const roomType = url.searchParams.get('roomType');
    const keyword = url.searchParams.get('keyword');

    let list = [...inspirations];
    if (style) list = list.filter((i) => i.style === style);
    if (roomType) list = list.filter((i) => i.roomType === roomType);
    if (keyword) list = list.filter((i) => i.title.includes(keyword) || i.tags.some((t) => t.includes(keyword)));

    return success(paginate(list, page, pageSize));
  }),

  http.post('/api/owner/inspiration/search-by-image', async () => {
    await delay(1200);
    return success({
      results: inspirations.slice(0, 8).map((item) => ({
        ...item,
        similarity: +(0.7 + Math.random() * 0.3).toFixed(3),
      })),
      extractedFeatures: {
        dominantColors: ['#8B7355', '#D2B48C', '#F5F5DC'],
        styleProbability: { modern: 0.45, nordic: 0.32, chinese: 0.1, luxury: 0.08, industrial: 0.03, japanese: 0.01, mediterranean: 0.01 },
      },
    }, '以图搜图完成');
  }),

  http.post('/api/owner/inspiration/:id/extract-colors', async ({ params }) => {
    await delay(600);
    const { id } = params;
    const item = inspirations.find((i) => i.id === id) || inspirations[0];
    const palette: ColorPalette = item.colorPalette;
    return success({
      ...palette,
      hexCodes: [palette.primary, palette.secondary, palette.accent, ...palette.neutrals],
      percentage: [35, 25, 15, 10, 8, 7],
      moodTags: ['温馨', '自然', '舒适'],
      matchingSkus: skus.slice(0, 6).map((s) => ({ id: s.id, name: s.name, imageUrl: s.imageUrl })),
    }, '色彩方案提取完成');
  }),

  http.get('/api/owner/materials', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 24;
    const category = url.searchParams.get('materialCategory') as MaterialSKU['materialCategory'] | null;
    const style = url.searchParams.get('style') as DesignStyle | null;

    let list = [...skus];
    if (category) list = list.filter((s) => s.materialCategory === category);
    if (style) list = list.filter((s) => s.applicableStyle.includes(style));

    return success(paginate(list, page, pageSize));
  }),

  http.get('/api/knowledge/processes', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const stage = url.searchParams.get('stage') as ConstructionProcess['stage'] | null;
    let list = [...processes];
    if (stage) list = list.filter((p) => p.stage === stage);
    return success({ list, total: list.length });
  }),

  http.get('/api/knowledge/processes/:id', async ({ params }) => {
    await delay(300);
    const { id } = params;
    const process = processes.find((p) => p.id === id) || processes[0];
    return success(process);
  }),

  http.get('/api/knowledge/pitfalls', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const stage = url.searchParams.get('stage') as PitfallGuide['stage'] | null;
    const riskLevel = url.searchParams.get('riskLevel') as PitfallGuide['riskLevel'] | null;
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 15;

    let list = [...pitfalls];
    if (stage) list = list.filter((p) => p.stage === stage);
    if (riskLevel) list = list.filter((p) => p.riskLevel === riskLevel);

    return success(paginate(list, page, pageSize));
  }),

  http.get('/api/community/questions', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 10;
    const clusterTag = url.searchParams.get('clusterTag');
    const keyword = url.searchParams.get('keyword');

    let list = [...questions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (clusterTag) list = list.filter((q) => q.clusterTag === clusterTag);
    if (keyword) list = list.filter((q) => q.title.includes(keyword) || q.content.includes(keyword));

    return success(paginate(list, page, pageSize));
  }),

  http.post('/api/community/questions', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Partial<CommunityQuestion>;
    const newQuestion: CommunityQuestion = {
      id: `question-${Date.now()}`,
      ownerId: body.ownerId || 'user-owner-001',
      ownerName: body.ownerName || '张先生',
      clusterTag: body.clusterTag || '施工工艺',
      title: body.title || '',
      content: body.content || '',
      images: body.images,
      stageTag: body.stageTag,
      answers: [],
      voteCount: 0,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };
    questions.unshift(newQuestion);
    return success(newQuestion, '问题发布成功');
  }),

  http.get('/api/community/questions/:id', async ({ params }) => {
    await delay(300);
    const { id } = params;
    const question = questions.find((q) => q.id === id) || questions[0];
    if (question) question.viewCount += 1;
    return success(question);
  }),

  http.post('/api/community/questions/:id/answers', async ({ params, request }) => {
    await delay(500);
    const { id } = params;
    const body = (await request.json()) as Partial<CommunityAnswer>;
    const question = questions.find((q) => q.id === id);
    if (question) {
      const newAnswer: CommunityAnswer = {
        id: `answer-${id}-${Date.now()}`,
        authorId: body.authorId || 'user-owner-001',
        authorName: body.authorName || '热心网友',
        isExpert: !!body.isExpert,
        isCertified: !!body.isCertified,
        content: body.content || '',
        voteCount: 0,
        comments: [],
        createdAt: new Date().toISOString(),
      };
      question.answers.push(newAnswer);
      return success(newAnswer, '回答提交成功');
    }
    return HttpResponse.json({ code: 404, message: '问题不存在', data: null }, { status: 404 });
  }),

  http.post('/api/community/vote', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as { targetId: string; targetType: 'question' | 'answer'; direction: 1 | -1 };
    return success({ voteCount: 42, ...body }, '投票成功');
  }),

  http.get('/api/provider/workspace/stats', async () => {
    await delay(300);
    return success({
      pendingAppointments: appointments.filter((a) => a.status === 'pending').length,
      inProgressProjects: projects.filter((p) => p.status === 'in_progress').length,
      todayTasks: 12,
      thisMonthRevenue: 286000,
      customerSatisfaction: 96.5,
      taskCompletionRate: 94.2,
      trend: {
        last7Days: [12, 18, 15, 22, 19, 25, 20],
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      },
    });
  }),

  http.get('/api/provider/qualification', async () => {
    await delay(400);
    const company = companies[1];
    return success({
      companyId: company.id,
      qualificationLevel: company.qualificationLevel,
      licenseNumber: company.licenseNumber,
      qualificationDocs: company.qualificationDocs,
      auditStatus: company.auditStatus,
      submittedAt: fakerDatePast(30),
      reviewNote: company.auditStatus === 'rejected' ? '部分证照模糊，请重新上传' : undefined,
    });
  }),

  http.put('/api/provider/qualification', async ({ request }) => {
    await delay(600);
    const body = (await request.json()) as Record<string, unknown>;
    return success({ ...body, auditStatus: 'pending', submittedAt: new Date().toISOString() }, '资质材料提交成功，等待审核');
  }),

  http.post('/api/provider/qualification/ocr', async () => {
    await delay(1500);
    const result: Record<string, string> = {
      公司名称: '鼎盛装饰工程有限公司',
      统一社会信用代码: '91110101MA00XXXXXX',
      法定代表人: '张建华',
      注册资本: '500万元人民币',
      成立日期: '2015-06-18',
      经营范围: '专业承包；室内装饰工程设计；销售建筑材料、五金交电',
      发证机关: '北京市市场监督管理局',
      有效期至: '2035-06-17',
    };
    return success({ confidence: 0.968, ocrResult: result, fields: Object.keys(result) }, 'OCR识别完成');
  }),

  http.get('/api/provider/appointments', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as MeasurementAppointment['status'] | null;
    let list = [...appointments];
    if (status) list = list.filter((a) => a.status === status);
    return success({
      list,
      total: list.length,
      statistics: {
        pending: appointments.filter((a) => a.status === 'pending').length,
        accepted: appointments.filter((a) => a.status === 'accepted').length,
        inProgress: appointments.filter((a) => a.status === 'in_progress').length,
        completed: appointments.filter((a) => a.status === 'completed').length,
      },
    });
  }),

  http.post('/api/provider/appointments/:id/accept', async ({ params }) => {
    await delay(300);
    const { id } = params;
    const appt = appointments.find((a) => a.id === id);
    if (appt) appt.status = 'accepted';
    return success(appt || { id }, '接单成功');
  }),

  http.get('/api/provider/plans', async () => {
    await delay(300);
    return success({ list: designPlans, total: designPlans.length });
  }),

  http.post('/api/provider/plans', async ({ request }) => {
    await delay(600);
    const body = await request.json();
    const newPlan = {
      ...designPlans[0],
      id: `3dplan-${Date.now()}`,
      ...(body as object),
      createdAt: new Date().toISOString(),
    };
    return success(newPlan, '方案创建成功');
  }),

  http.get('/api/provider/sites/:id/logs', async ({ params }) => {
    await delay(300);
    const { id } = params;
    const project = projects.find((p) => p.id === id) || projects[0];
    const logs = Array.from({ length: 8 }, (_, i) => ({
      id: `log-${id}-${i}`,
      date: new Date(Date.now() - i * 86400000 * 3).toISOString().split('T')[0],
      stage: ['水电阶段', '泥木阶段', '木工阶段', '油漆阶段', '安装阶段'][i % 5],
      weather: ['晴', '多云', '阴', '小雨'][i % 4],
      workers: fakerInt(3, 10),
      progress: 100 - i * 12,
      tasks: ['墙面开槽完成50%', '水管打压测试合格', '瓷砖铺贴中', '吊顶龙骨安装'][i % 4],
      images: Array.from({ length: 4 }, () =>
        `https://picsum.photos/seed/log${i}${Math.random()}/600/400`
      ),
      issues: i % 3 === 0 ? ['需协调材料进场时间'] : [],
      inspector: fakerName(),
    }));
    return success({ logs, project });
  }),

  http.post('/api/provider/sites/:id/logs', async () => {
    await delay(500);
    return success({ logId: `log-new-${Date.now()}`, uploadedAt: new Date().toISOString() }, '施工日志上传成功');
  }),

  http.get('/api/admin/company-audit/queue', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 10;
    const status = url.searchParams.get('status') as DecorationCompany['auditStatus'] | null;

    let list = [...companies];
    if (status) list = list.filter((c) => c.auditStatus === status);

    return success(paginate(list, page, pageSize));
  }),

  http.post('/api/admin/company-audit/:id/review', async ({ params, request }) => {
    await delay(500);
    const { id } = params;
    const body = (await request.json()) as { decision: 'approve' | 'reject'; note?: string };
    const company = companies.find((c) => c.id === id);
    if (company) {
      company.auditStatus = body.decision === 'approve' ? 'approved' : 'rejected';
    }
    return success(
      { id, auditStatus: body.decision === 'approve' ? 'approved' : 'rejected', reviewedAt: new Date().toISOString() },
      `审核${body.decision === 'approve' ? '通过' : '驳回'}`
    );
  }),

  http.get('/api/admin/projects/gantt', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const list = projectId ? projects.filter((p) => p.id === projectId) : projects;
    return success({
      projects: list,
      summary: {
        total: projects.length,
        inProgress: projects.filter((p) => p.status === 'in_progress').length,
        delayed: projects.filter((p) => p.status === 'delayed').length,
        completed: projects.filter((p) => p.status === 'completed').length,
      },
    });
  }),

  http.put('/api/admin/projects/tasks', async ({ request }) => {
    await delay(400);
    const body = await request.json();
    return success({ updated: true, ...(body as object) }, '甘特图任务更新成功');
  }),

  http.get('/api/admin/supply-chain/config', async () => {
    await delay(300);
    return success({ suppliers: supplierConfigs });
  }),

  http.put('/api/admin/supply-chain/config', async ({ request }) => {
    await delay(500);
    const body = await request.json();
    return success({ ...(body as object), updatedAt: new Date().toISOString() }, '供应链配置更新成功');
  }),

  http.get('/api/admin/material-skus', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;
    const category = url.searchParams.get('materialCategory') as MaterialSKU['materialCategory'] | null;
    const supplierId = url.searchParams.get('supplierId');
    const keyword = url.searchParams.get('keyword');

    let list = [...skus];
    if (category) list = list.filter((s) => s.materialCategory === category);
    if (supplierId) list = list.filter((s) => s.supplierId === supplierId);
    if (keyword) list = list.filter((s) => s.name.includes(keyword) || s.brand.includes(keyword) || s.skuCode.includes(keyword));

    return success(paginate(list, page, pageSize));
  }),

  http.post('/api/admin/material-skus', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Partial<MaterialSKU>;
    const newSku: MaterialSKU = {
      id: `sku-${Date.now()}`,
      skuCode: body.skuCode || `SKU-NEW-${Date.now()}`,
      name: body.name || '新商品',
      category: body.category || '其他',
      subCategory: body.subCategory || '其他',
      brand: body.brand || '未知',
      spec: body.spec || '标准规格',
      unit: body.unit || '个',
      price: body.price || 0,
      stock: body.stock || 0,
      supplierId: body.supplierId || supplierConfigs[0].id,
      materialCategory: body.materialCategory || 'other',
      applicableStyle: body.applicableStyle || ['modern'],
      createdAt: new Date().toISOString(),
    } as MaterialSKU;
    skus.unshift(newSku);
    return success(newSku, 'SKU创建成功');
  }),

  http.put('/api/admin/material-skus', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Partial<MaterialSKU> & { id?: string };
    const sku = skus.find((s) => s.id === body.id);
    if (sku) Object.assign(sku, body);
    return success(sku || body, 'SKU更新成功');
  }),

  http.get('/api/admin/disputes', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as DisputeCase['status'] | null;
    const category = url.searchParams.get('category') as DisputeCase['category'] | null;
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 10;

    let list = [...disputes];
    if (status) list = list.filter((d) => d.status === status);
    if (category) list = list.filter((d) => d.category === category);

    return success(paginate(list, page, pageSize));
  }),

  http.get('/api/admin/disputes/:id', async ({ params }) => {
    await delay(400);
    const { id } = params;
    const dispute = disputes.find((d) => d.id === id) || disputes[0];
    return success(dispute);
  }),

  http.post('/api/admin/disputes/:id/mediate', async ({ params, request }) => {
    await delay(500);
    const { id } = params;
    const body = (await request.json()) as { action: string; content: string };
    const dispute = disputes.find((d) => d.id === id);
    if (dispute && dispute.status !== 'arbitrating' && dispute.status !== 'closed') {
      dispute.status = 'mediating';
    }
    return success(
      {
        id,
        mediationLogId: `ml-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
      },
      '调解记录写入成功'
    );
  }),

  http.post('/api/admin/disputes/:id/arbitrate', async ({ params, request }) => {
    await delay(800);
    const { id } = params;
    const body = await request.json();
    const dispute = disputes.find((d) => d.id === id);
    if (dispute) dispute.status = 'closed';
    return success(
      {
        id,
        status: 'closed',
        arbitration: {
          expertIds: ['user-expert-001', 'user-expert-002'],
          ...(body as object),
          issuedAt: new Date().toISOString(),
        },
      },
      '专家仲裁完成'
    );
  }),
];

function fakerDatePast(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function fakerInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fakerName(): string {
  const surnames = ['张', '李', '王', '赵', '陈', '刘', '杨', '黄', '周', '吴'];
  const names = ['伟', '芳', '娜', '敏', '静', '强', '磊', '军', '洋', '勇'];
  return surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)];
}
