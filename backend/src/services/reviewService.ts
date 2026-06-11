import { getDb } from '../db/database';
import { Review } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

const positiveWords = ['好', '棒', '不错', '快', '方便', '满意', '推荐', '干净', '便宜', '优秀', '赞', '喜欢', '顺畅'];
const negativeWords = ['差', '慢', '坏', '贵', '不好', '失望', '垃圾', '故障', '排队', '远', '难找', '脏', '坏了'];

function analyzeSentiment(text: string): { sentiment: Review['sentiment']; score: number } {
  if (!text) return { sentiment: 'neutral', score: 0.5 };

  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of positiveWords) {
    const regex = new RegExp(word, 'g');
    const matches = text.match(regex);
    if (matches) positiveScore += matches.length;
  }

  for (const word of negativeWords) {
    const regex = new RegExp(word, 'g');
    const matches = text.match(regex);
    if (matches) negativeScore += matches.length;
  }

  const total = positiveScore + negativeScore;
  if (total === 0) return { sentiment: 'neutral', score: 0.5 };

  const score = positiveScore / total;
  let sentiment: Review['sentiment'] = 'neutral';
  if (score >= 0.6) sentiment = 'positive';
  else if (score <= 0.4) sentiment = 'negative';

  return { sentiment, score };
}

function containsSensitiveWords(text: string): boolean {
  const sensitiveWords = ['广告', '推销', '色情', '赌博', '暴力', '违法', '诈骗'];
  return sensitiveWords.some(word => text.includes(word));
}

export const reviewService = {
  createReview(userId: string, stationId: string, sessionId: string, rating: number, content?: string): Review {
    const db = getDb();
    const id = uuidv4();

    const { sentiment, score } = analyzeSentiment(content || '');
    const isApproved = content && containsSensitiveWords(content) ? 0 : 1;

    db.prepare(`
      INSERT INTO reviews (id, user_id, station_id, session_id, rating, content, sentiment, sentiment_score, is_approved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, stationId, sessionId, rating, content || null, sentiment, score, isApproved);

    if (isApproved) {
      this.updateStationRating(stationId);
    }

    return this.getReviewById(id)!;
  },

  getReviewById(id: string): Review | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as Review | undefined;
  },

  getReviewsByStation(stationId: string, approvedOnly: boolean = true): Review[] {
    const db = getDb();
    let query = 'SELECT * FROM reviews WHERE station_id = ?';
    if (approvedOnly) query += ' AND is_approved = 1';
    query += ' ORDER BY created_at DESC LIMIT 50';
    return db.prepare(query).all(stationId) as Review[];
  },

  getPendingReviews(): Review[] {
    const db = getDb();
    return db.prepare('SELECT * FROM reviews WHERE is_approved = 0 ORDER BY created_at DESC').all() as Review[];
  },

  approveReview(reviewId: string): Review {
    const db = getDb();
    const review = this.getReviewById(reviewId);
    db.prepare('UPDATE reviews SET is_approved = 1 WHERE id = ?').run(reviewId);
    if (review) {
      this.updateStationRating(review.station_id);
    }
    return this.getReviewById(reviewId)!;
  },

  rejectReview(reviewId: string): Review {
    const db = getDb();
    db.prepare('UPDATE reviews SET is_approved = 0 WHERE id = ?').run(reviewId);
    return this.getReviewById(reviewId)!;
  },

  updateStationRating(stationId: string) {
    const db = getDb();
    const result = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews WHERE station_id = ? AND is_approved = 1
    `).get(stationId) as { avg_rating: number; count: number };

    db.prepare(`
      UPDATE charging_stations SET rating = ?, review_count = ? WHERE id = ?
    `).run(result.avg_rating || 5.0, result.count || 0, stationId);
  },

  getSentimentStats(stationId?: string) {
    const db = getDb();
    let query = `
      SELECT
        sentiment,
        COUNT(*) as count,
        AVG(sentiment_score) as avg_score
      FROM reviews
      WHERE is_approved = 1
    `;
    const params: any[] = [];
    if (stationId) {
      query += ' AND station_id = ?';
      params.push(stationId);
    }
    query += ' GROUP BY sentiment';
    return db.prepare(query).all(...params);
  },

  getReviewTrend(days: number = 7) {
    const db = getDb();
    return db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count
      FROM reviews
      WHERE is_approved = 1 AND created_at >= DATE('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(days);
  },
};
