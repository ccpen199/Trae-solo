const express = require('express');
const { getGuides, getGuideById, createGuide, toggleFavorite, toggleLike } = require('../controllers/guideController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', getGuides);
router.get('/:id', (req, res, next) => {
  if (req.headers.authorization) {
    authenticateToken(req, res, () => getGuideById(req, res));
  } else {
    getGuideById(req, res);
  }
});
router.post('/', authenticateToken, createGuide);
router.post('/favorite', authenticateToken, toggleFavorite);
router.post('/like', authenticateToken, toggleLike);

module.exports = router;
