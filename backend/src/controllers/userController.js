const { db } = require('../models/database');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

const login = async (req, res) => {
  try {
    const { phone, code, third_party_id, third_party_type, nickname, avatar } = req.body;

    if (third_party_id && third_party_type) {
      let user = db.users.find(u => u.third_party_id === third_party_id && u.third_party_type === third_party_type);
      
      if (user) {
        return res.json({ success: true, data: { user, token: generateToken(user) } });
      } else {
        const newNickname = nickname || `用户${Math.floor(Math.random() * 10000)}`;
        const newUser = {
          id: db.users.length + 1,
          nickname: newNickname,
          avatar: avatar || '',
          third_party_id,
          third_party_type,
          vip_level: 0,
          level: 1,
          coins: 100,
          followers: 0,
          following: 0
        };
        db.users.push(newUser);
        return res.json({ success: true, data: { user: newUser, token: generateToken(newUser) } });
      }
    } else if (phone && code) {
      if (code !== '123456') {
        return res.status(400).json({ success: false, message: '验证码错误' });
      }

      let user = db.users.find(u => u.phone === phone);
      
      if (user) {
        return res.json({ success: true, data: { user, token: generateToken(user) } });
      } else {
        const newNickname = `用户${Math.floor(Math.random() * 10000)}`;
        const newUser = {
          id: db.users.length + 1,
          phone,
          nickname: newNickname,
          avatar: '',
          vip_level: 0,
          level: 1,
          coins: 100,
          followers: 0,
          following: 0
        };
        db.users.push(newUser);
        return res.json({ success: true, data: { user: newUser, token: generateToken(newUser) } });
      }
    } else {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

const getProfile = (req, res) => {
  res.json({ success: true, data: req.user });
};

const updateProfile = (req, res) => {
  const { nickname, avatar, signature, location } = req.body;
  const userId = req.user.id;

  const user = db.users.find(u => u.id === userId);
  if (user) {
    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;
    if (signature !== undefined) user.signature = signature;
    if (location) user.location = location;
  }
  
  res.json({ success: true, data: user });
};

const checkIn = (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  const existing = db.check_ins.find(c => c.user_id === userId && c.date === today);
  if (existing) {
    return res.status(400).json({ success: false, message: '今日已签到' });
  }

  db.check_ins.push({ user_id: userId, date: today, points: 10 });
  const user = db.users.find(u => u.id === userId);
  if (user) user.coins += 10;
  
  res.json({ success: true, data: { points: 10, message: '签到成功，获得10积分' } });
};

const followUser = (req, res) => {
  const { following_id } = req.body;
  const follower_id = req.user.id;

  if (follower_id == following_id) {
    return res.status(400).json({ success: false, message: '不能关注自己' });
  }

  const existing = db.follows.find(f => f.follower_id === follower_id && f.following_id === following_id);
  if (!existing) {
    db.follows.push({ follower_id, following_id });
    const follower = db.users.find(u => u.id === follower_id);
    const following = db.users.find(u => u.id === following_id);
    if (follower) follower.following++;
    if (following) following.followers++;
  }
  
  res.json({ success: true, data: { is_followed: true } });
};

const unfollowUser = (req, res) => {
  const { following_id } = req.body;
  const follower_id = req.user.id;

  const index = db.follows.findIndex(f => f.follower_id === follower_id && f.following_id === following_id);
  if (index !== -1) {
    db.follows.splice(index, 1);
    const follower = db.users.find(u => u.id === follower_id);
    const following = db.users.find(u => u.id === following_id);
    if (follower) follower.following--;
    if (following) following.followers--;
  }
  
  res.json({ success: true, data: { is_followed: false } });
};

module.exports = { login, getProfile, updateProfile, checkIn, followUser, unfollowUser };
