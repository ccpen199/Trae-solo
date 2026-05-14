const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/orchard', authMiddleware, async (req, res) => {
  try {
    let orchard = await queryOne(
      'SELECT * FROM orchards WHERE user_id = ?',
      [req.user.id]
    );

    if (!orchard) {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      await execute(
        'INSERT INTO orchards (id, user_id, fruit_type, progress, water_count, fertilize_count, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), req.user.id, '苹果', 0, 0, 0, 'growing', now]
      );
      orchard = await queryOne('SELECT * FROM orchards WHERE user_id = ?', [req.user.id]);
    }

    res.json({
      success: true,
      message: '获取成功',
      data: orchard
    });
  } catch (err) {
    console.error('获取果园信息失败:', err);
    res.json({ success: false, message: '获取失败', data: null });
  }
});

router.post('/orchard/water', authMiddleware, async (req, res) => {
  try {
    const orchard = await queryOne(
      'SELECT * FROM orchards WHERE user_id = ?',
      [req.user.id]
    );

    if (!orchard) {
      return res.json({ success: false, message: '果园不存在', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newProgress = Math.min(orchard.progress + 10, 100);
    const status = newProgress >= 100 ? 'matured' : 'growing';

    await execute(
      'UPDATE orchards SET progress = ?, water_count = water_count + 1, status = ?, updated_at = ? WHERE id = ?',
      [newProgress, status, now, orchard.id]
    );

    res.json({
      success: true,
      message: '浇水成功',
      data: { progress: newProgress, status }
    });
  } catch (err) {
    console.error('浇水失败:', err);
    res.json({ success: false, message: '操作失败', data: null });
  }
});

router.post('/orchard/fertilize', authMiddleware, async (req, res) => {
  try {
    const orchard = await queryOne(
      'SELECT * FROM orchards WHERE user_id = ?',
      [req.user.id]
    );

    if (!orchard) {
      return res.json({ success: false, message: '果园不存在', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newProgress = Math.min(orchard.progress + 20, 100);
    const status = newProgress >= 100 ? 'matured' : 'growing';

    await execute(
      'UPDATE orchards SET progress = ?, fertilize_count = fertilize_count + 1, status = ?, updated_at = ? WHERE id = ?',
      [newProgress, status, now, orchard.id]
    );

    res.json({
      success: true,
      message: '施肥成功',
      data: { progress: newProgress, status }
    });
  } catch (err) {
    console.error('施肥失败:', err);
    res.json({ success: false, message: '操作失败', data: null });
  }
});

router.get('/bargain', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const bargains = await query(
      `SELECT b.*, p.name as product_name, p.image as product_image, p.original_price
       FROM bargains b
       LEFT JOIN products p ON b.product_id = p.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(pageSize), offset]
    );

    const countResult = await queryOne(
      'SELECT COUNT(*) as count FROM bargains WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: bargains.map(b => ({
          ...b,
          helpers: b.helpers ? JSON.parse(b.helpers) : []
        })),
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取砍价列表失败:', err);
    res.json({ success: false, message: '获取失败', data: { list: [], total: 0, page: 1, pageSize: 10 } });
  }
});

router.post('/bargain/create', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const product = await queryOne('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.json({ success: false, message: '商品不存在', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    await execute(
      'INSERT INTO bargains (id, user_id, product_id, original_price, current_price, target_price, helpers, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), req.user.id, productId, product.original_price, product.original_price * 0.8, 0, JSON.stringify([]), 'ongoing', now]
    );

    res.json({ success: true, message: '砍价创建成功', data: null });
  } catch (err) {
    console.error('创建砍价失败:', err);
    res.json({ success: false, message: '操作失败', data: null });
  }
});

router.get('/cash', authMiddleware, async (req, res) => {
  try {
    let cashActivity = await queryOne(
      'SELECT * FROM cash_activities WHERE user_id = ? AND status = "ongoing"',
      [req.user.id]
    );

    if (!cashActivity) {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      await execute(
        'INSERT INTO cash_activities (id, user_id, current_amount, target_amount, helpers, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), req.user.id, 0, 100, JSON.stringify([]), 'ongoing', now]
      );
      cashActivity = await queryOne(
        'SELECT * FROM cash_activities WHERE user_id = ? AND status = "ongoing"',
        [req.user.id]
      );
    }

    res.json({
      success: true,
      message: '获取成功',
      data: {
        ...cashActivity,
        helpers: cashActivity.helpers ? JSON.parse(cashActivity.helpers) : []
      }
    });
  } catch (err) {
    console.error('获取现金活动失败:', err);
    res.json({ success: false, message: '获取失败', data: null });
  }
});

router.post('/cash/invite', authMiddleware, async (req, res) => {
  try {
    const cashActivity = await queryOne(
      'SELECT * FROM cash_activities WHERE user_id = ? AND status = "ongoing"',
      [req.user.id]
    );

    if (!cashActivity) {
      return res.json({ success: false, message: '活动不存在', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const helpers = cashActivity.helpers ? JSON.parse(cashActivity.helpers) : [];
    const newAmount = Math.min(cashActivity.current_amount + Math.random() * 10 + 1, cashActivity.target_amount);
    const status = newAmount >= cashActivity.target_amount ? 'completed' : 'ongoing';

    helpers.push({
      id: uuidv4(),
      amount: newAmount - cashActivity.current_amount,
      time: now
    });

    await execute(
      'UPDATE cash_activities SET current_amount = ?, helpers = ?, status = ?, updated_at = ? WHERE id = ?',
      [newAmount, JSON.stringify(helpers), status, now, cashActivity.id]
    );

    res.json({
      success: true,
      message: '助力成功',
      data: { current_amount: newAmount, status }
    });
  } catch (err) {
    console.error('助力失败:', err);
    res.json({ success: false, message: '操作失败', data: null });
  }
});

module.exports = router;
