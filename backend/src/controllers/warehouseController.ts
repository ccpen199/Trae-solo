import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { success, error, pagination } from '../utils/response';

export const createWarehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, name, location, manager, phone, description } = req.body;

    const warehouse = await prisma.warehouse.create({
      data: {
        code,
        name,
        location,
        manager,
        phone,
        description,
      },
    });

    res.status(201).json(success(warehouse, 'Warehouse created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getWarehouses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', pageSize = '20', keyword, isActive } = req.query;
    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * size;

    const where: Record<string, unknown> = {};

    if (keyword) {
      where.OR = [
        { code: { contains: keyword as string, mode: 'insensitive' } },
        { name: { contains: keyword as string, mode: 'insensitive' } },
        { manager: { contains: keyword as string, mode: 'insensitive' } },
        { location: { contains: keyword as string, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [total, warehouses] = await Promise.all([
      prisma.warehouse.count({ where }),
      prisma.warehouse.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json(pagination(warehouses, total, pageNum, size));
  } catch (err) {
    next(err);
  }
};

export const getWarehouseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventories: {
          include: { material: true },
        },
        stockInOrders: true,
        stockOutOrders: true,
      },
    });

    if (!warehouse) {
      res.status(404).json(error('Warehouse not found', 404));
      return;
    }

    res.json(success(warehouse));
  } catch (err) {
    next(err);
  }
};

export const updateWarehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { code, name, location, manager, phone, description, isActive } = req.body;

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        code,
        name,
        location,
        manager,
        phone,
        description,
        isActive,
      },
    });

    res.json(success(warehouse, 'Warehouse updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteWarehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.warehouse.delete({
      where: { id },
    });

    res.json(success(null, 'Warehouse deleted successfully'));
  } catch (err) {
    next(err);
  }
};
