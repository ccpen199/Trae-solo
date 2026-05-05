import { Router } from 'express';
import { getProfile, updateProfile, getUserByQQ, searchUsers, getOnlineStatus } from '../controllers/userController';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/search', optionalAuth, searchUsers);
router.get('/qq/:qqNumber', optionalAuth, getUserByQQ);
router.get('/online/:userId', authMiddleware, getOnlineStatus);

export default router;
