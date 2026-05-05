import { Router } from 'express';
import {
  getFiles,
  getFileById,
  createFile,
  deleteFile,
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getPostReplies,
  createReply,
  deleteReply,
} from '../controllers/dealer.controller';
import { authenticateToken, requireRole, requireDealerLevel } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('DEALER', 'ADMIN', 'SUPER_ADMIN'));

router.get('/files', getFiles);
router.get('/files/:id', getFileById);
router.post('/files', requireRole('ADMIN', 'SUPER_ADMIN'), createFile);
router.delete('/files/:id', requireRole('ADMIN', 'SUPER_ADMIN'), deleteFile);

router.get('/forum', getPosts);
router.get('/forum/:id', getPostById);
router.post('/forum', createPost);
router.put('/forum/:id', updatePost);
router.delete('/forum/:id', deletePost);

router.get('/forum/:id/replies', getPostReplies);
router.post('/forum/:id/replies', createReply);
router.delete('/forum/:id/replies/:replyId', deleteReply);

export default router;
