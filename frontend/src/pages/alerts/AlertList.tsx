import React, { useEffect, useState } from 'react';
import { alertApi } from '../../services/api';
import { useToastStore } from '../../store';
import { Bell, AlertTriangle, CheckCircle, XCircle, Phone, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import dayjs from 'dayjs';

const AlertList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    loadAlerts();
  }, [page, statusFilter, severityFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params: any = { page, page_size: pageSize };
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      const response = await alertApi.getAlerts(params);
      if (response.data.success) {
        setAlerts(response.data.data.list);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      addToast('error', '加载提醒列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: number) => {
    try {
      await alertApi.acknowledgeAlert(id, { status: 'acknowledged' });
      addToast('success', '已确认提醒');
      loadAlerts();
    } catch (error) {
      addToast('error', '操作失败');
    }
  };

  const handleConfirmResolve = async (id: number) => {
    try {
      await alertApi.acknowledgeAlert(id, { status: 'resolved' });
      addToast('success', '已确认解决');
      loadAlerts();
    } catch (error) {
      addToast('error', '操作失败');
    }
  };

  const handleIgnore = async (id: number) => {
    try {
      await alertApi.acknowledgeAlert(id, { status: 'ignored' });
      addToast('success', '已忽略提醒');
      loadAlerts();
    } catch (error) {
      addToast('error', '操作失败');
    }
  };

  const handleContactEmergency = async (id: number) => {
    try {
      await alertApi.contactEmergency(id);
      addToast('success', '已通知紧急联系人');
      loadAlerts();
    } catch (error) {
      addToast('error', '通知失败');
    }
  };

  const severityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  };

  const severityLabels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重'
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-blue-100 text-blue-700',
    acknowledged: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-purple-100 text-purple-700',
    resolved: 'bg-green-100 text-green-700',
    ignored: 'bg-gray-100 text-gray-500'
  };

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    acknowledged: '已确认',
    confirmed: '已核实',
    resolved: '已解决',
    ignored: '已忽略'
  };

  const alertTypeLabels: Record<string, string> = {
    heart_rate_anomaly: '心率异常',
    overtraining: '过度训练',
    missed_plan: '未完成计划',
    device_disconnect: '设备断连',
    track_drift: '轨迹漂移',
    data_duplicate: '数据重复',
    privacy_revoked: '隐私撤权',
    high_risk: '高风险'
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">异常提醒</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="acknowledged">已确认</option>
              <option value="confirmed">已核实</option>
              <option value="resolved">已解决</option>
              <option value="ignored">已忽略</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部严重程度</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">严重</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">严重程度</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  暂无提醒数据
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs font-medium">
                      {alertTypeLabels[alert.alert_type] || alert.alert_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[alert.severity]}`}>
                      {severityLabels[alert.severity]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{alert.message}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[alert.status]}`}>
                      {statusLabels[alert.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dayjs(alert.created_at).format('YYYY-MM-DD HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      {alert.status === 'pending' && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-medium"
                        >
                          确认
                        </button>
                      )}
                      {(alert.status === 'pending' || alert.status === 'acknowledged') && (
                        <button
                          onClick={() => handleConfirmResolve(alert.id)}
                          className="px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-xs font-medium flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          确认解决
                        </button>
                      )}
                      {(alert.status === 'pending' || alert.status === 'acknowledged') && (
                        <button
                          onClick={() => handleIgnore(alert.id)}
                          className="px-3 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-xs font-medium flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          忽略
                        </button>
                      )}
                      {alert.severity === 'critical' && (
                        <button
                          onClick={() => handleContactEmergency(alert.id)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs font-medium flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          紧急联系
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              共 {total} 条记录，第 {page} / {totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertList;
