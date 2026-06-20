import { Router } from 'express';
import { createAppeal, getAppeals, resolveAppeal } from '../controllers/appealController';

const router = Router();

router.get('/', getAppeals);
router.post('/', createAppeal);
router.post('/:id/resolve', resolveAppeal);

export default router;
