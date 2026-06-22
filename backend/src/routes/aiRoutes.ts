import express from 'express';
import {
  analyzeImage,
  analyzeAndSaveDiary,
  generateInspirationGraph
} from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';
import upload from '../config/multer';

const router = express.Router();

router.post('/analyze-image', protect, upload.single('image'), analyzeImage);

router.post('/analyze-diary/:diaryId', protect, analyzeAndSaveDiary);

router.get('/inspiration-graph', generateInspirationGraph);

export default router;
