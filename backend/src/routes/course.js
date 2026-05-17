const express = require('express');
const {
  getCategories,
  getCourses,
  getCourseDetail,
  enrollCourse,
  getMyCourses,
  createOrder,
  getDiscussions,
  createDiscussion,
  getDiscussionReplies,
  createReply,
  likeDiscussion
} = require('../controllers/course');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/', getCourses);
router.get('/my', authenticateToken, getMyCourses);
router.get('/:id', optionalAuth, getCourseDetail);
router.post('/enroll', authenticateToken, enrollCourse);
router.post('/order', authenticateToken, createOrder);

router.get('/:courseId/discussions', getDiscussions);
router.post('/discussions', authenticateToken, createDiscussion);
router.get('/discussions/:discussionId/replies', getDiscussionReplies);
router.post('/discussions/replies', authenticateToken, createReply);
router.post('/discussions/like', authenticateToken, likeDiscussion);

module.exports = router;
