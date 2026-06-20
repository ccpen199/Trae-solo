import type { Product, Order, OrderItem, OrderStatus } from '@/types/entity';

const now = new Date().toISOString();
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

const productCategories = ['生鲜食品', '日用百货', '家电数码', '服装鞋帽', '家居用品', '食品饮料'];

const productNames = [
  { name: '新鲜鸡蛋 30枚装', category: '生鲜食品', price: 29.9, stock: 100 },
  { name: '有机蔬菜套餐', category: '生鲜食品', price: 59.9, stock: 50 },
  { name: '进口水果礼盒', category: '生鲜食品', price: 128.0, stock: 30 },
  { name: '精选五花肉', category: '生鲜食品', price: 45.0, stock: 80 },
  { name: '大米 5kg装', category: '食品饮料', price: 39.9, stock: 200 },
  { name: '食用油 5L', category: '食品饮料', price: 79.9, stock: 150 },
  { name: '牛奶 250ml*24盒', category: '食品饮料', price: 69.9, stock: 120 },
  { name: '洗衣液 3kg', category: '日用百货', price: 35.9, stock: 180 },
  { name: '抽纸 24包', category: '日用百货', price: 49.9, stock: 200 },
  { name: '牙膏套装', category: '日用百货', price: 29.9, stock: 300 },
  { name: '智能音箱', category: '家电数码', price: 299.0, stock: 50 },
  { name: '蓝牙耳机', category: '家电数码', price: 199.0, stock: 80 },
  { name: '电动牙刷', category: '家电数码', price: 159.0, stock: 60 },
  { name: '充电宝 20000mAh', category: '家电数码', price: 89.9, stock: 100 },
  { name: '男士T恤', category: '服装鞋帽', price: 79.0, stock: 150 },
  { name: '女士连衣裙', category: '服装鞋帽', price: 199.0, stock: 80 },
  { name: '运动鞋', category: '服装鞋帽', price: 299.0, stock: 60 },
  { name: '床上用品四件套', category: '家居用品', price: 299.0, stock: 40 },
  { name: '收纳箱套装', category: '家居用品', price: 89.9, stock: 70 },
  { name: '厨房用具套装', category: '家居用品', price: 159.0, stock: 50 },
];

export const mockProducts: Product[] = productNames.map((p, idx) => ({
  id: `prod_${(idx + 1).toString().padStart(3, '0')}`,
  name: p.name,
  description: `${p.name} - 优质商品，品质保证。自营商品，极速配送。`,
  price: p.price,
  stock: p.stock,
  category: p.category,
  imageUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=prod${idx + 1}`,
  createdAt: thirtyDaysAgo,
  updatedAt: now,
}));

const orderStatuses: OrderStatus[] = ['PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'];

const residentUsers = [
  { id: 'user_res_001', name: '张三' },
  { id: 'user_res_002', name: '李四' },
  { id: 'user_res_003', name: '王五' },
  { id: 'user_res_004', name: '赵六' },
  { id: 'user_res_005', name: '孙七' },
];

export const mockOrders: Order[] = [];
export const mockOrderItems: OrderItem[] = [];

for (let i = 1; i <= 15; i++) {
  const user = residentUsers[(i - 1) % residentUsers.length];
  const status = orderStatuses[(i - 1) % orderStatuses.length];
  const createdAt = new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000);
  const paidAt = status !== 'PENDING_PAYMENT' && status !== 'CANCELLED'
    ? new Date(createdAt.getTime() + 30 * 60 * 1000)
    : undefined;

  const itemCount = 1 + (i % 3);
  let totalAmount = 0;
  const items: OrderItem[] = [];

  for (let j = 0; j < itemCount; j++) {
    const product = mockProducts[(i + j) % mockProducts.length];
    const quantity = 1 + Math.floor(Math.random() * 3);
    const subtotal = Math.round(product.price * quantity * 100) / 100;
    totalAmount += subtotal;

    items.push({
      id: `item_${i}_${j}`,
      orderId: `order_${i.toString().padStart(3, '0')}`,
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
      subtotal,
    });
  }

  mockOrderItems.push(...items);

  mockOrders.push({
    id: `order_${i.toString().padStart(3, '0')}`,
    orderNo: `ORD${createdAt.getFullYear()}${String(i).padStart(8, '0')}`,
    userId: user.id,
    userName: user.name,
    totalAmount: Math.round(totalAmount * 100) / 100,
    status,
    paymentMethod: i % 2 === 0 ? '微信支付' : '支付宝',
    paidAt: paidAt?.toISOString(),
    createdAt: createdAt.toISOString(),
    updatedAt: now,
  });
}
