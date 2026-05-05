import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/client.js';

export async function getTrainings(req: Request, res: Response) {
  try {
    const { employeeId, page = '1', pageSize = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * sizeNum;

    const where: Prisma.TrainingWhereInput = {};

    if (employeeId) {
      where.employeeId = employeeId as string;
    }

    const [total, trainings] = await Promise.all([
      prisma.training.count({ where }),
      prisma.training.findMany({
        where,
        include: {
          employee: {
            include: { department: true },
          },
        },
        skip,
        take: sizeNum,
        orderBy: { startDate: 'desc' },
      }),
    ]);

    res.json({
      data: trainings,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (error) {
    console.error('Get trainings error:', error);
    res.status(500).json({ error: '获取培训记录失败' });
  }
}

export async function getTrainingById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    if (!training) {
      return res.status(404).json({ error: '培训记录不存在' });
    }

    res.json(training);
  } catch (error) {
    console.error('Get training error:', error);
    res.status(500).json({ error: '获取培训信息失败' });
  }
}

export async function createTraining(req: Request, res: Response) {
  try {
    const data = req.body;

    const training = await prisma.training.create({
      data: {
        employeeId: data.employeeId,
        name: data.name,
        provider: data.provider,
        content: data.content,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        duration: data.duration,
        result: data.result,
        certificateNo: data.certificateNo,
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    res.status(201).json(training);
  } catch (error) {
    console.error('Create training error:', error);
    res.status(500).json({ error: '创建培训记录失败' });
  }
}

export async function updateTraining(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    const training = await prisma.training.update({
      where: { id },
      data: {
        name: data.name,
        provider: data.provider,
        content: data.content,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        duration: data.duration,
        result: data.result,
        certificateNo: data.certificateNo,
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    res.json(training);
  } catch (error) {
    console.error('Update training error:', error);
    res.status(500).json({ error: '更新培训记录失败' });
  }
}

export async function deleteTraining(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.training.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete training error:', error);
    res.status(500).json({ error: '删除培训记录失败' });
  }
}
