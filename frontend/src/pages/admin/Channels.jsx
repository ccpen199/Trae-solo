import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminChannels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const res = await api.get('/channels/list');
      setChannels(res.data.channels || []);
    } finally {
      setLoading(false);
    }
  };

  const tiers = [
    { id: 't1', name: '普通经销商', min_sales: 0, discount: 0.95 },
    { id: 't2', name: '银牌经销商', min_sales: 1000000, discount: 0.90 },
    { id: 't3', name: '金牌经销商', min_sales: 5000000, discount: 0.85 },
    { id: 't4', name: '钻石经销商', min_sales: 20000000, discount: 0.80 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">渠道商管理</h2>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold mb-4">渠道等级体系</h3>
        <div className="grid grid-cols-4 gap-4">
          {tiers.map((tier, idx) => (
            <div key={tier.id} className="p-4 bg-gray-50 rounded-xl text-center">
              <div className="text-2xl mb-2">
                {idx === 3 ? '💎' : idx === 2 ? '🥇' : idx === 1 ? '🥈' : '🌱'}
              </div>
              <div className="font-bold text-gray-900">{tier.name}</div>
              <div className="text-sm text-purple-600 mt-1">
                折扣 {(tier.discount * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                月销 ¥{(tier.min_sales / 10000).toFixed(0)}万 达标
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold">渠道商列表</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : channels.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">渠道商</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">等级</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">折扣</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">累计销售</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">下级数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {channels.map((ch) => (
                <tr key={ch.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{ch.name || ch.username}</div>
                    <div className="text-sm text-gray-500">{ch.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-purple-600 font-medium">{ch.tier_name || '普通经销商'}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{(ch.discount * 100).toFixed(0)}%</td>
                  <td className="px-6 py-4 font-medium">¥{((ch.total_sales || 0) / 100).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">{ch.subordinate_count || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      ch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {ch.status === 'active' ? '正常' : '已冻结'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">🏪</div>
            <p>暂无渠道商数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
