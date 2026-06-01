const express = require('express');
const { getUserProfile, toggleFollow, getMyGuides, getMyFavorites, getMyFollowing } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/profile/:id', (req, res, next) => {
  if (req.headers.authorization) {
    authenticateToken(req, res, () => getUserProfile(req, res));
  } else {
    getUserProfile(req, res);
  }
});
router.post('/follow', authenticateToken, toggleFollow);
router.get('/my-guides', authenticateToken, getMyGuides);
router.get('/my-favorites', authenticateToken, getMyFavorites);
router.get('/my-following', authenticateToken, getMyFollowing);

module.exports = router;
