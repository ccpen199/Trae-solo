import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.orders.my({ page, limit: 10 });
      setOrders(res.data?.list || []);
    } catch (err) {
      console.error('加载订单失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id: number) => {
    api.orders.pay(id).then(() => {
      alert('支付成功');
      loadOrders();
    }).catch((err) => {
      alert(err.message || '支付失败');
    });
  };

  const handleConfirm = async (id: number) => {
    api.orders.confirm(id).then(() => {
      alert('确认完成');
      loadOrders();
    }).catch((err) => {
      alert(err.message || '操作失败');
    });
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'bg-gray-100 text-gray-600' },
    processing: { label: '进行中', color: 'bg-blue-100 text-blue-600' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
    refunding: { label: '退款中', color: 'bg-orange-100 text-orange-600' },
  };

  const paymentStatusMap: Record<string, string> = {
    unpaid: '未支付',
    paid: '已支付',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">暂无订单数据</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">订单号</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">标题</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">金额</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">状态</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">支付状态</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">创建时间</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => {
                const status = statusMap[order.status] || statusMap.pending;
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm">{order.order_no}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{order.title}</td>
                    <td className="px-6 py-4 text-gray-600">¥{order.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {paymentStatusMap[order.payment_status] || order.payment_status}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {order.payment_status === 'unpaid' && (
                          <button
                            onClick={() => handlePay(order.id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            支付
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => handleConfirm(order.id)}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            确认完成
                          </button>
                        )}
                      </div>
                    </td>
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
