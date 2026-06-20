import type { ApiResponse, PageResult, PageParams } from '@/types/api';
import type { Product, Order, OrderItem } from '@/types/entity';
import { mockDelay, mockSuccess, generateId } from '@/mocks/utils';
import { mockProducts, mockOrders, mockOrderItems } from '@/mocks/data/mall';

export interface ProductListParams extends PageParams {
  category?: string;
  keyword?: string;
}

export const getProductList = async (
  params?: ProductListParams
): Promise<ApiResponse<PageResult<Product>>> => {
  await mockDelay();

  let list = [...mockProducts];

  if (params?.category) {
    list = list.filter((p) => p.category === params.category);
  }
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(kw));
  }

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedList = list.slice(start, end);

  return mockSuccess({
    list: paginatedList,
    total,
    page,
    pageSize,
    totalPages,
  });
};

export const getProductDetail = async (id: string): Promise<ApiResponse<Product | null>> => {
  await mockDelay();
  const product = mockProducts.find((p) => p.id === id) || null;
  return mockSuccess(product);
};

export interface OrderListParams extends PageParams {
  status?: string;
}

export const getOrderList = async (
  params?: OrderListParams
): Promise<ApiResponse<PageResult<Order>>> => {
  await mockDelay();

  let list = [...mockOrders];

  if (params?.status) {
    list = list.filter((o) => o.status === params.status);
  }

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedList = list.slice(start, end);

  return mockSuccess({
    list: paginatedList,
    total,
    page,
    pageSize,
    totalPages,
  });
};

export interface OrderDetail extends Order {
  items: OrderItem[];
}

export const getOrderDetail = async (id: string): Promise<ApiResponse<OrderDetail | null>> => {
  await mockDelay();

  const order = mockOrders.find((o) => o.id === id);
  if (!order) {
    return mockSuccess(null);
  }

  const items = mockOrderItems.filter((item) => item.orderId === id);

  return mockSuccess({
    ...order,
    items,
  });
};

export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export const createOrder = async (items: CreateOrderItem[]): Promise<ApiResponse<Order>> => {
  await mockDelay();

  const now = new Date();
  const orderId = generateId('order');
  let totalAmount = 0;
  const orderItems: OrderItem[] = [];

  items.forEach((item, idx) => {
    const product = mockProducts.find((p) => p.id === item.productId);
    if (product) {
      const subtotal = Math.round(product.price * item.quantity * 100) / 100;
      totalAmount += subtotal;
      orderItems.push({
        id: generateId('item'),
        orderId,
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal,
      });
    }
  });

  const newOrder: Order = {
    id: orderId,
    orderNo: `ORD${now.getFullYear()}${String(mockOrders.length + 1).padStart(8, '0')}`,
    userId: 'user_res_001',
    userName: '张三',
    totalAmount: Math.round(totalAmount * 100) / 100,
    status: 'PENDING_PAYMENT',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  mockOrders.unshift(newOrder);
  mockOrderItems.push(...orderItems);

  return mockSuccess(newOrder);
};
