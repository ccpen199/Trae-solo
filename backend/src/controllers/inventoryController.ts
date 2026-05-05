import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { success, error, pagination } from '../utils/response';
import { generateOrderNo } from '../utils/orderNo';

export const getInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', pageSize = '20', warehouseId, materialId, keyword } = req.query;
    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * size;

    const where: Record<string, unknown> = {};

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (materialId) {
      where.materialId = materialId;
    }

    let materialWhere: Record<string, unknown> | undefined;
    if (keyword) {
      materialWhere = {
        OR: [
          { code: { contains: keyword as string, mode: 'insensitive' } },
          { name: { contains: keyword as string, mode: 'insensitive' } },
          { spec: { contains: keyword as string, mode: 'insensitive' } },
        ],
      };
    }

    const [total, inventory] = await Promise.all([
      prisma.inventory.count({
        where: {
          ...where,
          ...(materialWhere ? { material: materialWhere } : {}),
        },
      }),
      prisma.inventory.findMany({
        where: {
          ...where,
          ...(materialWhere ? { material: materialWhere } : {}),
        },
        include: {
          warehouse: true,
          material: { include: { category: true } },
        },
        skip,
        take: size,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    res.json(pagination(inventory, total, pageNum, size));
  } catch (err) {
    next(err);
  }
};

export const createStockIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, warehouseId, supplierId, purchaseOrderId, remark, items } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json(error('Items are required', 400));
      return;
    }

    const orderNo = generateOrderNo('stockIn');

    let totalQty = 0;
    let totalAmount = 0;

    for (const item of items) {
      totalQty += parseFloat(item.quantity) || 0;
      totalAmount += parseFloat(item.amount) || (parseFloat(item.quantity) * parseFloat(item.unitPrice) || 0);
    }

    const stockIn = await prisma.$transaction(async (tx) => {
      const stockInRecord = await tx.stockIn.create({
        data: {
          orderNo,
          type,
          warehouseId,
          supplierId,
          purchaseOrderId,
          remark,
          totalQty,
          totalAmount,
          status: 'DRAFT',
        },
      });

      for (const item of items) {
        await tx.stockInItem.create({
          data: {
            stockInId: stockInRecord.id,
            materialId: item.materialId,
            batchNo: item.batchNo,
            quantity: parseFloat(item.quantity) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0,
            amount: parseFloat(item.amount) || (parseFloat(item.quantity) * parseFloat(item.unitPrice) || 0),
            remark: item.remark,
          },
        });
      }

      return stockInRecord;
    });

    const result = await prisma.stockIn.findUnique({
      where: { id: stockIn.id },
      include: {
        warehouse: true,
        supplier: true,
        purchaseOrder: true,
        items: { include: { material: true } },
      },
    });

    res.status(201).json(success(result, 'Stock in created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getStockIns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', pageSize = '20', type, status, warehouseId, keyword } = req.query;
    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * size;

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (keyword) {
      where.orderNo = { contains: keyword as string, mode: 'insensitive' };
    }

    const [total, stockIns] = await Promise.all([
      prisma.stockIn.count({ where }),
      prisma.stockIn.findMany({
        where,
        include: {
          warehouse: true,
          supplier: true,
          purchaseOrder: true,
        },
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json(pagination(stockIns, total, pageNum, size));
  } catch (err) {
    next(err);
  }
};

export const getStockInById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const stockIn = await prisma.stockIn.findUnique({
      where: { id },
      include: {
        warehouse: true,
        supplier: true,
        purchaseOrder: true,
        items: { include: { material: true } },
      },
    });

    if (!stockIn) {
      res.status(404).json(error('Stock in not found', 404));
      return;
    }

    res.json(success(stockIn));
  } catch (err) {
    next(err);
  }
};

export const approveStockIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const stockIn = await prisma.stockIn.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!stockIn) {
      res.status(404).json(error('Stock in not found', 404));
      return;
    }

    if (stockIn.status !== 'DRAFT') {
      res.status(400).json(error('Only draft stock in can be approved', 400));
      return;
    }

    await prisma.$transaction(async (tx) => {
      for (const item of stockIn.items) {
        const existingInventory = await tx.inventory.findUnique({
          where: {
            warehouseId_materialId: {
              warehouseId: stockIn.warehouseId,
              materialId: item.materialId,
            },
          },
        });

        if (existingInventory) {
          const newQty = existingInventory.quantity.toNumber() + item.quantity.toNumber();
          const newTotalAmount = existingInventory.totalAmount.toNumber() + item.amount.toNumber();
          const newAvgCost = newQty > 0 ? newTotalAmount / newQty : 0;

          await tx.inventory.update({
            where: { id: existingInventory.id },
            data: {
              quantity: newQty,
              availableQty: newQty,
              totalAmount: newTotalAmount,
              avgCost: newAvgCost,
              lastInDate: new Date(),
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              warehouseId: stockIn.warehouseId,
              materialId: item.materialId,
              quantity: item.quantity.toNumber(),
              availableQty: item.quantity.toNumber(),
              avgCost: item.unitPrice.toNumber(),
              totalAmount: item.amount.toNumber(),
              lastInDate: new Date(),
            },
          });
        }
      }

      await tx.stockIn.update({
        where: { id: stockIn.id },
        data: {
          status: 'COMPLETED',
          approvedAt: new Date(),
          approvedById: userId,
        },
      });
    });

    const result = await prisma.stockIn.findUnique({
      where: { id },
      include: {
        warehouse: true,
        supplier: true,
        items: { include: { material: true } },
      },
    });

    res.json(success(result, 'Stock in approved successfully'));
  } catch (err) {
    next(err);
  }
};

