import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';

export default function Quotes() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const res = user?.role === 'buyer'
        ? await api.quotes.received({ limit: 20 })
        : await api.quotes.my({ limit: 20 });
      setQuotes(res.data?.list || []);
    } catch (err) {
      console.error('加载报价失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      await api.quotes.accept(id);
      alert('已接受报价');
      loadQuotes();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.quotes.reject(id);
      alert('已拒绝报价');
      loadQuotes();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-600' },
    accepted: { label: '已接受', color: 'bg-green-100 text-green-600' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-600' },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {user?.role === 'buyer' ? '收到的报价' : '我的报价'}
      </h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">暂无报价数据</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">需求标题</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">报价金额</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  {user?.role === 'supplier' ? '企业名称' : '供应商'}
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">状态</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">提交时间</th>
                {user?.role === 'buyer' && (
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">操作</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotes.map((quote) => {
                const status = statusMap[quote.status] || statusMap.pending;
                return (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{quote.demand_title || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">¥{quote.price?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{quote.enterprise_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(quote.created_at).toLocaleDateString()}
                    </td>
                    {user?.role === 'buyer' && quote.status === 'pending' && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAccept(quote.id)}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            接受
                          </button>
                          <button
                            onClick={() => handleReject(quote.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            拒绝
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
