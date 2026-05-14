const express = require('express');
const { db, saveDB, generateId } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const items = db.carts.filter(c => c.user_id === userId).map(c => {
    const product = db.products.find(p => p.id === c.product_id);
    return { ...c, name: product?.name, price: product?.price, image: product?.image, stock: product?.stock };
  });
  res.json(items);
});

router.post('/', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { product_id, quantity = 1 } = req.body;
  const existing = db.carts.find(c => c.user_id === userId && c.product_id === product_id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    db.carts.push({
      id: generateId('carts'),
      user_id: userId,
      product_id,
      quantity,
      created_at: new Date().toISOString()
    });
  }
  saveDB();
  res.json({ message: '已添加到购物车' });
});

router.put('/:id', authMiddleware, (req, res) => {
  const cartItem = db.carts.find(c => c.id === parseInt(req.params.id));
  if (cartItem) {
    cartItem.quantity = req.body.quantity;
    saveDB();
  }
  res.json({ message: '更新成功' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const index = db.carts.findIndex(c => c.id === parseInt(req.params.id));
  if (index > -1) {
    db.carts.splice(index, 1);
    saveDB();
  }
  res.json({ message: '删除成功' });
});

module.exports = router;
