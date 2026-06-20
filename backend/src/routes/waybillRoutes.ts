import { Router } from 'express';
import { createWaybill, signWaybill, getWaybillByOrderId } from '../controllers/waybillController';

const router = Router();

router.post('/', createWaybill);
router.post('/:id/sign', signWaybill);
router.get('/:orderId', getWaybillByOrderId);

export default router;
