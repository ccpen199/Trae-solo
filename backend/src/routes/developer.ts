import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authMiddleware, (req: AuthRequest, res) => {
  if (req.user!.role !== 'developer') {
    res.status(403).json({ message: '权限不足' });
    return;
  }

  const developer = db.prepare('SELECT id FROM developers WHERE user_id = ?').get(req.user!.id) as any;
  if (!developer) {
    res.status(404).json({ message: '开发商信息不存在' });
    return;
  }

  const devId = developer.id;

  const totalProperties = db.prepare(
    'SELECT COUNT(*) as count FROM properties WHERE developer_id = ?'
  ).get(devId) as { count: number };

  const activeProperties = db.prepare(
    "SELECT COUNT(*) as count FROM properties WHERE developer_id = ? AND status = 'active'"
  ).get(devId) as { count: number };

  const totalViews = db.prepare(
    'SELECT COALESCE(SUM(view_count), 0) as total FROM properties WHERE developer_id = ?'
  ).get(devId) as { total: number };

  const totalFavorites = db.prepare(
    'SELECT COALESCE(SUM(favorite_count), 0) as total FROM properties WHERE developer_id = ?'
  ).get(devId) as { total: number };

  const channelStats = db.prepare(
    `SELECT cs.name, cs.code, COUNT(*) as count
     FROM channel_sources cs
     LEFT JOIN consultations c ON 1=1
     GROUP BY cs.id
     ORDER BY count DESC`
  ).all();

  const districtStats = db.prepare(
    `SELECT district, COUNT(*) as count, COALESCE(SUM(view_count), 0) as views
     FROM properties
     WHERE developer_id = ?
     GROUP BY district
     ORDER BY count DESC`
  ).all(devId);

  const conversionFunnel = [
    { step: '浏览房源', count: totalViews.total },
    { step: '收藏房源', count: totalFavorites.total },
    { step: '咨询沟通', count: Math.floor(totalFavorites.total * 0.3) },
    { step: '实地带看', count: Math.floor(totalFavorites.total * 0.15) },
    { step: '成交转化', count: Math.floor(totalFavorites.total * 0.05) },
  ];

  const topProperties = db.prepare(
    `SELECT id, title, view_count, favorite_count
     FROM properties
     WHERE developer_id = ?
     ORDER BY view_count DESC
     LIMIT 10`
  ).all(devId);

  const monthlyTrend = db.prepare(
    `SELECT 
       DATE(created_at, 'start of month') as month,
       COUNT(*) as new_count,
       SUM(view_count) as view_count
     FROM properties
     WHERE developer_id = ?
     GROUP BY month
     ORDER BY month DESC
     LIMIT 6`
  ).all(devId);

  res.json({
    stats: {
      totalProperties: totalProperties.count,
      activeProperties: activeProperties.count,
      totalViews: totalViews.total,
      totalFavorites: totalFavorites.total,
    },
    channelStats,
    districtStats,
    conversionFunnel,
    topProperties,
    monthlyTrend,
  });
});

router.get('/properties', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const developer = db.prepare('SELECT id FROM developers WHERE user_id = ?').get(req.user!.id) as any;

  let where = 'WHERE developer_id = ?';
  let params: any[] = [developer.id];

  if (status && status !== 'all') {
    where += ' AND status = ?';
    params.push(status);
  }

  const list = db.prepare(
    `SELECT * FROM properties ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset);

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM properties ${where}`
  ).get(...params) as { count: number };

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/heatmap', authMiddleware, (req: AuthRequest, res) => {
  const developer = db.prepare('SELECT id FROM developers WHERE user_id = ?').get(req.user!.id) as any;

  const data = db.prepare(
    `SELECT district, COUNT(*) as property_count, 
            COALESCE(SUM(view_count), 0) as view_count,
            COALESCE(SUM(favorite_count), 0) as favorite_count
     FROM properties
     WHERE developer_id = ?
     GROUP BY district
     ORDER BY view_count DESC`
  ).all(developer.id);

  res.json({ data });
});

export default router;
