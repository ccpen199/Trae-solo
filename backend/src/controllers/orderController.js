const { query, getLastInsertId } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const generateOrderNo = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${timestamp.slice(-8)}${random}`;
};

const createOrder = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { product_id, quantity = 1, buyer_message } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: '商品ID为必填项' });
    }

    const productResult = await query(
      'SELECT * FROM products WHERE id = $1 AND status = $2',
      [product_id, 'active']
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在或已下架' });
    }

    const product = productResult.rows[0];
    const sellerId = product.user_id;

    if (buyerId === sellerId) {
      return res.status(400).json({ message: '不能购买自己发布的商品' });
    }

    const orderNo = generateOrderNo();
    const totalAmount = parseFloat(product.price) * parseInt(quantity);

    await query(
      `INSERT INTO orders 
       (order_no, buyer_id, seller_id, product_id, price, quantity, total_amount, buyer_message, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [orderNo, buyerId, sellerId, product_id, product.price, quantity, totalAmount, buyer_message]
    );

    const orderId = await getLastInsertId('orders');
    const result = await query('SELECT * FROM orders WHERE id = $1', [orderId]);

    res.status(201).json({
      message: '订单创建成功',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const result = await query(
      `SELECT o.*, 
              p.title as product_title, p.images as product_images, p.description as product_description,
              u_buyer.username as buyer_username, u_buyer.nickname as buyer_nickname,
              u_seller.username as seller_username, u_seller.nickname as seller_nickname
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN users u_buyer ON o.buyer_id = u_buyer.id
       LEFT JOIN users u_seller ON o.seller_id = u_seller.id
       WHERE o.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2)`,
      [orderId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '订单不存在或无权限查看' });
    }

    const order = result.rows[0];
    if (order.product_images) {
      try {
        order.product_images = JSON.parse(order.product_images);
      } catch {
        order.product_images = [];
      }
    }

    res.json(order);
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE (o.buyer_id = $1 OR o.seller_id = $1)';
    const params = [userId];
    let paramIndex = 2;

    if (role === 'buyer') {
      whereClause = 'WHERE o.buyer_id = $1';
    } else if (role === 'seller') {
      whereClause = 'WHERE o.seller_id = $1';
    }

    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const sql = `
      SELECT o.*, 
             p.title as product_title, p.images as product_images
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM orders o ${whereClause}`;
    const countParams = params.slice(0, paramIndex);
    const countResult = await query(countSql, countParams);

    const orders = result.rows.map(o => {
      if (o.product_images) {
        try {
          o.product_images = JSON.parse(o.product_images);
        } catch {
          o.product_images = [];
        }
      }
      return o;
    });

    res.json({
      orders,
      total: parseInt(countResult.rows[0]?.total || 0),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1 AND buyer_id = $2 AND status = $3',
      [orderId, userId, 'pending']
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: '订单不存在或无法取消' });
    }

    await query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', orderId]
    );

    const result = await query('SELECT * FROM orders WHERE id = $1', [orderId]);

    res.json({
      message: '订单已取消',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const confirmOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const orderResult = await query(
      `SELECT * FROM orders 
       WHERE id = $1 AND buyer_id = $2 AND (status = $3 OR status = $4)`,
      [orderId, userId, 'pending', 'processing']
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: '订单不存在或无法确认' });
    }

    await query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['completed', orderId]
    );

    const result = await query('SELECT * FROM orders WHERE id = $1', [orderId]);

    res.json({
      message: '订单已确认收货',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('确认订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    const { status, remark } = req.body;

    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1 AND seller_id = $2',
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: '订单不存在或无权限操作' });
    }

    const currentOrder = orderResult.rows[0];

    if (!validTransitions[currentOrder.status]?.includes(status)) {
      return res.status(400).json({ message: '无效的订单状态转换' });
    }

    if (remark) {
      await query(
        `UPDATE orders 
         SET status = $1, seller_remark = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [status, remark, orderId]
      );
    } else {
      await query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, orderId]
      );
    }

    const result = await query('SELECT * FROM orders WHERE id = $1', [orderId]);

    res.json({
      message: '订单状态更新成功',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  cancelOrder,
  confirmOrder,
  updateOrderStatus
};
