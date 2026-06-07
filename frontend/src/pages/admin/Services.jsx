import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminServices() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadOrders();
  }, [status]);

  const loadOrders = async () => {
    try {
      const res = await api.get('/services/orders', { params: { status } });
      setOrders(res.data.orders || []);
    } finally {
      setLoading(false);
    }
  };

  const assignOrder = async (orderId) => {
    try {
      await api.put(`/services/orders/${orderId}/assign`, { technician_id: 2 });
      alert('已派单');
      loadOrders();
    } catch (err) {
      alert('派单失败');
    }
  };

  const getStatusInfo = (s) => ({
    pending: { text: '待派单', color: 'bg-yellow-100 text-yellow-700' },
    assigned: { text: '已派单', color: 'bg-blue-100 text-blue-700' },
    processing: { text: '处理中', color: 'bg-purple-100 text-purple-700' },
    completed: { text: '已完成', color: 'bg-green-100 text-green-700' },
    cancelled: { text: '已取消', color: 'bg-gray-100 text-gray-700' },
  }[s] || { text: s, color: 'bg-gray-100 text-gray-700' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">工单管理</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">全部状态</option>
          <option value="pending">待派单</option>
          <option value="assigned">已派单</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div key={order.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {order.order_no} · {order.service_type}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        用户：{order.user_name} · {order.user_phone}
                      </div>
                      <div className="text-sm text-gray-500">
                        地址：{order.user_address}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => assignOrder(order.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          派单
                        </button>
                      )}
                    </div>
                  </div>
                  {order.description && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                      {order.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">📋</div>
            <p>暂无工单</p>
          </div>
        )}
      </div>
    </div>
  );
}
