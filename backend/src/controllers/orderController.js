const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const Waste = require('../models/Waste');

const getList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { status, orderType, role } = req.query;

    const query = {};
    if (status) query.status = status;
    if (orderType) query.orderType = orderType;

    if (role === 'buyer') {
      query.buyerId = req.user._id;
    } else if (role === 'seller') {
      query.sellerId = req.user._id;
    } else if (req.user.role !== 'admin') {
      query.$or = [
        { buyerId: req.user._id },
        { sellerId: req.user._id }
      ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('wasteId', 'title category images')
      .populate('buyerId', 'username companyName')
      .populate('sellerId', 'username companyName')
      .sort({ createdAt: -1 })
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
      message: '获取订单列表成功'
    });
  } catch (error) {
    next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('wasteId')
      .populate('buyerId', 'username companyName phone')
      .populate('sellerId', 'username companyName phone')
      .populate('vehicleId');

    if (!order) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '订单不存在'
      });
    }

    if (req.user.role !== 'admin' &&
        order.buyerId.toString() !== req.user._id.toString() &&
        order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限查看此订单'
      });
    }

    res.json({
      success: true,
      data: order,
      message: '获取订单详情成功'
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { wasteId, weight, unitPrice, pickupAddress, deliveryAddress, pickupTime, pickupDate } = req.body;

    const waste = await Waste.findById(wasteId);
    if (!waste) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '废弃物不存在'
      });
    }

    if (waste.sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '不能购买自己发布的废弃物'
      });
    }

    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

    const order = new Order({
      orderNo,
      orderType: 'recycle',
      wasteId,
      wasteTitle: waste.title,
      buyerId: req.user._id,
      buyerType: req.user.role,
      buyerName: req.user.companyName || req.user.username,
      sellerId: waste.sellerId,
      sellerType: waste.sellerType,
      sellerName: waste.sellerId.companyName || waste.sellerId.username,
      weight,
      unitPrice,
      totalPrice: weight * unitPrice,
      status: 'pending_confirm',
      pickupAddress,
      deliveryAddress,
      pickupTime,
      pickupDate
    });

    await order.save();
    await order.populate('wasteId');
    await order.populate('buyerId', 'username companyName');
    await order.populate('sellerId', 'username companyName');

    res.status(201).json({
      success: true,
      data: order,
      message: '创建订单成功'
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '订单不存在'
      });
    }

    const validTransitions = {
      pending_confirm: ['confirmed', 'cancelled'],
      confirmed: ['picked_up', 'cancelled'],
      picked_up: ['delivered'],
      delivered: ['completed']
    };

    const currentStatus = order.status;
    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `无法从当前状态变更为目标状态`
      });
    }

    order.status = status;
    await order.save();

    if (status === 'completed') {
      const waste = await Waste.findById(order.wasteId);
      if (waste) {
        waste.status = 'sold';
        await waste.save();
      }
    }

    res.json({
      success: true,
      data: order,
      message: '更新订单状态成功'
    });
  } catch (error) {
    next(error);
  }
};

const uploadWeigh = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { weighTicketUrl, actualWeight } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '订单不存在'
      });
    }

    if (req.user.role !== 'admin' &&
        order.sellerId.toString() !== req.user._id.toString() &&
        order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限上传磅单'
      });
    }

    order.weighTicketUrl = weighTicketUrl;
    if (actualWeight) {
      order.actualWeight = actualWeight;
    }
    await order.save();

    res.json({
      success: true,
      data: order,
      message: '上传磅单成功'
    });
  } catch (error) {
    next(error);
  }
};

const signContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contractUrl } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '订单不存在'
      });
    }

    if (order.buyerId.toString() !== req.user._id.toString() &&
        order.sellerId.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限签署合同'
      });
    }

    order.contractUrl = contractUrl;
    order.isContractSigned = true;
    await order.save();

    res.json({
      success: true,
      data: order,
      message: '签署合同成功'
    });
  } catch (error) {
    next(error);
  }
};

const confirm = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '订单不存在'
      });
    }

    if (order.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: '无权限确认订单'
      });
    }

    if (order.status !== 'pending_confirm') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '当前订单状态无法确认'
      });
    }

    order.status = 'confirmed';
    await order.save();

    res.json({
      success: true,
      data: order,
      message: '确认订单成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getList,
  getDetail,
  create,
  updateStatus,
  uploadWeigh,
  signContract,
  confirm
};
