import { Router, Request, Response } from 'express';
import {
  generateUploadUrlController,
  createVideoController,
  updateProgressController,
  getProgressController,
  getVideoController,
  updateVideoController,
  deleteVideoController,
  getPendingReviewsController,
  reviewVideoController,
  getUserVideosController,
  getHotVideosController,
} from '../controllers/videoController';
import { contextMiddleware } from '../middleware/context';
import { ApiResponse } from '../types';

const router = Router();

router.use(contextMiddleware);

const healthCheckRouter = Router();
healthCheckRouter.get('/', (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; timestamp: string; service: string }> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'video-service',
    },
    timestamp: new Date().toISOString(),
    requestId: req.context.requestId,
  };
  res.json(response);
});

router.use('/health', healthCheckRouter);

const uploadRouter = Router();
uploadRouter.post('/url', generateUploadUrlController);
uploadRouter.post('/create', createVideoController);
uploadRouter.post('/progress', updateProgressController);
uploadRouter.get('/progress/:videoId', getProgressController);

router.use('/upload', uploadRouter);

const videoRouter = Router();
videoRouter.get('/hot', getHotVideosController);
videoRouter.get('/my', getUserVideosController);
videoRouter.get('/pending-reviews', getPendingReviewsController);
videoRouter.post('/review', reviewVideoController);
videoRouter.get('/:videoId', getVideoController);
videoRouter.put('/:videoId', updateVideoController);
videoRouter.delete('/:videoId', deleteVideoController);

router.use('/videos', videoRouter);

export default router;
