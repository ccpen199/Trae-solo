import { useState } from 'react';
import { MapPin, Clock, Banknote, Star, Sparkles, Baby, ChefHat, CheckCircle, XCircle, Navigation, RefreshCw } from 'lucide-react';
import WorkerNavbar from '@/components/WorkerNavbar';
import WorkerSidebar from '@/components/WorkerSidebar';
import HeatmapCanvas from '@/components/HeatmapCanvas';
import { useDispatchStore } from '@/store/useDispatchStore';
import { useWorkerStore } from '@/store/useWorkerStore';
import type { ServiceType } from '@/types';
import { cn } from '@/lib/utils';

const serviceIconMap: Record<ServiceType, typeof Sparkles> = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

const serviceLabelMap: Record<ServiceType, string> = {
  cleaning: '日常保洁',
  babysitting: '育婴陪护',
  cooking: '上门烹饪',
};

export default function WorkerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterType, setFilterType] = useState<ServiceType | 'all'>('all');
  const mapData = useDispatchStore((state) => state.mapData);
  const refreshHeatmap = useDispatchStore((state) => state.refreshHeatmap);
  const removeOrderFromDispatch = useDispatchStore((state) => state.removeOrderFromDispatch);
  const assignOrderToWorker = useDispatchStore((state) => state.assignOrderToWorker);
  const worker = useWorkerStore((state) => state.worker);
  const score = useWorkerStore((state) => state.score);

  const filteredOrders = filterType === 'all'
    ? mapData.orders
    : mapData.orders.filter((o) => o.service_type === filterType);

  const nearbyOrders = filteredOrders.filter((o) => o.distance_km <= 1);

  const handleAcceptOrder = (orderId: number) => {
    if (worker) {
      assignOrderToWorker(orderId, worker.id);
    }
  };

  const handleRejectOrder = (orderId: number) => {
    removeOrderFromDispatch(orderId);
  };

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <WorkerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <WorkerNavbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
          <div className="mb-6 animate-fade-up">
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-800">工作台</h1>
            <p className="text-secondary-500 mt-1">查看附近订单，及时接单赚取收入</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: MapPin, label: '附近订单', value: nearbyOrders.length, color: 'text-primary-500', bg: 'bg-primary-50' },
              { icon: Clock, label: '今日完成', value: 3, color: 'text-secondary-500', bg: 'bg-secondary-50' },
              { icon: Banknote, label: '今日收入', value: '¥380', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Star, label: '综合评分', value: score?.overall_score || '--', color: 'text-amber-500', bg: 'bg-amber-50' },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={cn('card p-4 md:p-5 animate-fade-up', `stagger-${index + 1}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
                      <Icon className={cn('w-5 h-5', stat.color)} />
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-secondary-800">{stat.value}</p>
                  <p className="text-sm text-secondary-500 mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <div className="card p-5 animate-fade-up stagger-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-secondary-800">区域订单热力图</h2>
                    <p className="text-sm text-secondary-500">实时查看周边订单分布</p>
                  </div>
                  <button
                    onClick={refreshHeatmap}
                    className="p-2 rounded-xl bg-secondary-50 hover:bg-secondary-100 text-secondary-600 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
                <HeatmapCanvas
                  points={mapData.heatmap}
                  width={800}
                  height={360}
                  radius={70}
                />
              </div>

              <div className="card p-5 animate-fade-up stagger-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-secondary-800">订单类型筛选</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { type: 'all', label: '全部' },
                    { type: 'cleaning', label: '保洁' },
                    { type: 'babysitting', label: '育婴' },
                    { type: 'cooking', label: '烹饪' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => setFilterType(item.type as ServiceType | 'all')}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                        filterType === item.type
                          ? 'bg-primary-500 text-white shadow-soft'
                          : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="card p-5 animate-fade-up stagger-3">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-secondary-800">附近1km订单</h2>
                    <p className="text-sm text-secondary-500">共 {nearbyOrders.length} 个待接订单</p>
                  </div>
                  <Navigation className="w-5 h-5 text-primary-500" />
                </div>

                {nearbyOrders.length === 0 ? (
                  <div className="text-center py-8 text-secondary-400">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>附近暂无订单，请稍后刷新</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-hide pr-1">
                    {nearbyOrders.map((order, index) => {
                      const Icon = serviceIconMap[order.service_type];
                      return (
                        <div
                          key={order.id}
                          className={cn(
                            'p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-soft transition-all duration-300 animate-fade-up',
                            `stagger-${Math.min(index + 1, 6)}`
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-soft">
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-secondary-800">{serviceLabelMap[order.service_type]}</h3>
                                <p className="text-sm text-secondary-500">#{order.id}</p>
                              </div>
                            </div>
                            <span className="badge-orange">¥{order.amount}</span>
                          </div>

                          <div className="space-y-2 text-sm mb-3">
                            <div className="flex items-center gap-2 text-secondary-600">
                              <MapPin className="w-4 h-4 text-secondary-400" />
                              <span className="truncate">{order.address}</span>
                            </div>
                            <div className="flex items-center gap-4 text-secondary-600">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-secondary-400" />
                                <span>{new Date(order.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <span className="text-primary-600 font-medium">{order.distance_km}km</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptOrder(order.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 active:scale-95 transition-all duration-200"
                            >
                              <CheckCircle className="w-4 h-4" />
                              接单
                            </button>
                            <button
                              onClick={() => handleRejectOrder(order.id)}
                              className="px-3 py-2 bg-secondary-50 text-secondary-600 rounded-xl font-medium hover:bg-secondary-100 active:scale-95 transition-all duration-200"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
