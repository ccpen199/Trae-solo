const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, libraryController.getLibraries);
router.get('/id/:id', optionalAuth, libraryController.getLibraryById);
router.get('/slug/:slug', optionalAuth, libraryController.getLibraryBySlug);
router.get('/:id/books', optionalAuth, libraryController.getLibraryBooks);

router.post('/', protect, libraryController.createLibrary);
router.put('/:id', protect, libraryController.updateLibrary);
router.delete('/:id', protect, libraryController.deleteLibrary);

router.post('/:id/follow', protect, libraryController.followLibrary);
router.delete('/:id/follow', protect, libraryController.unfollowLibrary);

router.post('/:id/books', protect, libraryController.addBookToLibrary);
router.delete('/:id/books/:bookId', protect, libraryController.removeBookFromLibrary);

module.exports = router;
