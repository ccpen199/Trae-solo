import { Router } from 'express';
import { login, registerWorker, registerEnterprise, getCurrentUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();

router.post('/login', auditLog('user_login', 'users'), login);
router.post('/register/worker', auditLog('register_worker', 'users'), registerWorker);
router.post('/register/enterprise', auditLog('register_enterprise', 'users'), registerEnterprise);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
