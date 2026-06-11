import { useState } from 'react';
import {
  BarChart3,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Eye,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Clock,
  Activity,
  DollarSign,
  Users,
  ChevronRight,
} from 'lucide-react';
import Modal from '@/components/Modal';
import { mockFundAlerts, mockFundTrend } from '@/data/mock';
import {
  formatCurrency,
  getAlertLevelColor,
  getAlertLevelText,
} from '@/utils/format';
import type { FundAlert } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#c8102e', '#3b82f6', '#10b981', '#f59e0b'];

export default function FundMonitor() {
  const [alerts, setAlerts] = useState<FundAlert[]>(mockFundAlerts);
  const [selectedAlert, setSelectedAlert] = useState<FundAlert | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchCity, setSearchCity] = useState('');

  const pieData = [
    { name: '养老保险', value: 16500 },
    { name: '医疗保险', value: 9400 },
    { name: '失业保险', value: 2800 },
    { name: '工伤保险', value: 450 },
  ];

  const filtered = alerts.filter((a) => {
    if (levelFilter && a.alertLevel !== levelFilter) return false;
    if (statusFilter === 'handled' && !a.isHandled) return false;
    if (statusFilter === 'pending' && a.isHandled) return false;
    if (searchCity && !a.city.includes(searchCity)) return false;
    return true;
  });

  const pendingCount = alerts.filter((a) => !a.isHandled).length;
  const dangerCount = alerts.filter((a) => a.alertLevel === 'danger' && !a.isHandled).length;

  const handleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isHandled: true } : a))
    );
    setSelectedAlert(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gov-red" />
            社保基金运行异常监测
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            实时监测基金收支异动 · 单日大额提现频次突增自动告警
          </p>
        </div>
        <button className="gov-btn-secondary inline-flex items-center gap-1.5 text-sm">
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: '今日基金收入（万元）',
            value: '28,960',
            delta: '+5.2%',
            trend: 'up',
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: '今日基金支出（万元）',
            value: '21,430',
            delta: '+8.7%',
            trend: 'up',
            icon: TrendingDown,
            color: 'text-red-600',
            bg: 'bg-red-50',
          },
          {
            label: '待处理告警',
            value: pendingCount.toString(),
            delta: `${dangerCount} 条严重`,
            trend: 'warn',
            icon: AlertTriangle,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          },
          {
            label: '监测地市',
            value: '11',
            delta: '全覆盖',
            trend: 'ok',
            icon: MapPin,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="gov-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1.5">{s.value}</p>
                </div>
                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <div className={`text-xs mt-3 flex items-center gap-1 ${s.color}`}>
                {s.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                {s.trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                {s.trend === 'warn' && <AlertTriangle className="w-3.5 h-3.5" />}
                {s.trend === 'ok' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {s.delta}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 gov-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-800">基金收支趋势（万元）</h3>
              <p className="text-xs text-gray-500 mt-0.5">近 6 个月各险种支出情况</p>
            </div>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockFundTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="pension"
                  name="养老保险"
                  stroke="#c8102e"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="medical"
                  name="医疗保险"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="unemployment"
                  name="失业保险"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="injury"
                  name="工伤保险"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gov-card p-6">
          <h3 className="font-semibold text-gray-800 mb-5">基金支出结构（本月）</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    fontSize: '12px',
                  }}
                  formatter={(v: number) => [`${v.toLocaleString()} 万元`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {pieData.map((p, idx) => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: COLORS[idx] }}
                ></span>
                <span className="text-gray-600">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="gov-card p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              告警记录
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              系统自动识别异常模式 · 人工复核处置
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索地市..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md w-40 focus:outline-none focus:ring-2 focus:ring-gov-red/30 focus:border-gov-red"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gov-red/30 focus:border-gov-red"
            >
              <option value="">全部级别</option>
              <option value="danger">严重</option>
              <option value="warning">警告</option>
              <option value="info">提示</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gov-red/30 focus:border-gov-red"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="handled">已处置</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-xl p-4 transition hover:shadow-sm ${getAlertLevelColor(
                alert.alertLevel
              )}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.alertLevel === 'danger'
                        ? 'bg-red-100 text-red-600'
                        : alert.alertLevel === 'warning'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {alert.alertType === 'withdrawal_spike' ? (
                      <DollarSign className="w-5 h-5" />
                    ) : alert.alertType === 'abnormal_pattern' ? (
                      <Activity className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          alert.alertLevel === 'danger'
                            ? 'bg-red-200 text-red-800'
                            : alert.alertLevel === 'warning'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-blue-200 text-blue-800'
                        }`}
                      >
                        {getAlertLevelText(alert.alertLevel)}
                      </span>
                      {alert.isHandled ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          已处置
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          待处理
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1 opacity-85">{alert.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs opacity-80 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {alert.city}
                      </span>
                      {alert.amount && (
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          涉及金额 {formatCurrency(alert.amount)}
                        </span>
                      )}
                      {alert.count && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {alert.count} 笔
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.triggeredAt}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="text-sm text-gov-red hover:underline inline-flex items-center gap-1 flex-shrink-0"
                >
                  <Eye className="w-4 h-4" />
                  详情
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>暂无匹配的告警记录</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title="告警详情"
        width="max-w-xl"
        footer={
          selectedAlert && !selectedAlert.isHandled ? (
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedAlert(null)} className="gov-btn-secondary">
                暂不处置
              </button>
              <button
                onClick={() => selectedAlert && handleAlert(selectedAlert.id)}
                className="gov-btn-primary inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                标记为已处置
              </button>
            </div>
          ) : undefined
        }
      >
        {selectedAlert && (
          <div className="space-y-5">
            <div
              className={`p-4 rounded-lg border ${getAlertLevelColor(selectedAlert.alertLevel)}`}
            >
              <div className="flex items-start gap-3">
                {selectedAlert.alertLevel === 'danger' ? (
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                ) : selectedAlert.alertLevel === 'warning' ? (
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                ) : (
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold">{selectedAlert.title}</h4>
                  <p className="text-sm mt-1 opacity-85">{selectedAlert.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">告警级别</p>
                <p className="font-medium mt-0.5">
                  {getAlertLevelText(selectedAlert.alertLevel)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">触发时间</p>
                <p className="font-medium mt-0.5 font-mono text-xs">
                  {selectedAlert.triggeredAt}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">所属地市</p>
                <p className="font-medium mt-0.5">{selectedAlert.city}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">告警类型</p>
                <p className="font-medium mt-0.5">
                  {selectedAlert.alertType === 'withdrawal_spike'
                    ? '大额提现频次突增'
                    : selectedAlert.alertType === 'abnormal_pattern'
                    ? '异常模式识别'
                    : '余额预警'}
                </p>
              </div>
              {selectedAlert.amount && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">涉及金额</p>
                  <p className="font-medium mt-0.5 text-gov-red">
                    {formatCurrency(selectedAlert.amount)}
                  </p>
                </div>
              )}
              {selectedAlert.count && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">涉及笔数</p>
                  <p className="font-medium mt-0.5">{selectedAlert.count} 笔</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-medium flex items-center gap-1">
                <ChevronRight className="w-4 h-4" />
                建议处置措施
              </p>
              <ul className="text-xs mt-2 space-y-1 list-disc list-inside text-blue-700">
                <li>核实涉及交易明细，确认是否为真实业务行为；</li>
                <li>比对历史同期数据，评估异常偏离程度；</li>
                <li>如有必要，联系属地社保经办机构现场核查；</li>
                <li>涉嫌违规的，移交稽核部门立案调查。</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
