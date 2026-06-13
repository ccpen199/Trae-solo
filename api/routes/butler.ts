import express, { type Request, type Response } from 'express';
import {
  userRequirements,
  matchReports,
  consultants,
  viewingAppointments,
  contractProgressList,
  properties,
} from '../data/mockData.js';
import type {
  UserRequirement,
  MatchReport,
  MatchResult,
  ViewingAppointment,
  ContractProgress,
} from '../types/index.js';

const router = express.Router();

router.post('/requirements', (req: Request, res: Response) => {
  const body = req.body as Partial<UserRequirement>;

  const newRequirement: UserRequirement = {
    id: `req-${Date.now()}`,
    userId: body.userId || 'user-001',
    userName: body.userName || '',
    phone: body.phone || '',
    budgetMin: body.budgetMin || 0,
    budgetMax: body.budgetMax || 9999999,
    areaMin: body.areaMin || 0,
    areaMax: body.areaMax || 500,
    bedrooms: body.bedrooms || '不限',
    districts: body.districts || [],
    propertyTypes: body.propertyTypes || [],
    purpose: body.purpose || '自住',
    schoolRequired: body.schoolRequired || false,
    subwayRequired: body.subwayRequired || false,
    decoration: body.decoration || '不限',
    deliveryDate: body.deliveryDate || '',
    additionalNotes: body.additionalNotes || '',
    createdAt: new Date().toLocaleString('zh-CN'),
    status: 'pending',
  };

  userRequirements.push(newRequirement);

  setTimeout(() => {
    generateMatchReport(newRequirement.id);
  }, 100);

  res.json({
    success: true,
    data: newRequirement,
    message: '需求提交成功，AI正在为您生成匹配报告...',
  });
});

function generateMatchReport(requirementId: string): MatchReport | null {
  const requirement = userRequirements.find((r) => r.id === requirementId);
  if (!requirement) return null;

  const matches: MatchResult[] = properties.map((p) => {
    let score = 0;
    const reasons: string[] = [];

    if (p.price >= requirement.budgetMin / 100 && p.price <= requirement.budgetMax / 80) {
      score += 25;
      reasons.push('价格在预算范围内');
    }

    if (requirement.districts.length > 0 && requirement.districts.includes(p.district)) {
      score += 20;
      reasons.push('位于目标区域');
    }

    if (requirement.schoolRequired && p.schoolDistrict) {
      score += 15;
      reasons.push('优质学区配套');
    }

    if (requirement.subwayRequired && p.subwayStations.length > 0) {
      score += 15;
      reasons.push('近地铁站');
    }

    const hasMatchingUnit = p.buildings.some((b) =>
      b.unitTypes.some((u) => {
        const areaMatch = u.area >= requirement.areaMin && u.area <= requirement.areaMax;
        const bedroomMatch =
          requirement.bedrooms === '不限' ||
          (requirement.bedrooms && parseInt(requirement.bedrooms) === u.bedrooms);
        return areaMatch && bedroomMatch;
      }),
    );
    if (hasMatchingUnit) {
      score += 20;
      reasons.push('户型面积匹配');
    }

    if (p.status === '在售') {
      score += 5;
      reasons.push('可直接认购');
    }

    if (requirement.purpose === '改善' && p.greenRate >= 35) {
      score += 5;
      reasons.push('高绿化率宜居');
    }

    if (requirement.purpose === '投资' && p.salesRate >= 60) {
      score += 5;
      reasons.push('去化率高投资价值好');
    }

    if (requirement.purpose === '学区' && p.schoolDistrict) {
      score += 10;
      reasons.push('学区资源优质');
    }

    return {
      id: `match-${p.id}`,
      requirementId,
      propertyId: p.id,
      property: p,
      matchScore: Math.min(score, 100),
      matchReasons: reasons,
      recommended: score >= 60,
    };
  });

  matches.sort((a, b) => b.matchScore - a.matchScore);

  const topMatches = matches.slice(0, 5);

  const aiSummary = `根据您${requirement.budgetMin / 10000}万-${requirement.budgetMax / 10000}万的预算，以及对${requirement.districts.join('、')}区域的偏好，我们为您筛选出了${topMatches.length}个高度匹配的楼盘。综合考虑了价格、地段、配套、户型等多方面因素。`;

  const aiAdvice = `建议您优先考虑${topMatches[0]?.property.name || ''}，该楼盘匹配度最高，${topMatches[0]?.matchReasons.slice(0, 2).join('，') || ''}。同时建议您关注${topMatches[1]?.property.name || ''}作为备选。建议尽快预约看房，把握当前市场优惠。`;

  const report: MatchReport = {
    id: `report-${Date.now()}`,
    requirementId,
    requirement,
    matches: topMatches,
    aiSummary,
    aiAdvice,
    createdAt: new Date().toLocaleString('zh-CN'),
    reviewed: false,
    reviewerName: '',
    reviewComments: '',
  };

  matchReports.push(report);

  requirement.status = 'matched';

  return report;
}

