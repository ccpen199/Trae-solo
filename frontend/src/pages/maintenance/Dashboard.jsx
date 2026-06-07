import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function MaintenanceDashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/services/technician/orders');
      setOrders(res.data.orders || []);
      setStats({
        total: res.data.orders?.length || 0,
        pending: res.data.orders?.filter(o => o.status === 'assigned').length || 0,
        processing: res.data.orders?.filter(o => o.status === 'processing').length || 0,
        completed: res.data.orders?.filter(o => o.status === 'completed').length || 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      await api.put(`/services/orders/${orderId}/accept`);
      alert('已接单');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const completeOrder = async (orderId) => {
    try {
      await api.put(`/services/orders/${orderId}/complete`, { remark: '服务完成' });
      alert('服务已完成');
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">全部工单</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">待接单</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">{stats?.pending || 0}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">处理中</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{stats?.processing || 0}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">已完成</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{stats?.completed || 0}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold">工单列表</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {orders.length > 0 ? orders.map((order) => (
            <div key={order.id} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{order.service_type}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {order.user_name} · {order.user_phone} · {order.user_address}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    工单号：{order.order_no} · 预约：{order.appointment_time?.slice(0, 16)}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {order.status === 'pending' ? '待接单' :
                     order.status === 'assigned' ? '待处理' :
                     order.status === 'processing' ? '处理中' : '已完成'}
                  </span>
                  {order.status === 'assigned' && (
                    <button
                      onClick={() => acceptOrder(order.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      接单
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={() => completeOrder(order.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      完成
                    </button>
                  )}
                </div>
              </div>
              {order.description && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  问题描述：{order.description}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">📋</div>
              <p>暂无工单</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
