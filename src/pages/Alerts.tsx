import { useState, useEffect, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, ChevronUp, Check, X as XIcon, Eye, Clock, AlertTriangle, MapPin, Route, Wifi, WifiOff, Radio, Server, Archive, RefreshCw, Activity, Shield, FileCheck } from 'lucide-react';
import { useAlertStore } from '@/stores/alertStore';
import { useWsStore } from '@/stores/wsStore';
import { api } from '@/utils/api';
import type { AuditLog } from '@/stores/alertStore';

const ALERT_TYPE_LABELS: Record<string, string> = {
  fence_violation: '围栏告警',
  overspeed: '超速告警',
  abnormal_stop: '异常停车',
  fatigue: '疲劳驾驶',
  harsh_accel: '急加速',
  harsh_brake: '急刹车',
};

const LEVEL_COLORS: Record<string, string> = {
  critical: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
};

const LEVEL_LABELS: Record<string, string> = {
  critical: '紧急',
  warning: '警告',
  info: '提示',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  acknowledged: '已确认',
  resolved: '已解决',
  dismissed: '已忽略',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  acknowledged: 'bg-primary/10 text-primary',
  resolved: 'bg-success/10 text-success',
  dismissed: 'bg-gray-500/10 text-gray-400',
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  acknowledge: { label: '确认', color: 'text-primary' },
  resolve: { label: '解决', color: 'text-success' },
  dismiss: { label: '忽略', color: 'text-gray-400' },
  review: { label: '复查', color: 'text-info' },
};

