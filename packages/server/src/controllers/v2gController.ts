import { Request, Response } from 'express';
import { success, error, serverError } from '../utils/response';
import { v2gService } from '../services';

export const createStrategy = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const strategy = await v2gService.createStrategy({
      ...req.body,
      userId,
    });
    success(res, strategy, '策略创建成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getStrategies = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const strategies = await v2gService.getStrategiesByUserId(userId);
    success(res, strategies);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getStrategyDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { strategyId } = req.params;
    const strategy = await v2gService.getStrategyById(strategyId);
    success(res, strategy);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const updateStrategy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { strategyId } = req.params;
    const strategy = await v2gService.updateStrategy(strategyId, req.body);
    success(res, strategy, '更新成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const deleteStrategy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { strategyId } = req.params;
    await v2gService.deleteStrategy(strategyId);
    success(res, null, '删除成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const toggleStrategy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { strategyId } = req.params;
    const { enabled } = req.body;
    const strategy = await v2gService.toggleStrategy(strategyId, enabled);
    success(res, strategy, '操作成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const enableV2G = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const { enabled } = req.body;
    const profile = await v2gService.enableV2G(userId, enabled);
    success(res, profile, '操作成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export default {
  createStrategy,
  getStrategies,
  getStrategyDetail,
  updateStrategy,
  deleteStrategy,
  toggleStrategy,
  enableV2G,
};
