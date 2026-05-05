import { Router } from 'express';
import * as newsController from '../controllers/news.controller';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/categories', newsController.getCategories);
router.get('/', newsController.getNewsList);
router.get('/:id', optionalAuth, newsController.getNewsDetail);

router.post(
  '/categories',
  authenticateToken,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  newsController.createCategory
);

router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  newsController.createNews
);

router.put(
  '/:id',
  authenticateToken,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  newsController.updateNews
);

router.post(
  '/:id/publish',
  authenticateToken,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  newsController.publishNews
);

router.post(
  '/:newsId/comments',
  authenticateToken,
  newsController.addComment
);

export default router;
