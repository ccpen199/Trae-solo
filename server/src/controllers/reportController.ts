import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { realtimeReportEngine } from '../engines/realtimeReportEngine';
import { yieldEngine } from '../engines/yieldEngine';
import { prisma } from '../lib/prisma';

export const submitReportValidation = [
  body('workOrderId').notEmpty().withMessage('工单ID不能为空'),
  body('passQty').isInt({ min: 0 }).withMessage('合格数不能为负数'),
  body('failQty').isInt({ min: 0 }).withMessage('不合格数不能为负数'),
  body('workTime').optional().isInt({ min: 0 }).withMessage('工时不能为负数'),
];

export const submitReport = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const { workOrderId, workOrderProcessId, passQty, failQty, workTime, notes } = req.body;

    const result = await realtimeReportEngine.submitReport(req.user.id, {
      workOrderId,
      workOrderProcessId,
      passQty,
      failQty,
      workTime,
      notes,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: { reportId: result.reportId },
    });
  } catch (error) {
    console.error('报工错误:', error);
    res.status(500).json({ error: '报工失败' });
  }
};

export const getRealtimeStatus = async (req: Request, res: Response) => {
  try {
    const status = await realtimeReportEngine.getRealtimeStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('获取实时状态错误:', error);
    res.status(500).json({ error: '获取实时状态失败' });
  }
};

export const getProcessDashboard = async (req: Request, res: Response) => {
  try {
    const { processId } = req.params;

    const dashboard = await realtimeReportEngine.getProcessDashboard(processId);

    if (!dashboard) {
      return res.status(404).json({ error: '工序不存在' });
    }

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('获取工序看板错误:', error);
    res.status(500).json({ error: '获取工序看板失败' });
  }
};

export const getWorkOrderYield = async (req: Request, res: Response) => {
  try {
    const { workOrderId } = req.params;

    const yieldData = await yieldEngine.getWorkOrderYield(workOrderId);

    if (!yieldData) {
      return res.status(404).json({ error: '工单不存在' });
    }

    res.json({
      success: true,
      data: yieldData,
    });
  } catch (error) {
    console.error('获取工单良率错误:', error);
    res.status(500).json({ error: '获取工单良率失败' });
  }
};

export const getWorkOrdersYield = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status } = req.query;

    const yieldData = await yieldEngine.getWorkOrdersYield(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      status ? (status as string).split(',') as any : undefined
    );

    res.json({
      success: true,
      data: yieldData,
    });
  } catch (error) {
    console.error('获取工单良率列表错误:', error);
    res.status(500).json({ error: '获取工单良率列表失败' });
  }
};

export const getDailyYield = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;

    const dailyYield = await yieldEngine.getDailyYield(parseInt(days as string));

    res.json({
      success: true,
      data: dailyYield,
    });
  } catch (error) {
    console.error('获取日良率错误:', error);
    res.status(500).json({ error: '获取日良率失败' });
  }
};

export const getQualityInspectionYield = async (req: Request, res: Response) => {
  try {
    const { workOrderId, startDate, endDate } = req.query;

    const inspectionYield = await yieldEngine.getQualityInspectionYield(
      workOrderId as string | undefined,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: inspectionYield,
    });
  } catch (error) {
    console.error('获取质检良率错误:', error);
    res.status(500).json({ error: '获取质检良率失败' });
  }
};

export const getOEE = async (req: Request, res: Response) => {
  try {
    const { workOrderId } = req.params;

    const oee = await yieldEngine.calculateOEE(workOrderId);

    if (!oee) {
      return res.status(404).json({ error: '工单不存在' });
    }

    res.json({
      success: true,
      data: oee,
    });
  } catch (error) {
    console.error('获取OEE错误:', error);
    res.status(500).json({ error: '获取OEE失败' });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const { workOrderId, processId, reporterId, page = 1, pageSize = 20 } = req.query;

    const where: any = {};

    if (workOrderId) {
      where.workOrderId = workOrderId as string;
    }

    if (processId) {
      where.workOrderProcessId = processId as string;
    }

    if (reporterId) {
      where.reporterId = reporterId as string;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [reports, total] = await prisma.$transaction([
      prisma.productionReport.findMany({
        where,
        include: {
          reporter: { select: { name: true } },
          workOrder: { select: { code: true, name: true } },
          workOrderProcess: { select: { sequence: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.productionReport.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        list: reports,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    });
  } catch (error) {
    console.error('获取报工记录错误:', error);
    res.status(500).json({ error: '获取报工记录失败' });
  }
};
