import { Router, type Request, type Response } from 'express';
import { successResponse, paginationResult, mockCaseSources, mockUser } from '../mock/data.js';
import { generateId } from '../../src/utils/format.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { page = 1, pageSize = 20, keyword, cause, province, status } = req.query;
  
  let result = [...mockCaseSources];
  
  if (keyword) {
    result = result.filter(c => 
      c.title.includes(keyword as string) || 
      c.description.includes(keyword as string)
    );
  }
  
  if (cause) {
    result = result.filter(c => c.cause === cause);
  }
  
  if (province) {
    result = result.filter(c => c.province === province);
  }
  
  if (status) {
    result = result.filter(c => c.status === status);
  }
  
  const pageResult = paginationResult(result, Number(page), Number(pageSize));
  res.json(successResponse(pageResult));
});

router.get('/matched', async (req: Request, res: Response): Promise<void> => {
  const matched = mockCaseSources.filter(c => 
    c.tags.some(t => ['合同纠纷', '知识产权'].includes(t))
  );
  res.json(successResponse(matched));
});

router.get('/my-published', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse(mockCaseSources.slice(0, 2)));
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const caseSource = mockCaseSources.find(c => c.id === id) || mockCaseSources[0];
  res.json(successResponse(caseSource));
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const data = req.body;
  const newCase = {
    ...mockCaseSources[0],
    id: `cs-${generateId()}`,
    ...data,
    status: 'published' as const,
    bids: [],
    createdAt: new Date().toISOString(),
  };
  res.json(successResponse(newCase, '案源发布成功'));
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const data = req.body;
  const caseSource = mockCaseSources.find(c => c.id === id) || mockCaseSources[0];
  res.json(successResponse({ ...caseSource, ...data }, '案源已更新'));
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse(null, '案源已删除'));
});

router.get('/:id/bids', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const caseSource = mockCaseSources.find(c => c.id === id) || mockCaseSources[0];
  res.json(successResponse(caseSource.bids));
});

router.post('/bids', async (req: Request, res: Response): Promise<void> => {
  const data = req.body;
  const newBid = {
    id: `cb-${generateId()}`,
    ...data,
    lawyerId: mockUser.id,
    lawyerName: mockUser.name,
    lawyerAvatar: mockUser.avatar,
    lawyerFirm: mockUser.firmInfo?.firmName || '',
    lawyerCreditScore: mockUser.creditScore,
    submittedAt: new Date().toISOString(),
    messageCount: 0,
  };
  res.json(successResponse(newBid, '竞标成功'));
});

router.post('/:id/select-bid', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse(null, '律师已选定'));
});

router.get('/bids/my', async (req: Request, res: Response): Promise<void> => {
  const myBids = mockCaseSources.flatMap(c => c.bids).filter(b => b.lawyerId === 'lawyer-001');
  res.json(successResponse(myBids));
});

router.post('/:id/pay-deposit', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse({ paymentUrl: '/payment/mock' }, '支付链接已生成'));
});

router.post('/:id/release-payment', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse(null, '款项已释放'));
});

export default router;
