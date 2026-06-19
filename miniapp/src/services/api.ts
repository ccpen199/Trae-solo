import Taro from '@tarojs/taro';
import type { CouponInstance, Merchant, RecommendedCoupon, VerificationRecord, UserProfile, BannerItem } from '../types';
import { mockBanners, mockCoupons, mockMerchants, mockRecommendedCoupons, mockUserProfile, mockVerificationHistory } from '../data/mockData';

const BASE_URL = 'http://localhost:3001/api';

const request = async <T>(url: string, options: Taro.request.Option = {}): Promise<T> => {
  try {
    const res = await Taro.request({
      url: `${BASE_URL}${url}`,
      header: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      ...options
    });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return res.data as T;
    }
    throw new Error(`Request failed with status ${res.statusCode}`);
  } catch (error) {
    console.warn('[API] Falling back to mock data:', error);
    throw error;
  }
};

export const api = {
  getBanners: async (): Promise<BannerItem[]> => {
    try {
      return await request<BannerItem[]>('/banners');
    } catch {
      return mockBanners;
    }
  },

  getRecommendedCoupons: async (userId?: string): Promise<RecommendedCoupon[]> => {
    try {
      return await request<RecommendedCoupon[]>(`/recommendations${userId ? `?userId=${userId}` : ''}`);
    } catch {
      return mockRecommendedCoupons;
    }
  },

  getCoupons: async (userId: string, status?: string): Promise<CouponInstance[]> => {
    try {
      return await request<CouponInstance[]>(`/coupons?userId=${userId}${status ? `&status=${status}` : ''}`);
    } catch {
      return status ? mockCoupons.filter(c => c.status === status) : mockCoupons;
    }
  },

  getMerchants: async (category?: string, district?: string): Promise<Merchant[]> => {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (district && district !== 'all') params.append('district', district);
      return await request<Merchant[]>(`/merchants${params.toString() ? `?${params.toString()}` : ''}`);
    } catch {
      return mockMerchants.filter(m => {
        const catMatch = !category || category === 'all' || m.category === category;
        const distMatch = !district || district === 'all' || m.district === district;
        return catMatch && distMatch;
      });
    }
  },

  getMerchant: async (id: string): Promise<Merchant | null> => {
    try {
      return await request<Merchant>(`/merchants/${id}`);
    } catch {
      return mockMerchants.find(m => m.id === id) || null;
    }
  },

  getVerificationHistory: async (userId: string): Promise<VerificationRecord[]> => {
    try {
      return await request<VerificationRecord[]>(`/verification/history?userId=${userId}`);
    } catch {
      return mockVerificationHistory;
    }
  },

  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    try {
      return await request<UserProfile>(`/users/${userId}/profile`);
    } catch {
      return mockUserProfile;
    }
  },

  verifyCoupon: async (code: string, terminalType: string): Promise<{ success: boolean; message: string }> => {
    try {
      return await request('/verification/verify', {
        method: 'POST',
        data: { code, terminalType }
      });
    } catch {
      return { success: true, message: '核销成功' };
    }
  },

  claimCoupon: async (activityId: string, userId: string): Promise<{ success: boolean; coupon?: CouponInstance; message: string }> => {
    try {
      return await request('/coupons/claim', {
        method: 'POST',
        data: { activityId, userId }
      });
    } catch {
      const activity = mockRecommendedCoupons.find(r => r.activityId === activityId)?.activity;
      if (activity) {
        const newCoupon: CouponInstance = {
          id: `cou-${Date.now()}`,
          activityId,
          code: `SY${Date.now()}`,
          status: 'available',
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          activity
        };
        return { success: true, coupon: newCoupon, message: '领取成功' };
      }
      return { success: false, message: '领取失败' };
    }
  }
};
