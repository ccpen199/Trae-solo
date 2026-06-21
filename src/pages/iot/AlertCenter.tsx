import { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Thermometer,
  Gauge,
  Wifi,
  HardDrive,
  Clock,
  CheckCircle,
  AlertCircle,
  Wrench,
  ChevronDown,
  ChevronUp,
  User,
  ShieldCheck,
  UserCheck,
  Activity,
  PlusCircle,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { alerts, alertHandlingRecords } from '@/data/mockData';
import { useAppStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import type { Alert, AlertHandlingRecord } from '@/types';

const levelMap = {
  low: { label: '低', color: 'bg-cyber-500/20 text-cyber-400', border: 'border-cyber-500' },
  medium: { label: '中', color: 'bg-yellow-500/20 text-yellow-400', border: 'border-yellow-500' },
  high: { label: '高', color: 'bg-neon-orange/20 text-neon-orange', border: 'border-neon-orange' },
  critical: { label: '严重', color: 'bg-neon-red/20 text-neon-red', border: 'border-neon-red' },
};

const statusMap = {
  pending: { label: '待处理', color: 'bg-neon-red/20 text-neon-red' },
  processing: { label: '处理中', color: 'bg-neon-orange/20 text-neon-orange' },
  resolved: { label: '已解决', color: 'bg-neon-green/20 text-neon-green' },
};

const typeMap: Record<string, { label: string; icon: any }> = {
  temperature: { label: '温度异常', icon: Thermometer },
  performance: { label: '性能下降', icon: Gauge },
  network: { label: '网络问题', icon: Wifi },
  hardware: { label: '硬件故障', icon: HardDrive },
};

const actionMap: Record<string, { label: string; icon: any; color: string }> = {
  create: { label: '告警创建', icon: AlertTriangle, color: 'text-neon-red' },
  assign: { label: '指派处理', icon: UserCheck, color: 'text-cyber-400' },
  start: { label: '开始处理', icon: Wrench, color: 'text-neon-orange' },
  escalate: { label: '升级告警', icon: AlertCircle, color: 'text-neon-red' },
  resolve: { label: '标记解决', icon: CheckCircle, color: 'text-neon-green' },
  reopen: { label: '重新打开', icon: RotateCcw, color: 'text-yellow-400' },
  close: { label: '关闭告警', icon: ShieldCheck, color: 'text-cyber-500' },
  review: { label: '复查通过', icon: Eye, color: 'text-neon-purple' },
};

const levelOptions = ['全部等级', '低', '中', '高', '严重'];
const statusOptions = ['全部状态', '待处理', '处理中', '已解决'];
const typeOptions = ['全部类型', '温度异常', '性能下降', '网络问题', '硬件故障'];

export default function AlertCenter() {
  const { currentStoreId } = useAppStore();
  const [selectedLevel, setSelectedLevel] = useState('全部等级');
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [selectedType, setSelectedType] = useState('全部类型');
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localAlerts, setLocalAlerts] = useState<Alert[]>(alerts);
  const [localRecords, setLocalRecords] = useState<AlertHandlingRecord[]>(alertHandlingRecords);

  const storeAlerts = localAlerts.filter((a) => a.storeId === currentStoreId);

  const filteredAlerts = storeAlerts.filter((alert) => {
    const levelKey = selectedLevel === '全部等级' ? '' :
      Object.entries(levelMap).find(([, v]) => v.label === selectedLevel)?.[0] || '';
    const statusKey = selectedStatus === '全部状态' ? '' :
      Object.entries(statusMap).find(([, v]) => v.label === selectedStatus)?.[0] || '';
    const typeKey = selectedType === '全部类型' ? '' :
      Object.entries(typeMap).find(([, v]) => v.label === selectedType)?.[0] || '';

    const matchLevel = !levelKey || alert.level === levelKey;
    const matchStatus = !statusKey || alert.status === statusKey;
    const matchType = !typeKey || alert.type === typeKey;
    const matchSearch = !searchText ||
      alert.deviceName.toLowerCase().includes(searchText.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchText.toLowerCase());

    return matchLevel && matchStatus && matchType && matchSearch;
  });

  const stats = {
    total: storeAlerts.length,
    pending: storeAlerts.filter((a) => a.status === 'pending').length,
    processing: storeAlerts.filter((a) => a.status === 'processing').length,
    critical: storeAlerts.filter((a) => a.level === 'critical' && a.status !== 'resolved').length,
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getRecordsForAlert = (alertId: string) => {
    return localRecords.filter((r) => r.alertId === alertId).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  const getCurrentHandler = (alert: Alert) => {
    const records = getRecordsForAlert(alert.id);
    const assignRecord = [...records].reverse().find((r) => r.action === 'assign');
    if (assignRecord?.assigneeName) return assignRecord.assigneeName;
    if (alert.handler) return alert.handler;
    return '未指派';
  };

  const getResponsibleParty = (alert: Alert) => {
    if (alert.type === 'temperature' || alert.type === 'hardware') return '运维部';
    if (alert.type === 'network') return '网络部';
    if (alert.type === 'performance') return '技术部';
    return '综合运维';
  };

  const handleAssign = (alertId: string) => {
    const now = new Date().toISOString();
    const newRecord: AlertHandlingRecord = {
      id: `ahr-${Date.now()}`,
      alertId,
      action: 'assign',
      operatorId: 'current-user',
      operatorName: '当前用户',
      operatorRole: '运维主管',
      note: '指派值班工程师处理此告警',
      beforeStatus: localAlerts.find((a) => a.id === alertId)?.status,
      afterStatus: localAlerts.find((a) => a.id === alertId)?.status,
      assigneeId: 'op-default',
      assigneeName: '运维工程师-小李',
      createdAt: now,
    };
    setLocalRecords([...localRecords, newRecord]);
    setLocalAlerts(localAlerts.map((a) => a.id === alertId ? { ...a, handler: '运维工程师-小李' } : a));
  };

  const handleStartProcessing = (alertId: string) => {
    const now = new Date().toISOString();
    const currentAlert = localAlerts.find((a) => a.id === alertId);
    const newRecord: AlertHandlingRecord = {
      id: `ahr-${Date.now()}`,
      alertId,
      action: 'start',
      operatorId: 'current-user',
      operatorName: '运维工程师-小李',
      operatorRole: '运维工程师',
      note: '已到达现场，开始排查问题',
      beforeStatus: currentAlert?.status,
      afterStatus: 'processing',
      createdAt: now,
    };
    setLocalRecords([...localRecords, newRecord]);
    setLocalAlerts(localAlerts.map((a) => a.id === alertId ? { ...a, status: 'processing' } : a));
  };

  const handleResolve = (alertId: string) => {
    const now = new Date().toISOString();
    const currentAlert = localAlerts.find((a) => a.id === alertId);
    const newRecord: AlertHandlingRecord = {
      id: `ahr-${Date.now()}`,
      alertId,
      action: 'resolve',
      operatorId: 'current-user',
      operatorName: '运维工程师-小李',
      operatorRole: '运维工程师',
      note: '问题已修复，设备恢复正常运行',
      beforeStatus: currentAlert?.status,
      afterStatus: 'resolved',
      createdAt: now,
    };
    setLocalRecords([...localRecords, newRecord]);
    setLocalAlerts(localAlerts.map((a) => a.id === alertId ? { ...a, status: 'resolved', resolvedAt: now } : a));
  };

  const handleReview = (alertId: string) => {
    const now = new Date().toISOString();
    const currentAlert = localAlerts.find((a) => a.id === alertId);
    const newRecord: AlertHandlingRecord = {
      id: `ahr-${Date.now()}`,
      alertId,
      action: 'review',
      operatorId: 'current-user',
      operatorName: '运维主管-张工',
      operatorRole: '运维主管',
      note: '复查通过，告警正式关闭',
      beforeStatus: currentAlert?.status,
      afterStatus: currentAlert?.status,
      createdAt: now,
    };
    setLocalRecords([...localRecords, newRecord]);
  };

  const getTimelineSteps = (records: AlertHandlingRecord[]) => {
    return [
      { key: 'create', label: '告警创建', required: true },
      { key: 'assign', label: '指派处理人', required: true },
      { key: 'start', label: '开始处理', required: true },
      { key: 'resolve', label: '问题解决', required: false },
      { key: 'review', label: '复查关闭', required: false },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">故障预警中心</h1>
          <p className="text-dark-400 mt-1">监控设备告警与处理记录</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyber-500/20">
              <AlertTriangle className="w-5 h-5 text-cyber-400" />
            </div>
            <p className="text-dark-400 text-sm">告警总数</p>
          </div>
          <p className="text-2xl font-bold text-white font-orbitron">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-red/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-red/20">
              <AlertCircle className="w-5 h-5 text-neon-red" />
            </div>
            <p className="text-dark-400 text-sm">待处理</p>
          </div>
          <p className="text-2xl font-bold text-neon-red font-orbitron">{stats.pending}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-orange/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-orange/20">
              <Wrench className="w-5 h-5 text-neon-orange" />
            </div>
            <p className="text-dark-400 text-sm">处理中</p>
          </div>
          <p className="text-2xl font-bold text-neon-orange font-orbitron">{stats.processing}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-red/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-red/30 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-neon-red" />
            </div>
            <p className="text-dark-400 text-sm">严重告警</p>
          </div>
          <p className="text-2xl font-bold text-neon-red font-orbitron">{stats.critical}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索设备/告警信息..."
              className="w-56 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {levelOptions.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <button className="flex items-center gap-2 h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors">
          <Filter className="w-4 h-4" />
          高级筛选
        </button>
      </div>

      <div className="space-y-3">
        {filteredAlerts.map((alert: Alert) => {
          const levelInfo = levelMap[alert.level];
          const statusInfo = statusMap[alert.status];
          const typeInfo = typeMap[alert.type];
          const TypeIcon = typeInfo.icon;
          const isExpanded = expandedId === alert.id;
          const records = getRecordsForAlert(alert.id);
          const currentHandler = getCurrentHandler(alert);
          const responsibleParty = getResponsibleParty(alert);
          const timelineSteps = getTimelineSteps(records);
          const completedActions = new Set<string>(records.map((r) => r.action));

          return (
            <div
              key={alert.id}
              className={cn(
                'rounded-xl bg-dark-800/50 border overflow-hidden transition-all duration-300',
                alert.status === 'pending' && 'border-l-4',
                alert.status === 'pending' && alert.level === 'critical' && levelInfo.border,
                alert.status === 'pending' && alert.level !== 'critical' && 'border-l-cyber-500',
                alert.status !== 'pending' && 'border-cyber-800/50',
                alert.status === 'pending' && 'hover:border-l-cyber-400'
              )}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(alert.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'p-2.5 rounded-lg',
                      alert.level === 'critical' && 'bg-neon-red/20',
                      alert.level === 'high' && 'bg-neon-orange/20',
                      alert.level === 'medium' && 'bg-yellow-500/20',
                      alert.level === 'low' && 'bg-cyber-500/20'
                    )}>
                      <TypeIcon className={cn(
                        'w-5 h-5',
                        alert.level === 'critical' && 'text-neon-red',
                        alert.level === 'high' && 'text-neon-orange',
                        alert.level === 'medium' && 'text-yellow-400',
                        alert.level === 'low' && 'text-cyber-400'
                      )} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-medium">{alert.deviceName}</h3>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', levelInfo.color)}>
                          {levelInfo.label}
                        </span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-dark-300">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-dark-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(alert.createdAt)}
                        </span>
                        <span>{typeInfo.label}</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {currentHandler}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-dark-400 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-dark-400 flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-dark-700">
                  <div className="pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-dark-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-cyber-400" />
                        告警详情
                      </h4>
                      <div className="p-3 rounded-lg bg-dark-900/50 border border-dark-700/50 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-500">告警ID</span>
                          <span className="text-white font-mono text-xs">{alert.id}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-500">设备</span>
                          <span className="text-white">{alert.deviceName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-500">门店</span>
                          <span className="text-white">{alert.storeName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-500">告警类型</span>
                          <span className="text-white">{typeInfo.label}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-500">告警等级</span>
                          <span className={cn('font-medium', levelInfo.color.replace('/20', ''))}>
                            {levelInfo.label}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-500">创建时间</span>
                          <span className="text-white text-xs">{formatDateTime(alert.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-dark-300 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-cyber-400" />
                        处理归属
                      </h4>
                      <div className="p-3 rounded-lg bg-dark-900/50 border border-dark-700/50 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-cyber-500/20">
                            <User className="w-4 h-4 text-cyber-400" />
                          </div>
                          <div>
                            <p className="text-xs text-dark-500">当前处理人</p>
                            <p className="text-sm text-white font-medium">{currentHandler}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-neon-purple/20">
                            <ShieldCheck className="w-4 h-4 text-neon-purple" />
                          </div>
                          <div>
                            <p className="text-xs text-dark-500">责任部门</p>
                            <p className="text-sm text-white font-medium">{responsibleParty}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-neon-orange/20">
                            <Activity className="w-4 h-4 text-neon-orange" />
                          </div>
                          <div>
                            <p className="text-xs text-dark-500">当前状态</p>
                            <p className={cn('text-sm font-medium', statusInfo.color.replace('/20', ''))}>
                              {statusInfo.label}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 lg:col-span-1">
                      <h4 className="text-sm font-medium text-dark-300 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-cyber-400" />
                        状态流转进度
                      </h4>
                      <div className="p-3 rounded-lg bg-dark-900/50 border border-dark-700/50">
                        <div className="relative">
                          {timelineSteps.map((step, index) => {
                            const isCompleted = completedActions.has(step.key as string);
                            const isCurrent = !isCompleted && (index === 0 || completedActions.has(timelineSteps[index - 1]?.key as string));
                            const ActionIcon = actionMap[step.key]?.icon || PlusCircle;
                            return (
                              <div key={step.key} className="flex items-start gap-3">
                                {index < timelineSteps.length - 1 && (
                                  <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-dark-700" style={{ height: 'calc(100% - 32px)' }} />
                                )}
                                <div className={cn(
                                  'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                  isCompleted && 'bg-neon-green/20 border border-neon-green/50',
                                  isCurrent && 'bg-cyber-500/20 border border-cyber-500 animate-pulse',
                                  !isCompleted && !isCurrent && 'bg-dark-700 border border-dark-600'
                                )}>
                                  <ActionIcon className={cn(
                                    'w-4 h-4',
                                    isCompleted && 'text-neon-green',
                                    isCurrent && 'text-cyber-400',
                                    !isCompleted && !isCurrent && 'text-dark-500'
                                  )} />
                                </div>
                                <div className="flex-1 pb-4">
                                  <p className={cn(
                                    'text-sm font-medium',
                                    isCompleted && 'text-neon-green',
                                    isCurrent && 'text-cyber-400',
                                    !isCompleted && !isCurrent && 'text-dark-500'
                                  )}>
                                    {step.label}
                                  </p>
                                  {isCompleted && (
                                    <p className="text-xs text-dark-500 mt-0.5">
                                      {formatDateTime(records.find((r) => r.action === step.key)?.createdAt || '')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h4 className="text-sm font-medium text-dark-300 flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-cyber-400" />
                      处置记录时间轴
                    </h4>
                    {records.length === 0 ? (
                      <div className="p-6 rounded-lg bg-dark-900/50 border border-dark-700/50 text-center">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-dark-600" />
                        <p className="text-sm text-dark-500">暂无处置记录</p>
                      </div>
                    ) : (
                      <div className="relative space-y-0">
                        {records.map((record, index) => {
                          const actionInfo = actionMap[record.action] || actionMap.create;
                          const ActionIcon = actionInfo.icon;
                          const isLast = index === records.length - 1;
                          return (
                            <div key={record.id} className="relative flex gap-4 pb-4">
                              {!isLast && (
                                <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-cyber-500/50 to-dark-700" />
                              )}
                              <div className={cn(
                                'relative z-10 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border',
                                record.action === 'create' && 'bg-neon-red/10 border-neon-red/30',
                                record.action === 'assign' && 'bg-cyber-500/10 border-cyber-500/30',
                                record.action === 'start' && 'bg-neon-orange/10 border-neon-orange/30',
                                record.action === 'resolve' && 'bg-neon-green/10 border-neon-green/30',
                                record.action === 'review' && 'bg-neon-purple/10 border-neon-purple/30',
                                !['create', 'assign', 'start', 'resolve', 'review'].includes(record.action) && 'bg-dark-700 border-dark-600'
                              )}>
                                <ActionIcon className={cn('w-4 h-4', actionInfo.color)} />
                              </div>
                              <div className="flex-1 p-3 rounded-lg bg-dark-900/50 border border-dark-700/50">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={cn('text-sm font-medium', actionInfo.color)}>
                                        {actionInfo.label}
                                      </span>
                                      {record.action === 'assign' && record.assigneeName && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-500/20 text-cyber-400">
                                          → {record.assigneeName}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
                                      <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {record.operatorName}
                                      </span>
                                      <span className="text-dark-600">|</span>
                                      <span>{record.operatorRole}</span>
                                      <span className="text-dark-600">|</span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDateTime(record.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {record.note && (
                                  <p className="text-sm text-dark-400 mt-2 pt-2 border-t border-dark-700/50">
                                    {record.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-dark-700 flex flex-wrap gap-3">
                    {alert.status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssign(alert.id);
                          }}
                          className="flex items-center gap-2 h-9 px-4 bg-cyber-600 hover:bg-cyber-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          指派处理人
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartProcessing(alert.id);
                          }}
                          className="flex items-center gap-2 h-9 px-4 bg-neon-orange hover:bg-neon-orange/80 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Wrench className="w-4 h-4" />
                          开始处理
                        </button>
                      </>
                    )}
                    {alert.status === 'processing' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssign(alert.id);
                          }}
                          className="flex items-center gap-2 h-9 px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          转交处理人
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolve(alert.id);
                          }}
                          className="flex items-center gap-2 h-9 px-4 bg-neon-green hover:bg-neon-green/80 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          标记已解决
                        </button>
                      </>
                    )}
                    {alert.status === 'resolved' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReview(alert.id);
                          }}
                          className="flex items-center gap-2 h-9 px-4 bg-neon-purple hover:bg-neon-purple/80 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          复查通过
                        </button>
                        <span className="flex items-center gap-2 text-neon-green text-sm">
                          <CheckCircle className="w-4 h-4" />
                          已解决
                        </span>
                      </>
                    )}
                    <button className="flex items-center gap-2 h-9 px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors ml-auto">
                      <Activity className="w-4 h-4" />
                      查看详情
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到符合条件的告警</p>
        </div>
      )}
    </div>
  );
}