router.get('/requirements/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const requirement = userRequirements.find((r) => r.id === id);

  if (!requirement) {
    res.status(404).json({
      success: false,
      error: '需求不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: requirement,
  });
});

router.get('/requirements', (req: Request, res: Response) => {
  const { userId, status } = req.query;

  let filtered = [...userRequirements];

  if (userId) {
    filtered = filtered.filter((r) => r.userId === userId);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter((r) => r.status === status);
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: filtered,
  });
});

router.get('/match-reports/:requirementId', (req: Request, res: Response) => {
  const { requirementId } = req.params;
  const report = matchReports.find((r) => r.requirementId === requirementId);

  if (!report) {
    res.status(404).json({
      success: false,
      error: '匹配报告不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: report,
  });
});

router.get('/consultants', (req: Request, res: Response) => {
  const { status, specialty } = req.query;

  let filtered = [...consultants];

  if (status && status !== 'all') {
    filtered = filtered.filter((c) => c.status === status);
  }

  if (specialty) {
    filtered = filtered.filter((c) =>
      c.specialty.some((s) => s.includes(specialty as string)),
    );
  }

  res.json({
    success: true,
    data: filtered,
  });
});

router.get('/consultants/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const consultant = consultants.find((c) => c.id === id);

  if (!consultant) {
    res.status(404).json({
      success: false,
      error: '顾问不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: consultant,
  });
});

router.post('/match-reports/:id/review', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reviewerName, reviewComments, approved } = req.body;

  const reportIndex = matchReports.findIndex((r) => r.id === id);

  if (reportIndex === -1) {
    res.status(404).json({
      success: false,
      error: '匹配报告不存在',
    });
    return;
  }

  matchReports[reportIndex].reviewed = true;
  matchReports[reportIndex].reviewerName = reviewerName || '顾问';
  matchReports[reportIndex].reviewComments = reviewComments || '已审核通过';

  const requirement = userRequirements.find(
    (r) => r.id === matchReports[reportIndex].requirementId,
  );
  if (requirement) {
    requirement.status = 'reviewed';
  }

  res.json({
    success: true,
    data: matchReports[reportIndex],
    message: '审核完成',
  });
});

router.post('/viewing-appointments', (req: Request, res: Response) => {
  const body = req.body;

  const consultant = consultants.find((c) => c.id === body.consultantId);
  if (!consultant) {
    res.status(400).json({
      success: false,
      error: '顾问不存在',
    });
    return;
  }

  const newAppointment: ViewingAppointment = {
    id: `apt-${Date.now()}`,
    requirementId: body.requirementId || '',
    propertyIds: body.propertyIds || [],
    consultantId: body.consultantId,
    consultant,
    date: body.date,
    time: body.time,
    carService: body.carService || false,
    pickupAddress: body.pickupAddress || '',
    status: 'pending',
    notes: body.notes || '',
    createdAt: new Date().toLocaleString('zh-CN'),
  };

  viewingAppointments.push(newAppointment);

  const requirement = userRequirements.find((r) => r.id === body.requirementId);
  if (requirement) {
    requirement.status = 'appointment_made';
  }

  res.json({
    success: true,
    data: newAppointment,
    message: '预约提交成功，顾问将在30分钟内联系您确认',
  });
});

