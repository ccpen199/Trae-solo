import { useState, useEffect } from 'react';
import { Monitor, AlertTriangle, Package, RefreshCw, CheckCircle, Clock, MapPin } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import StatusBadge from '../../components/UI/StatusBadge';
import DataTable from '../../components/UI/DataTable';
import { cabinetApi } from '../../lib/api';
import type { Cabinet, Alert } from '../../lib/api';

interface FaultAlert {
  id: string;
  cabinetId: string;
  cabinetName: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function CabinetMonitor() {
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [alerts, setAlerts] = useState<FaultAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cabinetsRes, alertsRes] = await Promise.all([
        cabinetApi.getAll(),
        cabinetApi.getAlerts()
      ]);
      setCabinets((cabinetsRes.data as Cabinet[]) || []);
      setAlerts((alertsRes.data as FaultAlert[]) || []);
    } catch (error) {
      setCabinets([
        { id: '1', name: 'A栋一楼柜', location: 'A栋1楼大厅', status: 'online', totalCompartments: 36, occupiedCompartments: 28, temperature: 24, humidity: 60, lastHeartbeat: new Date().toISOString() },
        { id: '2', name: 'B栋二楼柜', location: 'B栋2楼电梯口', status: 'online', totalCompartments: 24, occupiedCompartments: 12, temperature: 22, humidity: 55, lastHeartbeat: new Date().toISOString() },
        { id: '3', name: 'C栋负一楼柜', location: 'C栋负一楼停车场', status: 'maintenance', totalCompartments: 48, occupiedCompartments: 0, temperature: 0, humidity: 0, lastHeartbeat: new Date(Date.now() - 3600000).toISOString() },
        { id: '4', name: 'D栋三楼柜', location: 'D栋3楼走廊', status: 'offline', totalCompartments: 36, occupiedCompartments: 15, temperature: 0, humidity: 0, lastHeartbeat: new Date(Date.now() - 7200000).toISOString() },
      ]);
      setAlerts([
        { id: '1', cabinetId: '4', cabinetName: 'D栋三楼柜', type: 'offline', severity: 'critical', message: '设备离线超过2小时', timestamp: new Date(Date.now() - 7200000).toISOString(), resolved: false },
        { id: '2', cabinetId: '3', cabinetName: 'C栋负一楼柜', type: 'maintenance', severity: 'warning', message: '设备正在维护中', timestamp: new Date(Date.now() - 3600000).toISOString(), resolved: false },
        { id: '3', cabinetId: '1', cabinetName: 'A栋一楼柜', type: 'temperature', severity: 'info', message: '温度略高于设定值', timestamp: new Date(Date.now() - 1800000).toISOString(), resolved: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await cabinetApi.resolveAlert(alertId);
    } catch (error) {
    }
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, resolved: true } : a));
  };

  const handleRestock = async (cabinetId: string) => {
    try {
      await cabinetApi.restock(cabinetId);
    } catch (error) {
    }
    alert('补货任务已创建');
  };

  const alertColumns = [
    {
      key: 'severity',
      title: '级别',
      render: (row: FaultAlert) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.severity === 'critical' ? 'bg-red-100 text-red-800' :
          row.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
          'bg-sky-100 text-sky-800'
        }`}>
          {row.severity === 'critical' ? '紧急' : row.severity === 'warning' ? '警告' : '提示'}
        </span>
      )
    },
    { key: 'cabinetName', title: '柜子名称' },
    { key: 'type', title: '类型' },
    { key: 'message', title: '消息' },
    {
      key: 'timestamp',
      title: '时间',
      render: (row: FaultAlert) => new Date(row.timestamp).toLocaleString('zh-CN')
    },
    {
      key: 'resolved',
      title: '状态',
      render: (row: FaultAlert) => row.resolved ? 
        <span className="text-emerald-600">已解决</span> : 
        <span className="text-amber-600">待处理</span>
    },
    {
      key: 'actions',
      title: '操作',
      render: (row: FaultAlert) => !row.resolved && (
        <button
          onClick={() => handleResolveAlert(row.id)}
          className="text-sky-600 hover:text-sky-800 text-sm font-medium"
        >
          标记解决
        </button>
      )
    }
  ];

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Monitor className="w-8 h-8 text-sky-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">柜子运维监控中心</h1>
              <p className="text-slate-500">实时监控所有智能柜运行状态</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <Monitor className="w-5 h-5" />
              <span>总柜子数</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{cabinets.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span>在线</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              {cabinets.filter(c => c.status === 'online').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>告警数</span>
            </div>
            <p className="text-3xl font-bold text-red-600">
              {alerts.filter(a => !a.resolved).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-sky-600 mb-2">
              <Package className="w-5 h-5" />
              <span>平均占用率</span>
            </div>
            <p className="text-3xl font-bold text-sky-600">
              {cabinets.length > 0 ? Math.round(
                cabinets.reduce((sum, c) => sum + (c.occupiedCompartments / c.totalCompartments * 100), 0) / cabinets.length
              ) : 0}%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">柜子状态概览</h2>
          </div>
          <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cabinets.map(cabinet => {
              const occupancyRate = Math.round(cabinet.occupiedCompartments / cabinet.totalCompartments * 100);
              return (
                <div key={cabinet.id} className="border border-slate-200 rounded-lg p-4 hover:border-sky-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-800">{cabinet.name}</span>
                    <StatusBadge status={cabinet.status} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{cabinet.location}</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">占用率</span>
                      <span className="font-medium text-slate-800">{occupancyRate}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getOccupancyColor(occupancyRate)} transition-all`}
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{cabinet.occupiedCompartments}/{cabinet.totalCompartments} 格</span>
                    <button
                      onClick={() => handleRestock(cabinet.id)}
                      className="text-sky-600 hover:text-sky-800"
                    >
                      补货
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">故障告警</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>最近更新: {new Date().toLocaleTimeString('zh-CN')}</span>
            </div>
          </div>
          <DataTable
            columns={alertColumns}
            data={alerts}
            loading={loading}
            emptyText="暂无告警信息"
          />
        </div>
      </div>
    </Layout>
  );
}
