import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { order_id, order_type, reviewee_id, rating, content, photos } = req.body;

  if (!order_id || !order_type || !reviewee_id || !rating) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: '评分必须在1-5之间' });
  }

  const db = getDB();
  const reviewId = uuidv4();

  const existingReview = db.prepare(
    'SELECT id FROM reviews WHERE order_id = ? AND reviewer_id = ?'
  ).get(order_id, req.user!.id) as any;

  if (existingReview) {
    return res.status(400).json({ error: '您已对该订单评价过' });
  }

  db.prepare(`
    INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content, photos)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reviewId, order_id, order_type, req.user!.id, reviewee_id,
    rating, content || '', JSON.stringify(photos || [])
  );

  updateRating(db, reviewee_id);

  checkLowRating(db, order_id, order_type, rating, req.user!.id, reviewee_id);

  res.json({ success: true, review_id: reviewId });
});

router.get('/:order_id', (req: Request, res: Response) => {
  const db = getDB();
  const reviews = db.prepare(`
    SELECT r.*, u.username as reviewer_name, u.avatar as reviewer_avatar
    FROM reviews r
    LEFT JOIN users u ON r.reviewer_id = u.id
    WHERE r.order_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.order_id) as any[];

  const result = reviews.map(r => ({
    ...r,
    photos: JSON.parse(r.photos || '[]'),
  }));

  res.json({ reviews: result });
});

router.get('/user/:user_id', (req: Request, res: Response) => {
  const db = getDB();
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const reviews = db.prepare(`
    SELECT r.*, u.username as reviewer_name, u.avatar as reviewer_avatar
    FROM reviews r
    LEFT JOIN users u ON r.reviewer_id = u.id
    WHERE r.reviewee_id = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.user_id, Number(limit), offset) as any[];

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM reviews WHERE reviewee_id = ?'
  ).get(req.params.user_id) as any;

  const result = reviews.map(r => ({
    ...r,
    photos: JSON.parse(r.photos || '[]'),
  }));

  res.json({ reviews: result, total: total.count });
});

function updateRating(db: any, userId: string) {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
  if (!user) return;

  const avgRating = db.prepare(
    'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewee_id = ?'
  ).get(userId) as any;

  if (user.role === 'worker') {
    db.prepare('UPDATE worker_profiles SET rating = ? WHERE user_id = ?')
      .run(Number(avgRating.avg_rating.toFixed(1)), userId);
  } else if (user.role === 'driver') {
    db.prepare('UPDATE driver_profiles SET rating = ? WHERE user_id = ?')
      .run(Number(avgRating.avg_rating.toFixed(1)), userId);
  }
}

function checkLowRating(db: any, orderId: string, orderType: string, rating: number, reviewerId: string, revieweeId: string) {
  const rules = db.prepare("SELECT * FROM quality_rules WHERE rule_type = 'low_rating' AND enabled = 1").all() as any[];
  
  for (const rule of rules) {
    if (rating <= rule.threshold && rule.action === 'manual_review') {
      const disputeId = uuidv4();
      db.prepare(`
        INSERT INTO disputes (id, order_id, order_type, complainant_id, respondent_id, reason, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        disputeId, orderId, orderType, reviewerId, revieweeId,
        '低评价自动仲裁', `用户评分${rating}星，低于阈值${rule.threshold}，自动进入仲裁流程`,
        'auto_review'
      );
    }
  }
}

export default router;
