import { Router } from 'express';
import * as communityController from '../controllers/communityController.js';

const router = Router();

router.get('/', communityController.getPosts);
router.get('/:id', communityController.getPostDetail);
router.post('/', communityController.createPost);
router.post('/:id/like', communityController.likePost);
router.delete('/:id', communityController.deletePost);

export default router;
