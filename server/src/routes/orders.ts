import { Router, Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { couponService } from '../services/couponService';
import { authMiddleware, AuthenticatedRequest } from '../middleware';
import { UserRole } from '../types';

const router = Router();

router.post('/calculate-discount', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderAmount, storeId, productCategories } = req.body;
    
    if (orderAmount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'orderAmount is required'
      });
    }
    
    const result = await orderService.calculateBestDiscount(
      req.user!.id,
      orderAmount,
      storeId,
      productCategories
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { storeId, originalAmount, productItems, couponIds } = req.body;
    
    if (!storeId || originalAmount === undefined || !productItems) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: storeId, originalAmount, productItems'
      });
    }
    
    const result = await orderService.createOrder({
      userId: req.user!.id,
      storeId,
      originalAmount,
      productItems,
      couponIds,
      ipAddress: req.ip,
      traceId: req.traceId
    });
    
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/:orderId/pay', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    
    const result = await orderService.confirmPayment(
      orderId,
      req.user!.id,
      req.traceId
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.post('/:orderId/refund', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { refundStrategy } = req.body;
    
    const result = await orderService.processRefund(
      orderId,
      req.user!.id,
      req.user!.role,
      refundStrategy || 'full',
      req.traceId
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/:orderId', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    
    const order = await orderService.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    if (req.user!.role !== UserRole.ADMIN && 
        req.user!.role !== UserRole.FINANCE &&
        req.user!.role !== UserRole.MERCHANT &&
        order.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have access to this order'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, startDate, endDate, page, limit } = req.query;
    
    let filters: any = {
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined
    };
    
    if (req.user!.role === UserRole.CUSTOMER) {
      filters.userId = req.user!.id;
    } else if (req.user!.role === UserRole.MERCHANT) {
      filters.storeId = (req.user as any).storeId;
    }
    
    const result = await orderService.listOrders(filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
