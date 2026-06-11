import { Router, type Request, type Response } from 'express';
import authService from '../services/auth.service.js';
import authMiddleware from '../middleware/auth.middleware.js';
import auditMiddleware from '../middleware/audit.middleware.js';
import { LoginRequest, RegisterRequest } from '../../shared/types.js';

const router = Router();

router.post('/register', auditMiddleware('register', 'user'), async (req: Request, res: Response) => {
  const result = await authService.register(req.body as RegisterRequest);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.post('/login', auditMiddleware('login', 'user'), async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginRequest);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const result = await authService.getCurrentUser(req.user!.id);
  if (!result.success) {
    return res.status(404).json(result);
  }
  res.json(result);
});

router.post('/logout', authMiddleware, auditMiddleware('logout', 'user'), async (req: Request, res: Response) => {
  const result = await authService.logout();
  res.json(result);
});

export default router;
