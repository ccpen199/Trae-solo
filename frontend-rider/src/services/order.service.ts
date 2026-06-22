import { get, post, put } from './http';
import type {
  Order,
  OrderStatusUpdateRequest,
  OrderCancelRequest,
  OrderExceptionRequest,
  CreateOrderRequest,
  OfflineSyncRequest,
} from '@shared/types';

const isDemoMode = (): boolean => {
  try {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      const parsed = JSON.parse(token);
      if (parsed.state?.token?.startsWith?.('demo-token-')) return true;
    }
  } catch {}
  return false;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const now = Date.now();

const DEMO_RIDER_ID = 'rider-demo-001';

const buildMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-demo-' + Math.random().toString(36).slice(2, 9),
  orderNo: 'DD' + Date.now() + Math.floor(Math.random() * 1000),
  type: 'express',
  title: '同城配送',
  goodsDescription: '文件',
  goodsDesc: '文件',
  amount: 18,
  tip: 0,
  distance: 3000,
  estimatedTime: 30,
  pickupAddress: '北京市朝阳区示例地址1',
  pickupLocation: { latitude: 39.9, longitude: 116.4 },
  pickupName: '取件人',
  pickupPhone: '13800000001',
  pickupContact: { name: '取件人', phone: '13800000001' },
  deliveryAddress: '北京市朝阳区示例地址2',
  deliveryLocation: { latitude: 39.92, longitude: 116.45 },
  deliveryName: '收件人',
  deliveryPhone: '13900000001',
  deliveryContact: { name: '收件人', phone: '13900000001' },
  weight: 1,
  status: 'completed',
  riderId: DEMO_RIDER_ID,
  isUrgent: false,
  requireSignature: true,
  photos: [],
  source: 'system',
  createdAt: new Date(now - 1000 * 60 * 60 * 3),
  updatedAt: new Date(now - 1000 * 60 * 60 * 2),
  acceptedAt: new Date(now - 1000 * 60 * 60 * 2.9),
  actualPickupTime: new Date(now - 1000 * 60 * 60 * 2.5),
  actualDeliveryTime: new Date(now - 1000 * 60 * 60 * 2),
  deadline: new Date(now - 1000 * 60 * 30),
  ...overrides,
});

const demoHistoryOrders: Order[] = [
  buildMockOrder({
    id: 'order-hist-1',
    orderNo: 'DD202606210801',
    title: '同城文件快递',
    amount: 22,
    tip: 5,
    distance: 4200,
    estimatedTime: 42,
    type: 'express',
    status: 'completed',
    isUrgent: true,
    goodsDescription: '合同原件',
  }),
  buildMockOrder({
    id: 'order-hist-2',
    orderNo: 'DD202606210830',
    title: '星巴克咖啡外卖',
    amount: 12,
    tip: 8,
    distance: 1800,
    estimatedTime: 20,
    type: 'takeout',
    status: 'completed',
    goodsDescription: '咖啡×3，需保温袋',
  }),
  buildMockOrder({
    id: 'order-hist-3',
    orderNo: 'DD202606210915',
    title: '同仁堂处方药',
    amount: 14,
    tip: 6,
    distance: 2500,
    estimatedTime: 28,
    type: 'medicine',
    status: 'completed',
    goodsDescription: '处方药，核对身份证尾号',
  }),
  buildMockOrder({
    id: 'order-hist-4',
    orderNo: 'DD202606211020',
    title: '7fresh生鲜超市',
    amount: 20,
    tip: 0,
    distance: 3600,
    estimatedTime: 38,
    type: 'grocery',
    status: 'completed',
    weight: 6.5,
    goodsDescription: '生鲜冷链配送',
  }),
  buildMockOrder({
    id: 'order-hist-5',
    orderNo: 'DD202606211345',
    title: '顺丰同城重要文件',
    amount: 30,
    tip: 10,
    distance: 5800,
    estimatedTime: 55,
    type: 'document',
    status: 'exception',
    isUrgent: true,
    exceptionReason: '收件人电话无法接通',
    goodsDescription: '加急重要文件',
  }),
];

const getCurrentOrder = (): Order | undefined => {
  try {
    const state = JSON.parse(localStorage.getItem('auth-storage') || '{}').state || {};
    if (state.currentOrder) return state.currentOrder;
  } catch {}
  return undefined;
};

