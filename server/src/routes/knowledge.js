const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');

router.get('/categories', knowledgeController.getCategories);
router.get('/recommended', knowledgeController.getRecommendedKnowledge);
router.get('/hot', knowledgeController.getHotKnowledge);
router.get('/search', knowledgeController.searchKnowledge);
router.get('/:id', knowledgeController.getKnowledgeDetail);
router.get('/', knowledgeController.getKnowledgeList);

module.exports = router;
