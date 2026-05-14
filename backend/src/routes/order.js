const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute, runTransaction } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function generateOrderNo() {
  const date = dayjs().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `PDD${date}${random}`;
}

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1, type = 'normal', groupId, addressId } = req.body;

    if (!productId) {
      return res.json({ success: false, message: '请选择商品', data: null });
    }

    const product = await queryOne('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.json({ success: false, message: '商品不存在', data: null });
    }

    if (product.stock < quantity) {
      return res.json({ success: false, message: '库存不足', data: null });
    }

    let address = null;
    if (addressId) {
      address = await queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [addressId, req.user.id]);
    }
    if (!address) {
      address = await queryOne('SELECT * FROM addresses WHERE user_id = ? AND is_default = 1 LIMIT 1', [req.user.id]);
    }
    if (!address) {
      address = await queryOne('SELECT * FROM addresses WHERE user_id = ? LIMIT 1', [req.user.id]);
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const orderId = uuidv4();
    const orderNo = generateOrderNo();
    const totalPrice = product.price * quantity;

    let shippingAddress = '待完善收货地址';
    if (address) {
      shippingAddress = `${address.province}${address.city}${address.district}${address.detail} (${address.name} ${address.phone})`;
    }

    await execute(
      `INSERT INTO orders (id, order_no, user_id, product_id, product_name, product_image, price, quantity, total_price, status, pay_status, type, group_id, shipping_address, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        orderNo,
        req.user.id,
        productId,
        product.name,
        product.image,
        product.price,
        quantity,
        totalPrice,
        'pending',
        'unpaid',
        type,
        groupId || null,
        shippingAddress,
        now,
        now
      ]
    );

    await execute('UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?', [quantity, quantity, productId]);

    const order = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);

    res.json({
      success: true,
      message: '订单创建成功',
      data: order
    });
  } catch (err) {
    console.error('创建订单失败:', err);
    res.json({ success: false, message: '创建订单失败', data: null });
  }
});

router.post('/pay', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const order = await queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, req.user.id]);

    if (!order) {
      return res.json({ success: false, message: '订单不存在', data: null });
    }

    if (order.pay_status === 'paid') {
      return res.json({ success: false, message: '订单已支付', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    await execute(
      'UPDATE orders SET pay_status = ?, status = ?, updated_at = ? WHERE id = ?',
      ['paid', 'paid', now, orderId]
    );

    if (order.group_id) {
      const group = await queryOne('SELECT * FROM groups WHERE id = ?', [order.group_id]);
      if (group) {
        const newCount = group.current_count + 1;
        const status = newCount >= group.total_count ? 'success' : 'pending';
        await execute(
          'UPDATE groups SET current_count = ?, status = ?, updated_at = ? WHERE id = ?',
          [newCount, status, now, group.id]
        );
      }
    }

    res.json({ success: true, message: '支付成功', data: null });
  } catch (err) {
    console.error('支付失败:', err);
    res.json({ success: false, message: '支付失败', data: null });
  }
});

router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let sql = 'SELECT * FROM orders WHERE user_id = ?';
    let countSql = 'SELECT COUNT(*) as count FROM orders WHERE user_id = ?';
    const params = [req.user.id];
    const countParams = [req.user.id];

    if (status) {
      if (status === 'unpaid') {
        sql += ' AND pay_status = ?';
        countSql += ' AND pay_status = ?';
      } else if (status === 'unshipped') {
        sql += " AND pay_status = 'paid' AND status IN ('paid', 'processing')";
        countSql += " AND pay_status = 'paid' AND status IN ('paid', 'processing')";
      } else if (status === 'unreceived') {
        sql += " AND status = 'shipped'";
        countSql += " AND status = 'shipped'";
      } else if (status === 'completed') {
        sql += " AND status = 'completed'";
        countSql += " AND status = 'completed'";
      } else {
        sql += ' AND status = ?';
        countSql += ' AND status = ?';
      }
      params.push(status);
      countParams.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const orders = await query(sql, params);
    const countResult = await queryOne(countSql, countParams);

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: orders,
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.json({ success: false, message: '获取失败', data: { list: [], total: 0, page: 1, pageSize: 10 } });
  }
});

router.get('/detail/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, req.user.id]);

    if (!order) {
      return res.json({ success: false, message: '订单不存在', data: null });
    }

    res.json({ success: true, message: '获取成功', data: order });
  } catch (err) {
    console.error('获取订单详情失败:', err);
    res.json({ success: false, message: '获取失败', data: null });
  }
});

router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const order = await queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, req.user.id]);

    if (!order) {
      return res.json({ success: false, message: '订单不存在', data: null });
    }

    if (order.pay_status === 'paid') {
      return res.json({ success: false, message: '已支付订单不能取消', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    await execute('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', ['cancelled', now, orderId]);
    await execute('UPDATE products SET stock = stock + ?, sales = sales - ? WHERE id = ?', [order.quantity, order.quantity, order.product_id]);

    res.json({ success: true, message: '取消成功', data: null });
  } catch (err) {
    console.error('取消订单失败:', err);
    res.json({ success: false, message: '取消失败', data: null });
  }
});

router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const order = await queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, req.user.id]);

    if (!order) {
      return res.json({ success: false, message: '订单不存在', data: null });
    }

    if (order.status !== 'shipped') {
      return res.json({ success: false, message: '订单状态不支持确认收货', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    await execute('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', ['completed', now, orderId]);

    res.json({ success: true, message: '确认收货成功', data: null });
  } catch (err) {
    console.error('确认收货失败:', err);
    res.json({ success: false, message: '确认收货失败', data: null });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [unpaid, unshipped, unreceived, completed] = await Promise.all([
      queryOne("SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND pay_status = 'unpaid'", [req.user.id]),
      queryOne("SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND pay_status = 'paid' AND status IN ('paid', 'processing')", [req.user.id]),
      queryOne("SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status = 'shipped'", [req.user.id]),
      queryOne("SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status = 'completed'", [req.user.id])
    ]);

    res.json({
      success: true,
      message: '获取成功',
      data: {
        unpaid: unpaid.count,
        unshipped: unshipped.count,
        unreceived: unreceived.count,
        completed: completed.count
      }
    });
  } catch (err) {
    console.error('获取订单统计失败:', err);
    res.json({
      success: false,
      message: '获取失败',
      data: { unpaid: 0, unshipped: 0, unreceived: 0, completed: 0 }
    });
  }
});

module.exports = router;
