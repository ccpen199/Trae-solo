const express = require('express');
const router = express.Router();
const reviewService = require('../services/reviewService');

router.post('/create', async (req, res) => {
  try {
    const { sessionId, userId, rating, comment, images } = req.body;
    
    if (!sessionId || !userId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, User ID and rating are required'
      });
    }
    
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const result = reviewService.createReview(sessionId, userId, ratingNum, comment, images);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = reviewService.getReviewBySession(sessionId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = reviewService.getUserReviews(userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/station/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    
    const result = reviewService.getStationReviews(stationId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
