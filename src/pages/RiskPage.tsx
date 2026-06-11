import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Camera, Users, MapPin, Clock, Eye, CheckCircle, X } from 'lucide-react';
import { riskApi } from '@/api';
import StatusBadge from '@/components/common/StatusBadge';
import type { Alert, AlertType, AlertLevel, ApiResponse } from '@shared/types';

interface AlertWithHandler extends Alert {
  handler_name?: string;
}

interface AbnormalVisitor {
  person_name: string;
  access_count: number;
  first_access: string;
  last_access: string;
  risk_level?: AlertLevel;
  cluster_info?: string;
}

interface AlertStats {
  status: string;
  count: number;
}

const typeMap: Record<string, { label: string; icon: React.ReactNode }> = {
  high_fall: { label: '高空抛物', icon: <AlertTriangle className="w-5 h-5" /> },
  fire_channel: { label: '消防通道', icon: <AlertCircle className="w-5 h-5" /> },
  abnormal_visitor: { label: '异常访客', icon: <Users className="w-5 h-5" /> },
  device_fault: { label: '设备故障', icon: <Camera className="w-5 h-5" /> },
  device_offline: { label: '设备离线', icon: <Camera className="w-5 h-5" /> },
  other: { label: '其他', icon: <AlertCircle className="w-5 h-5" /> },
};

const typeIconColors: Record<string, string> = {
  high_fall: 'bg-red-100 text-red-600',
  fire_channel: 'bg-orange-100 text-orange-600',
  abnormal_visitor: 'bg-yellow-100 text-yellow-600',
  device_fault: 'bg-purple-100 text-purple-600',
  device_offline: 'bg-gray-100 text-gray-600',
  other: 'bg-blue-100 text-blue-600',
};

const statusFilterOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'ignored', label: '已忽略' },
];

const levelFilterOptions = [
  { value: 'all', label: '全部级别' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'critical', label: '紧急' },
];

const typeFilterOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'high_fall', label: '高空抛物' },
  { value: 'fire_channel', label: '消防通道' },
  { value: 'abnormal_visitor', label: '异常访客' },
  { value: 'device_fault', label: '设备故障' },
  { value: 'other', label: '其他' },
];

const statusActionOptions = [
  { value: 'processing', label: '处理中', variant: 'warning' as const },
  { value: 'resolved', label: '已解决', variant: 'success' as const },
  { value: 'ignored', label: '忽略', variant: 'default' as const },
];

