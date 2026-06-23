import { Router } from 'express';
import { recognitionService } from '../services/RecognitionService';
import { z } from 'zod';

const router = Router();

const recognitionSchema = z.object({
  imageBase64: z.string(),
  cityId: z.string()
});

router.post('/image', async (req, res) => {
  const parseResult = recognitionSchema.safeParse(req.body);
  
  if (!parseResult.success) {
    res.status(400).json({ 
      success: false, 
      error: '参数错误', 
      details: parseResult.error.errors 
    });
    return;
  }

  try {
    const result = await recognitionService.recognizeImage(
      parseResult.data.imageBase64,
      parseResult.data.cityId
    );
    res.json(result);
  } catch (err) {
    console.error('Recognition error:', err);
    res.status(500).json({
      success: false,
      error: '识别服务异常'
    });
  }
});

export default router;
