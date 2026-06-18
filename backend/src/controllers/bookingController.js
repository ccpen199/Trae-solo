const dayjs = require('dayjs');
const { Booking, Device, Order, FunnelEvent, DeviceUsage } = require('../models');
const { generateBookingNo, calculatePrice } = require('../utils/order');
const deviceProtocol = require('../protocols');

exports.getBookings = async (req, res, next) => {
  try {
    const { status, deviceType, page = 1, pageSize = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (deviceType) filter.deviceType = deviceType;

    if (req.user.role === 'resident') {
      filter.userId = req.user._id;
    }

    const bookings = await Booking.find(filter)
      .populate('deviceId', 'deviceCode name deviceType location')
      .populate('userId', 'nickname phone')
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        list: bookings,
        pagination: { page: Number(page), pageSize: Number(pageSize), total },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('deviceId', 'deviceCode name deviceType location')
      .populate('userId', 'nickname phone');

    if (!booking) {
      return res.status(404).json({ message: '预约不存在' });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const { deviceId, startTime, endTime, mode, duration } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }

    if (device.status !== 'online') {
      return res.status(400).json({ message: '设备不可用' });
    }

    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const actualDuration = duration || end.diff(start, 'minute');

    if (actualDuration <= 0) {
      return res.status(400).json({ message: '预约时长无效' });
    }

    const conflict = await Booking.findOne({
      deviceId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      $or: [
        { startTime: { $lt: end.toDate() }, endTime: { $gt: start.toDate() } },
      ],
    });

    if (conflict) {
      return res.status(400).json({ message: '该时段已被预约' });
    }

    const pricing = calculatePrice(device.deviceType, mode, actualDuration);
    const finalAmount = pricing.totalAmount;

    const booking = await Booking.create({
      bookingNo: generateBookingNo(),
      userId: req.user._id,
      deviceId,
      deviceType: device.deviceType,
      startTime: start.toDate(),
      endTime: end.toDate(),
      duration: actualDuration,
      mode,
      pricing: {
        ...pricing,
        finalAmount,
        discountAmount: 0,
      },
      status: 'pending',
      source: req.headers['source'] || 'web',
      timeSlot: `${start.format('HH:mm')}-${end.format('HH:mm')}`,
    });

    device.workingStatus = 'reserved';
    await device.save();

    await FunnelEvent.create({
      userId: req.user._id,
      event: 'create_booking',
      deviceId: device._id,
      deviceType: device.deviceType,
      communityId: device.communityId,
      source: req.headers['source'] || 'web',
      metadata: { bookingId: booking._id },
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

exports.confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: '预约不存在' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: '预约状态错误' });
    }

    booking.status = 'confirmed';
    await booking.save();

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: '预约不存在' });
    }

    if (booking.userId.toString() !== req.user._id.toString() && req.user.role === 'resident') {
      return res.status(403).json({ message: '无权限取消' });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: '预约状态不允许取消' });
    }

    const device = await Device.findById(booking.deviceId);
    if (device && device.workingStatus === 'reserved') {
      device.workingStatus = 'idle';
      await device.save();
    }

    booking.status = 'cancelled';
    await booking.save();

    await FunnelEvent.create({
      userId: req.user._id,
      event: 'cancel_booking',
      deviceId: booking.deviceId,
      deviceType: booking.deviceType,
      communityId: device?.communityId,
      source: req.headers['source'] || 'web',
      metadata: { bookingId: booking._id, reason },
    });

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

