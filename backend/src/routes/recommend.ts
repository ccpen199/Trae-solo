import { Router } from 'express';
import { getAsync, allAsync, runAsync } from '../database/init';

const router = Router();

router.get('/demand/:demandId', async (req, res) => {
  try {
    const chains = await allAsync(`
      SELECT rc.*, 
             u1.name as from_user_name,
             u2.name as to_user_name
      FROM recommend_chains rc
      LEFT JOIN users u1 ON rc.from_user_id = u1.id
      LEFT JOIN users u2 ON rc.to_user_id = u2.id
      WHERE rc.demand_id = ?
      ORDER BY rc.created_at DESC
    `, [req.params.demandId]);
    
    res.json({ success: true, data: chains });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取推荐链失败' });
  }
});

router.post('/share', async (req, res) => {
  try {
    const { demandId, fromUserId, toUserId, chainType, chainDetail } = req.body;
    
    const existing = await getAsync(`
      SELECT id FROM recommend_chains 
      WHERE demand_id = ? AND from_user_id = ? AND to_user_id = ?
    `, [demandId, fromUserId, toUserId]);
    
    if (existing) {
      await runAsync(`
        UPDATE recommend_chains 
        SET share_count = share_count + 1 
        WHERE id = ?
      `, [existing.id]);
      res.json({ success: true, data: { id: existing.id, isNew: false } });
    } else {
      const result = await runAsync(`
        INSERT INTO recommend_chains (demand_id, from_user_id, to_user_id, chain_type, chain_detail, share_count, view_count)
        VALUES (?, ?, ?, ?, ?, 1, 0)
      `, [demandId, fromUserId, toUserId, chainType, chainDetail]);
      res.json({ success: true, data: { id: result.lastID, isNew: true } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '分享失败' });
  }
});

router.post('/:id/view', async (req, res) => {
  try {
    await runAsync(`
      UPDATE recommend_chains SET view_count = view_count + 1 WHERE id = ?
    `, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新失败' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await allAsync(`
      SELECT 
        chain_type,
        COUNT(*) as total_chains,
        SUM(share_count) as total_shares,
        SUM(view_count) as total_views
      FROM recommend_chains
      GROUP BY chain_type
      ORDER BY total_shares DESC
    `);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取统计失败' });
  }
});

export default router;
