const express = require('express');
const { all, get, run } = require('../database/db');
const { authenticateToken, requireRoles, canAccessElderly } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    let elderly;
    if (req.user.role === 'family') {
      elderly = await all(`
        SELECT e.*, fp.name as package_name 
        FROM elderly e
        JOIN family_access fa ON e.id = fa.elderly_id
        LEFT JOIN fee_packages fp ON e.package_id = fp.id
        WHERE fa.family_member_id = ?
        ORDER BY e.name
      `, [req.user.id]);
    } else {
      elderly = await all(`
        SELECT e.*, fp.name as package_name 
        FROM elderly e
        LEFT JOIN fee_packages fp ON e.package_id = fp.id
        ORDER BY e.name
      `);
    }
    res.json(elderly);
  } catch (error) {
    console.error('获取老人列表错误:', error);
    res.status(500).json({ error: '获取老人列表失败' });
  }
});

router.get('/:id', canAccessElderly, async (req, res) => {
  try {
    const elderly = await get(`
      SELECT e.*, fp.name as package_name, fp.base_fee, fp.care_fee, fp.meal_fee
      FROM elderly e
      LEFT JOIN fee_packages fp ON e.package_id = fp.id
      WHERE e.id = ?
    `, [req.params.id]);

    if (!elderly) {
      return res.status(404).json({ error: '老人不存在' });
    }

    const contacts = await all('SELECT * FROM contacts WHERE elderly_id = ?', [req.params.id]);
    const medicalRecords = await all(`
      SELECT mr.*, u.name as recorder_name 
      FROM medical_records mr
      LEFT JOIN users u ON mr.recorded_by = u.id
      WHERE mr.elderly_id = ?
      ORDER BY mr.created_at DESC
    `, [req.params.id]);

    res.json({ ...elderly, contacts, medicalRecords });
  } catch (error) {
    console.error('获取老人详情错误:', error);
    res.status(500).json({ error: '获取老人详情失败' });
  }
});

router.post('/', requireRoles('admin', 'nurse'), async (req, res) => {
  try {
    const { name, gender, birth_date, id_card, room_number, bed_number, health_status, care_level, allergy_history, diet_type, admission_date, contract_number, package_id, status } = req.body;

    const result = await run(`
      INSERT INTO elderly (name, gender, birth_date, id_card, room_number, bed_number, health_status, care_level, allergy_history, diet_type, admission_date, contract_number, package_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, gender, birth_date, id_card, room_number, bed_number, health_status, care_level, allergy_history, diet_type, admission_date, contract_number, package_id, status || '入住中']);

    res.json({ id: result.lastID, message: '老人档案创建成功' });
  } catch (error) {
    console.error('创建老人档案错误:', error);
    res.status(500).json({ error: '创建老人档案失败' });
  }
});

router.put('/:id', requireRoles('admin', 'nurse'), canAccessElderly, async (req, res) => {
  try {
    const { name, gender, birth_date, id_card, room_number, bed_number, health_status, care_level, allergy_history, diet_type, admission_date, contract_number, package_id, status } = req.body;

    await run(`
      UPDATE elderly 
      SET name = ?, gender = ?, birth_date = ?, id_card = ?, room_number = ?, bed_number = ?, health_status = ?, care_level = ?, allergy_history = ?, diet_type = ?, admission_date = ?, contract_number = ?, package_id = ?, status = ?
      WHERE id = ?
    `, [name, gender, birth_date, id_card, room_number, bed_number, health_status, care_level, allergy_history, diet_type, admission_date, contract_number, package_id, status, req.params.id]);

    res.json({ message: '老人档案更新成功' });
  } catch (error) {
    console.error('更新老人档案错误:', error);
    res.status(500).json({ error: '更新老人档案失败' });
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res) => {
  try {
    await run('DELETE FROM elderly WHERE id = ?', [req.params.id]);
    res.json({ message: '老人档案删除成功' });
  } catch (error) {
    console.error('删除老人档案错误:', error);
    res.status(500).json({ error: '删除老人档案失败' });
  }
});

router.get('/:id/contacts', canAccessElderly, async (req, res) => {
  try {
    const contacts = await all('SELECT * FROM contacts WHERE elderly_id = ? ORDER BY is_emergency DESC', [req.params.id]);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: '获取联系人失败' });
  }
});

router.post('/:id/contacts', requireRoles('admin', 'nurse'), canAccessElderly, async (req, res) => {
  try {
    const { name, relationship, phone, address, is_emergency } = req.body;
    const result = await run(`
      INSERT INTO contacts (elderly_id, name, relationship, phone, address, is_emergency)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.params.id, name, relationship, phone, address, is_emergency || 0]);

    res.json({ id: result.lastID, message: '联系人添加成功' });
  } catch (error) {
    res.status(500).json({ error: '添加联系人失败' });
  }
});

module.exports = router;
