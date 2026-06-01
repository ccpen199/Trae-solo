import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Search, Navigation, Eye, ShieldCheck, Train, GraduationCap,
  XCircle, RotateCcw, ChevronRight, SlidersHorizontal, Layers, Map
} from 'lucide-react';
import { api } from '@/lib/api';

const METRO_LINES = [
  { id: 'line1', name: '1号线', color: '#e4002b', stations: [
    { name: '国贸', lat: 39.9085, lng: 116.4594 },
    { name: '大望路', lat: 39.9089, lng: 116.4744 },
    { name: '四惠', lat: 39.9084, lng: 116.4942 },
    { name: '王府井', lat: 39.9137, lng: 116.4104 },
    { name: '西单', lat: 39.9088, lng: 116.3740 },
  ]},
  { id: 'line2', name: '2号线', color: '#006098', stations: [
    { name: '朝阳门', lat: 39.9243, lng: 116.4220 },
    { name: '建国门', lat: 39.9075, lng: 116.4270 },
    { name: '东直门', lat: 39.9415, lng: 116.4330 },
    { name: '西直门', lat: 39.9415, lng: 116.3530 },
  ]},
  { id: 'line10', name: '10号线', color: '#009bc0', stations: [
    { name: '三元桥', lat: 39.9600, lng: 116.4530 },
    { name: '太阳宫', lat: 39.9670, lng: 116.4410 },
    { name: '惠新西街南口', lat: 39.9780, lng: 116.4190 },
    { name: '芍药居', lat: 39.9710, lng: 116.4300 },
  ]},
];

const SCHOOL_DISTRICTS = [
  { name: '朝阳实验小学学区', lat: 39.9210, lng: 116.4430, radius: 25, color: 'rgba(59,130,246,0.12)' },
  { name: '府学胡同小学学区', lat: 39.9340, lng: 116.4010, radius: 20, color: 'rgba(147,51,234,0.12)' },
  { name: '中关村三小学区', lat: 39.9600, lng: 116.3200, radius: 22, color: 'rgba(16,185,129,0.12)' },
];

