import { Request, Response } from 'express';
import { AlertService } from '../services/AlertService';
import { success, error } from '../utils/response';

const alertService = new AlertService();

export class AlertController {
  list(req: Request, res: Response) {
    const { status, page, pageSize } = req.query;
    const result = alertService.list(status ? String(status) : undefined, Number(page) || 1, Number(pageSize) || 20);
    return success(res, result.data);
  }

  getById(req: Request, res: Response) {
    const result = alertService.getById(Number(req.params.id));
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data);
  }

  create(req: Request, res: Response) {
    const { type, level, title, description, branch_id, package_id } = req.body;
    if (!type || !level || !title) {
      return error(res, '缺少必要参数', 1000);
    }
    const result = alertService.create({ type, level, title, description, branch_id, package_id });
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  resolve(req: Request, res: Response) {
    const id = Number(req.params.id);
    const resolvedBy = req.user!.userId;
    const result = alertService.resolve(id, resolvedBy);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }
}
