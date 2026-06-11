import { Router, Request, Response } from 'express';
import disputeService from '../services/dispute.service.js';
import authMiddleware from '../middleware/auth.middleware.js';
import auditMiddleware from '../middleware/audit.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import { DisputeCreateRequest, DisputeResolveRequest } from '../../shared/types.js';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const result = await disputeService.getDisputeList(
    {
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      status: req.query.status as DisputeStatus | undefined,
    },
    req.user!.id,
    req.user!.role
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.post('/', authMiddleware, auditMiddleware('create_dispute', 'dispute'), async (req: Request, res: Response) => {
  const result = await disputeService.createDispute(
    req.body as DisputeCreateRequest,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

router.post('/:id/resolve', authMiddleware, requireAdmin, auditMiddleware('resolve_dispute', 'dispute'), async (req: Request, res: Response) => {
  const result = await disputeService.resolveDispute(
    Number(req.params.id),
    req.body as DisputeResolveRequest,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

export default router;