export const orderService = {
  createOrder: async (data: CreateOrderRequest) => {
    try {
      return await post<Order>('/orders', data);
    } catch {
      if (isDemoMode()) {
        await delay(400);
        return buildMockOrder({
          ...data,
          status: 'pending',
          riderId: undefined,
        });
      }
      throw new Error('创建订单失败');
    }
  },

  getMyOrders: async (params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }) => {
    try {
      const query = new URLSearchParams(params as any).toString();
      return await get<{ items: Order[]; total: number }>(`/orders/my?${query}`);
    } catch {
      if (isDemoMode()) {
        await delay(300);
        let list = [...demoHistoryOrders];
        if (params?.status && params.status !== 'all') {
          list = list.filter((o) => o.status === params.status);
        }
        const current = getCurrentOrder();
        if (current) list.unshift(current);
        return { items: list, total: list.length };
      }
      throw new Error('获取订单列表失败');
    }
  },

  getOrderDetail: async (orderId: string) => {
    try {
      return await get<Order>(`/orders/${orderId}`);
    } catch {
      if (isDemoMode()) {
        await delay(200);
        const hist = demoHistoryOrders.find((o) => o.id === orderId);
        if (hist) return hist;
        const cur = getCurrentOrder();
        if (cur?.id === orderId) return cur;
        return buildMockOrder({ id: orderId, status: 'delivering' });
      }
      throw new Error('订单不存在');
    }
  },

  updateOrderStatus: async (orderId: string, data: OrderStatusUpdateRequest) => {
    try {
      return await put<Order>(`/orders/${orderId}/status`, data);
    } catch {
      if (isDemoMode()) {
        await delay(350);
        const order = buildMockOrder({
          id: orderId,
          status: data.status,
          ...(data.status === 'picking_up' ? { actualPickupTime: new Date() } : {}),
          ...(data.status === 'completed' ? { actualDeliveryTime: new Date() } : {}),
          ...(data.remark ? { remark: data.remark } : {}),
        });
        try {
          const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          storage.state = storage.state || {};
          storage.state.currentOrder = order;
          localStorage.setItem('auth-storage', JSON.stringify(storage));
        } catch {}
        return order;
      }
      throw new Error('更新订单状态失败');
    }
  },

  cancelOrder: async (orderId: string, data: OrderCancelRequest) => {
    try {
      return await post<Order>(`/orders/${orderId}/cancel`, data);
    } catch {
      if (isDemoMode()) {
        await delay(300);
        return buildMockOrder({
          id: orderId,
          status: 'cancelled',
          cancelReason: data.reason,
        });
      }
      throw new Error('取消订单失败');
    }
  },

  reportException: async (orderId: string, data: OrderExceptionRequest) => {
    try {
      return await post<Order>(`/orders/${orderId}/exception`, data);
    } catch {
      if (isDemoMode()) {
        await delay(300);
        return buildMockOrder({
          id: orderId,
          status: 'exception',
          exceptionReason: data.reason || data.description || '异常',
        });
      }
      throw new Error('上报异常失败');
    }
  },

  getOrderTrajectory: async (orderId: string) => {
    try {
      return await get<any[]>(`/orders/${orderId}/trajectory`);
    } catch {
      if (isDemoMode()) {
        return [
          { latitude: 39.90, longitude: 116.40, timestamp: now - 3600000 },
          { latitude: 39.905, longitude: 116.42, timestamp: now - 2400000 },
          { latitude: 39.91, longitude: 116.435, timestamp: now - 1200000 },
          { latitude: 39.913, longitude: 116.445, timestamp: now - 600000 },
          { latitude: 39.915, longitude: 116.45, timestamp: now - 180000 },
        ];
      }
      return [];
    }
  },

  offlineSync: async (data: OfflineSyncRequest) => {
    try {
      return await post<{ successCount: number; failedCount: number; errors: any[] }>(
        '/orders/offline-sync',
        data
      );
    } catch {
      if (isDemoMode()) {
        await delay(500);
        return {
          successCount: data.records?.length || 0,
          failedCount: 0,
          errors: [],
        };
      }
      throw new Error('离线同步失败');
    }
  },
};
