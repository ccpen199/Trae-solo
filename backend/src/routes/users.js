const express = require('express');
const jwt = require('jsonwebtoken');
const { runQuery, getQuery } = require('../database');
const { authenticate } = require('../middleware');

const router = express.Router();

router.post('/select-role', async (req, res) => {
  try {
    const { role, phone } = req.body;
    
    if (!role || !['student', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '请选择有效的身份'
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '请输入手机号'
      });
    }

    let user = await getQuery('SELECT * FROM users WHERE phone = ?', [phone]);
    
    if (user) {
      if (user.role !== role) {
        return res.status(400).json({
          success: false,
          message: '该手机号已注册其他身份'
        });
      }
    } else {
      const result = await runQuery(
        'INSERT INTO users (role, phone) VALUES (?, ?)',
        [role, phone]
      );
      
      if (role === 'student') {
        await runQuery(
          'INSERT INTO student_profiles (user_id) VALUES (?)',
          [result.lastID]
        );
      } else {
        await runQuery(
          'INSERT INTO teacher_profiles (user_id) VALUES (?)',
          [result.lastID]
        );
      }
      
      user = await getQuery('SELECT * FROM users WHERE id = ?', [result.lastID]);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          role: user.role,
          name: user.name,
          phone: user.phone,
          isFirstTime: !user.name
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '选择身份失败',
      error: error.message
    });
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = req.user;
    let profile = null;
    
    if (user.role === 'student') {
      profile = await getQuery('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);
    } else {
      profile = await getQuery('SELECT * FROM teacher_profiles WHERE user_id = ?', [user.id]);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          role: user.role,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar,
          id_card: user.id_card,
          teacher_cert: user.teacher_cert,
          id_card_verified: user.id_card_verified,
          teacher_cert_verified: user.teacher_cert_verified,
          is_online: user.is_online
        },
        profile
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { name, id_card, teacher_cert, ...profileData } = req.body;
    
    const updateFields = [];
    const updateValues = [];
    
    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    
    if (id_card && !user.id_card) {
      updateFields.push('id_card = ?');
      updateValues.push(id_card);
    }
    
    if (teacher_cert && !user.teacher_cert) {
      updateFields.push('teacher_cert = ?');
      updateValues.push(teacher_cert);
    }
    
    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(user.id);
      await runQuery(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    if (user.role === 'student') {
      const { grade, address } = profileData;
      await runQuery(
        'UPDATE student_profiles SET grade = ?, address = ? WHERE user_id = ?',
        [grade || null, address || null, user.id]
      );
    } else {
      const { subjects, experience, introduction, hourly_rate } = profileData;
      await runQuery(
        'UPDATE teacher_profiles SET subjects = ?, experience = ?, introduction = ?, hourly_rate = ? WHERE user_id = ?',
        [subjects || null, experience || null, introduction || null, hourly_rate || null, user.id]
      );
    }

    res.json({
      success: true,
      message: '保存成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '保存失败',
      error: error.message
    });
  }
});

router.post('/toggle-online', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const newStatus = user.is_online ? 0 : 1;
    
    await runQuery('UPDATE users SET is_online = ? WHERE id = ?', [newStatus, user.id]);
    
    res.json({
      success: true,
      data: {
        is_online: newStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '操作失败',
      error: error.message
    });
  }
});

module.exports = router;
