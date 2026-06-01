const express = require('express');
const { getTravelBars, getTravelBarById, createTravelBar, toggleLike } = require('../controllers/travelBarController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', getTravelBars);
router.get('/:id', (req, res, next) => {
  if (req.headers.authorization) {
    authenticateToken(req, res, () => getTravelBarById(req, res));
  } else {
    getTravelBarById(req, res);
  }
});
router.post('/', authenticateToken, createTravelBar);
router.post('/like', authenticateToken, toggleLike);

module.exports = router;
