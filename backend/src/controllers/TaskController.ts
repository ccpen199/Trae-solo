import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService';
import { success, error } from '../utils/response';

const taskService = new TaskService();

export class TaskController {
  list(req: Request, res: Response) {
    const { branch_id, courier_id, type, status, page, pageSize } = req.query;
    const filter: any = {};
    if (branch_id) filter.branch_id = Number(branch_id);
    if (courier_id) {
      if (courier_id === 'me') {
        const user = (req as any).user;
        if (user) filter.courier_id = user.userId;
      } else {
        filter.courier_id = Number(courier_id);
      }
    }
    if (type) filter.type = String(type);
    if (status) filter.status = String(status);
    const result = taskService.list(filter, Number(page) || 1, Number(pageSize) || 20);
    return success(res, result.data);
  }

  getById(req: Request, res: Response) {
    const result = taskService.getById(Number(req.params.id));
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data);
  }

  create(req: Request, res: Response) {
    const { type, branch_id, tracking_no, sender_name, sender_phone, receiver_name, receiver_phone, address, scheduled_time, fee, note } = req.body;
    if (!type || !branch_id) {
      return error(res, '缺少必要参数', 1000);
    }
    const result = taskService.create({ type, branch_id, tracking_no, sender_name, sender_phone, receiver_name, receiver_phone, address, scheduled_time, fee, note });
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  assign(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { courier_id } = req.body;
    if (!courier_id) {
      return error(res, '快递员ID不能为空', 1000);
    }
    const result = taskService.assign(id, courier_id);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  start(req: Request, res: Response) {
    const result = taskService.start(Number(req.params.id));
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  complete(req: Request, res: Response) {
    const result = taskService.complete(Number(req.params.id));
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  fail(req: Request, res: Response) {
    const result = taskService.fail(Number(req.params.id));
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }
}
