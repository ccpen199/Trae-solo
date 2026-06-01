import { Router } from 'express';
import { PrizeController } from '../controllers/PrizeController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prizeController = new PrizeController();

router.get('/user/winners', (req, res) => prizeController.getUserWinners(req, res));

router.get('/winners', authMiddleware(['admin', 'operator', 'finance']), (req, res) => prizeController.getWinnerList(req, res));
router.post('/winners/:id/distribute', authMiddleware(['admin', 'operator', 'finance']), (req, res) => prizeController.distributePrize(req, res));
router.post('/winners/:id/ship', authMiddleware(['admin', 'operator', 'finance']), (req, res) => prizeController.shipPrize(req, res));
router.post('/winners/:id/redeem', authMiddleware(['admin', 'operator', 'finance']), (req, res) => prizeController.redeemPrize(req, res));
router.post('/winners/:id/reissue', authMiddleware(['admin']), (req, res) => prizeController.reissuePrize(req, res));

router.get('/', authMiddleware(['admin', 'operator', 'finance']), (req, res) => prizeController.getPrizeList(req, res));
router.get('/all', authMiddleware(['admin', 'operator']), (req, res) => prizeController.getAllPrizes(req, res));
router.get('/:id', authMiddleware(['admin', 'operator', 'finance']), (req, res) => prizeController.getPrizeDetail(req, res));
router.post('/', authMiddleware(['admin', 'operator']), (req, res) => prizeController.createPrize(req, res));
router.put('/:id', authMiddleware(['admin', 'operator']), (req, res) => prizeController.updatePrize(req, res));
router.delete('/:id', authMiddleware(['admin']), (req, res) => prizeController.deletePrize(req, res));

export default router;
