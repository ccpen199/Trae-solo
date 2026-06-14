import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, Train, GraduationCap, Layers, Target, X, List, Map as MapIcon, Home, SlidersHorizontal } from 'lucide-react';
import { propertyApi } from '../utils/api';
import { formatPrice, formatRooms, formatArea, formatDistance } from '../utils/format';
import type { Property, MetroSearchParams } from '@shared/types';
import 'leaflet/dist/leaflet.css';

const SHANGHAI_CENTER = { lat: 31.2304, lng: 121.4737 };
const BEIJING_CENTER = { lat: 39.9042, lng: 116.4074 };
const DEFAULT_CENTER = BEIJING_CENTER;

const metroStations = [
  { name: '宣武门', lat: 39.8993, lng: 116.3660 },
  { name: '西直门', lat: 39.9429, lng: 116.3531 },
  { name: '国贸', lat: 39.9085, lng: 116.4594 },
  { name: '望京', lat: 39.9989, lng: 116.4758 },
  { name: '中关村', lat: 39.9825, lng: 116.3144 },
  { name: '五道口', lat: 39.9927, lng: 116.3374 },
  { name: '朝阳门', lat: 39.9245, lng: 116.4273 },
  { name: '复兴门', lat: 39.9083, lng: 116.3566 },
  { name: '公主坟', lat: 39.9067, lng: 116.3100 },
  { name: '陆家嘴', lat: 31.2397, lng: 121.4998 },
  { name: '静安寺', lat: 31.2241, lng: 121.4454 },
  { name: '人民广场', lat: 31.2304, lng: 121.4737 },
];

const schoolOptions = [
  { name: '北京第一实验小学', lat: 39.8950, lng: 116.3700 },
  { name: '中关村第一小学', lat: 39.9830, lng: 116.3150 },
  { name: '史家胡同小学', lat: 39.9200, lng: 116.4180 },
  { name: '人大附中实验小学', lat: 39.9650, lng: 116.3200 },
  { name: '上海实验小学', lat: 31.2250, lng: 121.4800 },
  { name: '明珠小学', lat: 31.2350, lng: 121.5100 },
];

const createMarkerIcon = (price: number) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg whitespace-nowrap transform -translate-x-1/2 -translate-y-full">${formatPrice(price)}<div class="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createStationIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">🚇</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createSchoolIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">🎓</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

interface CircleDrawState {
  center: { lat: number; lng: number } | null;
  radius: number;
  isDrawing: boolean;
}

function MapEventHandler({
  onCircleSelect,
  circleDraw,
  setCircleDraw,
}: {
  onCircleSelect: (center: { lat: number; lng: number }, radius: number) => void;
  circleDraw: CircleDrawState;
  setCircleDraw: React.Dispatch<React.SetStateAction<CircleDrawState>>;
}) {
  useMapEvents({
    click(e) {
      if (!circleDraw.isDrawing) return;
      if (!circleDraw.center) {
        setCircleDraw((prev) => ({ ...prev, center: { lat: e.latlng.lat, lng: e.latlng.lng } }));
      } else {
        const radius = e.latlng.distanceTo(L.latLng(circleDraw.center.lat, circleDraw.center.lng));
        onCircleSelect(circleDraw.center, radius);
        setCircleDraw({ center: null, radius: 0, isDrawing: false });
      }
    },
    mousemove(e) {
      if (circleDraw.isDrawing && circleDraw.center) {
        const radius = e.latlng.distanceTo(L.latLng(circleDraw.center.lat, circleDraw.center.lng));
        setCircleDraw((prev) => ({ ...prev, radius }));
      }
    },
  });

  if (circleDraw.center) {
    return (
      <Circle
        center={[circleDraw.center.lat, circleDraw.center.lng]}
        radius={circleDraw.radius}
        pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.1, weight: 2, dashArray: '5,5' }}
      />
    );
  }
  return null;
}

