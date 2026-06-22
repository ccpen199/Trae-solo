import { useState, useEffect } from 'react';
import { Card, Switch, Radio, Button, message, Tag } from 'antd';
import {
  EnvironmentOutlined,
  PlayCircleOutlined,
  StopOutlined,
  WifiOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  CompassOutlined,
  SyncOutlined,
  EnvironmentFilled,
  RiseOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';

type ReportFrequency = '5s' | '10s' | '30s';

const formatTime = (date: Date) => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(
    date.getSeconds()
  ).padStart(2, '0')}`;
};

const TrackingPage: React.FC = () => {
  const [tracking, setTracking] = useState(false);
  const [frequency, setFrequency] = useState<ReportFrequency>('10s');
  const [wifiOnly, setWifiOnly] = useState(false);
  const [powerSave, setPowerSave] = useState(false);
  const [updateTime, setUpdateTime] = useState<Date | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [location] = useState({
    latitude: 39.908823,
    longitude: 116.39747,
    accuracy: 10,
    speed: 12.5,
    heading: 135,
  });

  useEffect(() => {
    if (!tracking) return;

    const intervalMs =
      frequency === '5s' ? 5000 : frequency === '10s' ? 10000 : 30000;
    const actualInterval = powerSave ? intervalMs * 2 : intervalMs;

    const timer = setInterval(() => {
      setUpdateTime(new Date());
    }, actualInterval);

    return () => clearInterval(timer);
  }, [tracking, frequency, powerSave]);

  const handleStart = async () => {
    setTrackingLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setTracking(true);
    setUpdateTime(new Date());
    setTrackingLoading(false);
    message.success('定位服务已开启');
  };

  const handleStop = async () => {
    setTrackingLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setTracking(false);
    setTrackingLoading(false);
    message.success('定位服务已停止');
  };

  const directionLabels = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const directionIndex = Math.round(((location.heading % 360) / 45)) % 8;

  return (
    <div className="page-container pb-20">
      <PageHeader title="实时定位" />

      <div className="px-4 pt-3 space-y-4">
        <div className="relative bg-gray-200 rounded-xl overflow-hidden" style={{ height: 280 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
            <svg className="w-full h-full opacity-20">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#9CA3AF" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-green-100/50 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-green-200/60 flex items-center justify-center">
                <EnvironmentFilled className="text-green-500 text-2xl animate-pulse" />
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1 shadow-lg shadow-green-500/50" />
          </div>

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 280" preserveAspectRatio="none">
            <defs>
              <marker id="arrowStart" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <circle cx="4" cy="4" r="4" fill="#3B82F6" />
              </marker>
              <marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#EF4444" />
              </marker>
            </defs>
            <path
              d="M 80 60 Q 150 100 180 140 T 320 220"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="3"
              strokeDasharray="8,6"
              markerStart="url(#arrowStart)"
              markerEnd="url(#arrowEnd)"
            />
          </svg>

          <div className="absolute left-12 top-14 bg-white rounded-lg shadow-md px-2 py-1">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">起点</span>
            </div>
          </div>

          <div className="absolute right-10 bottom-16 bg-white rounded-lg shadow-md px-2 py-1">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">终点</span>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EnvironmentOutlined className="text-blue-500" />
                <span className="text-sm font-medium">接入高德/百度地图SDK后展示</span>
              </div>
              {tracking && (
                <Tag color="green" icon={<SyncOutlined spin />} className="m-0">
                  定位中
                </Tag>
              )}
            </div>
          </div>
        </div>

        <Card size="small" title="当前位置信息" className="shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <EnvironmentOutlined />
                纬度
              </div>
              <p className="text-sm font-mono font-medium text-gray-800">
                {location.latitude.toFixed(6)}°
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <EnvironmentOutlined />
                经度
              </div>
              <p className="text-sm font-mono font-medium text-gray-800">
                {location.longitude.toFixed(6)}°
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <DashboardOutlined />
                精度
              </div>
              <p className="text-sm font-medium text-gray-800">±{location.accuracy}米</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <RiseOutlined />
                速度
              </div>
              <p className="text-sm font-medium text-gray-800">{location.speed} m/s</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <CompassOutlined />
                方向
              </div>
              <p className="text-sm font-medium text-gray-800">
                {directionLabels[directionIndex]} {location.heading}°
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <ClockCircleOutlined />
                更新时间
              </div>
              <p className="text-sm font-medium text-gray-800">
                {updateTime ? formatTime(updateTime) : '--:--:--'}
              </p>
            </div>
          </div>
        </Card>

        <Card size="small" title="轨迹上报设置" className="shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">上报频率</p>
              <Radio.Group
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full"
              >
                <div className="grid grid-cols-3 gap-2">
                  <Radio.Button value="5s" className="text-center">
                    5秒
                  </Radio.Button>
                  <Radio.Button value="10s" className="text-center">
                    10秒
                  </Radio.Button>
                  <Radio.Button value="30s" className="text-center">
                    30秒
                  </Radio.Button>
                </div>
              </Radio.Group>
              <p className="text-xs text-gray-400 mt-2">
                频率越高定位越精确，但电量消耗更快
              </p>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <WifiOutlined className="text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">仅WiFi上报</p>
                  <p className="text-xs text-gray-400">移动数据网络下暂停上报</p>
                </div>
              </div>
              <Switch size="small" checked={wifiOnly} onChange={setWifiOnly} />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <ThunderboltOutlined className="text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">省电模式</p>
                  <p className="text-xs text-gray-400">降低上报频率，延长续航</p>
                </div>
              </div>
              <Switch size="small" checked={powerSave} onChange={setPowerSave} />
            </div>
          </div>
        </Card>

        <Card size="small" title="进行中订单轨迹" className="shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div className="w-0.5 h-10 bg-gray-300 my-1" />
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-xs text-gray-400">取货点</p>
                <p className="text-sm font-medium text-gray-800">朝阳区建国路88号SOHO现代城A座</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">送货点</p>
                <p className="text-sm font-medium text-gray-800">海淀区中关村大街1号海龙大厦15层</p>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">预计距离</p>
              <p className="text-sm font-medium text-gray-800">12.5 公里</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">预计时长</p>
              <p className="text-sm font-medium text-gray-800">约 35 分钟</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">已行驶</p>
              <p className="text-sm font-medium text-blue-600">4.2 公里</p>
            </div>
          </div>
        </Card>

        <div className="flex gap-3 pb-2">
          {!tracking ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={trackingLoading}
              onClick={handleStart}
              className="flex-1 h-12 text-base"
            >
              开启定位
            </Button>
          ) : (
            <Button
              danger
              icon={<StopOutlined />}
              loading={trackingLoading}
              onClick={handleStop}
              className="flex-1 h-12 text-base"
            >
              停止定位
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
