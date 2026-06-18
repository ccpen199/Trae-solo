import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import KnowledgeGraphEngine from '../engines/KnowledgeGraphEngine';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/search', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { q, category, limit, type } = req.query;

    if (!q) throw new AppError('缺少搜索关键词q', 400);

    const result = await KnowledgeGraphEngine.search(q as string, {
      citizenId: req.citizenId,
      category: category as string,
      limit: parseInt(limit as string || '10', 10),
      type: (type as any) || 'all'
    });

    res.json({
      code: 0,
      message: 'OK',
      data: {
        query: q,
        total: result.policies.length + result.qaPairs.length + result.graphNodes.length,
        ...result,
        _debug: { searchTime: `${result.searchTime}ms` }
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.post('/ai-answer', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { question, chatHistory } = req.body;

    if (!question) throw new AppError('请输入问题内容', 400);

    const result = await KnowledgeGraphEngine.aiAnswer(question, {
      citizenId: req.citizenId,
      chatHistory
    });

    res.json({
      code: 0,
      message: 'OK',
      data: result,
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/policies', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { category, department, limit } = req.query;

    const policies = KnowledgeGraphEngine.getPolicies({
      category: category as string,
      department: department as string,
      limit: parseInt(limit as string || '20', 10)
    });

    res.json({
      code: 0,
      message: 'OK',
      data: {
        total: policies.length,
        policies: policies.map(p => ({
          id: p.id,
          title: p.title,
          summary: p.summary,
          category: p.category,
          departmentName: p.departmentName,
          effectiveDate: p.effectiveDate,
          status: p.status,
          tags: p.tags.slice(0, 5)
        }))
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/policies/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await KnowledgeGraphEngine.getPolicyDetail(req.params.id);
    if (!result.policy) throw new AppError('政策不存在', 404);

    res.json({
      code: 0,
      message: 'OK',
      data: result,
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/graph/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const stats = KnowledgeGraphEngine.getGraphStats();
    res.json({
      code: 0,
      message: 'OK',
      data: stats,
      requestId: (req as any).requestId
    });
  } catch (err) { next(err); }
});

router.get('/hot-questions', async (req: Request, res: Response, next) => {
  try {
    const stats = KnowledgeGraphEngine.getGraphStats();
    res.json({
      code: 0,
      message: 'OK',
      data: {
        hotQuestions: stats.topHotQAs,
        trendingSearches: stats.searchStats.topSearches.map(([keyword, count]) => ({ keyword, count })),
        updatedAt: new Date().toISOString()
      },
      requestId: (req as any).requestId
    });
  } catch (err) { next(err); }
});

export default router;
