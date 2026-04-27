import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { processRouteEngine } from '../engines/processRouteEngine';
import { WorkOrderStatus, OperationType, ProcessStatus, UserRole } from '../config';

export const createWorkOrderValidation = [
  body('productName').notEmpty().withMessage('产品名称不能为空'),
  body('plannedQty').isInt({ min: 1 }).withMessage('工单数量必须大于0'),
  body('processRouteId').notEmpty().withMessage('请选择工艺路线'),
];

export const createWorkOrder = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const {
      productName,
      productSpec,
      plannedQty,
      priority,
      processRouteId,
      plannedStartDate,
      plannedEndDate,
      materials,
    } = req.body;

    const processRoute = await prisma.processRoute.findUnique({
      where: { id: processRouteId },
    });

    if (!processRoute) {
      return res.status(400).json({ error: '工艺路线不存在' });
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.workOrder.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });
    const seq = (count + 1).toString().padStart(4, '0');
    const workOrderNo = `WO${dateStr}${seq}`;

    const workOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.workOrder.create({
        data: {
          workOrderNo,
          productName,
          productSpec,
          plannedQty,
          priority: priority || 'MEDIUM',
          processRouteId: parseInt(processRouteId),
          plannedStartDate,
          plannedEndDate,
          status: WorkOrderStatus.DRAFT,
          createdBy: parseInt(req.user!.id),
        },
      });

      if (materials && materials.length > 0) {
        for (const mat of materials) {
          await tx.workOrderMaterial.create({
            data: {
              workOrderId: order.id,
              materialId: mat.materialId,
              materialName: mat.materialName,
              qty: mat.qty,
              unit: mat.unit,
            },
          });
        }
      }

      await tx.operationLog.create({
        data: {
          userId: parseInt(req.user!.id),
          userName: req.user!.name,
          userRole: req.user!.role,
          operationType: OperationType.CREATE,
          action: '创建工单',
          targetType: 'WorkOrder',
          targetId: order.id,
          details: JSON.stringify({ productName, plannedQty, processRouteId }),
        },
      });

      return order;
    });

    res.json({
      success: true,
      data: workOrder,
    });
  } catch (error) {
    console.error('创建工单错误:', error);
    res.status(500).json({ error: '创建工单失败' });
  }
};

export const issueWorkOrderValidation = [
  param('id').notEmpty().withMessage('工单ID不能为空'),
];

export const issueWorkOrder = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const { id } = req.params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        processes: true,
      },
    });

    let processRoute: any = null;
    if (workOrder?.processRouteId) {
      processRoute = await prisma.processRoute.findUnique({
        where: { id: workOrder.processRouteId },
        include: { processes: { orderBy: { sequence: 'asc' } } },
      });
    }

    if (!workOrder) {
      return res.status(404).json({ error: '工单不存在' });
    }

    if (workOrder.status !== WorkOrderStatus.DRAFT) {
      return res.status(400).json({ error: '只能下发草稿状态的工单' });
    }

    if (!workOrder.processRouteId) {
      return res.status(400).json({ error: '工单未绑定工艺路线' });
    }

    const routeProcesses = processRoute?.processes || [];
    if (routeProcesses.length === 0) {
      return res.status(400).json({ error: '工艺路线未定义工序' });
    }

    const updatedWorkOrder = await prisma.$transaction(async (tx) => {
      for (const proc of routeProcesses) {
        await tx.workOrderProcess.create({
          data: {
            workOrderId: id,
            processRouteProcessId: proc.id,
            sequence: proc.sequence,
            processName: proc.name,
            processDesc: proc.description,
            plannedQty: workOrder.plannedQty,
            status: ProcessStatus.PENDING,
            isQualityCheck: proc.isQualityCheck,
          },
        });
      }

      const updated = await tx.workOrder.update({
        where: { id },
        data: {
          status: WorkOrderStatus.PENDING_PRODUCTION,
        },
        include: {
          processRoute: { include: { processes: true } },
          materials: true,
          processes: {
            orderBy: { sequence: 'asc' },
            include: { assignments: true },
          },
        },
      });

      await tx.operationLog.create({
        data: {
          userId: parseInt(req.user!.id),
          userName: req.user!.name,
          userRole: req.user!.role,
          operationType: OperationType.STATUS_CHANGE,
          action: '下发工单',
          targetType: 'WorkOrder',
          targetId: id,
          details: JSON.stringify({ status: WorkOrderStatus.PENDING_PRODUCTION }),
        },
      });

      return updated;
    });

    res.json({
      success: true,
      data: updatedWorkOrder,
    });
  } catch (error) {
    console.error('下发工单错误:', error);
    res.status(500).json({ error: '下发工单失败' });
  }
};

