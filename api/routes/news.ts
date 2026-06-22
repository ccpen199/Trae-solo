import { Router, type Request, type Response } from 'express';
import {
  getNewsArticles,
  getNewsArticleById,
  incrementNewsViews,
  likeNewsArticle,
} from '../db.js';
import type { ApiResponse, NewsArticle } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const { category, type, search, page, pageSize } = req.query;
    const result = getNewsArticles({
      category: category as string | undefined,
      type: type as string | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    const response: ApiResponse<{ list: NewsArticle[]; total: number }> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch news articles',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    incrementNewsViews(id);
    const article = getNewsArticleById(id);
    if (!article) {
      const response: ApiResponse = {
        success: false,
        error: 'News article not found',
      };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<NewsArticle> = {
      success: true,
      data: article,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch news article',
    };
    res.status(500).json(response);
  }
});

router.post('/:id/like', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const article = getNewsArticleById(id);
    if (!article) {
      const response: ApiResponse = {
        success: false,
        error: 'News article not found',
      };
      res.status(404).json(response);
      return;
    }
    const likes = likeNewsArticle(id);
    const response: ApiResponse<{ likes: number }> = {
      success: true,
      data: { likes },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to like news article',
    };
    res.status(500).json(response);
  }
});

export default router;
