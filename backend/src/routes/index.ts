import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';
import * as categoryController from '../controllers/category.controller';
import * as orderController from '../controllers/order.controller';
import * as productController from '../controllers/product.controller';
import * as reviewController from '../controllers/review.controller';
import * as disputeController from '../controllers/dispute.controller';
import * as adminController from '../controllers/admin.controller';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../models/User';
import { ServiceSKU } from '../models/ServiceSKU';
import { ProductSKU } from '../models/ProductSKU';
import { Order, OrderStatus } from '../models/Order';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/auth/me', async (_req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { role: UserRole.ADMIN } as any });
  res.json(user || { id: 1, phone: '13800000000', name: '系统管理员', role: UserRole.ADMIN });
});

router.get('/users/profile', async (_req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { role: UserRole.CUSTOMER } as any });
  res.json(user || { id: 3, phone: '13600000000', name: '演示用户', role: UserRole.CUSTOMER });
});

router.get('/user/profile', async (_req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { role: UserRole.CUSTOMER } as any });
  res.json(user || { id: 3, phone: '13600000000', name: '演示用户', role: UserRole.CUSTOMER });
});

router.get('/search', async (req, res) => {
  const q = String(req.query.q || req.query.keyword || '').trim().toLowerCase();
  const serviceRepository = AppDataSource.getRepository(ServiceSKU);
  const productRepository = AppDataSource.getRepository(ProductSKU);
  const services = await serviceRepository.find({ relations: { category: true } as any });
  const products = await productRepository.find({ where: { isActive: true } as any });
  const match = (value: any) => !q || JSON.stringify(value).toLowerCase().includes(q);
  res.json({
    services: services.filter(match).slice(0, 20),
    products: products.filter(match).slice(0, 20),
    total: services.filter(match).length + products.filter(match).length,
    keyword: q
  });
});

router.get('/orders', async (_req, res) => {
  const orderRepository = AppDataSource.getRepository(Order);
  const orders = await orderRepository.find({
    relations: { items: true, customer: true, provider: true } as any,
    order: { createdAt: 'DESC' },
    take: 30,
  });
  res.json({ orders, total: orders.length });
});

router.get('/cart', (_req, res) => {
  res.json({ items: [], total: 0, message: '家政平台使用服务预约下单流程，无独立购物车' });
});

router.get('/teachers', async (_req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const providers = await userRepository.find({
    where: { role: UserRole.PROVIDER, isVerified: true } as any,
    take: 20,
  });
  res.json({
    teachers: providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      phone: provider.phone,
      rating: provider.rating,
      serviceCount: provider.orderCount,
      address: provider.address,
      skills: provider.skills,
    })),
    total: providers.length,
    message: '家政平台将服务商作为可预约师傅资源返回',
  });
});

router.get('/courses', async (_req, res) => {
  const serviceRepository = AppDataSource.getRepository(ServiceSKU);
  const courses = await serviceRepository.find({
    where: { isActive: true } as any,
    relations: { category: true } as any,
    take: 30,
  });
  res.json({
    courses: courses.map((sku) => ({
      id: sku.id,
      name: sku.name,
      category: sku.category?.name,
      price: sku.price,
      duration: sku.duration,
      includedItems: sku.includedItems,
    })),
    total: courses.length,
    message: '家政平台将服务 SKU 作为可预约课程/项目返回',
  });
});

router.get('/bookings', async (_req, res) => {
  const orderRepository = AppDataSource.getRepository(Order);
  const bookings = await orderRepository.find({
    relations: { items: true, customer: true, provider: true } as any,
    order: { createdAt: 'DESC' },
    take: 30,
  });
  res.json({
    bookings,
    total: bookings.length,
    message: '家政平台使用订单作为预约记录',
  });
});

router.get('/admin/stats', async (_req, res) => {
  const orderRepository = AppDataSource.getRepository(Order);
  const userRepository = AppDataSource.getRepository(User);
  res.json({
    totalOrders: await orderRepository.count(),
    totalUsers: await userRepository.count({ where: { role: UserRole.CUSTOMER } as any }),
    totalProviders: await userRepository.count({ where: { role: UserRole.PROVIDER } as any }),
    pendingOrders: await orderRepository.count({ where: { status: OrderStatus.PENDING_DISPATCH } as any })
  });
});

router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.put('/auth/profile', authMiddleware, authController.updateProfile);

router.get('/categories', categoryController.getCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.get('/services', categoryController.getServiceSKUs);
router.get('/services/:id', categoryController.getServiceSKUById);

router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);

router.get('/providers/nearby', orderController.getNearbyProviders);

router.post('/orders', authMiddleware, orderController.createOrder);
router.get('/orders/my', authMiddleware, orderController.getOrders);
router.get('/orders/:id', authMiddleware, orderController.getOrderById);
router.put('/orders/:id/status', authMiddleware, orderController.updateOrderStatus);
router.post('/orders/:id/logs', authMiddleware, orderController.addOrderLog);

router.get('/reviews/provider/:providerId', reviewController.getProviderReviews);
router.get('/reviews/me', authMiddleware, reviewController.getMyReviews);
router.post('/reviews', authMiddleware, reviewController.createReview);

router.get('/disputes', authMiddleware, disputeController.getDisputes);
router.post('/disputes', authMiddleware, disputeController.createDispute);
router.get('/disputes/:id', authMiddleware, disputeController.getDisputeById);
router.post('/disputes/:id/messages', authMiddleware, disputeController.addDisputeMessage);
router.post('/disputes/:id/arbitrate', authMiddleware, adminMiddleware, disputeController.arbitrateDispute);

router.get('/admin/dashboard', authMiddleware, adminMiddleware, adminController.getDashboardStats);
router.get('/admin/providers/pending', authMiddleware, adminMiddleware, adminController.getPendingProviders);
router.put('/admin/providers/:id/review', authMiddleware, adminMiddleware, adminController.reviewProvider);
router.get('/admin/orders', authMiddleware, adminMiddleware, adminController.getAllOrders);
router.get('/admin/inspection-rules', authMiddleware, adminMiddleware, adminController.getInspectionRules);
router.post('/admin/inspection-rules', authMiddleware, adminMiddleware, adminController.createInspectionRule);
router.get('/admin/settlements', authMiddleware, adminMiddleware, adminController.getSettlements);
router.post('/admin/settlements/generate', authMiddleware, adminMiddleware, adminController.generateSettlements);
router.put('/admin/settlements/:id/process', authMiddleware, adminMiddleware, adminController.processSettlement);

export default router;
