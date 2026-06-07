import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function ChannelDashboard() {
  const [stats, setStats] = useState(null);
  const [tierInfo, setTierInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, tierRes] = await Promise.all([
        api.get('/channels/stats'),
        api.get('/channels/tier'),
      ]);
      setStats(statsRes.data);
      setTierInfo(tierRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {tierInfo && (
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">🏪 {tierInfo.current_tier?.name}</h2>
              <p className="text-purple-100">
                当前折扣率：{(tierInfo.current_tier?.discount * 100).toFixed(0)}%
              </p>
            </div>
            {tierInfo.next_tier && (
              <div className="text-right">
                <div className="text-3xl font-bold">{tierInfo.next_tier.sales_needed.toFixed(0)}</div>
                <div className="text-purple-100">距离 {tierInfo.next_tier.name}</div>
                <div className="text-purple-200 text-sm">¥ 万元</div>
              </div>
            )}
          </div>
          {tierInfo.next_tier && (
            <div className="mt-4">
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${tierInfo.next_tier.progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">累计销售额</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            ¥{((stats?.total_sales || 0) / 100).toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">本月销售</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            ¥{((stats?.monthly_sales || 0) / 100).toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">下级渠道</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">{stats?.subordinate_count || 0}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">下级销售</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            ¥{((stats?.team_sales || 0) / 100).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">快捷操作</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/channel/orders" className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition-colors">
              <div className="text-2xl mb-2">📦</div>
              <div className="font-medium text-gray-900">采购下单</div>
            </Link>
            <Link to="/channel/subordinates" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <div className="font-medium text-gray-900">发展下级</div>
            </Link>
            <Link to="/mall" className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl text-center transition-colors">
              <div className="text-2xl mb-2">🛒</div>
              <div className="font-medium text-gray-900">商品目录</div>
            </Link>
            <Link to="/profile" className="p-4 bg-green-50 hover:bg-green-100 rounded-xl text-center transition-colors">
              <div className="text-2xl mb-2">🎫</div>
              <div className="font-medium text-gray-900">邀请码</div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-4">等级权益</h3>
          <div className="space-y-3">
            {tierInfo?.tiers?.map((tier, idx) => (
              <div key={tier.id} className={`p-3 rounded-xl ${
                tier.id === tierInfo.current_tier?.id ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      tier.id === tierInfo.current_tier?.id ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>{idx + 1}</span>
                    <span className="font-medium text-gray-900">{tier.name}</span>
                  </div>
                  <span className="text-purple-600 font-medium">{(tier.discount * 100).toFixed(0)}% 折扣</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 ml-9">
                  月销 ¥{(tier.min_sales / 10000).toFixed(1)}万 升级
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
