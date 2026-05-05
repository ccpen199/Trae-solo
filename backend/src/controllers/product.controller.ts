import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

type ProductStatus = 'DRAFT' | 'ON_SALE' | 'OFF_SALE' | 'SOLD_OUT';

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  summary: z.string().max(1000).optional(),
  description: z.string().optional(),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).default(0),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  videoUrl: z.string().optional(),
  categoryId: z.string().uuid(),
  isNew: z.boolean().default(false),
  isHot: z.boolean().default(false),
  isRecommend: z.boolean().default(false),
  cultureContent: z.string().optional(),
  planContent: z.string().optional(),
  activityContent: z.string().optional(),
});

export const getProductList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      categoryCode,
      categoryId,
      keyword,
      isNew,
      isHot,
      isRecommend,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Record<string, unknown> = {
      status: 'ON_SALE',
    };

    if (categoryCode) {
      where.category = {
        code: categoryCode,
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { summary: { contains: keyword as string } },
        { description: { contains: keyword as string } },
      ];
    }

    if (isNew === 'true') where.isNew = true;
    if (isHot === 'true') where.isHot = true;
    if (isRecommend === 'true') where.isRecommend = true;

    const orderBy: Record<string, string> = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder as string;
    } else if (sortBy === 'sales') {
      orderBy.sales = sortOrder as string;
    } else {
      orderBy.createdAt = sortOrder as string;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          category: {
            select: { id: true, name: true, code: true },
          },
          productSpecs: {
            select: { id: true, name: true, value: true, price: true, stock: true },
          },
        },
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, code: true },
        },
        productSpecs: {
          select: { id: true, name: true, value: true, price: true, stock: true },
        },
      },
    });

    if (!product) {
      throw new ApiError('产品不存在', 404);
    }

    if (product.status !== 'ON_SALE') {
      throw new ApiError('产品已下架', 404);
    }

    res.json({ data: product });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'ON_SALE' },
            },
          },
        },
      },
    });

    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const body = createProductSchema.parse(req.body);

    const category = await prisma.productCategory.findUnique({
      where: { id: body.categoryId },
    });

    if (!category) {
      throw new ApiError('产品分类不存在', 400);
    }

    const existingCode = await prisma.product.findUnique({
      where: { code: body.code },
    });

    if (existingCode) {
      throw new ApiError('产品编码已存在', 400);
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        code: body.code,
        summary: body.summary || null,
        description: body.description || null,
        price: body.price,
        originalPrice: body.originalPrice || null,
        stock: body.stock,
        coverImage: body.coverImage || null,
        images: body.images ? JSON.stringify(body.images) : null,
        videoUrl: body.videoUrl || null,
        categoryId: body.categoryId,
        isNew: body.isNew,
        isHot: body.isHot,
        isRecommend: body.isRecommend,
        cultureContent: body.cultureContent || null,
        planContent: body.planContent || null,
        activityContent: body.activityContent || null,
        status: 'DRAFT',
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      message: '产品创建成功',
      data: product,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ApiError(error.errors[0]?.message || '参数验证失败', 400));
    }
    next(error);
  }
};

export const getCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                price: true,
                coverImage: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      return res.json({ data: { items: [], total: 0 } });
    }

    const validItems = cart.items.filter(
      (item) => item.product.status === 'ON_SALE'
    );

    const total = validItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ data: { items: validItems, total } });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const { productId, quantity = 1, specId } = req.body;

    if (!productId) {
      throw new ApiError('产品ID不能为空', 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError('产品不存在', 404);
    }

    if (product.status !== 'ON_SALE') {
      throw new ApiError('产品已下架', 400);
    }

    const spec = specId
      ? await prisma.productSpec.findUnique({
          where: { id: specId, productId },
        })
      : null;

    if (specId && !spec) {
      throw new ApiError('产品规格不存在', 400);
    }

    const availableStock = spec ? spec.stock : product.stock;
    if (quantity > availableStock) {
      throw new ApiError('库存不足', 400);
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
      });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_specId: {
          cartId: cart.id,
          productId,
          specId: specId || '',
        },
      },
    });

    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: true,
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          specId: specId || null,
        },
        include: {
          product: true,
        },
      });
    }

    res.json({
      message: '已添加到购物车',
      data: cartItem,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      throw new ApiError('数量必须大于0', 400);
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      throw new ApiError('购物车项不存在', 404);
    }

    if (cartItem.cart.userId !== req.user.id) {
      throw new ApiError('无权限操作此购物车', 403);
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: true,
      },
    });

    res.json({
      message: '购物车已更新',
      data: updatedItem,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const { itemId } = req.params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      throw new ApiError('购物车项不存在', 404);
    }

    if (cartItem.cart.userId !== req.user.id) {
      throw new ApiError('无权限操作此购物车', 403);
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.json({ message: '已从购物车移除' });
  } catch (error) {
    next(error);
  }
};
