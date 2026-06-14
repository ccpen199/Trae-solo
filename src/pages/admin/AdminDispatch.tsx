import { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  User,
  RefreshCw,
  Filter,
  Send,
  Navigation,
  Star,
  Sparkles,
  Baby,
  ChefHat,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useDispatchStore } from '@/store/useDispatchStore';
import type { ServiceType } from '@/types';
import { cn } from '@/lib/utils';

const serviceTypeLabels: Record<ServiceType | 'all', { label: string; icon: typeof Sparkles }> = {
  all: { label: '全部', icon: Filter },
  cleaning: { label: '日常保洁', icon: Sparkles },
  babysitting: { label: '育儿陪护', icon: Baby },
  cooking: { label: '上门烹饪', icon: ChefHat },
};

export default function AdminDispatch() {
  const mapData = useDispatchStore((state) => state.mapData);
  const selectedOrderId = useDispatchStore((state) => state.selectedOrderId);
  const selectedWorkerId = useDispatchStore((state) => state.selectedWorkerId);
  const isDispatching = useDispatchStore((state) => state.isDispatching);
  const filterServiceType = useDispatchStore((state) => state.filterServiceType);
  const setSelectedOrderId = useDispatchStore((state) => state.setSelectedOrderId);
  const setSelectedWorkerId = useDispatchStore((state) => state.setSelectedWorkerId);
  const setIsDispatching = useDispatchStore((state) => state.setIsDispatching);
  const setFilterServiceType = useDispatchStore((state) => state.setFilterServiceType);
  const assignOrderToWorker = useDispatchStore((state) => state.assignOrderToWorker);
  const getFilteredOrders = useDispatchStore((state) => state.getFilteredOrders);
  const getNearbyWorkers = useDispatchStore((state) => state.getNearbyWorkers);
  const refreshHeatmap = useDispatchStore((state) => state.refreshHeatmap);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nearbyWorkers, setNearbyWorkers] = useState<typeof mapData.workers>([]);

  const filteredOrders = getFilteredOrders();
  const selectedOrder = mapData.orders.find((o) => o.id === selectedOrderId);
  const selectedWorker = mapData.workers.find((w) => w.id === selectedWorkerId);

  useEffect(() => {
    if (selectedOrder) {
      const nearby = getNearbyWorkers(selectedOrder.lng, selectedOrder.lat, 5);
      setNearbyWorkers(nearby);
    } else {
      setNearbyWorkers([]);
    }
  }, [selectedOrder, getNearbyWorkers, mapData.workers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#F0F7F8');
    gradient.addColorStop(1, '#D6EAEC');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = 'rgba(26, 83, 92, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= rect.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y <= rect.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    const lngToX = (lng: number) => {
      const min = 116.3;
      const max = 116.5;
      return ((lng - min) / (max - min)) * (rect.width - 80) + 40;
    };
    const latToY = (lat: number) => {
      const min = 39.85;
      const max = 40.02;
      return ((max - lat) / (max - min)) * (rect.height - 80) + 40;
    };

    mapData.heatmap.forEach((point) => {
      const x = lngToX(point.x);
      const y = latToY(point.y);
      const radius = (point.weight / 100) * 60 + 20;
      const radial = ctx.createRadialGradient(x, y, 0, x, y, radius);
      if (point.type === 'order') {
        radial.addColorStop(0, 'rgba(255, 107, 53, 0.5)');
        radial.addColorStop(0.5, 'rgba(255, 107, 53, 0.2)');
        radial.addColorStop(1, 'rgba(255, 107, 53, 0)');
      } else {
        radial.addColorStop(0, 'rgba(26, 83, 92, 0.5)');
        radial.addColorStop(0.5, 'rgba(26, 83, 92, 0.2)');
        radial.addColorStop(1, 'rgba(26, 83, 92, 0)');
      }
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    mapData.orders.forEach((order) => {
      const x = lngToX(order.lng);
      const y = latToY(order.lat);
      const isSelected = order.id === selectedOrderId;
      ctx.fillStyle = isSelected ? '#FF6B35' : '#FF8B4D';
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 12 : 9, 0, Math.PI * 2);
      ctx.fill();
      if (isSelected) {
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📦', x, y);
    });

    mapData.workers.forEach((worker) => {
      const x = lngToX(worker.lng);
      const y = latToY(worker.lat);
      const isSelected = worker.id === selectedWorkerId;
      ctx.fillStyle = worker.status === 'idle' ? '#1A535C' : '#94A3B8';
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 14 : 10, 0, Math.PI * 2);
      ctx.fill();
      if (isSelected) {
        ctx.strokeStyle = '#1A535C';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(x, y, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(worker.name.charAt(0), x, y);
    });

    if (selectedOrder && selectedWorker) {
      const x1 = lngToX(selectedOrder.lng);
      const y1 = latToY(selectedOrder.lat);
      const x2 = lngToX(selectedWorker.lng);
      const y2 = latToY(selectedWorker.lat);
      ctx.strokeStyle = '#1A535C';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData, selectedOrderId, selectedWorkerId]);

  const handleDispatch = () => {
    if (selectedOrderId && selectedWorkerId) {
      assignOrderToWorker(selectedOrderId, selectedWorkerId);
    }
  };

  return (
    <div className="flex min-h-screen bg-cream-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="调度中心" subtitle="智能匹配订单与阿姨，可视化热力图辅助决策" />
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3">
              <div className="flex items-center gap-1 bg-secondary-50 rounded-xl p-1">
                {(Object.keys(serviceTypeLabels) as (ServiceType | 'all')[]).map((type) => {
                  const { label } = serviceTypeLabels[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterServiceType(type)}
                      className={cn(
                        'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                        filterServiceType === type
                          ? 'bg-white text-secondary-700 shadow-sm'
                          : 'text-secondary-500 hover:text-secondary-700'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => refreshHeatmap()}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                刷新热力图
              </button>
              <div className="flex items-center gap-4 text-xs text-secondary-500 pl-3 border-l border-gray-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary-500" />
                  待派单
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-secondary-500" />
                  空闲阿姨
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  忙碌阿姨
                </div>
              </div>
            </div>
            <div className="flex-1 relative bg-secondary-50">
              <canvas ref={canvasRef} className="w-full h-full" />
              {isDispatching && (
                <div className="absolute top-4 left-4 right-4 mx-auto max-w-md bg-white rounded-xl shadow-lg p-4 border border-secondary-100 animate-fade-up">
                  <div className="flex items-center gap-2 mb-3">
                    <Send className="w-5 h-5 text-secondary-600" />
                    <h4 className="font-bold text-secondary-800">人工派单</h4>
                  </div>
                  {selectedOrder && selectedWorker ? (
                    <>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-secondary-500">订单</span>
                          <span className="font-medium text-secondary-800">
                            #{selectedOrder.id} · {selectedOrder.amount}元
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary-500">阿姨</span>
                          <span className="font-medium text-secondary-800">
                            {selectedWorker.name} · {selectedWorker.score}分
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsDispatching(false);
                            setSelectedOrderId(null);
                            setSelectedWorkerId(null);
                          }}
                          className="flex-1 py-2 bg-gray-50 text-secondary-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleDispatch}
                          className="flex-1 py-2 bg-secondary-600 text-white rounded-lg text-sm font-medium hover:bg-secondary-700 transition-colors"
                        >
                          确认派单
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-secondary-500">
                      请在左侧选择订单，然后在地图上选择空闲阿姨
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="w-80 border-l border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-secondary-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary-600" />
                待派单列表 ({filteredOrders.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredOrders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                const Icon = serviceTypeLabels[order.service_type]?.icon || Sparkles;
                return (
                  <button
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setSelectedWorkerId(null);
                      setIsDispatching(true);
                    }}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-all',
                      isSelected
                        ? 'bg-secondary-50 border-2 border-secondary-500 shadow-sm'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-secondary-50/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          isSelected ? 'bg-secondary-500 text-white' : 'bg-white text-secondary-600'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-secondary-800">
                            #{order.id}
                          </span>
                          <span className="text-sm font-bold text-primary-600">
                            ¥{order.amount}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-600 mt-1 line-clamp-1">
                          {order.address}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-secondary-500">
                            {new Date(order.start_time).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-primary-600 font-medium">
                              优先级 {order.priority_score}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredOrders.length === 0 && (
                <div className="py-12 text-center text-secondary-400">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">暂无待派订单</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-4">
              <h3 className="font-bold text-secondary-800 flex items-center gap-2 mb-3">
                <Navigation className="w-5 h-5 text-secondary-600" />
                附近空闲阿姨
                {selectedOrder && nearbyWorkers.length > 0 && (
                  <span className="text-xs font-normal text-secondary-500">
                    ({nearbyWorkers.length}人)
                  </span>
                )}
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(nearbyWorkers.length > 0 ? nearbyWorkers : mapData.workers.filter((w) => w.status === 'idle')).map(
                  (worker) => {
                    const isSelected = worker.id === selectedWorkerId;
                    return (
                      <button
                        key={worker.id}
                        onClick={() => selectedOrderId && setSelectedWorkerId(worker.id)}
                        disabled={!selectedOrderId}
                        className={cn(
                          'w-full p-2.5 rounded-lg text-left flex items-center gap-2.5 transition-all',
                          selectedOrderId
                            ? isSelected
                              ? 'bg-secondary-50 border border-secondary-400'
                              : 'bg-gray-50 hover:bg-secondary-50/50 border border-transparent'
                            : 'bg-gray-50 opacity-60 cursor-not-allowed border border-transparent'
                        )}
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {worker.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-secondary-800">
                              {worker.name}
                            </span>
                            <span className="flex items-center gap-0.5 text-xs text-amber-500">
                              <Star className="w-3 h-3 fill-amber-500" />
                              {worker.score}
                            </span>
                          </div>
                          <p className="text-xs text-secondary-500">
                            {worker.status === 'idle' ? '空闲中' : '服务中'}
                          </p>
                        </div>
                        <User className="w-4 h-4 text-secondary-400" />
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
