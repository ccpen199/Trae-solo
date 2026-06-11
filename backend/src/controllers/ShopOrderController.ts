import { Request, Response } from 'express';
import { ShopOrderService } from '../services/ShopOrderService';
import { success, error } from '../utils/response';

const shopOrderService = new ShopOrderService();

export class ShopOrderController {
  list(req: Request, res: Response) {
    const { status, branch_id, source, page, pageSize } = req.query;
    const filters: { status?: string; branch_id?: number; source?: string } = {};
    if (status) filters.status = String(status);
    if (branch_id) filters.branch_id = Number(branch_id);
    if (source) filters.source = String(source);
    const result = shopOrderService.list(filters, Number(page) || 1, Number(pageSize) || 20);
    return success(res, result.data);
  }

  create(req: Request, res: Response) {
    const { order_no, customer_name, customer_phone, product_name, quantity, amount, branch_id, courier_id, source } = req.body;
    if (!order_no || !product_name || !branch_id) {
      return error(res, '缺少必要参数', 1000);
    }
    const result = shopOrderService.create({ order_no, customer_name, customer_phone, product_name, quantity: quantity || 1, amount: amount || 0, branch_id, courier_id, source: source || 'wechat' });
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  updateStatus(req: Request, res: Response) {
    const { status, tracking_no } = req.body;
    if (!status) {
      return error(res, '缺少必要参数', 1000);
    }
    const result = shopOrderService.updateStatus(Number(req.params.id), status, tracking_no);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    return success(res, result.data, result.message);
  }

  sync(req: Request, res: Response) {
    const { source } = req.body;
    const result = shopOrderService.syncFromSource(source || 'wechat');
    return success(res, result.data, result.message);
  }
}
