import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ServiceCategory } from '../models/ServiceCategory';
import { ServiceSKU } from '../models/ServiceSKU';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categoryRepository = AppDataSource.getRepository(ServiceCategory);
    const categories = await categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
      relations: { skus: true } as any,
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: '获取分类失败' });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = Number.parseInt(String(id), 10);
    if (!Number.isFinite(categoryId)) {
      return res.status(400).json({ error: '分类ID无效' });
    }
    const categoryRepository = AppDataSource.getRepository(ServiceCategory);
    const category = await categoryRepository.findOne({
      where: { id: categoryId },
      relations: { skus: true } as any,
    });

    if (!category) {
      return res.status(404).json({ error: '分类不存在' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: '获取分类失败' });
  }
};

export const getServiceSKUs = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;
    const skuRepository = AppDataSource.getRepository(ServiceSKU);

    const where: any = { isActive: true };
    if (categoryId) {
      const parsedCategoryId = Number.parseInt(String(categoryId), 10);
      if (!Number.isFinite(parsedCategoryId)) {
        return res.status(400).json({ error: '分类ID无效' });
      }
      where.categoryId = parsedCategoryId;
    }

    const skus = await skuRepository.find({
      where,
      relations: { category: true } as any,
    });

    res.json({ skus });
  } catch (error) {
    console.error('Get service SKUs error:', error);
    res.status(500).json({ error: '获取服务列表失败' });
  }
};

export const getServiceSKUById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const skuId = Number.parseInt(String(id), 10);
    if (!Number.isFinite(skuId)) {
      return res.status(400).json({ error: '服务ID无效' });
    }
    const skuRepository = AppDataSource.getRepository(ServiceSKU);
    const sku = await skuRepository.findOne({
      where: { id: skuId },
      relations: { category: true } as any,
    });

    if (!sku) {
      return res.status(404).json({ error: '服务不存在' });
    }

    res.json({ sku });
  } catch (error) {
    console.error('Get service SKU error:', error);
    res.status(500).json({ error: '获取服务详情失败' });
  }
};
