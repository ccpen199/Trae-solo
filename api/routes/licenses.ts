import { Router } from 'express';
import { LicenseController } from '../controllers/LicenseController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, LicenseController.getMyLicenses);
router.get('/:id', authenticateToken, LicenseController.getLicenseById);
router.post('/:id/qrcode', authenticateToken, LicenseController.generateQrCode);
router.get('/:id/usage-records', authenticateToken, LicenseController.getUsageRecords);

export default router;
