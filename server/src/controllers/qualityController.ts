import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { QualityResult, OperationType, ProcessStatus, UserRole } from '../config';

export const createInspectionValidation = [
  body('workOrderId').notEmpty().withMessage('工单ID不能为空'),
  body('type').notEmpty().withMessage('检验类型不能为空'),
  body('sampleQty').optional().isInt({ min: 0 }).withMessage('抽样数量不能为负数'),
  body('passQty').isInt({ min: 0 }).withMessage('合格数不能为负数'),
  body('failQty').isInt({ min: 0 }).withMessage('不合格数不能为负数'),
];

export const createInspection = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const { workOrderId, workOrderProcessId, type, sampleQty, passQty, failQty, failReason, treatment, remark } = req.body;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      return res.status(404).json({ error: '工单不存在' });
    }

    let workOrderProcess = null;
    if (workOrderProcessId) {
      workOrderProcess = await prisma.workOrderProcess.findUnique({
        where: { id: workOrderProcessId },
      });

      if (!workOrderProcess) {
        return res.status(404).json({ error: '工序不存在' });
      }
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.qualityInspection.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });
    const seq = (count + 1).toString().padStart(4, '0');
    const inspectionNo = `QI${dateStr}${seq}`;

    let result = QualityResult.PENDING;
    if (passQty > 0 || failQty > 0) {
      result = failQty > 0 ? QualityResult.FAIL : QualityResult.PASS;
    }

    const inspector = await prisma.user.findUnique({ where: { id: req.user!.id } });

    const inspection = await prisma.$transaction(async (tx) => {
      const insp = await tx.qualityInspection.create({
        data: {
          inspectionNo,
          workOrderId,
          workOrderProcessId,
          workOrderNo: workOrder.workOrderNo,
          inspectorId: req.user!.id,
          inspectorName: inspector?.name,
          type,
          sampleQty,
          passQty,
          failQty,
          result,
          failReason,
          treatment,
          remark,
        },
      });

      await tx.operationLog.create({
        data: {
          userId: req.user!.id,
          userName: req.user!.name,
          userRole: req.user!.role,
          operationType: OperationType.CREATE,
          action: '创建质量检验记录',
          targetType: 'QualityInspection',
          targetId: insp.id,
          details: JSON.stringify({ workOrderId, workOrderProcessId, type, passQty, failQty, result }),
        },
      });

      if (workOrderProcessId) {
        if (result === QualityResult.FAIL) {
          await tx.workOrderProcess.update({
            where: { id: workOrderProcessId },
            data: { status: ProcessStatus.QUALITY_FAILED },
          });
        } else if (result === QualityResult.PASS) {
          const currentProcess = await tx.workOrderProcess.findUnique({
            where: { id: workOrderProcessId },
          });
          if (currentProcess?.status === ProcessStatus.QUALITY_CHECKING) {
            await tx.workOrderProcess.update({
              where: { id: workOrderProcessId },
              data: { status: ProcessStatus.COMPLETED, completedAt: new Date() },
            });
          }
        }
      }

      return insp;
    });

    res.json({
      success: true,
      data: inspection,
    });
  } catch (error) {
    console.error('创建质检记录错误:', error);
    res.status(500).json({ error: '创建质检记录失败' });
  }
};

export const updateInspectionResultValidation = [
  body('result').isIn(['PASS', 'FAIL', 'PENDING']).withMessage('检验结果无效'),
];

export const updateInspectionResult = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const { id } = req.params;
    const { result, failReason, treatment, remark } = req.body;

    const inspection = await prisma.qualityInspection.findUnique({
      where: { id },
    });

    if (!inspection) {
      return res.status(404).json({ error: '质检记录不存在' });
    }

    if (inspection.inspectorId !== req.user.id) {
      return res.status(403).json({ error: '您不是该检验的质检员' });
    }

    const updatedInspection = await prisma.$transaction(async (tx) => {
      const updated = await tx.qualityInspection.update({
        where: { id },
        data: {
          result,
          failReason,
          treatment,
          remark,
        },
      });

      await tx.operationLog.create({
        data: {
          userId: req.user!.id,
          userName: req.user!.name,
          userRole: req.user!.role,
          operationType: OperationType.UPDATE,
          action: '更新质量检验结果',
          targetType: 'QualityInspection',
          targetId: id,
          details: JSON.stringify({ result, failReason, treatment, remark }),
        },
      });

      if (inspection.workOrderProcessId) {
        if (result === 'FAIL') {
          await tx.workOrderProcess.update({
            where: { id: inspection.workOrderProcessId },
            data: { status: ProcessStatus.QUALITY_FAILED },
          });
        } else if (result === 'PASS') {
          const currentProcess = await tx.workOrderProcess.findUnique({
            where: { id: inspection.workOrderProcessId },
          });
          if (currentProcess?.status === ProcessStatus.QUALITY_CHECKING) {
            await tx.workOrderProcess.update({
              where: { id: inspection.workOrderProcessId },
              data: { status: ProcessStatus.COMPLETED, completedAt: new Date() },
            });
          }
        }
      }

      return updated;
    });

    res.json({
      success: true,
      data: updatedInspection,
    });
  } catch (error) {
    console.error('更新质检结果错误:', error);
    res.status(500).json({ error: '更新质检结果失败' });
  }
};

export const getInspections = async (req: Request, res: Response) => {
  try {
    const { workOrderId, processId, result, inspectorId, page = 1, pageSize = 20 } = req.query;

    const where: any = {};

    if (workOrderId) {
      where.workOrderId = workOrderId as string;
    }

    if (processId) {
      where.workOrderProcessId = processId as string;
    }

    if (result && Object.values(QualityResult).includes(result as string)) {
      where.result = result as string;
    }

    if (inspectorId) {
      where.inspectorId = inspectorId as string;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [inspections, total] = await prisma.$transaction([
      prisma.qualityInspection.findMany({
        where,
        orderBy: { inspectionAt: 'desc' },
        skip,
        take,
      }),
      prisma.qualityInspection.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        list: inspections,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    });
  } catch (error) {
    console.error('获取质检记录错误:', error);
    res.status(500).json({ error: '获取质检记录失败' });
  }
};

export const getInspection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const inspection = await prisma.qualityInspection.findUnique({
      where: { id },
    });

    if (!inspection) {
      return res.status(404).json({ error: '质检记录不存在' });
    }

    res.json({
      success: true,
      data: inspection,
    });
  } catch (error) {
    console.error('获取质检记录错误:', error);
    res.status(500).json({ error: '获取质检记录失败' });
  }
};
