const express = require('express');
const queryController = require('../controllers/queryController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/search', authenticate, queryController.searchDocuments);
router.get('/tracking/:id', authenticate, queryController.getDocumentTracking);
router.get('/archived', authenticate, queryController.getArchivedDocuments);
router.post('/:id/archive', authenticate, queryController.archiveDocument);

module.exports = router;
