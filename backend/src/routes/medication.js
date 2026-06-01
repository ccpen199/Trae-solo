const express = require('express');
const { all, get, run } = require('../database/db');
const { authenticateToken, requireRoles, canAccessElderly } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/medications', async (req, res) => {
  try {
    const medications = await all(`
      SELECT * FROM medications
      ORDER BY name
    `);
    res.json(medications);
  } catch (error) {
    res.status(500).json({ error: '获取药品列表失败' });
  }
});

router.post('/medications', requireRoles('admin', 'nurse'), async (req, res) => {
  try {
    const { name, generic_name, specification, manufacturer, stock_quantity, unit, warning_threshold } = req.body;
    const result = await run(`
      INSERT INTO medications (name, generic_name, specification, manufacturer, stock_quantity, unit, warning_threshold)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, generic_name, specification, manufacturer, stock_quantity || 0, unit, warning_threshold || 10]);

    res.json({ id: result.lastID, message: '药品添加成功' });
  } catch (error) {
    res.status(500).json({ error: '添加药品失败' });
  }
});

router.put('/medications/:id', requireRoles('admin', 'nurse'), async (req, res) => {
  try {
    const { name, generic_name, specification, manufacturer, stock_quantity, unit, warning_threshold } = req.body;
    await run(`
      UPDATE medications 
      SET name = ?, generic_name = ?, specification = ?, manufacturer = ?, stock_quantity = ?, unit = ?, warning_threshold = ?
      WHERE id = ?
    `, [name, generic_name, specification, manufacturer, stock_quantity, unit, warning_threshold, req.params.id]);

    res.json({ message: '药品更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新药品失败' });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const lowStock = await all(`
      SELECT * FROM medications
      WHERE stock_quantity <= warning_threshold
      ORDER BY stock_quantity ASC
    `);
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ error: '获取库存预警失败' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'family') {
      orders = await all(`
        SELECT mo.*, e.name as elderly_name, m.name as medication_name, u.name as prescriber_name
        FROM medication_orders mo
        JOIN elderly e ON mo.elderly_id = e.id
        JOIN family_access fa ON e.id = fa.elderly_id
        JOIN medications m ON mo.medication_id = m.id
        LEFT JOIN users u ON mo.prescribed_by = u.id
        WHERE fa.family_member_id = ? AND mo.is_active = 1
        ORDER BY mo.created_at DESC
      `, [req.user.id]);
    } else {
      orders = await all(`
        SELECT mo.*, e.name as elderly_name, m.name as medication_name, u.name as prescriber_name
        FROM medication_orders mo
        JOIN elderly e ON mo.elderly_id = e.id
        JOIN medications m ON mo.medication_id = m.id
        LEFT JOIN users u ON mo.prescribed_by = u.id
        ORDER BY mo.created_at DESC
      `);
    }
    res.json(orders);
  } catch (error) {
    console.error('获取用药医嘱错误:', error);
    res.status(500).json({ error: '获取用药医嘱失败' });
  }
});

router.get('/orders/elderly/:elderlyId', canAccessElderly, async (req, res) => {
  try {
    const orders = await all(`
      SELECT mo.*, m.name as medication_name, m.specification, u.name as prescriber_name
      FROM medication_orders mo
      JOIN medications m ON mo.medication_id = m.id
      LEFT JOIN users u ON mo.prescribed_by = u.id
      WHERE mo.elderly_id = ?
      ORDER BY mo.created_at DESC
    `, [req.params.elderlyId]);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: '获取用药医嘱失败' });
  }
});

router.post('/orders', requireRoles('admin', 'nurse'), async (req, res) => {
  try {
    const { elderly_id, medication_id, dosage, frequency, administration_route, start_date, end_date, notes } = req.body;
    const result = await run(`
      INSERT INTO medication_orders (elderly_id, medication_id, dosage, frequency, administration_route, start_date, end_date, prescribed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [elderly_id, medication_id, dosage, frequency, administration_route, start_date, end_date, req.user.id, notes]);

    res.json({ id: result.lastID, message: '用药医嘱创建成功' });
  } catch (error) {
    console.error('创建用药医嘱错误:', error);
    res.status(500).json({ error: '创建用药医嘱失败' });
  }
});

router.get('/administration', async (req, res) => {
  try {
    const records = await all(`
      SELECT ma.*, e.name as elderly_name, m.name as medication_name, mo.dosage,
             u.name as administrator_name
      FROM medication_administration ma
      JOIN elderly e ON ma.elderly_id = e.id
      JOIN medication_orders mo ON ma.order_id = mo.id
      JOIN medications m ON mo.medication_id = m.id
      LEFT JOIN users u ON ma.administered_by = u.id
      ORDER BY ma.scheduled_time DESC
      LIMIT 50
    `);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '获取发药记录失败' });
  }
});

router.post('/administration', requireRoles('admin', 'nurse', 'caregiver'), async (req, res) => {
  try {
    const { order_id, elderly_id, scheduled_time, status, notes } = req.body;
    const result = await run(`
      INSERT INTO medication_administration (order_id, elderly_id, scheduled_time, administered_time, administered_by, status, notes)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
    `, [order_id, elderly_id, scheduled_time, req.user.id, status || '已执行', notes]);

    if (status === '已执行') {
      await run(`
        UPDATE medications 
        SET stock_quantity = stock_quantity - 1
        WHERE id = (SELECT medication_id FROM medication_orders WHERE id = ?)
      `, [order_id]);
    }

    res.json({ id: result.lastID, message: '发药记录创建成功' });
  } catch (error) {
    console.error('创建发药记录错误:', error);
    res.status(500).json({ error: '创建发药记录失败' });
  }
});

router.get('/missed-doses', async (req, res) => {
  try {
    const missed = await all(`
      SELECT ma.*, e.name as elderly_name, m.name as medication_name
      FROM medication_administration ma
      JOIN elderly e ON ma.elderly_id = e.id
      JOIN medication_orders mo ON ma.order_id = mo.id
      JOIN medications m ON mo.medication_id = m.id
      WHERE ma.status = '漏服'
      ORDER BY ma.scheduled_time DESC
    `);
    res.json(missed);
  } catch (error) {
    res.status(500).json({ error: '获取漏服记录失败' });
  }
});

module.exports = router;
