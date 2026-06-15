import { Router, type Request, type Response } from 'express';
import {
  MOCK_RPO_PROJECTS,
  generateTalentCandidates,
} from '../mock/mockData.js';
import {
  ApiResponse,
  RPOProject,
  TalentCandidate,
  BackgroundCheck,
} from '../../shared/types/index.js';

const router = Router();

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

function fail(error: string): ApiResponse {
  return { success: false, error };
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const status = req.query.status as string;
  const enterpriseId = req.query.enterpriseId as string;

  let projects = [...MOCK_RPO_PROJECTS];
  if (status) {
    projects = projects.filter(p => p.status === status);
  }
  if (enterpriseId) {
    projects = projects.filter(p => p.enterpriseId === enterpriseId);
  }

  projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = projects.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = projects.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: paginated,
    pagination: { page, pageSize, total, totalPages },
  });
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const data = req.body as Partial<RPOProject>;
  const newProject: RPOProject = {
    id: `rpo_new_${Date.now()}`,
    enterpriseId: data.enterpriseId || 'ent_0001',
    enterpriseName: data.enterpriseName || '企业',
    name: data.name || '新RPO项目',
    positions: data.positions || [],
    positionNames: data.positionNames || [],
    headcount: data.headcount || 20,
    filledCount: 0,
    consultant: data.consultant || '待分配',
    status: 'DEMAND_CONFIRM' as any,
    stages: data.stages || [{
      name: '需求确认',
      startDate: new Date().toISOString().slice(0, 10),
      status: '进行中',
      assignees: ['RPO顾问A'],
      notes: '项目启动',
    }],
    talentPoolIds: [],
    budget: data.budget || 50000,
    roi: 0,
    createdAt: new Date().toISOString(),
    deadline: data.deadline || new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  } as any;

  res.json(ok<RPOProject>(newProject, '项目创建成功'));
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params.id;
  const project = MOCK_RPO_PROJECTS.find(p => p.id === projectId);

  if (!project) {
    res.status(404).json(fail('RPO项目不存在'));
    return;
  }

  res.json(ok<RPOProject>(project));
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params.id;
  const project = MOCK_RPO_PROJECTS.find(p => p.id === projectId);

  if (!project) {
    res.status(404).json(fail('RPO项目不存在'));
    return;
  }

  const updateData = req.body as Partial<RPOProject>;
  const updated = { ...project, ...updateData };

  res.json(ok<RPOProject>(updated, '项目更新成功'));
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  res.json(ok(null, '项目删除成功'));
});

router.get('/:id/talent-pool', async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params.id;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const stage = req.query.stage as string;
  const tag = req.query.tag as string;

  const project = MOCK_RPO_PROJECTS.find(p => p.id === projectId);
  if (!project) {
    res.status(404).json(fail('RPO项目不存在'));
    return;
  }

  let candidates = generateTalentCandidates(projectId, 50);
  if (stage) {
    candidates = candidates.filter(c => c.stage === stage);
  }
  if (tag) {
    candidates = candidates.filter(c => c.tags.includes(tag));
  }

  const total = candidates.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = candidates.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: paginated,
    pagination: { page, pageSize, total, totalPages },
  });
});

router.post('/:id/talent-pool', async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params.id;
  const candidateData = req.body as Partial<TalentCandidate>;

  const newCandidate: TalentCandidate = {
    id: `talent_${Date.now()}`,
    rpoProjectId: projectId,
    resumeId: candidateData.resumeId || '',
    resumeName: candidateData.resumeName || '新候选人',
    jobSeekerId: (candidateData as any).jobSeekerId || `js_${Date.now()}`,
    tags: candidateData.tags || [],
    activityScore: 80,
    stage: '待联系',
    currentStage: null,
    status: '待推荐' as any,
    touchHistory: [],
    recommendReason: '推荐候选人',
    updatedAt: new Date().toISOString(),
    matchScore: candidateData.matchScore || 0,
  } as any;

  res.json(ok<TalentCandidate>(newCandidate, '候选人添加成功'));
});

router.put('/:id/talent-pool/:candidateId', async (req: Request, res: Response): Promise<void> => {
  const { candidateId } = req.params;
  const updateData = req.body as Partial<TalentCandidate>;

  res.json(ok<TalentCandidate>({
    id: candidateId,
    rpoProjectId: req.params.id,
    resumeId: '',
    resumeName: '候选人',
    jobSeekerId: `js_${Date.now()}`,
    tags: [],
    activityScore: 80,
    stage: updateData.stage || '待联系',
    currentStage: null,
    status: '待推荐' as any,
    touchHistory: [],
    recommendReason: '',
    updatedAt: new Date().toISOString(),
    ...updateData,
  } as any, '候选人更新成功'));
});

router.get('/:id/talent-pool/:candidateId/background-check', async (req: Request, res: Response): Promise<void> => {
  const { candidateId } = req.params;

  const check: BackgroundCheck = {
    id: `bc_${candidateId}`,
    candidateId,
    authorizationUrl: `https://docs.example.com/auth/${candidateId}`,
    reportUrl: `https://docs.example.com/report/${candidateId}`,
    resultLevel: '良好' as any,
    checkItems: [
      { project: '身份核实', result: '通过' as any, description: '与身份证信息一致' },
      { project: '学历核实', result: '通过' as any, description: '学信网可查' },
      { project: '工作履历', result: '通过' as any, description: '前雇主确认无误' },
      { project: '无犯罪记录', result: '通过' as any, description: '公安系统查询无记录' },
    ],
    operator: '背调专员',
    checkedAt: new Date().toISOString(),
  } as any;

  res.json(ok<BackgroundCheck>(check));
});

router.post('/:id/talent-pool/:candidateId/background-check', async (req: Request, res: Response): Promise<void> => {
  res.json(ok(null, '背调申请已提交'));
});

router.get('/:id/stats', async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params.id;
  const project = MOCK_RPO_PROJECTS.find(p => p.id === projectId);

  if (!project) {
    res.status(404).json(fail('RPO项目不存在'));
    return;
  }

  const candidates = generateTalentCandidates(projectId, 50);
  const stats = {
    totalCandidates: candidates.length,
    byStage: [
      { stage: '待联系', count: candidates.filter(c => c.stage === '待联系').length },
      { stage: '笔试', count: candidates.filter(c => c.stage === '笔试').length },
      { stage: 'AI初筛', count: candidates.filter(c => c.stage === 'AI初筛').length },
      { stage: '技术面', count: candidates.filter(c => c.stage === '技术面').length },
      { stage: 'HR终面', count: candidates.filter(c => c.stage === 'HR终面').length },
      { stage: '已入职', count: candidates.filter(c => c.stage === '已入职').length },
      { stage: '已淘汰', count: candidates.filter(c => c.stage === '已淘汰').length },
    ],
    totalBudget: project.budget,
    spentBudget: Math.round(project.budget * (project.filledCount / Math.max(project.headcount, 1))),
    averageCostPerHire: project.filledCount > 0 ? Math.round(project.budget / project.filledCount) : 0,
  };

  res.json(ok(stats));
});

export default router;
