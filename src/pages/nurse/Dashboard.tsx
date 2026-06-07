import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useOrderStore } from '@/stores/orderStore';
import { ClipboardList, Clock, Award, Star, Navigation, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NurseDashboard() {
  const { user } = useAuthStore();
  const { orders, fetchOrders } = useOrderStore();
  const [stats, setStats] = useState({ todayTasks: 0, pendingOrders: 0, historyServices: 0, avgRating: 4.8 });

  useEffect(() => {
    fetchOrders({});
  }, [fetchOrders]);

  useEffect(() => {
    if (orders.length === 0) return;
    const today = new Date().toDateString();
    const todayTasks = orders.filter(
      (o) => (o.status === 'in_progress' || o.status === 'accepted') && new Date(o.scheduled_time).toDateString() === today
    ).length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const historyServices = orders.filter((o) => o.status === 'completed').length;
    const rated = orders.filter((o) => o.rating);
    const avgRating = rated.length ? rated.reduce((s, o) => s + (o.rating || 0), 0) / rated.length : 4.8;
    setStats({ todayTasks, pendingOrders, historyServices, avgRating: Math.round(avgRating * 10) / 10 });
  }, [orders]);

  const todayOrders = orders.filter(
    (o) => o.status === 'in_progress' || o.status === 'accepted'
  );

  const statCards = [
    { label: '今日任务', value: stats.todayTasks, icon: Clock, color: 'bg-blue-50 text-[#0F6CBD]' },
    { label: '待接订单', value: stats.pendingOrders, icon: ClipboardList, color: 'bg-yellow-50 text-yellow-600' },
    { label: '历史服务', value: stats.historyServices, icon: Award, color: 'bg-green-50 text-[#108043]' },
    { label: '平均评分', value: stats.avgRating, icon: Star, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            你好，{user?.name || '护士'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">欢迎回来，祝你工作顺利</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#1E293B]">今日任务</h2>
          </div>
          <div className="p-4">
            {todayOrders.length === 0 ? (
              <div className="text-center text-gray-400 py-8">暂无今日任务</div>
            ) : (
              <div className="space-y-3">
                {todayOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/nurse/order/${order.id}`}
                    className="block p-3 border border-gray-100 rounded-lg hover:border-[#0F6CBD] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#1E293B]">{order.service_name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.patient_name} · {order.patient_address}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {order.status === 'in_progress' ? '进行中' : '已接单'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      预约时间: {new Date(order.scheduled_time).toLocaleString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="font-semibold text-[#1E293B] mb-3">快捷操作</h2>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#0F6CBD] text-white text-sm hover:bg-[#0D5DA8] transition-colors">
                <Navigation className="w-4 h-4" />
                刷新定位
              </button>
              <Link
                to="/nurse/verification"
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm hover:border-[#0F6CBD] transition-colors"
              >
                <Shield className="w-4 h-4" />
                查看核验状态
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
