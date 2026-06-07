import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const MEDAL_STYLES = [
  { bg: 'bg-gradient-to-r from-yellow-400 to-amber-500', ring: 'ring-yellow-300', label: '金' },
  { bg: 'bg-gradient-to-r from-gray-300 to-gray-400', ring: 'ring-gray-300', label: '银' },
  { bg: 'bg-gradient-to-r from-orange-400 to-orange-500', ring: 'ring-orange-300', label: '铜' },
];

export default function Ranking() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, [activeTab]);

  const loadRanking = async () => {
    setLoading(true);
    try {
      const data = activeTab === 'tasks'
        ? await api.activities.rankingTasks()
        : await api.activities.rankingEarning();
      setRanking(Array.isArray(data) ? data : data.ranking || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">排行榜</h1>

      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            任务完成榜
          </button>
          <button
            onClick={() => setActiveTab('earning')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'earning'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            收入排行榜
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : ranking.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无排行数据</div>
          ) : (
            <>
              {ranking.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {ranking.slice(0, 3).map((user, index) => {
                    const medal = MEDAL_STYLES[index];
                    return (
                      <div
                        key={user.id}
                        className={`relative rounded-xl p-5 text-center ring-2 ${medal.ring} bg-white shadow-sm`}
                      >
                        <div
                          className={`w-12 h-12 mx-auto rounded-full ${medal.bg} flex items-center justify-center text-white font-bold text-lg mb-3`}
                        >
                          {index + 1}
                        </div>
                        <div className="font-bold text-gray-800 mb-1">{user.username}</div>
                        <div className="text-sm text-gray-500">
                          完成 {user.completed_count ?? 0} 单
                        </div>
                        <div className="text-lg font-bold text-orange-500 mt-1">
                          ¥{(user.total_earning ?? 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">总收入</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {ranking.length > 3 && (
                <div className="divide-y">
                  {ranking.slice(3).map((user, index) => (
                    <div key={user.id} className="flex items-center gap-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-400">
                        {index + 4}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800">{user.username}</div>
                        <div className="text-sm text-gray-500">完成 {user.completed_count ?? 0} 单</div>
                      </div>
                      <div className="font-bold text-orange-500">
                        ¥{(user.total_earning ?? 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
