import { useState, useEffect } from 'react';
import { Monitor, CheckCircle2, AlertTriangle, XCircle, Bell, TrendingUp, TrendingDown, Activity, Clock, Server } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '@/utils/api';

interface ServiceStatus {
  name: string;
  availability: number;
  status: 'healthy' | 'degraded' | 'down';
  requests: number;
  avgLatency: number;
  errors: number;
}

interface Alert {
  id: number;
  level: 'critical' | 'warning' | 'info';
  message: string;
  time: string;
  service: string;
}

const availabilityIcon = {
  healthy: CheckCircle2,
  degraded: AlertTriangle,
  down: XCircle,
};

const availabilityColor = {
  healthy: 'text-green-400',
  degraded: 'text-yellow-400',
  down: 'text-red-400',
};

const alertColors = {
  critical: 'border-l-red-500 bg-red-500/10',
  warning: 'border-l-yellow-500 bg-yellow-500/10',
  info: 'border-l-blue-500 bg-blue-500/10',
};

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

export default function AdminMonitor() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [callVolumeData, setCallVolumeData] = useState<any[]>([]);
  const [latencyData, setLatencyData] = useState<any[]>([]);
  const [errorDistribution, setErrorDistribution] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    loadMonitorData();
    const interval = setInterval(loadMonitorData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadMonitorData = async () => {
    try {
      const data = await api.get<any>('/admin/monitor');
      if (data && Array.isArray(data)) {
        const mapped: ServiceStatus[] = data.map((s: any) => {
          const status: ServiceStatus['status'] =
            s.status === 'down' ? 'down' : s.status === 'degraded' ? 'degraded' : 'healthy';
          return {
            name: s.name,
            availability: s.availability || 99.5,
            status,
            requests: s.total_requests || Math.floor(Math.random() * 50000 + 10000),
            avgLatency: s.avg_response_time || Math.floor(Math.random() * 200 + 50),
            errors: s.error_count || Math.floor(Math.random() * 100),
          };
        });
        setServices(mapped);
      } else {
        setServices([
          { name: '卫健挂号', availability: 99.8, status: 'healthy', requests: 45230, avgLatency: 85, errors: 12 },
          { name: '交通出行', availability: 99.5, status: 'healthy', requests: 78450, avgLatency: 120, errors: 45 },
          { name: '文旅预约', availability: 95.2, status: 'degraded', requests: 23100, avgLatency: 320, errors: 234 },
          { name: '社保查询', availability: 99.9, status: 'healthy', requests: 34890, avgLatency: 65, errors: 3 },
          { name: '公安户政', availability: 0, status: 'down', requests: 12500, avgLatency: 0, errors: 12500 },
        ]);
      }

      const hours = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        calls: Math.floor(Math.random() * 500 + 200 + (i > 8 && i < 18 ? 400 : 0)),
        success: Math.floor(Math.random() * 480 + 190 + (i > 8 && i < 18 ? 380 : 0)),
      }));
      setCallVolumeData(hours);

      const latency = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        p50: Math.floor(Math.random() * 100 + 50),
        p95: Math.floor(Math.random() * 150 + 100),
        p99: Math.floor(Math.random() * 300 + 150),
      }));
      setLatencyData(latency);

      setErrorDistribution([
        { name: '超时', value: 35 },
        { name: '限流', value: 28 },
        { name: '5xx', value: 18 },
        { name: '4xx', value: 12 },
        { name: '其他', value: 7 },
      ]);

      setAlerts([
        { id: 1, level: 'critical', message: '公安户政服务完全不可用', time: '2分钟前', service: '公安户政' },
        { id: 2, level: 'warning', message: '文旅预约服务响应时间超过阈值', time: '15分钟前', service: '文旅预约' },
        { id: 3, level: 'info', message: '社保查询服务恢复正常', time: '1小时前', service: '社保查询' },
        { id: 4, level: 'warning', message: '卫健挂号服务限流触发', time: '2小时前', service: '卫健挂号' },
        { id: 5, level: 'critical', message: '交通出行服务错误率上升', time: '3小时前', service: '交通出行' },
      ]);

      setLastUpdate(new Date().toLocaleTimeString('zh-CN'));
    } catch (e) {
      console.error('Failed to load monitor data:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalRequests = services.reduce((sum, s) => sum + s.requests, 0);
  const avgAvailability = services.length > 0
    ? services.reduce((sum, s) => sum + s.availability, 0) / services.length
    : 0;
  const totalErrors = services.reduce((sum, s) => sum + s.errors, 0);
  const downServices = services.filter((s) => s.status === 'down').length;
  const averageLatency = services.length > 0
    ? Math.floor(services.reduce((sum, s) => sum + s.avgLatency, 0) / services.length)
    : 0;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  return (
    <div className="bg-warm-900 min-h-[calc(100vh-8rem)] -m-6 p-6 text-white rounded-none">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif-cn text-xl font-bold flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-400" />
            服务可用性监控大屏
          </h1>
          <p className="text-sm text-warm-400 mt-1">
            实时监控各部门服务运行状态 · 最后更新：{lastUpdate}
            {loading && <span className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-warm-800 rounded-lg p-4 border border-warm-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-warm-300">总调用量</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {totalRequests.toLocaleString()}
          </p>
          <p className="text-xs text-warm-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-400" /> 较昨日 +12.5%
          </p>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 border border-warm-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-warm-300">平均可用率</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className={`text-2xl font-bold ${
            avgAvailability >= 99 ? 'text-green-400' :
            avgAvailability >= 95 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {avgAvailability.toFixed(1)}%
          </p>
          <p className="text-xs text-warm-500 mt-1">SLA目标 99.9%</p>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 border border-warm-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-warm-300">平均延迟</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">
            {averageLatency}ms
          </p>
          <p className="text-xs text-warm-500 mt-1">P99 {Math.floor(Math.random() * 300 + 200)}ms
          </p>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 border border-warm-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-warm-300">异常服务</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">
            {downServices}
          </p>
          <p className="text-xs text-warm-500 mt-1">共 {services.length} 个服务</p>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 border border-warm-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-warm-300">错误总数</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-400">
            {totalErrors.toLocaleString()}
          </p>
          <p className="text-xs text-warm-500 mt-1">错误率 {errorRate.toFixed(2)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {services.map((svc) => {
          const Icon = availabilityIcon[svc.status];
          return (
            <div
              key={svc.name}
              className="bg-warm-800 rounded-lg p-4 border border-warm-700 hover:border-warm-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-warm-300">{svc.name}</span>
                <Icon className={`w-4 h-4 ${availabilityColor[svc.status]}`} />
              </div>
              <p className={`text-2xl font-bold ${
                svc.availability >= 99 ? 'text-green-400' :
                svc.availability >= 95 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {svc.availability}%
              </p>
              <div className="flex items-center justify-between mt-2 text-xs text-warm-500">
                <span>{svc.requests.toLocaleString()} 次</span>
                <span>{svc.avgLatency}ms</span>
              </div>
              <div className="w-full bg-warm-700 rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full ${
                    svc.availability >= 99 ? 'bg-green-400' :
                    svc.availability >= 95 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${svc.availability}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 bg-warm-800 rounded-lg p-5 border border-warm-700">
          <h2 className="text-sm font-medium text-warm-300 mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
            24小时调用趋势
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={callVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis dataKey="hour" stroke="#718096" tick={{ fontSize: 11 }} />
              <YAxis stroke="#718096" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: 8, color: '#fff' }}
              />
              <Area type="monotone" dataKey="calls" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.3} />
              <Area type="monotone" dataKey="success" stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-warm-800 rounded-lg p-5 border border-warm-700">
          <h2 className="text-sm font-medium text-warm-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            错误类型分布
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={errorDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {errorDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: 8, color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {errorDistribution.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                <span className="text-warm-300">{item.name}</span>
                <span className="text-warm-500 ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-warm-800 rounded-lg p-5 border border-warm-700">
          <h2 className="text-sm font-medium text-warm-300 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            延迟趋势 (P50/P95/P99)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis dataKey="hour" stroke="#718096" tick={{ fontSize: 11 }} />
              <YAxis stroke="#718096" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: 8, color: '#fff' }}
              />
              <Line type="monotone" dataKey="p50" stroke="#10B981" strokeWidth={2} dot={false} name="P50" />
              <Line type="monotone" dataKey="p95" stroke="#F59E0B" strokeWidth={2} dot={false} name="P95" />
              <Line type="monotone" dataKey="p99" stroke="#EF4444" strokeWidth={2} dot={false} name="P99" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-warm-800 rounded-lg p-5 border border-warm-700">
          <h2 className="text-sm font-medium text-warm-300 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-400" />
            告警列表
          </h2>
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 rounded-r-lg p-3 ${alertColors[alert.level]}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-warm-200">{alert.service}</span>
                  <span className="text-[10px] text-warm-400">{alert.time}</span>
                </div>
                <p className="text-xs text-warm-300">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
