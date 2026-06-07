import { useEffect, useState } from 'react';
import { Monitor, Plus, X, Power, Edit2, Trash2, ToggleLeft, ToggleRight, Fan, Lightbulb, Thermometer, AlertTriangle, MapPin, Clock, CheckCircle, ChevronRight, Lightbulb as LightbulbIcon, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

interface Device {
  id: string;
  name: string;
  type: 'light' | 'ac' | 'fan' | 'tv' | 'heater' | 'other';
  location: string;
  status: 'online' | 'offline' | 'standby';
  enabled: boolean;
  powerUsage: number;
}

interface DeviceAlert {
  id: string;
  deviceName: string;
  deviceType: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  alertType: string;
  description: string;
  currentValue: number;
  threshold: number;
  unit: string;
  createdAt: string;
}

const mockDevices: Device[] = [
  { id: '1', name: '客厅主灯', type: 'light', location: '客厅', status: 'online', enabled: true, powerUsage: 12 },
  { id: '2', name: '卧室空调', type: 'ac', location: '主卧室', status: 'online', enabled: false, powerUsage: 0 },
  { id: '3', name: '客厅风扇', type: 'fan', location: '客厅', status: 'online', enabled: true, powerUsage: 45 },
  { id: '4', name: '客厅电视', type: 'tv', location: '客厅', status: 'standby', enabled: false, powerUsage: 1 },
  { id: '5', name: '浴室热水器', type: 'heater', location: '浴室', status: 'offline', enabled: false, powerUsage: 0 },
];

const mockAlerts: DeviceAlert[] = [
  { id: 'a1', deviceName: '生产车间空调系统', deviceType: 'HVAC', location: 'A栋3楼生产车间', severity: 'high', status: 'open', alertType: '设备负载率超标', description: '连续8小时负载率超过阈值', currentValue: 92, threshold: 85, unit: '%', createdAt: '2026-06-05T10:30:00' },
  { id: 'a2', deviceName: '变压器B相', deviceType: 'Transformer', location: '配电房1号', severity: 'medium', status: 'acknowledged', alertType: '温度异常', description: '运行温度偏高，建议检查散热', currentValue: 78, threshold: 70, unit: '℃', createdAt: '2026-06-05T08:15:00' },
  { id: 'a3', deviceName: '照明系统', deviceType: 'Lighting', location: 'B栋2楼办公区', severity: 'low', status: 'resolved', alertType: '待机功耗偏高', description: '非工作时段仍有较多设备待机', currentValue: 120, threshold: 80, unit: 'W', createdAt: '2026-06-04T22:00:00' },
  { id: 'a4', deviceName: '电梯主电机', deviceType: 'Elevator', location: 'C栋1号电梯', severity: 'critical', status: 'open', alertType: '异常振动', description: '检测到异常振动信号，需立即检修', currentValue: 12.5, threshold: 8, unit: 'mm/s', createdAt: '2026-06-05T11:45:00' },
  { id: 'a5', deviceName: '水泵系统', deviceType: 'Pump', location: '地下泵房', severity: 'high', status: 'open', alertType: '运行电流超标', description: '水泵运行电流持续超过额定值', currentValue: 45, threshold: 38, unit: 'A', createdAt: '2026-06-05T09:20:00' },
  { id: 'a6', deviceName: '配电柜出线', deviceType: 'Panel', location: '配电房2号', severity: 'medium', status: 'acknowledged', alertType: '功率因数偏低', description: '功率因数低于0.9，建议检查无功补偿', currentValue: 0.85, threshold: 0.9, unit: '', createdAt: '2026-06-05T07:00:00' },
  { id: 'a7', deviceName: '中央空调主机', deviceType: 'HVAC', location: '屋顶主机房', severity: 'high', status: 'open', alertType: '能效比下降', description: '制冷能效比低于标称值15%', currentValue: 3.2, threshold: 3.8, unit: 'EER', createdAt: '2026-06-05T10:00:00' },
];

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  light: <Lightbulb size={22} />,
  ac: <Thermometer size={22} />,
  fan: <Fan size={22} />,
  tv: <Monitor size={22} />,
  heater: <Thermometer size={22} />,
  other: <Monitor size={22} />,
};

