const express = require('express');
const documentController = require('../controllers/documentController');
const { authenticate, checkDocumentAccess } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, documentController.createDocument);
router.get('/my', authenticate, documentController.getMyDocuments);
router.get('/:id', authenticate, checkDocumentAccess, documentController.getDocumentDetail);
router.put('/:id', authenticate, documentController.updateDocument);
router.post('/:id/submit', authenticate, documentController.submitDocument);

module.exports = router;
