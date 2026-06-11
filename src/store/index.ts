import { create } from 'zustand';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  read: boolean;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  role: 'admin' | 'hr' | 'mentor' | 'student';
  avatar: string;
  department: string;
}

interface AppState {
  currentUser: User;
  notifications: Notification[];
  sidebarCollapsed: boolean;
  activeMenu: string;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveMenu: (menu: string) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: '1',
    name: '张明远',
    role: 'admin',
    avatar: '',
    department: '人力资源部',
  },
  notifications: [
    { id: '1', title: '新简历待审核', message: '有3份新简历需要您审核', type: 'info', read: false, createdAt: '2026-06-09 10:30' },
    { id: '2', title: '面试提醒', message: '下午2点有一场群面待开始', type: 'warning', read: false, createdAt: '2026-06-09 09:15' },
    { id: '3', title: '结算完成', message: '5月份工资结算已完成', type: 'success', read: true, createdAt: '2026-06-08 16:00' },
    { id: '4', title: '风险预警', message: '检测到异常考勤记录', type: 'danger', read: false, createdAt: '2026-06-08 14:20' },
  ],
  sidebarCollapsed: false,
  activeMenu: 'dashboard',
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActiveMenu: (menu) => set({ activeMenu: menu }),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: Date.now().toString(),
          createdAt: new Date().toLocaleString('zh-CN'),
          read: false,
        },
        ...state.notifications,
      ],
    })),
}));
