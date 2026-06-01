import { Router } from 'express';
import * as videoController from '../controllers/videoController.js';

const router = Router();

router.get('/', videoController.getVideos);
router.get('/:id', videoController.getVideoDetail);
router.post('/:id/like', videoController.likeVideo);
router.post('/:id/share', videoController.shareVideo);
router.post('/:id/completion', videoController.updateCompletionRate);

export default router;
