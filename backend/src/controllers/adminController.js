const User = require('../models/User');
const Waste = require('../models/Waste');
const Order = require('../models/Order');
const TransferOrder = require('../models/TransferOrder');
const BlockchainRecord = require('../models/BlockchainRecord');

const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      totalWastes,
      onSaleWastes,
      totalOrders,
      completedOrders,
      totalTransfers,
      totalBlockchainRecords,
      pendingWasteReviews,
      pendingUserAudits
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Waste.countDocuments(),
      Waste.countDocuments({ status: 'on_sale' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      TransferOrder.countDocuments(),
      BlockchainRecord.countDocuments(),
      Waste.countDocuments({ status: 'pending_review' }),
      User.countDocuments({ verifyStatus: 'pending' })
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayNewUsers, todayNewOrders, todayNewWastes] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Waste.countDocuments({ createdAt: { $gte: today } })
    ]);

    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const orderStats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalAmountResult = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;

    const stats = {
      overview: {
        totalUsers,
        verifiedUsers,
        totalWastes,
        onSaleWastes,
        totalOrders,
        completedOrders,
        totalTransfers,
        totalBlockchainRecords,
        totalTransactionAmount: Math.round(totalAmount * 100) / 100
      },
      pending: {
        wasteReviews: pendingWasteReviews,
        userAudits: pendingUserAudits
      },
      today: {
        newUsers: todayNewUsers,
        newOrders: todayNewOrders,
        newWastes: todayNewWastes
      },
      roleDistribution: roleStats.map(item => ({ role: item._id, count: item.count })),
      orderStatusDistribution: orderStats.map(item => ({ status: item._id, count: item.count }))
    };

    res.json({
      success: true,
      data: stats,
      message: '获取平台统计数据成功'
    });
  } catch (error) {
    next(error);
  }
};

const getWasteReviewList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { status, category, keyword } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['pending_review', 'audit_failed', 'on_sale'] };
    }
    if (category) query.category = category;
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { hazardousCode: { $regex: keyword, $options: 'i' } }
      ];
    }

    const total = await Waste.countDocuments(query);
    const wastes = await Waste.find(query)
      .populate('sellerId', 'username companyName phone role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: {
        list: wastes,
        total,
        page,
        pageSize
      },
      message: '获取危废审核列表成功'
    });
  } catch (error) {
    next(error);
  }
};

const reviewWaste = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, remark } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '无效的审核操作'
      });
    }

    const waste = await Waste.findById(id);
    if (!waste) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '废弃物不存在'
      });
    }

    if (waste.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '当前状态无法审核'
      });
    }

    if (action === 'approve') {
      waste.status = 'on_sale';
      waste.reviewStatus = 'approved';
    } else {
      waste.status = 'audit_failed';
      waste.reviewStatus = 'rejected';
    }
    waste.reviewRemark = remark;

    await waste.save();

    res.json({
      success: true,
      data: waste,
      message: action === 'approve' ? '审核通过成功' : '审核拒绝成功'
    });
  } catch (error) {
    next(error);
  }
};

const getUserAuditList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { verifyStatus, role, keyword } = req.query;

    const query = {};
    if (verifyStatus) query.verifyStatus = verifyStatus;
    if (role) query.role = role;
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { companyName: { $regex: keyword, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: {
        list: users,
        total,
        page,
        pageSize
      },
      message: '获取用户资质审核列表成功'
    });
  } catch (error) {
    next(error);
  }
};

const auditUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, remark } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '无效的审核操作'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '用户不存在'
      });
    }

    if (user.verifyStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '当前状态无法审核'
      });
    }

    if (action === 'approve') {
      user.verifyStatus = 'approved';
      user.isVerified = true;
    } else {
      user.verifyStatus = 'rejected';
      user.isVerified = false;
    }

    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      data: userData,
      message: action === 'approve' ? '用户资质审核通过' : '用户资质审核拒绝'
    });
  } catch (error) {
    next(error);
  }
};

const getEnvReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { status, startDate, endDate } = req.query;

    const query = { isReported: true };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.reportTime = {};
      if (startDate) query.reportTime.$gte = new Date(startDate);
      if (endDate) query.reportTime.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('wasteId', 'title category hazardousCode')
      .populate('sellerId', 'username companyName')
      .populate('buyerId', 'username companyName')
      .sort({ reportTime: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: {
        list: orders,
        total,
        page,
        pageSize
      },
      message: '获取环保报送记录成功'
    });
  } catch (error) {
    next(error);
  }
};

const submitEnvReport = async (req, res, next) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供订单ID列表'
      });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });

    if (orders.length !== orderIds.length) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '部分订单不存在'
      });
    }

    const uncompleted = orders.filter(o => o.status !== 'completed');
    if (uncompleted.length > 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '存在未完成的订单，无法报送'
      });
    }

    const reported = orders.filter(o => o.isReported);
    if (reported.length > 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '存在已报送的订单'
      });
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      {
        isReported: true,
        reportTime: new Date()
      }
    );

    res.json({
      success: true,
      data: {
        reportedCount: result.modifiedCount,
        reportTime: new Date()
      },
      message: '环保报送成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getWasteReviewList,
  reviewWaste,
  getUserAuditList,
  auditUser,
  getEnvReport,
  submitEnvReport
};
