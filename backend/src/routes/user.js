const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const greenCredit = require('../engines/GreenCredit');
const carbonModel = require('../engines/CarbonModel');
const lbsPickUp = require('../engines/LBSPickUp');

router.get('/profile', authMiddleware, (req, res) => {
  db.get(
    `SELECT id, username, name, phone, role, address, latitude, longitude, green_credit, carbon_reduction, created_at 
     FROM users WHERE id = ?`,
    [req.user.id],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询用户信息失败', error: err.message });
      }

      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      try {
        const creditStats = await greenCredit.getCreditStatistics(req.user.id);
        const carbonFootprint = await carbonModel.getGreenFootprint(req.user.id);

        res.json({
          success: true,
          data: {
            ...user,
            credit_stats: creditStats,
            green_footprint: carbonFootprint
          }
        });
      } catch (statsErr) {
        res.json({
          success: true,
          data: user
        });
      }
    }
  );
});

router.put('/profile', authMiddleware, (req, res) => {
  const { name, phone, address, latitude, longitude } = req.body;
  const userId = req.user.id;

  const updateFields = [];
  const updateValues = [];

  if (name !== undefined) {
    updateFields.push('name = ?');
    updateValues.push(name);
  }
  if (phone !== undefined) {
    updateFields.push('phone = ?');
    updateValues.push(phone);
  }
  if (address !== undefined) {
    updateFields.push('address = ?');
    updateValues.push(address);
  }
  if (latitude !== undefined) {
    updateFields.push('latitude = ?');
    updateValues.push(latitude);
  }
  if (longitude !== undefined) {
    updateFields.push('longitude = ?');
    updateValues.push(longitude);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ success: false, message: '没有需要更新的字段' });
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(userId);

  db.run(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues,
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: '更新用户信息失败', error: err.message });
      }

      res.json({
        success: true,
        message: '更新成功',
        data: { changes: this.changes }
      });
    }
  );
});

router.get('/credit-history', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const history = await greenCredit.getCreditHistory(req.user.id, parseInt(limit));
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: '查询积分历史失败', error: error.message });
  }
});

router.get('/carbon-history', authMiddleware, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const history = await carbonModel.getCarbonHistory(req.user.id, parseInt(limit));
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: '查询碳记录失败', error: error.message });
  }
});

router.get('/green-footprint', authMiddleware, async (req, res) => {
  try {
    const footprint = await carbonModel.getGreenFootprint(req.user.id);
    res.json({ success: true, data: footprint });
  } catch (error) {
    res.status(500).json({ success: false, message: '查询环保足迹失败', error: error.message });
  }
});

router.post('/rider/online', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ success: false, message: '只有骑手可以设置在线状态' });
    }

    const { latitude, longitude } = req.body;
    const result = await lbsPickUp.setRiderStatus(req.user.id, 'online');

    if (latitude && longitude) {
      await lbsPickUp.updateRiderLocation(req.user.id, latitude, longitude);
    }

    res.json({
      success: true,
      message: '已上线',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '设置在线状态失败', error: error.message });
  }
});

router.post('/rider/offline', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ success: false, message: '只有骑手可以设置离线状态' });
    }

    const result = await lbsPickUp.setRiderStatus(req.user.id, 'offline');

    res.json({
      success: true,
      message: '已离线',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '设置离线状态失败', error: error.message });
  }
});

router.post('/rider/update-location', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ success: false, message: '只有骑手可以更新位置' });
    }

    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: '位置信息为必填项' });
    }

    const result = await lbsPickUp.updateRiderLocation(req.user.id, latitude, longitude);

    res.json({
      success: true,
      message: '位置已更新',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新位置失败', error: error.message });
  }
});

router.get('/rider/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ success: false, message: '只有骑手可以查看状态' });
    }

    const rider = await lbsPickUp.getRiderByUserId(req.user.id);

    res.json({
      success: true,
      data: rider
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '查询骑手状态失败', error: error.message });
  }
});

module.exports = router;
