import type { Request, Response } from 'express';
import { MarketRepository } from '../repositories/MarketRepository.js';
import type { MarketItem } from '../types/index.js';

export class MarketController {
  private marketRepository: MarketRepository;

  constructor() {
    this.marketRepository = new MarketRepository();
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未登录',
        });
        return;
      }

      const { merchant_id, title, description, category, price, original_price, images, stock } = req.body;

      if (!merchant_id || !title || !description || !category || !price) {
        res.status(400).json({
          success: false,
          error: '请填写完整信息',
        });
        return;
      }

      const itemData: Partial<MarketItem> = {
        merchant_id,
        title,
        description,
        category,
        price,
        original_price,
        images,
        stock: stock || 0,
        status: 'on_sale',
      };

      const itemId = this.marketRepository.create(itemData);

      res.status(201).json({
        success: true,
        data: { id: itemId },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '创建商品失败',
      });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;
      
      const filters: Record<string, unknown> = {};
      if (req.query.category) filters.category = req.query.category;
      if (req.query.merchant_id) filters.merchant_id = parseInt(req.query.merchant_id as string);
      if (req.query.min_price) filters.min_price = parseFloat(req.query.min_price as string);
      if (req.query.max_price) filters.max_price = parseFloat(req.query.max_price as string);

      const result = this.marketRepository.getOnSaleItems(page, pageSize, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取商品列表失败',
      });
    }
  }

  public async adminList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 10;
      
      const filters: Record<string, unknown> = {};
      if (req.query.category) filters.category = req.query.category;
      if (req.query.merchant_id) filters.merchant_id = parseInt(req.query.merchant_id as string);
      if (req.query.status) filters.status = req.query.status;

      const result = this.marketRepository.getItemsWithDetails(page, pageSize, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取商品列表失败',
      });
    }
  }

  public async get(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的商品ID',
        });
        return;
      }

      const item = this.marketRepository.getItemWithMerchant(id);

      if (!item) {
        res.status(404).json({
          success: false,
          error: '商品不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取商品详情失败',
      });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的商品ID',
        });
        return;
      }

      const item = this.marketRepository.findById(id);
      if (!item) {
        res.status(404).json({
          success: false,
          error: '商品不存在',
        });
        return;
      }

      const { title, description, category, price, original_price, images, stock, status } = req.body;

      const updateData: Partial<MarketItem> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (price !== undefined) updateData.price = price;
      if (original_price !== undefined) updateData.original_price = original_price;
      if (images !== undefined) updateData.images = images;
      if (stock !== undefined) updateData.stock = stock;
      if (status !== undefined) updateData.status = status;

      const success = this.marketRepository.update(id, updateData);

      if (!success) {
        res.status(400).json({
          success: false,
          error: '更新商品失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '更新成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '更新商品失败',
      });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的商品ID',
        });
        return;
      }

      const success = this.marketRepository.delete(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: '商品不存在',
        });
        return;
      }

      res.json({
        success: true,
        message: '删除成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '删除商品失败',
      });
    }
  }

  public async search(req: Request, res: Response): Promise<void> {
    try {
      const keyword = req.query.keyword as string;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;

      if (!keyword) {
        res.status(400).json({
          success: false,
          error: '请提供搜索关键词',
        });
        return;
      }

      const result = this.marketRepository.searchItems(keyword, page, pageSize);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '搜索失败',
      });
    }
  }

  public async categories(req: Request, res: Response): Promise<void> {
    try {
      const categories = this.marketRepository.getCategories();

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取分类失败',
      });
    }
  }

  public async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的商品ID',
        });
        return;
      }

      if (quantity === undefined) {
        res.status(400).json({
          success: false,
          error: '请提供库存变动数量',
        });
        return;
      }

      const success = this.marketRepository.updateStock(id, quantity);

      if (!success) {
        res.status(400).json({
          success: false,
          error: '库存不足或更新失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '库存更新成功',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '操作失败',
      });
    }
  }

  public async onSale(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的商品ID',
        });
        return;
      }

      const success = this.marketRepository.update(id, { status: 'on_sale' });

      if (!success) {
        res.status(400).json({
          success: false,
          error: '操作失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '已上架',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '操作失败',
      });
    }
  }

  public async offSale(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的商品ID',
        });
        return;
      }

      const success = this.marketRepository.update(id, { status: 'off_sale' });

      if (!success) {
        res.status(400).json({
          success: false,
          error: '操作失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '已下架',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '操作失败',
      });
    }
  }
}

export default MarketController;
