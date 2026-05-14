const express = require('express');
const router = express.Router();
const { authenticate, success, error, query, queryOne, execute } = require('../utils');

router.get('/', authenticate, async (req, res) => {
  try {
    const items = await query('SELECT ci.*, p.title, p.price, p.images FROM cart_items ci LEFT JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ?', [req.userId]);
    res.json(success(items));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, quantity, specs } = req.body;
    if (!product_id) return res.json(error('参数错误'));
    
    const existing = await queryOne('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND specs = ?', [req.userId, product_id, specs || '']);
    if (existing) {
      await execute('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity || 1, existing.id]);
    } else {
      await execute('INSERT INTO cart_items (user_id, product_id, quantity, specs) VALUES (?, ?, ?, ?)', [req.userId, product_id, quantity || 1, specs || '']);
    }
    
    res.json(success(null, '添加成功'));
  } catch (e) {
    res.json(error('添加失败'));
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    await execute('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, id, req.userId]);
    res.json(success(null, '更新成功'));
  } catch (e) {
    res.json(error('更新失败'));
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, req.userId]);
    res.json(success(null, '删除成功'));
  } catch (e) {
    res.json(error('删除失败'));
  }
});

module.exports = router;