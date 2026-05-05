import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { success, error, pagination } from '../utils/response';

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, name, contact, phone, email, address, taxNo, bankAccount, bankName, creditLimit, description } = req.body;

    const customer = await prisma.customer.create({
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

    res.status(201).json(success(customer, 'Customer created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json(pagination(customers, total, pageNum, size));
  } catch (err) {
    next(err);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        salesOrders: true,
        accountReceivables: true,
      },
    });

    if (!customer) {
      res.status(404).json(error('Customer not found', 404));
      return;
    }

    res.json(success(customer));
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { code, name, contact, phone, email, address, taxNo, bankAccount, bankName, creditLimit, description, isActive } = req.body;

    const customer = await prisma.customer.update({
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

    res.json(success(customer, 'Customer updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({
      where: { id },
    });

    res.json(success(null, 'Customer deleted successfully'));
  } catch (err) {
    next(err);
  }
};