export default function Alerts() {
  const { alerts, total, fetchAlerts, processAlert } = useAlertStore();
  const { connect, disconnect, connected, protocolStats, archiveStats, messageQueue, reconnectAttempts } = useWsStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [processNote, setProcessNote] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [page, setPage] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<Map<number, AuditLog[]>>(new Map());
  const pageSize = 20;

  const highlightId = searchParams.get('highlight');
  const vehicleIdParam = searchParams.get('vehicleId');

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    const filters: Record<string, unknown> = { page, pageSize };
    if (filterType) filters.type = filterType;
    if (filterLevel) filters.level = filterLevel;
    if (filterStatus) filters.status = filterStatus;
    if (vehicleIdParam) filters.vehicleId = Number(vehicleIdParam);
    fetchAlerts(filters);
  }, [page, filterType, filterLevel, filterStatus, vehicleIdParam, fetchAlerts]);

  useEffect(() => {
    if (highlightId) {
      setExpandedId(Number(highlightId));
      loadAuditLogs(Number(highlightId));
    }
  }, [highlightId]);

  useEffect(() => {
    if (expandedId) {
      loadAuditLogs(expandedId);
    }
  }, [expandedId]);

  const loadAuditLogs = async (alertId: number) => {
    try {
      const logs = await api.get<AuditLog[]>(`/api/alerts/${alertId}/audit-logs`);
      setAuditLogs((prev) => {
        const next = new Map(prev);
        next.set(alertId, logs);
        return next;
      });
    } catch {}
  };

  const handleProcess = async (id: number, action: 'acknowledge' | 'resolve' | 'dismiss') => {
    setProcessing(true);
    try {
      await processAlert(id, action, processNote || undefined);
      setProcessNote('');
      setExpandedId(null);
      setProcessing(false);
      fetchAlerts({ page, pageSize, type: filterType || undefined, level: filterLevel || undefined, status: filterStatus || undefined, vehicleId: vehicleIdParam ? Number(vehicleIdParam) : undefined });
      loadAuditLogs(id);
    } catch {
      setProcessing(false);
    }
  };

  const handleReview = async (id: number) => {
    if (!reviewNote.trim()) return;
    setReviewing(true);
    try {
      await api.put(`/api/alerts/${id}/review`, { note: reviewNote });
      setReviewNote('');
      loadAuditLogs(id);
    } catch {}
    setReviewing(false);
  };

  const getAlertTrajectoryLink = (alert: { vehicle_id: number; timestamp: string }) => {
    const ts = new Date(alert.timestamp);
    const date = ts.toISOString().split('T')[0];
    return `/trajectory?vehicleId=${alert.vehicle_id}&date=${date}&highlightTime=${encodeURIComponent(alert.timestamp)}`;
  };

  const pendingQueue = messageQueue.filter((m) => m.status === 'pending').length;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex h-full flex-col p-4 gap-4">
      <div className="dark-card flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            <span className="text-sm text-white font-medium">平台运营状态</span>
          </div>
          <div className="h-4 w-px bg-surface-border" />
          <div className="flex items-center gap-1" title={connected ? 'WebSocket实时连接' : '连接中断，自动重连中'}>
            {connected ? <Wifi size={12} className="text-success" /> : <WifiOff size={12} className="text-danger" />}
            <span className={`text-xs ${connected ? 'text-success' : 'text-danger'}`}>
              {connected ? '实时连接正常' : `连接中断（重连${reconnectAttempts}）`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio size={11} className="text-primary" />
            <span className="text-xs text-gray-500">JT/T 808</span>
            <span className="text-xs font-mono text-white">{protocolStats.jtt808.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Server size={11} className="text-info" />
            <span className="text-xs text-gray-500">GB/T 35658</span>
            <span className="text-xs font-mono text-white">{protocolStats.gbt35658.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw size={11} className="text-warning" />
            <span className="text-xs text-gray-500">消息队列</span>
            <span className="text-xs font-mono text-white">
              {pendingQueue || 0}
              {protocolStats.totalMessages > 0 && <span className="text-gray-600">/ {protocolStats.totalMessages.toLocaleString()}</span>}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Archive size={11} className="text-info" />
            <span className="text-xs text-gray-500">按月归档</span>
            <span className="text-xs font-mono text-white">{archiveStats.archivedMonths} 月</span>
          </div>
        </div>
        {protocolStats.lastMessageTime && (
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-gray-500" />
            <span className="text-[11px] text-gray-500 font-mono">
              最后消息: {new Date(protocolStats.lastMessageTime).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      <div className="dark-card">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="rounded-md border border-surface-border bg-surface-dark py-1.5 px-3 text-sm text-white outline-none focus:border-primary"
            >
              <option value="">全部类型</option>
              {Object.entries(ALERT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <select
            value={filterLevel}
            onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
            className="rounded-md border border-surface-border bg-surface-dark py-1.5 px-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="">全部级别</option>
            <option value="critical">紧急</option>
            <option value="warning">警告</option>
            <option value="info">提示</option>
          </select>
          <div className="flex gap-1">
            {['', 'pending', 'acknowledged', 'resolved', 'dismissed'].map((s) => (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setPage(1); }}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  filterStatus === s ? 'bg-primary text-surface-dark' : 'text-gray-400 hover:bg-surface-light hover:text-white'
                }`}
              >
                {s ? STATUS_LABELS[s] : '全部'}
              </button>
            ))}
          </div>
          {vehicleIdParam && (
            <button
              onClick={() => navigate(`/monitor?vehicleId=${vehicleIdParam}`)}
              className="ml-auto flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors"
            >
              <MapPin size={11} /> 定位车辆
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-surface-border">
        <table className="dark-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>级别</th>
              <th>车牌</th>
              <th>司机</th>
              <th>位置</th>
              <th>处置人</th>
              <th>处置结论</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <Fragment key={alert.id}>
                <tr
                  onClick={() => {
                    const next = expandedId === alert.id ? null : alert.id;
                    setExpandedId(next);
                  }}
                  className={`cursor-pointer ${Number(highlightId) === alert.id ? 'bg-primary/5' : ''}`}
                >
                  <td className="font-mono text-xs text-gray-300">
                    <Clock size={12} className="inline mr-1 text-gray-500" />
                    {new Date(alert.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs text-warning">
                      <AlertTriangle size={10} />
                      {ALERT_TYPE_LABELS[alert.type] || alert.type}
                    </span>
                  </td>
                  <td>
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${LEVEL_COLORS[alert.level] || 'bg-gray-500'}`} />
                      <span className="text-xs">{LEVEL_LABELS[alert.level] || alert.level}</span>
                    </span>
                  </td>
                  <td className="font-mono text-white">{alert.vehicle_plate}</td>
                  <td className="text-gray-300">{alert.driver_name || '-'}</td>
                  <td className="text-gray-400 text-xs max-w-[180px] truncate">
                    <MapPin size={10} className="inline mr-1" />
                    {alert.lat?.toFixed(4)}, {alert.lng?.toFixed(4)}
                  </td>
                  <td className="text-gray-400 text-xs">
                    {alert.processed_by_name || alert.resolve_by_name || alert.confirm_by_name || '-'}
                  </td>
                  <td className="text-gray-400 text-xs max-w-[150px] truncate">
                    {alert.resolve_note || alert.confirm_note || alert.remark || '-'}
                  </td>
                  <td>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[alert.status] || ''}`}>
                      {STATUS_LABELS[alert.status] || alert.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="text-gray-400 hover:text-primary" title="查看详情">
                        <Eye size={14} />
                      </button>
                      {expandedId === alert.id ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                    </div>
                  </td>
                </tr>
                {expandedId === alert.id && (
                  <tr key={`${alert.id}-detail`}>
                    <td colSpan={10} className="bg-surface-dark/50 px-6 py-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">告警类型：</span>
                            <span className="inline-flex items-center gap-1">
                              <AlertTriangle size={10} className="text-warning" />
                              <span className="text-white">{ALERT_TYPE_LABELS[alert.type] || alert.type}</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">告警级别：</span>
                            <span className={alert.level === 'critical' ? 'text-danger' : alert.level === 'warning' ? 'text-warning' : 'text-info'}>
                              {LEVEL_LABELS[alert.level] || alert.level}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">车牌号：</span>
                            <span className="text-white font-mono">{alert.vehicle_plate}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">司机：</span>
                            <span className="text-white">{alert.driver_name || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">坐标：</span>
                            <span className="text-white font-mono">{alert.lat?.toFixed(6)}, {alert.lng?.toFixed(6)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">时间：</span>
                            <span className="text-white font-mono">{new Date(alert.timestamp).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">确认人：</span>
                            <span className="text-white">{alert.confirm_by_name || '-'}</span>
                            {alert.confirm_at && <span className="text-gray-500 ml-2 text-xs">{new Date(alert.confirm_at).toLocaleString()}</span>}
                          </div>
                          <div>
                            <span className="text-gray-500">解决人：</span>
                            <span className="text-white">{alert.resolve_by_name || '-'}</span>
                            {alert.resolve_at && <span className="text-gray-500 ml-2 text-xs">{new Date(alert.resolve_at).toLocaleString()}</span>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm border-t border-surface-border pt-3">
                          <div>
                            <span className="text-gray-500">处置结论：</span>
                            <span className="text-white">{alert.resolve_note || '（未填写）'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">处理备注：</span>
                            <span className="text-white">{alert.remark || alert.confirm_note || '-'}</span>
                          </div>
                        </div>

                        <div className="border-t border-surface-border pt-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Shield size={14} className="text-info" />
                              <span className="text-sm font-medium text-gray-200">处置与复查留痕</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              共 {(auditLogs.get(alert.id) || []).length} 条记录
                            </div>
                          </div>
                          <div className="rounded-lg border border-surface-border bg-surface p-4">
                            <div className="relative pl-6">
                              <div className="absolute left-2 top-1 bottom-1 w-px bg-surface-border" />
                              <div className="space-y-4">
                                <div className="relative">
                                  <div className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full bg-warning ring-4 ring-surface" />
                                  <div className="text-xs">
                                    <span className="text-warning">告警生成</span>
                                    <span className="text-gray-500"> · {new Date(alert.timestamp).toLocaleString()}</span>
                                    <div className="text-gray-400 mt-0.5">{ALERT_TYPE_LABELS[alert.type] || alert.type} · 坐标 ({alert.lat?.toFixed(4)}, {alert.lng?.toFixed(4)})</div>
                                  </div>
                                </div>
                                {(auditLogs.get(alert.id) || []).map((log) => {
                                  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'text-gray-400' };
                                  const dotColor = log.action === 'acknowledge' ? 'bg-primary ring-primary/20'
                                    : log.action === 'resolve' ? 'bg-success ring-success/20'
                                    : log.action === 'review' ? 'bg-info ring-info/20'
                                    : 'bg-gray-500 ring-gray-500/20';
                                  return (
                                    <div key={log.id} className="relative">
                                      <div className={`absolute -left-5 top-1 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${dotColor}`} />
                                      <div className="text-xs">
                                        <span className={actionInfo.color}>{log.action_label || actionInfo.label}</span>
                                        <span className="text-gray-500"> · {new Date(log.processed_at).toLocaleString()}</span>
                                        <span className="text-gray-500"> · 操作人：</span>
                                        <span className="text-white font-medium">{log.processed_by_name || '-'}</span>
                                        {log.note && (
                                          <div className="mt-1 rounded bg-surface-light px-3 py-1.5 text-gray-300">
                                            {log.note}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {(alert.status === 'resolved' || alert.status === 'acknowledged' || alert.status === 'dismissed') && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border/50">
                              <FileCheck size={13} className="text-info" />
                              <span className="text-xs text-gray-400">复查备注：</span>
                              <input
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                placeholder="请输入复查意见（非空可提交）"
                                className="flex-1 max-w-md rounded-md border border-surface-border bg-surface-dark py-1.5 px-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
                              />
                              <button
                                onClick={() => handleReview(alert.id)}
                                disabled={reviewing || !reviewNote.trim()}
                                className="flex items-center gap-1 rounded-md bg-info/10 px-3 py-1.5 text-xs text-info hover:bg-info/20 disabled:opacity-50 transition-colors"
                              >
                                <Check size={12} />
                                {reviewing ? '提交中...' : '提交复查'}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-2 border-t border-surface-border flex-wrap">
                          <button
                            onClick={() => navigate(`/monitor?vehicleId=${alert.vehicle_id}`)}
                            className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20"
                          >
                            <MapPin size={12} /> 实时定位
                          </button>
                          <button
                            onClick={() => navigate(getAlertTrajectoryLink(alert))}
                            className="flex items-center gap-1 rounded-md bg-info/10 px-3 py-1.5 text-xs text-info hover:bg-info/20"
                          >
                            <Route size={12} /> 告警时间轨迹
                          </button>
                          <button
                            onClick={() => navigate(`/trajectory?vehicleId=${alert.vehicle_id}`)}
                            className="flex items-center gap-1 rounded-md bg-surface-light px-3 py-1.5 text-xs text-gray-300 hover:text-white"
                          >
                            <Route size={12} /> 全部轨迹
                          </button>
                          {alert.status === 'pending' && (
                            <>
                              <input
                                value={processNote}
                                onChange={(e) => setProcessNote(e.target.value)}
                                placeholder="处置说明"
                                className="rounded-md border border-surface-border bg-surface-dark py-1.5 px-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary w-64"
                              />
                              <button
                                onClick={() => handleProcess(alert.id, 'acknowledge')}
                                disabled={processing}
                                className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 disabled:opacity-50"
                              >
                                <Eye size={12} /> 确认
                              </button>
                              <button
                                onClick={() => handleProcess(alert.id, 'resolve')}
                                disabled={processing}
                                className="flex items-center gap-1 rounded-md bg-success/10 px-3 py-1.5 text-xs text-success hover:bg-success/20 disabled:opacity-50"
                              >
                                <Check size={12} /> 解决
                              </button>
                              <button
                                onClick={() => handleProcess(alert.id, 'dismiss')}
                                disabled={processing}
                                className="flex items-center gap-1 rounded-md bg-surface-light px-3 py-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-50"
                              >
                                <XIcon size={12} /> 忽略
                              </button>
                            </>
                          )}
                          {alert.status === 'acknowledged' && (
                            <>
                              <input
                                value={processNote}
                                onChange={(e) => setProcessNote(e.target.value)}
                                placeholder="处置说明"
                                className="rounded-md border border-surface-border bg-surface-dark py-1.5 px-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary w-64"
                              />
                              <button
                                onClick={() => handleProcess(alert.id, 'resolve')}
                                disabled={processing}
                                className="flex items-center gap-1 rounded-md bg-success/10 px-3 py-1.5 text-xs text-success hover:bg-success/20 disabled:opacity-50"
                              >
                                <Check size={12} /> 解决
                              </button>
                              <button
                                onClick={() => handleProcess(alert.id, 'dismiss')}
                                disabled={processing}
                                className="flex items-center gap-1 rounded-md bg-surface-light px-3 py-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-50"
                              >
                                <XIcon size={12} /> 忽略
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">共 {total} 条，第 {page}/{totalPages} 页</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="flex h-7 items-center justify-center rounded px-2 text-xs text-gray-400 hover:bg-surface-light disabled:opacity-30"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="flex h-7 items-center justify-center rounded px-2 text-xs text-gray-400 hover:bg-surface-light disabled:opacity-30"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
