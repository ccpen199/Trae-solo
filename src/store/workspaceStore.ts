import { create } from 'zustand';
import { api } from '../utils/api';
import { useAuthStore } from './authStore';
import type { Course, ServiceOrder, Transaction, Wallet, Chapter } from '../../shared/types';

interface DashboardStats {
  totalRevenue: number;
  orderCount: number;
  studentCount: number;
  averageRating: number;
  revenueTrend: { date: string; amount: number }[];
  recentOrders: ServiceOrder[];
  topCourses: Course[];
}

interface WorkspaceState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  activeTab: string;
  
  dashboardStats: DashboardStats | null;
  dashboardLoading: boolean;
  
  courses: Course[];
  coursesLoading: boolean;
  courseTotal: number;
  
  currentCourse: Course | null;
  chapters: Chapter[];
  
  orders: ServiceOrder[];
  ordersLoading: boolean;
  orderTotal: number;
  currentOrder: ServiceOrder | null;
  
  wallet: Wallet | null;
  transactions: Transaction[];
  settlement: {
    monthlyRevenue: number;
    platformFee: number;
    withdrawable: number;
  } | null;
  walletLoading: boolean;
  
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  
  fetchDashboardStats: () => Promise<void>;
  fetchCourses: (params?: { status?: string; page?: number; pageSize?: number }) => Promise<void>;
  fetchCourseDetail: (id: string) => Promise<void>;
  fetchChapters: (courseId: string) => Promise<void>;
  createCourse: (data: Partial<Course>) => Promise<Course>;
  updateCourse: (id: string, data: Partial<Course>) => Promise<void>;
  submitCourseForReview: (id: string) => Promise<void>;
  addChapter: (courseId: string, data: Partial<Chapter>) => Promise<void>;
  updateChapter: (chapterId: string, data: Partial<Chapter>) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  
  fetchOrders: (params?: { status?: string; page?: number; pageSize?: number }) => Promise<void>;
  fetchOrderDetail: (id: string) => Promise<void>;
  acceptOrder: (id: string) => Promise<void>;
  startOrder: (id: string) => Promise<void>;
  completeOrder: (id: string) => Promise<void>;
  
  fetchWallet: () => Promise<void>;
  fetchTransactions: (params?: { page?: number; pageSize?: number }) => Promise<void>;
  fetchSettlement: () => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  
  updateProfile: (data: any) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  activeTab: 'all',
  
  dashboardStats: null,
  dashboardLoading: false,
  
  courses: [],
  coursesLoading: false,
  courseTotal: 0,
  
  currentCourse: null,
  chapters: [],
  
  orders: [],
  ordersLoading: false,
  orderTotal: 0,
  currentOrder: null,
  
  wallet: null,
  transactions: [],
  settlement: null,
  walletLoading: false,
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  fetchDashboardStats: async () => {
    set({ dashboardLoading: true });
    try {
      const [ordersRes, coursesRes, transactionsRes] = await Promise.all([
        api.orders.getMy('creator'),
        api.courses.getMy(),
        api.payment.getSettlement('month'),
      ]);
      
      const orders = (ordersRes as any).data?.items || [];
      const courses = (coursesRes as any).data?.items || [];
      const settlement = (transactionsRes as any).data;
      
      const revenueTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          amount: Math.floor(Math.random() * 5000) + 1000,
        };
      });
      
      const totalRevenue = orders.reduce((sum: number, o: ServiceOrder) => sum + o.price, 0);
      const studentCount = courses.reduce((sum: number, c: Course) => sum + c.studentCount, 0);
      const averageRating = courses.length > 0 
        ? courses.reduce((sum: number, c: Course) => sum + c.rating, 0) / courses.length 
        : 0;
      
      set({
        dashboardStats: {
          totalRevenue,
          orderCount: orders.length,
          studentCount,
          averageRating,
          revenueTrend,
          recentOrders: orders.slice(0, 5),
          topCourses: courses.slice(0, 5).sort((a: Course, b: Course) => b.studentCount - a.studentCount),
        },
        dashboardLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      set({ dashboardLoading: false });
    }
  },
  
  fetchCourses: async (params) => {
    set({ coursesLoading: true });
    try {
      const response: any = await api.courses.getMy(params);
      set({
        courses: response.data?.items || [],
        courseTotal: response.data?.total || 0,
        coursesLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      set({ coursesLoading: false });
    }
  },
  
  fetchCourseDetail: async (id) => {
    try {
      const response: any = await api.courses.getById(id);
      set({ currentCourse: response.data });
    } catch (error) {
      console.error('Failed to fetch course detail:', error);
    }
  },
  
  fetchChapters: async (courseId) => {
    try {
      const response: any = await api.courses.getChapters(courseId);
      set({ chapters: response.data || [] });
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  },
  
  createCourse: async (data) => {
    const response: any = await api.courses.create(data);
    return response.data;
  },
  
  updateCourse: async (id, data) => {
    await api.courses.update(id, data);
    const courses = get().courses;
    set({
      courses: courses.map(c => c.id === id ? { ...c, ...data } : c),
    });
  },
  
  submitCourseForReview: async (id) => {
    await api.courses.submitForReview(id);
    const courses = get().courses;
    set({
      courses: courses.map(c => c.id === id ? { ...c, status: 'reviewing' as const } : c),
    });
  },
  
  addChapter: async (courseId, data) => {
    await api.courses.addChapter(courseId, data);
    await get().fetchChapters(courseId);
  },
  
  updateChapter: async (chapterId, data) => {
    await api.courses.updateChapter(chapterId, data);
    const chapters = get().chapters;
    set({
      chapters: chapters.map(c => c.id === chapterId ? { ...c, ...data } : c),
    });
  },
  
  deleteChapter: async (chapterId) => {
    await api.courses.deleteChapter(chapterId);
    const chapters = get().chapters;
    set({
      chapters: chapters.filter(c => c.id !== chapterId),
    });
  },
  
  fetchOrders: async (params) => {
    set({ ordersLoading: true });
    try {
      const response: any = await api.orders.getMy('creator');
      let orders = response.data?.items || [];
      if (params?.status && params.status !== 'all') {
        orders = orders.filter((o: ServiceOrder) => o.status === params.status);
      }
      set({
        orders,
        orderTotal: orders.length,
        ordersLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      set({ ordersLoading: false });
    }
  },
  
  fetchOrderDetail: async (id) => {
    try {
      const response: any = await api.orders.getById(id);
      set({ currentOrder: response.data });
    } catch (error) {
      console.error('Failed to fetch order detail:', error);
    }
  },
  
  acceptOrder: async (id) => {
    await api.orders.accept(id);
    const orders = get().orders;
    set({
      orders: orders.map(o => o.id === id ? { ...o, status: 'matched' as const } : o),
    });
  },
  
  startOrder: async (id) => {
    await api.orders.start(id);
    const orders = get().orders;
    set({
      orders: orders.map(o => o.id === id ? { ...o, status: 'in_progress' as const } : o),
    });
  },
  
  completeOrder: async (id) => {
    await api.orders.complete(id);
    const orders = get().orders;
    set({
      orders: orders.map(o => o.id === id ? { ...o, status: 'completed' as const } : o),
    });
  },
  
  fetchWallet: async () => {
    set({ walletLoading: true });
    try {
      const response: any = await api.payment.getWallet();
      set({ wallet: response.data, walletLoading: false });
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      set({ walletLoading: false });
    }
  },
  
  fetchTransactions: async (params) => {
    try {
      const response: any = await api.payment.getTransactions(params);
      set({ transactions: response.data?.items || [] });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  },
  
  fetchSettlement: async () => {
    try {
      const response: any = await api.payment.getSettlement('month');
      const data = response.data;
      set({
        settlement: {
          monthlyRevenue: data?.totalAmount || 0,
          platformFee: data?.platformFee || 0,
          withdrawable: data?.netAmount || 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch settlement:', error);
    }
  },
  
  withdraw: async (amount) => {
    await api.payment.withdraw(amount);
    await get().fetchWallet();
  },
  
  updateProfile: async (data) => {
    await api.users.updateProfile(data);
    const { fetchProfile } = useAuthStore.getState();
    await fetchProfile();
  },
}));
