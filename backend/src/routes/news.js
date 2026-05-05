const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

router.get('/', newsController.getNewsList);
router.get('/:id', newsController.getNewsById);
router.post('/', newsController.createNews);
router.put('/:id', newsController.updateNews);
router.delete('/:id', newsController.deleteNews);
router.post('/:id/publish', newsController.publishNews);
router.post('/:id/add-to-sections', newsController.addToSections);
router.put('/:id/sort-order', newsController.updateSortOrder);

module.exports = router;
