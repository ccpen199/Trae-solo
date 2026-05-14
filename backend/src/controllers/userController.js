const db = require('../models/database');
const path = require('path');
const fs = require('fs');

const updateProfile = async (req, res) => {
  try {
    const {
      nickname,
      gender,
      age,
      graduationStatus,
      industry,
      profession,
      hometown,
      currentCity
    } = req.body;

    const userId = req.user.id;

    db.prepare(`
      UPDATE users 
      SET nickname = ?, gender = ?, age = ?, graduation_status = ?, 
          industry = ?, profession = ?, hometown = ?, current_city = ?,
          is_profile_complete = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nickname, gender, age, graduationStatus, industry, profession, hometown, currentCity, userId);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: '资料更新成功',
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        age: user.age,
        graduationStatus: user.graduation_status,
        industry: user.industry,
        profession: user.profession,
        hometown: user.hometown,
        currentCity: user.current_city,
        isProfileComplete: user.is_profile_complete
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新资料失败'
    });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    const userId = req.user.id;
    const avatarUrl = `/uploads/${req.file.filename}`;

    db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(avatarUrl, userId);

    res.json({
      success: true,
      message: '头像上传成功',
      data: { avatar: avatarUrl }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '上传头像失败'
    });
  }
};

const getRandomMatches = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const limit = parseInt(req.query.limit) || 10;

    let query = `
      SELECT 
        u.id, u.nickname, u.avatar, u.gender, u.age, 
        u.graduation_status as graduationStatus,
        u.industry, u.profession, u.hometown, u.current_city as currentCity,
        q.id as questionId, q.content as question
      FROM users u
      LEFT JOIN questions q ON q.user_id = u.id
      WHERE u.is_profile_complete = 1
    `;

    if (userId) {
      query += ` AND u.id != ${userId}`;
    }

    query += ` ORDER BY RANDOM() LIMIT ${limit}`;

    const users = db.prepare(query).all();

    const formattedUsers = users.map(user => ({
      id: user.id,
      nickname: user.nickname || '匿名用户',
      avatar: user.avatar || 'https://via.placeholder.com/150',
      gender: user.gender,
      age: user.age,
      graduationStatus: user.graduationStatus,
      industry: user.industry,
      profession: user.profession,
      hometown: user.hometown,
      currentCity: user.currentCity,
      question: user.question ? { id: user.questionId, content: user.question } : null
    }));

    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取匹配失败'
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const question = db.prepare('SELECT * FROM questions WHERE user_id = ? LIMIT 1').get(userId);

    res.json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname || '匿名用户',
        avatar: user.avatar || 'https://via.placeholder.com/150',
        gender: user.gender,
        age: user.age,
        graduationStatus: user.graduation_status,
        industry: user.industry,
        profession: user.profession,
        hometown: user.hometown,
        currentCity: user.current_city,
        question: question ? { id: question.id, content: question.content } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户资料失败'
    });
  }
};

const setQuestion = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '请输入问题内容'
      });
    }

    db.prepare('DELETE FROM questions WHERE user_id = ?').run(userId);

    const result = db.prepare('INSERT INTO questions (user_id, content) VALUES (?, ?)')
      .run(userId, content);

    res.json({
      success: true,
      message: '问题设置成功',
      data: { id: result.lastInsertRowid, content }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '设置问题失败'
    });
  }
};

module.exports = {
  updateProfile,
  uploadAvatar,
  getRandomMatches,
  getUserProfile,
  setQuestion
};
