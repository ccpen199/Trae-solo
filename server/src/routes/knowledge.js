const express = require('express');
const router = express.Router();
const ArchiveController = require('../controllers/ArchiveController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');

const archiveController = new ArchiveController();

router.post('/:questionId/ingest', 
  authenticateToken, 
  requireRole('editor', 'admin'), 
  (req, res) => archiveController.addToKnowledgeBase(req, res)
);

router.get('/search', optionalAuth, (req, res) => archiveController.searchKnowledgeBase(req, res));

router.get('/nodes/:nodeId', optionalAuth, (req, res) => archiveController.getKnowledgeNode(req, res));

router.get('/nodes/:nodeId/related', optionalAuth, (req, res) => archiveController.getRelatedKnowledge(req, res));

module.exports = router;
