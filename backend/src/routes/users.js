const express = require('express');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, created_at FROM users').all();
  res.json(users);
});

router.get('/me', (req, res) => {
  res.json(req.user);
});

router.get('/roles', (req, res) => {
  res.json([
    { id: 'business_owner', name: '业务负责人', permissions: ['create', 'read', 'update', 'delete', 'batch'] },
    { id: 'model_ops', name: '模型运营', permissions: ['create', 'read', 'update', 'batch'] },
    { id: 'auditor', name: '审核人员', permissions: ['read', 'update'] },
    { id: 'user', name: '一线使用者', permissions: ['read', 'create'] }
  ]);
});

module.exports = router;
