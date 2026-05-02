const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { v4: uuidv4 } = require('uuid');

router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { student: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('course', 'title coverImage price teacher')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取订单列表失败', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      student: req.user._id
    }).populate('course', 'title coverImage price teacher');

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: '获取订单详情失败', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: '课程不存在' });
    }

    if (course.status !== 'published') {
      return res.status(400).json({ message: '课程未发布' });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: { $in: ['active', 'completed'] }
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: '您已购买该课程' });
    }

    const existingOrder = await Order.findOne({
      student: req.user._id,
      course: courseId,
      status: 'pending'
    });

    if (existingOrder) {
      return res.json({ 
        message: '存在未支付订单',
        order: existingOrder 
      });
    }

    const orderNo = `ORD${Date.now()}${uuidv4().slice(0, 6).toUpperCase()}`;
    
    const order = new Order({
      orderNo,
      student: req.user._id,
      course: courseId,
      amount: course.price,
      originalAmount: course.originalPrice || course.price
    });

    await order.save();
    await order.populate('course', 'title coverImage price');

    res.status(201).json({ 
      message: '订单创建成功',
      order 
    });
  } catch (error) {
    res.status(500).json({ message: '创建订单失败', error: error.message });
  }
});

router.post('/:id/pay', auth, async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    
    const order = await Order.findOne({
      _id: req.params.id,
      student: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: '订单状态不正确' });
    }

    order.status = 'paid';
    order.paymentMethod = paymentMethod || 'online';
    order.paidAt = new Date();
    order.transactionId = `TXN${Date.now()}${uuidv4().slice(0, 8)}`;

    await order.save();

    const enrollment = new Enrollment({
      student: req.user._id,
      course: order.course,
      orderId: order._id,
      status: 'active',
      enrolledAt: new Date(),
      lastAccessedAt: new Date()
    });

    await enrollment.save();

    await Course.findByIdAndUpdate(order.course, {
      $inc: { enrollmentCount: 1 }
    });

    await order.populate('course', 'title coverImage');

    res.json({ 
      message: '支付成功，已开通课程',
      order,
      enrollment: {
        id: enrollment._id,
        progress: enrollment.progress,
        status: enrollment.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: '支付失败', error: error.message });
  }
});

router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      student: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: '只能取消未支付订单' });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    res.json({ message: '订单已取消' });
  } catch (error) {
    res.status(500).json({ message: '取消订单失败', error: error.message });
  }
});

module.exports = router;
