const express = require('express');
const { body, validationResult, param } = require('express-validator');
const prisma = require('../utils/prisma');
const { authenticateToken, requireRider, requireApproved } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireRider, requireApproved);

const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return `CD${timestamp.slice(-8)}${random}`;
};

const createOrderLog = async (orderId, action, description, operatorId) => {
  await prisma.orderLog.create({
    data: {
      orderId,
      action,
      description,
      operatorId
    }
  });
};

router.get('/available', async (req, res) => {
  try {
    if (!req.user.rider.isOnline) {
      return res.status(400).json({
        success: false,
        message: '请先上线才能查看可接订单'
      });
    }
    
    if (req.user.rider.currentOrders >= req.user.rider.maxOrders) {
      return res.status(400).json({
        success: false,
        message: '当前接单量已达上限'
      });
    }
    
    const orders = await prisma.order.findMany({
      where: {
        status: 'available'
      },
      include: {
        dormitory: true
      },
      orderBy: {
        estimatedDeliveryTime: 'asc'
      }
    });
    
    const ordersWithDistance = orders.map(order => ({
      ...order,
      currentDistance: (Math.random() * 2 + 0.5).toFixed(1),
      dormitoryDistance: order.dormitory ? (Math.random() * 1 + 0.2).toFixed(1) : '0.5'
    }));
    
    res.json({
      success: true,
      data: ordersWithDistance
    });
  } catch (error) {
    console.error('获取可接订单错误:', error);
    res.status(500).json({ success: false, message: '获取订单失败' });
  }
});

router.get('/pending-pickup', async (req, res) => {
  try {
    let orders;
    
    if (req.user.rider.isOffsite) {
      orders = await prisma.order.findMany({
        where: {
          offsiteRiderId: req.user.id,
          status: 'offsite_delivered'
        },
        include: {
          onsiteRider: {
            select: { id: true, realName: true, phone: true }
          },
          dormitory: true
        }
      });
    } else {
      orders = await prisma.order.findMany({
        where: {
          onsiteRiderId: req.user.id,
          status: 'pending_pickup'
        },
        include: {
          offsiteRider: {
            select: { id: true, realName: true, phone: true }
          },
          dormitory: true
        }
      });
    }
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('获取待取货订单错误:', error);
    res.status(500).json({ success: false, message: '获取订单失败' });
  }
});

router.get('/in-delivery', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        onsiteRiderId: req.user.id,
        status: 'in_delivery'
      },
      include: {
        dormitory: true
      }
    });
    
    const ordersWithTime = orders.map(order => {
      const estimatedTime = new Date(order.estimatedDeliveryTime);
      const now = new Date();
      const remainingMinutes = Math.max(0, Math.floor((estimatedTime - now) / (1000 * 60)));
      
      return {
        ...order,
        remainingMinutes
      };
    });
    
    res.json({
      success: true,
      data: ordersWithTime
    });
  } catch (error) {
    console.error('获取配送中订单错误:', error);
    res.status(500).json({ success: false, message: '获取订单失败' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const { status } = req.query;
    
    let whereCondition = {
      OR: [
        { offsiteRiderId: req.user.id },
        { onsiteRiderId: req.user.id }
      ]
    };
    
    if (status) {
      whereCondition.status = status;
    }
    
    const orders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        offsiteRider: { select: { id: true, realName: true, phone: true } },
        onsiteRider: { select: { id: true, realName: true, phone: true } },
        dormitory: true,
        orderLogs: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ success: false, message: '获取订单失败' });
  }
});

router.get('/:orderId', [
  param('orderId').isUUID().withMessage('无效的订单ID')
], async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        offsiteRider: { select: { id: true, realName: true, phone: true } },
        onsiteRider: { select: { id: true, realName: true, phone: true } },
        dormitory: true,
        orderLogs: {
          orderBy: { createdAt: 'asc' }
        },
        refund: true
      }
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    const isRelated = order.offsiteRiderId === req.user.id || order.onsiteRiderId === req.user.id;
    if (!isRelated && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权访问此订单' });
    }
    
    const mapData = {
      offsiteRider: order.offsiteRider ? {
        lat: 39.9042 + (Math.random() - 0.5) * 0.01,
        lng: 116.4074 + (Math.random() - 0.5) * 0.01
      } : null,
      onsiteRider: order.onsiteRider ? {
        lat: 39.9042 + (Math.random() - 0.5) * 0.005,
        lng: 116.4074 + (Math.random() - 0.5) * 0.005
      } : null,
      deliveryLocation: {
        lat: 39.9042,
        lng: 116.4074
      }
    };
    
    res.json({
      success: true,
      data: {
        ...order,
        mapData
      }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ success: false, message: '获取订单详情失败' });
  }
});

router.post('/:orderId/accept', [
  param('orderId').isUUID().withMessage('无效的订单ID')
], async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!req.user.rider.isOnline) {
      return res.status(400).json({
        success: false,
        message: '请先上线才能接单'
      });
    }
    
    if (req.user.rider.currentOrders >= req.user.rider.maxOrders) {
      return res.status(400).json({
        success: false,
        message: '当前接单量已达上限'
      });
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== 'available') {
      return res.status(400).json({ success: false, message: '订单已被其他骑手抢走' });
    }
    
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          onsiteRiderId: req.user.id,
          status: 'pending_pickup'
        }
      });
      
      await tx.rider.update({
        where: { userId: req.user.id },
        data: {
          currentOrders: { increment: 1 }
        }
      });
      
      await createOrderLog(orderId, 'accept_order', `骑手 ${req.user.realName} 接单`, req.user.id);
      
      return order;
    });
    
    res.json({
      success: true,
      message: '接单成功',
      data: updatedOrder
    });
  } catch (error) {
    console.error('接单错误:', error);
    res.status(500).json({ success: false, message: '接单失败' });
  }
});

