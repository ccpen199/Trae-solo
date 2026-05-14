const express = require('express');
const questionController = require('../controllers/questionController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, questionController.getList);
router.get('/draft', authMiddleware, questionController.getDraft);
router.post('/draft', authMiddleware, questionController.saveDraft);
router.delete('/draft', authMiddleware, questionController.clearDraft);
router.get('/:id', optionalAuth, questionController.getById);
router.post('/', authMiddleware, questionController.create);
router.post('/:id/follow', authMiddleware, questionController.toggleFollow);
router.post('/:id/like', authMiddleware, questionController.like);

module.exports = router;
