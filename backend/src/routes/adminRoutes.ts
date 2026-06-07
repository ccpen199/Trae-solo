import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import {
  getUsers,
  updateUserStatus,
  verifyEnterprise,
  getStatistics,
  getSocialSecurityWarnings,
  updateSocialSecurityDisposal,
  deleteBiometricData,
  getBiometricDeletionLogs,
  getAuditLogs
} from '../controllers/adminController';

const router = Router();

router.get('/users', authenticateToken, requireRole('admin'), getUsers);
router.put('/users/:id/status', authenticateToken, requireRole('admin'), auditLog('update_user_status', 'users'), updateUserStatus);
router.put('/enterprises/:id/verify', authenticateToken, requireRole('admin'), auditLog('verify_enterprise', 'users'), verifyEnterprise);
router.get('/statistics', authenticateToken, requireRole('admin'), getStatistics);
router.get('/social-security/warnings', authenticateToken, requireRole('admin'), getSocialSecurityWarnings);
router.put('/social-security/:id/disposal', authenticateToken, requireRole('admin'), auditLog('update_social_security_disposal', 'social_security_records'), updateSocialSecurityDisposal);
router.post('/biometric/delete', authenticateToken, requireRole('admin'), auditLog('delete_biometric', 'biometric_deletion_logs'), deleteBiometricData);
router.get('/biometric/logs', authenticateToken, requireRole('admin'), getBiometricDeletionLogs);
router.get('/audit-logs', authenticateToken, requireRole('admin'), getAuditLogs);

export default router;
