const { db } = require('../models/database');

const getClients = (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
  res.json({ success: true, data: clients });
};

const getClientById = (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }
  res.json({ success: true, data: client });
};

const createClient = (req, res) => {
  const { name, contact_person, phone, email, address, discount_rate, notes } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO clients (name, contact_person, phone, email, address, discount_rate, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, contact_person, phone, email, address, discount_rate || 0, notes);
    res.json({ success: true, data: { id: result.lastInsertRowid, ...req.body } });
  } catch (err) {
    res.status(400).json({ success: false, message: '创建客户失败' });
  }
};

const updateClient = (req, res) => {
  const { name, contact_person, phone, email, address, discount_rate, notes } = req.body;
  try {
    db.prepare(
      'UPDATE clients SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, discount_rate = ?, notes = ? WHERE id = ?'
    ).run(name, contact_person, phone, email, address, discount_rate || 0, notes, req.params.id);
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: '更新失败' });
  }
};

module.exports = { getClients, getClientById, createClient, updateClient };
