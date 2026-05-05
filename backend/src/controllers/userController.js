const { Op } = require('sequelize');
const { 
  User, 
  Favorite, 
  House, 
  BrowseHistory, 
  Coupon, 
  UserCoupon, 
  Notification,
  Review
} = require('../models');
const { NotFoundError, BadRequestError } = require('../middleware/errorHandler');

const getMyFavorites = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const offset = (page - 1) * limit;

    const { count, rows: favorites } = await Favorite.findAndCountAll({
      where: { userId, isFavorite: true },
      include: [
        {
          model: House,
          as: 'house',
          include: [{ model: User, as: 'landlord', attributes: ['id', 'nickname', 'avatar'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const houses = favorites.map(f => ({
      ...f.house.toJSON(),
      isFavorite: true,
      favoritedAt: f.createdAt
    }));

    res.json({
      success: true,
      data: {
        houses,
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

const getBrowseHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const offset = (page - 1) * limit;

    const { count, rows: histories } = await BrowseHistory.findAndCountAll({
      where: { userId },
      include: [
        {
          model: House,
          as: 'house',
          where: { status: { [Op.ne]: 'deleted' } },
          required: true,
          include: [{ model: User, as: 'landlord', attributes: ['id', 'nickname', 'avatar'] }]
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const houseIds = histories.map(h => h.houseId);
    let favoritesMap = {};
    
    if (houseIds.length > 0) {
      const favorites = await Favorite.findAll({
        where: { userId, houseId: { [Op.in]: houseIds }, isFavorite: true }
      });
      favorites.forEach(f => {
        favoritesMap[f.houseId] = true;
      });
    }

    const houses = histories.map(h => ({
      ...h.house.toJSON(),
      isFavorite: favoritesMap[h.houseId] || false,
      viewedAt: h.updatedAt,
      viewCount: h.viewCount
    }));

    res.json({
      success: true,
      data: {
        houses,
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

const clearBrowseHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await BrowseHistory.destroy({
      where: { userId }
    });

    res.json({
      success: true,
      message: '浏览记录已清空'
    });
  } catch (error) {
    next(error);
  }
};

const getMyCoupons = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const offset = (page - 1) * limit;
    const now = new Date();

    let where = { userId };
    if (status === 'available') {
      where.status = 'available';
    } else if (status === 'used') {
      where.status = 'used';
    } else if (status === 'expired') {
      where.status = 'expired';
    }

    const { count, rows: userCoupons } = await UserCoupon.findAndCountAll({
      where,
      include: [
        {
          model: Coupon,
          as: 'coupon',
          required: true
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const coupons = userCoupons.map(uc => ({
      id: uc.id,
      userCouponId: uc.id,
      ...uc.coupon.toJSON(),
      status: uc.status,
      usedAt: uc.usedAt
    }));

    res.json({
      success: true,
      data: {
        coupons,
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

const getNotifications = async (req, res, next) => {
  try {
    const { type, isRead, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const offset = (page - 1) * limit;
    const where = { userId };

    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const unreadCount = await Notification.count({
      where: { userId, isRead: false }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, userId }
    });

    if (!notification) {
      return next(new NotFoundError('通知不存在'));
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: '已标记为已读'
    });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );

    res.json({
      success: true,
      message: '已全部标记为已读'
    });
  } catch (error) {
    next(error);
  }
};

const getMyReviews = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const offset = (page - 1) * limit;
    const where = role === 'landlord' ? { landlordId: userId } : { userId };

    const { count, rows: reviews } = await Review.findAndCountAll({
      where,
      include: [
        {
          model: House,
          as: 'house',
          attributes: ['id', 'title', 'images']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        reviews,
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

const createReview = async (req, res, next) => {
  try {
    const { orderId, rating, cleanliness, accuracy, communication, location, value, content, images, isAnonymous } = req.body;
    const userId = req.user.id;

    const { Order, House, User } = require('../models');
    const order = await Order.findOne({
      where: { id: orderId, userId, status: 'completed', isReviewed: false }
    });

    if (!order) {
      return next(new NotFoundError('订单不存在或已评价'));
    }

    const house = await House.findByPk(order.houseId);
    if (!house) {
      return next(new NotFoundError('房源不存在'));
    }

    const review = await Review.create({
      orderId,
      houseId: order.houseId,
      userId,
      landlordId: order.landlordId,
      rating: rating || 5,
      cleanliness: cleanliness || 5,
      accuracy: accuracy || 5,
      communication: communication || 5,
      location: location || 5,
      value: value || 5,
      content,
      images: images || [],
      isAnonymous: isAnonymous || false
    });

    order.isReviewed = true;
    await order.save();

    const reviews = await Review.findAll({
      where: { houseId: order.houseId, status: 'published' },
      attributes: ['rating']
    });

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      house.rating = Math.round(avgRating * 100) / 100;
      house.reviewCount = reviews.length;
      await house.save();
    }

    res.status(201).json({
      success: true,
      message: '评价提交成功',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyFavorites,
  getBrowseHistory,
  clearBrowseHistory,
  getMyCoupons,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getMyReviews,
  createReview
};
