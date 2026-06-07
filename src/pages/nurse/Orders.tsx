import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrderStore } from '@/stores/orderStore';
import { MapPin, Clock } from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: '待接单',
  dispatched: '已派单',
  accepted: '已接单',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  dispatched: 'bg-blue-100 text-blue-700',
  accepted: 'bg-cyan-100 text-cyan-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const tabs = ['全部', '待接单', '进行中', '已完成'];
const tabStatuses: Record<string, string | undefined> = {
  '全部': undefined,
  '待接单': 'pending',
  '进行中': 'in_progress',
  '已完成': 'completed',
};

export default function NurseOrders() {
  const [activeTab, setActiveTab] = useState('全部');
  const { orders, loading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders({ status: tabStatuses[activeTab] });
  }, [activeTab, fetchOrders]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">我的订单</h1>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[#0F6CBD] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">
          暂无订单
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/nurse/order/${order.id}`}
              className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#1E293B]">{order.service_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <p>患者：{order.patient_name}</p>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {order.patient_address}
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.scheduled_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
