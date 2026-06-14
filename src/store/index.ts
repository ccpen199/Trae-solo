import { create } from 'zustand';
import type { User, Order, Address, PageRole, ServiceType } from '@/types';

interface AppState {
  currentRole: PageRole;
  user: User | null;
  orders: Order[];
  addresses: Address[];
  selectedAddress: Address | null;
  setCurrentRole: (role: PageRole) => void;
  setUser: (user: User | null) => void;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  setAddresses: (addresses: Address[]) => void;
  setSelectedAddress: (address: Address | null) => void;
}

const mockUser: User = {
  id: 1,
  phone: '138****8888',
  nickname: '张先生',
  avatar: '',
  created_at: '2024-01-01',
};

const mockAddresses: Address[] = [
  {
    id: 1,
    user_id: 1,
    name: '家',
    detail: '北京市朝阳区建国路88号SOHO现代城A座1201室',
    lng: 116.45,
    lat: 39.9042,
    is_default: true,
  },
  {
    id: 2,
    user_id: 1,
    name: '公司',
    detail: '北京市海淀区中关村大街1号科技大厦B座808室',
    lng: 116.3105,
    lat: 39.9847,
    is_default: false,
  },
];

const mockOrders: Order[] = [
  {
    id: 1001,
    user_id: 1,
    worker_id: 101,
    service_type: 'cleaning',
    service_type_label: '日常保洁',
    address: '北京市朝阳区建国路88号SOHO现代城A座1201室',
    lng: 116.45,
    lat: 39.9042,
    start_time: '2025-06-15 09:00',
    duration_hours: 3,
    status: 'arrived',
    status_label: '服务中',
    amount: 180,
    remark: '重点清洁厨房和卫生间',
    worker_name: '李阿姨',
    worker_avatar: '',
    worker_phone: '139****6666',
    created_at: '2025-06-14 14:30',
  },
  {
    id: 1002,
    user_id: 1,
    worker_id: 102,
    service_type: 'cooking',
    service_type_label: '上门做饭',
    address: '北京市朝阳区建国路88号SOHO现代城A座1201室',
    lng: 116.45,
    lat: 39.9042,
    start_time: '2025-06-16 17:00',
    duration_hours: 2,
    status: 'assigned',
    status_label: '待接单',
    amount: 120,
    worker_name: '王阿姨',
    worker_avatar: '',
    worker_phone: '137****5555',
    created_at: '2025-06-14 10:00',
  },
  {
    id: 1003,
    user_id: 1,
    worker_id: 103,
    service_type: 'babysitting',
    service_type_label: '育婴师',
    address: '北京市海淀区中关村大街1号科技大厦B座808室',
    lng: 116.3105,
    lat: 39.9847,
    start_time: '2025-06-10 08:00',
    duration_hours: 8,
    status: 'completed',
    status_label: '已完成',
    amount: 480,
    worker_name: '张阿姨',
    worker_avatar: '',
    worker_phone: '136****4444',
    created_at: '2025-06-09 20:00',
  },
];

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'user',
  user: mockUser,
  orders: mockOrders,
  addresses: mockAddresses,
  selectedAddress: mockAddresses[0],
  setCurrentRole: (role) => set({ currentRole: role }),
  setUser: (user) => set({ user }),
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (order) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === order.id ? order : o)),
    })),
  setAddresses: (addresses) => set({ addresses }),
  setSelectedAddress: (address) => set({ selectedAddress: address }),
}));

export const serviceTypeList: { type: ServiceType; label: string; icon: string; description: string; price: number }[] = [
  {
    type: 'cleaning',
    label: '日常保洁',
    icon: 'Sparkles',
    description: '专业保洁阿姨上门，全屋深度清洁',
    price: 60,
  },
  {
    type: 'babysitting',
    label: '育婴师',
    icon: 'Baby',
    description: '持证育婴师，科学照料宝宝',
    price: 80,
  },
  {
    type: 'cooking',
    label: '上门做饭',
    icon: 'ChefHat',
    description: '私厨上门，定制家常菜',
    price: 50,
  },
];
