import { Router, Request, Response } from 'express';
import * as recommendService from '../services/recommendService.js';
import type { ApiResponse } from '../types/index.js';

const router = Router();

router.get('/personalized/:userId', (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    const recommendations = recommendService.getMultiObjectiveRecommendations(userId, Number(limit));
    
    const response: ApiResponse = {
      code: 0,
      data: recommendations
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取推荐失败'
    });
  }
});

router.get('/hot', (req: Request, res: Response): void => {
  try {
    const { limit = 10 } = req.query;
    
    const recommendations = recommendService.getHotMovies(Number(limit));
    
    const response: ApiResponse = {
      code: 0,
      data: recommendations
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取热门推荐失败'
    });
  }
});

router.get('/similar/:movieId', (req: Request, res: Response): void => {
  try {
    const { movieId } = req.params;
    const { limit = 6 } = req.query;
    
    const recommendations = recommendService.getSimilarMovies(movieId, Number(limit));
    
    const response: ApiResponse = {
      code: 0,
      data: recommendations
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取相似推荐失败'
    });
  }
});

router.get('/feed/:userId', (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    
    const result = recommendService.getPersonalizedFeed(userId, Number(page), Number(pageSize));
    
    const response: ApiResponse = {
      code: 0,
      data: result
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取个性化Feed失败'
    });
  }
});

export default router;
