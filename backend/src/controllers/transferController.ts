import type { Request, Response } from 'express';
import { Prisma, type TransferStatus } from '@prisma/client';
import prisma from '../prisma/client.js';

export async function getTransfers(req: Request, res: Response) {
  try {
    const { employeeId, status, page = '1', pageSize = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * sizeNum;

    const where: Prisma.TransferWhereInput = {};

    if (employeeId) {
      where.employeeId = employeeId as string;
    }
    if (status) {
      where.status = status as TransferStatus;
    }

    const [total, transfers] = await Promise.all([
      prisma.transfer.count({ where }),
      prisma.transfer.findMany({
        where,
        include: {
          employee: {
            include: { department: true },
          },
          fromDepartment: true,
          toDepartment: true,
        },
        skip,
        take: sizeNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      data: transfers,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: '获取调动记录失败' });
  }
}

export async function getTransferById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        employee: {
          include: { department: true },
        },
        fromDepartment: true,
        toDepartment: true,
      },
    });

    if (!transfer) {
      return res.status(404).json({ error: '调动记录不存在' });
    }

    res.json(transfer);
  } catch (error) {
    console.error('Get transfer error:', error);
    res.status(500).json({ error: '获取调动信息失败' });
  }
}

export async function createTransfer(req: Request, res: Response) {
  try {
    const data = req.body;

    const transfer = await prisma.transfer.create({
      data: {
        employeeId: data.employeeId,
        fromDepartmentId: data.fromDepartmentId,
        toDepartmentId: data.toDepartmentId,
        fromPosition: data.fromPosition,
        toPosition: data.toPosition,
        transferDate: data.transferDate ? new Date(data.transferDate) : null,
        reason: data.reason,
        approvedBy: data.approvedBy,
        status: data.status || 'PENDING',
      },
      include: {
        employee: {
          include: { department: true },
        },
        fromDepartment: true,
        toDepartment: true,
      },
    });

    res.status(201).json(transfer);
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ error: '创建调动记录失败' });
  }
}

export async function updateTransfer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    const transfer = await prisma.transfer.update({
      where: { id },
      data: {
        fromDepartmentId: data.fromDepartmentId,
        toDepartmentId: data.toDepartmentId,
        fromPosition: data.fromPosition,
        toPosition: data.toPosition,
        transferDate: data.transferDate ? new Date(data.transferDate) : null,
        reason: data.reason,
        approvedBy: data.approvedBy,
        status: data.status,
      },
      include: {
        employee: {
          include: { department: true },
        },
        fromDepartment: true,
        toDepartment: true,
      },
    });

    if (data.status === 'APPROVED') {
      await prisma.employee.update({
        where: { id: transfer.employeeId },
        data: {
          departmentId: data.toDepartmentId || transfer.toDepartmentId,
          position: data.toPosition || transfer.toPosition,
        },
      });
    }

    res.json(transfer);
  } catch (error) {
    console.error('Update transfer error:', error);
    res.status(500).json({ error: '更新调动记录失败' });
  }
}

export async function deleteTransfer(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.transfer.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete transfer error:', error);
    res.status(500).json({ error: '删除调动记录失败' });
  }
}
