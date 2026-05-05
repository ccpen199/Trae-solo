import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { success, error, pagination } from '../utils/response';

export const createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, name, contact, phone, email, address, taxNo, bankAccount, bankName, creditLimit, description } = req.body;

    const supplier = await prisma.supplier.create({
      data: {
        code,
        name,
        contact,
        phone,
        email,
        address,
        taxNo,
        bankAccount,
        bankName,
        creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
        description,
      },
    });

    res.status(201).json(success(supplier, 'Supplier created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        { contact: { contains: keyword as string, mode: 'insensitive' } },
        { phone: { contains: keyword as string, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [total, suppliers] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json(pagination(suppliers, total, pageNum, size));
  } catch (err) {
    next(err);
  }
};

export const getSupplierById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: true,
        accountPayables: true,
      },
    });

    if (!supplier) {
      res.status(404).json(error('Supplier not found', 404));
      return;
    }

    res.json(success(supplier));
  } catch (err) {
    next(err);
  }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { code, name, contact, phone, email, address, taxNo, bankAccount, bankName, creditLimit, description, isActive } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        code,
        name,
        contact,
        phone,
        email,
        address,
        taxNo,
        bankAccount,
        bankName,
        creditLimit: creditLimit !== undefined ? parseFloat(creditLimit) : undefined,
        description,
        isActive,
      },
    });

    res.json(success(supplier, 'Supplier updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.supplier.delete({
      where: { id },
    });

    res.json(success(null, 'Supplier deleted successfully'));
  } catch (err) {
    next(err);
  }
};
