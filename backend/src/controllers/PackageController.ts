import { Request, Response } from 'express';
import { PackageService } from '../services/PackageService';
import { success, error } from '../utils/response';

const packageService = new PackageService();

export class PackageController {
  list(req: Request, res: Response) {
    const { branch_id, courier_id, brand, status, type, keyword, page, pageSize } = req.query;
    const filter: any = {};
    if (branch_id) filter.branch_id = Number(branch_id);
    if (courier_id) filter.courier_id = Number(courier_id);
    if (brand) filter.brand = String(brand);
    if (status) filter.status = String(status);
    if (type) filter.type = String(type);
    if (keyword) filter.keyword = String(keyword);
    const result = packageService.list(filter, Number(page) || 1, Number(pageSize) || 20);
    return success(res, result.data);
  }

  getById(req: Request, res: Response) {
    const result = packageService.getById(Number(req.params.id));
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data);
  }

  inbound(req: Request, res: Response) {
    const { tracking_no, brand, type, branch_id, sender_name, sender_phone, receiver_name, receiver_phone, weight, fee } = req.body;
    if (!tracking_no || !brand || !type || !branch_id) {
      return error(res, '缺少必要参数', 1000);
    }
    const result = packageService.inbound({ tracking_no, brand, type, branch_id, sender_name, sender_phone, receiver_name, receiver_phone, weight, fee });
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  outbound(req: Request, res: Response) {
    const id = Number(req.params.id);
    const courierId = req.body.courier_id || req.user!.userId;
    const result = packageService.outbound(id, courierId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  sign(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { signed_by } = req.body;
    if (!signed_by) {
      return error(res, '签收人不能为空', 1000);
    }
    const result = packageService.sign(id, signed_by);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  markException(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { exception_type, exception_note } = req.body;
    if (!exception_type) {
      return error(res, '异常类型不能为空', 1000);
    }
    const result = packageService.markException(id, exception_type, exception_note || '');
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }
}
