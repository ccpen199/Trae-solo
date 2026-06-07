const express = require('express');
const { getDb } = require('../db');
const { auth, roleAuth, ROLES } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', auth, roleAuth(ROLES.FAMILY), (req, res) => {
  try {
    const db = getDb();
    const { period = 'weekly' } = req.query;

    const now = new Date();
    let startDate, endDate;

    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      endDate = now.toISOString();
    } else if (period === 'weekly') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      startDate = weekStart.toISOString();
      endDate = now.toISOString();
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = monthStart.toISOString();
      endDate = now.toISOString();
    }

    const devices = db.prepare(
      'SELECT id, name, type FROM devices WHERE user_id = ?'
    ).all(req.user.id);

    let totalPower = 0;
    const deviceStats = devices.map(d => {
      const power = Math.random() * 10 + 2;
      totalPower += power;
      return {
        device_id: d.id,
        device_name: d.name,
        power_consumption: Math.round(power * 10) / 10,
        duration: Math.floor(Math.random() * 100 + 20)
      };
    });

    const avgConsumption = 15.5;
    const savedPercent = totalPower < avgConsumption
      ? Math.round((avgConsumption - totalPower) / avgConsumption * 100)
      : 0;

    const carbonSaved = Math.round(totalPower * 0.785 * 10) / 10;
    const treeEquivalent = Math.round(carbonSaved / 21.77 * 100) / 100;

    res.json({
      period,
      total_power_consumption: Math.round(totalPower * 10) / 10,
      power_unit: 'kWh',
      carbon_saved: carbonSaved,
      carbon_unit: 'kg',
      tree_equivalent: treeEquivalent,
      score: Math.max(60, Math.min(100, 85 + Math.floor(Math.random() * 15))),
      ranking: Math.floor(Math.random() * 1000) + 1,
      saved_percent: savedPercent,
      device_stats: deviceStats,
      tips: [
        '建议将空调设置在26°C，既舒适又节能',
        '冰箱避免频繁开关门，减少冷气流失',
        '洗衣机满载使用，提高能效比'
      ]
    });
  } catch (err) {
    res.status(500).json({ error: '获取报告失败' });
  }
});

router.get('/history', auth, roleAuth(ROLES.FAMILY), (req, res) => {
  try {
    const db = getDb();

    const history = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      history.push({
        date: date.toISOString().split('T')[0],
        power_consumption: Math.round((Math.random() * 8 + 8) * 10) / 10,
        score: Math.floor(Math.random() * 30) + 70
      });
    }

    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: '获取历史数据失败' });
  }
});

router.get('/ranking', auth, roleAuth(ROLES.FAMILY), (req, res) => {
  try {
    const users = [
      { rank: 1, nickname: '绿色达人', score: 98, avatar: '🌿' },
      { rank: 2, nickname: '节能先锋', score: 95, avatar: '🍀' },
      { rank: 3, nickname: '环保卫士', score: 92, avatar: '🌱' },
      { rank: 4, nickname: '低碳生活', score: 88, avatar: '🌳' },
      { rank: 5, nickname: '勤俭持家', score: 85, avatar: '🌻' },
    ];

    const myRank = Math.floor(Math.random() * 100) + 10;

    res.json({
      top_users: users,
      my_rank: myRank,
      total_users: 12580,
      message: '继续保持，您已超越全国大部分用户！'
    });
  } catch (err) {
    res.status(500).json({ error: '获取排名失败' });
  }
});

module.exports = router;
