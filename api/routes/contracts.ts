import { Router, type Request, type Response } from 'express';
import { successResponse, paginationResult, mockContracts } from '../mock/data.js';
import { generateId } from '../../src/utils/format.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { page = 1, pageSize = 20 } = req.query;
  const result = paginationResult(mockContracts, Number(page), Number(pageSize));
  res.json(successResponse(result));
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const contract = mockContracts.find(c => c.id === id) || mockContracts[0];
  res.json(successResponse(contract));
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { caseId, templateId } = req.body;
  const newContract = {
    id: `contract-${generateId()}`,
    caseId,
    caseTitle: '委托合同',
    templateId,
    content: `委托代理合同\n\n甲方（委托人）：\n乙方（受托人）：某律师事务所\n\n...`,
    clientSigned: false,
    lawyerSigned: false,
    createdAt: new Date().toISOString(),
  };
  res.json(successResponse(newContract, '合同已生成'));
});

router.post('/:id/sign', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body;
  const contract = mockContracts.find(c => c.id === id) || mockContracts[0];
  
  const updated = {
    ...contract,
    clientSigned: role === 'client' ? true : contract.clientSigned,
    lawyerSigned: role === 'lawyer' ? true : contract.lawyerSigned,
    signedAt: new Date().toISOString(),
  };
  
  res.json(successResponse(updated, `${role === 'client' ? '委托人' : '律师'}已签署`));
});

export default router;
