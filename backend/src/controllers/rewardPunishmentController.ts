import type { Request, Response } from 'express';
import { Prisma, type RewardPunishmentType } from '@prisma/client';
import prisma from '../prisma/client.js';

export async function getRewardPunishments(req: Request, res: Response) {
  try {
    const { employeeId, type, startDate, endDate, page = '1', pageSize = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * sizeNum;

    const where: Prisma.RewardPunishmentWhereInput = {};

    if (employeeId) {
      where.employeeId = employeeId as string;
    }
    if (type) {
      where.type = type as RewardPunishmentType;
    }
    if (startDate) {
      where.date = { gte: new Date(startDate as string) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate as string) };
    }

    const [total, items] = await Promise.all([
      prisma.rewardPunishment.count({ where }),
      prisma.rewardPunishment.findMany({
        where,
        include: {
          employee: {
            include: { department: true },
          },
        },
        skip,
        take: sizeNum,
        orderBy: { date: 'desc' },
      }),
    ]);

    res.json({
      data: items,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (error) {
    console.error('Get reward punishments error:', error);
    res.status(500).json({ error: '获取奖惩记录失败' });
  }
}

export async function getRewardPunishmentById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const item = await prisma.rewardPunishment.findUnique({
      where: { id },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: '奖惩记录不存在' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get reward punishment error:', error);
    res.status(500).json({ error: '获取奖惩信息失败' });
  }
}

export async function createRewardPunishment(req: Request, res: Response) {
  try {
    const data = req.body;

    const item = await prisma.rewardPunishment.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        category: data.category,
        reason: data.reason,
        amount: parseFloat(data.amount) || 0,
        date: data.date ? new Date(data.date) : null,
        approvedBy: data.approvedBy,
        remark: data.remark,
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create reward punishment error:', error);
    res.status(500).json({ error: '创建奖惩记录失败' });
  }
}

export async function updateRewardPunishment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData: Prisma.RewardPunishmentUpdateInput = {
      type: data.type,
      category: data.category,
      reason: data.reason,
      date: data.date ? new Date(data.date) : null,
      approvedBy: data.approvedBy,
      remark: data.remark,
    };

    if (data.amount !== undefined) {
      updateData.amount = parseFloat(data.amount) || 0;
    }

    const item = await prisma.rewardPunishment.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    res.json(item);
  } catch (error) {
    console.error('Update reward punishment error:', error);
    res.status(500).json({ error: '更新奖惩记录失败' });
  }
}

export async function deleteRewardPunishment(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.rewardPunishment.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete reward punishment error:', error);
    res.status(500).json({ error: '删除奖惩记录失败' });
  }
}
