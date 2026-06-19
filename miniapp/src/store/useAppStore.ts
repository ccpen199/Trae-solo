import { create } from 'zustand';
import type { AppState, CouponInstance, Merchant, RecommendedCoupon, UserProfile, VerificationRecord, BannerItem, TabType, MapViewType, CategoryType } from '../types';
import { mockBanners, mockCoupons, mockMerchants, mockRecommendedCoupons, mockUserProfile, mockVerificationHistory } from '../data/mockData';

interface AppStore extends AppState {
  setUser: (user: UserProfile | null) => void;
  setCoupons: (coupons: CouponInstance[]) => void;
  addCoupon: (coupon: CouponInstance) => void;
  setActiveTab: (tab: TabType) => void;
  setMapViewType: (type: MapViewType) => void;
  setSelectedCategory: (category: CategoryType) => void;
  setSelectedDistrict: (district: string) => void;
  getFilteredCoupons: () => CouponInstance[];
  getFilteredMerchants: () => Merchant[];
  claimCoupon: (activityId: string) => boolean;
  markAsRead: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: mockUserProfile,
  coupons: mockCoupons,
  merchants: mockMerchants,
  banners: mockBanners,
  recommendedCoupons: mockRecommendedCoupons,
  verificationHistory: mockVerificationHistory,
  activeTab: 'available',
  mapViewType: 'list',
  selectedCategory: 'all',
  selectedDistrict: 'all',

  setUser: (user) => set({ user }),
  setCoupons: (coupons) => set({ coupons }),
  addCoupon: (coupon) => set((state) => ({ coupons: [coupon, ...state.coupons] })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setMapViewType: (type) => set({ mapViewType: type }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedDistrict: (district) => set({ selectedDistrict: district }),

  getFilteredCoupons: () => {
    const { coupons, activeTab } = get();
    return coupons.filter(c => c.status === activeTab);
  },

  getFilteredMerchants: () => {
    const { merchants, selectedCategory, selectedDistrict } = get();
    return merchants.filter(m => {
      const categoryMatch = selectedCategory === 'all' || m.category === selectedCategory;
      const districtMatch = selectedDistrict === 'all' || m.district === selectedDistrict;
      return categoryMatch && districtMatch;
    });
  },

  claimCoupon: (activityId) => {
    const { coupons } = get();
    const userCouponCount = coupons.filter(c => c.activityId === activityId).length;
    if (userCouponCount >= 3) return false;
    
    const newCoupon: CouponInstance = {
      id: `cou-${Date.now()}`,
      activityId,
      code: `SY${Date.now()}`,
      status: 'available',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      activity: mockRecommendedCoupons.find(r => r.activityId === activityId)?.activity || mockBanners[0].activityId ? mockCoupons[0].activity : mockCoupons[0].activity
    };
    set((state) => ({ coupons: [newCoupon, ...state.coupons] }));
    return true;
  },

  markAsRead: () => set({})
}));
