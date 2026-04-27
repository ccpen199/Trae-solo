import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services';
import { catchAsync, ValidationError, NotFoundError, ForbiddenError } from '../middleware';
import logger from '../config/logger';

export const createOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { demandId, quoteId, title, address, province, city, district, contactName, contactPhone } = req.body;
  const user = (req as any).user;

  if (!demandId || !quoteId) {
    return next(new ValidationError('需求ID和报价单ID为必填项'));
  }

  if (!address || !contactName || !contactPhone) {
    return next(new ValidationError('地址、联系人、联系电话为必填项'));
  }

  const order = await orderService.createOrder({
    demandId,
    quoteId,
    customerId: user.id,
    title: title || '家具定制订单',
    address,
    province,
    city,
    district,
    contactName,
    contactPhone
  });

  logger.info(`[OrderController] 订单创建成功: orderId=${order.id}`);

  res.status(201).json({
    success: true,
    data: {
      order
    },
    message: '订单创建成功'
  });
});

export const signContract = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;
  const { contractData } = req.body;
  const user = (req as any).user;

  if (!orderId) {
    return next(new ValidationError('订单ID为必填项'));
  }

  const order = await orderService.getOrderById(orderId);
  
  if (!order) {
    return next(new NotFoundError('订单不存在'));
  }

  if (order.customerId !== user.id && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限操作此订单'));
  }

  const updatedOrder = await orderService.signContract({
    orderId,
    customerId: user.id,
    contractData
  });

  logger.info(`[OrderController] 签约成功: orderId=${orderId}`);

  res.status(200).json({
    success: true,
    data: {
      order: updatedOrder
    },
    message: '签约成功'
  });
});

export const recordPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;
  const { amount, paymentMethod, transactionId } = req.body;
  const user = (req as any).user;

  if (!orderId) {
    return next(new ValidationError('订单ID为必填项'));
  }

  if (!amount || amount <= 0) {
    return next(new ValidationError('支付金额必须大于0'));
  }

  if (!paymentMethod) {
    return next(new ValidationError('支付方式为必填项'));
  }

  const order = await orderService.getOrderById(orderId);
  
  if (!order) {
    return next(new NotFoundError('订单不存在'));
  }

  if (order.customerId !== user.id && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限操作此订单'));
  }

  const result = await orderService.recordPayment({
    orderId,
    amount,
    paymentMethod,
    transactionId,
    paidBy: user.id,
    paidByRole: user.role
  });

  logger.info(`[OrderController] 支付记录成功: orderId=${orderId}, amount=${amount}`);

  res.status(200).json({
    success: true,
    data: {
      payment: result.payment,
      order: result.order
    },
    message: '支付记录成功'
  });
});

export const getOrderById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;
  const user = (req as any).user;

  if (!orderId) {
    return next(new ValidationError('订单ID为必填项'));
  }

  const order = await orderService.getOrderById(orderId);
  
  if (!order) {
    return next(new NotFoundError('订单不存在'));
  }

  if (user.role !== 'ADMIN' && 
      order.customerId !== user.id) {
    return next(new ForbiddenError('无权限查看此订单'));
  }

  res.status(200).json({
    success: true,
    data: {
      order
    }
  });
});

export const getMyOrders = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (user.role !== 'CUSTOMER' && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限查看订单列表'));
  }

  const orders = await orderService.getOrdersByCustomer(user.id);

  res.status(200).json({
    success: true,
    data: {
      orders,
      total: orders.length
    }
  });
});

export const getOrderStatusHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;
  const user = (req as any).user;

  if (!orderId) {
    return next(new ValidationError('订单ID为必填项'));
  }

  const order = await orderService.getOrderById(orderId);
  
  if (!order) {
    return next(new NotFoundError('订单不存在'));
  }

  if (user.role !== 'ADMIN' && order.customerId !== user.id) {
    return next(new ForbiddenError('无权限查看此订单'));
  }

  const history = await orderService.getOrderStatusHistory(orderId);

  res.status(200).json({
    success: true,
    data: {
      history,
      total: history.length
    }
  });
});

export const orderController = {
  createOrder,
  signContract,
  recordPayment,
  getOrderById,
  getMyOrders,
  getOrderStatusHistory
};

export default orderController;
