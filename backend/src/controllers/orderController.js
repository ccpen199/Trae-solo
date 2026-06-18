const { Order, Booking, User, Device, DeviceUsage, FunnelEvent } = require('../models');
const { generateOrderNo, calculateRefund } = require('../utils/order');
const deviceProtocol = require('../protocols');

exports.getOrders = async (req, res, next) => {
  try {
    const { orderType, paymentStatus, status, page = 1, pageSize = 20 } = req.query;

    const filter = {};
    if (orderType) filter.orderType = orderType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (status) filter.status = status;

    if (req.user.role === 'resident') {
      filter.userId = req.user._id;
    }

    const orders = await Order.find(filter)
      .populate('deviceId', 'deviceCode name deviceType')
      .populate('bookingId', 'bookingNo startTime endTime')
      .populate('userId', 'nickname phone')
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        list: orders,
        pagination: { page: Number(page), pageSize: Number(pageSize), total },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('deviceId', 'deviceCode name deviceType')
      .populate('bookingId', 'bookingNo startTime endTime')
      .populate('userId', 'nickname phone');

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (req.user.role === 'resident' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限查看' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { bookingId, orderType = 'booking', paymentMethod, amount, voucherId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: '预约不存在' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限操作' });
    }

    const finalAmount = amount || booking.pricing.finalAmount;

    const order = await Order.create({
      orderNo: generateOrderNo(),
      userId: req.user._id,
      bookingId,
      deviceId: booking.deviceId,
      orderType,
      paymentMethod,
      amount: finalAmount,
      voucherUsed: voucherId,
      status: 'pending',
      paymentStatus: 'unpaid',
      source: req.headers['source'] || 'web',
      expiredAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    booking.orderId = order._id;
    await booking.save();

    await FunnelEvent.create({
      userId: req.user._id,
      event: 'payment_init',
      deviceId: booking.deviceId,
      deviceType: booking.deviceType,
      communityId: req.user.communityId,
      source: req.headers['source'] || 'web',
      metadata: { orderId: order._id, amount: finalAmount },
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.payOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.userId.toString() !== req.user._id.toString() && req.user.role === 'resident') {
      return res.status(403).json({ message: '无权限操作' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: '订单已支付' });
    }

    if (new Date() > order.expiredAt) {
      order.status = 'cancelled';
      order.paymentStatus = 'cancelled';
      await order.save();
      return res.status(400).json({ message: '订单已过期' });
    }

    const user = await User.findById(req.user._id);
    let paidAmount = order.amount;
    let balanceUsed = 0;

    if (paymentMethod === 'balance') {
      if (user.balance < order.amount) {
        return res.status(400).json({ message: '余额不足' });
      }
      user.balance -= order.amount;
      balanceUsed = order.amount;
      paidAmount = order.amount;
      await user.save();
    }

    order.paymentMethod = paymentMethod;
    order.paymentStatus = 'paid';
    order.status = 'processing';
    order.paidAmount = paidAmount;
    order.balanceUsed = balanceUsed;
    order.transactionId = transactionId || `sim_${Date.now()}`;
    order.paidAt = new Date();
    await order.save();

    const booking = await Booking.findById(order.bookingId);
    if (booking) {
      booking.status = 'confirmed';
      await booking.save();
    }

    await FunnelEvent.create({
      userId: req.user._id,
      event: 'payment_success',
      deviceId: order.deviceId,
      deviceType: booking?.deviceType,
      communityId: req.user.communityId,
      source: req.headers['source'] || 'web',
      metadata: { orderId: order._id, amount: order.amount },
    });

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.completeOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ message: '订单已完成' });
    }

    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.handleInterrupt = async (req, res, next) => {
  try {
    const { orderId, interruptReason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    const booking = await Booking.findById(order.bookingId);
    if (!booking) {
      return res.status(404).json({ message: '预约不存在' });
    }

    const deviceUsage = await DeviceUsage.findOne({ bookingId: booking._id });
    if (!deviceUsage) {
      return res.status(404).json({ message: '使用记录不存在' });
    }

    const usedDuration = Math.ceil((Date.now() - deviceUsage.startTime.getTime()) / 60000);
    const refundAmount = calculateRefund(order, usedDuration, booking.duration);

    await deviceProtocol.stopDevice(booking.deviceId, {
      userId: req.user._id,
      params: { usedDuration },
    });

    deviceUsage.endTime = new Date();
    deviceUsage.actualDuration = usedDuration;
    deviceUsage.status = 'interrupted';
    deviceUsage.interruptReason = interruptReason;
    await deviceUsage.save();

    const device = await Device.findById(booking.deviceId);
    if (device) {
      device.workingStatus = 'idle';
      device.totalDuration += usedDuration;
      await device.save();
    }

    order.interruptInfo = {
      interrupted: true,
      interruptTime: new Date(),
      interruptReason,
      usedDuration,
      autoRefund: refundAmount > 0,
    };

    if (refundAmount > 0) {
      order.refundAmount = refundAmount;
      order.refundReason = `异常中断退款: ${interruptReason}`;
      order.paymentStatus = 'refunding';
      order.refundId = `ref_${Date.now()}`;

      const user = await User.findById(order.userId);
      if (user) {
        user.balance += refundAmount;
        await user.save();
      }

      order.paymentStatus = 'refunded';
      order.status = 'refunded';
    }

    booking.status = refundAmount > 0 ? 'refunded' : 'completed';
    booking.endTime = new Date();
    await booking.save();

    order.status = refundAmount > 0 ? 'refunded' : 'completed';
    await order.save();

    res.json({
      success: true,
      data: {
        order,
        refundAmount,
        usedDuration,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.recharge = async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: '充值金额无效' });
    }

    const order = await Order.create({
      orderNo: generateOrderNo('REC'),
      userId: req.user._id,
      orderType: 'recharge',
      paymentMethod,
      amount,
      status: 'processing',
      paymentStatus: 'paid',
      paidAmount: amount,
      paidAt: new Date(),
      completedAt: new Date(),
      transactionId: `rec_${Date.now()}`,
      source: req.headers['source'] || 'web',
    });

    const user = await User.findById(req.user._id);
    user.balance += amount;
    await user.save();

    order.status = 'completed';
    await order.save();

    res.status(201).json({
      success: true,
      data: {
        order,
        newBalance: user.balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    const balanceOrders = await Order.find({
      userId: req.user._id,
      orderType: { $in: ['booking', 'recharge', 'refund'] },
      paymentStatus: { $in: ['paid', 'refunded'] },
    }).sort({ createdAt: -1 }).limit(20);

    res.json({
      success: true,
      data: {
        balance: user.balance,
        ecoPoints: user.ecoPoints,
        streakDays: user.streakDays,
        transactions: balanceOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};
