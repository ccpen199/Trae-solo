import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function PointsPage() {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sumRes, logsRes] = await Promise.all([
        api.get('/energy/summary'),
        api.get('/points/logs'),
      ]);
      setSummary(sumRes.data);
      setLogs(logsRes.data.logs?.slice(0, 20) || []);
    } finally {
      setLoading(false);
    }
  };

  const levelInfo = (points) => {
    const levels = [
      { min: 0, name: '普通会员', icon: '🌱' },
      { min: 500, name: '白银会员', icon: '🥈' },
      { min: 2000, name: '黄金会员', icon: '🥇' },
      { min: 5000, name: '铂金会员', icon: '💎' },
      { min: 10000, name: '钻石会员', icon: '👑' },
    ];
    const current = levels.slice().reverse().find(l => points >= l.min) || levels[0];
    const nextIdx = levels.findIndex(l => l.min > points);
    const next = nextIdx > -1 ? levels[nextIdx] : null;
    return { current, next, levelProgress: next ? ((points - current.min) / (next.min - current.min) * 100) : 100 };
  };

  const totalPoints = summary?.total_points || 0;
  const { current, next, levelProgress } = levelInfo(totalPoints);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-3xl">{current.icon}</span>
              <span className="text-lg font-medium">{current.name}</span>
            </div>
            <p className="text-purple-100">继续获取积分，升级会员等级</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{totalPoints}</div>
            <div className="text-purple-100">可用积分</div>
          </div>
        </div>
        {next && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>距离 {next.name}</span>
              <span>{next.min - totalPoints} 积分</span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${levelProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm text-center">
          <div className="text-3xl mb-2">📱</div>
          <div className="text-2xl font-bold text-gray-900">+50</div>
          <div className="text-sm text-gray-500">绑定设备</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm text-center">
          <div className="text-3xl mb-2">🔧</div>
          <div className="text-2xl font-bold text-gray-900">+20</div>
          <div className="text-sm text-gray-500">服务好评</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm text-center">
          <div className="text-3xl mb-2">🌿</div>
          <div className="text-2xl font-bold text-gray-900">+10</div>
          <div className="text-sm text-gray-500">每日节能</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm text-center">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-2xl font-bold text-gray-900">+5</div>
          <div className="text-sm text-gray-500">产品评价</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">积分明细</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{log.type === 'earn' ? '⬆️' : '⬇️'}</span>
                  <div>
                    <div className="font-medium text-gray-900">{log.description}</div>
                    <div className="text-xs text-gray-500">{log.created_at?.slice(0, 16)}</div>
                  </div>
                </div>
                <div className={`font-bold ${log.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                  {log.type === 'earn' ? '+' : '-'}{log.points}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">⭐</div>
            <p>暂无积分记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
