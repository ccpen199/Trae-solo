import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();
const authController = new AuthController();

router.post('/login', auditLog('login', 'auth'), (req, res) => authController.login(req, res));
router.post('/register', auditLog('register', 'auth'), (req, res) => authController.register(req, res));
router.get('/me', authenticateToken, (req, res) => authController.getCurrentUser(req, res));
router.get('/users', authenticateToken, requireRole(['admin']), (req, res) => authController.getAllUsers(req, res));

export default router;
