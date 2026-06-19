import { create } from 'zustand';
import type { CouponActivity, CouponInstance, PaginationRequest, PaginationResponse } from '@shared/types';
import { mockCouponService } from '../services/mockService';

interface CouponState {
  coupons: CouponActivity[];
  couponInstances: CouponInstance[];
  selectedCoupon: CouponActivity | null;
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  fetchCoupons: (params?: PaginationRequest & { status?: string; type?: string }) => Promise<void>;
  fetchCouponById: (id: string) => Promise<CouponActivity | null>;
  createCoupon: (data: Partial<CouponActivity>) => Promise<CouponActivity>;
  updateCoupon: (id: string, data: Partial<CouponActivity>) => Promise<CouponActivity>;
  deleteCoupon: (id: string) => Promise<void>;
  setSelectedCoupon: (coupon: CouponActivity | null) => void;
}

export const useCouponStore = create<CouponState>((set) => ({
  coupons: [],
  couponInstances: [],
  selectedCoupon: null,
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 10, total: 0 },
  fetchCoupons: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockCouponService.getCoupons(params);
      set({ coupons: response.items, pagination: { page: response.page, pageSize: response.pageSize, total: response.total }, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取优惠券列表失败', isLoading: false });
    }
  },
  fetchCouponById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const coupon = await mockCouponService.getCouponById(id);
      set({ selectedCoupon: coupon, isLoading: false });
      return coupon;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取优惠券详情失败', isLoading: false });
      return null;
    }
  },
  createCoupon: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const coupon = await mockCouponService.createCoupon(data);
      set({ isLoading: false });
      return coupon;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建优惠券失败', isLoading: false });
      throw err;
    }
  },
  updateCoupon: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const coupon = await mockCouponService.updateCoupon(id, data);
      set({ isLoading: false });
      return coupon;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新优惠券失败', isLoading: false });
      throw err;
    }
  },
  deleteCoupon: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await mockCouponService.deleteCoupon(id);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除优惠券失败', isLoading: false });
      throw err;
    }
  },
  setSelectedCoupon: (coupon) => {
    set({ selectedCoupon: coupon });
  },
}));
