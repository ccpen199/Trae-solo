import type { Request, Response } from 'express';
import { Prisma, type Employee, type EmployeeStatus } from '@prisma/client';
import prisma from '../prisma/client.js';

export async function getEmployees(req: Request, res: Response) {
  try {
    const {
      employeeNo,
      name,
      departmentId,
      status,
      page = '1',
      pageSize = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * sizeNum;

    const where: Prisma.EmployeeWhereInput = {};

    if (employeeNo) {
      where.employeeNo = { contains: employeeNo as string };
    }
    if (name) {
      where.name = { contains: name as string };
    }
    if (departmentId) {
      where.departmentId = departmentId as string;
    }
    if (status) {
      where.status = status as EmployeeStatus;
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        include: {
          department: true,
        },
        skip,
        take: sizeNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      data: employees,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: '获取员工列表失败' });
  }
}

export async function getEmployeeById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        education: { orderBy: { startDate: 'desc' } },
        trainings: { orderBy: { startDate: 'desc' } },
        transfers: {
          include: {
            fromDepartment: true,
            toDepartment: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        rewardsPunishments: { orderBy: { date: 'desc' } },
        attendances: { orderBy: { year: 'desc', month: 'desc' } },
        salaries: { orderBy: { year: 'desc', month: 'desc' } },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: '员工不存在' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: '获取员工信息失败' });
  }
}

export async function createEmployee(req: Request, res: Response) {
  try {
    const data = req.body;

    const employeeNo = data.employeeNo || (await generateEmployeeNo());

    const employee = await prisma.employee.create({
      data: {
        employeeNo,
        name: data.name,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        idCard: data.idCard,
        phone: data.phone,
        email: data.email,
        address: data.address,
        departmentId: data.departmentId,
        position: data.position,
        entryDate: data.entryDate ? new Date(data.entryDate) : null,
        status: data.status || 'ACTIVE',
        baseSalary: parseFloat(data.baseSalary) || 0,
      },
      include: { department: true },
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Create employee error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: '员工编号或身份证号已存在' });
    }
    res.status(500).json({ error: '创建员工失败' });
  }
}

export async function updateEmployee(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData: Prisma.EmployeeUpdateInput = {
      name: data.name,
      gender: data.gender,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      idCard: data.idCard,
      phone: data.phone,
      email: data.email,
      address: data.address,
      departmentId: data.departmentId,
      position: data.position,
      entryDate: data.entryDate ? new Date(data.entryDate) : null,
      status: data.status,
    };

    if (data.baseSalary !== undefined) {
      updateData.baseSalary = parseFloat(data.baseSalary) || 0;
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: { department: true },
    });

    res.json(employee);
  } catch (error) {
    console.error('Update employee error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: '员工编号或身份证号已存在' });
    }
    res.status(500).json({ error: '更新员工失败' });
  }
}

export async function deleteEmployee(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.employee.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: '删除员工失败' });
  }
}

async function generateEmployeeNo(): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const lastEmployee = await prisma.employee.findFirst({
    where: { employeeNo: { startsWith: yearMonth } },
    orderBy: { employeeNo: 'desc' },
  });

  let sequence = 1;
  if (lastEmployee) {
    const lastSeq = parseInt(lastEmployee.employeeNo.slice(-4), 10);
    sequence = lastSeq + 1;
  }

  return `${yearMonth}${String(sequence).padStart(4, '0')}`;
}

export async function getEmployeeStats(req: Request, res: Response) {
  try {
    const [total, byStatus, byDepartment] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.employee.groupBy({
        by: ['departmentId'],
        _count: true,
        _avg: { baseSalary: true },
      }),
    ]);

    const departments = await prisma.department.findMany({
      where: { id: { in: byDepartment.map((d) => d.departmentId).filter((id): id is string => id !== null) } },
    });

    const deptMap = new Map(departments.map((d) => [d.id, d]));

    res.json({
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      byDepartment: byDepartment
        .filter((d) => d.departmentId)
        .map((d) => ({
          departmentId: d.departmentId,
          departmentName: deptMap.get(d.departmentId!)?.name,
          count: d._count,
          avgSalary: d._avg.baseSalary,
        })),
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
}
