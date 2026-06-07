const express = require('express');
const { applyJob, getMyApplications, getJobApplications, updateApplicationStatus, getFunnelStats } = require('../controllers/applicationController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/:jobId/apply', authenticateToken, requireRole(['jobseeker']), applyJob);
router.get('/my', authenticateToken, requireRole(['jobseeker']), getMyApplications);
router.get('/job/:jobId', authenticateToken, requireRole(['company']), getJobApplications);
router.put('/:id/status', authenticateToken, requireRole(['company']), updateApplicationStatus);
router.get('/funnel/stats', authenticateToken, requireRole(['company', 'admin']), getFunnelStats);

module.exports = router;
