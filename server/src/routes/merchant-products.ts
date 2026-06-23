import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { MerchantProduct } from '../entities/MerchantProduct';
import { v4 as uuidv4 } from 'uuid';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/products', auth(), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(MerchantProduct);
    const user = req.user!;
    const where: any = { status: 'active' };
    where.communityId = user.communityId;
    if (req.query.merchantId) where.merchantId = req.query.merchantId;
    if (req.query.category) where.category = req.query.category;
    const products = await repo.find({
      where,
      relations: ['merchant'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id', auth(), async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(MerchantProduct);
    const product = await repo.findOne({
      where: { id: req.params.id },
      relations: ['merchant'],
    });
    if (!product) return res.status(404).json({ message: '商品不存在' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post('/products', auth(['merchant']), async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const repo = AppDataSource.getRepository(MerchantProduct);
    const product = repo.create({
      id: uuidv4(),
      merchantId: user.id,
      communityId: user.communityId,
      ...req.body,
      status: 'active',
    });
    const saved = await repo.save(product);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id', auth(['merchant', 'admin']), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(MerchantProduct);
    const product = await repo.findOne({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ message: '商品不存在' });
    if (req.user!.role === 'merchant' && product.merchantId !== req.user!.id) {
      return res.status(403).json({ message: '无权限修改' });
    }
    repo.merge(product, req.body);
    await repo.save(product);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', auth(['merchant', 'admin']), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(MerchantProduct);
    const product = await repo.findOne({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ message: '商品不存在' });
    if (req.user!.role === 'merchant' && product.merchantId !== req.user!.id) {
      return res.status(403).json({ message: '无权限删除' });
    }
    product.status = 'inactive';
    await repo.save(product);
    res.json({ message: '已下架' });
  } catch (err) {
    next(err);
  }
});

export default router;
