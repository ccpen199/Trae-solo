import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Box,
  MapPin,
  Thermometer,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { cabinetApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Cabinet {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  totalCompartments: number;
  occupiedCompartments: number;
  temperature?: string;
  lastHeartbeat?: string;
}

interface Compartment {
  id: string;
  code: string;
  size: 'small' | 'medium' | 'large';
  status: 'empty' | 'occupied' | 'locked' | 'maintenance';
  temperatureZone?: 'normal' | 'cool' | 'frozen';
}

export default function CabinetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cabinet, setCabinet] = useState<Cabinet | null>(null);
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [selectedCompartment, setSelectedCompartment] =
    useState<Compartment | null>(null);
  const [alerts, setAlerts] = useState<
    Array<{ id: string; type: string; message: string; time: string }>
  >([]);

  useEffect(() => {
    if (id) {
      loadCabinetData();
    }
  }, [id]);

  const loadCabinetData = async () => {
    setLoading(true);
    try {
      const [cabinetRes, compartmentsRes] = await Promise.all([
        cabinetApi.getById(id!),
        cabinetApi.getCompartments(id!),
      ]);

      if (cabinetRes.success && cabinetRes.data) {
        setCabinet(cabinetRes.data as Cabinet);
      }

      if (compartmentsRes.success && compartmentsRes.data) {
        setCompartments(compartmentsRes.data as Compartment[]);
      }

      setAlerts([
        {
          id: '1',
          type: 'door',
          message: '柜门异常开启',
          time: '10分钟前',
        },
        {
          id: '2',
          type: 'temperature',
          message: '温度超出正常范围',
          time: '30分钟前',
        },
      ]);
    } catch (error) {
      console.error('Failed to load cabinet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompartmentColor = (status: string) => {
    switch (status) {
      case 'empty':
        return 'bg-slate-100 border-slate-200 hover:bg-slate-200';
      case 'occupied':
        return 'bg-sky-500 border-sky-600 text-white';
      case 'locked':
        return 'bg-red-500 border-red-600 text-white';
      case 'maintenance':
        return 'bg-amber-500 border-amber-600 text-white';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'small':
        return '小号';
      case 'medium':
        return '中号';
      case 'large':
        return '大号';
      default:
        return size;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  if (!cabinet) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Box className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-slate-500 mb-4">柜子不存在</p>
        <button
          onClick={() => navigate('/cabinets')}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          返回列表
        </button>
      </div>
    );
  }

  const occupancyRate =
    cabinet.totalCompartments > 0
      ? Math.round((cabinet.occupiedCompartments / cabinet.totalCompartments) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/cabinets')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{cabinet.name}</h1>
          <p className="text-slate-500 text-sm mt-1">柜子详情</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              格子状态
            </h2>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {compartments.map((compartment) => (
                <button
                  key={compartment.id}
                  onClick={() => setSelectedCompartment(compartment)}
                  className={cn(
                    'aspect-square rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all hover:scale-105',
                    getCompartmentColor(compartment.status)
                  )}
                  title={`${compartment.code} - ${compartment.status}`}
                >
                  {compartment.code.replace(/[^0-9]/g, '')}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200"></div>
                <span className="text-sm text-slate-600">空闲</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-sky-500 border border-sky-600"></div>
                <span className="text-sm text-slate-600">占用</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500 border border-red-600"></div>
                <span className="text-sm text-slate-600">锁定</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500 border border-amber-600"></div>
                <span className="text-sm text-slate-600">维护</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              柜子信息
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Box className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">状态</p>
                  <StatusBadge status={cabinet.status} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">位置</p>
                  <p className="text-sm font-medium text-slate-700">
                    {cabinet.location}
                  </p>
                </div>
              </div>

              {cabinet.temperature && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Thermometer className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">温度</p>
                    <p className="text-sm font-medium text-slate-700">
                      {cabinet.temperature}°C
                    </p>
                  </div>
                </div>
              )}

              {cabinet.lastHeartbeat && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">最后心跳</p>
                    <p className="text-sm font-medium text-slate-700">
                      {cabinet.lastHeartbeat}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              统计数据
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">占用率</span>
                  <span className="text-sm font-bold text-slate-800">
                    {occupancyRate}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      occupancyRate > 80
                        ? 'bg-red-500'
                        : occupancyRate > 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    )}
                    style={{ width: `${occupancyRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-800">
                    {cabinet.totalCompartments}
                  </p>
                  <p className="text-xs text-slate-500">总格子</p>
                </div>
                <div className="text-center p-3 bg-sky-50 rounded-lg">
                  <p className="text-2xl font-bold text-sky-600">
                    {cabinet.occupiedCompartments}
                  </p>
                  <p className="text-xs text-slate-500">已占用</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          告警记录
        </h2>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">暂无告警记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg"
              >
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {alert.message}
                  </p>
                  <p className="text-xs text-slate-500">{alert.time}</p>
                </div>
                <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  处理
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedCompartment}
        onClose={() => setSelectedCompartment(null)}
        title="格子详情"
        size="sm"
      >
        {selectedCompartment && (
          <div className="space-y-4">
            <div className="text-center">
              <div
                className={cn(
                  'w-20 h-20 mx-auto rounded-xl flex items-center justify-center text-2xl font-bold',
                  getCompartmentColor(selectedCompartment.status)
                )}
              >
                {selectedCompartment.code.replace(/[^0-9]/g, '')}
              </div>
              <h3 className="mt-3 font-semibold text-slate-800">
                {selectedCompartment.code}
              </h3>
              <StatusBadge status={selectedCompartment.status} />
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">尺寸</span>
                <span className="text-sm font-medium text-slate-700">
                  {getSizeLabel(selectedCompartment.size)}
                </span>
              </div>
              {selectedCompartment.temperatureZone && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">温区</span>
                  <span className="text-sm font-medium text-slate-700">
                    {selectedCompartment.temperatureZone === 'normal'
                      ? '常温'
                      : selectedCompartment.temperatureZone === 'cool'
                      ? '冷藏'
                      : '冷冻'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setSelectedCompartment(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  navigate('/compartments');
                  setSelectedCompartment(null);
                }}
                className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
              >
                查看详情
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
