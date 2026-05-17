const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const authController = require('../controllers/authController');
const bookController = require('../controllers/bookController');
const borrowController = require('../controllers/borrowController');
const readerController = require('../controllers/readerController');
const userController = require('../controllers/userController');

router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/third-party', authController.thirdPartyAuth);
router.get('/auth/me', auth, authController.getCurrentUser);

router.get('/books', optionalAuth, bookController.getBooks);
router.get('/books/:id', optionalAuth, bookController.getBookDetail);
router.get('/books/:bookId/chapters/:chapterId', auth, bookController.getChapterContent);
router.get('/categories', bookController.getCategories);
router.get('/recommend/books', bookController.getRecommendBooks);
router.get('/topics', bookController.getTopics);
router.get('/advertisements', bookController.getAdvertisements);

router.post('/search/history', auth, bookController.saveSearchHistory);
router.get('/search/history', auth, bookController.getSearchHistory);
router.delete('/search/history', auth, bookController.clearSearchHistory);

router.post('/borrow', auth, borrowController.borrowBook);
router.post('/return', auth, borrowController.returnBook);
router.get('/borrow/records', auth, borrowController.getBorrowRecords);
router.get('/borrow/check/:bookId', optionalAuth, borrowController.checkBorrowStatus);

router.post('/reader/progress', auth, readerController.saveReadingProgress);
router.get('/reader/progress/:bookId', auth, readerController.getReadingProgress);

router.post('/reader/bookmark', auth, readerController.addBookmark);
router.get('/reader/bookmarks/:bookId', auth, readerController.getBookmarks);
router.delete('/reader/bookmark/:id', auth, readerController.deleteBookmark);

router.post('/reader/note', auth, readerController.addNote);
router.get('/reader/notes/:bookId', auth, readerController.getNotes);
router.put('/reader/note/:id', auth, readerController.updateNote);
router.delete('/reader/note/:id', auth, readerController.deleteNote);

router.post('/wishlist', auth, userController.addToWishlist);
router.delete('/wishlist/:bookId', auth, userController.removeFromWishlist);
router.get('/wishlist', auth, userController.getWishlist);
router.get('/wishlist/check/:bookId', optionalAuth, userController.checkWishlist);

router.post('/cloud-library', auth, userController.addToCloudLibrary);
router.delete('/cloud-library/:bookId', auth, userController.removeFromCloudLibrary);
router.get('/cloud-library', auth, userController.getCloudLibrary);

router.get('/user/notes', auth, userController.getUserNotes);
router.get('/user/stats', auth, userController.getReadingStats);
router.get('/user/messages', auth, userController.getMessages);
router.put('/user/messages/:id/read', auth, userController.markMessageRead);
router.get('/user/tasks', auth, userController.getTasks);
router.put('/user/profile', auth, userController.updateProfile);

module.exports = router;
