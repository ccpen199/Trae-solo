import { useState, useEffect } from 'react';
import api from '../../utils/api';

const SERVICE_TYPES = [
  { id: 'install', name: '安装服务', icon: '🔧', desc: '新设备上门安装' },
  { id: 'repair', name: '维修服务', icon: '🔨', desc: '设备故障维修' },
  { id: 'maintain', name: '保养服务', icon: '✨', desc: '设备清洁保养' },
  { id: 'consult', name: '咨询服务', icon: '💬', desc: '使用问题咨询' },
];

export default function ServicesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    type: 'repair',
    device_id: '',
    description: '',
    contact_phone: '',
    appointment_time: '',
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    api.get('/services/orders')
      .then(res => setOrders(res.data.orders || []))
      .finally(() => setLoading(false));
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services/orders', orderForm);
      alert('工单提交成功！');
      setShowModal(false);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || '提交失败');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('确定取消工单？')) return;
    try {
      await api.put(`/services/orders/${orderId}/cancel`);
      loadOrders();
    } catch (err) {
      alert('取消失败');
    }
  };

  const getStatusInfo = (status) => {
    const map = {
      pending: { text: '待接单', color: 'bg-yellow-100 text-yellow-700' },
      assigned: { text: '已派单', color: 'bg-blue-100 text-blue-700' },
      processing: { text: '处理中', color: 'bg-purple-100 text-purple-700' },
      completed: { text: '已完成', color: 'bg-green-100 text-green-700' },
      cancelled: { text: '已取消', color: 'bg-gray-100 text-gray-700' },
    };
    return map[status] || map.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">售后服务</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + 提交服务申请
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {SERVICE_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setOrderForm({ ...orderForm, type: type.id });
              setShowModal(true);
            }}
            className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="text-3xl mb-2">{type.icon}</div>
            <div className="font-semibold text-gray-900">{type.name}</div>
            <div className="text-sm text-gray-500 mt-1">{type.desc}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold">我的工单</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">📋</div>
            <p>暂无服务工单</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => {
              const status = getStatusInfo(order.status);
              return (
                <div key={order.id} className="p-5">
                  <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                    🔧
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{order.service_type}</div>
                    <div className="text-sm text-gray-500">
                      工单号：{order.order_no} · {order.created_at?.slice(0, 10)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        取消
                      </button>
                    )}
                  </div>
                </div>
                {order.technician_name && (
                  <div className="mt-3 pl-16 text-sm text-gray-600">
                  维修人员：{order.technician_name} · {order.technician_phone}
                  {order.status === 'completed' && (
                    <span className="ml-4 text-green-600">服务已完成，好评 +20积分</span>
                  )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">提交服务申请</h3>
            <form onSubmit={submitOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">服务类型</label>
                <select
                  value={orderForm.type}
                  onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {SERVICE_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">问题描述</label>
                <textarea
                  value={orderForm.description}
                  onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="请描述您遇到的问题"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="tel"
                  value={orderForm.contact_phone}
                  onChange={(e) => setOrderForm({ ...orderForm, contact_phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预约时间</label>
                <input
                  type="datetime-local"
                  value={orderForm.appointment_time}
                  onChange={(e) => setOrderForm({ ...orderForm, appointment_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg"
                >
                  提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
