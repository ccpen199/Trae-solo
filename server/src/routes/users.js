const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');

router.get('/teachers', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', status: 'active' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ teachers });
  } catch (error) {
    res.status(500).json({ message: '获取教师列表失败', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: '获取用户信息失败', error: error.message });
  }
});

router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取用户列表失败', error: error.message });
  }
});

router.put('/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({ message: '无效的状态值' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ message: '状态更新成功', user });
  } catch (error) {
    res.status(500).json({ message: '更新状态失败', error: error.message });
  }
});

module.exports = router;
