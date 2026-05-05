const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const generateOrderNo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${year}${month}${day}${hour}${minute}${random}`;
};

const orderStatusMap = {
  pending: '待支付',
  paid: '待发货',
  shipped: '配送中',
  delivered: '待收货',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款'
};

router.get('/checkout-info', authMiddleware, (req, res) => {
  try {
    const cartItems = db.prepare(`
      SELECT c.id, c.product_id, c.quantity, c.selected,
             p.name, p.price, p.member_price, p.image, p.unit, p.stock
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ? AND c.selected = 1
      ORDER BY c.created_at DESC
    `).all(req.user.id);
    
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: '购物车为空' });
    }
    
    const isMember = req.user.is_member || 0;
    const processedItems = cartItems.map(item => ({
      ...item,
      show_price: isMember && item.member_price ? item.member_price : item.price
    }));
    
    const totalAmount = processedItems.reduce((sum, item) => sum + (item.show_price * item.quantity), 0);
    
    const addresses = db.prepare(`
      SELECT id, name, phone, province, city, district, detail, is_default
      FROM addresses
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
    `).all(req.user.id);
    
    const defaultAddress = addresses.find(a => a.is_default) || addresses[0] || null;
    
    const stores = db.prepare('SELECT id, name, address, phone FROM stores WHERE status = 1').all();
    
    res.json({
      success: true,
      data: {
        items: processedItems,
        total_amount: parseFloat(totalAmount.toFixed(2)),
        addresses,
        default_address: defaultAddress,
        stores,
        delivery_types: [
          { value: 'delivery', label: '半小时达配送', desc: '预计30分钟内送达' },
          { value: 'pickup', label: '门店自提', desc: '到店自取，立即可取' }
        ]
      }
    });
  } catch (error) {
    console.error('获取结算信息失败:', error);
    res.status(500).json({ success: false, message: '获取结算信息失败' });
  }
});

router.post('/create', authMiddleware, (req, res) => {
  const transaction = db.transaction(() => {
    const { address_id, store_id, delivery_type = 'delivery', delivery_address } = req.body;
    
    const cartItems = db.prepare(`
      SELECT c.id, c.product_id, c.quantity,
             p.name, p.price, p.member_price, p.image, p.unit, p.stock
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ? AND c.selected = 1
    `).all(req.user.id);
    
    if (cartItems.length === 0) {
      throw new Error('购物车为空');
    }
    
    const isMember = req.user.is_member || 0;
    let totalAmount = 0;
    
    cartItems.forEach(item => {
      const price = isMember && item.member_price ? item.member_price : item.price;
      totalAmount += price * item.quantity;
      
      if (item.stock < item.quantity) {
        throw new Error(`商品 ${item.name} 库存不足`);
      }
    });
    
    let addressInfo = null;
    if (delivery_type === 'delivery') {
      if (address_id) {
        const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(address_id, req.user.id);
        if (!address) {
          throw new Error('地址不存在');
        }
        addressInfo = JSON.stringify(address);
      } else if (delivery_address) {
        addressInfo = JSON.stringify(delivery_address);
      } else {
        throw new Error('请选择配送地址');
      }
    }
    
    const orderNo = generateOrderNo();
    const payAmount = totalAmount;
    
    const orderResult = db.prepare(`
      INSERT INTO orders (order_no, user_id, total_amount, discount_amount, pay_amount, status, delivery_type, store_id, address_id, address_info)
      VALUES (?, ?, ?, 0, ?, 'pending', ?, ?, ?, ?)
    `).run(orderNo, req.user.id, totalAmount, payAmount, delivery_type, store_id || null, address_id || null, addressInfo);
    
    const orderId = orderResult.lastInsertRowid;
    
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const updateStock = db.prepare('UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?');
    
    cartItems.forEach(item => {
      const price = isMember && item.member_price ? item.member_price : item.price;
      insertOrderItem.run(orderId, item.product_id, item.name, item.image, price, item.quantity, item.unit);
      updateStock.run(item.quantity, item.quantity, item.product_id);
    });
    
    db.prepare('DELETE FROM carts WHERE user_id = ? AND selected = 1').run(req.user.id);
    
    return { order_id: orderId, order_no: orderNo, pay_amount: payAmount };
  });
  
  try {
    const result = transaction();
    res.json({
      success: true,
      message: '订单创建成功',
      data: result
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ success: false, message: error.message || '创建订单失败' });
  }
});

router.get('/list', authMiddleware, (req, res) => {
  try {
    const { status, page = 1, page_size = 10 } = req.query;
    const offset = (page - 1) * page_size;
    
    let whereClause = 'WHERE user_id = ?';
    const params = [req.user.id];
    
    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    const countQuery = `SELECT COUNT(*) as total FROM orders ${whereClause}`;
    const totalResult = db.prepare(countQuery).get(...params);
    
    const orders = db.prepare(`
      SELECT * FROM orders ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(page_size), offset);
    
    const orderIds = orders.map(o => o.id);
    let orderItems = [];
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      orderItems = db.prepare(`
        SELECT * FROM order_items WHERE order_id IN (${placeholders})
      `).all(...orderIds);
    }
    
    const itemsByOrderId = {};
    orderItems.forEach(item => {
      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = [];
      }
      itemsByOrderId[item.order_id].push(item);
    });
    
    const processedOrders = orders.map(order => ({
      ...order,
      status_text: orderStatusMap[order.status] || order.status,
      items: itemsByOrderId[order.id] || []
    }));
    
    res.json({
      success: true,
      data: {
        list: processedOrders,
        total: totalResult.total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        status_options: [
          { value: 'all', label: '全部' },
          { value: 'pending', label: '待支付' },
          { value: 'paid', label: '待发货' },
          { value: 'shipped', label: '配送中' },
          { value: 'delivered', label: '待收货' },
          { value: 'completed', label: '已完成' }
        ]
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ success: false, message: '获取订单列表失败' });
  }
});

