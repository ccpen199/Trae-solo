import { Router, type Request, type Response } from 'express';
import {
  getNewsArticles,
  getPublicOpinions,
} from '../db.js';
import type {
  ApiResponse,
  NewsArticle,
  PublicOpinion,
  HotspotCluster,
} from '../../shared/types.js';

const router = Router();

router.get('/content/articles', (req: Request, res: Response): void => {
  try {
    const { category, type, search, page, pageSize } = req.query;
    const result = getNewsArticles({
      category: category as string | undefined,
      type: type as string | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    const articles = result.list.map((article) => ({
      ...article,
      autoTags: generateAutoTags(article),
      aiScore: Math.random() * 0.5 + 0.5,
    }));
    const response: ApiResponse<{ list: typeof articles; total: number }> = {
      success: true,
      data: { list: articles, total: result.total },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch articles',
    };
    res.status(500).json(response);
  }
});

router.post('/content/tag', (req: Request, res: Response): void => {
  try {
    const { articleId } = req.body;
    if (!articleId) {
      const response: ApiResponse = {
        success: false,
        error: 'Article ID is required',
      };
      res.status(400).json(response);
      return;
    }
    const autoTags = [
      '盐城本地',
      '民生关注',
      '政策解读',
      '最新动态',
      '权威发布',
    ].slice(0, Math.floor(Math.random() * 3) + 2);

    const tagResult = {
      articleId,
      autoTags,
      category: ['policy', 'livelihood', 'culture', 'general'][
        Math.floor(Math.random() * 4)
      ] as NewsArticle['category'],
      sentimentScore: (Math.random() * 2 - 1).toFixed(2),
      processedAt: new Date().toISOString(),
    };
    const response: ApiResponse<typeof tagResult> = {
      success: true,
      data: tagResult,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process auto tagging',
    };
    res.status(500).json(response);
  }
});

router.get('/analytics/clusters', (req: Request, res: Response): void => {
  try {
    const clusters: HotspotCluster[] = [
      {
        id: 'cluster-1',
        title: '中考招生政策解读',
        articleCount: 28,
        trend: 'up',
        heat: 95.6,
        category: '教育',
      },
      {
        id: 'cluster-2',
        title: '黄海湿地候鸟迁徙',
        articleCount: 15,
        trend: 'stable',
        heat: 72.3,
        category: '生态',
      },
      {
        id: 'cluster-3',
        title: '公积金贷款政策调整',
        articleCount: 42,
        trend: 'up',
        heat: 88.9,
        category: '民生',
      },
      {
        id: 'cluster-4',
        title: '龙舟大赛端午文化',
        articleCount: 19,
        trend: 'down',
        heat: 65.2,
        category: '文化',
      },
      {
        id: 'cluster-5',
        title: '数字经济产业园发展',
        articleCount: 12,
        trend: 'up',
        heat: 58.7,
        category: '经济',
      },
      {
        id: 'cluster-6',
        title: '暴雨橙色预警防范',
        articleCount: 35,
        trend: 'up',
        heat: 91.4,
        category: '应急',
      },
    ];
    const response: ApiResponse<HotspotCluster[]> = {
      success: true,
      data: clusters,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch hotspot clusters',
    };
    res.status(500).json(response);
  }
});

router.get('/analytics/opinion', (req: Request, res: Response): void => {
  try {
    const opinions = getPublicOpinions();
    const enriched = opinions.map((op) => ({
      ...op,
      relatedArticles: [
        Math.random().toString(36).slice(2, 10),
        Math.random().toString(36).slice(2, 10),
      ],
      trend: generateTrendData(),
    }));
    const stats = {
      totalOpinions: enriched.length,
      positiveRatio: enriched.filter((o) => o.sentimentScore > 0.2).length / enriched.length,
      negativeRatio: enriched.filter((o) => o.sentimentScore < -0.2).length / enriched.length,
      neutralRatio: enriched.filter((o) => o.sentimentScore >= -0.2 && o.sentimentScore <= 0.2).length / enriched.length,
      highRiskCount: enriched.filter((o) => o.riskLevel === 'high' || o.riskLevel === 'critical').length,
    };
    const response: ApiResponse<{ list: PublicOpinion[]; stats: typeof stats }> = {
      success: true,
      data: { list: enriched, stats },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch opinion analytics',
    };
    res.status(500).json(response);
  }
});

function generateAutoTags(article: NewsArticle): string[] {
  const tags: string[] = [];
  const categoryMap: Record<string, string[]> = {
    policy: ['政策', '官方发布', '权威解读'],
    livelihood: ['民生', '便民服务', '生活指南'],
    culture: ['文化', '活动', '文旅'],
    general: ['综合', '本地资讯'],
  };
  if (categoryMap[article.category]) {
    tags.push(...categoryMap[article.category]);
  }
  const additionalTags = ['盐城', '新闻资讯'];
  tags.push(...additionalTags);
  return tags.slice(0, 5);
}

function generateTrendData() {
  const data = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      time: d.toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 500) + 100,
    });
  }
  return data;
}

export default router;
