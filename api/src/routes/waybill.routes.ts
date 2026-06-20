import { Router, Request, Response } from 'express';
import { waybillService } from '../services/waybill.service';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/permission';
import { AppError } from '../middleware/error';

const router = Router();

router.get('/account', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user || !req.user.outletId) {
      throw new AppError('未登录或网点信息不存在', 401);
    }

    const account = waybillService.getAccount(req.user.outletId);

    res.json({
      code: 200,
      message: '获取成功',
      data: account,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/recharge', authMiddleware, requireRole('admin'), (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const { amount, paymentMethod } = req.body;

    if (!amount || !paymentMethod) {
      throw new AppError('充值金额和支付方式不能为空', 400);
    }

    const record = waybillService.recharge(
      req.user.outletId!,
      parseFloat(amount),
      paymentMethod,
      req.user.userId,
      req.user.username
    );

    res.json({
      code: 200,
      message: '充值成功',
      data: record,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/recharge-records', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user || !req.user.outletId) {
      throw new AppError('未登录或网点信息不存在', 401);
    }

    const { page, pageSize } = req.query;

    const result = waybillService.getRechargeRecords(
      req.user.outletId,
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

router.put('/template', authMiddleware, requireRole('admin'), (req: Request, res: Response, next) => {
  try {
    if (!req.user || !req.user.outletId) {
      throw new AppError('未登录或网点信息不存在', 401);
    }

    const templateConfig = req.body;

    const account = waybillService.updateTemplate(req.user.outletId, templateConfig);

    res.json({
      code: 200,
      message: '模板更新成功',
      data: account,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/threshold', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user || !req.user.outletId) {
      throw new AppError('未登录或网点信息不存在', 401);
    }

    const { threshold } = req.body;
    if (threshold === undefined || threshold === null) {
      throw new AppError('告警阈值不能为空', 400);
    }

    const account = waybillService.updateLowBalanceThreshold(
      req.user.outletId,
      parseFloat(threshold)
    );

    res.json({
      code: 200,
      message: '告警阈值更新成功',
      data: account,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