router.get('/viewing-appointments', (req: Request, res: Response) => {
  const { requirementId, status } = req.query;

  let filtered = [...viewingAppointments];

  if (requirementId) {
    filtered = filtered.filter((a) => a.requirementId === requirementId);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter((a) => a.status === status);
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: filtered,
  });
});

router.put('/viewing-appointments/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const appointmentIndex = viewingAppointments.findIndex((a) => a.id === id);

  if (appointmentIndex === -1) {
    res.status(404).json({
      success: false,
      error: '预约不存在',
    });
    return;
  }

  viewingAppointments[appointmentIndex].status = status;

  const requirement = userRequirements.find(
    (r) => r.id === viewingAppointments[appointmentIndex].requirementId,
  );
  if (requirement && status === 'completed') {
    requirement.status = 'viewing';
  }

  res.json({
    success: true,
    data: viewingAppointments[appointmentIndex],
  });
});

router.post('/contract-progress', (req: Request, res: Response) => {
  const body = req.body;
  const property = properties.find((p) => p.id === body.propertyId);

  const newProgress: ContractProgress = {
    id: `contract-${Date.now()}`,
    requirementId: body.requirementId,
    propertyId: body.propertyId,
    propertyName: property?.name || '',
    stages: [
      {
        name: '认购定金',
        status: 'completed',
        date: new Date().toLocaleString('zh-CN'),
        description: '已支付认购定金，房源已锁定',
      },
      {
        name: '资格核验',
        status: 'in_progress',
        date: '',
        description: '购房资格审核中',
      },
      {
        name: '网签备案',
        status: 'pending',
        date: '',
        description: '签订正式购房合同并备案',
      },
      {
        name: '贷款审批',
        status: 'pending',
        date: '',
        description: '银行贷款审批流程',
      },
      {
        name: '缴税过户',
        status: 'pending',
        date: '',
        description: '缴纳税费办理产权过户',
      },
      {
        name: '收房验房',
        status: 'pending',
        date: '',
        description: '房屋交付验收',
      },
    ],
    currentStage: 1,
    estimatedCompleteDate: '',
  };

  contractProgressList.push(newProgress);

  const requirement = userRequirements.find((r) => r.id === body.requirementId);
  if (requirement) {
    requirement.status = 'signed';
  }

  res.json({
    success: true,
    data: newProgress,
  });
});

router.get('/contract-progress/:requirementId', (req: Request, res: Response) => {
  const { requirementId } = req.params;
  const progress = contractProgressList.filter(
    (p) => p.requirementId === requirementId,
  );

  res.json({
    success: true,
    data: progress,
  });
});

router.put('/contract-progress/:id/stage', (req: Request, res: Response) => {
  const { id } = req.params;
  const { stageIndex } = req.body;

  const progressIndex = contractProgressList.findIndex((p) => p.id === id);

  if (progressIndex === -1) {
    res.status(404).json({
      success: false,
      error: '合同进度不存在',
    });
    return;
  }

  const progress = contractProgressList[progressIndex];

  for (let i = 0; i <= stageIndex; i++) {
    if (progress.stages[i]) {
      progress.stages[i].status = i === stageIndex ? 'in_progress' : 'completed';
      if (progress.stages[i].status === 'completed') {
        progress.stages[i].date = new Date().toLocaleString('zh-CN');
      }
    }
  }

  progress.currentStage = stageIndex;

  const requirement = userRequirements.find((r) => r.id === progress.requirementId);
  if (requirement && stageIndex >= progress.stages.length - 1) {
    requirement.status = 'completed';
  }

  res.json({
    success: true,
    data: progress,
  });
});

export default router;
