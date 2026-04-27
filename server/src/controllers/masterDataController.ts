import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';

export const getProcessRoutes = async (req: Request, res: Response) => {
  try {
    const { isActive, search } = req.query;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { code: { contains: search as string } },
        { name: { contains: search as string } },
      ];
    }

    const processRoutes = await prisma.processRoute.findMany({
      where,
      include: {
        bom: { select: { code: true, name: true } },
        processes: { orderBy: { sequence: 'asc' } },
      },
      orderBy: { code: 'asc' },
    });

    res.json({
      success: true,
      data: processRoutes,
    });
  } catch (error) {
    console.error('获取工艺路线错误:', error);
    res.status(500).json({ error: '获取工艺路线失败' });
  }
};

export const getProcessRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const processRoute = await prisma.processRoute.findUnique({
      where: { id },
      include: {
        bom: { include: { items: { include: { material: true } } } },
        processes: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!processRoute) {
      return res.status(404).json({ error: '工艺路线不存在' });
    }

    res.json({
      success: true,
      data: processRoute,
    });
  } catch (error) {
    console.error('获取工艺路线错误:', error);
    res.status(500).json({ error: '获取工艺路线失败' });
  }
};

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const { type, search } = req.query;

    const where: any = {};

    if (type) {
      where.type = type as string;
    }

    if (search) {
      where.OR = [
        { code: { contains: search as string } },
        { name: { contains: search as string } },
      ];
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    res.json({
      success: true,
      data: materials,
    });
  } catch (error) {
    console.error('获取物料错误:', error);
    res.status(500).json({ error: '获取物料失败' });
  }
};

export const getMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      return res.status(404).json({ error: '物料不存在' });
    }

    res.json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error('获取物料错误:', error);
    res.status(500).json({ error: '获取物料失败' });
  }
};

export const getEquipment = async (req: Request, res: Response) => {
  try {
    const { status, type, search } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as string;
    }

    if (type) {
      where.type = type as string;
    }

    if (search) {
      where.OR = [
        { code: { contains: search as string } },
        { name: { contains: search as string } },
      ];
    }

    const equipment = await prisma.equipment.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    res.json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    console.error('获取设备错误:', error);
    res.status(500).json({ error: '获取设备失败' });
  }
};

export const getEquipmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      return res.status(404).json({ error: '设备不存在' });
    }

    res.json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    console.error('获取设备错误:', error);
    res.status(500).json({ error: '获取设备失败' });
  }
};

export const getBoms = async (req: Request, res: Response) => {
  try {
    const { isActive, search } = req.query;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { code: { contains: search as string } },
        { name: { contains: search as string } },
      ];
    }

    const boms = await prisma.bom.findMany({
      where,
      include: {
        items: {
          orderBy: { sequence: 'asc' },
          include: { material: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    res.json({
      success: true,
      data: boms,
    });
  } catch (error) {
    console.error('获取BOM错误:', error);
    res.status(500).json({ error: '获取BOM失败' });
  }
};

export const getBom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const bom = await prisma.bom.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sequence: 'asc' },
          include: { material: true },
        },
      },
    });

    if (!bom) {
      return res.status(404).json({ error: 'BOM不存在' });
    }

    res.json({
      success: true,
      data: bom,
    });
  } catch (error) {
    console.error('获取BOM错误:', error);
    res.status(500).json({ error: '获取BOM失败' });
  }
};

export const getOperationLogs = async (req: Request, res: Response) => {
  try {
    const { tableName, recordId, userId, operation, page = 1, pageSize = 20 } = req.query;

    const where: any = {};

    if (tableName) {
      where.tableName = tableName as string;
    }

    if (recordId) {
      where.recordId = recordId as string;
    }

    if (userId) {
      where.userId = userId as string;
    }

    if (operation) {
      where.operation = operation as string;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [logs, total] = await prisma.$transaction([
      prisma.operationLog.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.operationLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        list: logs,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    });
  } catch (error) {
    console.error('获取操作日志错误:', error);
    res.status(500).json({ error: '获取操作日志失败' });
  }
};

export const getProductionHistory = async (req: Request, res: Response) => {
  try {
    const { workOrderId, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    const where: any = {};

    if (workOrderId) {
      where.workOrderId = workOrderId as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [history, total] = await prisma.$transaction([
      prisma.productionHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.productionHistory.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        list: history,
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
    });
  } catch (error) {
    console.error('获取生产履历错误:', error);
    res.status(500).json({ error: '获取生产履历失败' });
  }
};
