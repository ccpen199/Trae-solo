import express from 'express';
import { getDB } from '../db/index.js';

const router = express.Router();
const db = getDB();

router.get('/', (req, res) => {
  try {
    const coaches = db.prepare(`
      SELECT * FROM coaches 
      ORDER BY is_premium DESC, is_certified DESC, followers DESC
    `).all();
    
    res.json({ success: true, data: coaches });
  } catch (error) {
    console.error('Get coaches error:', error);
    res.status(500).json({ success: false, message: '获取教练列表失败' });
  }
});

router.get('/rehabilitation', (req, res) => {
  try {
    const coaches = db.prepare(`
      SELECT * FROM coaches 
      WHERE is_certified = 1
      ORDER BY is_premium DESC, followers DESC
    `).all();
    
    res.json({ success: true, data: coaches });
  } catch (error) {
    console.error('Get rehabilitation coaches error:', error);
    res.status(500).json({ success: false, message: '获取康复教练列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(id);
    
    if (!coach) {
      return res.status(404).json({ success: false, message: '教练不存在' });
    }
    
    res.json({ success: true, data: coach });
  } catch (error) {
    console.error('Get coach error:', error);
    res.status(500).json({ success: false, message: '获取教练详情失败' });
  }
});

router.post('/:id/follow', (req, res) => {
  try {
    const { id } = req.params;
    
    db.prepare('UPDATE coaches SET followers = followers + 1 WHERE id = ?').run(id);
    
    const coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(id);
    res.json({ success: true, data: coach });
  } catch (error) {
    console.error('Follow coach error:', error);
    res.status(500).json({ success: false, message: '关注教练失败' });
  }
});

export default router;
