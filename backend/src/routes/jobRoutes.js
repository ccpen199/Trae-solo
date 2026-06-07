const express = require('express');
const { createJob, updateJob, getCompanyJobs, getJobs, getJobDetail } = require('../controllers/jobController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getJobs);
router.get('/:id', getJobDetail);

router.post('/', authenticateToken, requireRole(['company']), createJob);
router.put('/:id', authenticateToken, requireRole(['company']), updateJob);
router.get('/company/my', authenticateToken, requireRole(['company']), getCompanyJobs);

module.exports = router;
