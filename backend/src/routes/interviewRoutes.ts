import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { interviewService, InterviewStatus } from '../services/interviewService';
import { Company } from '../entities/Company';
import { AppDataSource } from '../data-source';

const router = Router();
const companyRepository = AppDataSource.getRepository(Company);

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    if (req.user.role !== 'enterprise' && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: '无权创建面试安排' });
      return;
    }

    const company = await companyRepository.findOne({
      where: { userId: req.user.id }
    });

    if (!company && req.user.role !== 'admin') {
      res.status(400).json({ success: false, message: '请先创建企业信息' });
      return;
    }

    const companyId = req.user.role === 'admin' ? req.body.companyId : company!.id;

    const result = await interviewService.createInterview(companyId, req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建面试安排失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
    const status = req.query.status as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await interviewService.getInterviewList(req.user.id, req.user.role, {
      status,
      startDate,
      endDate,
      page,
      pageSize
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取面试列表失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const interviewId = parseInt(req.params.id, 10);
    if (isNaN(interviewId)) {
      res.status(400).json({ success: false, message: '无效的面试ID' });
      return;
    }

    const { status } = req.body;
    const validStatuses: InterviewStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: '无效的面试状态' });
      return;
    }

    let companyId: number | undefined;
    if (req.user.role === 'enterprise') {
      const company = await companyRepository.findOne({
        where: { userId: req.user.id }
      });
      if (!company) {
        res.status(400).json({ success: false, message: '企业信息不存在' });
        return;
      }
      companyId = company.id;
    } else if (req.user.role === 'admin') {
      companyId = undefined;
    } else {
      res.status(403).json({ success: false, message: '无权操作' });
      return;
    }

    const result = await interviewService.updateInterviewStatus(interviewId, status, companyId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新面试状态失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.post('/:id/sync-calendar', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const interviewId = parseInt(req.params.id, 10);
    if (isNaN(interviewId)) {
      res.status(400).json({ success: false, message: '无效的面试ID' });
      return;
    }

    const result = await interviewService.syncToCalendar(interviewId, req.user.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '日历同步失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

router.get('/:id/ics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: '用户未认证' });
      return;
    }

    const interviewId = parseInt(req.params.id, 10);
    if (isNaN(interviewId)) {
      res.status(400).json({ success: false, message: '无效的面试ID' });
      return;
    }

    const result = await interviewService.getCalendarICS(interviewId, req.user.id);
    if (result.success && result.data) {
      const data = result.data as any;
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
      res.send(data.icsData);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取日历文件失败',
      data: error instanceof Error ? error.message : error
    });
  }
});

export default router;
