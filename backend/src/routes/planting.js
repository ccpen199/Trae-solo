const express = require('express');
const { Op } = require('sequelize');
const { PlantingRecord, User, Tag, Achievement, UserAchievement } = require('../models');
const { authenticateToken, checkPremium } = require('../middleware/auth');

const router = express.Router();

router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { duration, treeType, tagId } = req.body;
    
    if (duration < 10 || duration > 120 || duration % 5 !== 0) {
      return res.status(400).json({ error: '种植时间必须在10-120分钟之间，且为5的倍数' });
    }

    const activePlanting = await PlantingRecord.findOne({
      where: {
        userId: req.user.id,
        isCompleted: false,
        isWithered: false,
        startTime: {
          [Op.gt]: new Date(Date.now() - duration * 60 * 1000)
        }
      }
    });

    if (activePlanting) {
      return res.status(400).json({ error: '已有正在进行的种植' });
    }

    const planting = await PlantingRecord.create({
      userId: req.user.id,
      treeType: treeType || req.user.currentTree,
      duration,
      tagId,
      startTime: new Date(),
      actualDuration: 0
    });

    res.status(201).json({
      id: planting.id,
      duration: planting.duration,
      treeType: planting.treeType,
      startTime: planting.startTime,
      isBush: duration < 25
    });
  } catch (error) {
    console.error('开始种植错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const { plantingId, actualDuration } = req.body;
    
    const planting = await PlantingRecord.findOne({
      where: { id: plantingId, userId: req.user.id }
    });

    if (!planting) {
      return res.status(404).json({ error: '种植记录不存在' });
    }

    if (planting.isCompleted || planting.isWithered) {
      return res.status(400).json({ error: '种植已完成或已枯萎' });
    }

    const timePassed = (Date.now() - new Date(planting.startTime).getTime()) / 1000 / 60;
    const isWithered = timePassed < planting.duration - 0.5 && actualDuration < planting.duration;
    
    const coinsEarned = isWithered ? 0 : Math.floor(planting.duration / 10) * 2;

    planting.isCompleted = !isWithered;
    planting.isWithered = isWithered;
    planting.actualDuration = actualDuration || Math.min(timePassed, planting.duration);
    planting.endTime = new Date();
    planting.coinsEarned = coinsEarned;
    
    await planting.save();

    if (!isWithered) {
      await req.user.update({
        coins: req.user.coins + coinsEarned,
        totalFocusTime: req.user.totalFocusTime + planting.duration,
        treesPlanted: req.user.treesPlanted + 1
      });

      if (planting.tagId) {
        const tag = await Tag.findByPk(planting.tagId);
        if (tag) {
          await tag.update({ totalTime: tag.totalTime + planting.duration });
        }
      }

      await checkAndUnlockAchievements(req.user.id);
    }

    res.json({
      success: true,
      isWithered,
      coinsEarned,
      user: {
        coins: req.user.coins + coinsEarned,
        totalFocusTime: req.user.totalFocusTime + (isWithered ? 0 : planting.duration),
        treesPlanted: req.user.treesPlanted + (isWithered ? 0 : 1)
      }
    });
  } catch (error) {
    console.error('完成种植错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/wither', authenticateToken, async (req, res) => {
  try {
    const { plantingId } = req.body;
    
    const planting = await PlantingRecord.findOne({
      where: { id: plantingId, userId: req.user.id }
    });

    if (!planting) {
      return res.status(404).json({ error: '种植记录不存在' });
    }

    if (planting.isCompleted || planting.isWithered) {
      return res.status(400).json({ error: '种植已完成或已枯萎' });
    }

    const timePassed = (Date.now() - new Date(planting.startTime).getTime()) / 1000;
    
    if (timePassed < 10) {
      await planting.destroy();
      return res.json({ success: true, isWithered: false, message: '种植已取消' });
    }

    planting.isWithered = true;
    planting.actualDuration = Math.floor(timePassed / 60);
    planting.endTime = new Date();
    await planting.save();

    res.json({
      success: true,
      isWithered: true,
      message: '树已枯萎'
    });
  } catch (error) {
    console.error('枯萎错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/records', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const { count, rows } = await PlantingRecord.findAndCountAll({
      where: { userId: req.user.id },
      order: [['startTime', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      records: rows,
      total: count,
      page: parseInt(page)
    });
  } catch (error) {
    console.error('获取记录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/forest', authenticateToken, async (req, res) => {
  try {
    const records = await PlantingRecord.findAll({
      where: {
        userId: req.user.id,
        isCompleted: true
      },
      order: [['startTime', 'DESC']],
      limit: 100
    });

    const stats = {
      totalTrees: records.length,
      totalTime: records.reduce((sum, r) => sum + r.duration, 0),
      witheredCount: await PlantingRecord.count({
        where: { userId: req.user.id, isWithered: true }
      })
    };

    res.json({
      trees: records,
      stats
    });
  } catch (error) {
    console.error('获取森林错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

async function checkAndUnlockAchievements(userId) {
  const user = await User.findByPk(userId);
  const achievements = await Achievement.findAll();

  for (const achievement of achievements) {
    const existing = await UserAchievement.findOne({
      where: { userId, achievementId: achievement.id }
    });
    
    if (existing) continue;

    let unlocked = false;
    switch (achievement.requirementType) {
      case 'trees':
        unlocked = user.treesPlanted >= achievement.requirement;
        break;
      case 'time':
        unlocked = user.totalFocusTime >= achievement.requirement;
        break;
    }

    if (unlocked) {
      await UserAchievement.create({ userId, achievementId: achievement.id });
      await user.update({ coins: user.coins + achievement.coinReward });
    }
  }
}

module.exports = router;
