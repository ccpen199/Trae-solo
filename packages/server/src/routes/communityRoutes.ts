import { Router } from 'express';
import { communityController, createPostSchema, createCommentSchema } from '../controllers';
import { authMiddleware, validate } from '../middleware';

const router = Router();

router.get('/posts', communityController.getPostList);
router.get('/posts/:postId', communityController.getPostDetail);
router.get('/posts/:postId/comments', communityController.getComments);
router.post('/posts/:postId/like', communityController.likePost);
router.post('/comments/:commentId/like', communityController.likeComment);

router.use(authMiddleware);
router.post('/posts', validate(createPostSchema), communityController.createPost);
router.post('/posts/:postId/comments', validate(createCommentSchema), communityController.createComment);

export default router;
