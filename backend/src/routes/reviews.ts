import { Router, Request, Response } from 'express';
import db from '../db/init';

const router = Router();

const POSITIVE_WORDS = ['好', '棒', '推荐', '满意', '舒适', '优秀', '值得'];
const NEGATIVE_WORDS = ['差', '烂', '避坑', '坑', '不好', '问题', '投诉', '漏水', '噪音'];

function analyzeSentiment(content: string): string {
  let posCount = 0;
  let negCount = 0;
  for (const w of POSITIVE_WORDS) { if (content.includes(w)) posCount++; }
  for (const w of NEGATIVE_WORDS) { if (content.includes(w)) negCount++; }
  if (posCount > negCount) return '正面';
  if (negCount > posCount) return '负面';
  return '中性';
}

function extractKeywords(content: string): string[] {
  const allWords = [...POSITIVE_WORDS, ...NEGATIVE_WORDS];
  const keywords: string[] = [];
  for (const w of allWords) {
    if (content.includes(w)) keywords.push(w);
  }
  const areaWords = ['浦东', '黄浦', '静安', '徐汇', '虹口', '长宁', '闵行', '杨浦', '宝山'];
  for (const w of areaWords) {
    if (content.includes(w)) keywords.push(w);
  }
  const featureWords = ['学区', '地铁', '江景', '物业', '精装', '绿化', '配套', '停车', '隔音'];
  for (const w of featureWords) {
    if (content.includes(w)) keywords.push(w);
  }
  return [...new Set(keywords)];
}

router.get('/', (req: Request, res: Response) => {
  try {
    const { building_id, page = '1', pageSize = '10' } = req.query;
    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const offset = (pageNum - 1) * sizeNum;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (building_id) { where += ' AND r.building_id = ?'; params.push(Number(building_id)); }

    const total = (db.prepare(`SELECT COUNT(*) as cnt FROM reviews r ${where}`).get(...params) as any).cnt;
    const rows = db.prepare(`SELECT r.*, b.name as building_name FROM reviews r LEFT JOIN buildings b ON r.building_id = b.id ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`).all(...params, sizeNum, offset);

    let sentimentStats = null;
    if (building_id) {
      sentimentStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN sentiment='正面' THEN 1 ELSE 0 END) as positive,
          SUM(CASE WHEN sentiment='中性' THEN 1 ELSE 0 END) as neutral,
          SUM(CASE WHEN sentiment='负面' THEN 1 ELSE 0 END) as negative
        FROM reviews WHERE building_id = ?
      `).get(Number(building_id));
    }

    res.json({ code: 0, data: { list: rows, total, page: pageNum, pageSize: sizeNum, sentimentStats }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const r = req.body;
    const sentiment = analyzeSentiment(r.content || '');
    const keywords = extractKeywords(r.content || '');

    const result = db.prepare(`
      INSERT INTO reviews (building_id, reviewer_name, rating, content, sentiment, keywords)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(r.building_id, r.reviewer_name, r.rating, r.content, sentiment, JSON.stringify(keywords));

    res.json({ code: 0, data: { id: result.lastInsertRowid, sentiment, keywords }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/building/:id/stats', (req: Request, res: Response) => {
  try {
    const buildingId = Number(req.params.id);

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as avg_rating,
        SUM(CASE WHEN sentiment='正面' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN sentiment='中性' THEN 1 ELSE 0 END) as neutral_count,
        SUM(CASE WHEN sentiment='负面' THEN 1 ELSE 0 END) as negative_count
      FROM reviews WHERE building_id = ?
    `).get(buildingId) as any;

    const keywordRows = db.prepare(`
      SELECT keywords FROM reviews WHERE building_id = ? AND keywords IS NOT NULL
    `).all(buildingId) as any[];

    const keywordMap: Record<string, number> = {};
    for (const row of keywordRows) {
      try {
        const kws: string[] = JSON.parse(row.keywords);
        for (const kw of kws) {
          keywordMap[kw] = (keywordMap[kw] || 0) + 1;
        }
      } catch {}
    }

    const topKeywords = Object.entries(keywordMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    res.json({
      code: 0,
      data: {
        avg_rating: Math.round(stats.avg_rating * 10) / 10,
        total_reviews: stats.total_reviews,
        sentiment_distribution: {
          正面: stats.positive_count,
          中性: stats.neutral_count,
          负面: stats.negative_count
        },
        top_keywords: topKeywords
      },
      message: 'success'
    });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

export default router;
