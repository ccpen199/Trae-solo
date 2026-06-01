const express = require('express');
const { all, get, run } = require('../database/db');
const { authenticateToken, requireRoles, canAccessElderly } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/packages', async (req, res) => {
  try {
    const packages = await all('SELECT * FROM fee_packages ORDER BY base_fee');
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: '获取费用套餐失败' });
  }
});

router.post('/packages', requireRoles('admin'), async (req, res) => {
  try {
    const { name, base_fee, care_fee, meal_fee, description } = req.body;
    const result = await run(`
      INSERT INTO fee_packages (name, base_fee, care_fee, meal_fee, description)
      VALUES (?, ?, ?, ?, ?)
    `, [name, base_fee, care_fee || 0, meal_fee || 0, description]);

    res.json({ id: result.lastID, message: '费用套餐创建成功' });
  } catch (error) {
    res.status(500).json({ error: '创建费用套餐失败' });
  }
});

router.get('/records', async (req, res) => {
  try {
    let records;
    if (req.user.role === 'family') {
      records = await all(`
        SELECT fr.*, e.name as elderly_name
        FROM fee_records fr
        JOIN elderly e ON fr.elderly_id = e.id
        JOIN family_access fa ON e.id = fa.elderly_id
        WHERE fa.family_member_id = ?
        ORDER BY fr.billing_month DESC
      `, [req.user.id]);
    } else {
      records = await all(`
        SELECT fr.*, e.name as elderly_name
        FROM fee_records fr
        JOIN elderly e ON fr.elderly_id = e.id
        ORDER BY fr.billing_month DESC
      `);
    }
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '获取费用记录失败' });
  }
});

router.get('/records/elderly/:elderlyId', canAccessElderly, async (req, res) => {
  try {
    const records = await all(`
      SELECT * FROM fee_records
      WHERE elderly_id = ?
      ORDER BY billing_month DESC
    `, [req.params.elderlyId]);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '获取费用记录失败' });
  }
});

router.post('/records', requireRoles('admin'), async (req, res) => {
  try {
    const { elderly_id, billing_month, total_amount, paid_amount, payment_status, due_date } = req.body;
    const result = await run(`
      INSERT INTO fee_records (elderly_id, billing_month, total_amount, paid_amount, payment_status, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [elderly_id, billing_month, total_amount, paid_amount || 0, payment_status || '待缴费', due_date]);

    res.json({ id: result.lastID, message: '费用记录创建成功' });
  } catch (error) {
    res.status(500).json({ error: '创建费用记录失败' });
  }
});

router.put('/records/:id', requireRoles('admin'), async (req, res) => {
  try {
    const { paid_amount, payment_status, paid_date } = req.body;
    await run(`
      UPDATE fee_records 
      SET paid_amount = ?, payment_status = ?, paid_date = ?
      WHERE id = ?
    `, [paid_amount, payment_status, paid_date, req.params.id]);

    res.json({ message: '费用记录更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新费用记录失败' });
  }
});

router.get('/arrears', requireRoles('admin', 'nurse'), async (req, res) => {
  try {
    const arrears = await all(`
      SELECT fr.*, e.name as elderly_name, e.room_number, e.bed_number, c.phone as contact_phone
      FROM fee_records fr
      JOIN elderly e ON fr.elderly_id = e.id
      LEFT JOIN contacts c ON e.id = c.elderly_id AND c.is_emergency = 1
      WHERE fr.payment_status IN ('欠费', '待缴费') AND fr.due_date < DATE('now')
      ORDER BY fr.due_date ASC
    `);
    res.json(arrears);
  } catch (error) {
    res.status(500).json({ error: '获取欠费列表失败' });
  }
});

module.exports = router;
