import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { deviceApi } from '@/lib/api.ts';
import { formatDistance } from '@/utils/format.ts';
import { MapPin, Droplets, Wifi, WifiOff, AlertTriangle, Nfc, Bluetooth, QrCode, Navigation, Users, RefreshCw } from 'lucide-react';
import type { DeviceWithDistance, ConnectionType, DeviceStatus } from '../../../shared/types.js';

export default function StudentDevices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<DeviceWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DeviceStatus | 'all'>('all');
  const [center] = useState({ lat: 39.9087, lng: 116.3975 });

  const loadDevices = async () => {
    setLoading(true);
    try {
      const result = await deviceApi.nearby(center.lat, center.lng, 1000);
      setDevices(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const filteredDevices = devices.filter((d) => filter === 'all' || d.status === filter);

  const getStatusStyle = (status: DeviceStatus) => {
    switch (status) {
      case 'online': return { bg: 'bg-green-100', text: 'text-green-700', label: '在线', dot: 'bg-green-500' };
      case 'fault': return { bg: 'bg-vibrant-orange-100', text: 'text-vibrant-orange-700', label: '故障', dot: 'bg-vibrant-orange-500' };
      case 'offline': return { bg: 'bg-graphite-200', text: 'text-graphite-500', label: '离线', dot: 'bg-graphite-400' };
    }
  };

  const renderConnectionIcon = (type: ConnectionType) => {
    switch (type) {
      case 'nfc': return <Nfc size={14} />;
      case 'bluetooth': return <Bluetooth size={14} />;
      case 'qr': return <QrCode size={14} />;
    }
  };

  const renderConnectionLabel = (type: ConnectionType) => {
    switch (type) {
      case 'nfc': return 'NFC';
      case 'bluetooth': return '蓝牙';
      case 'qr': return '二维码';
    }
  };

  return (
    <AppLayout role="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-graphite-800 mb-1">附近热水设备</h2>
          <p className="text-sm text-graphite-500 flex items-center gap-1">
            <Navigation size={14} />
            基于您当前位置，展示 500米 范围内的可用热水点
          </p>
        </div>

        <div className="glass-card p-2 relative overflow-hidden h-64 md:h-80">
          <div className="absolute inset-0 bg-gradient-to-br from-deep-blue-50 via-aqua-50 to-transparent">
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: `
                linear-gradient(rgba(11, 61, 145, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(11, 61, 145, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
            }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-vibrant-orange-500 border-3 border-white shadow-lg z-10 relative" />
              <div className="absolute inset-0 rounded-full bg-vibrant-orange-400/40 animate-ripple" />
              <div className="absolute inset-0 rounded-full bg-vibrant-orange-400/30 animate-ripple" style={{ animationDelay: '0.5s' }} />
            </div>
            {filteredDevices.map((device, idx) => {
              const angle = (idx / Math.max(filteredDevices.length, 1)) * Math.PI * 2;
              const radius = 80 + (device.distance / 1000) * 40;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const style = getStatusStyle(device.status);
              return (
                <div
                  key={device.id}
                  className="absolute flex flex-col items-center cursor-pointer group"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                  onClick={() => device.status === 'online' && navigate(`/student/watering/${device.id}`)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 ${
                    device.status === 'online' ? 'bg-gradient-to-br from-aqua-500 to-deep-blue-600' : 'bg-graphite-400'
                  }`}>
                    <Droplets size={18} className="text-white" />
                  </div>
                  <div className={`mt-1 px-2 py-0.5 rounded text-xs whitespace-nowrap ${style.bg} ${style.text} font-medium`}>
                    {device.distance}m
                  </div>
                </div>
              );
            })}
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm text-xs text-graphite-600 shadow-sm">
            <MapPin size={14} className="text-vibrant-orange-500" />
            已定位 · 显示 {filteredDevices.length} 个设备
          </div>
          <button
            onClick={loadDevices}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-deep-blue-700 hover:bg-white shadow-sm transition-all hover:rotate-180 duration-500"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'online', 'fault', 'offline'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-deep-blue-700 to-aqua-500 text-white shadow-md'
                  : 'bg-white text-graphite-600 hover:bg-graphite-100 border border-graphite-200'
              }`}
            >
              {f === 'all' ? '全部' : f === 'online' ? '在线' : f === 'fault' ? '故障' : '离线'}
              <span className="ml-1.5 text-xs opacity-75">
                ({f === 'all' ? devices.length : devices.filter((d) => d.status === f).length})
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="glass-card p-8 text-center text-graphite-500">加载中...</div>
          ) : filteredDevices.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <WifiOff size={40} className="mx-auto mb-3 text-graphite-300" />
              <p className="text-graphite-500">暂无符合条件的设备</p>
            </div>
          ) : (
            filteredDevices.map((device) => {
              const style = getStatusStyle(device.status);
              return (
                <button
                  key={device.id}
                  disabled={device.status !== 'online'}
                  onClick={() => navigate(`/student/watering/${device.id}`)}
                  className={`glass-card w-full p-4 text-left transition-all group ${
                    device.status === 'online'
                      ? 'hover:shadow-xl hover:border-aqua-300 hover:-translate-y-0.5 cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-graphite-800 text-lg group-hover:text-deep-blue-800">{device.name}</h3>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${device.status === 'online' ? 'animate-pulse' : ''}`} />
                          {style.label}
                        </span>
                      </div>
                      <p className="text-sm text-graphite-500 flex items-center gap-1">
                        <MapPin size={14} />
                        {device.location}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-display font-bold text-gradient-aqua">
                        {formatDistance(device.distance)}
                      </div>
                      <div className="text-xs text-graphite-400 mt-0.5">步行约{Math.ceil(device.distance / 80)}分钟</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-graphite-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        {device.connectionTypes.map((t) => (
                          <span
                            key={t}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-deep-blue-50 text-deep-blue-700 text-xs font-medium"
                          >
                            {renderConnectionIcon(t)}
                            {renderConnectionLabel(t)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {device.queueCount > 0 && (
                        <div className="flex items-center gap-1 text-vibrant-orange-600 font-medium">
                          <Users size={16} />
                          排队 {device.queueCount} 人
                        </div>
                      )}
                      {device.status === 'fault' && (
                        <div className="flex items-center gap-1 text-vibrant-orange-600">
                          <AlertTriangle size={16} />
                          维护中
                        </div>
                      )}
                      {device.status === 'online' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Wifi size={16} />
                          信号良好
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
