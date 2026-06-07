import { Response } from 'express';
import { AppDataSource } from '../data-source';
import { Review } from '../models/Review';
import { Order, OrderStatus } from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../models/User';

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { orderId, rating, comment, photos } = req.body;

    if (!orderId || !rating) {
      return res.status(400).json({ error: '订单ID和评分不能为空' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: '评分必须在1-5之间' });
    }

    const orderRepository = AppDataSource.getRepository(Order);
    const reviewRepository = AppDataSource.getRepository(Review);

    const order = await orderRepository.findOneBy({ id: orderId });

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.customerId !== req.user.id) {
      return res.status(403).json({ error: '只能评价自己的订单' });
    }

    if (order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.SETTLED) {
      return res.status(400).json({ error: '订单未完成，无法评价' });
    }

    const existingReview = await reviewRepository.findOneBy({ orderId, customerId: req.user.id });
    if (existingReview) {
      return res.status(400).json({ error: '该订单已评价' });
    }

    const review = reviewRepository.create({
      orderId,
      providerId: order.providerId,
      customerId: req.user.id,
      rating,
      comment,
      photos,
    });

    await reviewRepository.save(review);

    res.status(201).json({ review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: '创建评价失败' });
  }
};

export const getProviderReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { providerId } = req.params;
    const reviewRepository = AppDataSource.getRepository(Review);

    const reviews = await reviewRepository.find({
      where: { providerId: parseInt(String(providerId)), isPublic: true },
      relations: { customer: true, order: true } as any,
      order: { createdAt: 'DESC' },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, avgRating, totalCount: reviews.length });
  } catch (error) {
    console.error('Get provider reviews error:', error);
    res.status(500).json({ error: '获取评价列表失败' });
  }
};

export const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const reviewRepository = AppDataSource.getRepository(Review);
    const where = req.user.role === UserRole.PROVIDER
      ? { providerId: req.user.id }
      : { customerId: req.user.id };

    const reviews = await reviewRepository.find({
      where,
      relations: { customer: true, provider: true, order: true } as any,
      order: { createdAt: 'DESC' },
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ error: '获取评价列表失败' });
  }
};
