import { Router } from 'express';
import { LotteryController } from '../controllers/LotteryController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const lotteryController = new LotteryController();

router.post('/qualify', (req, res) => lotteryController.checkQualification(req, res));
router.post('/draw', (req, res) => lotteryController.draw(req, res));
router.post('/task', (req, res) => lotteryController.completeTask(req, res));
router.get('/participation', (req, res) => lotteryController.getUserParticipation(req, res));
router.get('/records', authMiddleware(['admin', 'operator', 'risk']), (req, res) => lotteryController.getRecords(req, res));
router.get('/user/records', (req, res) => lotteryController.getUserRecords(req, res));

export default router;
