const express = require('express');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const StudentAccount = require('../models/StudentAccount');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请输入用户名和密码' });
    }

    const admin = await AdminUser.findOne({ username });
    if (!admin) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    if (admin.status !== 'active') {
      return res.status(401).json({ success: false, message: '账户已被禁用' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    admin.lastLoginTime = Date.now();
    admin.loginCount += 1;
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          name: admin.name,
          role: admin.role,
          email: admin.email,
          avatar: admin.avatar,
          permissions: admin.permissions
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/student/login', async (req, res, next) => {
  try {
    const { studentId, password, phone } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({ success: false, message: '请输入学号和密码' });
    }

    const student = await StudentAccount.findOne({ studentId }).populate('buildingId');
    if (!student) {
      return res.status(401).json({ success: false, message: '账户不存在' });
    }

    if (student.status === 'frozen' || student.status === 'lost') {
      return res.status(401).json({ success: false, message: '账户已被冻结或挂失' });
    }

    if (password !== student.phone?.slice(-6)) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }

    student.lastLoginTime = Date.now();
    await student.save();

    const token = jwt.sign(
      { studentId: student.studentId, name: student.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        student: {
          studentId: student.studentId,
          name: student.name,
          gender: student.gender,
          grade: student.grade,
          major: student.major,
          department: student.department,
          phone: student.phone,
          balance: student.balance,
          status: student.status,
          building: student.buildingId?.buildingName,
          roomNumber: student.roomNumber,
          cards: student.cards.filter(c => c.status === 'active'),
          totalConsumption: student.totalConsumption,
          totalRecharge: student.totalRecharge
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/student/register', async (req, res, next) => {
  try {
    const { studentId, name, gender, grade, major, department, phone, idCardNumber, buildingId, roomNumber } = req.body;

    if (!studentId || !name || !grade || !phone) {
      return res.status(400).json({ success: false, message: '缺少必要信息' });
    }

    const existing = await StudentAccount.findOne({ $or: [{ studentId }, { phone }] });
    if (existing) {
      return res.status(400).json({ success: false, message: '学号或手机号已注册' });
    }

    const { generateCardNumber } = require('../utils/generateId');
    const cardNumber = generateCardNumber();

    const student = new StudentAccount({
      studentId,
      name,
      gender,
      grade,
      major,
      department,
      phone,
      idCardNumber,
      buildingId,
      roomNumber,
      cards: [{
        cardNumber,
        cardType: 'physical',
        status: 'active',
        isDefault: true
      }]
    });

    await student.save();

    const token = jwt.sign(
      { studentId: student.studentId, name: student.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        student: {
          studentId: student.studentId,
          name: student.name,
          phone: student.phone,
          cardNumber
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/profile', authenticateAdmin, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.admin._id,
        username: req.admin.username,
        name: req.admin.name,
        role: req.admin.role,
        email: req.admin.email,
        phone: req.admin.phone,
        avatar: req.admin.avatar,
        permissions: req.admin.permissions,
        department: req.admin.department
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/logout', authenticateAdmin, (req, res) => {
  res.json({ success: true, message: '退出成功' });
});

module.exports = router;
