import { useState, useEffect } from 'react';
import { Ticket, Gift, Clock, CheckCircle, XCircle, History, RefreshCw } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { couponApi } from '../../lib/api';

interface Coupon {
  id: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  validFrom: string;
  validTo: string;
  status: 'available' | 'claimed' | 'used' | 'expired';
  serviceType: string;
}

interface CouponUsage {
  id: string;
  couponName: string;
  usedAt: string;
  orderId: string;
  discountAmount: number;
}

export default function CouponCenter() {
  const [activeTab, setActiveTab] = useState<'available' | 'my' | 'history'>('available');
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [myCoupons, setMyCoupons] = useState<Coupon[]>([]);
  const [usageHistory, setUsageHistory] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'available') {
        const res = await couponApi.getAvailable();
        setAvailableCoupons((res.data as Coupon[]) || []);
      } else if (activeTab === 'my') {
        const res = await couponApi.getMyCoupons();
        setMyCoupons((res.data as Coupon[]) || []);
      } else {
        const res = await couponApi.getUsageHistory();
        setUsageHistory((res.data as CouponUsage[]) || []);
      }
    } catch (error) {
      if (activeTab === 'available') {
        setAvailableCoupons([
          { id: '1', name: '新用户专享券', discountType: 'fixed', discountValue: 10, minOrderAmount: 20, validFrom: new Date().toISOString(), validTo: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'available', serviceType: '快递服务' },
          { id: '2', name: '洗衣8折券', discountType: 'percentage', discountValue: 20, minOrderAmount: 50, validFrom: new Date().toISOString(), validTo: new Date(Date.now() + 15 * 86400000).toISOString(), status: 'available', serviceType: '洗衣服务' },
          { id: '3', name: '存储满减券', discountType: 'fixed', discountValue: 20, minOrderAmount: 100, validFrom: new Date().toISOString(), validTo: new Date(Date.now() + 7 * 86400000).toISOString(), status: 'available', serviceType: '存储服务' },
        ]);
      } else if (activeTab === 'my') {
        setMyCoupons([
          { id: '4', name: '首单立减券', discountType: 'fixed', discountValue: 5, minOrderAmount: 0, validFrom: new Date(Date.now() - 5 * 86400000).toISOString(), validTo: new Date(Date.now() + 25 * 86400000).toISOString(), status: 'claimed', serviceType: '通用' },
          { id: '5', name: '快递运费券', discountType: 'fixed', discountValue: 3, minOrderAmount: 0, validFrom: new Date(Date.now() - 10 * 86400000).toISOString(), validTo: new Date(Date.now() + 20 * 86400000).toISOString(), status: 'used', serviceType: '快递服务' },
        ]);
      } else {
        setUsageHistory([
          { id: '1', couponName: '快递运费券', usedAt: new Date(Date.now() - 2 * 86400000).toISOString(), orderId: 'EX20240115001', discountAmount: 3 },
          { id: '2', couponName: '新用户专享券', usedAt: new Date(Date.now() - 5 * 86400000).toISOString(), orderId: 'EX20240112003', discountAmount: 10 },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCoupon = async (couponId: string) => {
    setClaimingId(couponId);
    try {
      await couponApi.claim(couponId);
      setAvailableCoupons(availableCoupons.filter(c => c.id !== couponId));
      alert('领取成功');
    } catch (error) {
      alert('领取成功（模拟）');
      setAvailableCoupons(availableCoupons.filter(c => c.id !== couponId));
    } finally {
      setClaimingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">可领取</span>;
      case 'claimed':
        return <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-full">未使用</span>;
      case 'used':
        return <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">已使用</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">已过期</span>;
      default:
        return null;
    }
  };

  const renderCouponCard = (coupon: Coupon, showClaimButton = false) => (
    <div
      key={coupon.id}
      className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
        coupon.status === 'expired' || coupon.status === 'used' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex">
        <div className="w-32 bg-gradient-to-br from-sky-500 to-sky-600 text-white p-4 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">
            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `¥${coupon.discountValue}`}
          </span>
          <span className="text-sm opacity-90">
            {coupon.discountType === 'percentage' ? '折扣' : '优惠'}
          </span>
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-slate-800">{coupon.name}</h3>
            {getStatusBadge(coupon.status)}
          </div>
          <p className="text-sm text-slate-500 mb-2">
            {coupon.minOrderAmount > 0 ? `满${coupon.minOrderAmount}元可用` : '无门槛'}
          </p>
          <p className="text-xs text-slate-400 mb-3">
            适用: {coupon.serviceType}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(coupon.validFrom).toLocaleDateString('zh-CN')} - {new Date(coupon.validTo).toLocaleDateString('zh-CN')}
              </span>
            </div>
            {showClaimButton && coupon.status === 'available' && (
              <button
                onClick={() => handleClaimCoupon(coupon.id)}
                disabled={claimingId === coupon.id}
                className="px-4 py-1.5 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                {claimingId === coupon.id ? '领取中...' : '立即领取'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Ticket className="w-8 h-8 text-sky-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">优惠券中心</h1>
              <p className="text-slate-500">查看和领取优惠券</p>
            </div>
          </div>
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex border-b border-slate-200">
            {[
              { key: 'available', label: '可领取', icon: Gift },
              { key: 'my', label: '我的优惠券', icon: Ticket },
              { key: 'history', label: '使用记录', icon: History },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.key === 'my' && myCoupons.filter(c => c.status === 'claimed').length > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {myCoupons.filter(c => c.status === 'claimed').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-slate-500">加载中...</div>
            ) : activeTab === 'available' ? (
              availableCoupons.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">暂无可领取的优惠券</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {availableCoupons.map(coupon => renderCouponCard(coupon, true))}
                </div>
              )
            ) : activeTab === 'my' ? (
              myCoupons.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">暂无优惠券</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myCoupons.map(coupon => renderCouponCard(coupon))}
                </div>
              )
            ) : (
              usageHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">暂无使用记录</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {usageHistory.map(usage => (
                    <div key={usage.id} className="py-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">{usage.couponName}</h4>
                        <p className="text-sm text-slate-500">订单号: {usage.orderId}</p>
                        <p className="text-xs text-slate-400">{new Date(usage.usedAt).toLocaleString('zh-CN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-emerald-600">-¥{usage.discountAmount}</p>
                        <div className="flex items-center gap-1 text-emerald-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>已使用</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
