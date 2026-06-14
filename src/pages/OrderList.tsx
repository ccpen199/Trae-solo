import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Baby, ChefHat, MapPin, Clock, Phone, ChevronLeft, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Empty from '@/components/Empty';
import { useAppStore } from '@/store';
import type { Order, OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

const serviceIconMap = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

type FilterTab = 'all' | 'ongoing' | 'completed';

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'ongoing', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

function getStatusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, { className: string; label: string }> = {
    pending: { className: 'badge-gray', label: '待派单' },
    assigned: { className: 'badge-blue', label: '待接单' },
    accepted: { className: 'badge-blue', label: '已接单' },
    departing: { className: 'badge-orange', label: '已出发' },
    arrived: { className: 'badge-orange', label: '服务中' },
    servicing: { className: 'badge-orange', label: '服务中' },
    completed: { className: 'badge-green', label: '已完成' },
    cancelled: { className: 'badge-gray', label: '已取消' },
    compensated: { className: 'badge-red', label: '已赔付' },
  };
  return map[status];
}

const ongoingStatuses: OrderStatus[] = ['pending', 'assigned', 'accepted', 'departing', 'arrived', 'servicing'];

export default function OrderList() {
  const orders = useAppStore((state) => state.orders);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'ongoing') return ongoingStatuses.includes(order.status);
    if (activeTab === 'completed') return order.status === 'completed' || order.status === 'compensated' || order.status === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/" className="p-2 rounded-lg hover:bg-white transition-colors">
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">我的订单</h1>
            <p className="text-secondary-500">查看和管理您的所有服务订单</p>
          </div>
        </div>

        <div className="card p-2 mb-6 inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'text-secondary-600 hover:bg-secondary-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <Empty
            type="orders"
            action={
              <Link to="/" className="btn-primary inline-flex items-center gap-2">
                去下单
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const Icon = serviceIconMap[order.service_type];
              const badge = getStatusBadge(order.status);
              const isOngoing = ongoingStatuses.includes(order.status);

              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="card-hover p-6 block animate-fade-up"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        isOngoing ? 'bg-primary-50 text-primary-500' : 'bg-secondary-50 text-secondary-500'
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-secondary-800">{order.service_type_label}</h3>
                        <p className="text-sm text-secondary-500">订单号 #{order.id}</p>
                      </div>
                    </div>
                    <span className={badge.className}>{badge.label}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-secondary-600">
                      <MapPin className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                      <span className="truncate">{order.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary-600">
                      <Clock className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                      <span>{order.start_time} · {order.duration_hours}小时</span>
                    </div>
                    {order.worker_name && (
                      <div className="flex items-center gap-2 text-secondary-600">
                        <Phone className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                        <span>{order.worker_name} · {order.worker_phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-sm text-secondary-500">订单金额</span>
                      <p className="text-2xl font-bold text-primary-600">¥{order.amount}</p>
                    </div>
                    <div className="flex items-center gap-1 text-primary-600 font-medium">
                      查看详情
                      <ChevronLeft className="w-4 h-4 rotate-180" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
