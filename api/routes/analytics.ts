import { Router, type Request, type Response } from 'express';
import { propagationAnalysisService } from '../services/PropagationAnalysisService';
import { sentimentAnalysisService } from '../services/SentimentAnalysisService';
import type { ApiResponse } from '../../shared/types';

const router = Router();

const successResponse = <T>(data: T, message: string = 'success'): ApiResponse<T> => ({
  code: 200,
  message,
  data,
  timestamp: Date.now(),
});

const errorResponse = (message: string, code: number = 400): ApiResponse<null> => ({
  code,
  message,
  data: null,
  timestamp: Date.now(),
});

router.get('/propagation/path/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const result = await propagationAnalysisService.getPropagationPath(contentId);
    
    if (!result.tree && result.totalNodes === 0) {
      res.status(404).json(errorResponse('该内容暂无传播数据', 404));
      return;
    }
    
    res.json(successResponse(result));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/propagation/nodes/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const nodes = await propagationAnalysisService.getPropagationNodes(contentId);
    
    res.json(successResponse(nodes));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/propagation/platforms/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const stats = await propagationAnalysisService.getPlatformStats(contentId);
    
    res.json(successResponse(stats));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/propagation/levels/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const stats = await propagationAnalysisService.getLevelStats(contentId);
    
    res.json(successResponse(stats));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/propagation/influencers/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const { limit } = req.query;
    const influencers = await propagationAnalysisService.getTopInfluencers(
      contentId,
      limit ? parseInt(limit as string) : 10
    );
    
    res.json(successResponse(influencers));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/propagation/summary/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const summary = await propagationAnalysisService.getPropagationSummary(contentId);
    
    res.json(successResponse(summary));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/sentiment/analysis/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const analysis = await sentimentAnalysisService.getSentimentAnalysis(contentId);
    
    if (!analysis.latestAnalysis) {
      res.status(404).json(errorResponse('该内容暂无舆情数据', 404));
      return;
    }
    
    res.json(successResponse(analysis));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/sentiment/distribution/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const distribution = await sentimentAnalysisService.getEmotionDistribution(contentId);
    
    res.json(successResponse(distribution));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/sentiment/trend/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const { days } = req.query;
    const trend = await sentimentAnalysisService.getSentimentTrend(
      contentId,
      days ? parseInt(days as string) : 7
    );
    
    res.json(successResponse(trend));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/sentiment/hot-topics/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const { limit } = req.query;
    const hotTopics = await sentimentAnalysisService.getHotTopics(
      contentId,
      limit ? parseInt(limit as string) : 10
    );
    
    res.json(successResponse(hotTopics));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/sentiment/kols/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const { limit } = req.query;
    const kols = await sentimentAnalysisService.getKeyOpinionLeaders(
      contentId,
      limit ? parseInt(limit as string) : 10
    );
    
    res.json(successResponse(kols));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/sentiment/score/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const score = await sentimentAnalysisService.getOverallSentimentScore(contentId);
    
    res.json(successResponse(score));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

router.get('/sentiment/alert/:contentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;
    const alert = await sentimentAnalysisService.getSentimentAlert(contentId);
    
    res.json(successResponse(alert));
  } catch (error) {
    res.status(400).json(errorResponse((error as Error).message));
  }
});

export default router;