export const listWorkOrders = async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, pageSize = 20 } = req.query;

    const where: any = {};

    if (status && Object.values(WorkOrderStatus).includes(status as string)) {
      where.status = status as string;
    }

    if (search) {
      where.OR = [
        { workOrderNo: { contains: search as string } },
        { productName: { contains: search as string } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [workOrders, total] = await prisma.$transaction([
      prisma.workOrder.findMany({
        where,
        include: {
          materials: true,
          processes: {
            orderBy: { sequence: 'asc' },
            include: { assignments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.workOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        list: workOrders,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    });
  } catch (error) {
    console.error('获取工单列表错误:', error);
    res.status(500).json({ error: '获取工单列表失败' });
  }
};

export const getWorkOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        materials: true,
        processes: {
          orderBy: { sequence: 'asc' },
          include: {
            assignments: true,
            reports: { orderBy: { createdAt: 'desc' } },
            inspections: { orderBy: { createdAt: 'desc' } },
            logs: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!workOrder) {
      return res.status(404).json({ error: '工单不存在' });
    }

    let processRoute: any = null;
    if (workOrder.processRouteId) {
      processRoute = await prisma.processRoute.findUnique({
        where: { id: workOrder.processRouteId },
        include: { processes: { orderBy: { sequence: 'asc' } } },
      });
    }

    const abnormals = await prisma.abnormalReport.findMany({
      where: { workOrderId: id },
      orderBy: { reportedAt: 'desc' },
    });

    const routeStatus = await processRouteEngine.getProcessRouteStatus(id);

    const result = {
      ...workOrder,
      processRoute,
      abnormals,
    };

    res.json({
      success: true,
      data: {
        workOrder: result,
        routeStatus,
      },
    });
  } catch (error) {
    console.error('获取工单详情错误:', error);
    res.status(500).json({ error: '获取工单详情失败' });
  }
};

export const assignProcessValidation = [
  param('processId').notEmpty().withMessage('工序ID不能为空'),
  body('userId').notEmpty().withMessage('请选择操作人员'),
  body('plannedQty').isInt({ min: 1 }).withMessage('分配数量必须大于0'),
];

export const assignProcess = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const { processId } = req.params;
    const { userId, equipmentId, plannedQty } = req.body;

    const process = await prisma.workOrderProcess.findUnique({
      where: { id: processId },
      include: { workOrder: true },
    });

    if (!process) {
      return res.status(404).json({ error: '工序不存在' });
    }

    if (process.status !== ProcessStatus.PENDING) {
      return res.status(400).json({ error: '该工序已被分配或已开始' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(400).json({ error: '操作人员不存在' });
    }

    let equipment: any = null;
    if (equipmentId) {
      equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const assn = await tx.processAssignment.create({
        data: {
          workOrderProcessId: processId,
          userId: parseInt(userId),
          equipmentId: equipmentId ? parseInt(equipmentId) : null,
          plannedQty,
        },
      });

      await tx.workOrderProcess.update({
        where: { id: processId },
        data: {
          status: ProcessStatus.ASSIGNED,
          assignedUserId: parseInt(userId),
          assignedUserName: user.name,
          assignedEquipmentId: equipmentId ? parseInt(equipmentId) : null,
          assignedEquipmentName: equipment?.name,
        },
      });

      await tx.operationLog.create({
        data: {
          userId: parseInt(req.user!.id),
          userName: req.user!.name,
          userRole: req.user!.role,
          operationType: OperationType.CREATE,
          action: '分配工序任务',
          targetType: 'WorkOrderProcess',
          targetId: processId,
          details: JSON.stringify({ userId, equipmentId, plannedQty }),
        },
      });

      return assn;
    });

    const updatedProcess = await prisma.workOrderProcess.findUnique({
      where: { id: processId },
      include: {
        workOrder: true,
        assignments: true,
      },
    });

    res.json({
      success: true,
      data: updatedProcess,
    });
  } catch (error) {
    console.error('分配工序错误:', error);
    res.status(500).json({ error: '分配工序失败' });
  }
};

export const startProcess = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const { processId } = req.params;

    const result = await processRouteEngine.startProcess(processId, req.user.id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.processes?.[0],
    });
  } catch (error) {
    console.error('开始工序错误:', error);
    res.status(500).json({ error: '开始工序失败' });
  }
};
