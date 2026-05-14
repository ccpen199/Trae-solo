const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const product = db.prepare(`
      SELECT * FROM products WHERE id = ?
    `).get(id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const rankingInfo = db.prepare(`
      SELECT ri.rank, r.id as ranking_id, r.name as ranking_name, r.type as ranking_type
      FROM ranking_items ri
      JOIN rankings r ON ri.ranking_id = r.id
      WHERE ri.product_id = ?
      ORDER BY ri.rank ASC
      LIMIT 1
    `).get(id);
    
    const comments = db.prepare(`
      SELECT * FROM comments 
      WHERE product_id = ? 
      ORDER BY is_hot DESC, created_at DESC 
      LIMIT 10
    `).all(id);
    
    const hotComments = comments.filter(c => c.is_hot === 1);
    
    const recentSales = Math.floor(product.sales_count * (Math.random() * 0.3 + 0.1));
    
    res.json({
      success: true,
      data: {
        ...product,
        ranking_info: rankingInfo,
        recent_sales: recentSales,
        hot_comments: hotComments,
        all_comments: comments
      }
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id/comments', (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const comments = db.prepare(`
      SELECT * FROM comments 
      WHERE product_id = ? 
      ORDER BY is_hot DESC, created_at DESC 
      LIMIT ? OFFSET ?
    `).all(id, parseInt(limit), parseInt(offset));
    
    const total = db.prepare(`
      SELECT COUNT(*) as count FROM comments WHERE product_id = ?
    `).get(id).count;
    
    res.json({
      success: true,
      data: {
        comments,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching product comments:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/:id/recommend', (req, res) => {
  try {
    const { id } = req.params;
    
    const updated = db.prepare(`
      UPDATE ranking_items 
      SET recommend_count = recommend_count + 1 
      WHERE product_id = ?
    `).run(id);
    
    if (updated.changes === 0) {
      return res.status(404).json({ success: false, error: 'Product not found in any ranking' });
    }
    
    res.json({ success: true, message: 'Recommendation recorded' });
  } catch (error) {
    console.error('Error recording recommendation:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
