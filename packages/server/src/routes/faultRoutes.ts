import { Router } from 'express';
import { faultController } from '../controllers';
import { authMiddleware } from '../middleware';

const router = Router();

router.get('/', faultController.getFaultList);
router.get('/:faultId', faultController.getFaultDetail);

router.use(authMiddleware);
router.post('/report', faultController.reportFault);
router.post('/:faultId/handle', faultController.handleFault);

export default router;
