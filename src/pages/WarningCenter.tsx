import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  Phone,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Wrench,
  Eye,
  ChevronDown,
  Search,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Plus,
  X,
  Zap,
  TrendingUp,
  ShieldAlert,
  User,
} from 'lucide-react';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import Tabs, { TabPanel } from '@/components/Tabs';
import StatCard from '@/components/StatCard';
import { cn } from '@/lib/utils';

interface WarningEvent {
  id: string;
  user_id: string;
  user_name: string;
  account_no: string;
  address: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  trigger_rule: string;
  detected_at: string;
  status: 'active' | 'acknowledged' | 'resolved';
  outbound_call_made: number;
  outbound_call_result: string | null;
  work_order_id: string | null;
}

interface WarningRule {
  id: string;
  name: string;
  type: string;
  threshold: number;
  unit: string;
  severity: 'info' | 'warning' | 'critical';
  auto_create_work_order: number;
  auto_outbound_call: number;
  enabled: number;
}

interface OutboundCallRecord {
  id: string;
  warning_id: string;
  user_name: string;
  phone: string;
  call_time: string;
  status: 'success' | 'failed' | 'no_answer';
  duration?: number;
  result?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ListResponse {
  list: WarningEvent[];
  total: number;
  page: number;
  pageSize: number;
}

const severityConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; bg: string; text: string; dot: string; icon: typeof Info }> = {
  critical: {
    label: '紧急',
    variant: 'danger',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    icon: AlertTriangle,
  },
  warning: {
    label: '警告',
    variant: 'warning',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    icon: AlertCircle,
  },
  info: {
    label: '提示',
    variant: 'info',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    icon: Info,
  },
};

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  active: { label: '活跃', variant: 'danger' },
  acknowledged: { label: '已确认', variant: 'warning' },
  resolved: { label: '已解决', variant: 'success' },
};

