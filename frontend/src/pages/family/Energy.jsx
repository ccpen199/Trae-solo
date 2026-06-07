import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function EnergyPage() {
  const [summary, setSummary] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sumRes, rankRes] = await Promise.all([
        api.get('/energy/summary'),
        api.get('/energy/ranking'),
      ]);
      setSummary(sumRes.data);
      setRanking(rankRes.data.ranking || []);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">🌿 绿色生活报告</h2>
            <p className="text-green-100">您的每一次节能，都在为地球减负</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{summary.carbon_reduced || 0}</div>
            <div className="text-green-100">kg 碳减排</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">⚡</div>
            <div>
              <p className="text-gray-500 text-sm">本月用电</p>
              <p className="text-2xl font-bold text-gray-900">{summary.monthly_kwh || 0}<span className="text-sm font-normal text-gray-500"> kWh</span></p>
            </div>
          </div>
          <div className="mt-3 text-sm text-green-600">较上月节省 12.5%</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🌳</div>
            <div>
              <p className="text-gray-500 text-sm">相当于种树</p>
              <p className="text-2xl font-bold text-gray-900">{((summary.carbon_reduced || 0) / 10).toFixed(1)}<span className="text-sm font-normal text-gray-500"> 棵</span></p>
            </div>
          </div>
          <div className="mt-3 text-sm text-green-600">继续保持绿色生活</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">💰</div>
            <div>
              <p className="text-gray-500 text-sm">节省电费</p>
              <p className="text-2xl font-bold text-gray-900">¥{((summary.monthly_kwh || 0) * 0.56).toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-blue-600">智能调节帮您省钱</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">设备能耗排行</h3>
          <div className="space-y-4">
            {(summary.device_energy || []).map((item, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <span className="text-2xl">{item.icon || '📱'}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    <span className="text-sm text-gray-500">{item.kwh} kWh</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, item.kwh * 5)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!summary.device_energy || summary.device_energy.length === 0) && (
              <div className="text-center py-8 text-gray-500 text-sm">暂无数据</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">🏆 节能排行榜</h3>
          <div className="space-y-3">
            {ranking.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx === 0 ? 'bg-yellow-400 text-white' :
                  idx === 1 ? 'bg-gray-300 text-white' :
                  idx === 2 ? 'bg-orange-400 text-white' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {idx + 1}
                </span>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {item.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.tier || '环保达人'}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{item.carbon_reduced} kg</div>
                  <div className="text-xs text-gray-500">碳减排</div>
                </div>
              </div>
            ))}
            {ranking.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">暂无排行数据</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">💡 节能小贴士</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="text-2xl mb-2">🌡️</div>
            <h4 className="font-medium text-gray-900">空调温度</h4>
            <p className="text-sm text-gray-500 mt-1">夏季设置26°C，每调高1°C可省7%电量</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="text-2xl mb-2">🧊</div>
            <h4 className="font-medium text-gray-900">冰箱使用</h4>
            <p className="text-sm text-gray-500 mt-1">避免频繁开关门，热食冷却后再放入</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <div className="text-2xl mb-2">💡</div>
            <h4 className="font-medium text-gray-900">智能关灯</h4>
            <p className="text-sm text-gray-500 mt-1">使用离家场景自动关闭所有灯具</p>
          </div>
        </div>
      </div>
    </div>
  );
}
