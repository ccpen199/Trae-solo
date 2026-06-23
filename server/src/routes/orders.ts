import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Order } from '../entities/Order';
import { MerchantProduct } from '../entities/MerchantProduct';
import { v4 as uuidv4 } from 'uuid';
import { auth, AuthRequest } from '../middleware/auth';
import { MessageService } from '../services/messageService';
import { Message } from '../entities/Message';

const router = Router();

router.get('/', auth(), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Order);
    const user = req.user!;
    const where: any = {};
    if (user.role === 'owner') {
      where.userId = user.id;
    } else if (user.role === 'merchant') {
      const productRepo = AppDataSource.getRepository(MerchantProduct);
      const products = await productRepo.find({ where: { merchantId: user.id } });
      if (products.length > 0) {
        where.productId = products.map(p => p.id);
      } else {
        return res.json([]);
      }
    } else if (user.role !== 'admin') {
      where.communityId = user.communityId;
    }
    if (req.query.status) where.status = req.query.status;
    const orders = await repo.find({
      where,
      relations: ['user', 'product', 'product.merchant'],
      order: { createdAt: 'DESC' },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth(), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Order);
    const order = await repo.findOne({
      where: { id: req.params.id },
      relations: ['user', 'product', 'product.merchant'],
    });
    if (!order) return res.status(404).json({ message: '订单不存在' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(['owner']), async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const { productId, quantity, address, contactName, contactPhone, scheduledTime, remark } = req.body;
    const productRepo = AppDataSource.getRepository(MerchantProduct);
    const product = await productRepo.findOne({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: '商品不存在' });

    const repo = AppDataSource.getRepository(Order);
    const order = repo.create({
      id: uuidv4(),
      userId: user.id,
      productId,
      communityId: user.communityId,
      quantity: quantity || 1,
      totalAmount: product.price * (quantity || 1),
      status: 'pending',
      address,
      contactName,
      contactPhone,
      scheduledTime,
      remark,
    });
    const saved = await repo.save(order);

    const messageService = new MessageService(AppDataSource.getRepository(Message));
    await messageService.sendMessage({
      userId: product.merchantId,
      title: '新订单通知',
      content: `您有一个新订单 #${saved.id.substring(0, 8)}，请及时处理。`,
      category: 'order',
      channels: { inbox: true, sms: true, template: true },
    });

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/pay', auth(['owner']), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Order);
    const order = await repo.findOne({ where: { id: req.params.id } });
    if (!order || order.userId !== req.user!.id) return res.status(404).json({ message: '订单不存在' });
    order.status = 'paid';
    order.paidAt = new Date().toISOString();
    order.paidMethod = req.body.paidMethod || 'wechat';
    await repo.save(order);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/fulfill', auth(['merchant', 'admin']), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Order);
    const order = await repo.findOne({ where: { id: req.params.id }, relations: ['product'] });
    if (!order) return res.status(404).json({ message: '订单不存在' });
    order.status = 'fulfilled';
    order.fulfilledAt = new Date().toISOString();
    await repo.save(order);

    const messageService = new MessageService(AppDataSource.getRepository(Message));
    await messageService.sendMessage({
      userId: order.userId,
      title: '订单已完成',
      content: `您的订单 #${order.id.substring(0, 8)} 已完成履约，感谢您的支持。`,
      category: 'order',
      channels: { inbox: true, template: true },
    });

    res.json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
