import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/client.js';

export async function getDepartments(req: Request, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        parent: true,
        children: true,
        manager: true,
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: '获取部门列表失败' });
  }
}

export async function getDepartmentById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        manager: true,
        employees: {
          include: { department: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ error: '部门不存在' });
    }

    res.json(department);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: '获取部门信息失败' });
  }
}

export async function createDepartment(req: Request, res: Response) {
  try {
    const data = req.body;

    const department = await prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        parentId: data.parentId,
        managerId: data.managerId,
      },
      include: {
        parent: true,
        manager: true,
      },
    });

    res.status(201).json(department);
  } catch (error) {
    console.error('Create department error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: '部门名称或编码已存在' });
    }
    res.status(500).json({ error: '创建部门失败' });
  }
}

export async function updateDepartment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.parentId === id) {
      return res.status(400).json({ error: '不能将自己设为父部门' });
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        parentId: data.parentId,
        managerId: data.managerId,
      },
      include: {
        parent: true,
        manager: true,
      },
    });

    res.json(department);
  } catch (error) {
    console.error('Update department error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: '部门名称或编码已存在' });
    }
    res.status(500).json({ error: '更新部门失败' });
  }
}

export async function deleteDepartment(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const hasEmployees = await prisma.employee.count({
      where: { departmentId: id },
    });

    if (hasEmployees > 0) {
      return res.status(400).json({ error: '该部门下还有员工，无法删除' });
    }

    const hasChildren = await prisma.department.count({
      where: { parentId: id },
    });

    if (hasChildren > 0) {
      return res.status(400).json({ error: '该部门下还有子部门，无法删除' });
    }

    await prisma.department.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: '删除部门失败' });
  }
}

export async function getDepartmentTree(req: Request, res: Response) {
  try {
    const allDepartments = await prisma.department.findMany({
      include: {
        parent: true,
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    const departmentMap = new Map(
      allDepartments.map((d) => [
        d.id,
        {
          ...d,
          children: [] as typeof allDepartments,
        },
      ])
    );

    const roots: typeof allDepartments[] = [];

    for (const dept of allDepartments) {
      if (dept.parentId) {
        const parent = departmentMap.get(dept.parentId);
        if (parent) {
          (parent as any).children.push(dept);
        }
      } else {
        roots.push(dept);
      }
    }

    const tree = roots.map((r) => departmentMap.get(r.id)!);

    res.json(tree);
  } catch (error) {
    console.error('Get department tree error:', error);
    res.status(500).json({ error: '获取部门树失败' });
  }
}
