import { useState, useEffect } from 'react';
import { orderApi } from '../../api';
import type { Order } from '../../types';

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待支付', color: 'text-yellow-600' },
  paid: { label: '已支付', color: 'text-blue-600' },
  in_progress: { label: '使用中', color: 'text-green-600' },
  completed: { label: '已完成', color: 'text-gray-600' },
  refunded: { label: '已退款', color: 'text-orange-600' },
  cancelled: { label: '已取消', color: 'text-gray-400' }
};

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'in_progress', label: '使用中' },
  { value: 'completed', label: '已完成' },
  { value: 'pending', label: '待支付' }
];

const OrderListPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getMyOrders({
        status: activeTab !== 'all' ? activeTab : undefined,
        pageSize: 50
      });
      setOrders(res.items);
    } catch (error) {
      console.error('加载订单列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (orderId: string) => {
    try {
      await orderApi.payOrder(orderId, { paymentMethod: 'balance' });
      alert('支付成功');
      loadOrders();
    } catch (error) {
      alert('支付失败');
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm('确认申请退款？')) return;
    try {
      await orderApi.refundOrder(orderId);
      alert('退款申请已提交');
      loadOrders();
    } catch (error) {
      alert('申请失败');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">我的订单</h2>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-400">暂无订单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = statusMap[order.status];
            return (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">订单号: {order.id.slice(0, 12)}...</span>
                  <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                </div>

                <div className="flex items-center py-2 border-y border-gray-50">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-2xl">🧺</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">共享设备使用</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-800">¥{order.amount.toFixed(2)}</p>
                </div>

                {order.status === 'pending' && (
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => handleRefund(order.id)}
                      className="px-4 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      取消订单
                    </button>
                    <button
                      onClick={() => handlePay(order.id)}
                      className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                      立即支付
                    </button>
                  </div>
                )}

                {(order.status === 'paid' || order.status === 'in_progress') && (
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => handleRefund(order.id)}
                      className="px-4 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      申请退款
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderListPage;
