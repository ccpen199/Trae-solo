const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const friendController = require('../controllers/friendController');
const postController = require('../controllers/postController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/auth/send-code', authController.sendVerificationCode);
router.post('/auth/login/phone', authController.loginWithPhone);
router.post('/auth/login/password', authController.loginWithPassword);
router.post('/auth/wechat', authController.wechatLogin);
router.post('/auth/set-password', authController.setPassword);
router.get('/auth/me', authMiddleware, authController.getCurrentUser);

router.put('/user/profile', authMiddleware, userController.updateProfile);
router.post('/user/avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar);
router.get('/user/matches', userController.getRandomMatches);
router.get('/user/:userId', userController.getUserProfile);
router.post('/user/question', authMiddleware, userController.setQuestion);

router.post('/friend/request', authMiddleware, friendController.sendFriendRequest);
router.get('/friend/requests', authMiddleware, friendController.getFriendRequests);
router.post('/friend/handle', authMiddleware, friendController.handleFriendRequest);
router.get('/friend/list', authMiddleware, friendController.getFriends);

router.post('/post', authMiddleware, upload.fields([{ name: 'images', maxCount: 9 }, { name: 'video', maxCount: 1 }]), postController.createPost);
router.get('/posts', postController.getPosts);

router.get('/search/users', postController.searchUsers);
router.get('/users/latest', postController.getLatestUsers);

module.exports = router;