const DEVICE_COLORS: Record<string, string> = {
  light: 'text-csg-amber bg-amber-100 dark:bg-amber-900/30',
  ac: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  fan: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  tv: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  heater: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  other: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
};

export default function SmartDevices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [alerts, setAlerts] = useState<DeviceAlert[]>(mockAlerts);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [form, setForm] = useState({ name: '', type: 'light' as Device['type'], location: '' });
  const [activeTab, setActiveTab] = useState<'devices' | 'alerts'>('devices');
  const [alertFilter, setAlertFilter] = useState<'all' | 'open' | 'acknowledged' | 'resolved'>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Device[]>('/smartlife/devices');
        setDevices(res);
        const alertRes = await api.get<DeviceAlert[]>('/energy/device-alerts');
        if (Array.isArray(alertRes) && alertRes.length > 0) {
          setAlerts(alertRes);
        }
      } catch {
        setDevices(mockDevices);
        setAlerts(mockAlerts);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleDevice = async (id: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, enabled: !d.enabled, status: d.enabled ? 'standby' : 'online', powerUsage: d.enabled ? 0 : Math.floor(Math.random() * 50) + 10 }
          : d
      ));
  };

  const handleSave = async () => {
    if (editing) {
      setDevices((prev) =>
        prev.map((d) => (d.id === editing.id ? { ...d, name: form.name, type: form.type, location: form.location } : d))
      );
    } else {
      const newDevice: Device = {
        id: 'd' + Date.now(),
        name: form.name,
        type: form.type,
        location: form.location,
        status: 'online',
        enabled: false,
        powerUsage: 0,
      };
      setDevices((prev) => [newDevice, ...prev]);
    }
    setShowAdd(false);
    setEditing(null);
    setForm({ name: '', type: 'light', location: '' });
  };

  const handleDelete = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  const statusBadge = (s: string) => (s === 'online' ? 'badge-green' : s === 'offline' ? 'badge-gray' : 'badge-amber');
  const statusLabel = (s: string) => (s === 'online' ? '在线' : s === 'offline' ? '离线' : '待机');

  const severityBadge = (s: string) => {
    switch (s) {
      case 'critical': return 'badge-red';
      case 'high': return 'badge-red';
      case 'medium': return 'badge-amber';
      default: return 'badge-blue';
    }
  };

  const severityLabel = (s: string) => {
    switch (s) {
      case 'critical': return '严重';
      case 'high': return '高';
      case 'medium': return '中';
      default: return '低';
    }
  };

  const alertStatusBadge = (s: string) => {
    if (s === 'resolved') return 'badge-green';
    if (s === 'acknowledged') return 'badge-blue';
    return 'badge-red';
  };

  const alertStatusLabel = (s: string) => {
    if (s === 'resolved') return '已解决';
    if (s === 'acknowledged') return '已确认';
    return '待处理';
  };

  const filteredAlerts = alertFilter === 'all' 
    ? alerts 
    : alerts.filter(a => a.status === alertFilter);

  const alertStats = {
    total: alerts.length,
    open: alerts.filter(a => a.status === 'open').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <Monitor size={28} className="text-csg-navy" />
          <div>
            <h1 className="page-title">智能设备</h1>
            <p className="page-desc">管理智能设备与设备告警，追踪处置状态</p>
          </div>
        </div>
        {activeTab === 'devices' && (
          <button onClick={() => { setShowAdd(true); setEditing(null); setForm({ name: '', type: 'light', location: '' }); }} className="btn-secondary flex items-center gap-1.5">
            <Plus size={16} /> 添加设备
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'devices' ? 'border-csg-green text-csg-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Monitor size={16} className="inline mr-1.5" /> 设备列表
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {devices.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'alerts' ? 'border-csg-green text-csg-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <AlertTriangle size={16} className="inline mr-1.5" /> 设备告警
          {alertStats.open > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              {alertStats.open} 待处理
            </span>
          )}
        </button>
      </div>

      {activeTab === 'devices' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {devices.map((device) => (
            <div key={device.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${DEVICE_COLORS[device.type]}`}>
                  {DEVICE_ICONS[device.type]}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditing(device); setForm({ name: device.name, type: device.type, location: device.location }); setShowAdd(true); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(device.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-csg-red"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{device.name}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <MapPin size={10} /> {device.location}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={statusBadge(device.status)}>{statusLabel(device.status)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{device.powerUsage}W</span>
                </div>
                <button
                  onClick={() => toggleDevice(device.id)}
                  disabled={device.status === 'offline'}
                  className="text-csg-green disabled:text-gray-400 disabled:opacity-50"
                >
                  {device.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="card p-4 bg-gradient-to-br from-gray-500/5 to-gray-500/10">
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">{alertStats.total}</div>
              <div className="text-xs text-gray-500">全部告警</div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-red-500/5 to-red-500/10">
              <div className="text-2xl font-bold text-red-600">{alertStats.open}</div>
              <div className="text-xs text-gray-500">待处理</div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <div className="text-2xl font-bold text-blue-600">{alertStats.acknowledged}</div>
              <div className="text-xs text-gray-500">已确认</div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-green-500/5 to-green-500/10">
              <div className="text-2xl font-bold text-csg-green">{alertStats.resolved}</div>
              <div className="text-xs text-gray-500">已解决</div>
            </div>
            <div className="card p-4 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
              <div className="text-2xl font-bold text-purple-600">{alertStats.critical}</div>
              <div className="text-xs text-gray-500">严重告警</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all', 'open', 'acknowledged', 'resolved'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setAlertFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  alertFilter === s
                    ? 'bg-csg-navy text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {s === 'all' ? '全部' : alertStatusLabel(s)}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/smartlife/alerts/${alert.id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{alert.alertType}</span>
                      <span className={severityBadge(alert.severity)}>{severityLabel(alert.severity)}</span>
                      <span className={alertStatusBadge(alert.status)}>{alertStatusLabel(alert.status)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{alert.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Monitor size={10} /> {alert.deviceName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {alert.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {new Date(alert.createdAt).toLocaleString('zh-CN')}
                      </span>
                      <span className="text-csg-red font-medium">
                        当前: {alert.currentValue}{alert.unit} / 阈值: {alert.threshold}{alert.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/smartlife/alerts/${alert.id}`); }}
                      className="btn-outline text-sm flex items-center gap-1.5"
                    >
                      查看详情 <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAlerts.length === 0 && (
            <div className="card p-12 text-center">
              <AlertTriangle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">当前没有{alertFilter !== 'all' ? alertStatusLabel(alertFilter) : ''}设备告警</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="card p-5 bg-gradient-to-br from-amber-500/5 to-amber-500/10 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <LightbulbIcon size={18} className="text-csg-amber" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">节能建议</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">根据设备告警和用电数据，系统为您生成了个性化节能建议</p>
                  <button
                    onClick={() => navigate('/smartlife/tips')}
                    className="text-csg-amber hover:underline text-sm font-medium flex items-center gap-1"
                  >
                    查看节能建议 <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="card p-5 bg-gradient-to-br from-csg-navy/5 to-csg-navy/10 border border-csg-navy/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-csg-navy/10 flex items-center justify-center">
                  <Gift size={18} className="text-csg-navy" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">积分奖励</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">处理设备告警并落实节能措施可获得积分奖励，可在积分商城兑换商品</p>
                  <button
                    onClick={() => navigate('/smartlife/points')}
                    className="text-csg-navy hover:underline text-sm font-medium flex items-center gap-1"
                  >
                    前往积分商城 <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'devices' && devices.length === 0 && (
        <div className="card p-12 text-center">
          <Monitor size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">暂无智能设备</p>
        </div>
      )}

      {(showAdd || editing) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? '编辑设备' : '添加设备'}</h3>
              <button onClick={() => { setShowAdd(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">设备名称</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-field" placeholder="请输入设备名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">设备类型</label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Device['type'] }))} className="select-field">
                  <option value="light">灯光</option>
                  <option value="ac">空调</option>
                  <option value="fan">风扇</option>
                  <option value="tv">电视</option>
                  <option value="heater">热水器</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">位置</label>
                <input type="text" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className="input-field" placeholder="如：客厅" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowAdd(false); setEditing(null); }} className="btn-outline flex-1">取消</button>
              <button onClick={handleSave} disabled={!form.name || !form.location} className="btn-secondary flex-1">{editing ? '保存' : '添加'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
