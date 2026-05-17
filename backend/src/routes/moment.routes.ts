import express from 'express';
import { getMoments, createMoment, getMomentDetail, deleteMoment, likeMoment, addComment, getComments } from '../controllers/moment.controller';
import auth from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getMoments);
router.post('/', auth, createMoment);
router.get('/:id', auth, getMomentDetail);
router.delete('/:id', auth, deleteMoment);
router.post('/:id/like', auth, likeMoment);
router.get('/:id/comments', auth, getComments);
router.post('/:id/comments', auth, addComment);

export default router;
