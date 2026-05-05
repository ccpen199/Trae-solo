const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, bookController.getBooks);
router.get('/id/:id', optionalAuth, bookController.getBookById);
router.get('/slug/:slug', optionalAuth, bookController.getBookBySlug);
router.get('/:id/channels', optionalAuth, bookController.getBookChannels);
router.get('/:id/libraries', optionalAuth, bookController.getBookLibraries);

router.post('/', protect, bookController.createBook);
router.put('/:id', protect, bookController.updateBook);
router.delete('/:id', protect, bookController.deleteBook);

router.post('/:id/favorite', protect, bookController.toggleFavorite);

module.exports = router;
