import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Clock, Wrench, MessageSquare, HelpCircle, MoreHorizontal, X, Eye, AlertTriangle, ShieldAlert, Flame, WifiOff, FileText, User, Calendar, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { analyticsApi, riskApi } from '@/api';
import type { KPIData, Alert, ApiResponse } from '@shared/types';
import StatusBadge from '@/components/common/StatusBadge';

interface AlertWithExtra extends Alert {
  handler?: string;
  handleTime?: string;
  handleNote?: string;
  handleStatus?: 'pending' | 'processing' | 'resolved' | 'recheck';
  recheckStatus?: 'pending' | 'passed' | 'failed';
}

interface DisposalRecord {
  id: number;
  alertType: string;
  alertTitle: string;
  location: string;
  handler: string;
  handleTime: string;
  handleNote: string;
  recheckStatus: 'pending' | 'passed' | 'failed';
  recheckTime?: string;
  rechecker?: string;
}

const initialDisposalRecords: DisposalRecord[] = [
  {
    id: 1,
    alertType: '高空抛物',
    alertTitle: '3号楼高空抛物检测告警',
    location: '3号楼南侧',
    handler: '物业管理员',
    handleTime: '2024-06-08 09:30',
    handleNote: '已到现场查看，发现丢弃的外卖盒，已调取监控锁定责任人，已上门教育并罚款200元',
    recheckStatus: 'passed',
    recheckTime: '2024-06-08 14:00',
    rechecker: '物业主管'
  },
  {
    id: 2,
    alertType: '消防通道占压',
    alertTitle: 'B1层消防通道被占用',
    location: 'B1层消防通道03',
    handler: '物业管理员',
    handleTime: '2024-06-08 08:15',
    handleNote: '已联系车主移车，已清理通道杂物，对车主进行消防安全教育',
    recheckStatus: 'passed',
    recheckTime: '2024-06-08 12:00',
    rechecker: '物业主管'
  },
  {
    id: 3,
    alertType: '设备离线',
    alertTitle: '2号楼单元门门禁离线',
    location: '2号楼单元门',
    handler: '物业管理员',
    handleTime: '2024-06-08 07:00',
    handleNote: '已派技术人员现场排查，发现电源故障，已更换电源模块',
    recheckStatus: 'pending',
  },
  {
    id: 4,
    alertType: '异常访客',
    alertTitle: '同一访客24h内出入5次以上',
    location: '小区大门',
    handler: '物业管理员',
    handleTime: '2024-06-07 16:30',
    handleNote: '已联系业主核实，确认为业主预约的家政服务人员，已排除风险',
    recheckStatus: 'passed',
    recheckTime: '2024-06-07 18:00',
    rechecker: '物业主管'
  },
];

interface PropertyKPIData {
  kpi: KPIData;
  workOrderTrend: { date: string; count: number }[];
  workOrderByType: { type: string; count: number }[];
  workOrderByStatus: { status: string; count: number }[];
}

interface KPICardProps {
  title: string;
  value: number | string;
  percentage?: number;
  icon: React.ReactNode;
  trend?: number;
  color: string;
}

