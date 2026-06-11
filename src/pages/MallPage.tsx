import React, { useState, useEffect } from 'react';
import { ShoppingCart, Tag, Receipt, Store, Star, Clock, X, Plus, Minus, CheckCircle, ShoppingBag, Gift, Crown, Coins, Award, AlertTriangle, QrCode, TrendingUp, Users, Zap, ShieldCheck, ChevronRight } from 'lucide-react';
import { mallApi, analyticsApi } from '@/api';
import { useAuthStore } from '@/store';
import StatusBadge from '@/components/common/StatusBadge';
import type { Merchant, Product, Coupon, Order, MemberProfile } from '@shared/types';

interface ProductWithMerchant extends Product {
  merchant_name?: string;
  merchant_logo?: string;
}

interface CouponWithMerchant extends Coupon {
  merchant_name?: string;
  merchant_logo?: string;
  user_status?: 'available' | 'redeemed' | 'used' | 'expired';
}

interface OrderWithExtra extends Order {
  merchant_name?: string;
  merchant_logo?: string;
  user_name?: string;
  product_name?: string;
  points_earned?: number;
}

interface CartItem {
  product: ProductWithMerchant;
  quantity: number;
}

const orderStatusMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'pending'; label: string }> = {
  pending: { variant: 'pending', label: '待支付' },
  paid: { variant: 'info', label: '已支付' },
  completed: { variant: 'success', label: '已完成' },
  cancelled: { variant: 'danger', label: '已取消' },
};

const merchantCategoryMap: Record<string, string> = {
  restaurant: '餐饮',
  supermarket: '超市',
  pharmacy: '药店',
  cleaning: '保洁',
  repair: '维修',
  other: '其他',
};

const merchantStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700', icon: ShieldCheck },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700', icon: X },
};

const membershipLevelMap: Record<number, { name: string; color: string; bgColor: string; icon: any; minPoints: number }> = {
  1: { name: '普通会员', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Users, minPoints: 0 },
  2: { name: '银卡会员', color: 'text-gray-500', bgColor: 'bg-gray-200', icon: Award, minPoints: 1000 },
  3: { name: '金卡会员', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Crown, minPoints: 5000 },
  4: { name: '钻石会员', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Zap, minPoints: 20000 },
};

const getMerchantRatingInfo = (rating: number) => {
  if (rating >= 4.5) return { grade: 'A', label: '优质商户', color: 'bg-green-500' };
  if (rating >= 4.0) return { grade: 'B', label: '良好商户', color: 'bg-blue-500' };
  if (rating >= 3.5) return { grade: 'C', label: '合格商户', color: 'bg-yellow-500' };
  return { grade: 'D', label: '待提升', color: 'bg-gray-500' };
};

const getCouponStatusInfo = (coupon: CouponWithMerchant) => {
  const now = new Date();
  const validTo = new Date(coupon.valid_to);
  const validFrom = new Date(coupon.valid_from);
  
  if (coupon.user_status === 'used') {
    return { label: '已使用', color: 'bg-gray-100 text-gray-500', icon: CheckCircle, disabled: true };
  }
  if (coupon.user_status === 'redeemed') {
    if (now > validTo) return { label: '已过期', color: 'bg-red-100 text-red-600', icon: X, disabled: true };
    return { label: '待使用', color: 'bg-blue-100 text-blue-600', icon: Gift, disabled: false };
  }
  if (now < validFrom || now > validTo) {
    return { label: '已过期', color: 'bg-gray-100 text-gray-400', icon: X, disabled: true };
  }
  if (coupon.used_quantity >= coupon.total_quantity) {
    return { label: '已领完', color: 'bg-gray-100 text-gray-400', icon: X, disabled: true };
  }
  const diffHours = (validTo.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) {
    return { label: `即将过期(${Math.ceil(diffHours)}小时)`, color: 'bg-orange-100 text-orange-600', icon: AlertTriangle, disabled: false };
  }
  return { label: '可领取', color: 'bg-green-100 text-green-600', icon: Gift, disabled: false };
};

