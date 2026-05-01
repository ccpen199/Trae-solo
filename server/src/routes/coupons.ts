import { Router, Request, Response } from 'express';
import { couponService } from '../services/couponService';
import { authMiddleware, AuthenticatedRequest } from '../middleware';
import { UserRole, CouponStatus, CouponType, DistributionChannel } from '../types';

const router = Router();

router.post('/templates', authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      validityType,
      validFrom,
      validTo,
      validDays,
      totalQuantity,
      maxPerUser,
      distributionChannel,
      isStackable,
      stackPriority,
      applicableProducts,
      excludedProducts,
      applicableStores,
      budgetId
    } = req.body;
    
    if (!name || !type || value === undefined || totalQuantity === undefined || !budgetId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, value, totalQuantity, budgetId'
      });
    }
    
    const result = await couponService.createTemplate({
      name,
      description,
      type: type as CouponType,
      value,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      validityType: validityType || 'relative',
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: validTo ? new Date(validTo) : undefined,
      validDays,
      totalQuantity,
      maxPerUser: maxPerUser || 1,
      distributionChannel: distributionChannel as DistributionChannel || DistributionChannel.DIRECT,
      isStackable: isStackable || false,
      stackPriority: stackPriority || 0,
      applicableProducts,
      excludedProducts,
      applicableStores,
      budgetId,
      createdBy: req.user!.id,
      userRole: req.user!.role,
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

router.get('/templates', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, type, budgetId, page, limit } = req.query;
    
    const result = await couponService.listTemplates({
      status: status as CouponStatus,
      type: type as CouponType,
      budgetId: budgetId as string,
      createdBy: req.user!.role === UserRole.CUSTOMER ? undefined : req.user!.id,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined
    });
    
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

router.get('/templates/:templateId', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templateId } = req.params;
    
    const template = await couponService.getTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.put('/templates/:templateId', authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templateId } = req.params;
    const { name, description, maxPerUser, isStackable, stackPriority, applicableProducts, excludedProducts, applicableStores } = req.body;
    
    const result = await couponService.updateTemplate(
      templateId,
      { name, description, maxPerUser, isStackable, stackPriority, applicableProducts, excludedProducts, applicableStores },
      req.user!.id,
      req.user!.role,
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

router.post('/templates/:templateId/approve', authMiddleware([UserRole.ADMIN]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templateId } = req.params;
    
    const result = await couponService.approveForDistribution(
      templateId,
      req.user!.id,
      req.user!.role,
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

router.post('/distribute', authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templateId, userIds, distributionChannel, storeId } = req.body;
    
    if (!templateId || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: templateId, userIds (array)'
      });
    }
    
    const result = await couponService.distributeCoupons({
      templateId,
      userIds,
      distributionChannel: distributionChannel as DistributionChannel || DistributionChannel.TARGETED,
      storeId,
      distributedBy: req.user!.id,
      userRole: req.user!.role,
      traceId: req.traceId
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

router.get('/my-coupons', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, templateId, page, limit } = req.query;
    
    const result = await couponService.getUserCoupons(
      req.user!.id,
      {
        status: status as CouponStatus,
        templateId: templateId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      }
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

router.post('/:couponId/cancel', authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { couponId } = req.params;
    
    const result = await couponService.cancelCoupon(
      couponId,
      req.user!.id,
      req.user!.role,
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

router.post('/:couponId/refund', authMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { couponId } = req.params;
    const { extendValidity } = req.body;
    
    const result = await couponService.refundCoupon(
      couponId,
      req.user!.id,
      req.user!.role,
      req.traceId,
      extendValidity !== false
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
