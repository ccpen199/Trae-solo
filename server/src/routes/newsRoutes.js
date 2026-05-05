const express = require('express');
const newsController = require('../controllers/newsController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', newsController.getNews);
router.get('/recommended', newsController.getRecommendedNews);
router.get('/latest', newsController.getLatestNews);
router.get('/categories', newsController.getCategories);
router.get('/categories/all', newsController.getAllCategories);
router.get('/:id', newsController.getNewsById);

router.post('/', authenticate, requireAdmin, newsController.createNews);
router.put('/:id', authenticate, requireAdmin, newsController.updateNews);
router.delete('/:id', authenticate, requireAdmin, newsController.deleteNews);

module.exports = router;