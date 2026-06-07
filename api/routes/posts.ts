import { Router } from 'express';
import { PostController } from '../controllers/PostController.js';
import { authMiddleware, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();
const postController = new PostController();

router.get('/published', optionalAuth, postController.published.bind(postController));
router.get('/search', optionalAuth, postController.search.bind(postController));
router.get('/stats', authMiddleware, postController.stats.bind(postController));
router.get('/', authMiddleware, postController.list.bind(postController));
router.post('/', authMiddleware, requireRole('admin', 'property'), postController.create.bind(postController));
router.get('/:id', optionalAuth, postController.get.bind(postController));
router.put('/:id', authMiddleware, requireRole('admin', 'property'), postController.update.bind(postController));
router.delete('/:id', authMiddleware, requireRole('admin'), postController.delete.bind(postController));

export default router;
