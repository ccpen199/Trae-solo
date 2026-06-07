import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrderStore } from '@/stores/orderStore';
import { MapPin, Clock, User } from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: '待派单',
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

export default function FamilyOrders() {
  const { orders, loading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders({});
  }, [fetchOrders]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">我的订单</h1>

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
              to={`/family/order/${order.id}`}
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
                    {order.nurse_name && (
                      <p className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        护士：{order.nurse_name}
                      </p>
                    )}
                    <p className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.scheduled_time).toLocaleString()}
                    </p>
                  </div>
                </div>
                {order.status === 'in_progress' && order.nurse_name && (
                  <span className="text-xs text-[#0F6CBD] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    查看位置
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
