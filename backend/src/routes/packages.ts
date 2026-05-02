import { Router } from 'express';
import {
  scanInStation,
  assignToArea,
  assignToCourier,
  generatePickupCode,
  startDelivery,
  signPackage,
  markException,
  getPackage,
  getPackageByTracking,
  searchPackages,
  getPackageTrails,
  getAreas,
  getCouriers
} from '../controllers/packageController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/areas', getAreas);
router.get('/couriers', getCouriers);

router.get('/search', searchPackages);
router.get('/tracking/:trackingNumber', getPackageByTracking);
router.get('/:id/trails', getPackageTrails);
router.get('/:id', getPackage);

router.post('/scan', requireRole(['courier', 'admin']), scanInStation);
router.post('/assign-area', requireRole(['admin']), assignToArea);
router.post('/assign-courier', requireRole(['admin']), assignToCourier);
router.post('/generate-pickup-code', requireRole(['courier', 'admin']), generatePickupCode);
router.post('/start-delivery', requireRole(['courier']), startDelivery);
router.post('/sign', signPackage);
router.post('/exception', requireRole(['courier', 'admin', 'customer_service']), markException);

export default router;
