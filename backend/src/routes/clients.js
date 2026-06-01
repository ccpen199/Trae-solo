const express = require('express');
const { all, get, run } = require('../database');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const clients = await all('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(clients);
  } catch (error) {
    console.error('获取客户列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) {
      return res.status(404).json({ error: '客户不存在' });
    }
    res.json(client);
  } catch (error) {
    console.error('获取客户详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/', requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const { name, industry, contact_person, contact_phone, contact_email, address, settlement_method } = req.body;
    
    const result = await run(
      `INSERT INTO clients (name, industry, contact_person, contact_phone, contact_email, address, settlement_method, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, industry, contact_person, contact_phone, contact_email, address, settlement_method, req.user.id]
    );

    const client = await get('SELECT * FROM clients WHERE id = ?', [result.lastID]);
    res.status(201).json(client);
  } catch (error) {
    console.error('创建客户错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/:id', requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const { name, industry, contact_person, contact_phone, contact_email, address, settlement_method, status } = req.body;
    
    await run(
      `UPDATE clients SET name = ?, industry = ?, contact_person = ?, contact_phone = ?, contact_email = ?, address = ?, settlement_method = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, industry, contact_person, contact_phone, contact_email, address, settlement_method, status, req.params.id]
    );

    const client = await get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    res.json(client);
  } catch (error) {
    console.error('更新客户错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
