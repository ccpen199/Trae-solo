import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Layers,
  Thermometer,
  GraduationCap,
  Train,
  Filter,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import { mapApi, propertyApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MapProperty {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price: number;
  status: string;
  propertyType: string;
  district: string;
  totalPriceRange: string;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  value: number;
}

interface SubwayStation {
  id: string;
  name: string;
  line: string;
  lat: number;
  lng: number;
  radius: number;
  color: string;
}

interface SchoolDistrict {
  id: string;
  name: string;
  type: string;
  level: string;
  boundary: { lat: number; lng: number }[];
  lat: number;
  lng: number;
  correspondingProperties: string[];
}

export default function MapSearch() {
  const [properties, setProperties] = useState<MapProperty[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [subwayStations, setSubwayStations] = useState<SubwayStation[]>([]);
  const [schoolDistricts, setSchoolDistricts] = useState<SchoolDistrict[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const [layers, setLayers] = useState({
    properties: true,
    heatmap: true,
    subway: true,
    school: true,
  });

  const [heatmapType, setHeatmapType] = useState<'price' | 'transaction' | 'popularity'>('price');

  useEffect(() => {
    const fetchData = async () => {
      const [propsRes, heatmapRes, subwayRes, schoolsRes] = await Promise.all([
        mapApi.getMapProperties(),
        mapApi.getHeatmap(heatmapType),
        mapApi.getSubways(),
        mapApi.getSchools(),
      ]);

      if (propsRes.success) {
        setProperties(propsRes.data);
      }
      if (heatmapRes.success) {
        setHeatmapData(heatmapRes.data);
      }
      if (subwayRes.success) {
        setSubwayStations(subwayRes.data.stations || []);
      }
      if (schoolsRes.success) {
        setSchoolDistricts(schoolsRes.data);
      }
    };

    fetchData();
  }, [heatmapType]);

  const handleLayerToggle = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const mapBounds = useMemo(() => {
    const allPoints = [
      ...properties.map((p) => ({ lat: p.lat, lng: p.lng })),
      ...heatmapData,
      ...subwayStations.map((s) => ({ lat: s.lat, lng: s.lng })),
      ...schoolDistricts.map((s) => ({ lat: s.lat, lng: s.lng })),
    ];

    if (allPoints.length === 0) {
      return { minLat: 41.6, maxLat: 41.95, minLng: 123.3, maxLng: 123.6 };
    }

    const lats = allPoints.map((p) => p.lat);
    const lngs = allPoints.map((p) => p.lng);

    return {
      minLat: Math.min(...lats) - 0.02,
      maxLat: Math.max(...lats) + 0.02,
      minLng: Math.min(...lngs) - 0.02,
      maxLng: Math.max(...lngs) + 0.02,
    };
  }, [properties, heatmapData, subwayStations, schoolDistricts]);

  const latLngToXY = (lat: number, lng: number) => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
    const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
    return { x, y };
  };

  const heatmapColors = [
    { value: 0, color: 'rgba(0, 255, 255, 0.2)' },
    { value: 0.25, color: 'rgba(0, 255, 0, 0.4)' },
    { value: 0.5, color: 'rgba(255, 255, 0, 0.6)' },
    { value: 0.75, color: 'rgba(255, 128, 0, 0.7)' },
    { value: 1, color: 'rgba(255, 0, 0, 0.8)' },
  ];

  const getHeatmapColor = (value: number, maxValue: number) => {
    const ratio = value / maxValue;
    return `rgba(${Math.round(255 * ratio)}, ${Math.round(255 * (1 - ratio))}, 0, 0.6)`;
  };

  const maxHeatmapValue = Math.max(...heatmapData.map((d) => d.value), 1);

  const statusColors: Record<string, string> = {
    '在售': 'bg-green-500',
    '待售': 'bg-yellow-500',
    '售罄': 'bg-gray-400',
    '尾盘': 'bg-orange-500',
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">地图找房</h2>

            {/* Layer Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLayerToggle('properties')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    layers.properties
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500',
                  )}
                >
                  <MapPin className="w-4 h-4" />
                  楼盘
                </button>
                <button
                  onClick={() => handleLayerToggle('heatmap')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    layers.heatmap
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-500',
                  )}
                >
                  <Thermometer className="w-4 h-4" />
                  热力图
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLayerToggle('subway')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    layers.subway
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500',
                  )}
                >
                  <Train className="w-4 h-4" />
                  地铁
                </button>
                <button
                  onClick={() => handleLayerToggle('school')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    layers.school
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-500',
                  )}
                >
                  <GraduationCap className="w-4 h-4" />
                  学区
                </button>
              </div>
            </div>
          </div>

          {/* Heatmap Type Selector */}
          {layers.heatmap && (
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm text-gray-500 mb-2">热力图类型</p>
              <div className="flex gap-2">
                {[
                  { key: 'price', label: '成交均价' },
                  { key: 'transaction', label: '成交量' },
                  { key: 'popularity', label: '人气' },
                ].map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setHeatmapType(type.key as any)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      heatmapType === type.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Property List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <p className="text-sm text-gray-500 mb-2">
                共找到 <span className="text-blue-600 font-medium">{properties.length}</span> 个楼盘
              </p>
            </div>
            <div className="space-y-2 px-3 pb-3">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => setSelectedProperty(property)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all',
                    selectedProperty?.id === property.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900 text-sm">{property.name}</h4>
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0 mt-1.5',
                        statusColors[property.status] || 'bg-gray-400',
                      )}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{property.district}</p>
                  <p className="text-orange-500 font-bold mt-1 text-sm">
                    {property.price.toLocaleString()}
                    <span className="text-xs font-normal text-gray-400"> 元/㎡</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 relative overflow-hidden">
        {/* Map Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <Filter className="w-5 h-5" />
          </button>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2 text-sm text-gray-600">
            <Layers className="w-4 h-4 inline mr-2" />
            图层：
            {Object.entries(layers)
              .filter(([, v]) => v)
              .map(([k]) => {
                const labels: Record<string, string> = {
                  properties: '楼盘',
                  heatmap: '热力图',
                  subway: '地铁',
                  school: '学区',
                };
                return labels[k];
              })
              .join('、')}
          </div>
        </div>

        {/* Property Info Card */}
        {selectedProperty && (
          <div className="absolute top-4 right-4 z-20 w-72 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900">{selectedProperty.name}</h3>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-3">{selectedProperty.district}</p>
              <p className="text-2xl font-bold text-orange-500 mb-1">
                {selectedProperty.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-400"> 元/㎡</span>
              </p>
              <p className="text-xs text-gray-500 mb-3">{selectedProperty.totalPriceRange}</p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium text-white',
                    statusColors[selectedProperty.status] || 'bg-gray-400',
                  )}
                >
                  {selectedProperty.status}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {selectedProperty.propertyType}
                </span>
              </div>
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <Link
                to={`/properties/${selectedProperty.id}`}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium text-center hover:bg-blue-700 transition-colors"
              >
                查看详情
              </Link>
              <button className="px-4 py-2 border border-blue-500 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                预约看房
              </button>
            </div>
          </div>
        )}

        {/* Map Visualization */}
        <div className="relative w-full h-full bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            {Array.from({ length: 11 }, (_, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={`${i * 10}%`}
                x2="100%"
                y2={`${i * 10}%`}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            ))}
            {Array.from({ length: 11 }, (_, i) => (
              <line
                key={`v-${i}`}
                x1={`${i * 10}%`}
                y1="0"
                x2={`${i * 10}%`}
                y2="100%"
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            ))}
          </svg>

          {/* District Labels */}
          <div className="absolute top-[15%] left-[45%] text-gray-400 text-sm font-medium">
            皇姑区
          </div>
          <div className="absolute top-[35%] left-[60%] text-gray-400 text-sm font-medium">
            大东区
          </div>
          <div className="absolute top-[30%] left-[40%] text-gray-400 text-sm font-medium">
            沈河区
          </div>
          <div className="absolute top-[32%] left-[25%] text-gray-400 text-sm font-medium">
            铁西区
          </div>
          <div className="absolute top-[50%] left-[42%] text-gray-400 text-sm font-medium">
            和平区
          </div>
          <div className="absolute top-[60%] left-[35%] text-gray-400 text-sm font-medium">
            于洪区
          </div>
          <div className="absolute top-[70%] left-[25%] text-gray-400 text-sm font-medium">
            苏家屯区
          </div>
          <div className="absolute top-[10%] left-[65%] text-gray-400 text-sm font-medium">
            沈北新区
          </div>

          {/* School Districts */}
          {layers.school && (
            <svg className="absolute inset-0 w-full h-full">
              {schoolDistricts.map((school) => {
                const points = school.boundary
                  .map((p) => {
                    const { x, y } = latLngToXY(p.lat, p.lng);
                    return `${x}%,${y}%`;
                  })
                  .join(' ');
                const center = latLngToXY(school.lat, school.lng);
                return (
                  <g key={school.id}>
                    <polygon
                      points={points}
                      fill="rgba(168, 85, 247, 0.2)"
                      stroke="#a855f7"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    <text
                      x={`${center.x}%`}
                      y={`${center.y}%`}
                      textAnchor="middle"
                      className="text-xs fill-purple-600 font-medium"
                    >
                      {school.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Heatmap */}
          {layers.heatmap && (
            <svg className="absolute inset-0 w-full h-full">
              {heatmapData.map((point, idx) => {
                const { x, y } = latLngToXY(point.lat, point.lng);
                const size = 8 + (point.value / maxHeatmapValue) * 12;
                return (
                  <circle
                    key={idx}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r={`${size}%`}
                    fill={getHeatmapColor(point.value, maxHeatmapValue)}
                    style={{ filter: 'blur(8px)' }}
                  />
                );
              })}
            </svg>
          )}

          {/* Subway Stations */}
          {layers.subway && (
            <>
              {subwayStations.map((station) => {
                const pos = latLngToXY(station.lat, station.lng);
                return (
                  <div
                    key={station.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                      style={{ backgroundColor: station.color }}
                    >
                      <Train className="w-3 h-3 text-white" />
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap bg-white px-2 py-1 rounded shadow text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {station.name}
                      <br />
                      <span className="text-gray-400">{station.line}</span>
                    </div>
                    {/* Subway radius circle */}
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed opacity-30"
                      style={{
                        width: `${(station.radius / 111000) * 100 * 2}%`,
                        height: `${(station.radius / 111000) * 100 * 2}%`,
                        borderColor: station.color,
                      }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* Properties */}
          {layers.properties && (
            <>
              {properties.map((property) => {
                const pos = latLngToXY(property.lat, property.lng);
                const isSelected = selectedProperty?.id === property.id;
                return (
                  <div
                    key={property.id}
                    onClick={() => setSelectedProperty(property)}
                    className={cn(
                      'absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform z-10',
                      isSelected ? 'scale-125 z-20' : 'hover:scale-110',
                    )}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div
                      className={cn(
                        'px-2 py-1 rounded-lg text-xs font-bold text-white shadow-lg whitespace-nowrap',
                        isSelected
                          ? 'bg-blue-600 ring-2 ring-white'
                          : statusColors[property.status] || 'bg-blue-500',
                      )}
                    >
                      {property.price.toLocaleString()}元
                    </div>
                    <div className="w-2 h-2 bg-white rounded-full mx-auto -mt-0.5 shadow" />
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-20 bg-white rounded-lg shadow-md border border-gray-200 p-3">
          <p className="text-xs font-medium text-gray-700 mb-2">图例</p>
          <div className="space-y-1.5">
            {layers.properties && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-xs text-gray-600">在售楼盘</span>
              </div>
            )}
            {layers.heatmap && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-3 rounded bg-gradient-to-r from-cyan-400 via-yellow-400 to-red-500" />
                <span className="text-xs text-gray-600">热力</span>
              </div>
            )}
            {layers.subway && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-xs text-gray-600">地铁站点</span>
              </div>
            )}
            {layers.school && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-dashed border-purple-500 rounded" />
                <span className="text-xs text-gray-600">学区范围</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
