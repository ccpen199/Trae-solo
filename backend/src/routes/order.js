const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const generateOrderNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${year}${month}${day}${random}`;
};

router.post('/create', authenticate, (req, res) => {
  const { cart_ids, product_id, sku_id, quantity, address, is_group_buy, group_buy_id } = req.body;
  
  let items = [];
  let totalAmount = 0;
  
  if (cart_ids && cart_ids.length > 0) {
    const placeholders = cart_ids.map(() => '?').join(',');
    const cartItems = db.prepare(`
      SELECT c.*, p.name, p.price, p.images
      FROM carts c
      LEFT JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ? AND c.id IN (${placeholders}) AND c.selected = 1
    `).all(req.user.id, ...cart_ids);
    
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'No valid cart items' });
    }
    
    items = cartItems.map(item => ({
      product_id: item.product_id,
      sku_id: item.sku_id,
      quantity: item.quantity,
      price: item.price
    }));
    
    totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    db.prepare(`DELETE FROM carts WHERE id IN (${placeholders}) AND user_id = ?`)
      .run(...cart_ids, req.user.id);
  } else if (product_id && quantity) {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = 1').get(product_id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    items = [{
      product_id,
      sku_id,
      quantity,
      price: product.price
    }];
    
    totalAmount = product.price * quantity;
  } else {
    return res.status(400).json({ error: 'Cart ids or product info required' });
  }
  
  const orderNo = generateOrderNo();
  
  const tx = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO orders (order_no, user_id, total_amount, status, receiver_name, receiver_phone, receiver_address, is_group_buy, group_buy_id)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `).run(
      orderNo,
      req.user.id,
      totalAmount,
      address?.name || '',
      address?.phone || '',
      address?.address || '',
      is_group_buy ? 1 : 0,
      group_buy_id || null
    );
    
    const orderId = orderResult.lastInsertRowid;
    
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, sku_id, quantity, price)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    items.forEach(item => {
      insertItem.run(orderId, item.product_id, item.sku_id, item.quantity, item.price);
    });
    
    if (is_group_buy && !group_buy_id) {
      const gbResult = db.prepare(`
        INSERT INTO group_buys (product_id, leader_id, group_price, min_members, current_members, expires_at)
        VALUES (?, ?, ?, 2, 1, DATETIME('now', '+24 hours'))
      `).run(items[0].product_id, req.user.id, items[0].price);
      
      const gbId = gbResult.lastInsertRowid;
      
      db.prepare('UPDATE orders SET group_buy_id = ? WHERE id = ?').run(gbId, orderId);
      
      db.prepare(`
        INSERT INTO group_buy_members (group_buy_id, user_id, order_id)
        VALUES (?, ?, ?)
      `).run(gbId, req.user.id, orderId);
    } else if (group_buy_id) {
      const groupBuy = db.prepare('SELECT * FROM group_buys WHERE id = ? AND status = "active"').get(group_buy_id);
      
      if (!groupBuy) {
        throw new Error('Group buy not found or expired');
      }
      
      const newMembers = groupBuy.current_members + 1;
      
      if (newMembers >= groupBuy.min_members) {
        db.prepare(`
          UPDATE group_buys 
          SET current_members = ?, status = 'succeeded', succeeded_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(newMembers, group_buy_id);
        
        db.prepare(`
          UPDATE orders 
          SET status = 'paid', paid_at = CURRENT_TIMESTAMP 
          WHERE group_buy_id = ? AND status = 'pending'
        `).run(group_buy_id);
      } else {
        db.prepare(`
          UPDATE group_buys 
          SET current_members = ? 
          WHERE id = ?
        `).run(newMembers, group_buy_id);
      }
      
      db.prepare(`
        INSERT INTO group_buy_members (group_buy_id, user_id, order_id)
        VALUES (?, ?, ?)
      `).run(group_buy_id, req.user.id, orderId);
    }
    
    return orderId;
  });
  
  try {
    const orderId = tx();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    
    res.json({
      order: {
        id: order.id,
        order_no: order.order_no,
        total_amount: order.total_amount,
        status: order.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/pay', authenticate, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (order.status !== 'pending') {
    return res.status(400).json({ error: 'Order cannot be paid' });
  }
  
  db.prepare(`
    UPDATE orders 
    SET status = 'paid', pay_amount = total_amount, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(order.id);
  
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const updateStock = db.prepare('UPDATE products SET sales = sales + ?, stock = stock - ? WHERE id = ?');
  
  orderItems.forEach(item => {
    updateStock.run(item.quantity, item.quantity, item.product_id);
  });
  
  res.json({ success: true, message: 'Payment successful' });
});

router.post('/:id/cancel', authenticate, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (order.status !== 'pending' && order.status !== 'paid') {
    return res.status(400).json({ error: 'Order cannot be cancelled' });
  }
  
  const now = Date.now();
  const createdAt = new Date(order.created_at).getTime();
  const minutesDiff = (now - createdAt) / (1000 * 60);
  
  if (order.status === 'paid' && minutesDiff > 30) {
    return res.status(400).json({ error: 'Paid orders can only be cancelled within 30 minutes' });
  }
  
  if (order.group_buy_id) {
    const gb = db.prepare('SELECT * FROM group_buys WHERE id = ?').get(order.group_buy_id);
    if (gb && gb.status === 'succeeded') {
      return res.status(400).json({ error: 'Succeeded group buy cannot be cancelled' });
    }
  }
  
  db.prepare(`
    UPDATE orders 
    SET status = 'cancelled', canceled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(order.id);
  
  if (order.group_buy_id) {
    db.prepare(`
      UPDATE group_buys 
      SET current_members = current_members - 1 
      WHERE id = ? AND current_members > 0
    `).run(order.group_buy_id);
    
    db.prepare('DELETE FROM group_buy_members WHERE order_id = ?').run(order.id);
  }
  
  res.json({ success: true, message: 'Order cancelled successfully' });
});

router.post('/:id/after-sale', authenticate, (req, res) => {
  const { type, reason, amount } = req.body;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (order.status !== 'paid' && order.status !== 'shipped' && order.status !== 'completed') {
    return res.status(400).json({ error: 'Order is not eligible for after-sale' });
  }
  
  const now = Date.now();
  const paidAt = new Date(order.paid_at).getTime();
  const minutesDiff = (now - paidAt) / (1000 * 60);
  
  if (minutesDiff < 30) {
    return res.status(400).json({ error: 'Please use cancel order within 30 minutes' });
  }
  
  const existingAs = db.prepare(`
    SELECT * FROM after_sales WHERE order_id = ? AND status IN ('pending', 'approved')
  `).get(order.id);
  
  if (existingAs) {
    return res.status(400).json({ error: 'After-sale request already exists' });
  }
  
  db.prepare(`
    INSERT INTO after_sales (order_id, user_id, type, reason, amount, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(order.id, req.user.id, type || 'refund', reason, amount || order.total_amount);
  
  res.json({ success: true, message: 'After-sale request submitted' });
});

router.get('/', authenticate, (req, res) => {
  const { status, page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;
  
  let whereClause = 'WHERE user_id = ?';
  const params = [req.user.id];
  
  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  
  const countResult = db.prepare(`
    SELECT COUNT(*) as total FROM orders ${whereClause}
  `).get(...params);
  
  const orders = db.prepare(`
    SELECT * FROM orders 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(page_size), offset);
  
  const ordersWithItems = orders.map(order => {
    const items = db.prepare(`
      SELECT oi.*, p.name, p.images
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);
    
    return {
      ...order,
      items: items.map(item => {
        let images = [];
        try {
          images = JSON.parse(item.images);
        } catch (e) {
          images = [];
        }
        return { ...item, images };
      })
    };
  });
  
  res.json({
    orders: ordersWithItems,
    pagination: {
      page: parseInt(page),
      page_size: parseInt(page_size),
      total: countResult.total,
      total_pages: Math.ceil(countResult.total / page_size)
    }
  });
});

router.get('/:id', authenticate, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const items = db.prepare(`
    SELECT oi.*, p.name, p.images
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(order.id);
  
  let groupBuy = null;
  if (order.group_buy_id) {
    groupBuy = db.prepare('SELECT * FROM group_buys WHERE id = ?').get(order.group_buy_id);
    if (groupBuy) {
      const members = db.prepare(`
        SELECT gm.*, u.nickname, u.avatar
        FROM group_buy_members gm
        LEFT JOIN users u ON gm.user_id = u.id
        WHERE gm.group_buy_id = ?
      `).all(order.group_buy_id);
      groupBuy.members = members;
    }
  }
  
  res.json({
    order: {
      ...order,
      items: items.map(item => {
        let images = [];
        try {
          images = JSON.parse(item.images);
        } catch (e) {
          images = [];
        }
        return { ...item, images };
      }),
      group_buy: groupBuy
    }
  });
});

router.post('/retry-purchase', authenticate, (req, res) => {
  const { order_id } = req.body;
  
  const originalOrder = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(order_id, req.user.id);
  
  if (!originalOrder) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (originalOrder.status !== 'cancelled' && originalOrder.status !== 'expired') {
    return res.status(400).json({ error: 'Only cancelled or expired orders can be repurchased' });
  }
  
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(originalOrder.id);
  
  const insertCart = db.prepare(`
    INSERT INTO carts (user_id, product_id, sku_id, quantity, selected)
    VALUES (?, ?, ?, ?, 1)
  `);
  
  items.forEach(item => {
    insertCart.run(req.user.id, item.product_id, item.sku_id, item.quantity);
  });
  
  res.json({ success: true, message: 'Items added to cart for repurchase' });
});

router.get('/group-buy/:id/share', authenticate, (req, res) => {
  const groupBuy = db.prepare(`
    SELECT gb.*, p.name, p.images, p.price as original_price, u.nickname as leader_name
    FROM group_buys gb
    LEFT JOIN products p ON gb.product_id = p.id
    LEFT JOIN users u ON gb.leader_id = u.id
    WHERE gb.id = ?
  `).get(req.params.id);
  
  if (!groupBuy) {
    return res.status(404).json({ error: 'Group buy not found' });
  }
  
  const members = db.prepare(`
    SELECT gm.*, u.nickname, u.avatar
    FROM group_buy_members gm
    LEFT JOIN users u ON gm.user_id = u.id
    WHERE gm.group_buy_id = ?
  `).all(groupBuy.id);
  
  res.json({
    group_buy: {
      ...groupBuy,
      members
    },
    share_link: `http://localhost:9922/group-buy/${groupBuy.id}`,
    share_content: `一起来拼团吧！${groupBuy.name} 仅需 ¥${groupBuy.group_price}，还差 ${groupBuy.min_members - groupBuy.current_members} 人成团！`
  });
});

const checkExpiredGroupBuys = () => {
  const now = new Date().toISOString();
  
  const expiredGroups = db.prepare(`
    SELECT * FROM group_buys 
    WHERE status = 'active' AND expires_at < ?
  `).all(now);
  
  expiredGroups.forEach(gb => {
    db.prepare(`
      UPDATE group_buys 
      SET status = 'failed', failed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(gb.id);
    
    db.prepare(`
      UPDATE orders 
      SET status = 'refunded', updated_at = CURRENT_TIMESTAMP 
      WHERE group_buy_id = ? AND status = 'pending'
    `).run(gb.id);
  });
  
  const pendingOrders = db.prepare(`
    SELECT * FROM orders 
    WHERE status = 'pending' AND julianday('now') - julianday(created_at) > 1
  `).all();
  
  pendingOrders.forEach(order => {
    db.prepare(`
      UPDATE orders 
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(order.id);
  });
};

setInterval(checkExpiredGroupBuys, 60000);

module.exports = router;
