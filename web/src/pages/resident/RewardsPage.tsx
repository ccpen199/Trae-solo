import { useState, useEffect, useMemo } from 'react';
import { rewardsApi } from '../../api';
import type { StreakData, RewardCoupon, RewardRecord } from '../../types';

const couponTabs = [
  { value: 'unused', label: '未使用' },
  { value: 'used', label: '已使用' },
  { value: 'expired', label: '已过期' }
];

const actionDescMap: Record<string, string> = {
  checkin: '每日签到',
  order_complete: '使用设备',
  bonus: '活动奖励',
  new_user: '新人礼包'
};

const deviceTypeIcon: Record<string, string> = {
  washer: '🧺',
  water_dispenser: '💧',
  shower: '🚿'
};

const RewardsPage = () => {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [coupons, setCoupons] = useState<RewardCoupon[]>([]);
  const [records, setRecords] = useState<RewardRecord[]>([]);
  const [couponTab, setCouponTab] = useState('unused');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [streakRes, couponsRes, recordsRes] = await Promise.all([
        rewardsApi.getStreak().catch(() => null),
        rewardsApi.getCoupons().catch(() => []),
        rewardsApi.getRecords().catch(() => [])
      ]);
      setStreak(streakRes);
      setCoupons(Array.isArray(couponsRes) ? couponsRes : []);
      setRecords(Array.isArray(recordsRes) ? recordsRes : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!streak?.canCheckIn) return;
    setCheckingIn(true);
    try {
      const res = await rewardsApi.checkIn();
      setStreak(res);
      alert(`✅ 签到成功！\n\n已连续签到 ${res.currentStreak} 天\n获得 10 积分`);
      loadData();
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || '签到失败';
      alert(msg);
    } finally {
      setCheckingIn(false);
    }
  };

  const filteredCoupons = useMemo(() => {
    const now = new Date();
    return coupons.filter(c => {
      const isExpired = new Date(c.expireAt) < now;
      if (couponTab === 'unused') return !c.isUsed && !isExpired;
      if (couponTab === 'used') return c.isUsed;
      if (couponTab === 'expired') return !c.isUsed && isExpired;
      return true;
    });
  }, [coupons, couponTab]);

  const canCheckIn = streak?.canCheckIn;

  const formatDate = (t: string) => {
    try {
      return new Date(t).toLocaleString('zh-CN');
    } catch { return t; }
  };

  return (
    <div className="p-4 pb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">奖励中心</h2>

      <div className="bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl p-5 text-white shadow-lg mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm">我的积分</p>
            <p className="text-3xl font-bold mt-1">{streak?.totalPoints || 0}</p>
            <p className="text-xs text-orange-100 mt-2">
              🔥 连续签到 {streak?.currentStreak || 0} 天
              {streak?.longestStreak && streak.longestStreak > 0 && (
                <span className="ml-2">· 最长 {streak.longestStreak} 天</span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
              <span className="text-3xl">🎁</span>
            </div>
            <button
              onClick={handleCheckIn}
              disabled={!canCheckIn || checkingIn}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                canCheckIn && !checkingIn
                  ? 'bg-white text-orange-500 active:scale-95 shadow-md'
                  : 'bg-white/30 text-white/70 cursor-not-allowed'
              }`}
            >
              {checkingIn ? '签到中...' : canCheckIn ? '立即签到 +10' : '今日已签到'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm mb-5 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {couponTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setCouponTab(tab.value)}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                couponTab === tab.value
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {couponTab === tab.value && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎫</div>
              <p className="text-gray-400 text-sm">
                {couponTab === 'unused' ? '暂无可用优惠券' :
                 couponTab === 'used' ? '暂无已使用优惠券' : '暂无已过期优惠券'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCoupons.map(coupon => {
                const now = new Date();
                const isExpired = new Date(coupon.expireAt) < now;
                const disabled = coupon.isUsed || isExpired;
                const displayValue = (coupon as any).value || (coupon as any).discount || 0;
                return (
                  <div
                    key={coupon.id}
                    className={`flex rounded-xl overflow-hidden shadow-sm ${
                      disabled ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="w-24 bg-gradient-to-b from-primary-500 to-primary-600 flex flex-col items-center justify-center text-white p-3 relative">
                      <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full translate-y-1/2 translate-x-1/2" />
                      <p className="text-2xl font-bold">
                        {coupon.type === 'cash' ? `¥${displayValue}` : `${displayValue}折`}
                      </p>
                      <p className="text-xs text-primary-100 mt-0.5 text-center">
                        满{coupon.minAmount}可用
                      </p>
                    </div>
                    <div className="flex-1 bg-white p-3 flex flex-col justify-between border border-gray-50 border-l-0">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{coupon.name}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          有效期至 {new Date(coupon.expireAt).toLocaleDateString('zh-CN')}
                        </p>
                        {coupon.isUsed ? (
                          <span className="text-xs text-gray-400">已使用</span>
                        ) : isExpired ? (
                          <span className="text-xs text-gray-400">已过期</span>
                        ) : (
                          <span className="text-xs text-primary-600">去使用 →</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-800">积分记录</h3>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-400 text-sm">暂无积分记录</p>
            </div>
          ) : (
            <div>
              {records.map((record, idx) => {
                const isLast = idx === records.length - 1;
                const desc = record.description || actionDescMap[record.action] || record.action;
                return (
                  <div
                    key={record.id || idx}
                    className={`flex items-center px-5 py-3.5 ${
                      !isLast ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-base">
                        {record.deviceType
                          ? deviceTypeIcon[record.deviceType]
                          : record.action.includes('checkin')
                          ? '📅'
                          : record.action.includes('bonus') || record.action.includes('new_user')
                          ? '🎁'
                          : '✨'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{desc}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(record.createdAt)}</p>
                    </div>
                    <span
                      className={`text-sm font-semibold ml-2 flex-shrink-0 ${
                        record.points >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {record.points >= 0 ? '+' : ''}{record.points}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;
