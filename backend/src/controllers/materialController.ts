import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { success, error, pagination } from '../utils/response';

export const createMaterial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, name, spec, unit, type, categoryId, safetyStock, maxStock, description, isActive } = req.body;

    const material = await prisma.material.create({
      data: {
        code,
        name,
        spec,
        unit,
        type,
        categoryId,
        safetyStock: safetyStock ? parseFloat(safetyStock) : 0,
        maxStock: maxStock ? parseFloat(maxStock) : 0,
        description,
        isActive: isActive !== false,
      },
      include: { category: true },
    });

    res.status(201).json(success(material, 'Material created successfully'));
  } catch (err) {
    next(err);
  }
};

export const getMaterials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', pageSize = '20', keyword, type, categoryId, isActive } = req.query;
    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * size;

    const where: Record<string, unknown> = {};

    if (keyword) {
      where.OR = [
        { code: { contains: keyword as string, mode: 'insensitive' } },
        { name: { contains: keyword as string, mode: 'insensitive' } },
        { spec: { contains: keyword as string, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [total, materials] = await Promise.all([
      prisma.material.count({ where }),
      prisma.material.findMany({
        where,
        include: { category: true },
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json(pagination(materials, total, pageNum, size));
  } catch (err) {
    next(err);
  }
};

export const getMaterialById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        category: true,
        inventories: {
          include: { warehouse: true },
        },
      },
    });

    if (!material) {
      res.status(404).json(error('Material not found', 404));
      return;
    }

    res.json(success(material));
  } catch (err) {
    next(err);
  }
};

export const updateMaterial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { code, name, spec, unit, type, categoryId, safetyStock, maxStock, description, isActive } = req.body;

    const material = await prisma.material.update({
      where: { id },
      data: {
        code,
        name,
        spec,
        unit,
        type,
        categoryId,
        safetyStock: safetyStock !== undefined ? parseFloat(safetyStock) : undefined,
        maxStock: maxStock !== undefined ? parseFloat(maxStock) : undefined,
        description,
        isActive,
      },
      include: { category: true },
    });

    res.json(success(material, 'Material updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteMaterial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.material.delete({
      where: { id },
    });

    res.json(success(null, 'Material deleted successfully'));
  } catch (err) {
    next(err);
  }
};

export const getMaterialCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.materialCategory.findMany({
      include: { children: true },
      where: { parentId: null },
      orderBy: { createdAt: 'asc' },
    });

    res.json(success(categories));
  } catch (err) {
    next(err);
  }
};

export const createMaterialCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, code, description, parentId } = req.body;

    const category = await prisma.materialCategory.create({
      data: {
        name,
        code,
        description,
        parentId,
      },
    });

    res.status(201).json(success(category, 'Category created successfully'));
  } catch (err) {
    next(err);
  }
};
