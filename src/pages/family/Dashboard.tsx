import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useOrderStore } from '@/stores/orderStore';
import { Heart, Calendar, Clock, Plus, Activity } from 'lucide-react';

export default function FamilyDashboard() {
  const { user } = useAuthStore();
  const { orders, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders({});
  }, [fetchOrders]);

  const upcomingOrders = orders
    .filter((o) => o.status === 'accepted' || o.status === 'in_progress')
    .slice(0, 5);

  const recentCompleted = orders
    .filter((o) => o.status === 'completed')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">你好，{user?.name || '家属'}</h1>
          <p className="text-sm text-gray-500 mt-1">关注家人健康，从专业护理开始</p>
        </div>
        <Link
          to="/family/book-service"
          className="flex items-center gap-2 bg-[#0F6CBD] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0D5DA8]"
        >
          <Plus className="w-4 h-4" />
          预约服务
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-[#1E293B]">患者信息</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">姓名：</span>待获取</p>
            <p><span className="text-gray-500">医疗摘要：</span>待获取</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[#0F6CBD]" />
            <h2 className="font-semibold text-[#1E293B]">即将到来的服务</h2>
          </div>
          {upcomingOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-6">暂无即将到来的服务</div>
          ) : (
            <div className="space-y-3">
              {upcomingOrders.map((order) => (
                <div key={order.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#0F6CBD] mt-2 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-[#1E293B] text-sm">{order.service_name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.scheduled_time).toLocaleString()}
                    </p>
                    {order.nurse_name && (
                      <p className="text-xs text-gray-500 mt-0.5">护士：{order.nurse_name}</p>
                    )}
                  </div>
                  <Link
                    to={`/family/order/${order.id}`}
                    className="text-xs text-[#0F6CBD] hover:underline"
                  >
                    查看详情
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-[#108043]" />
          <h2 className="font-semibold text-[#1E293B]">最近服务报告</h2>
        </div>
        {recentCompleted.length === 0 ? (
          <div className="text-center text-gray-400 py-6">暂无服务记录</div>
        ) : (
          <div className="space-y-3">
            {recentCompleted.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div>
                  <p className="font-medium text-[#1E293B] text-sm">{order.service_name}</p>
                  <p className="text-xs text-gray-500">
                    {order.nurse_name && `护士：${order.nurse_name} · `}
                    {new Date(order.scheduled_time).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">已完成</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
