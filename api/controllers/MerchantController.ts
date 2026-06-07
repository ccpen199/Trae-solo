import type { Request, Response } from 'express';
import { MerchantRepository } from '../repositories/MerchantRepository.js';
import type { Merchant } from '../types/index.js';

export class MerchantController {
  private merchantRepository: MerchantRepository;

  constructor() {
    this.merchantRepository = new MerchantRepository();
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, category, phone, address, description, business_hours } = req.body;

      if (!name || !category || !phone || !address) {
        res.status(400).json({
          success: false,
          error: '请填写完整信息',
        });
        return;
      }

      const merchantData: Partial<Merchant> = {
        user_id: req.user?.id,
        name,
        category,
        phone,
        address,
        description,
        business_hours,
        status: 'pending',
      };

      const merchantId = this.merchantRepository.create(merchantData);

      res.status(201).json({
        success: true,
        data: { id: merchantId },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '创建商家失败',
      });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 10;
      
      const filters: Record<string, unknown> = {};
      if (req.query.category) filters.category = req.query.category;
      if (req.query.status) filters.status = req.query.status;

      const result = this.merchantRepository.getMerchantsWithDetails(page, pageSize, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取商家列表失败',
      });
    }
  }

  public async approved(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 10;

      const result = this.merchantRepository.getApprovedMerchants(page, pageSize);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取商家列表失败',
      });
    }
  }

  public async get(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的商家ID',
        });
        return;
      }

      const merchant = this.merchantRepository.findById(id);

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: '商家不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: merchant,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取商家详情失败',
      });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的商家ID',
        });
        return;
      }

      const merchant = this.merchantRepository.findById(id);
      if (!merchant) {
        res.status(404).json({
          success: false,
          error: '商家不存在',
        });
        return;
      }

      const { name, category, phone, address, description, business_hours, status } = req.body;

      const updateData: Partial<Merchant> = {};
      if (name !== undefined) updateData.name = name;
      if (category !== undefined) updateData.category = category;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (description !== undefined) updateData.description = description;
      if (business_hours !== undefined) updateData.business_hours = business_hours;
      if (status !== undefined) updateData.status = status;

      const success = this.merchantRepository.update(id, updateData);

      if (!success) {
        res.status(400).json({
          success: false,
          error: '更新商家失败',
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
        error: '更新商家失败',
      });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的商家ID',
        });
        return;
      }

      const success = this.merchantRepository.delete(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: '商家不存在',
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
        error: '删除商家失败',
      });
    }
  }

  public async search(req: Request, res: Response): Promise<void> {
    try {
      const keyword = req.query.keyword as string;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 10;

      if (!keyword) {
        res.status(400).json({
          success: false,
          error: '请提供搜索关键词',
        });
        return;
      }

      const result = this.merchantRepository.searchMerchants(keyword, page, pageSize);

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
      const categories = this.merchantRepository.getCategories();

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

  public async approve(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的商家ID',
        });
        return;
      }

      const success = this.merchantRepository.update(id, { status: 'approved' });

      if (!success) {
        res.status(400).json({
          success: false,
          error: '审核失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '审核通过',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '操作失败',
      });
    }
  }

  public async reject(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: '无效的商家ID',
        });
        return;
      }

      const success = this.merchantRepository.update(id, { status: 'rejected' });

      if (!success) {
        res.status(400).json({
          success: false,
          error: '操作失败',
        });
        return;
      }

      res.json({
        success: true,
        message: '已拒绝',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '操作失败',
      });
    }
  }
}

export default MerchantController;