export default function RiskPage() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'visitors'>('alerts');

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [alerts, setAlerts] = useState<AlertWithHandler[]>([]);
  const [stats, setStats] = useState<AlertStats[]>([]);
  const [abnormalVisitors, setAbnormalVisitors] = useState<AbnormalVisitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showHandleModal, setShowHandleModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertWithHandler | null>(null);
  const [handleForm, setHandleForm] = useState({ status: 'processing' as string, remark: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'alerts') {
      fetchAlerts();
    } else {
      fetchAbnormalVisitors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter, levelFilter, typeFilter]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string; level?: string; type?: string } = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (levelFilter !== 'all') params.level = levelFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const response = await riskApi.getAlerts(params) as ApiResponse<{
        alerts: AlertWithHandler[];
        stats: AlertStats[];
      }>;

      if (response.success && response.data) {
        setAlerts(response.data.alerts || []);
        setStats(response.data.stats || []);
      } else {
        setError(response.error || '获取告警列表失败');
      }
    } catch {
      setError('获取告警列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAbnormalVisitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await riskApi.getAbnormalVisitors() as ApiResponse<AbnormalVisitor[]>;
      if (response.success && response.data) {
        const visitorsWithRisk = response.data.map((v: AbnormalVisitor) => ({
          ...v,
          risk_level: v.access_count >= 10 ? 'critical' : v.access_count >= 7 ? 'high' : v.access_count >= 5 ? 'medium' : 'low' as AlertLevel,
          cluster_info: v.access_count >= 10 ? '高频访客' : v.access_count >= 7 ? '频繁访客' : '异常访客',
        }));
        setAbnormalVisitors(visitorsWithRisk || []);
      } else {
        setError(response.error || '获取异常访客列表失败');
      }
    } catch {
      setError('获取异常访客列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const response = await riskApi.getAlertDetail(id) as ApiResponse<AlertWithHandler>;
      if (response.success && response.data) {
        setSelectedAlert(response.data);
        setShowDetailModal(true);
      }
    } catch {
      console.error('获取告警详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const openHandleModal = (alert: AlertWithHandler) => {
    setSelectedAlert(alert);
    setHandleForm({ status: 'processing', remark: '' });
    setShowHandleModal(true);
  };

  const handleAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    setActionLoading(true);
    try {
      const response = await riskApi.handleAlert(selectedAlert.id, {
        status: handleForm.status,
        remark: handleForm.remark,
      });

      if (response.success) {
        setShowHandleModal(false);
        fetchAlerts();
      }
    } catch {
      console.error('处理告警失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSafe = (visitor: AbnormalVisitor) => {
    setAbnormalVisitors(prev => prev.filter(v => v.person_name !== visitor.person_name));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeInfo = (type: AlertType) => {
    return typeMap[type] || typeMap.other;
  };

  const getTypeIconColor = (type: AlertType) => {
    return typeIconColors[type] || typeIconColors.other;
  };

  const getStatCount = (status: string) => {
    const stat = stats.find(s => s.status === status);
    return stat?.count || 0;
  };

  const tabs = [
    { value: 'alerts' as const, label: '告警列表', count: alerts.length },
    { value: 'visitors' as const, label: '异常访客分析', count: abnormalVisitors.length },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">风险预警中心</h1>
        <p className="text-gray-600">监控和处理社区安全风险</p>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
              activeTab === tab.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {activeTab === 'alerts' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{getStatCount('pending')}</div>
              <div className="text-sm text-gray-500">待处理</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{getStatCount('processing')}</div>
              <div className="text-sm text-gray-500">处理中</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{getStatCount('resolved')}</div>
              <div className="text-sm text-gray-500">已解决</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-gray-600">{getStatCount('ignored')}</div>
              <div className="text-sm text-gray-500">已忽略</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {levelFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {typeFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-lg border border-gray-100">
              <CheckCircle className="w-12 h-12 mb-4 text-gray-300" />
              <p>暂无告警数据</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const typeInfo = getTypeInfo(alert.type);
                return (
                  <div
                    key={alert.id}
                    className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${getTypeIconColor(alert.type)}`}>
                        {typeInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">{alert.title}</h3>
                            <StatusBadge status={alert.level} />
                            <StatusBadge status={alert.status} />
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => fetchAlertDetail(alert.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {alert.status === 'pending' && (
                              <button
                                onClick={() => openHandleModal(alert)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                处理
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{alert.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{alert.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(alert.occurred_at)}</span>
                          </div>
                          {alert.handler_name && (
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>处理人: {alert.handler_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'visitors' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : abnormalVisitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-lg border border-gray-100">
              <CheckCircle className="w-12 h-12 mb-4 text-gray-300" />
              <p>暂无异常访客数据</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      访客姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      访问次数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      首次访问
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最后访问
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      风险等级
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      聚类信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {abnormalVisitors.map((visitor, index) => (
                    <tr key={`${visitor.person_name}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <Users className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{visitor.person_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          visitor.access_count >= 10 ? 'text-red-600' :
                          visitor.access_count >= 7 ? 'text-orange-600' :
                          'text-yellow-600'
                        }`}>
                          {visitor.access_count} 次
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(visitor.first_access)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(visitor.last_access)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={visitor.risk_level || 'low'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          visitor.access_count >= 10 ? 'bg-red-100 text-red-800' :
                          visitor.access_count >= 7 ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {visitor.cluster_info}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleMarkSafe(visitor)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            标记安全
                          </button>
                          <button
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            查看详情
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showHandleModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">处理告警</h2>
              <button
                onClick={() => setShowHandleModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAlertSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <StatusBadge status={selectedAlert.level} />
                  <span className="font-medium text-gray-900">{selectedAlert.title}</span>
                </div>
                <p className="text-sm text-gray-600">{selectedAlert.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">处理状态 *</label>
                <div className="grid grid-cols-3 gap-2">
                  {statusActionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setHandleForm({ ...handleForm, status: opt.value })}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        handleForm.status === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理备注</label>
                <textarea
                  value={handleForm.remark}
                  onChange={(e) => setHandleForm({ ...handleForm, remark: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="请输入处理备注（可选）"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowHandleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? '提交中...' : '确认处理'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">告警详情</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${getTypeIconColor(selectedAlert.type)}`}>
                    {getTypeInfo(selectedAlert.type).icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedAlert.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <StatusBadge status={selectedAlert.level} />
                      <StatusBadge status={selectedAlert.status} />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">描述</span>
                    <p className="text-gray-900 mt-1">{selectedAlert.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">位置</span>
                      <div className="flex items-center mt-1">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-gray-900">{selectedAlert.location}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">发生时间</span>
                      <div className="flex items-center mt-1">
                        <Clock className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-gray-900">{formatDate(selectedAlert.occurred_at)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">告警类型</span>
                      <p className="text-gray-900 mt-1">{getTypeInfo(selectedAlert.type).label}</p>
                    </div>
                    {selectedAlert.handler_name && (
                      <div>
                        <span className="text-gray-500">处理人</span>
                        <p className="text-gray-900 mt-1">{selectedAlert.handler_name}</p>
                      </div>
                    )}
                    {selectedAlert.handled_at && (
                      <div>
                        <span className="text-gray-500">处理时间</span>
                        <p className="text-gray-900 mt-1">{formatDate(selectedAlert.handled_at)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedAlert.image_url && (
                  <div>
                    <span className="text-sm text-gray-500">现场图片</span>
                    <img
                      src={selectedAlert.image_url}
                      alt="现场图片"
                      className="mt-2 rounded-lg w-full max-h-64 object-cover"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    关闭
                  </button>
                  {selectedAlert.status === 'pending' && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openHandleModal(selectedAlert);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      立即处理
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
