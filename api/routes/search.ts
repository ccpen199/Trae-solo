import { Router, type Request, type Response } from 'express';
import { successResponse, paginationResult, mockCompanies } from '../mock/data.js';

const router = Router();

router.post('/companies', async (req: Request, res: Response): Promise<void> => {
  const { page = 1, pageSize = 20, keyword, industry, province, riskLevel } = req.body;
  
  let result = [...mockCompanies];
  
  if (keyword) {
    result = result.filter(c => 
      c.name.includes(keyword) || 
      c.legalPerson.includes(keyword) ||
      c.creditCode.includes(keyword)
    );
  }
  
  if (industry) {
    result = result.filter(c => c.industry === industry);
  }
  
  if (province) {
    result = result.filter(c => c.province === province);
  }
  
  if (riskLevel && Array.isArray(riskLevel) && riskLevel.length > 0) {
    result = result.filter(c => riskLevel.includes(c.riskLevel));
  }
  
  const pageResult = paginationResult(result, Number(page), Number(pageSize));
  res.json(successResponse(pageResult));
});

router.get('/companies/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const company = mockCompanies.find(c => c.id === id) || mockCompanies[0];
  res.json(successResponse(company));
});

router.get('/companies/:id/lawsuits', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const company = mockCompanies.find(c => c.id === id) || mockCompanies[0];
  const { page = 1, pageSize = 20 } = req.query;
  const result = paginationResult(company.lawsuits, Number(page), Number(pageSize));
  res.json(successResponse(result));
});

router.get('/companies/:id/executions', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const company = mockCompanies.find(c => c.id === id) || mockCompanies[0];
  const { page = 1, pageSize = 20 } = req.query;
  const result = paginationResult(company.executions, Number(page), Number(pageSize));
  res.json(successResponse(result));
});

router.get('/companies/:id/shareholders', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const company = mockCompanies.find(c => c.id === id) || mockCompanies[0];
  res.json(successResponse(company.shareholders));
});

router.get('/companies/:id/risk', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const company = mockCompanies.find(c => c.id === id) || mockCompanies[0];
  res.json(successResponse({
    score: company.riskScore,
    level: company.riskLevel,
    details: [
      { dimension: '涉诉风险', score: 70, weight: 30 },
      { dimension: '执行风险', score: 65, weight: 25 },
      { dimension: '经营风险', score: 80, weight: 20 },
      { dimension: '舆情风险', score: 75, weight: 10 },
      { dimension: '合规风险', score: 85, weight: 10 },
      { dimension: '信用风险', score: 72, weight: 5 },
    ],
  }));
});

router.get('/companies/:id/relations', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const company = mockCompanies.find(c => c.id === id) || mockCompanies[0];
  
  const nodes: any[] = [
    { id: company.id, name: company.name, type: 'company', category: 0 },
  ];
  
  const edges: any[] = [];
  
  company.shareholders.forEach((sh, index) => {
    const shId = `sh-${index}`;
    nodes.push({ id: shId, name: sh.name, type: sh.type, category: sh.type === 'company' ? 0 : 1 });
    edges.push({ source: shId, target: company.id, value: sh.ratio });
  });
  
  company.lawsuits.forEach((l, index) => {
    const courtId = `court-${index}`;
    if (!nodes.find(n => n.id === courtId)) {
      nodes.push({ id: courtId, name: l.court, type: 'court', category: 2 });
    }
    edges.push({ source: company.id, target: courtId, value: 10 });
  });
  
  res.json(successResponse({ nodes, edges }));
});

router.post('/persons', async (req: Request, res: Response): Promise<void> => {
  const { keyword, page = 1, pageSize = 20 } = req.body;
  const persons = [
    { id: 'p-001', name: '李文华', idCard: '110101198001011234', relatedCompanies: 3, lawsuits: 2 },
    { id: 'p-002', name: '王建国', idCard: '310101197505055678', relatedCompanies: 2, lawsuits: 5 },
  ];
  const result = paginationResult(persons, Number(page), Number(pageSize));
  res.json(successResponse(result));
});

router.post('/cases', async (req: Request, res: Response): Promise<void> => {
  const { page = 1, pageSize = 20 } = req.body;
  const cases = mockCompanies.flatMap(c => c.lawsuits);
  const result = paginationResult(cases, Number(page), Number(pageSize));
  res.json(successResponse(result));
});

router.post('/export', async (req: Request, res: Response): Promise<void> => {
  const csvContent = '企业名称,统一社会信用代码,法定代表人,注册资本,成立日期,风险等级\r\n' +
    mockCompanies.map(c => `${c.name},${c.creditCode},${c.legalPerson},${c.registeredCapital},${c.establishDate},${c.riskLevel}`).join('\r\n');
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="search_results.csv"');
  res.send('\uFEFF' + csvContent);
});

export default router;
