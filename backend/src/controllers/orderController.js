const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { Order, House, User, HouseCalendar, Review, Notification } = require('../models');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../middleware/errorHandler');

const generateOrderNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `ANT${year}${month}${day}${random}`;
};

const createOrder = async (req, res, next) => {
  try {
    const {
      houseId,
      checkInDate,
      checkOutDate,
      guests,
      specialRequests,
      guestNames,
      guestPhones
    } = req.body;
    const userId = req.user.id;

    const house = await House.findOne({
      where: { id: houseId, status: 'published' },
      include: [{ model: User, as: 'landlord' }]
    });

    if (!house) {
      return next(new NotFoundError('房源不存在或未上架'));
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return next(new BadRequestError('入住日期不能早于今天'));
    }
    if (checkOut <= checkIn) {
      return next(new BadRequestError('退房日期必须晚于入住日期'));
    }

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (nights < house.minNights) {
      return next(new BadRequestError(`最少需要入住${house.minNights}晚`));
    }
    if (nights > house.maxNights) {
      return next(new BadRequestError(`最多只能入住${house.maxNights}晚`));
    }

    const conflictCalendars = await HouseCalendar.findAll({
      where: {
        houseId,
        date: { [Op.between]: [checkInDate, checkOutDate] },
        status: { [Op.ne]: 'available' }
      }
    });

    if (conflictCalendars.length > 0) {
      return next(new BadRequestError('所选日期中有已预订或已锁定的日期'));
    }

    const actualGuests = guests || 1;
    if (actualGuests > house.maxGuests) {
      return next(new BadRequestError(`该房源最多入住${house.maxGuests}人`));
    }

    const totalRoomPrice = house.pricePerNight * nights;
    const cleaningFee = house.cleaningFee || 0;
    const securityDeposit = house.securityDeposit || 0;
    const totalAmount = totalRoomPrice + cleaningFee;
    const payableAmount = totalAmount + securityDeposit;

    const transaction = await Order.sequelize.transaction();

    try {
      const order = await Order.create({
        orderNo: generateOrderNo(),
        userId,
        landlordId: house.landlordId,
        houseId,
        checkInDate,
        checkOutDate,
        nights,
        guests: actualGuests,
        pricePerNight: house.pricePerNight,
        cleaningFee,
        securityDeposit,
        totalAmount,
        discountAmount: 0,
        payableAmount,
        status: 'pending',
        specialRequests,
        guestNames: guestNames || [],
        guestPhones: guestPhones || []
      }, { transaction });

      const datesToUpdate = [];
      for (let d = new Date(checkInDate); d < checkOut; d.setDate(d.getDate() + 1)) {
        datesToUpdate.push(new Date(d));
      }

      for (const date of datesToUpdate) {
        await HouseCalendar.upsert({
          houseId,
          date,
          status: 'booked',
          orderId: order.id,
          price: house.pricePerNight
        }, { transaction });
      }

      await Notification.create({
        userId: house.landlordId,
        type: 'order',
        title: '新订单通知',
        content: `您的房源"${house.title}"有新的预订请求`,
        relatedId: order.id,
        relatedType: 'Order'
      }, { transaction });

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: '订单创建成功',
        data: order
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const getOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id },
      include: [
        {
          model: House,
          as: 'house',
          include: [{ model: User, as: 'landlord', attributes: ['id', 'nickname', 'avatar', 'phone'] }]
        },
        { model: User, as: 'user', attributes: ['id', 'nickname', 'avatar', 'phone'] },
        { model: Review, as: 'review' }
      ]
    });

    if (!order) {
      return next(new NotFoundError('订单不存在'));
    }

    if (order.userId !== userId && order.landlordId !== userId) {
      return next(new ForbiddenError('无权查看此订单'));
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const { status, role, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const where = {};
    if (role === 'landlord') {
      where.landlordId = userId;
    } else {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: House,
          as: 'house',
          attributes: ['id', 'title', 'images', 'city', 'address', 'pricePerNight']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, cancelReason } = req.body;
    const userId = req.user.id;

    const order = await Order.findByPk(id);
    if (!order) {
      return next(new NotFoundError('订单不存在'));
    }

    const isUser = order.userId === userId;
    const isLandlord = order.landlordId === userId;

    if (!isUser && !isLandlord) {
      return next(new ForbiddenError('无权操作此订单'));
    }

    let newStatus = null;
    let notificationTitle = '';
    let notificationContent = '';
    let notifyUserId = null;

    switch (action) {
      case 'pay':
        if (!isUser) return next(new ForbiddenError('只有房客可以支付'));
        if (order.status !== 'pending') return next(new BadRequestError('订单状态不正确'));
        newStatus = 'paid';
        order.paidAt = new Date();
        order.paymentMethod = 'wechat';
        order.transactionId = 'TXN' + Date.now();
        notificationTitle = '订单已支付';
        notificationContent = `订单 ${order.orderNo} 已支付，请准备入住`;
        notifyUserId = order.landlordId;
        break;

      case 'confirm':
        if (!isLandlord) return next(new ForbiddenError('只有房东可以确认订单'));
        if (order.status !== 'paid') return next(new BadRequestError('订单状态不正确'));
        newStatus = 'confirmed';
        notificationTitle = '订单已确认';
        notificationContent = `房东已确认您的订单 ${order.orderNo}`;
        notifyUserId = order.userId;
        break;

      case 'check_in':
        if (!isLandlord) return next(new ForbiddenError('只有房东可以办理入住'));
        if (order.status !== 'confirmed' && order.status !== 'paid') 
          return next(new BadRequestError('订单状态不正确'));
        newStatus = 'checked_in';
        order.checkInTime = new Date();
        break;

      case 'check_out':
        if (!isLandlord) return next(new ForbiddenError('只有房东可以办理退房'));
        if (order.status !== 'checked_in') return next(new BadRequestError('订单状态不正确'));
        newStatus = 'checked_out';
        order.checkOutTime = new Date();
        break;

      case 'complete':
        if (order.status !== 'checked_out') return next(new BadRequestError('订单状态不正确'));
        newStatus = 'completed';
        break;

      case 'cancel':
        if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'refunded')
          return next(new BadRequestError('订单不能取消'));
        
        newStatus = 'cancelled';
        order.cancelledBy = isUser ? 'user' : 'landlord';
        order.cancelReason = cancelReason || '用户取消';
        order.cancelledAt = new Date();
        
        await HouseCalendar.update(
          { status: 'available', orderId: null },
          { where: { orderId: order.id } }
        );
        break;

      default:
        return next(new BadRequestError('无效的操作'));
    }

    if (newStatus) {
      order.status = newStatus;
      await order.save();
    }

    if (notifyUserId && notificationTitle) {
      await Notification.create({
        userId: notifyUserId,
        type: 'order',
        title: notificationTitle,
        content: notificationContent,
        relatedId: order.id,
        relatedType: 'Order'
      });
    }

    res.json({
      success: true,
      message: '操作成功',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderDetail,
  getMyOrders,
  updateOrderStatus
};
