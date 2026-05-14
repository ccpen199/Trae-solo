import { Router } from 'express';
import authRouter from './auth';
import avatarRouter from './avatar';
import chatRouter from './chat';
import postsRouter from './posts';
import communitiesRouter from './communities';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LinkWorld API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRouter);
router.use('/avatar', avatarRouter);
router.use('/chat', chatRouter);
router.use('/posts', postsRouter);
router.use('/communities', communitiesRouter);

export default router;
