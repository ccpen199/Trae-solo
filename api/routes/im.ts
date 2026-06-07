import { Router } from 'express';
import { 
  getSessions, 
  getMessages, 
  sendMessage, 
  createSession,
  getSopTemplates,
  getAdvisors
} from '../controllers/imController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.get('/sessions', authMiddleware, getSessions);
router.get('/messages/:sessionId', authMiddleware, getMessages);
router.post('/send', authMiddleware, sendMessage);
router.post('/session', authMiddleware, createSession);
router.get('/sop-templates', getSopTemplates);
router.get('/advisors', getAdvisors);

export default router;
