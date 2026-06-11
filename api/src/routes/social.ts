import { Router } from 'express';
import { getCircles, getPosts, createPost, likePost, getActivities, createActivity, signupActivity, getPostComments, addComment } from '../controllers/social.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/circles', authMiddleware(), getCircles);
router.get('/posts', authMiddleware(), getPosts);
router.post('/posts', authMiddleware(['owner', 'tenant']), createPost);
router.post('/posts/:id/like', authMiddleware(), likePost);
router.get('/posts/:postId/comments', authMiddleware(), getPostComments);
router.post('/posts/:postId/comments', authMiddleware(['owner', 'tenant']), addComment);
router.get('/activities', authMiddleware(), getActivities);
router.post('/activities', authMiddleware(['owner', 'tenant', 'property']), createActivity);
router.post('/activities/:activityId/signup', authMiddleware(['owner', 'tenant']), signupActivity);

export default router;
