const express = require('express');
const router = express.Router();
const { db } = require('../database');

const MAX_SEARCH_HISTORY = parseInt(process.env.MAX_SEARCH_HISTORY || '10');

router.get('/', (req, res) => {
  try {
    const { q, user_id = 'anonymous' } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }
    
    const keyword = q.trim().toLowerCase();
    
    const products = db.prepare(`
      SELECT p.*,
             (SELECT ri.rank FROM ranking_items ri WHERE ri.product_id = p.id LIMIT 1) as rank,
             (SELECT r.name FROM rankings r JOIN ranking_items ri ON r.id = ri.ranking_id WHERE ri.product_id = p.id LIMIT 1) as ranking_name
      FROM products p
      WHERE LOWER(p.title) LIKE ?
      ORDER BY p.gmv DESC
      LIMIT 50
    `).all(`%${keyword}%`);
    
    const existing = db.prepare(`
      SELECT id FROM search_history WHERE keyword = ? AND user_id = ?
    `).get(keyword, user_id);
    
    if (existing) {
      db.prepare(`
        UPDATE search_history SET created_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(existing.id);
    } else {
      db.prepare(`
        INSERT INTO search_history (keyword, user_id) VALUES (?, ?)
      `).run(keyword, user_id);
      
      const count = db.prepare(`
        SELECT COUNT(*) as count FROM search_history WHERE user_id = ?
      `).get(user_id).count;
      
      if (count > MAX_SEARCH_HISTORY) {
        db.prepare(`
          DELETE FROM search_history 
          WHERE id IN (
            SELECT id FROM search_history 
            WHERE user_id = ? 
            ORDER BY created_at ASC 
            LIMIT ?
          )
        `).run(user_id, count - MAX_SEARCH_HISTORY);
      }
    }
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/history', (req, res) => {
  try {
    const { user_id = 'anonymous' } = req.query;
    
    const history = db.prepare(`
      SELECT keyword, created_at 
      FROM search_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(user_id);
    
    res.json({ success: true, data: history.map(h => h.keyword) });
  } catch (error) {
    console.error('Error fetching search history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/history', (req, res) => {
  try {
    const { user_id = 'anonymous' } = req.body;
    
    db.prepare(`
      DELETE FROM search_history WHERE user_id = ?
    `).run(user_id);
    
    res.json({ success: true, message: 'Search history cleared' });
  } catch (error) {
    console.error('Error clearing search history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
