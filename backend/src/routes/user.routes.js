const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { getProfile, updateProfile, getUserById, followUser, unfollowUser } = require('../controllers/user.controller');

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);
router.get('/:id', (req, res, next) => {
  if (req.headers.authorization) {
    authMiddleware(req, res, next);
  } else {
    next();
  }
}, getUserById);
router.post('/:id/follow', authMiddleware, followUser);
router.delete('/:id/follow', authMiddleware, unfollowUser);

module.exports = router;
