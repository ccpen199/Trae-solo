import { Router, Request, Response } from 'express';
import { financeService } from '../services/finance.service';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/permission';
import { AppError } from '../middleware/error';
import type { WithdrawStatus } from '../../../shared/types';

const router = Router();

router.get('/daily', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user || !req.user.outletId) {
      throw new AppError('未登录或网点信息不存在', 401);
    }

    const { startDate, endDate, page, pageSize } = req.query;

    const result = financeService.getDailyFinances(
      req.user.outletId,
      startDate as string,
      endDate as string,
      page ? parseInt(page as string, 10) : undefined,
      pageSize ? parseInt(pageSize as string, 10) : undefined
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: result.list,
        total: result.total,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 30,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/bank-cards', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user || !req.user.outletId) {
      throw new AppError('未登录或网点信息不存在', 401);
    }

    const cards = financeService.getBankCards(req.user.outletId);

    res.json({
      code: 200,
      message: '获取成功',
      data: cards,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/bank-cards', authMiddleware, requireRole('admin'), (req: Request, res: Response, next) => {
  try {
    if (!req.user || !req.user.outletId) {
      throw new AppError('未登录或网点信息不存在', 401);
    }

    const cardData = req.body;

    const card = financeService.addBankCard({
      ...cardData,
      outletId: req.user.outletId,
    });

    res.json({
      code: 200,
      message: '添加成功',
      data: card,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/bank-cards/:id/default', authMiddleware, requireRole('admin'), (req: Request, res: Response, next) => {
  try {
    if (!req.user || !req.user.outletId) {
      throw new AppError('未登录或网点信息不存在', 401);
    }

    const { id } = req.params;

    const success = financeService.setDefaultCard(req.user.outletId, id);

    res.json({
      code: 200,
      message: success ? '设置成功' : '设置失败',
      data: { success },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/withdraw', authMiddleware, requireRole('admin'), (req: Request, res: Response, next) => {
  try {
    if (!req.user || !req.user.outletId) {
      throw new AppError('未登录或网点信息不存在', 401);
    }

    const { amount, bankCardId } = req.body;

    const record = financeService.withdraw(
      req.user.outletId,
      parseFloat(amount),
      bankCardId,
      req.user.userId,
      req.user.username
    );

    res.json({
      code: 200,
      message: '提现申请已提交',
      data: record,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/withdraw-records', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user || !req.user.outletId) {
      throw new AppError('未登录或网点信息不存在', 401);
    }

    const { status, page, pageSize } = req.query;

    const result = financeService.getWithdrawRecords(
      req.user.outletId,
      status as WithdrawStatus,
      page ? parseInt(page as string, 10) : undefined,
      pageSize ? parseInt(pageSize as string, 10) : undefined
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: result.list,
        total: result.total,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 10,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/withdraw-records/:id/audit', authMiddleware, requireRole('operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const { id } = req.params;
    const { status, remark } = req.body;

    const record = financeService.auditWithdraw(
      id,
      status,
      req.user.userId,
      req.user.username,
      remark
    );

    res.json({
      code: 200,
      message: '审核完成',
      data: record,
    });
  } catch (error) {
    next(error);
  }
});

export default router;