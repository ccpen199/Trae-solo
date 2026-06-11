import React, { useState, useEffect, useRef, useCallback } from 'react';
import { List, Tag, Drawer, Descriptions, Button, Slider, Alert, Spin, Empty, Input } from 'antd';
import {
  EnvironmentOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { trackingApi, type ActiveWaybill } from '../api/tracking';
import { waybillApi } from '../api/waybill';
import type { GpsPoint } from '../../shared/types';
import { formatDateTime } from '../utils/format';

const statusMap: Record<string, { label: string; color: string }> = {
  loading: { label: '装车中', color: 'processing' },
  in_transit: { label: '运输中', color: 'blue' },
  unloading: { label: '卸车中', color: 'cyan' },
};

const MAP_STYLE = 'https://demotiles.maplibre.org/style.json';
const DEFAULT_CENTER: [number, number] = [116.397, 39.908];
const DEFAULT_ZOOM = 5;

const Tracking: React.FC = () => {
  const [activeList, setActiveList] = useState<ActiveWaybill[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState<ActiveWaybill | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trackPoints, setTrackPoints] = useState<GpsPoint[]>([]);
  const [trackLoading, setTrackLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeLayerAdded = useRef(false);

  const fetchActiveList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await trackingApi.getActive();
      setActiveList(res.data);
    } catch {
      setActiveList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveList();
    const interval = setInterval(fetchActiveList, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveList]);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-right');

    map.on('load', () => {
      mapRef.current = map;
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || activeList.length === 0) return;
    const map = mapRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    activeList.forEach((item) => {
      if (item.location) {
        const el = document.createElement('div');
        el.className = 'flex items-center justify-center';
        el.innerHTML = `<div style="width:32px;height:32px;background:#165DFF;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;box-shadow:0 2px 8px rgba(22,93,255,0.4);cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg></div>`;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([item.location.lng, item.location.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div style="padding:8px;"><strong>${item.waybillNo}</strong><br/>${item.cargo.startCity} → ${item.cargo.endCity}<br/>司机：${item.driver.name}</div>`
            )
          )
          .addTo(map);

        markersRef.current.set(item.waybillId, marker);
      }
    });
  }, [activeList]);

  const fetchTrack = useCallback(async (waybillId: string) => {
    setTrackLoading(true);
    try {
      const res = await waybillApi.getTrack(waybillId);
      setTrackPoints(res.data.track);
      return res.data.track;
    } catch {
      setTrackPoints([]);
      return [];
    } finally {
      setTrackLoading(false);
    }
  }, []);

  const handleSelectWaybill = async (item: ActiveWaybill) => {
    setSelectedWaybill(item);
    setDrawerOpen(true);
    setPlaying(false);
    setPlayIndex(0);
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }

    if (item.location && mapRef.current) {
      mapRef.current.flyTo({
        center: [item.location.lng, item.location.lat],
        zoom: 12,
        duration: 1500,
      });
    }

    const track = await fetchTrack(item.waybillId);
    if (track.length > 0 && mapRef.current) {
      const map = mapRef.current;
      if (routeLayerAdded.current) {
        try {
          map.removeLayer('route-line');
          map.removeSource('route-source');
        } catch {}
      }
      const coords = track.map((p) => [p.lng, p.lat] as [number, number]);
      map.addSource('route-source', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
      });
      map.addLayer({
        id: 'route-line', type: 'line', source: 'route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#165DFF', 'line-width': 4, 'line-opacity': 0.8 },
      });
      routeLayerAdded.current = true;
      if (coords.length > 0) {
        const bounds = coords.reduce((b, coord) => b.extend(coord), new maplibregl.LngLatBounds(coords[0], coords[0]));
        map.fitBounds(bounds, { padding: 80, duration: 1000 });
      }
    }
  };

  const handlePlay = () => {
    if (trackPoints.length === 0) return;

    if (playing) {
      setPlaying(false);
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
      return;
    }

    setPlaying(true);
    let idx = playIndex;
    playTimerRef.current = setInterval(() => {
      if (idx >= trackPoints.length - 1) {
        setPlaying(false);
        if (playTimerRef.current) {
          clearInterval(playTimerRef.current);
          playTimerRef.current = null;
        }
        return;
      }
      idx++;
      setPlayIndex(idx);
      const point = trackPoints[idx];
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [point.lng, point.lat],
          zoom: 14,
          duration: 800,
        });
      }
    }, 1500);
  };

  const handleSliderChange = (value: number) => {
    setPlayIndex(value);
    const point = trackPoints[value];
    if (mapRef.current && point) {
      mapRef.current.flyTo({
        center: [point.lng, point.lat],
        zoom: 14,
        duration: 500,
      });
    }
  };

  const checkExceptions = () => {
    const exceptions = activeList.filter(
      (item) => item.status === 'in_transit' && item.location
    );
    if (exceptions.length > 0) {
      setAlertMessage(`当前有 ${exceptions.length} 辆车在途中，请关注运输状态`);
      setAlertVisible(true);
    }
  };

  useEffect(() => {
    if (activeList.length > 0) {
      checkExceptions();
    }
  }, [activeList]);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0">
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              <TruckOutlined className="mr-1" /> 在途运单
            </h3>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={fetchActiveList}
              loading={loading}
            />
          </div>
          <Input.Search placeholder="搜索运单号/司机" allowClear size="small" />
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin">
          <Spin spinning={loading}>
            {activeList.length === 0 ? (
              <Empty description="暂无在途运单" className="mt-10" />
            ) : (
              <List
                dataSource={activeList}
                renderItem={(item) => (
                  <List.Item
                    className={`px-4 py-3 cursor-pointer hover:bg-primary-50 transition-colors border-b border-gray-50 ${
                      selectedWaybill?.waybillId === item.waybillId ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''
                    }`}
                    onClick={() => handleSelectWaybill(item)}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-900">{item.waybillNo}</span>
                        <Tag
                          color={statusMap[item.status]?.color}
                          className="!text-xs !mr-0"
                        >
                          {statusMap[item.status]?.label}
                        </Tag>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        {item.cargo.startCity} → {item.cargo.endCity}
                      </div>
                      <div className="text-xs text-gray-400">
                        司机：{item.driver.name} | {item.vehicle.plateNo}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapContainer} className="w-full h-full" />

        {alertVisible && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <Alert
              message={alertMessage}
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              closable
              onClose={() => setAlertVisible(false)}
              className="shadow-lg"
            />
          </div>
        )}
      </div>

      <Drawer
        title={`运单详情 - ${selectedWaybill?.waybillNo || ''}`}
        placement="right"
        width={420}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setPlaying(false);
          if (playTimerRef.current) {
            clearInterval(playTimerRef.current);
            playTimerRef.current = null;
          }
        }}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<EnvironmentOutlined />}
            onClick={() => {
              if (selectedWaybill?.location && mapRef.current) {
                mapRef.current.flyTo({
                  center: [selectedWaybill.location.lng, selectedWaybill.location.lat],
                  zoom: 14,
                  duration: 1000,
                });
              }
            }}
          >
            定位
          </Button>
        }
      >
        {selectedWaybill && (
          <div className="space-y-4">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="运单号">{selectedWaybill.waybillNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedWaybill.status]?.color}>
                  {statusMap[selectedWaybill.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="货物">{selectedWaybill.cargo.name}</Descriptions.Item>
              <Descriptions.Item label="路线">
                {selectedWaybill.cargo.startCity} → {selectedWaybill.cargo.endCity}
              </Descriptions.Item>
              <Descriptions.Item label="司机">{selectedWaybill.driver.name}</Descriptions.Item>
              <Descriptions.Item label="电话">{selectedWaybill.driver.phone}</Descriptions.Item>
              <Descriptions.Item label="车牌">{selectedWaybill.vehicle.plateNo}</Descriptions.Item>
              <Descriptions.Item label="车型">{selectedWaybill.vehicle.vehicleType}</Descriptions.Item>
              <Descriptions.Item label="发车时间">
                {formatDateTime(selectedWaybill.startTime)}
              </Descriptions.Item>
              {selectedWaybill.location && (
                <Descriptions.Item label="当前位置">
                  {selectedWaybill.location.lat.toFixed(4)}, {selectedWaybill.location.lng.toFixed(4)}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">GPS轨迹回放</h4>
                <Button
                  type="primary"
                  size="small"
                  icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={handlePlay}
                  loading={trackLoading}
                  disabled={trackPoints.length === 0}
                >
                  {playing ? '暂停' : '播放'}
                </Button>
              </div>

              {trackPoints.length > 0 && (
                <div className="space-y-3">
                  <Slider
                    min={0}
                    max={trackPoints.length - 1}
                    value={playIndex}
                    onChange={handleSliderChange}
                    tooltip={{
                      formatter: (val) => {
                        if (val !== undefined && trackPoints[val]) {
                          return formatDateTime(trackPoints[val].timestamp);
                        }
                        return '';
                      },
                    }}
                  />
                  {trackPoints[playIndex] && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <div>时间：{formatDateTime(trackPoints[playIndex].timestamp)}</div>
                      <div>
                        位置：{trackPoints[playIndex].lat.toFixed(6)},{' '}
                        {trackPoints[playIndex].lng.toFixed(6)}
                      </div>
                      <div>速度：{trackPoints[playIndex].speed} km/h</div>
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    共 {trackPoints.length} 个轨迹点，当前第 {playIndex + 1} 个
                  </div>
                </div>
              )}

              {!trackLoading && trackPoints.length === 0 && (
                <Empty description="暂无轨迹数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Tracking;
