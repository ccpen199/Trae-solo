import { Router } from 'express';
import { getAppeals, createAppeal, resolveAppeal, reviewAppeal } from '../controllers/appealController';

const router = Router();

router.get('/', getAppeals);
router.post('/', createAppeal);
router.post('/:id/resolve', resolveAppeal);
router.post('/:id/review', reviewAppeal);

export default router;
