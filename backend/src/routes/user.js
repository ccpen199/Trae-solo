const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Enterprise } = require('../models');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const { role, status, enterpriseId, page = 1, pageSize = 20 } = req.query;
    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (enterpriseId) where.enterpriseId = enterpriseId;

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        { model: Enterprise, as: 'enterprise', attributes: ['id', 'name', 'code'] },
      ],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
    });

    res.json({ success: true, data: { total: count, page: parseInt(page), pageSize: parseInt(pageSize), data: rows } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      include: [
        { model: Enterprise, as: 'enterprise', attributes: ['id', 'name', 'code'] },
      ],
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, password, role, name, phone, email, enterpriseId } = req.body;

    if (!username || !password || !role || !name) {
      return res.status(400).json({ success: false, error: '请填写必填字段' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ success: false, error: '用户名已存在' });
    }

    const user = await User.create({
      id: uuidv4(),
      username,
      password,
      role,
      name,
      phone,
      email,
      enterpriseId,
      status: 'active',
    });

    const userData = user.toJSON();
    delete userData.password;

    res.json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, enterpriseId, status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (enterpriseId !== undefined) updateData.enterpriseId = enterpriseId;
    if (status !== undefined) updateData.status = status;

    await user.update(updateData);

    const userData = user.toJSON();
    delete userData.password;

    res.json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    if (oldPassword && user.password !== oldPassword) {
      return res.status(400).json({ success: false, error: '原密码错误' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: '新密码长度不能少于6位' });
    }

    await user.update({ password: newPassword });

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: '请输入用户名和密码' });
    }

    const user = await User.findOne({
      where: { username },
      include: [
        { model: Enterprise, as: 'enterprise' },
      ],
    });

    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    if (user.password !== password) {
      return res.status(400).json({ success: false, error: '密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: '用户已被禁用' });
    }

    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      data: {
        user: userData,
        token: `token_${user.id}_${Date.now()}`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/regulators/list', async (req, res) => {
  try {
    const regulators = await User.findAll({
      where: {
        role: 'regulator',
        status: 'active',
      },
      attributes: ['id', 'name', 'username', 'phone', 'email'],
      order: [['name', 'ASC']],
    });

    res.json({ success: true, data: regulators });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/roles/stats', async (req, res) => {
  try {
    const stats = await User.findAll({
      attributes: ['role', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['role'],
      raw: true,
    });

    const roleMap = {};
    stats.forEach(s => {
      roleMap[s.role] = parseInt(s.count);
    });

    res.json({
      success: true,
      data: roleMap,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