export default function MapSearchPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState<'circle' | 'metro' | 'school' | null>(null);
  const [circleDraw, setCircleDraw] = useState<CircleDrawState>({ center: null, radius: 0, isDrawing: false });
  const [selectedStation, setSelectedStation] = useState(metroStations[0]);
  const [metroRadius, setMetroRadius] = useState(1500);
  const [selectedSchool, setSelectedSchool] = useState(schoolOptions[0]);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    propertyApi.getPropertyList({}).then((res) => {
      if (res.success && res.data) {
        const list = (res.data as any).list || res.data;
        setProperties(Array.isArray(list) ? list : []);
      }
      setLoading(false);
    });
  }, []);

  const handleCircleSelect = useCallback(async (center: { lat: number; lng: number }, radius: number) => {
    setLoading(true);
    try {
      const res = await propertyApi.searchByMap({
        bounds: {
          southWest: { lat: center.lat - radius / 111000, lng: center.lng - radius / 111000 },
          northEast: { lat: center.lat + radius / 111000, lng: center.lng + radius / 111000 },
        },
        filters: {},
      });
      if (res.success && res.data) {
        setProperties(Array.isArray(res.data) ? res.data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMetroSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propertyApi.searchByMetro({
        stationName: selectedStation.name,
        radius: metroRadius,
        filters: {},
      } as MetroSearchParams);
      if (res.success && res.data) {
        setProperties(Array.isArray(res.data) ? res.data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedStation, metroRadius]);

  const handleSchoolSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propertyApi.getPropertyList({});
      if (res.success && res.data) {
        const list = (res.data as any).list || res.data;
        const all = Array.isArray(list) ? list : [];
        const filtered = all.filter(
          (p: Property) => p.schoolDistrict && p.schoolDistrict.name.includes(selectedSchool.name.slice(0, 4))
        );
        setProperties(filtered.length > 0 ? filtered : all.filter((p: Property) => p.schoolDistrict));
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSchool]);

  const toggleCircleMode = () => {
    if (circleDraw.isDrawing) {
      setCircleDraw({ center: null, radius: 0, isDrawing: false });
    } else {
      setSearchMode('circle');
      setCircleDraw({ center: null, radius: 0, isDrawing: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-blue-600" />
              地图找房
            </h1>

            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => { setSearchMode('metro'); setCircleDraw({ center: null, radius: 0, isDrawing: false }); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  searchMode === 'metro' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
                }`}
              >
                🚇 地铁站搜
              </button>
              <button
                onClick={() => { setSearchMode('school'); setCircleDraw({ center: null, radius: 0, isDrawing: false }); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  searchMode === 'school' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
                }`}
              >
                🎓 学区搜
              </button>
              <button
                onClick={toggleCircleMode}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  circleDraw.isDrawing ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
                }`}
              >
                📍 圈选搜
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-500">
                找到 <span className="font-semibold text-primary-600">{properties.length}</span> 套
              </span>
              <button
                onClick={() => setShowList(!showList)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 flex items-center gap-1"
              >
                {showList ? <MapIcon className="w-4 h-4" /> : <List className="w-4 h-4" />}
                {showList ? '地图' : '列表'}
              </button>
            </div>
          </div>

          {searchMode === 'metro' && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Train className="w-5 h-5 text-green-600 flex-shrink-0" />
              <select
                value={selectedStation.name}
                onChange={(e) => setSelectedStation(metroStations.find((s) => s.name === e.target.value) || metroStations[0])}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                {metroStations.map((s) => <option key={s.name} value={s.name}>{s.name}站</option>)}
              </select>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range" min="500" max="3000" step="100" value={metroRadius}
                  onChange={(e) => setMetroRadius(Number(e.target.value))}
                  className="flex-1 accent-green-600"
                />
                <span className="text-sm text-green-700 font-medium w-16 text-right">{metroRadius}m</span>
              </div>
              <button onClick={handleMetroSearch} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                搜索
              </button>
              <button onClick={() => setSearchMode(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {searchMode === 'school' && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <GraduationCap className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <select
                value={selectedSchool.name}
                onChange={(e) => setSelectedSchool(schoolOptions.find((s) => s.name === e.target.value) || schoolOptions[0])}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none flex-1"
              >
                {schoolOptions.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              <button onClick={handleSchoolSearch} className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600">
                搜索
              </button>
              <button onClick={() => setSearchMode(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {circleDraw.isDrawing && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Layers className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">
                点击地图设置圆心，再次点击确定半径完成圈选
              </span>
              <button onClick={toggleCircleMode} className="ml-auto p-1 text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-4">
          <div className={`flex-1 ${showList ? 'hidden' : ''}`}>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
              <MapContainer
                center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEventHandler
                  onCircleSelect={handleCircleSelect}
                  circleDraw={circleDraw}
                  setCircleDraw={setCircleDraw}
                />
                {properties.map((property) => (
                  <Marker
                    key={property.id}
                    position={[property.lat, property.lng]}
                    icon={createMarkerIcon(property.price)}
                    eventHandlers={{ click: () => navigate(`/property/${property.id}`) }}
                  >
                    <Popup>
                      <div className="min-w-[180px]">
                        <img src={property.images[0]} alt={property.title} className="w-full h-20 object-cover rounded mb-2" />
                        <h4 className="font-semibold text-sm line-clamp-1">{property.title}</h4>
                        <div className="text-red-600 font-bold text-sm">{formatPrice(property.price)}</div>
                        <div className="text-xs text-gray-500">{formatRooms(property.rooms, property.halls)} · {formatArea(property.area)}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {searchMode === 'metro' && selectedStation && (
                  <>
                    <Marker position={[selectedStation.lat, selectedStation.lng]} icon={createStationIcon()}>
                      <Popup><div className="text-sm font-medium">🚇 {selectedStation.name}站</div></Popup>
                    </Marker>
                    <Circle
                      center={[selectedStation.lat, selectedStation.lng]}
                      radius={metroRadius}
                      pathOptions={{ color: '#16A34A', fillColor: '#16A34A', fillOpacity: 0.08, weight: 2 }}
                    />
                  </>
                )}
                {searchMode === 'school' && selectedSchool && (
                  <>
                    <Marker position={[selectedSchool.lat, selectedSchool.lng]} icon={createSchoolIcon()}>
                      <Popup><div className="text-sm font-medium">🎓 {selectedSchool.name}</div></Popup>
                    </Marker>
                    <Circle
                      center={[selectedSchool.lat, selectedSchool.lng]}
                      radius={2000}
                      pathOptions={{ color: '#F97316', fillColor: '#F97316', fillOpacity: 0.08, weight: 2 }}
                    />
                  </>
                )}
              </MapContainer>
            </div>
          </div>

          {showList && (
            <div className="flex-1 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {properties.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <Home className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">暂无房源，请调整搜索条件</p>
                </div>
              ) : properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/property/${property.id}`)}
                  className="flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <img src={property.images[0]} alt={property.title} className="w-28 h-20 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">{property.title}</h4>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-red-600 font-bold">{formatPrice(property.price)}</span>
                      <span className="text-xs text-gray-400">{formatArea(property.area)} · {formatRooms(property.rooms, property.halls)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{property.district}</span>
                      {property.metroInfo && (
                        <span className="text-green-600">🚇 {property.metroInfo.nearestStation} {formatDistance(property.metroInfo.distance)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
