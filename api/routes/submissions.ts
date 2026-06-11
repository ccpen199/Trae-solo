import { Router, Request, Response } from 'express';
import submissionService from '../services/submission.service.js';
import authMiddleware from '../middleware/auth.middleware.js';
import auditMiddleware from '../middleware/audit.middleware.js';
import { requireEmployer, requireProvider } from '../middleware/role.middleware.js';
import { SubmissionCreateRequest, SubmissionReviewRequest } from '../../shared/types.js';

const router = Router();

router.get('/task/:taskId', authMiddleware, async (req: Request, res: Response) => {
  const result = await submissionService.getSubmissionsByTask(
    Number(req.params.taskId),
    req.user!.id,
    req.user!.role
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.post('/task/:taskId', authMiddleware, requireProvider, auditMiddleware('create_submission', 'submission'), async (req: Request, res: Response) => {
  const result = await submissionService.createSubmission(
    Number(req.params.taskId),
    req.body as SubmissionCreateRequest,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

router.post('/:id/review', authMiddleware, requireEmployer, auditMiddleware('review_submission', 'submission'), async (req: Request, res: Response) => {
  const result = await submissionService.reviewSubmission(
    Number(req.params.id),
    req.body as SubmissionReviewRequest,
    req.user!.id,
    req.user!.role
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.get('/task/:taskId/ip-records', authMiddleware, async (req: Request, res: Response) => {
  const result = await submissionService.getIPRecords(Number(req.params.taskId));
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

export default router;