export const createStockOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, warehouseId, customerId, salesOrderId, remark, items } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json(error('Items are required', 400));
      return;
    }

    const orderNo = generateOrderNo('stockOut');

    let totalQty = 0;
    let totalAmount = 0;

    for (const item of items) {
      totalQty += parseFloat(item.quantity) || 0;
      totalAmount += parseFloat(item.amount) || (parseFloat(item.quantity) * parseFloat(item.unitPrice) || 0);
    }

    const stockOut = await prisma.$transaction(async (tx) => {
      const stockOutRecord = await tx.stockOut.create({
        data: {
          orderNo,
          type,
          warehouseId,
          customerId,
          salesOrderId,
          remark,
          totalQty,
          totalAmount,
          status: 'DRAFT',
        },
      });

      for (const item of items) {
        await tx.stockOutItem.create({
          data: {
            stockOutId: stockOutRecord.id,
            materialId: item.materialId,
            batchNo: item.batchNo,
            quantity: parseFloat(item.quantity) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0,
            amount: parseFloat(item.amount) || (parseFloat(item.quantity) * parseFloat(item.unitPrice) || 0),
            remark: item.remark,
          },
        });
      }

      return stockOutRecord;
    });

    const result = await prisma.stockOut.findUnique({
      where: { id: stockOut.id },
      include: {
        warehouse: true,
        customer: true,
        salesOrder: true,
        items: { include: { material: true } },
      },
    });

    res.status(201).json(success(result, 'Stock out created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getStockOuts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', pageSize = '20', type, status, warehouseId, keyword } = req.query;
    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * size;

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (keyword) {
      where.orderNo = { contains: keyword as string, mode: 'insensitive' };
    }

    const [total, stockOuts] = await Promise.all([
      prisma.stockOut.count({ where }),
      prisma.stockOut.findMany({
        where,
        include: {
          warehouse: true,
          customer: true,
          salesOrder: true,
        },
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json(pagination(stockOuts, total, pageNum, size));
  } catch (err) {
    next(err);
  }
};

export const getStockOutById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const stockOut = await prisma.stockOut.findUnique({
      where: { id },
      include: {
        warehouse: true,
        customer: true,
        salesOrder: true,
        items: { include: { material: true } },
      },
    });

    if (!stockOut) {
      res.status(404).json(error('Stock out not found', 404));
      return;
    }

    res.json(success(stockOut));
  } catch (err) {
    next(err);
  }
};

export const approveStockOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const stockOut = await prisma.stockOut.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!stockOut) {
      res.status(404).json(error('Stock out not found', 404));
      return;
    }

    if (stockOut.status !== 'DRAFT') {
      res.status(400).json(error('Only draft stock out can be approved', 400));
      return;
    }

    for (const item of stockOut.items) {
      const inventory = await prisma.inventory.findUnique({
        where: {
          warehouseId_materialId: {
            warehouseId: stockOut.warehouseId,
            materialId: item.materialId,
          },
        },
      });

      if (!inventory || inventory.availableQty.toNumber() < item.quantity.toNumber()) {
        res.status(400).json(error(`Insufficient inventory for material ${item.materialId}`, 400));
        return;
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of stockOut.items) {
        const inventory = await tx.inventory.findUnique({
          where: {
            warehouseId_materialId: {
              warehouseId: stockOut.warehouseId,
              materialId: item.materialId,
            },
          },
        });

        if (inventory) {
          const newQty = inventory.quantity.toNumber() - item.quantity.toNumber();
          const newTotalAmount = newQty * inventory.avgCost.toNumber();

          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: newQty,
              availableQty: newQty,
              totalAmount: newTotalAmount,
              lastOutDate: new Date(),
            },
          });
        }
      }

      await tx.stockOut.update({
        where: { id: stockOut.id },
        data: {
          status: 'COMPLETED',
          approvedAt: new Date(),
          approvedById: userId,
        },
      });
    });

    const result = await prisma.stockOut.findUnique({
      where: { id },
      include: {
        warehouse: true,
        customer: true,
        items: { include: { material: true } },
      },
    });

    res.json(success(result, 'Stock out approved successfully'));
  } catch (err) {
    next(err);
  }
};
