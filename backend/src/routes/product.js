const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { optionalAuthMiddleware } = require('../middleware/auth');

router.get('/:id', optionalAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const isVip = req.user?.is_vip === 1;
  
  const product = db.prepare(`
    SELECT 
      id, name, description, price, vip_price,
      ${isVip ? 'vip_price as show_price' : 'price as show_price'},
      original_price, image, category_id, stock, sales, is_hot, is_new, 
      is_seckill, seckill_price, seckill_start_time, seckill_end_time, unit, spec
    FROM products 
    WHERE id = ?
  `).get(id);
  
  if (!product) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }
  
  const similarProducts = db.prepare(`
    SELECT 
      id, name, price, 
      ${isVip ? 'vip_price as show_price' : 'price as show_price'},
      image, stock, sales, unit, spec
    FROM products 
    WHERE category_id = ? AND id != ? AND stock > 0
    ORDER BY sales DESC 
    LIMIT 5
  `).all(product.category_id, id);
  
  res.json({
    code: 0,
    data: {
      product,
      similarProducts
    }
  });
});

module.exports = router;
