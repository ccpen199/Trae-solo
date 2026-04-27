import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { abnormalDashboardEngine } from '../engines/abnormalDashboardEngine';
import { prisma } from '../lib/prisma';
import { AbnormalType, AbnormalStatus } from '../config';

export const createAbnormalValidation = [
  body('type').isIn(Object.values(AbnormalType)).withMessage('异常类型无效'),
  body('title').notEmpty().withMessage('异常标题不能为空'),
];

export const createAbnormal = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const { workOrderId, type, title, description } = req.body;

    const result = await abnormalDashboardEngine.createAbnormalReport(req.user.id, {
      workOrderId,
      type,
      title,
      description,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.abnormal,
    });
  } catch (error) {
    console.error('创建异常报告错误:', error);
    res.status(500).json({ error: '创建异常报告失败' });
  }
};

export const assignAbnormalValidation = [
  param('id').notEmpty().withMessage('异常报告ID不能为空'),
  body('assigneeId').notEmpty().withMessage('请选择处理人'),
];

export const assignAbnormal = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const { id } = req.params;
    const { assigneeId } = req.body;

    const result = await abnormalDashboardEngine.assignAbnormal(req.user.id, {
      abnormalReportId: id,
      assigneeId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.abnormal,
    });
  } catch (error) {
    console.error('分配异常报告错误:', error);
    res.status(500).json({ error: '分配异常报告失败' });
  }
};

export const startProcessingAbnormal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const { id } = req.params;

    const result = await abnormalDashboardEngine.startProcessing(req.user.id, id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.abnormal,
    });
  } catch (error) {
    console.error('开始处理异常错误:', error);
    res.status(500).json({ error: '开始处理异常失败' });
  }
};

export const resolveAbnormalValidation = [
  param('id').notEmpty().withMessage('异常报告ID不能为空'),
  body('resolution').notEmpty().withMessage('处理结果不能为空'),
];

export const resolveAbnormal = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const { id } = req.params;
    const { resolution } = req.body;

    const result = await abnormalDashboardEngine.resolveAbnormal(req.user.id, {
      abnormalReportId: id,
      resolution,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.abnormal,
    });
  } catch (error) {
    console.error('解决异常错误:', error);
    res.status(500).json({ error: '解决异常失败' });
  }
};

export const closeAbnormal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const { id } = req.params;

    const result = await abnormalDashboardEngine.closeAbnormal(req.user.id, id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.abnormal,
    });
  } catch (error) {
    console.error('关闭异常错误:', error);
    res.status(500).json({ error: '关闭异常失败' });
  }
};

export const getAbnormals = async (req: Request, res: Response) => {
  try {
    const { status, type, workOrderId, reporterId, assigneeId, page = 1, pageSize = 20 } = req.query;

    const where: any = {};

    if (status && Object.values(AbnormalStatus).includes(status as string)) {
      where.status = status as string;
    }

    if (type && Object.values(AbnormalType).includes(type as string)) {
      where.type = type as string;
    }

    if (workOrderId) {
      where.workOrderId = workOrderId as string;
    }

    if (reporterId) {
      where.reporterId = parseInt(reporterId as string);
    }

    if (assigneeId) {
      where.assignedToId = parseInt(assigneeId as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [abnormals, total] = await prisma.$transaction([
      prisma.abnormalReport.findMany({
        where,
        orderBy: { reportedAt: 'desc' },
        skip,
        take,
      }),
      prisma.abnormalReport.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        list: abnormals,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    });
  } catch (error) {
    console.error('获取异常列表错误:', error);
    res.status(500).json({ error: '获取异常列表失败' });
  }
};

export const getAbnormal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const abnormal = await prisma.abnormalReport.findUnique({
      where: { id },
    });

    if (!abnormal) {
      return res.status(404).json({ error: '异常报告不存在' });
    }

    res.json({
      success: true,
      data: abnormal,
    });
  } catch (error) {
    console.error('获取异常报告错误:', error);
    res.status(500).json({ error: '获取异常报告失败' });
  }
};

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const dashboard = await abnormalDashboardEngine.getRealtimeDashboard();

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('获取异常看板错误:', error);
    res.status(500).json({ error: '获取异常看板失败' });
  }
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const statistics = await abnormalDashboardEngine.getStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('获取异常统计错误:', error);
    res.status(500).json({ error: '获取异常统计失败' });
  }
};