const MapSVG: React.FC<{
  properties: any[];
  selectedProperty: any;
  onSelectProperty: (p: any) => void;
  showSchoolDistricts: boolean;
  selectedMetroLine: string;
  selectedStation: { name: string; lat: number; lng: number } | null;
  onStationClick: (station: { name: string; lat: number; lng: number }) => void;
}> = ({ properties, selectedProperty, onSelectProperty, showSchoolDistricts, selectedMetroLine, selectedStation, onStationClick }) => {
  const vw = 800, vh = 500;
  const gridSpacing = 50;

  const filteredStations = selectedMetroLine === 'all'
    ? METRO_LINES.flatMap(l => l.stations.map(s => ({ ...s, lineColor: l.color, lineName: l.name })))
    : METRO_LINES.filter(l => l.id === selectedMetroLine).flatMap(l => l.stations.map(s => ({ ...s, lineColor: l.color, lineName: l.name })));

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = { new_house: '#22c55e', second_hand: '#3b82f6', rental: '#a855f7', commercial: '#f97316' };
    return colors[type] || '#6b7280';
  };

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-full">
      <defs>
        <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
        <filter id="shadow3d">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#00000020" />
        </filter>
        <radialGradient id="stationGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={vw} height={vh} fill="url(#mapBg)" />

      {Array.from({ length: Math.ceil(vw / gridSpacing) + 1 }, (_, i) => (
        <line key={`vg${i}`} x1={i * gridSpacing} y1={0} x2={i * gridSpacing} y2={vh} stroke="#bfdbfe" strokeWidth="0.5" strokeOpacity="0.5" />
      ))}
      {Array.from({ length: Math.ceil(vh / gridSpacing) + 1 }, (_, i) => (
        <line key={`hg${i}`} x1={0} y1={i * gridSpacing} x2={vw} y2={i * gridSpacing} stroke="#bfdbfe" strokeWidth="0.5" strokeOpacity="0.5" />
      ))}

      {[
        { x: 120, y: 100, w: 180, h: 120, color: '#e0e7ff', label: '朝阳区' },
        { x: 380, y: 80, w: 160, h: 140, color: '#dbeafe', label: '东城区' },
        { x: 560, y: 180, w: 180, h: 130, color: '#d1fae5', label: '海淀区' },
        { x: 80, y: 300, w: 200, h: 140, color: '#fef3c7', label: '丰台区' },
        { x: 350, y: 280, w: 180, h: 160, color: '#fce7f3', label: '西城区' },
      ].map((zone, i) => (
        <g key={`zone${i}`} filter="url(#shadow3d)">
          <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="8" fill={zone.color} stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 2" />
          <text x={zone.x + zone.w / 2} y={zone.y + 20} textAnchor="middle" className="text-[11px]" fill="#64748b" fontWeight="500">{zone.label}</text>
        </g>
      ))}

      {showSchoolDistricts && SCHOOL_DISTRICTS.map((sd, i) => {
        const cx = 150 + (sd.lng - 116.30) * 3500;
        const cy = 150 + (39.99 - sd.lat) * 3500;
        return (
          <g key={`school${i}`}>
            <circle cx={cx} cy={cy} r={sd.radius * 3} fill={sd.color} stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.5" />
            <text x={cx} y={cy - sd.radius * 3 - 4} textAnchor="middle" className="text-[9px]" fill="#1d4ed8" fontWeight="500">{sd.name}</text>
          </g>
        );
      })}

      {selectedMetroLine !== 'all' && (() => {
        const line = METRO_LINES.find(l => l.id === selectedMetroLine);
        if (!line || line.stations.length < 2) return null;
        const pts = line.stations.map(s => {
          const x = 150 + (s.lng - 116.30) * 3500;
          const y = 150 + (39.99 - s.lat) * 3500;
          return `${x},${y}`;
        });
        return <polyline points={pts.join(' ')} fill="none" stroke={line.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />;
      })()}

      {filteredStations.map((station, i) => {
        const cx = 150 + (station.lng - 116.30) * 3500;
        const cy = 150 + (39.99 - station.lat) * 3500;
        const isSelected = selectedStation?.name === station.name;
        return (
          <g key={`station${i}`} className="cursor-pointer" onClick={() => onStationClick(station)}>
            <circle cx={cx} cy={cy} r={isSelected ? 14 : 8} fill="white" stroke={station.lineColor} strokeWidth={isSelected ? 3 : 2} />
            <circle cx={cx} cy={cy} r={4} fill={station.lineColor} />
            <text x={cx} y={cy + (isSelected ? 22 : 16)} textAnchor="middle" className="text-[9px]" fill="#374151" fontWeight="500">{station.name}</text>
            {isSelected && <circle cx={cx} cy={cy} r="20" fill="none" stroke={station.lineColor} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" />}
          </g>
        );
      })}

      {properties.slice(0, 15).map((p) => {
        const lat = p.latitude || 39.91 + Math.random() * 0.08;
        const lng = p.longitude || 116.38 + Math.random() * 0.12;
        const cx = 150 + (lng - 116.30) * 3500;
        const cy = 150 + (39.99 - lat) * 3500;
        const isSelected = selectedProperty?.id === p.id;
        return (
          <g key={`prop${p.id}`} className="cursor-pointer" onClick={() => onSelectProperty(p)}>
            <circle cx={cx} cy={cy} r={isSelected ? 14 : 10} fill={getTypeColor(p.type)} stroke="#fff" strokeWidth="2" filter="url(#shadow3d)" />
            <text x={cx} y={cy + 4} textAnchor="middle" className="text-[8px]" fill="white" fontWeight="700">¥</text>
            {p.vr_url && <circle cx={cx + 8} cy={cy - 8} r="4" fill="#a855f7" stroke="#fff" strokeWidth="1" />}
            {isSelected && <circle cx={cx} cy={cy} r="18" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 2" />}
          </g>
        );
      })}

      {selectedStation && (() => {
        const cx = 150 + (selectedStation.lng - 116.30) * 3500;
        const cy = 150 + (39.99 - selectedStation.lat) * 3500;
        return <circle cx={cx} cy={cy} r="40" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.5" />;
      })()}
    </svg>
  );
};

const MapSearch: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    type: 'all',
    radius: 2000,
    city: '北京',
    lat: 39.9042,
    lng: 116.4074,
  });
  const [selectedMetroLine, setSelectedMetroLine] = useState('all');
  const [selectedStation, setSelectedStation] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [showSchoolDistricts, setShowSchoolDistricts] = useState(false);
  const [showVRModal, setShowVRModal] = useState(false);
  const [vrProperty, setVrProperty] = useState<any>(null);

  useEffect(() => {
    loadMapProperties();
  }, [searchParams]);

  const loadMapProperties = async () => {
    setLoading(true);
    const params: Record<string, any> = {
      lat: searchParams.lat,
      lng: searchParams.lng,
      radius: searchParams.radius,
      city: searchParams.city,
    };
    if (searchParams.type !== 'all') params.type = searchParams.type;

    const response = await api.properties.mapSearch(params);
    if (response.success && response.data) {
      setProperties(response.data as any);
    }
    setLoading(false);
  };

  const handleStationClick = (station: { name: string; lat: number; lng: number }) => {
    setSelectedStation(station);
    setSearchParams(prev => ({ ...prev, lat: station.lat, lng: station.lng }));
  };

  const handleVRClick = (property: any) => {
    setVrProperty(property);
    setShowVRModal(true);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { new_house: '新房', second_hand: '二手房', rental: '租赁', commercial: '商业地产' };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = { new_house: 'bg-green-500', second_hand: 'bg-blue-500', rental: 'bg-purple-500', commercial: 'bg-orange-500' };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Navigation className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">地图找房</h1>
          <p className="text-gray-500">支持地铁站点半径筛选、学区划片叠加、VR售楼处</p>
        </div>
      </div>

      {/* 搜索筛选面板 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">房源类型</label>
            <select value={searchParams.type} onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">全部</option>
              <option value="new_house">新房</option>
              <option value="second_hand">二手房</option>
              <option value="rental">租赁</option>
              <option value="commercial">商业地产</option>
            </select>
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <select value={searchParams.city} onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="北京">北京</option>
              <option value="上海">上海</option>
              <option value="广州">广州</option>
              <option value="深圳">深圳</option>
            </select>
          </div>
          <button onClick={loadMapProperties} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Search size={18} className="mr-2" />搜索
          </button>
        </div>
      </div>

      {/* 地铁线路 + 半径 + 学区控制面板 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Train size={14} /> 地铁线路
            </label>
            <div className="flex gap-2">
              <button onClick={() => { setSelectedMetroLine('all'); setSelectedStation(null); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedMetroLine === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                全部
              </button>
              {METRO_LINES.map(line => (
                <button key={line.id} onClick={() => { setSelectedMetroLine(line.id); setSelectedStation(null); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${selectedMetroLine === line.id ? 'text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  style={selectedMetroLine === line.id ? { backgroundColor: line.color } : {}}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                  {line.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <SlidersHorizontal size={14} /> 搜索半径：{(searchParams.radius / 1000).toFixed(1)}km
            </label>
            <input type="range" min={500} max={5000} step={100} value={searchParams.radius}
              onChange={(e) => setSearchParams(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>500m</span><span>5km</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <GraduationCap size={14} /> 学区叠加
            </label>
            <button onClick={() => setShowSchoolDistricts(!showSchoolDistricts)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${showSchoolDistricts ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <Layers size={14} /> {showSchoolDistricts ? '已开启' : '已关闭'}
            </button>
          </div>
        </div>

        {selectedStation && (
          <div className="mt-4 px-4 py-2 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700 flex items-center gap-2">
              <MapPin size={14} /> 当前中心：<strong>{selectedStation.name}</strong>站 · 半径{(searchParams.radius / 1000).toFixed(1)}km
            </span>
            <button onClick={() => setSelectedStation(null)} className="text-blue-500 hover:text-blue-700 text-sm">清除</button>
          </div>
        )}
      </div>

      {/* 地图 + 房源列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="relative h-[500px]">
            <MapSVG
              properties={properties}
              selectedProperty={selectedProperty}
              onSelectProperty={setSelectedProperty}
              showSchoolDistricts={showSchoolDistricts}
              selectedMetroLine={selectedMetroLine}
              selectedStation={selectedStation}
              onStationClick={handleStationClick}
            />
          </div>

          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>当前搜索范围内共 <strong>{properties.length}</strong> 套房源</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>新房</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>二手房</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-purple-500 rounded-full mr-1"></span>租赁</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-orange-500 rounded-full mr-1"></span>商业</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-purple-700 rounded-full mr-1"></span>VR</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* 房源列表增强 */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Map size={16} /> 房源列表
            </h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : properties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无房源</div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    to={`/properties/${property.id}`}
                    className={`block p-3 rounded-lg border-2 transition-colors ${
                      selectedProperty?.id === property.id
                        ? `border-blue-500 bg-blue-50`
                        : `border-transparent hover:bg-gray-50`
                    }`}
                    onMouseEnter={() => setSelectedProperty(property)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 relative">
                        <img
                          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=apartment%20thumbnail&image_size=square"
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {property.vr_url && (
                          <button onClick={(e) => { e.preventDefault(); handleVRClick(property); }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                            <Eye size={10} className="text-white" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${getTypeColor(property.type)}`}>
                            {getTypeLabel(property.type)}
                          </span>
                          {property.verify_status === 'approved' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-700 flex items-center gap-0.5">
                              <ShieldCheck size={8} /> 核验
                            </span>
                          )}
                          {property.vr_url && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700">VR</span>
                          )}
                          {property.metro_station && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 flex items-center gap-0.5">
                              <Train size={8} /> {property.metro_station}
                            </span>
                          )}
                          {property.school_district && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-600 flex items-center gap-0.5">
                              <GraduationCap size={8} /> 学区
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{property.title}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-red-600 font-semibold text-sm">
                            ¥{property.price}{property.type === 'rental' ? '/月' : '万'}
                          </span>
                          <span className="text-xs text-gray-500">{property.area}㎡</span>
                        </div>
                        {property.distance != null && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            距离 {(property.distance * 1000).toFixed(0)}米
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 选中房源详情 */}
          {selectedProperty && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">房源详情</h3>
              <Link to={`/properties/${selectedProperty.id}`} className="block">
                <div className="relative h-32 bg-gray-200 rounded-lg mb-3">
                  <img
                    src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=apartment%20building%20exterior&image_size=landscape_4_3"
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {selectedProperty.vr_url && (
                    <button onClick={(e) => { e.preventDefault(); handleVRClick(selectedProperty); }}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-purple-600 text-white rounded text-xs flex items-center gap-1 hover:bg-purple-700">
                      <Eye size={12} /> VR看房
                    </button>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 mb-2">{selectedProperty.title}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                  <div>{selectedProperty.bedrooms}室{selectedProperty.bathrooms}卫</div>
                  <div>{selectedProperty.area}㎡</div>
                  <div>{selectedProperty.orientation}</div>
                  <div>{selectedProperty.floor}层</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-red-600">
                    ¥{selectedProperty.price}{selectedProperty.type === 'rental' ? '/月' : '万'}
                  </span>
                  <span className="text-blue-600 hover:text-blue-700 flex items-center text-sm">
                    查看详情 <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* VR播放器模态框 */}
      {showVRModal && vrProperty && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl w-full max-w-4xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-800">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Eye size={18} /> VR全景看房 — {vrProperty.title}
              </h3>
              <button onClick={() => setShowVRModal(false)} className="text-gray-400 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            <div className="relative h-96 bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
              <div className="text-center">
                <RotateCcw size={48} className="mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 text-lg">VR全景播放器</p>
                <p className="text-gray-500 text-sm mt-2">拖动旋转 · 滚轮缩放 · 点击热点</p>
                <p className="text-gray-600 text-xs mt-4">房源：{vrProperty.title}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-800">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2">
                <Eye size={14} /> 全屏模式
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 flex items-center gap-2">
                <RotateCcw size={14} /> 重置视角
              </button>
              <Link to={`/properties/${vrProperty.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
                查看详情 <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSearch;
