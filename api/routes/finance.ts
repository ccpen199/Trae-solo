import { Router, Request, Response } from 'express';
import financeService from '../services/finance.service.js';
import authMiddleware from '../middleware/auth.middleware.js';
import auditMiddleware from '../middleware/audit.middleware.js';
import { requireEmployer } from '../middleware/role.middleware.js';
import { EscrowRequest, ReleaseRequest, WithdrawRequest } from '../../shared/types.js';

const router = Router();

router.get('/wallet', authMiddleware, async (req: Request, res: Response) => {
  const result = await financeService.getWallet(req.user!.id);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.get('/transactions', authMiddleware, async (req: Request, res: Response) => {
  const result = await financeService.getTransactions(
    req.user!.id,
    {
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      type: req.query.type as string,
    }
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.get('/dashboard-stats', authMiddleware, async (req: Request, res: Response) => {
  const result = await financeService.getDashboardStats(
    req.user!.role,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.post('/escrow', authMiddleware, requireEmployer, auditMiddleware('escrow_funds', 'finance'), async (req: Request, res: Response) => {
  const result = await financeService.escrowFunds(
    req.body as EscrowRequest,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

router.post('/release', authMiddleware, requireEmployer, auditMiddleware('release_funds', 'finance'), async (req: Request, res: Response) => {
  const result = await financeService.releaseFunds(
    req.body as ReleaseRequest,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

router.post('/withdraw', authMiddleware, auditMiddleware('request_withdraw', 'finance'), async (req: Request, res: Response) => {
  const result = await financeService.requestWithdraw(
    req.body as WithdrawRequest,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

export default router;