router.get('/detail/:orderId', authMiddleware, (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, req.user.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    
    let address = null;
    if (order.address_info) {
      try {
        address = JSON.parse(order.address_info);
      } catch (e) {
        address = order.address_info;
      }
    }
    
    res.json({
      success: true,
      data: {
        ...order,
        status_text: orderStatusMap[order.status] || order.status,
        items,
        address
      }
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ success: false, message: '获取订单详情失败' });
  }
});

router.post('/pay', authMiddleware, (req, res) => {
  try {
    const { order_id, payment_method = 'alipay' } = req.body;
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: '订单状态不正确' });
    }
    
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE orders SET status = 'paid', payment_method = ?, paid_at = ? WHERE id = ?
    `).run(payment_method, now, order_id);
    
    res.json({
      success: true,
      message: '支付成功'
    });
  } catch (error) {
    console.error('支付失败:', error);
    res.status(500).json({ success: false, message: '支付失败' });
  }
});

router.post('/cancel', authMiddleware, (req, res) => {
  try {
    const { order_id, reason } = req.body;
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: '只能取消待支付订单' });
    }
    
    const transaction = db.transaction(() => {
      db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(order_id);
      
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order_id);
      const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
      items.forEach(item => {
        updateStock.run(item.quantity, item.product_id);
      });
    });
    
    transaction();
    
    res.json({
      success: true,
      message: '订单已取消'
    });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.status(500).json({ success: false, message: '取消订单失败' });
  }
});

router.post('/confirm-receipt', authMiddleware, (req, res) => {
  try {
    const { order_id } = req.body;
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== 'shipped' && order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: '订单状态不正确' });
    }
    
    const now = new Date().toISOString();
    db.prepare("UPDATE orders SET status = 'completed', completed_at = ? WHERE id = ?").run(now, order_id);
    
    res.json({
      success: true,
      message: '已确认收货'
    });
  } catch (error) {
    console.error('确认收货失败:', error);
    res.status(500).json({ success: false, message: '确认收货失败' });
  }
});

router.post('/after-sale', authMiddleware, (req, res) => {
  try {
    const { order_id, order_item_id, type, reason, amount } = req.body;
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== 'completed') {
      return res.status(400).json({ success: false, message: '只能对已完成订单申请售后' });
    }
    
    db.prepare(`
      INSERT INTO after_sales (order_id, order_item_id, user_id, type, reason, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(order_id, order_item_id || null, req.user.id, type, reason, amount || null);
    
    res.json({
      success: true,
      message: '售后申请已提交'
    });
  } catch (error) {
    console.error('提交售后失败:', error);
    res.status(500).json({ success: false, message: '提交售后失败' });
  }
});

router.get('/after-sale/list', authMiddleware, (req, res) => {
  try {
    const afterSales = db.prepare(`
      SELECT as.*, o.order_no
      FROM after_sales as
      JOIN orders o ON as.order_id = o.id
      WHERE as.user_id = ?
      ORDER BY as.created_at DESC
    `).all(req.user.id);
    
    res.json({
      success: true,
      data: afterSales
    });
  } catch (error) {
    console.error('获取售后列表失败:', error);
    res.status(500).json({ success: false, message: '获取售后列表失败' });
  }
});

module.exports = router;
