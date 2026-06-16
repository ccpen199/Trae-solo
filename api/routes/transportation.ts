import { Router } from 'express';
import * as transportationController from '../controllers/transportationController';

const router = Router();

router.post('/brt/qrcode', transportationController.generateBRTQRCode);
router.get('/brt/records', transportationController.getBRTTravelRecords);
router.get('/parking/nearby', transportationController.getNearbyParking);
router.get('/violations', transportationController.getTrafficViolations);
router.post('/violations/:id/pay', transportationController.payViolation);
router.get('/bus/:routeId/realtime', transportationController.getBusRealTime);

export default router;
