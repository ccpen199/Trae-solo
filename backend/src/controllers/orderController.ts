import { Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { OrderStatus, ExceptionType, ExceptionStatus, ExceptionPriority } from '../types/prisma';
import { v4 as uuidv4 } from 'uuid';

const generateOrderNo = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${year}${month}${day}${random}`;
};

export const createOrderValidation = [
  body('accountId').notEmpty().withMessage('账号ID不能为空'),
];

export const createOrder = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, '参数验证失败', errors.array());
  }

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const { accountId } = req.body;

    const account = await prisma.gameAccount.findUnique({
      where: { id: accountId },
      include: {
        seller: true,
      },
    });

    if (!account) {
      return errorResponse(res, 404, '账号不存在');
    }

    if (account.status !== 'APPROVED') {
      return errorResponse(res, 400, '该账号不可购买');
    }

    if (account.sellerId === req.user.id) {
      return errorResponse(res, 400, '不能购买自己的账号');
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        accountId,
        buyerId: req.user.id,
        status: {
          in: ['PENDING_PAYMENT', 'PENDING_DELIVERY', 'PENDING_CONFIRM'],
        },
      },
    });

    if (existingOrder) {
      return errorResponse(res, 400, '您已有该账号的待处理订单');
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNo: generateOrderNo(),
          accountId,
          buyerId: req.user.id,
          sellerId: account.sellerId,
          price: account.price,
          status: 'PENDING_PAYMENT' as OrderStatus,
        },
        include: {
          account: true,
          buyer: {
            select: {
              id: true,
              username: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      return newOrder;
    });

    successResponse(res, order, '订单创建成功');
  } catch (error) {
    console.error('Create order error:', error);
    errorResponse(res, 500, '创建订单失败');
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, '参数验证失败', errors.array());
  }

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      role,
    } = req.query;

    const where: any = {};

    if (role === 'buyer') {
      where.buyerId = req.user.id;
    } else if (role === 'seller') {
      where.sellerId = req.user.id;
    } else {
      where.OR = [
        { buyerId: req.user.id },
        { sellerId: req.user.id },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        include: {
          account: true,
          buyer: {
            select: {
              id: true,
              username: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
          exception: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / Number(pageSize));

    successResponse(
      res,
      orders,
      undefined,
      {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages,
      }
    );
  } catch (error) {
    console.error('Get orders error:', error);
    errorResponse(res, 500, '获取订单列表失败');
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        account: true,
        buyer: {
          select: {
            id: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
        exception: true,
      },
    });

    if (!order) {
      return errorResponse(res, 404, '订单不存在');
    }

    if (
      order.buyerId !== req.user.id &&
      order.sellerId !== req.user.id &&
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'CUSTOMER_SERVICE'
    ) {
      return errorResponse(res, 403, '无权查看此订单');
    }

    successResponse(res, order);
  } catch (error) {
    console.error('Get order by id error:', error);
    errorResponse(res, 500, '获取订单信息失败');
  }
};

export const payOrder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { paymentMethod } = req.body;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        account: true,
        buyer: true,
      },
    });

    if (!order) {
      return errorResponse(res, 404, '订单不存在');
    }

    if (order.buyerId !== req.user.id) {
      return errorResponse(res, 403, '无权支付此订单');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return errorResponse(res, 400, '订单状态不正确，无法支付');
    }

    if (order.buyer.balance < order.price) {
      return errorResponse(res, 400, '余额不足');
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.user.id },
        data: { balance: { decrement: order.price } },
      });

      const newOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'PENDING_DELIVERY' as OrderStatus,
          paymentMethod: paymentMethod || 'balance',
          paidAt: new Date(),
        },
        include: {
          account: true,
          buyer: {
            select: {
              id: true,
              username: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      return newOrder;
    });

    successResponse(res, updatedOrder, '支付成功，请等待卖家发货');
  } catch (error) {
    console.error('Pay order error:', error);
    errorResponse(res, 500, '支付失败');
  }
};

export const deliverOrder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { deliveryInfo } = req.body;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  if (!deliveryInfo) {
    return errorResponse(res, 400, '请提供发货信息');
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return errorResponse(res, 404, '订单不存在');
    }

    if (order.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 403, '无权操作此订单');
    }

    if (order.status !== 'PENDING_DELIVERY') {
      return errorResponse(res, 400, '订单状态不正确，无法发货');
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'PENDING_CONFIRM' as OrderStatus,
        deliveryInfo,
        deliveredAt: new Date(),
      },
      include: {
        account: true,
        buyer: {
          select: {
            id: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    successResponse(res, updatedOrder, '发货成功，请等待买家确认');
  } catch (error) {
    console.error('Deliver order error:', error);
    errorResponse(res, 500, '发货失败');
  }
};

export const confirmOrder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        account: true,
        seller: true,
      },
    });

    if (!order) {
      return errorResponse(res, 404, '订单不存在');
    }

    if (order.buyerId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 403, '无权操作此订单');
    }

    if (order.status !== 'PENDING_CONFIRM') {
      return errorResponse(res, 400, '订单状态不正确，无法确认');
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: order.sellerId },
        data: { balance: { increment: order.price } },
      });

      await tx.gameAccount.update({
        where: { id: order.accountId },
        data: { status: 'SOLD' },
      });

      const newOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'COMPLETED' as OrderStatus,
          confirmedAt: new Date(),
          completedAt: new Date(),
        },
        include: {
          account: true,
          buyer: {
            select: {
              id: true,
              username: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      return newOrder;
    });

    successResponse(res, updatedOrder, '确认收货成功，订单已完成');
  } catch (error) {
    console.error('Confirm order error:', error);
    errorResponse(res, 500, '确认收货失败');
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { cancelReason } = req.body;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: true,
      },
    });

    if (!order) {
      return errorResponse(res, 404, '订单不存在');
    }

    if (
      order.buyerId !== req.user.id &&
      order.sellerId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return errorResponse(res, 403, '无权取消此订单');
    }

    if (!['PENDING_PAYMENT', 'PENDING_DELIVERY', 'PENDING_CONFIRM'].includes(order.status)) {
      return errorResponse(res, 400, '订单状态不正确，无法取消');
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (order.status === 'PENDING_DELIVERY' || order.status === 'PENDING_CONFIRM') {
        await tx.user.update({
          where: { id: order.buyerId },
          data: { balance: { increment: order.price } },
        });
      }

      const newOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELED' as OrderStatus,
          cancelReason,
          canceledAt: new Date(),
        },
        include: {
          account: true,
          buyer: {
            select: {
              id: true,
              username: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      return newOrder;
    });

    successResponse(res, updatedOrder, '订单已取消');
  } catch (error) {
    console.error('Cancel order error:', error);
    errorResponse(res, 500, '取消订单失败');
  }
};

export const raiseException = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { type, title, description, priority } = req.body;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  if (!title) {
    return errorResponse(res, 400, '请提供问题标题');
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return errorResponse(res, 404, '订单不存在');
    }

    if (
      order.buyerId !== req.user.id &&
      order.sellerId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return errorResponse(res, 403, '无权对此订单提出异常');
    }

    const existingException = await prisma.exception.findFirst({
      where: {
        orderId: id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (existingException) {
      return errorResponse(res, 400, '该订单已有待处理的异常');
    }

    const result = await prisma.$transaction(async (tx) => {
      const exception = await tx.exception.create({
        data: {
          orderId: id,
          type: type || 'OTHER',
          title,
          description,
          priority: priority || 'MEDIUM',
          status: 'PENDING' as ExceptionStatus,
        },
      });

      await tx.order.update({
        where: { id },
        data: { status: 'EXCEPTION' as OrderStatus },
      });

      return exception;
    });

    successResponse(res, result, '异常已提交，请等待处理');
  } catch (error) {
    console.error('Raise exception error:', error);
    errorResponse(res, 500, '提交异常失败');
  }
};
