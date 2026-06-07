import { Response } from 'express';
import { ApplicationService } from '../services/ApplicationService.js';
import { AuthRequest } from '../middleware/auth.js';
import { CreateApplicationRequest } from '../types/index.js';

const applicationService = new ApplicationService();

export class ApplicationController {
  static async create(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const request = req.body as CreateApplicationRequest;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    const application = await applicationService.create(request, req.user, ip, userAgent);
    
    if (!application) {
      return res.status(400).json({ error: '创建申请失败' });
    }

    res.status(201).json(application);
  }

  static getById(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的ID' });
    }

    const application = applicationService.getById(id, req.user.id);
    if (!application) {
      return res.status(404).json({ error: '办件不存在或无权限访问' });
    }
    res.json(application);
  }

  static getMyApplications(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const status = (req.query.status as string) || 'all';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = applicationService.getByUser(req.user.id, status, page, pageSize);
    res.json(result);
  }

  static getTimeline(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的ID' });
    }

    const timeline = applicationService.getTimeline(id, req.user.id);
    if (!timeline) {
      return res.status(404).json({ error: '办件不存在或无权限访问' });
    }
    res.json(timeline);
  }

  static getStats(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const stats = applicationService.getStatsByStatus(req.user.id);
    res.json(stats);
  }

  static async submitSignature(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const id = parseInt(req.params.id);
    const { signature } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    if (isNaN(id) || !signature) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const success = await applicationService.submitSignature(id, req.user.id, signature, ip, userAgent);
    if (!success) {
      return res.status(400).json({ error: '签名提交失败' });
    }

    res.json({ success: true, message: '签名提交成功' });
  }
}