const typeLabels: Record<string, string> = {
  zero_usage: '零用气',
  spike: '用量突增',
  leak_suspect: '疑似泄漏',
  high_usage: '高用量',
  meter_anomaly: '表具异常',
  valve_anomaly: '阀门异常',
  other: '其他',
};

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function WarningCenter() {
  const [warnings, setWarnings] = useState<WarningEvent[]>([]);
  const [rules, setRules] = useState<WarningRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchText, setSearchText] = useState('');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<WarningRule | null>(null);
  const [selectedWarning, setSelectedWarning] = useState<WarningEvent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [outboundRecords] = useState<OutboundCallRecord[]>([
    { id: 'call-1', warning_id: 'w1', user_name: '张三', phone: '138****1234', call_time: '2024-01-15 10:30:00', status: 'success', duration: 125, result: '用户已了解情况' },
    { id: 'call-2', warning_id: 'w2', user_name: '李四', phone: '139****5678', call_time: '2024-01-15 09:15:00', status: 'no_answer', result: '无人接听' },
    { id: 'call-3', warning_id: 'w3', user_name: '王五', phone: '137****9012', call_time: '2024-01-15 08:45:00', status: 'success', duration: 89, result: '同意上门检查' },
  ]);

  const [ruleForm, setRuleForm] = useState({
    name: '',
    type: 'leak_suspect',
    threshold: 0,
    unit: '%',
    severity: 'warning' as 'info' | 'warning' | 'critical',
    auto_create_work_order: false,
    auto_outbound_call: false,
    enabled: true,
  });
  const [savingRule, setSavingRule] = useState(false);

  const stats = {
    critical: warnings.filter((w) => w.severity === 'critical').length,
    warning: warnings.filter((w) => w.severity === 'warning').length,
    info: warnings.filter((w) => w.severity === 'info').length,
    active: warnings.filter((w) => w.status === 'active').length,
  };

  const fetchWarnings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (severityFilter) params.append('severity', severityFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchText) params.append('search', searchText);

      const res = await fetch(`/api/warnings?${params}`);
      const data: ApiResponse<ListResponse> = await res.json();

      if (data.success) {
        setWarnings(data.data.list);
        setTotal(data.data.total);
      }
    } catch (err) {
      console.error('获取预警列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter, searchText, page, pageSize]);

  const fetchRules = useCallback(async () => {
    try {
      setRulesLoading(true);
      const res = await fetch('/api/warnings/rules');
      const data: ApiResponse<WarningRule[]> = await res.json();

      if (data.success) {
        setRules(data.data);
      }
    } catch (err) {
      console.error('获取预警规则失败:', err);
    } finally {
      setRulesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarnings();
    fetchRules();
  }, [fetchWarnings, fetchRules]);

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await fetch(`/api/warnings/${id}/acknowledge`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        fetchWarnings();
      }
    } catch (err) {
      console.error('确认预警失败:', err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/warnings/${id}/resolve`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        fetchWarnings();
      }
    } catch (err) {
      console.error('解决预警失败:', err);
    }
  };

  const handleCreateWorkOrder = async (warning: WarningEvent) => {
    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: warning.user_id,
          type: 'inspection',
          title: `安全预警：${warning.message}`,
          description: `预警来源：${typeLabels[warning.type] || warning.type}\n预警详情：${warning.message}\n触发规则：${warning.trigger_rule}`,
          priority: warning.severity === 'critical' ? 'urgent' : warning.severity === 'warning' ? 'high' : 'medium',
          warning_id: warning.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        alert('工单创建成功');
        fetchWarnings();
      } else {
        alert(data.error || '创建工单失败');
      }
    } catch (err) {
      alert('创建工单失败');
    }
  };

  const handleToggleRule = async (rule: WarningRule) => {
    try {
      const updatedRule = {
        ...rule,
        enabled: rule.enabled ? 0 : 1,
      };

      const res = await fetch('/api/warnings/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRule),
      });
      const data = await res.json();

      if (data.success) {
        fetchRules();
      }
    } catch (err) {
      console.error('切换规则状态失败:', err);
    }
  };

  const handleOpenEditRule = (rule?: WarningRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        name: rule.name,
        type: rule.type,
        threshold: rule.threshold,
        unit: rule.unit,
        severity: rule.severity,
        auto_create_work_order: !!rule.auto_create_work_order,
        auto_outbound_call: !!rule.auto_outbound_call,
        enabled: !!rule.enabled,
      });
    } else {
      setEditingRule(null);
      setRuleForm({
        name: '',
        type: 'leak_suspect',
        threshold: 0,
        unit: '%',
        severity: 'warning',
        auto_create_work_order: false,
        auto_outbound_call: false,
        enabled: true,
      });
    }
    setShowRuleModal(true);
  };

  const handleSaveRule = async () => {
    if (!ruleForm.name) {
      alert('请输入规则名称');
      return;
    }

    try {
      setSavingRule(true);
      const res = await fetch('/api/warnings/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRule?.id,
          ...ruleForm,
          auto_create_work_order: ruleForm.auto_create_work_order ? 1 : 0,
          auto_outbound_call: ruleForm.auto_outbound_call ? 1 : 0,
          enabled: ruleForm.enabled ? 1 : 0,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowRuleModal(false);
        fetchRules();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (err) {
      alert('保存失败');
    } finally {
      setSavingRule(false);
    }
  };

  const tabItems = [
    { key: 'events', label: '预警事件', icon: Bell },
    { key: 'rules', label: '规则配置', icon: Settings },
    { key: 'calls', label: '外呼记录', icon: Phone },
  ];

  const severityFilters = [
    { key: '', label: '全部' },
    { key: 'critical', label: '紧急' },
    { key: 'warning', label: '警告' },
    { key: 'info', label: '提示' },
  ];

  const statusFilters = [
    { key: 'active', label: '活跃' },
    { key: 'acknowledged', label: '已确认' },
    { key: 'resolved', label: '已解决' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">安全预警中心</h1>
          <p className="text-sm text-gray-500 mt-1">监控和处理燃气安全预警事件</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="紧急预警"
          value={stats.critical}
          icon={ShieldAlert}
          variant="warning"
          changeLabel="今日"
        />
        <StatCard
          title="警告预警"
          value={stats.warning}
          icon={AlertTriangle}
          variant="warning"
          changeLabel="今日"
        />
        <StatCard
          title="提示预警"
          value={stats.info}
          icon={Info}
          variant="info"
          changeLabel="今日"
        />
        <StatCard
          title="待处理"
          value={stats.active}
          icon={Clock}
          variant="accent"
          changeLabel="活跃"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <Tabs items={tabItems} defaultActiveKey="events">
          <TabPanel tabKey="events">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 pb-4">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {statusFilters.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => {
                        setStatusFilter(filter.key);
                        setPage(1);
                      }}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                        statusFilter === filter.key
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 flex items-center gap-3 min-w-[200px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索用户、户号或地址..."
                      value={searchText}
                      onChange={(e) => {
                        setSearchText(e.target.value);
                        setPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-1">
                      {severityFilters.map((filter) => (
                        <button
                          key={filter.key || 'all'}
                          onClick={() => {
                            setSeverityFilter(filter.key);
                            setPage(1);
                          }}
                          className={cn(
                            'px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                            severityFilter === filter.key
                              ? `${severityConfig[filter.key]?.bg || 'bg-gray-100'} ${severityConfig[filter.key]?.text || 'text-gray-700'}`
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                          )}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        预警信息
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        用户信息
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        严重程度
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        检测时间
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 px-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="h-6 bg-gray-200 rounded w-16" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="h-6 bg-gray-200 rounded w-16" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="h-4 bg-gray-200 rounded w-24" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="h-8 bg-gray-200 rounded w-20 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : warnings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">暂无预警数据</p>
                        </td>
                      </tr>
                    ) : (
                      warnings.map((warning) => {
                        const severity = severityConfig[warning.severity];
                        const status = statusConfig[warning.status];
                        const SeverityIcon = severity.icon;

                        return (
                          <tr
                            key={warning.id}
                            className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedWarning(warning);
                              setShowDetailModal(true);
                            }}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-start gap-3">
                                <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', severity.dot)} />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800 line-clamp-1">
                                    {warning.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {typeLabels[warning.type] || warning.type}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="text-sm text-gray-700">{warning.user_name}</p>
                                <p className="text-xs text-gray-400 font-mono">{warning.account_no}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <StatusBadge variant={severity.variant} icon>
                                {severity.label}
                              </StatusBadge>
                            </td>
                            <td className="py-4 px-4">
                              <StatusBadge variant={status.variant}>
                                {status.label}
                              </StatusBadge>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-600">
                                {formatTimeAgo(warning.detected_at)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatDateTime(warning.detected_at)}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end gap-2">
                                {warning.status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={CheckCircle}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAcknowledge(warning.id);
                                    }}
                                  >
                                    确认
                                  </Button>
                                )}
                                {warning.status !== 'resolved' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={Wrench}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCreateWorkOrder(warning);
                                    }}
                                  >
                                    生成工单
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  icon={Eye}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWarning(warning);
                                    setShowDetailModal(true);
                                  }}
                                >
                                  详情
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {total > pageSize && (
                <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-50">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-500">
                    第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(total / pageSize)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel tabKey="rules">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-base font-semibold text-gray-800">预警规则配置</h3>
                <Button icon={Plus} onClick={() => handleOpenEditRule()}>
                  新建规则
                </Button>
              </div>

              {rulesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-xl p-5 animate-pulse"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-5 bg-gray-200 rounded w-32" />
                          <div className="h-4 bg-gray-200 rounded w-48" />
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => {
                    const severity = severityConfig[rule.severity];

                    return (
                      <div
                        key={rule.id}
                        className={cn(
                          'bg-gray-50 rounded-xl p-5 transition-all',
                          rule.enabled ? 'opacity-100' : 'opacity-60'
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-base font-semibold text-gray-800">
                                {rule.name}
                              </h4>
                              <StatusBadge variant={severity.variant}>
                                {severity.label}
                              </StatusBadge>
                              <span className="text-xs text-gray-400">
                                {typeLabels[rule.type] || rule.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="text-gray-400">阈值：</span>
                                <span className="font-medium text-gray-700">
                                  {rule.threshold}{rule.unit}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Zap className={cn('w-4 h-4', rule.auto_create_work_order ? 'text-accent-500' : 'text-gray-300')} />
                                <span className={rule.auto_create_work_order ? 'text-gray-700' : 'text-gray-400'}>
                                  自动派单
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className={cn('w-4 h-4', rule.auto_outbound_call ? 'text-primary-500' : 'text-gray-300')} />
                                <span className={rule.auto_outbound_call ? 'text-gray-700' : 'text-gray-400'}>
                                  自动外呼
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                              onClick={() => handleToggleRule(rule)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {rule.enabled ? (
                                <ToggleRight className="w-8 h-8 text-primary-500" />
                              ) : (
                                <ToggleLeft className="w-8 h-8 text-gray-300" />
                              )}
                            </button>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={Edit2}
                              onClick={() => handleOpenEditRule(rule)}
                            >
                              编辑
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel tabKey="calls">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 pb-2">外呼记录</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        用户
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        电话号码
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        呼叫时间
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        时长
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        结果
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {outboundRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {record.user_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600 font-mono">{record.phone}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{record.call_time}</span>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge
                            variant={
                              record.status === 'success'
                                ? 'success'
                                : record.status === 'no_answer'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {record.status === 'success'
                              ? '接通'
                              : record.status === 'no_answer'
                              ? '未接听'
                              : '失败'}
                          </StatusBadge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">
                            {record.duration ? `${Math.floor(record.duration / 60)}分${record.duration % 60}秒` : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{record.result || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>

      <Modal
        open={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        title={editingRule ? '编辑预警规则' : '新建预警规则'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowRuleModal(false)}>
              取消
            </Button>
            <Button onClick={handleSaveRule} loading={savingRule}>
              保存
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              规则名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ruleForm.name}
              onChange={(e) => setRuleForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="请输入规则名称"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                预警类型
              </label>
              <select
                value={ruleForm.type}
                onChange={(e) => setRuleForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="zero_usage">零用气</option>
                <option value="spike">用量突增</option>
                <option value="leak_suspect">疑似泄漏</option>
                <option value="high_usage">高用量</option>
                <option value="meter_anomaly">表具异常</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                严重程度
              </label>
              <select
                value={ruleForm.severity}
                onChange={(e) => setRuleForm((f) => ({ ...f, severity: e.target.value as 'info' | 'warning' | 'critical' }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="info">提示</option>
                <option value="warning">警告</option>
                <option value="critical">紧急</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                阈值
              </label>
              <input
                type="number"
                value={ruleForm.threshold}
                onChange={(e) => setRuleForm((f) => ({ ...f, threshold: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                单位
              </label>
              <input
                type="text"
                value={ruleForm.unit}
                onChange={(e) => setRuleForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="如: %, m³, 天"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-sm font-medium text-gray-700">
              自动化设置
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleForm.auto_create_work_order}
                  onChange={(e) => setRuleForm((f) => ({ ...f, auto_create_work_order: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">自动生成工单</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleForm.auto_outbound_call}
                  onChange={(e) => setRuleForm((f) => ({ ...f, auto_outbound_call: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">自动外呼通知</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleForm.enabled}
                  onChange={(e) => setRuleForm((f) => ({ ...f, enabled: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">启用规则</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="预警详情"
        size="lg"
      >
        {selectedWarning && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const SeverityIcon = severityConfig[selectedWarning.severity].icon;
                    return (
                      <SeverityIcon
                        className={cn(
                          'w-6 h-6',
                          selectedWarning.severity === 'critical'
                            ? 'text-red-500'
                            : selectedWarning.severity === 'warning'
                            ? 'text-amber-500'
                            : 'text-blue-500'
                        )}
                      />
                    );
                  })()}
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedWarning.message}
                  </h2>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge variant={severityConfig[selectedWarning.severity].variant} icon>
                    {severityConfig[selectedWarning.severity].label}
                  </StatusBadge>
                  <StatusBadge variant={statusConfig[selectedWarning.status].variant}>
                    {statusConfig[selectedWarning.status].label}
                  </StatusBadge>
                  <span className="text-sm text-gray-400">
                    {typeLabels[selectedWarning.type] || selectedWarning.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">用户信息</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">姓名</span>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedWarning.user_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">户号</span>
                    <span className="text-sm font-medium text-gray-700 font-mono">
                      {selectedWarning.account_no}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm text-gray-500 flex-shrink-0">地址</span>
                    <span className="text-sm text-gray-700 text-right">
                      {selectedWarning.address}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">预警信息</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">检测时间</span>
                    <span className="text-sm text-gray-700">
                      {formatDateTime(selectedWarning.detected_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">触发规则</span>
                    <span className="text-sm font-mono text-gray-700">
                      {selectedWarning.trigger_rule}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">外呼状态</span>
                    <span className="text-sm text-gray-700">
                      {selectedWarning.outbound_call_made ? '已外呼' : '未外呼'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">预警描述</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedWarning.message}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {selectedWarning.status === 'active' && (
                <Button
                  variant="secondary"
                  icon={CheckCircle}
                  onClick={() => {
                    handleAcknowledge(selectedWarning.id);
                    setShowDetailModal(false);
                  }}
                >
                  确认预警
                </Button>
              )}
              {selectedWarning.status !== 'resolved' && (
                <Button
                  icon={Wrench}
                  onClick={() => {
                    handleCreateWorkOrder(selectedWarning);
                    setShowDetailModal(false);
                  }}
                >
                  生成工单
                </Button>
              )}
              {selectedWarning.status === 'acknowledged' && (
                <Button
                  icon={CheckCircle}
                  onClick={() => {
                    handleResolve(selectedWarning.id);
                    setShowDetailModal(false);
                  }}
                >
                  标记已解决
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
