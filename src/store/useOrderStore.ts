import { create } from 'zustand';
import type { Order, OrderStatus, ServiceNode } from '@/types';

interface OrderState {
  orderList: Order[];
  currentOrder: Order | null;
  serviceNodes: ServiceNode[];
  setOrderList: (orders: Order[]) => void;
  setCurrentOrder: (order: Order | null) => void;
  setServiceNodes: (nodes: ServiceNode[]) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: number, status: OrderStatus, statusLabel: string) => void;
  addServiceNode: (node: Omit<ServiceNode, 'id'>) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  clearCurrentOrder: () => void;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待派单',
  assigned: '已派单',
  accepted: '已接单',
  departing: '已出发',
  arrived: '已到达',
  servicing: '服务中',
  completed: '已完成',
  cancelled: '已取消',
  compensated: '已赔付',
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orderList: [
    {
      id: 1001,
      user_id: 1,
      worker_id: 101,
      service_type: 'cleaning',
      service_type_label: '日常保洁',
      address: '北京市朝阳区建国路88号SOHO现代城A座1201室',
      lng: 116.46,
      lat: 39.91,
      start_time: '2024-06-15T09:00:00Z',
      duration_hours: 3,
      status: 'servicing',
      status_label: '服务中',
      amount: 198,
      remark: '重点清理厨房和卫生间',
      worker_name: '王阿姨',
      worker_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie1',
      worker_phone: '13700137001',
      created_at: '2024-06-14T18:30:00Z',
    },
    {
      id: 1002,
      user_id: 1,
      worker_id: 102,
      service_type: 'babysitting',
      service_type_label: '育儿陪护',
      address: '北京市朝阳区建国路88号SOHO现代城A座1201室',
      lng: 116.46,
      lat: 39.91,
      start_time: '2024-06-16T14:00:00Z',
      duration_hours: 4,
      status: 'assigned',
      status_label: '已派单',
      amount: 280,
      remark: '照顾3岁宝宝，含晚餐',
      worker_name: '李阿姨',
      worker_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie2',
      worker_phone: '13700137002',
      created_at: '2024-06-14T20:00:00Z',
    },
    {
      id: 1003,
      user_id: 1,
      service_type: 'cooking',
      service_type_label: '上门烹饪',
      address: '北京市海淀区中关村大街1号海龙大厦15层',
      lng: 116.32,
      lat: 39.98,
      start_time: '2024-06-17T11:00:00Z',
      duration_hours: 2,
      status: 'pending',
      status_label: '待派单',
      amount: 150,
      remark: '4人份家常菜，口味偏清淡',
      created_at: '2024-06-14T21:15:00Z',
    },
    {
      id: 1004,
      user_id: 1,
      worker_id: 103,
      service_type: 'cleaning',
      service_type_label: '深度保洁',
      address: '北京市西城区金融街7号英蓝国际金融中心B座',
      lng: 116.36,
      lat: 39.92,
      start_time: '2024-06-10T08:30:00Z',
      duration_hours: 5,
      status: 'completed',
      status_label: '已完成',
      amount: 380,
      worker_name: '张阿姨',
      worker_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie3',
      worker_phone: '13700137003',
      created_at: '2024-06-09T15:00:00Z',
    },
    {
      id: 1005,
      user_id: 1,
      worker_id: 104,
      service_type: 'cleaning',
      service_type_label: '日常保洁',
      address: '北京市朝阳区建国路88号SOHO现代城A座1201室',
      lng: 116.46,
      lat: 39.91,
      start_time: '2024-06-12T10:00:00Z',
      duration_hours: 3,
      status: 'cancelled',
      status_label: '已取消',
      amount: 198,
      worker_name: '赵阿姨',
      worker_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie4',
      worker_phone: '13700137004',
      created_at: '2024-06-11T09:00:00Z',
    },
  ],
  currentOrder: null,
  serviceNodes: [
    {
      id: 1,
      order_id: 1001,
      node_type: 'order_created',
      node_label: '订单创建',
      node_time: '2024-06-14T18:30:00Z',
    },
    {
      id: 2,
      order_id: 1001,
      node_type: 'assigned',
      node_label: '系统派单',
      node_time: '2024-06-14T18:32:00Z',
      remark: '分配给王阿姨，距离1.2km',
    },
    {
      id: 3,
      order_id: 1001,
      node_type: 'accepted',
      node_label: '阿姨接单',
      node_time: '2024-06-14T18:35:00Z',
    },
    {
      id: 4,
      order_id: 1001,
      node_type: 'departing',
      node_label: '阿姨出发',
      node_time: '2024-06-15T08:40:00Z',
    },
    {
      id: 5,
      order_id: 1001,
      node_type: 'arrived',
      node_label: '到达服务地点',
      node_time: '2024-06-15T08:58:00Z',
    },
    {
      id: 6,
      order_id: 1001,
      node_type: 'servicing',
      node_label: '开始服务',
      node_time: '2024-06-15T09:00:00Z',
    },
  ],
  setOrderList: (orderList) => set({ orderList }),
  setCurrentOrder: (currentOrder) => set({ currentOrder }),
  setServiceNodes: (serviceNodes) => set({ serviceNodes }),
  addOrder: (order) =>
    set((state) => ({ orderList: [order, ...state.orderList] })),
  updateOrderStatus: (orderId, status, statusLabel) =>
    set((state) => ({
      orderList: state.orderList.map((o) =>
        o.id === orderId ? { ...o, status, status_label: statusLabel || STATUS_LABELS[status] } : o
      ),
      currentOrder:
        state.currentOrder?.id === orderId
          ? { ...state.currentOrder, status, status_label: statusLabel || STATUS_LABELS[status] }
          : state.currentOrder,
    })),
  addServiceNode: (node) =>
    set((state) => ({
      serviceNodes: [...state.serviceNodes, { ...node, id: Date.now() }],
    })),
  getOrdersByStatus: (status) => get().orderList.filter((o) => o.status === status),
  clearCurrentOrder: () => set({ currentOrder: null, serviceNodes: [] }),
}));