exports.startBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: '预约不存在' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限操作' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: '预约状态不允许启动' });
    }

    const result = await deviceProtocol.startDevice(booking.deviceId, {
      userId: req.user._id,
      params: {
        mode: booking.mode,
        duration: booking.duration,
      },
    });

    booking.status = 'active';
    await booking.save();

    const device = await Device.findById(booking.deviceId);
    if (device) {
      device.workingStatus = 'running';
      device.totalUsage += 1;
      await device.save();
    }

    await DeviceUsage.create({
      deviceId: booking.deviceId,
      deviceType: booking.deviceType,
      communityId: device?.communityId,
      gridId: device?.gridId,
      userId: req.user._id,
      bookingId: booking._id,
      mode: booking.mode,
      startTime: new Date(),
      duration: booking.duration,
      status: 'started',
    });

    await FunnelEvent.create({
      userId: req.user._id,
      event: 'start_device',
      deviceId: booking.deviceId,
      deviceType: booking.deviceType,
      communityId: device?.communityId,
      source: req.headers['source'] || 'web',
      metadata: { bookingId: booking._id },
    });

    res.json({
      success: true,
      data: {
        booking,
        deviceResult: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usedDuration, interruptReason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: '预约不存在' });
    }

    if (booking.userId.toString() !== req.user._id.toString() && req.user.role === 'resident') {
      return res.status(403).json({ message: '无权限操作' });
    }

    if (!['active', 'completed'].includes(booking.status)) {
      return res.status(400).json({ message: '预约状态不允许完成' });
    }

    const result = await deviceProtocol.stopDevice(booking.deviceId, {
      userId: req.user._id,
      params: { usedDuration },
    });

    const actualDuration = usedDuration || booking.duration;

    const device = await Device.findById(booking.deviceId);
    if (device) {
      device.workingStatus = 'idle';
      device.totalDuration += actualDuration;
      await device.save();
    }

    const deviceUsage = await DeviceUsage.findOne({ bookingId: booking._id });
    if (deviceUsage) {
      deviceUsage.endTime = new Date();
      deviceUsage.actualDuration = actualDuration;
      deviceUsage.status = interruptReason ? 'interrupted' : 'completed';
      deviceUsage.interruptReason = interruptReason;
      deviceUsage.metrics = result.result?.data?.metrics;
      await deviceUsage.save();
    }

    booking.status = interruptReason ? 'completed' : 'completed';
    booking.endTime = new Date();
    await booking.save();

    await FunnelEvent.create({
      userId: req.user._id,
      event: 'complete_usage',
      deviceId: booking.deviceId,
      deviceType: booking.deviceType,
      communityId: device?.communityId,
      source: req.headers['source'] || 'web',
      metadata: { bookingId: booking._id, interruptReason },
    });

    res.json({
      success: true,
      data: {
        booking,
        deviceResult: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { deviceId, date } = req.query;

    const startOfDay = dayjs(date).startOf('day');
    const endOfDay = dayjs(date).endOf('day');

    const bookings = await Booking.find({
      deviceId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      startTime: { $gte: startOfDay.toDate() },
      endTime: { $lte: endOfDay.toDate() },
    });

    const bookedSlots = bookings.map(b => ({
      start: dayjs(b.startTime).format('HH:mm'),
      end: dayjs(b.endTime).format('HH:mm'),
    }));

    const allSlots = [];
    for (let hour = 6; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = dayjs(date).hour(hour).minute(minute);
        if (time.isAfter(dayjs())) {
          allSlots.push(time.format('HH:mm'));
        }
      }
    }

    const availableSlots = allSlots.filter(slot => {
      const slotTime = dayjs(date).hour(parseInt(slot.split(':')[0])).minute(parseInt(slot.split(':')[1]));
      return !bookedSlots.some(booked => {
        const bookedStart = dayjs(date).hour(parseInt(booked.start.split(':')[0])).minute(parseInt(booked.start.split(':')[1]));
        const bookedEnd = dayjs(date).hour(parseInt(booked.end.split(':')[0])).minute(parseInt(booked.end.split(':')[1]));
        return slotTime.isBetween(bookedStart, bookedEnd, null, '[)');
      });
    });

    res.json({
      success: true,
      data: {
        booked: bookedSlots,
        available: availableSlots,
      },
    });
  } catch (error) {
    next(error);
  }
};
