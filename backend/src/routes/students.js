const express = require('express');
const StudentAccount = require('../models/StudentAccount');
const Transaction = require('../models/Transaction');
const Device = require('../models/Device');
const EnergyUsage = require('../models/EnergyUsage');
const { authenticateAdmin, authenticateStudent, requireRole } = require('../middleware/auth');
const { generateTransactionId, generateCardNumber, generateEnergyRecordId } = require('../utils/generateId');

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, grade, buildingId, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (grade) query.grade = grade;
    if (buildingId) query.buildingId = buildingId;
    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await StudentAccount.find(query)
      .populate('buildingId', 'buildingName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StudentAccount.countDocuments(query);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/statistics', authenticateAdmin, async (req, res, next) => {
  try {
    const total = await StudentAccount.countDocuments();
    const active = await StudentAccount.countDocuments({ status: 'active' });
    const frozen = await StudentAccount.countDocuments({ status: 'frozen' });
    const lost = await StudentAccount.countDocuments({ status: 'lost' });

    const totalBalance = await StudentAccount.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    const gradeStats = await StudentAccount.aggregate([
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
          avgBalance: { $avg: '$balance' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalRecharge = await StudentAccount.aggregate([
      { $group: { _id: null, total: { $sum: '$totalRecharge' } } }
    ]);

    const totalConsumption = await StudentAccount.aggregate([
      { $group: { _id: null, total: { $sum: '$totalConsumption' } } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        frozen,
        lost,
        totalBalance: totalBalance[0]?.total || 0,
        totalRecharge: totalRecharge[0]?.total || 0,
        totalConsumption: totalConsumption[0]?.total || 0,
        gradeStats
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', authenticateStudent, async (req, res, next) => {
  try {
    const student = await StudentAccount.findOne({ studentId: req.student.studentId })
      .populate('buildingId', 'buildingName');

    if (!student) {
      return res.status(404).json({ success: false, message: '账户不存在' });
    }

    res.json({
      success: true,
      data: {
        studentId: student.studentId,
        name: student.name,
        gender: student.gender,
        grade: student.grade,
        major: student.major,
        department: student.department,
        phone: student.phone,
        email: student.email,
        balance: student.balance,
        frozenBalance: student.frozenBalance,
        overdraftThreshold: student.overdraftThreshold,
        status: student.status,
        building: student.buildingId?.buildingName,
        roomNumber: student.roomNumber,
        cards: student.cards,
        totalRecharge: student.totalRecharge,
        totalConsumption: student.totalConsumption,
        registrationDate: student.registrationDate,
        lastLoginTime: student.lastLoginTime
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:studentId', authenticateAdmin, async (req, res, next) => {
  try {
    const student = await StudentAccount.findOne({ studentId: req.params.studentId })
      .populate('buildingId', 'buildingName');

    if (!student) {
      return res.status(404).json({ success: false, message: '学生不存在' });
    }

    const recentTransactions = await Transaction.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        student,
        recentTransactions
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operator'), async (req, res, next) => {
  try {
    const { studentId, name, gender, grade, major, department, phone, idCardNumber, buildingId, roomNumber } = req.body;

    const existing = await StudentAccount.findOne({ $or: [{ studentId }, { phone }] });
    if (existing) {
      return res.status(400).json({ success: false, message: '学号或手机号已存在' });
    }

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

    res.status(201).json({
      success: true,
      message: '学生账户创建成功',
      data: student
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operator'), async (req, res, next) => {
  try {
    const student = await StudentAccount.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: '学生不存在' });
    }

    res.json({
      success: true,
      message: '学生信息更新成功',
      data: student
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:studentId/lost', authenticateStudent, async (req, res, next) => {
  try {
    const { loseReason } = req.body;
    const student = await StudentAccount.findOne({ studentId: req.params.studentId });

    if (!student) {
      return res.status(404).json({ success: false, message: '账户不存在' });
    }

    if (student.studentId !== req.student.studentId) {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    student.status = 'lost';
    student.lostDate = Date.now();
    student.loseReason = loseReason;
    student.cards.forEach(card => {
      if (card.status === 'active') {
        card.status = 'lost';
      }
    });
    student.updatedAt = Date.now();
    await student.save();

    res.json({
      success: true,
      message: '挂失成功，账户已冻结'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:studentId/unlost', authenticateStudent, async (req, res, next) => {
  try {
    const student = await StudentAccount.findOne({ studentId: req.params.studentId });

    if (!student) {
      return res.status(404).json({ success: false, message: '账户不存在' });
    }

    if (student.studentId !== req.student.studentId) {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    student.status = 'active';
    student.loseReason = undefined;
    student.cards.forEach(card => {
      if (card.status === 'lost') {
        card.status = 'active';
      }
    });
    student.updatedAt = Date.now();
    await student.save();

    res.json({
      success: true,
      message: '解挂成功，账户已恢复'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:studentId/recharge', authenticateStudent, async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: '充值金额无效' });
    }

    const student = await StudentAccount.findOne({ studentId: req.params.studentId });
    if (!student || student.studentId !== req.student.studentId) {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    if (student.status !== 'active') {
      return res.status(400).json({ success: false, message: '账户状态异常' });
    }

    const transactionId = generateTransactionId();
    const newBalance = student.balance + amount;

    const transaction = new Transaction({
      transactionId,
      studentId: student.studentId,
      accountId: student._id,
      type: 'recharge',
      amount,
      balanceAfter: newBalance,
      paymentMethod,
      status: 'success',
      channel: 'mini_program',
      thirdPartyTransactionId: `MOCK_${Date.now()}`,
      completedAt: Date.now()
    });

    await transaction.save();

    student.balance = newBalance;
    student.totalRecharge += amount;
    student.updatedAt = Date.now();
    await student.save();

    res.json({
      success: true,
      message: '充值成功',
      data: {
        transactionId,
        amount,
        balance: newBalance,
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:studentId/transactions', authenticateStudent, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const query = { studentId: req.params.studentId };

    if (req.student.studentId !== req.params.studentId) {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    if (type) query.type = type;
    if (startDate) query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:studentId/cards', authenticateStudent, async (req, res, next) => {
  try {
    const { cardNumber, cardType } = req.body;
    const student = await StudentAccount.findOne({ studentId: req.params.studentId });

    if (!student || student.studentId !== req.student.studentId) {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    const newCardNumber = cardNumber || generateCardNumber();
    student.cards.push({
      cardNumber: newCardNumber,
      cardType: cardType || 'virtual',
      status: 'active'
    });
    student.updatedAt = Date.now();
    await student.save();

    res.json({
      success: true,
      message: '卡片绑定成功',
      data: { cardNumber: newCardNumber }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:studentId/use-water', authenticateStudent, async (req, res, next) => {
  try {
    const { deviceId, duration, waterVolume, avgTemperature, startTime, endTime } = req.body;

    const student = await StudentAccount.findOne({ studentId: req.params.studentId });
    if (!student || student.studentId !== req.student.studentId) {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    if (student.status !== 'active') {
      return res.status(400).json({ success: false, message: '账户状态异常' });
    }

    const device = await Device.findOne({ deviceId }).populate('buildingId');
    if (!device || device.status !== 'online') {
      return res.status(400).json({ success: false, message: '设备不可用' });
    }

    const unitPrice = 0.05;
    const cost = parseFloat((waterVolume * unitPrice).toFixed(2));

    if (student.balance < cost && student.balance + student.overdraftThreshold < cost) {
      return res.status(400).json({ success: false, message: '余额不足，请先充值' });
    }

    const transactionId = generateTransactionId();
    const newBalance = parseFloat((student.balance - cost).toFixed(2));

    const transaction = new Transaction({
      transactionId,
      studentId: student.studentId,
      accountId: student._id,
      type: 'consumption',
      subType: 'hot_water',
      amount: -cost,
      balanceAfter: newBalance,
      paymentMethod: 'balance',
      deviceId,
      deviceInfo: {
        deviceName: device.deviceName,
        location: device.location,
        buildingId: device.buildingId?._id
      },
      waterUsage: waterVolume,
      waterTemperature: avgTemperature,
      duration,
      status: 'success',
      channel: 'device',
      completedAt: Date.now()
    });
    await transaction.save();

    const date = new Date(startTime);
    const month = date.getMonth() + 1;
    let season;
    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    else season = 'winter';

    const energyRecordId = generateEnergyRecordId();
    const energyUsage = new EnergyUsage({
      recordId: energyRecordId,
      deviceId,
      buildingId: device.buildingId?._id,
      floor: device.floor,
      studentId: student.studentId,
      usageType: 'hot_water',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      waterVolume,
      avgFlowRate: duration > 0 ? parseFloat((waterVolume / (duration / 60)).toFixed(2)) : 0,
      avgTemperature,
      cost,
      unitPrice,
      season,
      hourOfDay: date.getHours(),
      dayOfWeek: date.getDay(),
      month,
      year: date.getFullYear(),
      transactionId
    });
    await energyUsage.save();

    student.balance = newBalance;
    student.totalConsumption = parseFloat((student.totalConsumption + cost).toFixed(2));
    student.updatedAt = Date.now();
    await student.save();

    device.lastWaterUsage = waterVolume;
    device.totalWaterUsage += waterVolume;
    device.currentFlowRate = 0;
    device.valveStatus = 'closed';
    device.updatedAt = Date.now();
    await device.save();

    res.json({
      success: true,
      message: '用水结算成功',
      data: {
        transactionId,
        waterVolume,
        cost,
        balance: newBalance,
        duration
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
