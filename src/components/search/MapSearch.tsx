import { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { List, Map as MapIcon, Layers, Target, Home, X } from 'lucide-react';
import type { Property } from '@shared/types';
import { formatPrice, formatRooms, formatArea } from '../../utils/format';
import 'leaflet/dist/leaflet.css';

interface MapSearchProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
  onBoundsChange?: (bounds: { southWest: { lat: number; lng: number }; northEast: { lat: number; lng: number } }) => void;
  onCircleSelect?: (center: { lat: number; lng: number }, radius: number) => void;
  loading?: boolean;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

const createCustomIcon = (price: number) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg whitespace-nowrap transform -translate-x-1/2 -translate-y-full">
        ${formatPrice(price)}
        <div class="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const MapEventHandler = ({
  onBoundsChange,
  onCircleSelect,
  circleMode,
  onCircleComplete,
}: {
  onBoundsChange?: (bounds: { southWest: { lat: number; lng: number }; northEast: { lat: number; lng: number } }) => void;
  onCircleSelect?: (center: { lat: number; lng: number }, radius: number) => void;
  circleMode: boolean;
  onCircleComplete: () => void;
}) => {
  const [circleCenter, setCircleCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [circleRadius, setCircleRadius] = useState<number>(1000);
  const [isDrawing, setIsDrawing] = useState(false);

  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const bounds = map.getBounds();
      onBoundsChange?.({
        southWest: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
        northEast: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
      });
    },
    click: (e) => {
      if (circleMode) {
        if (!circleCenter) {
          setCircleCenter({ lat: e.latlng.lat, lng: e.latlng.lng });
          setIsDrawing(true);
        } else if (isDrawing) {
          const distance = e.latlng.distanceTo(circleCenter);
          setCircleRadius(distance);
          onCircleSelect?.(circleCenter, distance);
          setIsDrawing(false);
          onCircleComplete();
        }
      }
    },
    mousemove: (e) => {
      if (circleMode && circleCenter && isDrawing) {
        const distance = e.latlng.distanceTo(circleCenter);
        setCircleRadius(distance);
      }
    },
  });

  if (circleMode && circleCenter) {
    return (
      <Circle
        center={circleCenter}
        radius={circleRadius}
        pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.1 }}
      />
    );
  }

  return null;
};

export const MapSearch = ({
  properties,
  onPropertyClick,
  onBoundsChange,
  onCircleSelect,
  loading = false,
  initialCenter = { lat: 39.9042, lng: 116.4074 },
  initialZoom = 12,
}: MapSearchProps) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [circleMode, setCircleMode] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const handleCircleComplete = useCallback(() => {
    setCircleMode(false);
  }, []);

  const handleResetCircle = () => {
    setCircleMode(false);
  };

  const handleMarkerClick = (property: Property) => {
    onPropertyClick?.(property);
  };

  const handleLocate = () => {
    if (mapRef.current) {
      mapRef.current.locate({ setView: true, maxZoom: 15 });
    }
  };

  const propertyCount = properties.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-blue-600" />
            地图找房
          </h2>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
            共 {propertyCount} 套房源
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              title="列表视图"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              title="地图视图"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCircleMode(!circleMode)}
            className={`p-2 rounded-lg transition-all duration-200 ${circleMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="圈选搜索"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={handleLocate}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
            title="定位到当前位置"
          >
            <Target className="w-4 h-4" />
          </button>

          {circleMode && (
            <button
              onClick={handleResetCircle}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200"
              title="取消圈选"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {circleMode && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-700">
            点击地图设置圆心，再次点击确定半径进行圈选搜索
          </p>
        </div>
      )}

      <div className="relative" style={{ height: '500px' }}>
        {viewMode === 'map' ? (
          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEventHandler
              onBoundsChange={onBoundsChange}
              onCircleSelect={onCircleSelect}
              circleMode={circleMode}
              onCircleComplete={handleCircleComplete}
            />
            {properties.map((property) => (
              <Marker
                key={property.id}
                position={[property.lat, property.lng]}
                icon={createCustomIcon(property.price)}
                eventHandlers={{
                  click: () => handleMarkerClick(property),
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <img
                      src={property.images[0] || 'https://picsum.photos/200/150'}
                      alt={property.title}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                      {property.title}
                    </h4>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-red-600 font-bold">{formatPrice(property.price)}</span>
                      <span className="text-xs text-gray-500">万</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatRooms(property.rooms, property.halls)} · {formatArea(property.area)}
                    </div>
                    <button
                      onClick={() => onPropertyClick?.(property)}
                      className="mt-2 w-full py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                    >
                      查看详情
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="h-full overflow-y-auto p-4">
            {properties.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Home className="w-12 h-12 mb-2 text-gray-300" />
                <p>暂无房源数据</p>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => handleMarkerClick(property)}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={property.images[0] || 'https://picsum.photos/100/80'}
                      alt={property.title}
                      className="w-24 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">
                        {property.title}
                      </h4>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-red-600 font-bold">{formatPrice(property.price)}</span>
                        <span className="text-xs text-gray-500">万</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatRooms(property.rooms, property.halls)} · {formatArea(property.area)} · {property.district}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
};
