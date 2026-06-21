import { useState, useEffect } from 'react';
import {
  Thermometer,
  Cpu,
  Monitor,
  Gauge,
  Wifi,
  AlertTriangle,
  Activity,
  Zap,
  HardDrive,
  Clock,
} from 'lucide-react';
import { deviceStatusList, devices, alerts } from '@/data/mockData';
import { useAppStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

export default function IotMonitor() {
  const { currentStoreId } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const storeDevices = devices.filter((d) => d.storeId === currentStoreId && d.type === 'pc');
  const activeAlerts = alerts.filter((a) => a.storeId === currentStoreId && a.status !== 'resolved');

  const avgStats = {
    temperature: deviceStatusList.length > 0
      ? Math.round(deviceStatusList.reduce((sum, d) => sum + d.temperature, 0) / deviceStatusList.length)
      : 0,
    frameRate: deviceStatusList.length > 0
      ? Math.round(deviceStatusList.reduce((sum, d) => sum + d.frameRate, 0) / deviceStatusList.length)
      : 0,
    cpuUsage: deviceStatusList.length > 0
      ? Math.round(deviceStatusList.reduce((sum, d) => sum + d.cpuUsage, 0) / deviceStatusList.length)
      : 0,
    gpuUsage: deviceStatusList.length > 0
      ? Math.round(deviceStatusList.reduce((sum, d) => sum + d.gpuUsage, 0) / deviceStatusList.length)
      : 0,
    memoryUsage: deviceStatusList.length > 0
      ? Math.round(deviceStatusList.reduce((sum, d) => sum + d.memoryUsage, 0) / deviceStatusList.length)
      : 0,
    networkLatency: deviceStatusList.length > 0
      ? Math.round(deviceStatusList.reduce((sum, d) => sum + d.networkLatency, 0) / deviceStatusList.length)
      : 0,
  };

  const GaugeCircle = ({ value, max, label, color, icon: Icon }: {
    value: number;
    max: number;
    label: string;
    color: string;
    icon: any;
  }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(51, 65, 85, 0.5)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={color}
              style={{ filter: `drop-shadow(0 0 6px currentColor)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon className={cn('w-5 h-5 mb-0.5', color)} />
            <span className={cn('text-xl font-bold font-orbitron', color)}>{value}</span>
          </div>
        </div>
        <span className="text-sm text-dark-400 mt-2">{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">IoT实时监控大屏</h1>
          <p className="text-dark-400 mt-1">实时监控设备运行状态</p>
        </div>
        <div className="flex items-center gap-2 text-cyber-400">
          <Clock className="w-5 h-5" />
          <span className="font-orbitron text-lg">
            {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50 text-center">
          <Monitor className="w-6 h-6 text-cyber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white font-orbitron">{storeDevices.length}</p>
          <p className="text-xs text-dark-400">在线设备</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30 text-center">
          <Activity className="w-6 h-6 text-neon-green mx-auto mb-2" />
          <p className="text-2xl font-bold text-neon-green font-orbitron">
            {storeDevices.filter((d) => d.status === 'normal').length}
          </p>
          <p className="text-xs text-dark-400">运行正常</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-orange/30 text-center">
          <AlertTriangle className="w-6 h-6 text-neon-orange mx-auto mb-2" />
          <p className="text-2xl font-bold text-neon-orange font-orbitron">
            {storeDevices.filter((d) => d.status === 'warning').length}
          </p>
          <p className="text-xs text-dark-400">警告状态</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-red/30 text-center">
          <Zap className="w-6 h-6 text-neon-red mx-auto mb-2" />
          <p className="text-2xl font-bold text-neon-red font-orbitron">
            {storeDevices.filter((d) => d.status === 'fault').length}
          </p>
          <p className="text-xs text-dark-400">故障设备</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-purple/30 text-center">
          <HardDrive className="w-6 h-6 text-neon-purple mx-auto mb-2" />
          <p className="text-2xl font-bold text-neon-purple font-orbitron">
            {Math.round(avgStats.memoryUsage)}%
          </p>
          <p className="text-xs text-dark-400">平均内存</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-500/30 text-center">
          <Wifi className="w-6 h-6 text-cyber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-cyber-400 font-orbitron">
            {avgStats.networkLatency}ms
          </p>
          <p className="text-xs text-dark-400">平均延迟</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-neon-orange" />
            温度仪表盘
          </h3>
          <div className="flex justify-around">
            <GaugeCircle
              value={avgStats.temperature}
              max={100}
              label="平均温度 (°C)"
              color={avgStats.temperature < 60 ? 'text-neon-green' : avgStats.temperature < 75 ? 'text-neon-orange' : 'text-neon-red'}
              icon={Thermometer}
            />
            <GaugeCircle
              value={avgStats.cpuUsage}
              max={100}
              label="CPU使用率 (%)"
              color="text-cyber-400"
              icon={Cpu}
            />
            <GaugeCircle
              value={avgStats.gpuUsage}
              max={100}
              label="GPU使用率 (%)"
              color="text-neon-purple"
              icon={Gauge}
            />
          </div>
        </div>

        <div className="p-6 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-neon-green" />
            帧率与网络
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-300 text-sm flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyber-400" />
                  平均帧率
                </span>
                <span className="text-2xl font-bold text-cyber-400 font-orbitron">
                  {avgStats.frameRate} FPS
                </span>
              </div>
              <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyber-600 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((avgStats.frameRate / 240) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-dark-500 mt-1">
                <span>0</span>
                <span>120</span>
                <span>240</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-300 text-sm flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-neon-green" />
                  网络延迟
                </span>
                <span className={cn(
                  'text-2xl font-bold font-orbitron',
                  avgStats.networkLatency < 20 ? 'text-neon-green' : avgStats.networkLatency < 50 ? 'text-neon-orange' : 'text-neon-red'
                )}>
                  {avgStats.networkLatency} ms
                </span>
              </div>
              <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    avgStats.networkLatency < 20 ? 'bg-neon-green' : avgStats.networkLatency < 50 ? 'bg-neon-orange' : 'bg-neon-red'
                  )}
                  style={{ width: `${Math.min((avgStats.networkLatency / 100) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-dark-500 mt-1">
                <span>优</span>
                <span>良</span>
                <span>差</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-300 text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-neon-purple" />
                  内存使用率
                </span>
                <span className="text-2xl font-bold text-neon-purple font-orbitron">
                  {avgStats.memoryUsage}%
                </span>
              </div>
              <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-purple to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${avgStats.memoryUsage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-neon-red" />
              告警信息
            </h3>
            <span className="text-xs bg-neon-red/20 text-neon-red px-2 py-1 rounded-full">
              {activeAlerts.length} 条待处理
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activeAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'p-3 rounded-lg border-l-2 animate-pulse',
                  alert.level === 'critical' && 'bg-neon-red/10 border-neon-red',
                  alert.level === 'high' && 'bg-neon-orange/10 border-neon-orange',
                  alert.level === 'medium' && 'bg-yellow-500/10 border-yellow-500',
                  alert.level === 'low' && 'bg-cyber-500/10 border-cyber-500'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{alert.deviceName}</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    alert.level === 'critical' && 'bg-neon-red/20 text-neon-red',
                    alert.level === 'high' && 'bg-neon-orange/20 text-neon-orange',
                    alert.level === 'medium' && 'bg-yellow-500/20 text-yellow-400',
                    alert.level === 'low' && 'bg-cyber-500/20 text-cyber-400'
                  )}>
                    {alert.level === 'critical' ? '严重' : alert.level === 'high' ? '高' : alert.level === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <p className="text-xs text-dark-400">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-cyber-400" />
            设备状态排行
          </h3>

          <div className="space-y-2">
            {deviceStatusList.slice(0, 8).map((status, index) => {
              const device = devices.find((d) => d.id === status.deviceId);
              return (
                <div
                  key={status.deviceId}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/30 transition-colors"
                >
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    index === 0 ? 'bg-neon-green text-black' :
                    index === 1 ? 'bg-cyan-400 text-black' :
                    index === 2 ? 'bg-neon-orange text-black' :
                    'bg-dark-700 text-dark-300'
                  )}>
                    {index + 1}
                  </span>
                  <Monitor className="w-4 h-4 text-cyber-400" />
                  <span className="flex-1 text-sm text-white truncate">
                    {device?.name || status.deviceId}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neon-green">{status.frameRate.toFixed(0)} FPS</span>
                    <span className={cn(
                      status.temperature < 60 ? 'text-neon-green' : status.temperature < 75 ? 'text-neon-orange' : 'text-neon-red'
                    )}>
                      {status.temperature.toFixed(0)}°C
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