router.post('/:orderId/offsite-arrive', [
  param('orderId').isUUID().withMessage('无效的订单ID')
], async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!req.user.rider.isOffsite) {
      return res.status(403).json({
        success: false,
        message: '只有校外骑手可以标记到达'
      });
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.offsiteRiderId !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权操作此订单' });
    }
    
    if (order.status === 'available') {
      return res.status(400).json({ success: false, message: '请等待校内骑手接单' });
    }
    
    if (order.status !== 'pending_pickup') {
      return res.status(400).json({ success: false, message: '订单状态不允许此操作' });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        offsiteArrivalTime: new Date(),
        status: 'offsite_delivered'
      }
    });
    
    await createOrderLog(orderId, 'offsite_arrive', '校外骑手已到达交接点', req.user.id);
    
    res.json({
      success: true,
      message: '已标记到达交接点，请等待校内骑手取货确认',
      data: updatedOrder
    });
  } catch (error) {
    console.error('校外骑手到达错误:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

router.post('/:orderId/confirm-pickup', [
  param('orderId').isUUID().withMessage('无效的订单ID')
], async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.onsiteRiderId !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权操作此订单' });
    }
    
    if (order.status === 'pending_pickup') {
      return res.status(400).json({
        success: false,
        message: '请等待校外骑手到达交接点',
        needOffsiteConfirm: true
      });
    }
    
    if (order.status !== 'offsite_delivered') {
      return res.status(400).json({ success: false, message: '订单状态不允许此操作' });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        pickupConfirmTime: new Date(),
        status: 'in_delivery'
      }
    });
    
    await createOrderLog(orderId, 'confirm_pickup', '校内骑手已取货，开始配送', req.user.id);
    
    res.json({
      success: true,
      message: '取货确认成功，开始配送',
      data: updatedOrder
    });
  } catch (error) {
    console.error('取货确认错误:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

router.post('/:orderId/complete', [
  param('orderId').isUUID().withMessage('无效的订单ID')
], async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.onsiteRiderId !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权操作此订单' });
    }
    
    if (order.status !== 'in_delivery') {
      return res.status(400).json({ success: false, message: '订单状态不允许此操作' });
    }
    
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          deliveryTime: new Date(),
          status: 'completed'
        }
      });
      
      await tx.rider.update({
        where: { userId: req.user.id },
        data: {
          currentOrders: { decrement: 1 }
        }
      });
      
      await createOrderLog(orderId, 'complete_delivery', '订单已送达，配送完成', req.user.id);
      
      return order;
    });
    
    res.json({
      success: true,
      message: '配送完成',
      data: updatedOrder
    });
  } catch (error) {
    console.error('完成配送错误:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

router.post('/:orderId/refund', [
  param('orderId').isUUID().withMessage('无效的订单ID'),
  body('reason').notEmpty().withMessage('请输入退单原因')
], async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, description } = req.body;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { refund: true }
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    const isRelated = order.offsiteRiderId === req.user.id || order.onsiteRiderId === req.user.id;
    if (!isRelated) {
      return res.status(403).json({ success: false, message: '无权操作此订单' });
    }
    
    if (order.refund) {
      return res.status(400).json({ success: false, message: '已有退单申请正在处理中' });
    }
    
    if (order.status === 'completed' || order.status === 'refunded') {
      return res.status(400).json({ success: false, message: '订单状态不允许退单' });
    }
    
    const refund = await prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          orderId,
          reason,
          description,
          status: 'pending'
        }
      });
      
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'refund_pending' }
      });
      
      await createOrderLog(orderId, 'apply_refund', `申请退单: ${reason}`, req.user.id);
      
      return refund;
    });
    
    res.json({
      success: true,
      message: '退单申请已提交，等待审核',
      data: refund
    });
  } catch (error) {
    console.error('申请退单错误:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

router.post('/create-test-order', async (req, res) => {
  try {
    const { merchantName, deliveryAddress, customerName, customerPhone, riderEarnings } = req.body;
    
    const estimatedDeliveryTime = new Date(Date.now() + 45 * 60 * 1000);
    
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        merchantName: merchantName || '肯德基(学校店)',
        deliveryAddress: deliveryAddress || '学生宿舍1号楼302室',
        customerName: customerName || '张同学',
        customerPhone: customerPhone || '13800138001',
        estimatedDeliveryTime,
        riderEarnings: riderEarnings || 8.5,
        status: 'available'
      }
    });
    
    await createOrderLog(order.id, 'create_order', '订单创建', null);
    
    res.json({
      success: true,
      message: '测试订单创建成功',
      data: order
    });
  } catch (error) {
    console.error('创建测试订单错误:', error);
    res.status(500).json({ success: false, message: '创建订单失败' });
  }
});

module.exports = router;
