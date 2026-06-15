import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createPost,
  getApprovedPosts,
  getPostDetail,
  getMyPosts,
  likePost,
} from '../controllers/postController.js';

const router = express.Router();

router.get('/', getApprovedPosts);
router.get('/my', authMiddleware, getMyPosts);
router.get('/:id', getPostDetail);
router.post('/', authMiddleware, createPost);
router.post('/:id/like', authMiddleware, likePost);

export default router;
