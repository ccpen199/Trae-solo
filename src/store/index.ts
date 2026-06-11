import { create } from 'zustand'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  type: 'dining' | 'store'
  image?: string
}

interface UserProfile {
  id: string
  name: string
  avatar: string
  studentId: string
  department: string
  grade: string
  phone: string
  balance: number
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  createdAt: string
}

interface AppState {
  activeSection: string
  setActiveSection: (section: string) => void
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateCartItemQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  cartTotal: () => number
  user: UserProfile
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  unreadCount: () => number
}

export const useStore = create<AppState>((set, get) => ({
  activeSection: 'home',
  setActiveSection: (section) => set({ activeSection: section }),

  cart: [],
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find((c) => c.id === item.id)
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.id === item.id ? { ...c, quantity: c.quantity + item.quantity } : c
          ),
        }
      }
      return { cart: [...state.cart, item] }
    }),
  removeFromCart: (id) =>
    set((state) => ({ cart: state.cart.filter((c) => c.id !== id) })),
  updateCartItemQuantity: (id, quantity) =>
    set((state) => ({
      cart:
        quantity <= 0
          ? state.cart.filter((c) => c.id !== id)
          : state.cart.map((c) => (c.id === id ? { ...c, quantity } : c)),
    })),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),

  user: {
    id: '1',
    name: '张三',
    avatar: '',
    studentId: '2024010101',
    department: '计算机科学与技术学院',
    grade: '大三',
    phone: '138****5678',
    balance: 356.8,
  },

  notifications: [
    {
      id: '1',
      title: '订单已接单',
      message: '您的食堂订单已被骑手接单，预计15分钟送达',
      type: 'success',
      read: false,
      createdAt: '2026-06-09T10:30:00Z',
    },
    {
      id: '2',
      title: '优惠提醒',
      message: '超市临期商品专区今日上新，低至3折',
      type: 'info',
      read: false,
      createdAt: '2026-06-09T09:00:00Z',
    },
    {
      id: '3',
      title: '实习推荐',
      message: '字节跳动2026暑期实习正在热招，点击查看详情',
      type: 'info',
      read: true,
      createdAt: '2026-06-08T14:00:00Z',
    },
    {
      id: '4',
      title: '余额不足',
      message: '您的校园卡余额低于50元，请及时充值',
      type: 'warning',
      read: false,
      createdAt: '2026-06-08T08:00:00Z',
    },
  ],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { ...notification, id: Date.now().toString(), createdAt: new Date().toISOString() },
        ...state.notifications,
      ],
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}))
