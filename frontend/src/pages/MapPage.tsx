import { useEffect, useState, useRef } from 'react';
import { stationApi } from '../api';
import { ChargingStation } from '../types';

const MapPage = () => {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCities();
    loadStations();
  }, []);

  useEffect(() => {
    loadStations();
  }, [selectedCity]);

  const loadCities = async () => {
    try {
      const data = await stationApi.getCities();
      setCities(data);
    } catch (err) {
      console.error('Failed to load cities:', err);
    }
  };

  const loadStations = async () => {
    try {
      const data = await stationApi.getAllStations(selectedCity || undefined);
      setStations(data);
    } catch (err) {
      console.error('Failed to load stations:', err);
    }
  };

  const getMarkerColor = (station: ChargingStation) => {
    if (station.total_piles === 0) return '#999';
    const occupancy = 1 - station.available_piles / station.total_piles;
    if (occupancy >= 0.8) return '#ff4d4f';
    if (occupancy >= 0.5) return '#faad14';
    return '#52c41a';
  };

  const getMarkerSize = (station: ChargingStation) => {
    const baseSize = 12;
    const scale = Math.min(station.total_piles / 10, 2);
    return baseSize + scale * 6;
  };

  const handleStationClick = (station: ChargingStation, event: React.MouseEvent) => {
    setSelectedStation(station);
    const rect = mapRef.current?.getBoundingClientRect();
    if (rect) {
      setPopupPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  const stationPositions = stations.map(station => {
    const latMin = 22;
    const latMax = 40;
    const lngMin = 104;
    const lngMax = 122;

    const x = ((station.longitude - lngMin) / (lngMax - lngMin)) * 100;
    const y = ((latMax - station.latitude) / (latMax - latMin)) * 100;

    return { station, x, y };
  });

  const stats = {
    totalStations: stations.length,
    totalPiles: stations.reduce((sum, s) => sum + s.total_piles, 0),
    availablePiles: stations.reduce((sum, s) => sum + s.available_piles, 0),
    avgRating: stations.length > 0
      ? (stations.reduce((sum, s) => sum + s.rating, 0) / stations.length).toFixed(1)
      : '0.0',
  };

  return (
    <div>
      <h1 className="page-title">充电地图</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-title">充电站总数</div>
          <div className="stat-card-value">{stats.totalStations}</div>
          <div className="stat-card-trend trend-up">覆盖 {cities.length} 个城市</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">充电桩总数</div>
          <div className="stat-card-value">{stats.totalPiles}</div>
          <div className="stat-card-trend">个终端</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">空闲桩数</div>
          <div className="stat-card-value" style={{ color: '#52c41a' }}>{stats.availablePiles}</div>
          <div className="stat-card-trend">
            占用率 {stats.totalPiles > 0
              ? ((1 - stats.availablePiles / stats.totalPiles) * 100).toFixed(1)
              : '0'}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">平均评分</div>
          <div className="stat-card-value" style={{ color: '#faad14' }}>★ {stats.avgRating}</div>
          <div className="stat-card-trend">用户满意度</div>
        </div>
      </div>

      <div className="sidebar-layout">
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">城市筛选</div>
            <div className="city-selector">
              <div
                className={`city-chip ${!selectedCity ? 'active' : ''}`}
                onClick={() => setSelectedCity('')}
              >
                全部
              </div>
              {cities.map(city => (
                <div
                  key={city}
                  className={`city-chip ${selectedCity === city ? 'active' : ''}`}
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">实时状态</div>
            <div style={{ fontSize: 13, color: '#666' }}>
              最后更新：{new Date().toLocaleTimeString()}
            </div>
            <button
              className="btn btn-outline"
              style={{ marginTop: 12, width: '100%' }}
              onClick={loadStations}
            >
              刷新数据
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">图例说明</div>
            <div className="map-legend-item">
              <div className="legend-dot" style={{ background: '#52c41a' }}></div>
              <span>空闲充足（占用率 &lt; 50%）</span>
            </div>
            <div className="map-legend-item">
              <div className="legend-dot" style={{ background: '#faad14' }}></div>
              <span>较为繁忙（占用率 50-80%）</span>
            </div>
            <div className="map-legend-item">
              <div className="legend-dot" style={{ background: '#ff4d4f' }}></div>
              <span>高度紧张（占用率 &gt; 80%）</span>
            </div>
            <div className="map-legend-item">
              <div className="legend-dot" style={{ background: '#999' }}></div>
              <span>离线/不可用</span>
            </div>
          </div>
        </div>

        <div className="content-area">
          <div className="card">
            <div className="map-container" ref={mapRef} onClick={() => setSelectedStation(null)}>
              <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="mapBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e8f4f8" />
                    <stop offset="100%" stopColor="#d4e8ed" />
                  </linearGradient>
                </defs>
                <rect width="100" height="100" fill="url(#mapBg)" />

                {[...Array(10)].map((_, i) => (
                  <line
                    key={`h-${i}`}
                    x1="0"
                    y1={i * 10}
                    x2="100"
                    y2={i * 10}
                    stroke="#c8dde3"
                    strokeWidth="0.1"
                    strokeDasharray="1 1"
                  />
                ))}
                {[...Array(10)].map((_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={i * 10}
                    y1="0"
                    x2={i * 10}
                    y2="100"
                    stroke="#c8dde3"
                    strokeWidth="0.1"
                    strokeDasharray="1 1"
                  />
                ))}

                {stationPositions.map(({ station, x, y }) => {
                  const size = getMarkerSize(station);
                  const color = getMarkerColor(station);
                  return (
                    <g
                      key={station.id}
                      className="station-marker"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStationClick(station, e as any);
                      }}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={size / 2 + 1}
                        fill={color}
                        opacity="0.3"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={size / 2}
                        fill={color}
                        stroke="white"
                        strokeWidth="0.5"
                      />
                      <text
                        x={x}
                        y={y + 1}
                        textAnchor="middle"
                        fill="white"
                        fontSize="3"
                        fontWeight="bold"
                      >
                        {station.available_piles}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {selectedStation && (
                <div
                  className="station-popup"
                  style={{
                    left: Math.min(popupPosition.x, 500),
                    top: popupPosition.y,
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <h4>{selectedStation.name}</h4>
                  <div className="station-popup-info">📍 {selectedStation.address}</div>
                  <div className="station-popup-info">
                    🏙️ {selectedStation.city}
                  </div>
                  <div className="station-popup-info">
                    <span className="status-badge status-available">
                      空闲 {selectedStation.available_piles}/{selectedStation.total_piles}
                    </span>
                  </div>
                  <div className="station-popup-info">
                    <span className="rating">★ {selectedStation.rating.toFixed(1)}</span>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      ({selectedStation.review_count}条评价)
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => {
                        window.location.href = `/charging?stationId=${selectedStation.id}`;
                      }}
                    >
                      立即充电
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
