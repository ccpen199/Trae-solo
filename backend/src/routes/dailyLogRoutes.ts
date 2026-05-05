import { Router } from 'express';
import {
  createDailyLog,
  getDailyLogs,
  getDailyLogById,
  updateDailyLog,
  deleteDailyLog,
  submitDailyLog,
  getDailyLogsByDateRange
} from '../controllers/dailyLogController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/', createDailyLog);
router.get('/', getDailyLogs);
router.get('/range/:type', getDailyLogsByDateRange);
router.get('/:id', getDailyLogById);
router.put('/:id', updateDailyLog);
router.delete('/:id', deleteDailyLog);
router.post('/:id/submit', submitDailyLog);

export default router;
