const express = require('express');
const router = express.Router();
const ArchiveController = require('../controllers/ArchiveController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const archiveController = new ArchiveController();

router.get('/search', 
  authenticateToken, 
  requireRole('admin', 'moderator', 'auditor'), 
  (req, res) => archiveController.searchArchives(req, res)
);

router.get('/:archiveId', 
  authenticateToken, 
  requireRole('admin', 'moderator', 'auditor'), 
  (req, res) => archiveController.getArchiveRecord(req, res)
);

router.post('/:archiveId/verify', 
  authenticateToken, 
  requireRole('admin', 'auditor'), 
  (req, res) => archiveController.verifyArchiveIntegrity(req, res)
);

router.get('/stats', 
  authenticateToken, 
  requireRole('admin', 'auditor'), 
  (req, res) => archiveController.getArchiveStats(req, res)
);

router.post('/workflow/:questionId/archive', 
  authenticateToken, 
  requireRole('admin', 'editor'), 
  (req, res) => archiveController.processWorkflowArchive(req, res)
);

module.exports = router;
