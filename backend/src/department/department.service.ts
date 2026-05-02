import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Department } from '@prisma/client';

@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: true,
        children: true,
        doctors: { include: { user: true } },
      },
    });
  }

  async findAllWithDeleted(): Promise<Department[]> {
    return this.prisma.department.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findById(id: string): Promise<Department> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        doctors: { include: { user: true } },
        schedules: { include: { doctor: { include: { user: true } } } },
      },
    });

    if (!department) {
      throw new NotFoundException('科室不存在');
    }

    return department;
  }

  async findByCode(code: string): Promise<Department | null> {
    return this.prisma.department.findUnique({
      where: { code },
      include: { doctors: { include: { user: true } } },
    });
  }

  async create(data: {
    name: string;
    code: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
    floor?: string;
    roomNumber?: string;
  }): Promise<Department> {
    const existingByCode = await this.findByCode(data.code);
    if (existingByCode) {
      throw new ConflictException('科室编码已存在');
    }

    if (data.parentId) {
      const parent = await this.findById(data.parentId);
      if (!parent) {
        throw new NotFoundException('父科室不存在');
      }
    }

    const department = await this.prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        parentId: data.parentId,
        sortOrder: data.sortOrder || 0,
        floor: data.floor,
        roomNumber: data.roomNumber,
      },
      include: { parent: true, children: true },
    });

    this.logger.log(`科室 ${department.name} 创建成功，编码: ${department.code}`);

    return department;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      code: string;
      description: string;
      parentId: string;
      sortOrder: number;
      floor: string;
      roomNumber: string;
      isActive: boolean;
    }>,
  ): Promise<Department> {
    const department = await this.findById(id);

    if (data.code && data.code !== department.code) {
      const existingByCode = await this.findByCode(data.code);
      if (existingByCode) {
        throw new ConflictException('科室编码已存在');
      }
    }

    if (data.parentId && data.parentId === id) {
      throw new ConflictException('不能设置自身为父科室');
    }

    if (data.parentId) {
      const parent = await this.findById(data.parentId);
      if (!parent) {
        throw new NotFoundException('父科室不存在');
      }
    }

    const updatedDepartment = await this.prisma.department.update({
      where: { id },
      data,
      include: { parent: true, children: true },
    });

    this.logger.log(`科室 ${id} 更新成功`);

    return updatedDepartment;
  }

  async delete(id: string): Promise<void> {
    const department = await this.findById(id);

    const doctorsCount = await this.prisma.doctor.count({
      where: { departmentId: id },
    });

    if (doctorsCount > 0) {
      throw new ConflictException(`该科室下还有 ${doctorsCount} 名医生，无法删除`);
    }

    const childrenCount = await this.prisma.department.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new ConflictException(`该科室下还有 ${childrenCount} 个子科室，无法删除`);
    }

    await this.prisma.department.delete({
      where: { id },
    });

    this.logger.log(`科室 ${department.name} 已删除`);
  }

  async softDelete(id: string): Promise<Department> {
    return this.update(id, { isActive: false });
  }

  async search(query: string): Promise<Department[]> {
    const lowerQuery = query.toLowerCase();
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { doctors: { include: { user: true } } },
    });
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(lowerQuery) ||
        d.code.toLowerCase().includes(lowerQuery) ||
        (d.description && d.description.toLowerCase().includes(lowerQuery)),
    );
  }

  async getTree(): Promise<any[]> {
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }],
      include: { children: true },
    });

    const buildTree = (parentId: string | null): any[] => {
      return departments
        .filter((d) => d.parentId === parentId)
        .map((d) => ({
          ...d,
          children: buildTree(d.id),
        }));
    };

    return buildTree(null);
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withDoctors: number;
  }> {
    const total = await this.prisma.department.count();
    const active = await this.prisma.department.count({ where: { isActive: true } });
    const inactive = total - active;

    const departmentsWithDoctors = await this.prisma.department.findMany({
      where: { isActive: true },
      include: { _count: { select: { doctors: true } } },
    });

    const withDoctors = departmentsWithDoctors.filter((d) => d._count.doctors > 0).length;

    return { total, active, inactive, withDoctors };
  }
}
