import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, RefreshCw, AlertTriangle, AlertCircle, Bell, CheckCircle, Clock, Zap, Wifi, WifiOff } from 'lucide-react';
import { setCurrentPage } from '../lib/appState';
import api from '../lib/api';
import dayjs from 'dayjs';

export default function AdminAlarms() {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadAlarms();
  }, [statusFilter, levelFilter]);

  const loadAlarms = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (levelFilter) params.level = levelFilter;
      const data = await api.operations.alarms(params);
      setAlarms(data.alarms);
    } catch (err) {
      console.error('Load alarms failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: number) => {
    setActionLoading(id);
    try {
      await api.operations.acknowledgeAlarm(id);
      alert('已确认告警');
      loadAlarms();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id: number) => {
    setActionLoading(id);
    try {
      await api.operations.resolveAlarm(id);
      alert('已解决告警');
      loadAlarms();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getLevelBadge = (level: string) => {
    const styles: Record<string, string> = {
      info: 'bg-blue-100 text-blue-700',
      warning: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
      critical: 'bg-red-600 text-white',
    };
    const labels: Record<string, string> = {
      info: '信息',
      warning: '警告',
      error: '错误',
      critical: '严重',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[level] || 'bg-gray-100 text-gray-700'}`}>
        {labels[level] || level}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-red-100 text-red-700',
      acknowledged: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
    };
    const labels: Record<string, string> = {
      active: '未处理',
      acknowledged: '已确认',
      resolved: '已解决',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'offline':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      case 'fault':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'overheat':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'overcurrent':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredAlarms = alarms.filter(a =>
    a.title.includes(searchText) ||
    a.alarm_no.includes(searchText) ||
    (a.station_name && a.station_name.includes(searchText))
  );

  const stats = {
    active: alarms.filter(a => a.status === 'active').length,
    acknowledged: alarms.filter(a => a.status === 'acknowledged').length,
    critical: alarms.filter(a => a.level === 'critical' && a.status !== 'resolved').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('admin-dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">告警中心</h1>
            <p className="text-sm text-gray-500">设备异常和故障告警监控</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-100 text-sm mb-1">未处理告警</div>
                <div className="text-3xl font-bold">{stats.active}</div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-yellow-100 text-sm mb-1">已确认</div>
                <div className="text-3xl font-bold">{stats.acknowledged}</div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-100 text-sm mb-1">严重告警</div>
                <div className="text-3xl font-bold">{stats.critical}</div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {[
              { value: '', label: '全部' },
              { value: 'active', label: '未处理' },
              { value: 'acknowledged', label: '已确认' },
              { value: 'resolved', label: '已解决' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${statusFilter === tab.value ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索告警编号、标题或站点..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none"
              >
                <option value="">全部级别</option>
                <option value="critical">严重</option>
                <option value="error">错误</option>
                <option value="warning">警告</option>
                <option value="info">信息</option>
              </select>
              <button
                onClick={loadAlarms}
                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${alarm.status === 'active' ? 'border-l-4 border-red-500' : alarm.status === 'acknowledged' ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alarm.status === 'active' ? 'bg-red-50' : alarm.status === 'acknowledged' ? 'bg-yellow-50' : 'bg-green-50'}`}>
                      {getTypeIcon(alarm.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">{alarm.title}</span>
                        {getLevelBadge(alarm.level)}
                        {getStatusBadge(alarm.status)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="font-mono text-xs">{alarm.alarm_no}</span>
                        <span>·</span>
                        <span>{alarm.station_name || '未关联站点'}</span>
                        {alarm.charger_sn && (
                          <>
                            <span>·</span>
                            <span>桩 {alarm.charger_sn}</span>
                          </>
                        )}
                        {alarm.gun_no && (
                          <>
                            <span>·</span>
                            <span>{alarm.gun_no}号枪</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {dayjs(alarm.created_at).format('MM-DD HH:mm:ss')}
                  </span>
                </div>

                {alarm.description && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                    {alarm.description}
                  </div>
                )}

                {alarm.resolved_at && (
                  <div className="mb-4 p-3 bg-green-50 rounded-xl text-sm text-green-700">
                    <div className="font-medium">解决时间：{dayjs(alarm.resolved_at).format('MM-DD HH:mm:ss')}</div>
                    {alarm.remark && <div>备注：{alarm.remark}</div>}
                  </div>
                )}

                {alarm.acknowledged_at && !alarm.resolved_at && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-xl text-sm text-yellow-700">
                    确认时间：{dayjs(alarm.acknowledged_at).format('MM-DD HH:mm:ss')}
                    {alarm.acknowledged_by_name && ` · 确认人：${alarm.acknowledged_by_name}`}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    {alarm.type === 'offline' && (
                      <span className="flex items-center gap-1">
                        <WifiOff className="w-4 h-4" />
                        设备离线告警
                      </span>
                    )}
                    {alarm.type === 'fault' && (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        设备故障告警
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {alarm.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleAcknowledge(alarm.id)}
                          disabled={actionLoading === alarm.id}
                          className="px-4 py-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                        >
                          <Clock className="w-4 h-4" />
                          确认告警
                        </button>
                        <button
                          onClick={() => handleResolve(alarm.id)}
                          disabled={actionLoading === alarm.id}
                          className="px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          标记解决
                        </button>
                      </>
                    )}
                    {alarm.status === 'acknowledged' && (
                      <button
                        onClick={() => handleResolve(alarm.id)}
                        disabled={actionLoading === alarm.id}
                        className="px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        标记解决
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredAlarms.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无告警记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
