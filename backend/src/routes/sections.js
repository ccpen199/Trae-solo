const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');

router.get('/', sectionController.getSectionList);
router.get('/:id', sectionController.getSectionById);
router.post('/', sectionController.createSection);
router.put('/:id', sectionController.updateSection);
router.delete('/:id', sectionController.deleteSection);
router.post('/:id/preview', sectionController.previewSection);
router.post('/:id/publish', sectionController.publishSection);
router.post('/:id/refresh', sectionController.refreshSectionNews);

module.exports = router;
