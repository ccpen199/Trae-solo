const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { authMiddleware } = require('../middleware/auth');
const userController = require('../controllers/userController');
const noteController = require('../controllers/noteController');
const productController = require('../controllers/productController');
const searchController = require('../controllers/searchController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({ storage: storage });

router.post('/auth/send-code', userController.sendVerificationCode);
router.post('/auth/login-code', userController.loginWithCode);
router.post('/auth/login-password', userController.loginWithPassword);
router.post('/auth/third-party', userController.thirdPartyLogin);
router.post('/auth/register', userController.register);
router.get('/auth/me', authMiddleware, userController.getCurrentUser);
router.put('/auth/profile', authMiddleware, userController.updateUser);

router.post('/follow', authMiddleware, userController.followUser);
router.get('/user/:userId', (req, res, next) => {
  if (req.headers.authorization) {
    authMiddleware(req, res, () => userController.getUserProfile(req, res));
  } else {
    userController.getUserProfile(req, res);
  }
});

router.get('/notes', (req, res, next) => {
  if (req.headers.authorization) {
    authMiddleware(req, res, () => noteController.getNoteList(req, res));
  } else {
    noteController.getNoteList(req, res);
  }
});
router.post('/notes', authMiddleware, noteController.createNote);
router.get('/notes/:noteId', (req, res, next) => {
  if (req.headers.authorization) {
    authMiddleware(req, res, () => noteController.getNoteDetail(req, res));
  } else {
    noteController.getNoteDetail(req, res);
  }
});
router.post('/notes/:noteId/like', authMiddleware, noteController.likeNote);
router.post('/notes/:noteId/collect', authMiddleware, noteController.collectNote);

router.get('/notes/:noteId/comments', noteController.getComments);
router.post('/notes/:noteId/comments', authMiddleware, noteController.addComment);

router.get('/topics', noteController.getTopics);

router.get('/products', productController.getProductList);
router.get('/products/:productId', productController.getProductDetail);
router.get('/categories', productController.getCategories);

router.get('/cart', authMiddleware, productController.getCart);
router.post('/cart', authMiddleware, productController.addToCart);
router.put('/cart/:itemId', authMiddleware, productController.updateCartItem);
router.delete('/cart/:itemId', authMiddleware, productController.removeCartItem);

router.get('/orders', authMiddleware, productController.getOrders);
router.post('/orders', authMiddleware, productController.createOrder);
router.get('/orders/:orderId', authMiddleware, productController.getOrderDetail);

router.get('/search', (req, res, next) => {
  if (req.headers.authorization) {
    authMiddleware(req, res, () => searchController.search(req, res));
  } else {
    searchController.search(req, res);
  }
});
router.get('/search/history', (req, res, next) => {
  if (req.headers.authorization) {
    authMiddleware(req, res, () => searchController.getSearchHistory(req, res));
  } else {
    searchController.getSearchHistory(req, res);
  }
});
router.delete('/search/history', authMiddleware, searchController.clearSearchHistory);
router.get('/search/hot', searchController.getHotSearch);

router.post('/upload/image', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '请选择文件' });
  }
  res.json({
    success: true,
    data: {
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename
    }
  });
});

router.post('/upload/images', authMiddleware, upload.array('images', 9), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: '请选择文件' });
  }
  res.json({
    success: true,
    data: req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename
    }))
  });
});

module.exports = router;
