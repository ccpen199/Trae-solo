const express = require('express');
const { User, Tag, Achievement, UserAchievement, Friendship, Message } = require('../models');
const { authenticateToken, checkPremium } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      username: req.user.username,
      isPremium: req.user.isPremium,
      coins: req.user.coins,
      level: req.user.level,
      totalFocusTime: req.user.totalFocusTime,
      treesPlanted: req.user.treesPlanted,
      currentTree: req.user.currentTree,
      avatar: req.user.avatar
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { currentTree, avatar } = req.body;
    
    const updateData = {};
    if (currentTree) updateData.currentTree = currentTree;
    if (avatar) updateData.avatar = avatar;
    
    await req.user.update(updateData);
    
    res.json({ success: true });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/tags', authenticateToken, async (req, res) => {
  try {
    const tags = await Tag.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']]
    });
    res.json(tags);
  } catch (error) {
    console.error('获取标签错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/tags', authenticateToken, checkPremium, async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '标签名称不能为空' });
    }

    const tag = await Tag.create({
      userId: req.user.id,
      name,
      color: color || '#4CAF50'
    });

    res.status(201).json(tag);
  } catch (error) {
    console.error('创建标签错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const achievements = await Achievement.findAll();
    const userAchievements = await UserAchievement.findAll({
      where: { userId: req.user.id }
    });
    
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));
    
    const result = achievements.map(a => ({
      ...a.toJSON(),
      unlocked: unlockedIds.has(a.id)
    }));

    res.json(result);
  } catch (error) {
    console.error('获取成就错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/friends', authenticateToken, checkPremium, async (req, res) => {
  try {
    const friendships = await Friendship.findAll({
      where: { userId: req.user.id, status: 'accepted' },
      include: [{ model: User, as: 'friend', attributes: ['id', 'username', 'avatar', 'treesPlanted'] }]
    });

    const pendingRequests = await Friendship.findAll({
      where: { friendId: req.user.id, status: 'pending' },
      include: [{ model: User, attributes: ['id', 'username', 'avatar'] }]
    });

    res.json({
      friends: friendships.map(f => f.friend),
      pendingRequests: pendingRequests.map(f => f.User)
    });
  } catch (error) {
    console.error('获取好友错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/friends/add', authenticateToken, checkPremium, async (req, res) => {
  try {
    const { username } = req.body;
    
    const friend = await User.findOne({ where: { username } });
    if (!friend) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (friend.id === req.user.id) {
      return res.status(400).json({ error: '不能添加自己为好友' });
    }

    const existing = await Friendship.findOne({
      where: {
        userId: req.user.id,
        friendId: friend.id
      }
    });

    if (existing) {
      return res.status(400).json({ error: '好友请求已发送' });
    }

    await Friendship.create({
      userId: req.user.id,
      friendId: friend.id,
      status: 'pending'
    });

    await Message.create({
      userId: friend.id,
      type: 'friend_request',
      content: `${req.user.username} 想添加你为好友`,
      relatedId: req.user.id
    });

    res.json({ success: true, message: '好友请求已发送' });
  } catch (error) {
    console.error('添加好友错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(messages);
  } catch (error) {
    console.error('获取消息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }

    await message.update({ isRead: true });
    res.json({ success: true });
  } catch (error) {
    console.error('标记已读错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
