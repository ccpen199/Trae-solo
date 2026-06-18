import { Request, Response } from 'express';
import { success, error, serverError } from '../utils/response';
import { routeService } from '../services';

export const planRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { origin, destination, currentSoc } = req.body;
    const result = await routeService.planRoute(
      origin,
      destination,
      currentSoc
    );
    success(res, result);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const saveRoutePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const routePlan = await routeService.createRoutePlan({
      ...req.body,
      userId,
    });
    success(res, routePlan, '保存成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getRoutePlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      error(res, '用户未登录', 401);
      return;
    }

    const { page, pageSize } = req.query;
    const result = await routeService.getRoutePlansByUserId(
      userId,
      page ? parseInt(page as string) : undefined,
      pageSize ? parseInt(pageSize as string) : undefined
    );
    success(res, result);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const getRoutePlanDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;
    const routePlan = await routeService.getRoutePlanById(planId);
    success(res, routePlan);
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export const deleteRoutePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;
    await routeService.deleteRoutePlan(planId);
    success(res, null, '删除成功');
  } catch (err) {
    if (err instanceof Error) {
      error(res, err.message);
    } else {
      serverError(res);
    }
  }
};

export default {
  planRoute,
  saveRoutePlan,
  getRoutePlans,
  getRoutePlanDetail,
  deleteRoutePlan,
};
