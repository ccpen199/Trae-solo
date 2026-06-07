import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function RedPacket() {
  const { user } = useAuth();
  const [redPackets, setRedPackets] = useState([]);
  const [myRecords, setMyRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grabLoading, setGrabLoading] = useState(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [count, setCount] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.activities.redPackets();
      setRedPackets(Array.isArray(data) ? data : data.redPackets || []);
      if (user) {
        try {
          const profile = await api.auth.profile();
          setMyRecords(profile.red_packet_records || []);
        } catch {
          setMyRecords([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleGrab = async (id) => {
    if (!user) return;
    setGrabLoading(id);
    try {
      const result = await api.activities.grabRedPacket(id);
      alert(`抢到 ¥${result.amount}`);
      loadData();
    } catch (e) {
      alert(e.message);
    }
    setGrabLoading(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!totalAmount || !count) {
      setCreateError('请填写总金额和红包数量');
      return;
    }
    setCreateSubmitting(true);
    try {
      await api.activities.createRedPacket({
        totalAmount: parseFloat(totalAmount),
        count: parseInt(count, 10),
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      });
      setTotalAmount('');
      setCount('');
      setMinAmount('');
      setMaxAmount('');
      loadData();
    } catch (e) {
      setCreateError(e.message);
    }
    setCreateSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">红包活动</h1>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">当前红包</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : redPackets.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无红包活动</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {redPackets.map((p) => {
              const remaining = p.remaining_count ?? 0;
              const total = p.count ?? 1;
              const depleted = remaining <= 0;
              return (
                <div key={p.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm text-gray-600">{p.sponsor_name} 发红包</div>
                      <div className="text-2xl font-bold text-red-600 mt-1">¥{p.total_amount}</div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {remaining}/{total} 个
                    </div>
                  </div>
                  <button
                    onClick={() => handleGrab(p.id)}
                    disabled={!user || depleted || grabLoading === p.id}
                    className="w-full mt-2 bg-red-500 text-white py-2 rounded font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {depleted ? '已抢完' : grabLoading === p.id ? '抢红包中...' : '抢红包'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {user && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-2">发红包</h2>
          <p className="text-sm text-gray-500 mb-4">
            当前余额: <span className="font-medium text-gray-800">¥{user.balance?.toFixed(2) ?? '0.00'}</span>
          </p>

          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">总金额</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">红包数量</label>
                <input
                  type="number"
                  min="1"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最小金额</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="选填"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最大金额</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="选填"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={createSubmitting}
              className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createSubmitting ? '发送中...' : '发红包'}
            </button>
          </form>
        </section>
      )}

      {user && myRecords.length > 0 && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">我的红包记录</h2>
          <div className="divide-y">
            {myRecords.map((r, i) => (
              <div key={r.id || i} className="flex justify-between items-center py-3">
                <div>
                  <div className="font-medium text-gray-800">{r.sponsor_name || '平台红包'}</div>
                  <div className="text-sm text-gray-500">{r.created_at || '-'}</div>
                </div>
                <div className="text-lg font-bold text-red-500">+¥{(r.amount ?? 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
