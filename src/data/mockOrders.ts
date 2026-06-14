import type { Order } from '@/types';

export const mockOrders: Order[] = [
  { id: 'O001', orderNo: '202606100001', type: 'service', itemId: 'SI001', itemTitle: '全屋深度保洁（含擦玻璃）', itemCover: 'https://picsum.photos/id/230/200/200', providerId: 'SP001', providerName: '洁家家政', amount: 298, commission: 23.84, quantity: 1, status: 'servicing', buyerId: 'U001', buyerName: '张明', buyerPhone: '138****6688', address: '5栋2单元1502', appointmentTime: '2026-06-10 14:00', createdAt: '2026-06-10 09:10:00', paidAt: '2026-06-10 09:10:25' },
  { id: 'O002', orderNo: '202606090015', type: 'product', itemId: 'PD001', itemTitle: '金龙鱼5L调和油', itemCover: 'https://picsum.photos/id/292/200/200', providerId: 'SP004', providerName: '惠民小超', amount: 69.9, commission: 4.89, quantity: 2, status: 'completed', buyerId: 'U001', buyerName: '张明', buyerPhone: '138****6688', address: '5栋2单元1502', createdAt: '2026-06-09 20:30:00', paidAt: '2026-06-09 20:30:45', completedAt: '2026-06-09 21:05:00', rating: 5, comment: '配送很快，商品正品，满意！' },
  { id: 'O003', orderNo: '202606090008', type: 'groupbuy', itemId: 'GB001', itemTitle: '山东烟台红富士苹果5斤装', itemCover: 'https://picsum.photos/id/1025/200/200', providerId: 'SP003', providerName: '邻里团优选', amount: 29.9, commission: 1.79, quantity: 1, status: 'completed', buyerId: 'U001', buyerName: '张明', buyerPhone: '138****6688', createdAt: '2026-06-09 10:15:00', paidAt: '2026-06-09 10:15:30', completedAt: '2026-06-10 08:40:00', rating: 5 },
  { id: 'O004', orderNo: '202606080022', type: 'service', itemId: 'SI003', itemTitle: '油烟机深度拆洗', itemCover: 'https://picsum.photos/id/312/200/200', providerId: 'SP001', providerName: '洁家家政', amount: 158, commission: 12.64, quantity: 1, status: 'completed', buyerId: 'U001', buyerName: '张明', buyerPhone: '138****6688', address: '5栋2单元1502', appointmentTime: '2026-06-08 15:00', createdAt: '2026-06-07 16:20:00', paidAt: '2026-06-07 16:20:50', completedAt: '2026-06-08 16:30:00', rating: 4, comment: '洗得还可以，就是师傅迟到了半小时' },
  { id: 'O005', orderNo: '202606100005', type: 'product', itemId: 'PD002', itemTitle: '农夫山泉24瓶装整箱', itemCover: 'https://picsum.photos/id/431/200/200', providerId: 'SP004', providerName: '惠民小超', amount: 28, commission: 1.96, quantity: 3, status: 'confirmed', buyerId: 'U001', buyerName: '张明', buyerPhone: '138****6688', address: '5栋2单元1502', createdAt: '2026-06-10 08:05:00', paidAt: '2026-06-10 08:05:20' },
  { id: 'O006', orderNo: '202606100009', type: 'product', itemId: 'PD003', itemTitle: '三只松鼠坚果大礼包', itemCover: 'https://picsum.photos/id/401/200/200', providerId: 'SP004', providerName: '惠民小超', amount: 99, commission: 6.93, quantity: 1, status: 'pending', buyerId: 'U001', buyerName: '张明', buyerPhone: '138****6688', address: '5栋2单元1502', createdAt: '2026-06-10 10:20:00' },
];

export const orderStatusMap = {
  pending: { label: '待付款', color: '#F59E0B' },
  paid: { label: '已付款', color: '#2E7CF6' },
  confirmed: { label: '已接单', color: '#8B5CF6' },
  servicing: { label: '服务中/配送中', color: '#F59E0B' },
  completed: { label: '已完成', color: '#10B981' },
  cancelled: { label: '已取消', color: '#86909C' },
  refunding: { label: '退款中', color: '#EF4444' },
};

export const statusColorMap = orderStatusMap;

export const mockCart = [
  { productId: 'PD002', quantity: 2 },
  { productId: 'PD004', quantity: 1 },
  { productId: 'PD005', quantity: 1 },
];
