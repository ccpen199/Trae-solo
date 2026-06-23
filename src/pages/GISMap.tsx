import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Navigation,
  Filter,
  ChevronDown,
  User,
  Phone,
  Star,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

interface ServiceStation {
  id: string;
  name: string;
  address: string;
  lng: number;
  lat: number;
  business_hours: string;
  services: string[];
  current_queue: number;
  phone: string;
  distance?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ListResponse<T> {
  list: T[];
  total: number;
}

const serviceTypes = ['全部', '缴费', '开户', '报装', '咨询', '维修', '安检'];

const BEIJING_CENTER = { lng: 116.4074, lat: 39.9042 };
const MAP_BOUNDS = { minLng: 116.1, maxLng: 116.6, minLat: 39.75, maxLat: 40.05 };

function getQueueStatus(count: number): 'success' | 'warning' | 'danger' {
  if (count === 0) return 'success';
  if (count <= 5) return 'warning';
  return 'danger';
}

function getQueueLabel(count: number): string {
  if (count === 0) return '空闲';
  if (count <= 5) return '较少';
  return '繁忙';
}

function lngLatToPosition(lng: number, lat: number, width: number, height: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * width;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * height;
  return { x, y };
}

function positionToLngLat(x: number, y: number, width: number, height: number) {
  const lng = MAP_BOUNDS.minLng + (x / width) * (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
  const lat = MAP_BOUNDS.maxLat - (y / height) * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
  return { lng, lat };
}

export default function GISMap() {
  const [stations, setStations] = useState<ServiceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<ServiceStation | null>(null);
  const [searchText, setSearchText] = useState('');
  const [serviceFilter, setServiceFilter] = useState('全部');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  const [myLocation] = useState({ lng: 116.42, lat: 39.92 });

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchText) params.append('area', searchText);

      const res = await fetch(`/api/service-stations?${params}`);
      const data: ApiResponse<ListResponse<ServiceStation>> = await res.json();

      if (data.success) {
        setStations(data.data.list);
      }
    } catch (err) {
      console.error('获取服务网点失败:', err);
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  const fetchNearbyStations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        lng: String(myLocation.lng),
        lat: String(myLocation.lat),
        radius: '10',
      });

      const res = await fetch(`/api/service-stations/nearby?${params}`);
      const data: ApiResponse<ListResponse<ServiceStation>> = await res.json();

      if (data.success) {
        setStations(data.data.list);
      }
    } catch (err) {
      console.error('获取附近网点失败:', err);
    } finally {
      setLoading(false);
    }
  }, [myLocation]);

  useEffect(() => {
    fetchNearbyStations();
  }, [fetchNearbyStations]);

  useEffect(() => {
    const updateSize = () => {
      if (mapRef.current) {
        setMapSize({
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const filteredStations = stations.filter((station) => {
    if (serviceFilter !== '全部' && !station.services.includes(serviceFilter)) {
      return false;
    }
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      return (
        station.name.toLowerCase().includes(lowerSearch) ||
        station.address.toLowerCase().includes(lowerSearch)
      );
    }
    return true;
  });

  const sortedStations = [...filteredStations].sort((a, b) => {
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });

  const handleStationClick = (station: ServiceStation) => {
    setSelectedStation(station);
  };

  const handleNavigate = (station: ServiceStation) => {
    alert(`正在为您规划前往 ${station.name} 的路线...`);
  };

  const getStationPosition = (station: ServiceStation) => {
    if (mapSize.width === 0 || mapSize.height === 0) {
      return { x: 0, y: 0 };
    }
    return lngLatToPosition(station.lng, station.lat, mapSize.width, mapSize.height);
  };

  const getMyPosition = () => {
    if (mapSize.width === 0 || mapSize.height === 0) {
      return { x: 0, y: 0 };
    }
    return lngLatToPosition(myLocation.lng, myLocation.lat, mapSize.width, mapSize.height);
  };

  const mapRoads = [
    { x1: 0, y1: 30, x2: 100, y2: 30, type: 'main' },
    { x1: 0, y1: 50, x2: 100, y2: 50, type: 'main' },
    { x1: 0, y1: 70, x2: 100, y2: 70, type: 'secondary' },
    { x1: 20, y1: 0, x2: 20, y2: 100, type: 'main' },
    { x1: 40, y1: 0, x2: 40, y2: 100, type: 'secondary' },
    { x1: 60, y1: 0, x2: 60, y2: 100, type: 'main' },
    { x1: 80, y1: 0, x2: 80, y2: 100, type: 'secondary' },
    { x1: 10, y1: 20, x2: 90, y2: 80, type: 'secondary' },
    { x1: 10, y1: 80, x2: 90, y2: 20, type: 'secondary' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">GIS服务网点</h1>
          <p className="text-sm text-gray-500 mt-1">查看附近的燃气服务网点及排队情况</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button
              variant="secondary"
              icon={Filter}
              onClick={() => setShowServiceDropdown(!showServiceDropdown)}
              className="min-w-[120px]"
            >
              <span className="flex items-center gap-1">
                {serviceFilter}
                <ChevronDown className="w-4 h-4" />
              </span>
            </Button>
            {showServiceDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                {serviceTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setServiceFilter(type);
                      setShowServiceDropdown(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                      serviceFilter === type && 'text-primary-600 font-medium'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-[600px]">
          <div className="flex-1 relative bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 overflow-hidden">
            <div ref={mapRef} className="absolute inset-0">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0, 82, 204, 0.05)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {mapRoads.map((road, i) => (
                  <line
                    key={i}
                    x1={`${road.x1}%`}
                    y1={`${road.y1}%`}
                    x2={`${road.x2}%`}
                    y2={`${road.y2}%`}
                    stroke={road.type === 'main' ? '#E5E7EB' : '#F3F4F6'}
                    strokeWidth={road.type === 'main' ? 6 : 3}
                    strokeLinecap="round"
                  />
                ))}
              </svg>

              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-medium bg-white/80 px-3 py-1 rounded-full">
                北京市
              </div>

              {mapSize.width > 0 &&
                sortedStations.map((station) => {
                  const pos = getStationPosition(station);
                  const queueStatus = getQueueStatus(station.current_queue);
                  const isSelected = selectedStation?.id === station.id;

                  return (
                    <div
                      key={station.id}
                      className={cn(
                        'absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-200 z-10',
                        isSelected && 'z-20 scale-110'
                      )}
                      style={{ left: pos.x, top: pos.y }}
                      onClick={() => handleStationClick(station)}
                    >
                      <div className="relative group">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform',
                            queueStatus === 'success' && 'bg-green-500',
                            queueStatus === 'warning' && 'bg-amber-500',
                            queueStatus === 'danger' && 'bg-red-500',
                            'hover:scale-110'
                          )}
                        >
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div
                          className={cn(
                            'absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0',
                            'border-l-[6px] border-r-[6px] border-t-[8px]',
                            'border-l-transparent border-r-transparent',
                            queueStatus === 'success' && 'border-t-green-500',
                            queueStatus === 'warning' && 'border-t-amber-500',
                            queueStatus === 'danger' && 'border-t-red-500'
                          )}
                        />

                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                          <div className="bg-white rounded-lg shadow-xl p-3 min-w-[180px] border border-gray-100">
                            <div className="font-semibold text-gray-800 text-sm mb-1">
                              {station.name}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              {station.address}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                排队 {station.current_queue} 人
                              </span>
                              <StatusBadge variant={queueStatus}>
                                {getQueueLabel(station.current_queue)}
                              </StatusBadge>
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                        </div>
                      </div>
                    </div>
                  );
                })}

              {mapSize.width > 0 && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-15"
                  style={{ left: getMyPosition().x, top: getMyPosition().y }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 w-8 h-8 -m-1 rounded-full bg-primary-500/30 animate-ping" />
                    <div className="w-6 h-6 rounded-full bg-primary-500 border-2 border-white shadow-lg flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {selectedStation && mapSize.width > 0 && (
                <div
                  className="absolute z-30 -translate-x-1/2 -translate-y-full"
                  style={{ left: getStationPosition(selectedStation).x, top: getStationPosition(selectedStation).y - 16 }}
                >
                  <div className="bg-white rounded-xl shadow-2xl p-4 min-w-[240px] border border-gray-100 animate-fade-in">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{selectedStation.name}</h3>
                        {selectedStation.distance !== undefined && (
                          <span className="text-xs text-primary-600 font-medium">
                            {selectedStation.distance.toFixed(2)} km
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedStation(null)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span>{selectedStation.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{selectedStation.business_hours}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{selectedStation.phone}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">实时排队</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-800">
                            {selectedStation.current_queue}
                          </span>
                          <span className="text-sm text-gray-400">人</span>
                          <StatusBadge variant={getQueueStatus(selectedStation.current_queue)}>
                            {getQueueLabel(selectedStation.current_queue)}
                          </StatusBadge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-sm text-gray-500">服务类型：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedStation.services.map((service, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-primary-50 text-primary-600 rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full mt-4"
                      icon={Navigation}
                      onClick={() => handleNavigate(selectedStation)}
                    >
                      导航前往
                    </Button>
                  </div>
                  <div className="w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 shadow" />
                </div>
              )}
            </div>

            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
              <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:text-primary-600 hover:shadow-lg transition-all">
                <ZoomIn className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:text-primary-600 hover:shadow-lg transition-all">
                <ZoomOut className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:text-primary-600 hover:shadow-lg transition-all">
                <Layers className="w-5 h-5" />
              </button>
              <button
                onClick={fetchNearbyStations}
                className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:text-primary-600 hover:shadow-lg transition-all"
                title="定位我的位置"
              >
                <Crosshair className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 z-20">
              <div className="text-xs font-medium text-gray-700 mb-2">排队人数图例</div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-gray-600">空闲 (0人)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs text-gray-600">较少 (1-5人)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-gray-600">繁忙 (&gt;5人)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索网点名称、地址..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-sm text-gray-500">
                共 <span className="font-medium text-gray-700">{sortedStations.length}</span> 个服务网点
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-lg p-4 animate-pulse"
                    >
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : sortedStations.length === 0 ? (
                <div className="py-12 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无符合条件的网点</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {sortedStations.map((station) => {
                    const queueStatus = getQueueStatus(station.current_queue);
                    const isSelected = selectedStation?.id === station.id;

                    return (
                      <div
                        key={station.id}
                        onClick={() => handleStationClick(station)}
                        className={cn(
                          'p-4 rounded-lg cursor-pointer transition-all border',
                          isSelected
                            ? 'bg-primary-50 border-primary-200 shadow-sm'
                            : 'bg-white border-gray-100 hover:border-primary-200 hover:shadow-sm'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-medium text-gray-800 text-sm line-clamp-1">
                            {station.name}
                          </h3>
                          {station.distance !== undefined && (
                            <span className="text-xs text-primary-600 font-medium whitespace-nowrap">
                              {station.distance.toFixed(2)}km
                            </span>
                          )}
