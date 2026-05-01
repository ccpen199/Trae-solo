import { Response } from 'express';
import { z } from 'zod';
import { orderService } from '../services/order.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { OrderStatus } from '@prisma/client';

const createOrderSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
      })
    ).min(1, '订单至少包含一个商品'),
    sourceType: z.enum(['referral_code', 'share_link', 'qrcode']).optional(),
    sourceValue: z.string().optional(),
  }),
});

const orderIdSchema = z.object({
  params: z.object({
    orderId: z.string(),
  }),
});

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }

  try {
    const validated = createOrderSchema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    const result = await orderService.createOrder({
      userId: req.userId,
      items: validated.body.items,
      sourceType: validated.body.sourceType,
      sourceValue: validated.body.sourceValue,
      ip: req.ip,
      deviceId: req.headers['x-device-id'] as string,
    });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: error.errors,
      });
    }
    throw error;
  }
};

export const confirmPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = orderIdSchema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    const result = await orderService.confirmPayment(validated.params.orderId);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: error.errors,
      });
    }
    throw error;
  }
};

export const confirmAttribution = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      params: z.object({ orderId: z.string() }),
      body: z.object({
        sourceType: z.enum(['referral_code', 'share_link', 'qrcode']),
        sourceValue: z.string(),
      }),
    });

    const validated = schema.parse({
      params: req.params,
      body: req.body,
      query: req.query,
    });

    const result = await orderService.confirmOrderAttribution({
      orderId: validated.params.orderId,
      sourceType: validated.body.sourceType,
      sourceValue: validated.body.sourceValue,
    });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: error.errors,
      });
    }
    throw error;
  }
};

export const confirmDelivery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = orderIdSchema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    const result = await orderService.confirmDelivery(validated.params.orderId);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: error.errors,
      });
    }
    throw error;
  }
};

export const completeAfterSale = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = orderIdSchema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    const result = await orderService.completeAfterSale(validated.params.orderId);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: error.errors,
      });
    }
    throw error;
  }
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      params: z.object({ orderId: z.string() }),
      body: z.object({ reason: z.string().optional() }),
    });

    const validated = schema.parse({
      params: req.params,
      body: req.body,
      query: req.query,
    });

    const result = await orderService.cancelOrder(
      validated.params.orderId,
      validated.body.reason || '用户取消'
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: error.errors,
      });
    }
    throw error;
  }
};

export const getOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = orderIdSchema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    const order = await orderService.getOrderById(validated.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: error.errors,
      });
    }
    throw error;
  }
};

export const getUserOrders = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }

  const status = req.query.status as OrderStatus | undefined;
  const orders = await orderService.getUserOrders(req.userId, status);

  res.status(200).json({
    success: true,
    data: orders,
  });
};
