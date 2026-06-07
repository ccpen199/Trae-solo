import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import {
  createJobPosting,
  getJobPostings,
  getMyJobPostings,
  getJobDetail,
  updateJobPosting
} from '../controllers/jobController';

const router = Router();

router.get('/jobs', authenticateToken, getJobPostings);
router.get('/jobs/my', authenticateToken, requireRole('enterprise'), getMyJobPostings);
router.get('/jobs/:id', authenticateToken, getJobDetail);
router.post('/jobs', authenticateToken, requireRole('enterprise'), auditLog('create_job', 'job_postings'), createJobPosting);
router.put('/jobs/:id', authenticateToken, requireRole('enterprise'), auditLog('update_job', 'job_postings'), updateJobPosting);

export default router;
