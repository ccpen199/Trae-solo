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
  TrendingUp,
  BarChart3,
  Flame,
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

const HEATMAP_MODES = {
  price: {
    label: '成交均价',
    desc: '颜色越深代表区域均价越高，帮助您判断房价分布格局',
    icon: TrendingUp,
    gradientLabel: '低价 → 高价',
    getGradientCSS: () => 'from-green-300 via-yellow-400 to-red-500',
  },
  transaction: {
    label: '成交量',
    desc: '颜色越深代表区域成交越活跃，帮助您识别热门交易区域',
    icon: BarChart3,
    gradientLabel: '低量 → 高量',
    getGradientCSS: () => 'from-blue-200 via-indigo-400 to-purple-600',
  },
  popularity: {
    label: '人气热度',
    desc: '颜色越深代表关注人气越高，帮助您发现市场焦点楼盘',
    icon: Flame,
    gradientLabel: '低热 → 高热',
    getGradientCSS: () => 'from-yellow-100 via-orange-400 to-amber-600',
  },
};

const SCHOOL_LEVEL_COLORS: Record<string, { fill: string; stroke: string; text: string; bg: string }> = {
  '省重点': { fill: 'rgba(220, 38, 38, 0.15)', stroke: '#dc2626', text: '#dc2626', bg: 'bg-red-100 text-red-700' },
  '市重点': { fill: 'rgba(37, 99, 235, 0.15)', stroke: '#2563eb', text: '#2563eb', bg: 'bg-blue-100 text-blue-700' },
  '区重点': { fill: 'rgba(124, 58, 237, 0.15)', stroke: '#7c3aed', text: '#7c3aed', bg: 'bg-purple-100 text-purple-700' },
  '普通': { fill: 'rgba(107, 114, 128, 0.10)', stroke: '#6b7280', text: '#6b7280', bg: 'bg-gray-100 text-gray-600' },
};

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

  const getHeatmapColor = (value: number, maxValue: number) => {
    const ratio = value / maxValue;
    if (heatmapType === 'price') {
      const r = Math.round(255 * ratio);
      const g = Math.round(200 * (1 - ratio));
      return `rgba(${r}, ${g}, 0, 0.6)`;
    } else if (heatmapType === 'transaction') {
      const r = Math.round(80 + 100 * ratio);
      const g = Math.round(80 * (1 - ratio));
      const b = Math.round(180 + 75 * ratio);
      return `rgba(${r}, ${g}, ${b}, 0.6)`;
    } else {
      const r = Math.round(200 + 55 * ratio);
      const g = Math.round(160 * (1 - ratio * 0.6));
      const b = Math.round(30 * (1 - ratio));
      return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }
  };

  const maxHeatmapValue = Math.max(...heatmapData.map((d) => d.value), 1);

  const sortedProperties = useMemo(() => {
    const sorted = [...properties];
    if (heatmapType === 'price') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (heatmapType === 'transaction') {
      sorted.sort((a, b) => {
        const aHeat = heatmapData.find(h => Math.abs(h.lat - a.lat) < 0.01 && Math.abs(h.lng - a.lng) < 0.01);
        const bHeat = heatmapData.find(h => Math.abs(h.lat - b.lat) < 0.01 && Math.abs(h.lng - b.lng) < 0.01);
        return (bHeat?.value || 0) - (aHeat?.value || 0);
      });
    } else {
      sorted.sort(() => Math.random() - 0.5);
    }
    return sorted;
  }, [properties, heatmapType, heatmapData]);

  const statusColors: Record<string, string> = {
    '在售': 'bg-green-500',
    '待售': 'bg-yellow-500',
    '售罄': 'bg-gray-400',
    '尾盘': 'bg-orange-500',
  };

  const mode = HEATMAP_MODES[heatmapType];
  const ModeIcon = mode.icon;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {showSidebar && (
        <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">地图找房</h2>

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

          {layers.heatmap && (
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm text-gray-500 mb-2">热力图类型</p>
              <div className="flex gap-2">
                {Object.entries(HEATMAP_MODES).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setHeatmapType(key as any)}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        heatmapType === key
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <div className={cn(
                'mt-3 px-3 py-2 rounded-lg text-xs',
                heatmapType === 'price' ? 'bg-red-50 text-red-700' :
                heatmapType === 'transaction' ? 'bg-indigo-50 text-indigo-700' :
                'bg-amber-50 text-amber-700'
              )}>
                <ModeIcon className="w-3.5 h-3.5 inline mr-1" />
                {mode.desc}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className={cn('flex-1 h-2 rounded-full bg-gradient-to-r', mode.getGradientCSS())} />
                <span className="text-xs text-gray-400 whitespace-nowrap">{mode.gradientLabel}</span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <p className="text-sm text-gray-500 mb-1">
                共找到 <span className="text-blue-600 font-medium">{properties.length}</span> 个楼盘
              </p>
              <p className="text-xs text-gray-400">
                {heatmapType === 'price' ? '按均价从高到低排列' :
                 heatmapType === 'transaction' ? '按成交量从高到低排列' :
                 '按人气热度排列'}
              </p>
            </div>
            <div className="space-y-2 px-3 pb-3">
              {sortedProperties.map((property, idx) => (
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
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                        idx < 3 ? 'bg-orange-500' : 'bg-gray-400'
                      )}>
                        {idx + 1}
                      </span>
                      <h4 className="font-medium text-gray-900 text-sm">{property.name}</h4>
                    </div>
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0 mt-1.5',
                        statusColors[property.status] || 'bg-gray-400',
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{property.district}</p>
                    <p className="text-orange-500 font-bold text-sm">
                      {property.price.toLocaleString()}
                      <span className="text-xs font-normal text-gray-400"> 元/㎡</span>
                    </p>
                  </div>
                  {heatmapType === 'transaction' && (
                    <div className="mt-1 flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-indigo-400" />
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                        {(() => {
                          const heat = heatmapData.find(h => Math.abs(h.lat - property.lat) < 0.01 && Math.abs(h.lng - property.lng) < 0.01);
                          const pct = heat ? (heat.value / maxHeatmapValue) * 100 : 0;
                          return <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full" style={{ width: `${pct}%` }} />;
                        })()}
                      </div>
                    </div>
                  )}
                  {heatmapType === 'popularity' && (
                    <div className="mt-1 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                        {(() => {
                          const heat = heatmapData.find(h => Math.abs(h.lat - property.lat) < 0.01 && Math.abs(h.lng - property.lng) < 0.01);
                          const pct = heat ? (heat.value / maxHeatmapValue) * 100 : 0;
                          return <div className="h-full bg-gradient-to-r from-yellow-300 to-amber-500 rounded-full" style={{ width: `${pct}%` }} />;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white rounded-xl border border-gray-200 relative overflow-hidden">
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
                  heatmap: HEATMAP_MODES[heatmapType].label,
                  subway: '地铁',
                  school: '学区',
                };
                return labels[k];
              })
              .join('、')}
          </div>
        </div>

        {layers.heatmap && (
          <div className={cn(
            'absolute top-4 left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 rounded-full shadow-lg border text-sm font-medium flex items-center gap-2',
            heatmapType === 'price' ? 'bg-gradient-to-r from-green-50 to-red-50 border-red-200 text-red-700' :
            heatmapType === 'transaction' ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-indigo-200 text-indigo-700' :
            'bg-gradient-to-r from-yellow-50 to-amber-50 border-amber-200 text-amber-700'
          )}>
            <ModeIcon className="w-4 h-4" />
            {mode.label}模式
            <span className="text-xs opacity-70 ml-1">— {mode.desc}</span>
          </div>
        )}

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

        <div className={cn(
          'relative w-full h-full',
          heatmapType === 'price' ? 'bg-gradient-to-br from-green-50 via-blue-50 to-red-50' :
          heatmapType === 'transaction' ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' :
          'bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50'
        )}>
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            {Array.from({ length: 11 }, (_, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={i * 10}
                x2="100"
                y2={i * 10}
                stroke="#94a3b8"
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />
            ))}
            {Array.from({ length: 11 }, (_, i) => (
              <line
                key={`v-${i}`}
                x1={i * 10}
                y1="0"
                x2={i * 10}
                y2="100"
                stroke="#94a3b8"
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />
            ))}
          </svg>

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

          {layers.school && (
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
              {schoolDistricts.map((school) => {
                const points = school.boundary
                  .map((p) => {
                    const { x, y } = latLngToXY(p.lat, p.lng);
                    return `${x},${y}`;
                  })
                  .join(' ');
                const center = latLngToXY(school.lat, school.lng);
                const levelStyle = SCHOOL_LEVEL_COLORS[school.level] || SCHOOL_LEVEL_COLORS['普通'];
                return (
                  <g key={school.id}>
                    <polygon
                      points={points}
                      fill={levelStyle.fill}
                      stroke={levelStyle.stroke}
                      strokeWidth="0.4"
                      strokeDasharray="1.5,0.8"
                    />
                    <circle
                      cx={center.x}
                      cy={center.y - 1.2}
                      r="2"
                      fill={levelStyle.stroke}
                      opacity="0.9"
                    />
                    <text
                      x={center.x}
                      y={center.y - 1.2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="1.2"
                      fill="white"
                      fontWeight="bold"
                    >
                      {school.level}
                    </text>
                    <text
                      x={center.x}
                      y={center.y + 0.8}
                      textAnchor="middle"
                      fontSize="1.3"
                      fontWeight="bold"
                      fill={levelStyle.text}
                    >
                      {school.name}
                    </text>
                    <text
                      x={center.x}
                      y={center.y + 2.4}
                      textAnchor="middle"
                      fontSize="1"
                      fill="#9ca3af"
                    >
                      {school.type} · {school.correspondingProperties.length}个楼盘
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {layers.heatmap && (
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
              {heatmapData.map((point, idx) => {
                const { x, y } = latLngToXY(point.lat, point.lng);
                const size = 8 + (point.value / maxHeatmapValue) * 12;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={size}
                    fill={getHeatmapColor(point.value, maxHeatmapValue)}
                  />
                );
              })}
            </svg>
          )}

          {layers.subway && (
            <>
              {subwayStations.map((station) => {
                const pos = latLngToXY(station.lat, station.lng);
                const radiusKm = station.radius / 1000;
                const degPerKm = 1 / 111;
                const radiusDeg = radiusKm * degPerKm;
                const radiusPxX = (radiusDeg / (mapBounds.maxLng - mapBounds.minLng)) * 100;
                const radiusPxY = (radiusDeg / (mapBounds.maxLat - mapBounds.minLat)) * 100;
                return (
                  <div
                    key={station.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed opacity-40"
                      style={{
                        width: `${radiusPxX * 2}%`,
                        height: `${radiusPxY * 2}%`,
                        borderColor: station.color,
                        backgroundColor: station.color + '08',
                      }}
                    />
                    <div
                      className="w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center relative z-10"
                      style={{ backgroundColor: station.color }}
                    >
                      <Train className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap bg-white px-2 py-1 rounded shadow text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="font-medium">{station.name}</span>
                      <br />
                      <span className="text-gray-400">{station.line} · 辐射{radiusKm.toFixed(1)}km</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

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
                <div className={cn('w-8 h-3 rounded bg-gradient-to-r', mode.getGradientCSS())} />
                <span className="text-xs text-gray-600">{mode.label}</span>
              </div>
            )}
            {layers.subway && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-dashed border-green-500 flex items-center justify-center">
                  <Train className="w-2.5 h-2.5 text-green-500" />
                </div>
                <span className="text-xs text-gray-600">地铁站点辐射圈</span>
              </div>
            )}
            {layers.school && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 border-2 border-dashed border-red-500 rounded bg-red-50" />
                  <span className="text-xs text-gray-600">省重点学区</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 border-2 border-dashed border-blue-500 rounded bg-blue-50" />
                  <span className="text-xs text-gray-600">市重点学区</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 border-2 border-dashed border-purple-500 rounded bg-purple-50" />
                  <span className="text-xs text-gray-600">区重点学区</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