const typeLabels: Record<string, string> = {
  repair: '维修',
  complaint: '投诉',
  suggestion: '建议',
  consultation: '咨询',
  other: '其他',
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const KPICard: React.FC<KPICardProps> = ({ title, value, percentage, icon, trend, color }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    <p className="text-gray-500 text-sm mb-1">{title}</p>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
    {percentage !== undefined && (
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>达标率</span>
          <span className="font-medium">{percentage}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentage >= 90 ? 'bg-green-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )}
  </div>
);

const PropertyDashboard: React.FC = () => {
  const [kpiData, setKpiData] = useState<PropertyKPIData | null>(null);
  const [alerts, setAlerts] = useState<AlertWithExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todayNewOrders] = useState(12);
  const [showAlertDetail, setShowAlertDetail] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertWithExtra | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [disposalRecords, setDisposalRecords] = useState<DisposalRecord[]>(initialDisposalRecords);

  const getAlertTypeIcon = (type: string) => {
    if (type.includes('高空抛物')) return <ShieldAlert className="w-5 h-5 text-red-500" />;
    if (type.includes('消防')) return <Flame className="w-5 h-5 text-orange-500" />;
    if (type.includes('设备') || type.includes('离线')) return <WifiOff className="w-5 h-5 text-yellow-500" />;
    if (type.includes('访客')) return <AlertTriangle className="w-5 h-5 text-purple-500" />;
    return <AlertCircle className="w-5 h-5 text-blue-500" />;
  };

  const handleViewAlert = (alert: AlertWithExtra) => {
    setSelectedAlert(alert);
    setShowAlertDetail(true);
  };

  const handleResolveAlert = async (alertId: number, note: string) => {
    setActionLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setShowAlertDetail(false);
      setSelectedAlert(null);
      alert('告警已处置');
    } catch (err) {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecheck = async (recordId: number) => {
    if (!confirm('确认复查通过吗？')) return;
    setActionLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setDisposalRecords(prev => prev.map(r => 
        r.id === recordId ? { 
          ...r, 
          recheckStatus: 'passed', 
          recheckTime: new Date().toLocaleString('zh-CN'),
          rechecker: '物业管理员'
        } : r
      ));
      alert('复查通过');
    } catch (err) {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [kpiRes, alertsRes] = await Promise.all([
          analyticsApi.getPropertyKPI(),
          riskApi.getAlerts({ status: 'pending,processing' }),
        ]) as [ApiResponse<PropertyKPIData>, ApiResponse<Alert[]>];

        if (kpiRes.success && kpiRes.data) {
          setKpiData(kpiRes.data);
        }
        if (alertsRes.success && alertsRes.data) {
          setAlerts(alertsRes.data.slice(0, 5));
        }
      } catch (err: any) {
        setError(err.response?.data?.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getLast7DaysTrend = () => {
    if (!kpiData?.workOrderTrend) return [];
    return kpiData.workOrderTrend.slice(-7).map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    }));
  };

  const getWorkOrderTypeData = () => {
    if (!kpiData?.workOrderByType) return [];
    return kpiData.workOrderByType.map(item => ({
      name: typeLabels[item.type] || item.type,
      value: item.count,
    }));
  };

  const getDeviceStatusData = () => {
    if (!kpiData?.kpi) return [];
    const onlineRate = kpiData.kpi.deviceOnlineRate;
    const offlineRate = 100 - onlineRate;
    return [
      { name: '在线', value: Math.round(onlineRate * 0.85), fill: '#10B981' },
      { name: '离线', value: Math.round(offlineRate * 0.85), fill: '#EF4444' },
      { name: '维护中', value: 15, fill: '#F59E0B' },
    ];
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">物业KPI驾驶舱</h1>
        <p className="text-sm text-gray-500">
          数据更新时间: {new Date().toLocaleString('zh-CN')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="工单及时率"
          value={`${kpiData?.kpi.workOrderTimelyRate || 0}%`}
          percentage={kpiData?.kpi.workOrderTimelyRate || 0}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          trend={2.5}
          color="bg-green-500"
        />
        <KPICard
          title="投诉闭环率"
          value={`${kpiData?.kpi.complaintCloseRate || 0}%`}
          percentage={kpiData?.kpi.complaintCloseRate || 0}
          icon={<MessageSquare className="w-6 h-6 text-white" />}
          trend={5.2}
          color="bg-blue-500"
        />
        <KPICard
          title="设备在线率"
          value={`${kpiData?.kpi.deviceOnlineRate || 0}%`}
          percentage={kpiData?.kpi.deviceOnlineRate || 0}
          icon={<Wrench className="w-6 h-6 text-white" />}
          trend={-1.3}
          color="bg-purple-500"
        />
        <KPICard
          title="今日新工单"
          value={todayNewOrders}
          icon={<Clock className="w-6 h-6 text-white" />}
          trend={8}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">工单趋势图</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getLast7DaysTrend()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="工单数"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">工单类型分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getWorkOrderTypeData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getWorkOrderTypeData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">设备状态分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getDeviceStatusData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={12} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" name="设备数" radius={[0, 4, 4, 0]}>
                  {getDeviceStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">近期告警</h3>
            <button className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
              查看全部 <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <CheckCircle className="w-12 h-12 mb-2" />
                <p>暂无待处理告警</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => handleViewAlert(alert)}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertTypeIcon(alert.title)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-800 text-sm truncate">{alert.title}</h4>
                      <StatusBadge status={alert.level} />
                    </div>
                    <p className="text-gray-500 text-sm mb-1 line-clamp-1">{alert.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <HelpCircle className="w-3 h-3" />
                        <span>{alert.location}</span>
                        <span>·</span>
                        <span>{new Date(alert.occurred_at).toLocaleString('zh-CN')}</span>
                      </div>
                      <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        处置
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">工单统计概览</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {kpiData?.workOrderByStatus.map(item => (
            <div key={item.status} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{item.count}</p>
              <p className="text-sm text-gray-500 mt-1">
                {item.status === 'pending' ? '待处理' :
                 item.status === 'assigned' ? '已派单' :
                 item.status === 'processing' ? '处理中' :
                 item.status === 'completed' ? '已完成' :
                 item.status === 'closed' ? '已关闭' : item.status}
              </p>
            </div>
          ))}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{kpiData?.kpi.totalWorkOrders || 0}</p>
            <p className="text-sm text-blue-500 mt-1">总工单数</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            风险处置记录与复查
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              已复查通过 {disposalRecords.filter(r => r.recheckStatus === 'passed').length}
            </span>
            <span className="text-orange-600 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              待复查 {disposalRecords.filter(r => r.recheckStatus === 'pending').length}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          {disposalRecords.map((record) => (
            <div key={record.id} className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  {getAlertTypeIcon(record.alertTitle)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-800">{record.alertTitle}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.recheckStatus === 'passed' ? 'bg-green-100 text-green-600' :
                        record.recheckStatus === 'pending' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {record.recheckStatus === 'passed' ? '复查通过' :
                         record.recheckStatus === 'pending' ? '待复查' : '复查未通过'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {record.location} · 处置人：{record.handler} · {record.handleTime}
                    </p>
                  </div>
                </div>
                {record.recheckStatus === 'pending' && (
                  <button
                    onClick={() => handleRecheck(record.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    去复查
                  </button>
                )}
                {record.recheckStatus === 'passed' && (
                  <div className="text-right text-xs text-gray-500">
                    <p>复查人：{record.rechecker}</p>
                    <p>{record.recheckTime}</p>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-xs text-gray-500 mb-1">处置措施：</p>
                <p className="text-sm text-gray-700">{record.handleNote}</p>
              </div>
              {record.recheckStatus === 'passed' && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium text-sm">复查结论：问题已解决，无遗留风险</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showAlertDetail && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {getAlertTypeIcon(selectedAlert.title)}
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedAlert.title}</h2>
                  <p className="text-sm text-gray-500">{selectedAlert.location}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAlertDetail(false); setSelectedAlert(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">告警级别</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    selectedAlert.level === 'critical' || selectedAlert.level === 'high' ? 'bg-red-100 text-red-600' :
                    selectedAlert.level === 'medium' ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {selectedAlert.level === 'critical' ? '严重' :
                     selectedAlert.level === 'high' ? '高危' :
                     selectedAlert.level === 'medium' ? '中危' : '低危'}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">发生时间</p>
                  <p className="font-medium text-gray-800">{new Date(selectedAlert.occurred_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-500 mb-1">告警描述</p>
                <p className="text-gray-700">{selectedAlert.description}</p>
              </div>

              {selectedAlert.level === 'critical' || selectedAlert.level === 'high' ? (
                <div className="bg-red-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">紧急处置建议</span>
                  </div>
                  <ul className="text-sm text-red-600 space-y-1 ml-7 list-disc">
                    <li>立即前往现场核实情况</li>
                    <li>如需支援立即联系安防或消防部门</li>
                    <li>留存现场照片和视频证据</li>
                    <li>处置完成后填写处置记录并提交复查</li>
                  </ul>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-yellow-700 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">处置建议</span>
                  </div>
                  <ul className="text-sm text-yellow-600 space-y-1 ml-7 list-disc">
                    <li>30分钟内前往现场核实</li>
                    <li>联系相关责任人进行处理</li>
                    <li>记录处置过程和结果</li>
                    <li>处置完成后提交复查</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAlertDetail(false); setSelectedAlert(null); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  稍后处理
                </button>
                <button
                  onClick={() => handleResolveAlert(selectedAlert.id, '已现场核实并处置')}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? '处置中...' : '标记已处置'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDashboard;
