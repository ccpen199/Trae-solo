import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ProductSKU } from '../models/ProductSKU';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const productRepository = AppDataSource.getRepository(ProductSKU);

    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }

    const products = await productRepository.find({ where });

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: '获取商品列表失败' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = Number.parseInt(String(id), 10);
    if (!Number.isFinite(productId)) {
      return res.status(400).json({ error: '商品ID无效' });
    }
    const productRepository = AppDataSource.getRepository(ProductSKU);
    const product = await productRepository.findOneBy({ id: productId });

    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: '获取商品详情失败' });
  }
};
