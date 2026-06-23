import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../api';
import type { Order } from '../../types';

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待支付', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  active: { label: '使用中', color: 'text-green-600', bg: 'bg-green-50' },
  completed: { label: '已完成', color: 'text-gray-600', bg: 'bg-gray-50' },
  refunded: { label: '已退款', color: 'text-orange-600', bg: 'bg-orange-50' },
  cancelled: { label: '已取消', color: 'text-gray-400', bg: 'bg-gray-50' }
};

const deviceIconMap: Record<string, string> = {
  washer: '🧺',
  water_dispenser: '💧',
  shower: '🚿'
};

const deviceNameMap: Record<string, string> = {
  washer: '洗衣机',
  water_dispenser: '饮水机',
  shower: '淋浴终端'
};

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '使用中' },
  { value: 'pending', label: '待支付' },
  { value: 'completed', label: '已完成' },
  { value: 'refunded', label: '已退款' }
];

const OrderListPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getMyOrders({
        status: activeTab !== 'all' ? activeTab : undefined,
        pageSize: 100
      });
      setOrders(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const finishOrder = async (orderId: string) => {
    if (!confirm('确认结束使用？设备将停止运行。')) return;
    setActionLoading(orderId);
    try {
      await orderApi.finishOrder(orderId);
      alert('已结束使用');
      loadOrders();
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || '操作失败';
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const payOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await orderApi.payOrder(orderId, { payMethod: 'balance' });
      alert('支付成功！');
      loadOrders();
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || '支付失败';
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('确认取消该订单？')) return;
    setActionLoading(orderId);
    try {
      await orderApi.refundOrder(orderId, '用户取消');
      alert('订单已取消');
      loadOrders();
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || '操作失败';
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const requestRefund = async (orderId: string) => {
    const reason = prompt('请填写退款原因（选填）') || '';
    setActionLoading(orderId);
    try {
      await orderApi.refundOrder(orderId, reason);
      alert('退款申请已提交，处理结果将通过消息通知您');
      loadOrders();
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || '申请失败';
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (t: string | null) => {
    if (!t) return '-';
    try {
      return new Date(t).toLocaleString('zh-CN');
    } catch { return t; }
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
          <p className="text-gray-400 mb-4">暂无订单</p>
          <button
            onClick={() => navigate('/devices')}
            className="px-6 py-2 bg-primary-500 text-white rounded-xl"
          >
            去使用设备
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const meta = statusMeta[order.status] || statusMeta.completed;
            const icon = deviceIconMap[order.type] || '📱';
            const name = order.deviceName || deviceNameMap[order.type] || '共享设备';
            const isActing = actionLoading === order.id;

            return (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">
                    订单号: {order.id.slice(0, 12)}...
                  </span>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>

                <div
                  className="flex items-center py-3 border-y border-gray-50 cursor-pointer hover:bg-gray-50/50 -mx-4 px-4"
                  onClick={() => order.deviceId && navigate(`/devices/${order.deviceId}`)}
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-2xl">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      开始：{formatTime(order.startTime)}
                    </p>
                    {order.endTime && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        结束：{formatTime(order.endTime)}
                      </p>
                    )}
                    {order.duration > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        时长：{order.duration} 分钟
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">¥{order.amount.toFixed(2)}</p>
                    {order.payMethod && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {{ wechat: '微信', alipay: '支付宝', balance: '余额' }[order.payMethod] || order.payMethod}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => !isActing && cancelOrder(order.id)}
                        disabled={isActing}
                        className="px-4 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        {isActing ? '处理中...' : '取消订单'}
                      </button>
                      <button
                        onClick={() => !isActing && payOrder(order.id)}
                        disabled={isActing}
                        className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                      >
                        {isActing ? '处理中...' : '立即支付'}
                      </button>
                    </>
                  )}

                  {order.status === 'active' && (
                    <button
                      onClick={() => !isActing && finishOrder(order.id)}
                      disabled={isActing}
                      className="px-4 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      {isActing ? '处理中...' : '结束使用'}
                    </button>
                  )}

                  {order.status === 'completed' && (
                    <button
                      onClick={() => !isActing && requestRefund(order.id)}
                      disabled={isActing}
                      className="px-4 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isActing ? '处理中...' : '申请退款'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderListPage;
