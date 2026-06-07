const express = require('express');
const { getCompanies, updateCompanyCredit, getPlatformStats, getCampusRecruitments, reviewCampusRecruitment, getPlatformFunnel, getAdminActions } = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/companies', getCompanies);
router.put('/companies/:id/credit', updateCompanyCredit);
router.get('/stats', getPlatformStats);
router.get('/funnel', getPlatformFunnel);
router.get('/actions', getAdminActions);
router.get('/campus', getCampusRecruitments);
router.put('/campus/:id/review', reviewCampusRecruitment);

module.exports = router;
