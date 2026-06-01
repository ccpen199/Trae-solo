import { Request, Response } from 'express';
import * as orderService from '../services/orderService.js';
import type { ApiResponse } from '../types/index.js';

export const createOrder = (req: Request, res: Response): void => {
  try {
    const { userId, sessionId, seatIds, couponId } = req.body;
    
    if (!userId || !sessionId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      res.status(400).json({
        code: 400,
        data: null,
        message: '参数不完整'
      });
      return;
    }
    
    const result = orderService.createOrder(userId, sessionId, seatIds, couponId);
    
    if (!result) {
      res.status(400).json({
        code: 400,
        data: null,
        message: '订单创建失败，座位可能已被占用'
      });
      return;
    }
    
    const response: ApiResponse = {
      code: 0,
      data: result,
      message: '订单创建成功'
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '订单创建失败'
    });
  }
};

export const confirmOrder = (req: Request, res: Response): void => {
  try {
    const { orderId } = req.params;
    
    const result = orderService.confirmOrder(orderId);
    
    if (result) {
      res.json({
        code: 0,
        data: { success: true },
        message: '订单支付成功'
      });
    } else {
      res.status(400).json({
        code: 400,
        data: null,
        message: '订单确认失败'
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '订单确认失败'
    });
  }
};

export const getOrderDetail = (req: Request, res: Response): void => {
  try {
    const { orderId } = req.params;
    
    const order = orderService.getOrderById(orderId);
    
    if (!order) {
      res.status(404).json({
        code: 404,
        data: null,
        message: '订单不存在'
      });
      return;
    }
    
    const response: ApiResponse = {
      code: 0,
      data: order
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取订单详情失败'
    });
  }
};

export const getUserOrders = (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    
    const orders = orderService.getUserOrders(userId);
    
    const response: ApiResponse = {
      code: 0,
      data: orders
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取用户订单失败'
    });
  }
};

export const cancelOrder = (req: Request, res: Response): void => {
  try {
    const { orderId } = req.params;
    
    const result = orderService.cancelOrder(orderId);
    
    if (result) {
      res.json({
        code: 0,
        data: { success: true },
        message: '订单取消成功'
      });
    } else {
      res.status(400).json({
        code: 400,
        data: null,
        message: '订单取消失败'
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      data: null,
      message: '订单取消失败'
    });
  }
};