export default function MallPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>('merchants');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [products, setProducts] = useState<ProductWithMerchant[]>([]);
  const [coupons, setCoupons] = useState<CouponWithMerchant[]>([]);
  const [orders, setOrders] = useState<OrderWithExtra[]>([]);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);

  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showMerchantDetail, setShowMerchantDetail] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponWithMerchant | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [merchantProducts, setMerchantProducts] = useState<Product[]>([]);
  const [merchantCoupons, setMerchantCoupons] = useState<Coupon[]>([]);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithExtra | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewMerchant, setReviewMerchant] = useState<Merchant | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showRedeemFlowModal, setShowRedeemFlowModal] = useState(false);
  const [operationLoading, setOperationLoading] = useState<number | null>(null);
  const [couponFilter, setCouponFilter] = useState<'all' | 'available' | 'used' | 'expired'>('all');

  interface RedemptionLog {
    id: number;
    couponName: string;
    merchantName: string;
    user: string;
    code: string;
    amount: number;
    time: string;
    status: 'success' | 'failed' | 'pending';
  }

  const redemptionLogs: RedemptionLog[] = [
    { id: 1, couponName: '满100减20优惠券', merchantName: '永辉超市', user: '张先生', code: 'CP20240608001', amount: 20, time: '2024-06-08 10:30', status: 'success' },
    { id: 2, couponName: '8折优惠券', merchantName: '钱大妈生鲜', user: '李女士', code: 'CP20240608002', amount: 15, time: '2024-06-08 09:15', status: 'success' },
    { id: 3, couponName: '满50减10优惠券', merchantName: '益丰药房', user: '王大爷', code: 'CP20240607015', amount: 10, time: '2024-06-07 16:45', status: 'success' },
    { id: 4, couponName: '新用户立减30', merchantName: '家常菜馆', user: '刘女士', code: 'CP20240607008', amount: 30, time: '2024-06-07 12:20', status: 'success' },
    { id: 5, couponName: '满200减50优惠券', merchantName: '永辉超市', user: '赵先生', code: 'CP20240606023', amount: 50, time: '2024-06-06 19:30', status: 'success' },
  ];

  interface RankingMerchant {
    id: number;
    name: string;
    category: string;
    orderCount: number;
    revenue: number;
    rating: number;
    trend: 'up' | 'down' | 'stable';
  }

  const merchantRankings: RankingMerchant[] = [
    { id: 1, name: '钱大妈生鲜', category: '超市', orderCount: 156, revenue: 12580, rating: 4.8, trend: 'up' },
    { id: 2, name: '家常菜馆', category: '餐饮', orderCount: 128, revenue: 18960, rating: 4.6, trend: 'up' },
    { id: 3, name: '永辉超市', category: '超市', orderCount: 98, revenue: 25680, rating: 4.7, trend: 'stable' },
    { id: 4, name: '益丰药房', category: '药店', orderCount: 76, revenue: 8560, rating: 4.5, trend: 'down' },
    { id: 5, name: '靓丽美发', category: '生活服务', orderCount: 54, revenue: 6480, rating: 4.3, trend: 'up' },
  ];

  const handleMerchantReview = async (merchantId: number, action: 'approve' | 'reject') => {
    setOperationLoading(merchantId);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setMerchants(prev => prev.map(m => 
        m.id === merchantId ? { ...m, status: action === 'approve' ? 'approved' : 'rejected' } : m
      ));
      setShowReviewModal(false);
      setReviewMerchant(null);
      setReviewNote('');
      alert(`商户${action === 'approve' ? '审核通过' : '审核拒绝'}成功`);
    } catch (err) {
      alert('操作失败，请稍后重试');
    } finally {
      setOperationLoading(null);
    }
  };

  const tabs = [
    { value: 'merchants', label: '商户列表', icon: Store },
    { value: 'products', label: '商品购买', icon: ShoppingCart },
    { value: 'coupons', label: '优惠券', icon: Tag },
    { value: 'orders', label: '我的订单', icon: Receipt },
  ];

  const visibleTabs = (() => {
    if (user?.role === 'merchant') {
      return ['orders'] as string[];
    }
    return tabs.map(t => t.value);
  })();

  useEffect(() => {
    fetchMemberProfile();
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'merchants':
        fetchMerchants();
        break;
      case 'products':
        fetchProducts();
        break;
      case 'coupons':
        fetchCoupons();
        break;
      case 'orders':
        fetchOrders();
        break;
    }
  }, [activeTab]);

  const fetchMemberProfile = async () => {
    try {
      const response = await analyticsApi.getMemberProfile();
      if (response.success && response.data) {
        setMemberProfile(response.data);
      }
    } catch (err) {
      console.error('获取会员信息失败');
    }
  };

  const fetchMerchants = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mallApi.getMerchants();
      if (response.success) {
        setMerchants(response.data || []);
      } else {
        setError(response.error || '获取商户列表失败');
      }
    } catch (err) {
      setError('获取商户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchantDetail = async (id: number) => {
    setLoading(true);
    try {
      const response = await mallApi.getMerchantDetail(id);
      if (response.success) {
        setSelectedMerchant(response.data.merchant);
        setMerchantProducts(response.data.products || []);
        setMerchantCoupons(response.data.coupons || []);
        setShowMerchantDetail(true);
      }
    } catch (err) {
      console.error('获取商户详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mallApi.getProducts();
      if (response.success) {
        setProducts(response.data || []);
      } else {
        setError(response.error || '获取商品列表失败');
      }
    } catch (err) {
      setError('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mallApi.getCoupons();
      if (response.success) {
        setCoupons(response.data || []);
      } else {
        setError(response.error || '获取优惠券失败');
      }
    } catch (err) {
      setError('获取优惠券失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mallApi.getOrders();
      if (response.success) {
        setOrders(response.data || []);
      } else {
        setError(response.error || '获取订单列表失败');
      }
    } catch (err) {
      setError('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: ProductWithMerchant) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            return { ...item, quantity: Math.min(newQuantity, item.product.stock) };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getPointsDeduction = () => {
    if (!memberProfile) return 0;
    const maxDeduction = Math.floor(memberProfile.points / 100);
    return Math.min(maxDeduction, getCartTotal() * 0.2);
  };

  const handleCreateOrder = async (product?: ProductWithMerchant, couponId?: number) => {
    setActionLoading(true);
    try {
      if (product) {
        const response = await mallApi.createOrder({
          merchantId: product.merchant_id,
          productId: product.id,
          quantity: 1,
          couponId,
        });
        if (response.success) {
          setCart([]);
          setShowCartModal(false);
          setSelectedCoupon(null);
          fetchOrders();
          fetchMemberProfile();
          alert('订单创建成功！');
        }
      } else if (cart.length > 0) {
        for (const item of cart) {
          await mallApi.createOrder({
            merchantId: item.product.merchant_id,
            productId: item.product.id,
            quantity: item.quantity,
            couponId: item.product.merchant_id === selectedCoupon?.merchant_id ? selectedCoupon.id : undefined,
          });
        }
        setCart([]);
        setShowCartModal(false);
        setSelectedCoupon(null);
        fetchOrders();
        fetchMemberProfile();
        alert('订单创建成功！');
      }
    } catch (err) {
      console.error('创建订单失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRedeemCoupon = async (couponId: number) => {
    setActionLoading(true);
    try {
      const response = await mallApi.redeemCoupon(couponId);
      if (response.success) {
        alert('领取成功！');
        fetchCoupons();
      }
    } catch (err) {
      console.error('领取优惠券失败');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };

  const renderMemberCard = () => {
    if (!memberProfile) return null;
    const levelInfo = membershipLevelMap[memberProfile.level] || membershipLevelMap[1];
    const nextLevel = membershipLevelMap[memberProfile.level + 1];
    const progressToNext = nextLevel 
      ? Math.min(100, ((memberProfile.points - levelInfo.minPoints) / (nextLevel.minPoints - levelInfo.minPoints)) * 100)
      : 100;

    return (
      <div className={`${levelInfo.bgColor} rounded-xl p-6 mb-6 border border-gray-100`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm`}>
              <levelInfo.icon className={`w-8 h-8 ${levelInfo.color}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className={`text-xl font-bold ${levelInfo.color}`}>{levelInfo.name}</h3>
                <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-500">
                  Lv.{memberProfile.level}
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Coins className="w-4 h-4 mr-1 text-yellow-500" />
                  <span>{memberProfile.points.toLocaleString()} 积分</span>
                </div>
                <div>
                  可抵扣: <span className="font-semibold text-green-600">{formatPrice(Math.floor(memberProfile.points / 100))}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-2">累计消费</div>
            <div className="text-2xl font-bold text-gray-800">{formatPrice(memberProfile.totalSpent)}</div>
            <div className="text-xs text-gray-500 mt-1">{memberProfile.orderCount} 笔订单</div>
          </div>
        </div>
        {nextLevel && (
          <div className="mt-4 pt-4 border-t border-white/50">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">升级到 {nextLevel.name}</span>
              <span className="text-gray-500">{(nextLevel.minPoints - memberProfile.points).toLocaleString()} 积分</span>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <div 
                className={`h-full ${levelInfo.bgColor.replace('100', '400')} transition-all`}
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        )}
        {memberProfile.benefits && memberProfile.benefits.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {memberProfile.benefits.map((benefit, idx) => (
              <span key={idx} className="text-xs bg-white px-3 py-1 rounded-full text-gray-600">
                {benefit}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMerchantStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Store className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{merchants.filter(m => m.status === 'approved').length}</div>
            <div className="text-xs text-gray-500">已入驻商户</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{merchants.filter(m => m.status === 'pending').length}</div>
            <div className="text-xs text-gray-500">待审核</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Gift className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{coupons.filter(c => getCouponStatusInfo(c).label === '可领取').length}</div>
            <div className="text-xs text-gray-500">可领优惠券</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{orders.length}</div>
            <div className="text-xs text-gray-500">我的订单</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMerchantList = () => (
    <div className="space-y-4">
      {renderMerchantStats()}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {merchants.map((merchant) => {
          const statusInfo = merchantStatusMap[merchant.status];
          const ratingInfo = getMerchantRatingInfo(merchant.rating);
          return (
            <div
              key={merchant.id}
              onClick={() => fetchMerchantDetail(merchant.id)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start space-x-4">
                <div className="relative w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {merchant.logo_url ? (
                    <img src={merchant.logo_url} alt={merchant.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-gray-400" />
                  )}
                  <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${ratingInfo.color} text-white text-xs font-bold flex items-center justify-center shadow-sm`}>
                    {ratingInfo.grade}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">{merchant.name}</h3>
                    <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <statusInfo.icon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center mt-2 space-x-3">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="ml-1 text-sm font-medium text-gray-700">{merchant.rating}</span>
                    </div>
                    <span className="text-xs text-gray-400">{ratingInfo.label}</span>
                  </div>
                  {merchant.license_no && (
                    <div className="mt-2 text-xs text-gray-400 flex items-center">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      营业执照: {merchant.license_no}
                    </div>
                  )}
                  {merchant.description && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{merchant.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-400">入驻于 {new Date(merchant.created_at).toLocaleDateString('zh-CN')}</span>
                <span className="text-xs text-blue-600 flex items-center">
                  查看详情 <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
              {user?.role === 'property' && merchant.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-gray-50 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReviewMerchant(merchant);
                      setShowReviewModal(true);
                    }}
                    disabled={operationLoading === merchant.id}
                    className="flex-1 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {operationLoading === merchant.id ? '处理中...' : '审核'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {user?.role === 'property' && (
        <>
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-500" />
                券核销流水
              </h3>
              <button
                onClick={() => setShowRedeemFlowModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                查看全部 →
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">优惠券</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">核销商户</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">用户</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">优惠金额</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">核销时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {redemptionLogs.slice(0, 3).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{log.couponName}</p>
                        <p className="text-xs text-gray-400">核销码: {log.code}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.merchantName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.user}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">¥{log.amount}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{log.time}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
                          核销成功
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              商户经营排行
            </h3>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="space-y-4">
                {merchantRankings.map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                      idx === 1 ? 'bg-gray-100 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{m.name}</span>
                        <span className="text-xs text-gray-400">{m.category}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>订单 {m.orderCount} 单</span>
                        <span>营收 ¥{m.revenue.toLocaleString()}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {m.rating}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {m.trend === 'up' && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          上升
                        </span>
                      )}
                      {m.trend === 'down' && (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 rotate-180" />
                          下降
                        </span>
                      )}
                      {m.trend === 'stable' && (
                        <span className="text-xs text-gray-500">稳定</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-500" />
          积分通兑规则
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-medium text-gray-800 mb-1">获取积分</p>
            <p className="text-2xl font-bold text-green-600">1元 = 10积分</p>
            <p className="text-xs text-gray-500 mt-1">消费即返积分，次日到账</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-medium text-gray-800 mb-1">积分抵现</p>
            <p className="text-2xl font-bold text-blue-600">100积分 = 1元</p>
            <p className="text-xs text-gray-500 mt-1">订单最高可抵扣20%</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-medium text-gray-800 mb-1">会员互通</p>
            <p className="text-2xl font-bold text-purple-600">4级会员体系</p>
            <p className="text-xs text-gray-500 mt-1">等级越高，权益越多</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductList = () => (
    <div>
      {cart.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowCartModal(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>购物车 ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
            <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <ShoppingBag className="w-12 h-12 text-gray-300" />
              )}
              {product.status === 'inactive' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-medium">已下架</span>
                </div>
              )}
              {product.stock < 10 && product.stock > 0 && (
                <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  仅剩{product.stock}件
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{product.merchant_name}</p>
              {product.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <div>
                  <span className="text-xl font-bold text-red-500">{formatPrice(product.price)}</span>
                  {memberProfile && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      预计返 {Math.floor(product.price * 10)} 积分
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-400">库存: {product.stock}</span>
              </div>
              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0 || product.status === 'inactive'}
                className="w-full mt-3 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium"
              >
                {product.stock === 0 ? '已售罄' : '加入购物车'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCouponList = () => {
    const availableCoupons = coupons.filter(c => !c.user_status || c.user_status === 'available');
    const myCoupons = coupons.filter(c => c.user_status === 'redeemed' || c.user_status === 'used');
    
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Gift className="w-5 h-5 mr-2 text-red-500" />
            可领取优惠券
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCoupons.map((coupon) => {
              const statusInfo = getCouponStatusInfo(coupon);
              const remaining = coupon.total_quantity - coupon.used_quantity;
              const progress = (coupon.used_quantity / coupon.total_quantity) * 100;
              
              return (
                <div
                  key={coupon.id}
                  className={`relative bg-white rounded-xl overflow-hidden border-2 transition-all ${
                    statusInfo.disabled ? 'border-gray-200 opacity-70' : 'border-red-100 hover:border-red-200 hover:shadow-md'
                  }`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-br from-red-500 to-red-600 flex flex-col items-center justify-center text-white">
                    <div className="text-3xl font-bold">
                      {coupon.discount_type === 'fixed'
                        ? `¥${coupon.discount_value}`
                        : `${coupon.discount_value}%`}
                    </div>
                    <div className="text-xs opacity-90 mt-1">
                      满{formatPrice(coupon.min_amount)}
                    </div>
                  </div>
                  <div className="ml-28 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{coupon.name}</h4>
                        <p className="text-sm text-gray-500 mt-0.5">{coupon.merchant_name}</p>
                      </div>
                      <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <statusInfo.icon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>
                        {new Date(coupon.valid_from).toLocaleDateString('zh-CN')} - {new Date(coupon.valid_to).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>已领 {coupon.used_quantity} / {coupon.total_quantity}</span>
                        <span>剩余 {remaining} 张</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-400 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRedeemCoupon(coupon.id)}
                      disabled={statusInfo.disabled || actionLoading}
                      className="w-full py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    >
                      {statusInfo.disabled ? statusInfo.label : '立即领取'}
                    </button>
                  </div>
                </div>
              );
            })}
            {availableCoupons.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无可领取的优惠券</p>
              </div>
            )}
          </div>
        </div>

        {myCoupons.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-blue-500" />
              我的优惠券
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCoupons.map((coupon) => {
                const statusInfo = getCouponStatusInfo(coupon);
                
                return (
                  <div
                    key={coupon.id}
                    className={`relative bg-white rounded-xl overflow-hidden border-2 ${
                      statusInfo.disabled ? 'border-gray-200 opacity-70' : 'border-blue-100'
                    }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-24 ${
                      coupon.user_status === 'used' ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    } flex flex-col items-center justify-center text-white`}>
                      <div className="text-3xl font-bold">
                        {coupon.discount_type === 'fixed'
                          ? `¥${coupon.discount_value}`
                          : `${coupon.discount_value}%`}
                      </div>
                      <div className="text-xs opacity-90 mt-1">
                        满{formatPrice(coupon.min_amount)}
                      </div>
                    </div>
                    <div className="ml-28 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{coupon.name}</h4>
                          <p className="text-sm text-gray-500 mt-0.5">{coupon.merchant_name}</p>
                        </div>
                        <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <statusInfo.icon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>
                          {new Date(coupon.valid_from).toLocaleDateString('zh-CN')} - {new Date(coupon.valid_to).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      {!statusInfo.disabled && (
                        <button
                          className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-medium flex items-center justify-center"
                        >
                          <QrCode className="w-4 h-4 mr-1.5" />
                          出示核销码
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOrderList = () => (
    <div className="space-y-4">
      {orders.map((order) => {
        const statusInfo = orderStatusMap[order.status];
        return (
          <div 
            key={order.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
            onClick={() => { setSelectedOrder(order); setShowOrderDetail(true); }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                  {order.merchant_logo ? (
                    <img src={order.merchant_logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{order.merchant_name}</h4>
                  <p className="text-xs text-gray-500">订单号: {order.id} · {formatDate(order.created_at)}</p>
                </div>
              </div>
              <StatusBadge
                status={order.status}
                variant={statusInfo?.variant}
              />
            </div>
            <div className="p-4">
              {order.product_name && (
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-50">
                  <span className="text-gray-700">{order.product_name}</span>
                  <span className="text-gray-600">×1</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 space-y-1">
                  <div>商品金额: {formatPrice(order.total_amount)}</div>
                  {order.discount_amount > 0 && (
                    <div className="text-green-600">优惠券抵扣: -{formatPrice(order.discount_amount)}</div>
                  )}
                  {order.points_earned && (
                    <div className="text-yellow-600 flex items-center">
                      <Coins className="w-3 h-3 mr-1" />
                      获得积分: +{order.points_earned}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-1">实付金额</div>
                  <div className="text-xl font-bold text-gray-900">{formatPrice(order.pay_amount)}</div>
                </div>
              </div>
            </div>
            <div className="px-4 pb-4 flex items-center justify-end space-x-3">
              {order.status === 'paid' && (
                <button 
                  className="px-4 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  确认收货
                </button>
              )}
              {order.status === 'completed' && (
                <button 
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  去评价
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderEmpty = (message: string) => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <ShoppingCart className="w-12 h-12 mb-4 text-gray-300" />
      <p>{message}</p>
    </div>
  );

  const renderLoading = () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">社区商圈</h1>
        <p className="text-gray-600">享受社区周边便捷服务，消费累计积分享更多权益</p>
      </div>

      {user?.role !== 'merchant' && renderMemberCard()}

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.filter(t => visibleTabs.includes(t.value)).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        renderLoading()
      ) : (
        <>
          {activeTab === 'merchants' && (merchants.length === 0 ? renderEmpty('暂无商户') : renderMerchantList())}
          {activeTab === 'products' && (products.length === 0 ? renderEmpty('暂无商品') : renderProductList())}
          {activeTab === 'coupons' && renderCouponList()}
          {activeTab === 'orders' && (orders.length === 0 ? renderEmpty('暂无订单') : renderOrderList())}
        </>
      )}

      {showMerchantDetail && selectedMerchant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold">商户详情</h2>
              <button
                onClick={() => setShowMerchantDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start space-x-6">
                <div className="relative w-28 h-28 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedMerchant.logo_url ? (
                    <img src={selectedMerchant.logo_url} alt={selectedMerchant.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-14 h-14 text-gray-400" />
                  )}
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${getMerchantRatingInfo(selectedMerchant.rating).color} text-white text-sm font-bold flex items-center justify-center shadow-lg`}>
                    {getMerchantRatingInfo(selectedMerchant.rating).grade}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedMerchant.name}</h3>
                    <span className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${merchantStatusMap[selectedMerchant.status].color}`}>
                      {merchantStatusMap[selectedMerchant.status].label}
                    </span>
                  </div>
                  <div className="flex items-center mb-3">
                    <div className="flex items-center mr-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${star <= Math.round(selectedMerchant.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-2 font-semibold text-gray-700">{selectedMerchant.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">{getMerchantRatingInfo(selectedMerchant.rating).label}</span>
                  </div>
                  {selectedMerchant.license_no && (
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <ShieldCheck className="w-4 h-4 mr-1.5 text-green-500" />
                      营业执照: {selectedMerchant.license_no}
                    </div>
                  )}
                  <div className="text-sm text-gray-400">
                    入驻时间: {new Date(selectedMerchant.created_at).toLocaleDateString('zh-CN')}
                  </div>
                  {selectedMerchant.description && (
                    <p className="mt-3 text-gray-600 leading-relaxed">{selectedMerchant.description}</p>
                  )}
                </div>
              </div>

              {merchantCoupons.length > 0 && (
                <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-red-500" />
                    商户优惠券
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {merchantCoupons.map((coupon) => (
                      <div key={coupon.id} className="bg-white rounded-xl p-4 border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-red-600 text-xl">
                              {coupon.discount_type === 'fixed'
                                ? formatPrice(coupon.discount_value)
                                : `${coupon.discount_value}%折扣`}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">满{formatPrice(coupon.min_amount)}可用</div>
                          </div>
                          <button
                            onClick={() => handleRedeemCoupon(coupon.id)}
                            disabled={actionLoading}
                            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                          >
                            领取
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {merchantProducts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 text-blue-500" />
                    热销商品
                  </h4>
                  <div className="space-y-3">
                    {merchantProducts.map((product) => (
                      <div key={product.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{product.name}</h5>
                          {product.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>
                          )}
                          <div className="text-sm text-gray-400 mt-1">库存: {product.stock}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-500">{formatPrice(product.price)}</div>
                          <button
                            onClick={() => handleAddToCart({ ...product, merchant_name: selectedMerchant.name })}
                            disabled={product.stock === 0 || product.status === 'inactive'}
                            className="mt-2 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                          >
                            {product.stock === 0 ? '已售罄' : '加入购物车'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowMerchantDetail(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold">购物车</h2>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {cart.length === 0 ? (
                renderEmpty('购物车为空')
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                          {item.product.image_url ? (
                            <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                          <p className="text-sm text-gray-500">{item.product.merchant_name}</p>
                          <div className="text-red-500 font-semibold mt-1">{formatPrice(item.product.price)}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, -1)}
                            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, 1)}
                            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="font-semibold text-gray-900 text-lg">{formatPrice(item.product.price * item.quantity)}</div>
                          <div className="text-xs text-yellow-600 mt-1 flex items-center justify-end">
                            <Coins className="w-3 h-3 mr-1" />
                            返 {Math.floor(item.product.price * item.quantity * 10)} 积分
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedCoupon && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-medium">
                          优惠券: {selectedCoupon.name} (-{formatPrice(selectedCoupon.discount_value)})
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCoupon(null)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        取消
                      </button>
                    </div>
                  )}

                  {memberProfile && getPointsDeduction() > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Coins className="w-5 h-5 text-yellow-600" />
                        <span className="text-yellow-700 font-medium">
                          可用 {Math.floor(getPointsDeduction() * 100)} 积分抵扣 {formatPrice(getPointsDeduction())}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">最多抵扣20%</span>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xl font-bold mb-4">
                      <span>合计</span>
                      <span className="text-red-500">{formatPrice(getCartTotal() - getPointsDeduction())}</span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowCartModal(false)}
                        className="flex-1 px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                      >
                        继续购物
                      </button>
                      <button
                        onClick={() => handleCreateOrder()}
                        disabled={actionLoading}
                        className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all font-medium shadow-lg shadow-blue-200"
                      >
                        {actionLoading ? '提交中...' : '立即结算'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold">订单详情</h2>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                  selectedOrder.status === 'completed' ? 'bg-green-100' : 
                  selectedOrder.status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {selectedOrder.status === 'completed' ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <Clock className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div className="text-xl font-semibold text-gray-800">
                  {orderStatusMap[selectedOrder.status]?.label}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  下单时间: {formatDate(selectedOrder.created_at)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-medium text-gray-800 mb-3">订单信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">订单编号</span>
                    <span className="text-gray-800 font-mono">#{selectedOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">商户</span>
                    <span className="text-gray-800">{selectedOrder.merchant_name}</span>
                  </div>
                  {selectedOrder.product_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">商品</span>
                      <span className="text-gray-800">{selectedOrder.product_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-medium text-gray-800 mb-3">支付信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">商品金额</span>
                    <span className="text-gray-800">{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">优惠券抵扣</span>
                      <span className="text-green-600">-{formatPrice(selectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-800">实付金额</span>
                    <span className="font-bold text-red-500 text-lg">{formatPrice(selectedOrder.pay_amount)}</span>
                  </div>
                  {selectedOrder.points_earned && (
                    <div className="flex justify-between pt-2">
                      <span className="text-gray-500">获得积分</span>
                      <span className="text-yellow-600 flex items-center">
                        <Coins className="w-3 h-3 mr-1" />
                        +{selectedOrder.points_earned}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedOrder.status === 'paid' && (
                <div className="flex space-x-3">
                  <button
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium"
                  >
                    确认收货
                  </button>
                </div>
              )}

              {selectedOrder.status === 'completed' && (
                <div className="text-center py-4">
                  <div className="w-32 h-32 mx-auto bg-white rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-3">
                    <QrCode className="w-16 h-16 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">核销码</span>
                  </div>
                  <button
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium"
                  >
                    评价服务
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
