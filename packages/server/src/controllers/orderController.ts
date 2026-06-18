import { Request, Response } from 'express';
import { success, error, serverError } from '../utils/response';
import { orderService } from '../services';
import Joi from 'joi';

export const createOrderSchema = Joi.object({
  pileId: Joi.string().required().messages({
    'any.required': '充电桩ID不能为空',
  }),
  stationId: Joi.string().required().messages({
    'any.required': '充电站ID不能为空',
  }),
  vin: Joi.string().optional(),
  plateNumber: Joi.string().optional(),
});

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const order = await orderService.createOrder({
      ...req.body,
      userId,
    });
    success(res, order, '订单创建成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const startCharging = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await orderService.startCharging(orderId);
    success(res, order, '开始充电');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const stopCharging = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await orderService.stopCharging(orderId);
    success(res, order, '停止充电');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getOrderList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page, pageSize, status } = req.query;

    const result = await orderService.getOrderList({
      userId,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      status: status as string,
    });
    success(res, result);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getOrderDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getOrderById(orderId);
    success(res, order);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getCurrentOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const order = await orderService.getCurrentOrder(userId);
    success(res, order);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export default {
  createOrder,
  startCharging,
  stopCharging,
  getOrderList,
  getOrderDetail,
  getCurrentOrder,
};
