import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/client.js';

export async function getAttendances(req: Request, res: Response) {
  try {
    const { employeeId, year, month, page = '1', pageSize = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * sizeNum;

    const where: Prisma.AttendanceWhereInput = {};

    if (employeeId) {
      where.employeeId = employeeId as string;
    }
    if (year) {
      where.year = parseInt(year as string, 10);
    }
    if (month) {
      where.month = parseInt(month as string, 10);
    }

    const [total, attendances] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        include: {
          employee: {
            include: { department: true },
          },
        },
        skip,
        take: sizeNum,
        orderBy: { year: 'desc', month: 'desc' },
      }),
    ]);

    res.json({
      data: attendances,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (error) {
    console.error('Get attendances error:', error);
    res.status(500).json({ error: '获取考勤列表失败' });
  }
}

export async function getAttendanceById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    if (!attendance) {
      return res.status(404).json({ error: '考勤记录不存在' });
    }

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: '获取考勤信息失败' });
  }
}

export async function getAttendanceByMonth(req: Request, res: Response) {
  try {
    const { employeeId, year, month } = req.params;

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_year_month: {
          employeeId,
          year: parseInt(year, 10),
          month: parseInt(month, 10),
        },
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance by month error:', error);
    res.status(500).json({ error: '获取月度考勤失败' });
  }
}

export async function createAttendance(req: Request, res: Response) {
  try {
    const data = req.body;

    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_year_month: {
          employeeId: data.employeeId,
          year: data.year,
          month: data.month,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: '该员工本月考勤已存在' });
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: data.employeeId,
        year: data.year,
        month: data.month,
        totalDays: data.totalDays || 0,
        workDays: data.workDays || 0,
        publicHolidays: data.publicHolidays || 0,
        shouldAttend: data.shouldAttend || 0,
        actualAttend: data.actualAttend || 0,
        leaveDays: parseFloat(data.leaveDays) || 0,
        sickLeave: parseFloat(data.sickLeave) || 0,
        personalLeave: parseFloat(data.personalLeave) || 0,
        annualLeave: parseFloat(data.annualLeave) || 0,
        overtimeHoliday: parseFloat(data.overtimeHoliday) || 0,
        overtimeNormal: parseFloat(data.overtimeNormal) || 0,
        lateTimes: data.lateTimes || 0,
        earlyLeaveTimes: data.earlyLeaveTimes || 0,
        absentDays: parseFloat(data.absentDays) || 0,
        status: data.status || 'DRAFT',
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ error: '创建考勤失败' });
  }
}

export async function updateAttendance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData: Prisma.AttendanceUpdateInput = {
      totalDays: data.totalDays,
      workDays: data.workDays,
      publicHolidays: data.publicHolidays,
      shouldAttend: data.shouldAttend,
      actualAttend: data.actualAttend,
      status: data.status,
      lateTimes: data.lateTimes,
      earlyLeaveTimes: data.earlyLeaveTimes,
    };

    if (data.leaveDays !== undefined) updateData.leaveDays = parseFloat(data.leaveDays) || 0;
    if (data.sickLeave !== undefined) updateData.sickLeave = parseFloat(data.sickLeave) || 0;
    if (data.personalLeave !== undefined) updateData.personalLeave = parseFloat(data.personalLeave) || 0;
    if (data.annualLeave !== undefined) updateData.annualLeave = parseFloat(data.annualLeave) || 0;
    if (data.overtimeHoliday !== undefined) updateData.overtimeHoliday = parseFloat(data.overtimeHoliday) || 0;
    if (data.overtimeNormal !== undefined) updateData.overtimeNormal = parseFloat(data.overtimeNormal) || 0;
    if (data.absentDays !== undefined) updateData.absentDays = parseFloat(data.absentDays) || 0;

    const attendance = await prisma.attendance.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    res.json(attendance);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: '更新考勤失败' });
  }
}

export async function deleteAttendance(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.attendance.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: '删除考勤失败' });
  }
}

export async function batchCreateAttendance(req: Request, res: Response) {
  try {
    const { year, month } = req.body;

    const activeEmployees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
    });

    const results: { employeeId: string; success: boolean; error?: string }[] = [];

    for (const emp of activeEmployees) {
      try {
        const existing = await prisma.attendance.findUnique({
          where: {
            employeeId_year_month: {
              employeeId: emp.id,
              year,
              month,
            },
          },
        });

        if (existing) {
          results.push({ employeeId: emp.id, success: false, error: '考勤已存在' });
          continue;
        }

        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            year,
            month,
            status: 'DRAFT',
          },
        });

        results.push({ employeeId: emp.id, success: true });
      } catch (err) {
        results.push({ employeeId: emp.id, success: false, error: String(err) });
      }
    }

    res.json({
      total: activeEmployees.length,
      successCount: results.filter((r) => r.success).length,
      results,
    });
  } catch (error) {
    console.error('Batch create attendance error:', error);
    res.status(500).json({ error: '批量创建考勤失败' });
  }
}
