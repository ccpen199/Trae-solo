import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { authMiddleware } from '../middleware/auth';
import { RewardCoupon, RewardRecord } from '../types';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const db = getDb();
  const userId = req.user.userId;

  const totalPointsResult = db.prepare(`
    SELECT COALESCE(SUM(points), 0) as totalPoints
    FROM rewardRecords
    WHERE userId = ?
  `).get(userId) as { totalPoints: number };

  const availableCouponsResult = db.prepare(`
    SELECT COUNT(*) as count
    FROM rewardCoupons
    WHERE userId = ? AND isUsed = 0 AND expireAt > datetime('now')
  `).get(userId) as { count: number };

  const recentRecords = db.prepare(`
    SELECT * FROM rewardRecords
    WHERE userId = ?
    ORDER BY createdAt DESC
    LIMIT 10
  `).all(userId) as RewardRecord[];

  res.json({
    totalPoints: totalPointsResult.totalPoints,
    availableCoupons: availableCouponsResult.count,
    recentRecords,
  });
});

router.get('/coupons', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const { status } = req.query;
  const db = getDb();
  const userId = req.user.userId;

  let sql = `
    SELECT * FROM rewardCoupons
    WHERE userId = ?
  `;
  const params: any[] = [userId];

  if (status === 'available') {
    sql += ' AND isUsed = 0 AND expireAt > datetime(\'now\')';
  } else if (status === 'used') {
    sql += ' AND isUsed = 1';
  } else if (status === 'expired') {
    sql += ' AND isUsed = 0 AND expireAt <= datetime(\'now\')';
  }

  sql += ' ORDER BY expireAt ASC';
  const coupons = db.prepare(sql).all(...params) as RewardCoupon[];

  res.json(coupons);
});

router.post('/coupons/:id/use', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const db = getDb();
  const coupon = db.prepare('SELECT * FROM rewardCoupons WHERE id = ?').get(req.params.id) as RewardCoupon | undefined;

  if (!coupon) {
    res.status(404).json({ error: '优惠券不存在' });
    return;
  }

  if (coupon.userId !== req.user.userId) {
    res.status(403).json({ error: '无权操作此优惠券' });
    return;
  }

  if (coupon.isUsed) {
    res.status(400).json({ error: '优惠券已使用' });
    return;
  }

  if (new Date(coupon.expireAt) <= new Date()) {
    res.status(400).json({ error: '优惠券已过期' });
    return;
  }

  db.prepare('UPDATE rewardCoupons SET isUsed = 1 WHERE id = ?').run(req.params.id);

  const updated = db.prepare('SELECT * FROM rewardCoupons WHERE id = ?').get(req.params.id) as RewardCoupon;
  res.json(updated);
});

router.get('/streak', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const db = getDb();
  const userId = req.user.userId;

  const checkInRecords = db.prepare(`
    SELECT DISTINCT date(createdAt) as checkDate
    FROM rewardRecords
    WHERE userId = ? AND action = 'checkin'
    ORDER BY checkDate DESC
  `).all(userId) as { checkDate: string }[];

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < checkInRecords.length; i++) {
    const checkDate = new Date(checkInRecords[i].checkDate);
    checkDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0 && checkDate.getTime() === expectedDate.getTime() - 86400000) {
      streak++;
    } else {
      break;
    }
  }

  const todayCheckedIn = checkInRecords.length > 0 &&
    new Date(checkInRecords[0].checkDate).toDateString() === today.toDateString();

  res.json({
    streak,
    todayCheckedIn,
    totalDays: checkInRecords.length,
  });
});

export default router;
