const { db } = require('../models/database');

const getCart = (req, res) => {
  const userId = req.user.userId;
  const rows = db.prepare(`
    SELECT c.*, p.name, p.price, p.images, p.stock 
    FROM carts c 
    LEFT JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(userId);
  
  const cart = rows.map(item => ({
    ...item,
    images: JSON.parse(item.images || '[]')
  }));
  res.json({ code: 200, msg: 'success', data: cart });
};

const addToCart = (req, res) => {
  const userId = req.user.userId;
  const { product_id, quantity = 1 } = req.body;
  
  const cartItem = db.prepare('SELECT * FROM carts WHERE user_id = ? AND product_id = ?').get(userId, product_id);
  
  if (cartItem) {
    db.prepare('UPDATE carts SET quantity = quantity + ? WHERE id = ?').run(quantity, cartItem.id);
  } else {
    db.prepare('INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)').run(userId, product_id, quantity);
  }
  res.json({ code: 200, msg: '添加成功', data: null });
};

const updateCart = (req, res) => {
  const userId = req.user.userId;
  const { id, quantity, selected } = req.body;
  
  let sql = 'UPDATE carts SET ';
  const params = [];
  
  if (quantity !== undefined) {
    sql += 'quantity = ?, ';
    params.push(quantity);
  }
  if (selected !== undefined) {
    sql += 'selected = ?, ';
    params.push(selected);
  }
  
  sql = sql.slice(0, -2) + ' WHERE id = ? AND user_id = ?';
  params.push(id, userId);
  
  db.prepare(sql).run(...params);
  res.json({ code: 200, msg: '更新成功', data: null });
};

const deleteCart = (req, res) => {
  const userId = req.user.userId;
  const { id } = req.body;
  
  db.prepare('DELETE FROM carts WHERE id = ? AND user_id = ?').run(id, userId);
  res.json({ code: 200, msg: '删除成功', data: null });
};

const toggleSelectAll = (req, res) => {
  const userId = req.user.userId;
  const { selected } = req.body;
  
  db.prepare('UPDATE carts SET selected = ? WHERE user_id = ?').run(selected ? 1 : 0, userId);
  res.json({ code: 200, msg: '操作成功', data: null });
};

module.exports = { getCart, addToCart, updateCart, deleteCart, toggleSelectAll };
