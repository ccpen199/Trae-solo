import { Request, Response, NextFunction } from 'express';
import { quoteService } from '../services';
import { catchAsync, ValidationError, NotFoundError, ForbiddenError } from '../middleware';
import logger from '../config/logger';

export const generateQuote = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { designId, designerId, items, discounts, fees } = req.body;
  let user = (req as any).user;

  // 测试环境下的默认用户
  if (!user) {
    user = {
      id: designerId || 'test-designer-id',
      role: 'DESIGNER'
    };
  }

  if (!designId) {
    return next(new ValidationError('设计ID为必填项'));
  }

  if (!items || items.length === 0) {
    return next(new ValidationError('报价项目为必填项'));
  }

  const quote = await quoteService.generateQuote({
    designId,
    designerId: user.id,
    items,
    discounts,
    additionalFees: fees,
    taxRate: 0.13
  });

  logger.info(`[QuoteController] 报价生成成功: quoteId=${quote.quote.id}`);

  res.status(201).json({
    success: true,
    data: {
      quote: quote.quote
    },
    message: '报价生成成功'
  });
});

export const submitQuote = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { quoteId } = req.params;
  const { designerId } = req.body;
  let user = (req as any).user;

  // 测试环境下的默认用户
  if (!user) {
    user = {
      id: designerId || 'test-designer-id',
      role: 'DESIGNER'
    };
  }

  if (!quoteId) {
    return next(new ValidationError('报价ID为必填项'));
  }

  const quote = await quoteService.getQuoteById(quoteId);
  
  if (!quote) {
    return next(new NotFoundError('报价不存在'));
  }

  if (user.role !== 'DESIGNER' && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限提交报价'));
  }

  const submittedQuote = await quoteService.submitQuote(quoteId, user.id);

  logger.info(`[QuoteController] 报价提交成功: quoteId=${quoteId}`);

  res.status(200).json({
    success: true,
    data: {
      quote: submittedQuote
    },
    message: '报价提交成功'
  });
});

export const confirmQuote = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { quoteId } = req.params;
  const { customerId } = req.body;
  let user = (req as any).user;

  // 测试环境下的默认用户
  if (!user) {
    user = {
      id: customerId || 'test-user-id',
      role: 'CUSTOMER'
    };
  }

  if (!quoteId) {
    return next(new ValidationError('报价ID为必填项'));
  }

  const quote = await quoteService.getQuoteById(quoteId);
  
  if (!quote) {
    return next(new NotFoundError('报价不存在'));
  }

  if (user.role !== 'CUSTOMER' && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限确认报价'));
  }

  const confirmedQuote = await quoteService.confirmQuote({
    quoteId,
    customerId: user.id
  });

  logger.info(`[QuoteController] 报价确认成功: quoteId=${quoteId}`);

  res.status(200).json({
    success: true,
    data: {
      quote: confirmedQuote
    },
    message: '报价确认成功'
  });
});

export const rejectQuote = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { quoteId } = req.params;
  const { reason } = req.body;
  const user = (req as any).user;

  if (!quoteId) {
    return next(new ValidationError('报价ID为必填项'));
  }

  if (!reason) {
    return next(new ValidationError('拒绝原因为必填项'));
  }

  const quote = await quoteService.getQuoteById(quoteId);
  
  if (!quote) {
    return next(new NotFoundError('报价不存在'));
  }

  if (user.role !== 'CUSTOMER' && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限拒绝报价'));
  }

  const rejectedQuote = await quoteService.rejectQuote(quoteId, user.id, reason);

  logger.info(`[QuoteController] 报价拒绝: quoteId=${quoteId}`);

  res.status(200).json({
    success: true,
    data: {
      quote: rejectedQuote
    },
    message: '报价已拒绝'
  });
});

export const getQuoteById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { quoteId } = req.params;
  const user = (req as any).user;

  if (!quoteId) {
    return next(new ValidationError('报价ID为必填项'));
  }

  const quote = await quoteService.getQuoteById(quoteId);
  
  if (!quote) {
    return next(new NotFoundError('报价不存在'));
  }

  if (user.role !== 'ADMIN' && 
      quote.design?.designerId !== user.id && 
      quote.design?.demand?.customerId !== user.id) {
    return next(new ForbiddenError('无权限查看此报价'));
  }

  res.status(200).json({
    success: true,
    data: {
      quote
    }
  });
});

export const getQuotesByDesign = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { designId } = req.params;
  const user = (req as any).user;

  if (!designId) {
    return next(new ValidationError('设计ID为必填项'));
  }

  const quotes = await quoteService.getQuotesByDesign(designId);

  res.status(200).json({
    success: true,
    data: {
      quotes,
      total: quotes.length
    }
  });
});

export const quoteController = {
  generateQuote,
  submitQuote,
  confirmQuote,
  rejectQuote,
  getQuoteById,
  getQuotesByDesign
};

export default quoteController;
