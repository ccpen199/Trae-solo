import { useState, useEffect } from 'react';
import { rewardsApi } from '../../api';
import type { Reward, Coupon, StreakData } from '../../types';

const RewardsPage = () => {
  const [tab, setTab] = useState<'rewards' | 'coupons' | 'streak'>('coupons');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'rewards') {
        const res = await rewardsApi.getRewards();
        setRewards(res);
      } else if (tab === 'coupons') {
        const res = await rewardsApi.getCoupons();
        setCoupons(res);
      } else {
        const res = await rewardsApi.getStreak();
        setStreak(res);
      }
    } catch (error) {
      console.error('加载奖励数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await rewardsApi.checkIn();
      setStreak(res);
      alert('签到成功！');
    } catch (error) {
      alert('签到失败');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">奖励中心</h2>

      <div className="bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl p-5 text-white shadow-lg mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm">我的积分</p>
            <p className="text-3xl font-bold mt-1">156</p>
            <p className="text-xs text-orange-100 mt-1">累计获得 320 积分</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎁</span>
          </div>
        </div>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        {[
          { value: 'coupons', label: '优惠券' },
          { value: 'rewards', label: '积分商城' },
          { value: 'streak', label: '签到' }
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value as any)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.value ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : tab === 'coupons' ? (
        coupons.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🎫</div>
            <p className="text-gray-400">暂无优惠券</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white rounded-xl overflow-hidden shadow-sm flex ${
                  coupon.isUsed ? 'opacity-50' : ''
                }`}
              >
                <div className="w-24 bg-gradient-to-b from-primary-500 to-primary-600 flex flex-col items-center justify-center text-white p-3">
                  <p className="text-2xl font-bold">¥{coupon.discount}</p>
                  <p className="text-xs text-primary-100 mt-0.5">满{coupon.minAmount}可用</p>
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{coupon.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      有效期至 {new Date(coupon.expireAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  {coupon.isUsed ? (
                    <span className="text-xs text-gray-400 self-end">已使用</span>
                  ) : (
                    <button className="text-xs text-primary-600 self-end">去使用 →</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'rewards' ? (
        rewards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🏪</div>
            <p className="text-gray-400">暂无商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {rewards.map((reward) => (
              <div key={reward.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  <span className="text-5xl">{reward.imageUrl || '🎁'}</span>
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-800 truncate">{reward.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{reward.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-semibold text-orange-500">{reward.points} 积分</span>
                    <button className="text-xs px-3 py-1 bg-primary-500 text-white rounded-full hover:bg-primary-600">
                      兑换
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div>
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 text-center">
            <p className="text-sm text-gray-500">连续签到</p>
            <p className="text-4xl font-bold text-orange-500 mt-2">{streak?.currentStreak || 0} 天</p>
            <p className="text-xs text-gray-400 mt-2">最长连续 {streak?.longestStreak || 0} 天</p>
            <button
              onClick={handleCheckIn}
              className="mt-4 w-full py-3 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-xl font-semibold hover:from-orange-500 hover:to-red-500 transition-all"
            >
              今日签到 +10 积分
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-medium text-gray-800 mb-3">本周签到</p>
            <div className="grid grid-cols-7 gap-2">
              {['一', '二', '三', '四', '五', '六', '日'].map((day, idx) => {
                const checked = (streak?.checkInDates?.length || 0) > idx;
                return (
                  <div key={day} className="flex flex-col items-center">
                    <span className="text-xs text-gray-400 mb-2">{day}</span>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                        checked
                          ? 'bg-orange-400 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {checked ? '✓' : idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsPage;
