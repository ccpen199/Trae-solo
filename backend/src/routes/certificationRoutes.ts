import { Router } from 'express';
import multer from 'multer';
import { authenticateToken, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import {
  getTrades,
  submitCertification,
  getMyCertifications,
  getCertificationDetail,
  verifyCertification,
  uploadCertificateImage,
  getAllCertifications
} from '../controllers/certificationController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/trades', authenticateToken, getTrades);
router.post('/certifications', authenticateToken, requireRole('worker'), auditLog('submit_certification', 'trade_certifications'), submitCertification);
router.get('/certifications/my', authenticateToken, requireRole('worker'), getMyCertifications);
router.get('/certifications', authenticateToken, requireRole('admin'), getAllCertifications);
router.get('/certifications/:id', authenticateToken, getCertificationDetail);
router.put('/certifications/:id/verify', authenticateToken, requireRole('admin'), auditLog('verify_certification', 'trade_certifications'), verifyCertification);
router.post('/certifications/upload', authenticateToken, requireRole('worker'), upload.single('certificate'), uploadCertificateImage);

export default router;
