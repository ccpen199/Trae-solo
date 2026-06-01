const express = require('express');
const { TreeType, User, Music, UserMusic } = require('../models');
const { authenticateToken, checkPremium } = require('../middleware/auth');

const router = express.Router();

router.get('/trees', authenticateToken, async (req, res) => {
  try {
    const trees = await TreeType.findAll();
    res.json(trees);
  } catch (error) {
    console.error('获取树种错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/trees/buy', authenticateToken, checkPremium, async (req, res) => {
  try {
    const { treeId } = req.body;
    
    const tree = await TreeType.findByPk(treeId);
    if (!tree) {
      return res.status(404).json({ error: '树种不存在' });
    }

    if (req.user.coins < tree.price) {
      return res.status(400).json({ error: '金币不足' });
    }

    await req.user.update({ coins: req.user.coins - tree.price });

    res.json({
      success: true,
      coins: req.user.coins - tree.price
    });
  } catch (error) {
    console.error('购买树种错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/music', authenticateToken, async (req, res) => {
  try {
    const music = await Music.findAll();
    const userMusic = await UserMusic.findAll({ where: { userId: req.user.id } });
    const ownedIds = new Set(userMusic.map(um => um.musicId));

    const result = music.map(m => ({
      ...m.toJSON(),
      owned: ownedIds.has(m.id)
    }));

    res.json(result);
  } catch (error) {
    console.error('获取音乐错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
