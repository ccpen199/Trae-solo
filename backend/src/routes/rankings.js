const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  try {
    const { type } = req.query;
    
    let query = `
      SELECT r.*, 
             COUNT(ri.id) as item_count
      FROM rankings r
      LEFT JOIN ranking_items ri ON r.id = ri.ranking_id
      GROUP BY r.id
    `;
    
    let params = [];
    if (type) {
      query += ' WHERE r.type = ?';
      params.push(type);
    }
    
    const rankings = db.prepare(query).all(...params);
    res.json({ success: true, data: rankings });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { sort_by = 'rank' } = req.query;
    
    const ranking = db.prepare(`
      SELECT * FROM rankings WHERE id = ?
    `).get(id);
    
    if (!ranking) {
      return res.status(404).json({ success: false, error: 'Ranking not found' });
    }
    
    let sortQuery = 'ri.rank ASC';
    if (sort_by === 'gmv') {
      sortQuery = 'p.gmv DESC';
    } else if (sort_by === 'sales') {
      sortQuery = 'p.sales_count DESC';
    }
    
    const items = db.prepare(`
      SELECT ri.*, 
             p.title, 
             p.image, 
             p.price, 
             p.gmv, 
             p.sales_count,
             p.is_live,
             r.name as ranking_name,
             r.type as ranking_type
      FROM ranking_items ri
      JOIN products p ON ri.product_id = p.id
      JOIN rankings r ON ri.ranking_id = r.id
      WHERE ri.ranking_id = ?
      ORDER BY ${sortQuery}
    `).all(id);
    
    const formattedItems = items.map(item => ({
      ...item,
      tags: item.tags ? item.tags.split(',') : []
    }));
    
    res.json({
      success: true,
      data: {
        ranking,
        items: formattedItems
      }
    });
  } catch (error) {
    console.error('Error fetching ranking details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    
    const ranking = db.prepare(`
      SELECT * FROM rankings WHERE type = ?
    `).get(type);
    
    if (!ranking) {
      return res.status(404).json({ success: false, error: 'Ranking not found' });
    }
    
    const items = db.prepare(`
      SELECT ri.*, 
             p.title, 
             p.image, 
             p.price, 
             p.gmv, 
             p.sales_count,
             p.is_live
      FROM ranking_items ri
      JOIN products p ON ri.product_id = p.id
      WHERE ri.ranking_id = ?
      ORDER BY ri.rank ASC
    `).all(ranking.id);
    
    const formattedItems = items.map(item => ({
      ...item,
      tags: item.tags ? item.tags.split(',') : []
    }));
    
    res.json({
      success: true,
      data: {
        ranking,
        items: formattedItems
      }
    });
  } catch (error) {
    console.error('Error fetching ranking by type:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
