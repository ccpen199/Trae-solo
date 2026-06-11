import { Router, Request, Response } from 'express';
import taskService from '../services/task.service.js';
import authMiddleware from '../middleware/auth.middleware.js';
import auditMiddleware from '../middleware/audit.middleware.js';
import { requireEmployer, requireProvider } from '../middleware/role.middleware.js';
import { TaskCreateRequest, TaskListQuery, BidCreateRequest } from '../../shared/types.js';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const result = await taskService.getTaskList(
    req.query as unknown as TaskListQuery,
    req.user!.id,
    req.user!.role
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  const result = await taskService.getTaskById(
    Number(req.params.id),
    req.user!.id,
    req.user!.role
  );
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});

router.post('/', authMiddleware, requireEmployer, auditMiddleware('create_task', 'task'), async (req: Request, res: Response) => {
  const result = await taskService.createTask(
    req.body as TaskCreateRequest,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

router.put('/:id', authMiddleware, requireEmployer, auditMiddleware('update_task', 'task'), async (req: Request, res: Response) => {
  const result = await taskService.updateTask(
    Number(req.params.id),
    req.body as Partial<TaskCreateRequest>,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.delete('/:id', authMiddleware, requireEmployer, auditMiddleware('delete_task', 'task'), async (req: Request, res: Response) => {
  const result = await taskService.deleteTask(
    Number(req.params.id),
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.post('/:id/publish', authMiddleware, requireEmployer, auditMiddleware('publish_task', 'task'), async (req: Request, res: Response) => {
  const result = await taskService.publishTask(
    Number(req.params.id),
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.post('/:id/bids', authMiddleware, requireProvider, auditMiddleware('create_bid', 'bid'), async (req: Request, res: Response) => {
  const result = await taskService.createBid(
    Number(req.params.id),
    req.body as BidCreateRequest,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

router.post('/:id/select', authMiddleware, requireEmployer, auditMiddleware('select_provider', 'task'), async (req: Request, res: Response) => {
  const { providerId, bidId } = req.body;
  const result = await taskService.selectProvider(
    Number(req.params.id),
    Number(providerId),
    Number(bidId),
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

export default router;
