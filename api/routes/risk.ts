import { Router } from 'express';
import { RiskController } from '../controllers/RiskController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const riskController = new RiskController();

router.get('/queue', authMiddleware(['admin', 'risk']), (req, res) => riskController.getQueue(req, res));
router.get('/pending-count', authMiddleware(['admin', 'risk']), (req, res) => riskController.getPendingCount(req, res));
router.get('/:id', authMiddleware(['admin', 'risk']), (req, res) => riskController.getDetail(req, res));
router.get('/:id/evidence', authMiddleware(['admin', 'risk']), (req, res) => riskController.getEvidence(req, res));
router.post('/:id/process', authMiddleware(['admin', 'risk']), (req, res) => riskController.process(req, res));
router.post('/reissue', authMiddleware(['admin']), (req, res) => riskController.manualReissue(req, res));

export default router;
