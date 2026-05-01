import { create } from 'zustand';
import { CouponTemplate, CouponInstance, Order, Budget, UserRole, CouponStatus } from '@/types';

interface CouponState {
  templates: CouponTemplate[];
  myCoupons: CouponInstance[];
  selectedTemplate: CouponTemplate | null;
  selectedCoupon: CouponInstance | null;
  isLoading: boolean;
  
  setTemplates: (templates: CouponTemplate[]) => void;
  setMyCoupons: (coupons: CouponInstance[]) => void;
  setSelectedTemplate: (template: CouponTemplate | null) => void;
  setSelectedCoupon: (coupon: CouponInstance | null) => void;
  setLoading: (loading: boolean) => void;
  addTemplate: (template: CouponTemplate) => void;
  updateTemplate: (template: CouponTemplate) => void;
}

export const useCouponStore = create<CouponState>((set) => ({
  templates: [],
  myCoupons: [],
  selectedTemplate: null,
  selectedCoupon: null,
  isLoading: false,
  
  setTemplates: (templates) => set({ templates }),
  setMyCoupons: (coupons) => set({ myCoupons: coupons }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setSelectedCoupon: (coupon) => set({ selectedCoupon: coupon }),
  setLoading: (loading) => set({ isLoading: loading }),
  addTemplate: (template) => set((state) => ({ templates: [template, ...state.templates] })),
  updateTemplate: (template) => set((state) => ({
    templates: state.templates.map(t => t.id === template.id ? template : t)
  }))
}));

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
  
  setOrders: (orders: Order[]) => void;
  setSelectedOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  selectedOrder: null,
  isLoading: false,
  
  setOrders: (orders) => set({ orders }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  setLoading: (loading) => set({ isLoading: loading })
}));

interface FinanceState {
  budgets: Budget[];
  selectedBudget: Budget | null;
  subsidySummary: {
    totalSubsidy: number;
    couponCount: number;
    orderCount: number;
    breakdown: any;
  } | null;
  isLoading: boolean;
  
  setBudgets: (budgets: Budget[]) => void;
  setSelectedBudget: (budget: Budget | null) => void;
  setSubsidySummary: (summary: any) => void;
  setLoading: (loading: boolean) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  budgets: [],
  selectedBudget: null,
  subsidySummary: null,
  isLoading: false,
  
  setBudgets: (budgets) => set({ budgets }),
  setSelectedBudget: (budget) => set({ selectedBudget: budget }),
  setSubsidySummary: (summary) => set({ subsidySummary: summary }),
  setLoading: (loading) => set({ isLoading: loading })
}));

export const getStatusBadgeProps = (status: string) => {
  const statusMap: Record<string, { color: string; text: string }> = {
    [CouponStatus.CREATED]: { color: 'default', text: '已创建' },
    [CouponStatus.PENDING_DISTRIBUTION]: { color: 'processing', text: '待发放' },
    [CouponStatus.DISTRIBUTING]: { color: 'processing', text: '发放中' },
    [CouponStatus.PENDING_USE]: { color: 'success', text: '待使用' },
    [CouponStatus.USED]: { color: 'blue', text: '已使用' },
    [CouponStatus.EXPIRED]: { color: 'default', text: '已过期' },
    [CouponStatus.REFUNDED]: { color: 'orange', text: '已退回' },
    [CouponStatus.CANCELLED]: { color: 'default', text: '已取消' },
    [CouponStatus.FROZEN]: { color: 'warning', text: '已冻结' },
    [CouponStatus.INVALID]: { color: 'error', text: '已作废' }
  };
  
  return statusMap[status] || { color: 'default', text: status };
};

export const getOrderStatusBadgeProps = (status: string) => {
  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'processing', text: '待支付' },
    paid: { color: 'success', text: '已支付' },
    shipped: { color: 'processing', text: '已发货' },
    delivered: { color: 'success', text: '已完成' },
    refunded: { color: 'orange', text: '已退款' },
    cancelled: { color: 'default', text: '已取消' }
  };
  
  return statusMap[status] || { color: 'default', text: status };
};

export const getCouponTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    fixed_discount: '满减券',
    percentage_discount: '折扣券',
    free_shipping: '免邮券',
    buy_one_get_one: '买一赠一'
  };
  
  return typeMap[type] || type;
};

export const getRoleText = (role: UserRole) => {
  const roleMap: Record<UserRole, string> = {
    [UserRole.ADMIN]: '系统管理员',
    [UserRole.OPERATOR]: '运营负责人',
    [UserRole.MERCHANT]: '门店商家',
    [UserRole.FINANCE]: '财务会计',
    [UserRole.CUSTOMER]: '普通用户'
  };
  
  return roleMap[role] || role;
};
