/**
 * 交易流水API路由
 */
import { Router, type Request, type Response } from 'express';
import { getData } from '../data/mockData.js';

const router = Router();

/**
 * 获取交易列表
 * GET /api/transactions
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const type = req.query.type as string;
  const status = req.query.status as string;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const data = getData();
  let transactions = [...data.mockTransactions];

  if (type) {
    transactions = transactions.filter((t) => t.type === type);
  }

  if (status) {
    transactions = transactions.filter((t) => t.status === status);
  }

  const start = (page - 1) * pageSize;
  const list = transactions.slice(start, start + pageSize);

  res.json({
    success: true,
    data: {
      list,
      total: transactions.length,
      page,
      pageSize,
    },
  });
});

/**
 * 获取交易统计
 * GET /api/transactions/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  const transactions = data.mockTransactions;

  const stats = {
    totalCount: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    successCount: transactions.filter((t) => t.status === 'success').length,
    riskCount: transactions.filter((t) => t.status === 'risk_flagged').length,
    todayCount: transactions.filter((t) => {
      const now = new Date();
      const txDate = new Date(t.createdAt);
      return txDate.toDateString() === now.toDateString();
    }).length,
  };

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * 审核风险交易
 * PUT /api/transactions/:id/review
 */
router.put('/:id/review', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { action, remark } = req.body;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const data = getData();
  const transaction = data.mockTransactions.find((t) => t.id === id);

  if (!transaction) {
    res.status(404).json({
      success: false,
      message: '交易记录不存在',
    });
    return;
  }

  res.json({
    success: true,
    message: `交易${action === 'approve' ? '已通过' : '已拦截'}`,
    data: {
      ...transaction,
      status: action === 'approve' ? 'success' : 'failed',
    },
  });
});

export default router;
