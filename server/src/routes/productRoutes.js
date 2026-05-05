const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { Product } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const redisService = require('../config/redis');

const router = express.Router();

const CACHE_KEY = 'products:list';
const CACHE_TTL = 300;

// 获取商品列表（公开访问）
router.get('/', async (req, res) => {
  try {
    const cachedProducts = await redisService.get(CACHE_KEY);
    if (cachedProducts) {
      return res.json({
        success: true,
        data: {
          products: cachedProducts,
          fromCache: true,
        },
      });
    }

    const { category, status = 'active', page = 1, limit = 10 } = req.query;
    const whereClause = { status };
    if (category) whereClause.category = category;

    const offset = (page - 1) * limit;
    
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    await redisService.set(CACHE_KEY, products, CACHE_TTL);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取商品列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message,
    });
  }
});

// 获取商品详情（公开访问）
router.get(
  '/:id',
  [param('id').isUUID().withMessage('无效的商品ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const cacheKey = `product:${id}`;
      
      const cachedProduct = await redisService.get(cacheKey);
      if (cachedProduct) {
        return res.json({
          success: true,
          data: {
            product: cachedProduct,
            fromCache: true,
          },
        });
      }

      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: '商品不存在',
        });
      }

      await redisService.set(cacheKey, product, CACHE_TTL);

      res.json({
        success: true,
        data: {
          product,
        },
      });
    } catch (error) {
      console.error('获取商品详情错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 创建商品（管理员）
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').notEmpty().isLength({ max: 200 }).withMessage('商品名称不能为空且长度不超过 200'),
    body('price').isFloat({ min: 0 }).withMessage('价格必须是大于等于 0 的数字'),
    body('stock').isInt({ min: 0 }).withMessage('库存必须是大于等于 0 的整数'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { name, description, price, originalPrice, stock, image, category, status } = req.body;

      const product = await Product.create({
        name,
        description,
        price,
        originalPrice,
        stock,
        image,
        category,
        status: status || 'active',
        sold: 0,
      });

      await redisService.delete(CACHE_KEY);

      res.status(201).json({
        success: true,
        message: '商品创建成功',
        data: {
          product,
        },
      });
    } catch (error) {
      console.error('创建商品错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 更新商品（管理员）
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    param('id').isUUID().withMessage('无效的商品ID'),
    body('name').optional().isLength({ max: 200 }).withMessage('商品名称长度不超过 200'),
    body('price').optional().isFloat({ min: 0 }).withMessage('价格必须是大于等于 0 的数字'),
    body('stock').optional().isInt({ min: 0 }).withMessage('库存必须是大于等于 0 的整数'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { name, description, price, originalPrice, stock, image, category, status } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: '商品不存在',
        });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
      if (stock !== undefined) updateData.stock = stock;
      if (image !== undefined) updateData.image = image;
      if (category !== undefined) updateData.category = category;
      if (status) updateData.status = status;

      await product.update(updateData);

      await redisService.delete(CACHE_KEY);
      await redisService.delete(`product:${id}`);

      res.json({
        success: true,
        message: '商品更新成功',
        data: {
          product,
        },
      });
    } catch (error) {
      console.error('更新商品错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 删除商品（管理员）
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').isUUID().withMessage('无效的商品ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: '商品不存在',
        });
      }

      await product.destroy();

      await redisService.delete(CACHE_KEY);
      await redisService.delete(`product:${id}`);

      res.json({
        success: true,
        message: '商品删除成功',
      });
    } catch (error) {
      console.error('删除商品错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

module.exports = router;
