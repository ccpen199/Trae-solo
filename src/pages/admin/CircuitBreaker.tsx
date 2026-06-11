import { useState, useEffect } from 'react';
import {
  Zap,
  Shield,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  History,
  Activity,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { adminApi } from '../../api';
import type { DataSource, CircuitBreakLog } from '../../../shared/types';
import { cn } from '../../lib/utils';

export default function CircuitBreaker() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [logs, setLogs] = useState<CircuitBreakLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBreakDialog, setShowBreakDialog] = useState<string | null>(null);
  const [breakReason, setBreakReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sources, breakLogs] = await Promise.all([
        adminApi.getCircuitBreakerStatus(),
        adminApi.getCircuitBreakLogs(),
      ]);
      setDataSources(sources);
      setLogs(breakLogs.slice(0, 20));
    } catch (error) {
      console.error('Failed to fetch circuit breaker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualBreak = async (sourceId: string) => {
    setActionLoading(sourceId);
    try {
      await adminApi.manualBreak(sourceId, breakReason || '手动熔断');
      await fetchData();
      setShowBreakDialog(null);
      setBreakReason('');
    } catch (error) {
      console.error('Failed to manual break:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualRestore = async (sourceId: string) => {
    setActionLoading(sourceId);
    try {
      await adminApi.manualRestore(sourceId);
      await fetchData();
    } catch (error) {
      console.error('Failed to manual restore:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusConfig = (status: DataSource['status']) => {
    const configs = {
      online: {
        label: '正常运行',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        textColor: 'text-emerald-400',
        dotColor: 'bg-emerald-500',
        shadowColor: 'shadow-emerald-500/30',
      },
      degraded: {
        label: '服务降级',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        dotColor: 'bg-amber-500',
        shadowColor: 'shadow-amber-500/30',
      },
      circuit_break: {
        label: '已熔断',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-400',
        dotColor: 'bg-red-500',
        shadowColor: 'shadow-red-500/30',
      },
      offline: {
        label: '离线',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        textColor: 'text-slate-400',
        dotColor: 'bg-slate-500',
        shadowColor: '',
      },
    };
    return configs[status];
  };

  const getSourceNameById = (sourceId: string) => {
    const source = dataSources.find((s) => s.id === sourceId);
    return source?.name || sourceId;
  };

  const getErrorCount = (sourceId: string) => {
    return logs.filter((log) => log.sourceId === sourceId && log.action === 'break').length;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-700/50 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-700/30 rounded-2xl" />
            ))}
          </div>
          <div className="h-96 bg-slate-700/30 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">熔断管理</h1>
        <p className="text-slate-400">
          监控各数据源熔断状态，手动控制熔断与恢复
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {dataSources.map((source) => {
          const statusConfig = getStatusConfig(source.status);
          const isCircuitBroken = source.status === 'circuit_break';
          const errorCount = getErrorCount(source.id);

          return (
            <div
              key={source.id}
              className={cn(
                'glass-card p-6 border transition-all',
                isCircuitBroken && 'glow-red',
                statusConfig.borderColor
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      statusConfig.bgColor
                    )}
                  >
                    <Zap className={cn('w-5 h-5', statusConfig.textColor)} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{source.name}</h3>
                    <p className="text-slate-500 text-xs">{source.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-2.5 h-2.5 rounded-full',
                      statusConfig.dotColor,
                      isCircuitBroken && 'animate-pulse'
                    )}
                    style={{
                      boxShadow: isCircuitBroken
                        ? '0 0 12px rgba(239, 68, 68, 0.6)'
                        : undefined,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">状态</span>
                  <span className={cn('text-sm font-medium', statusConfig.textColor)}>
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">延迟</span>
                  <span className="text-slate-200 text-sm">{source.latency}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">成功率</span>
                  <span className="text-slate-200 text-sm">
                    {(source.successRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">错误计数</span>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      errorCount > 3 ? 'text-red-400' : 'text-slate-200'
                    )}
                  >
                    {errorCount} 次
                  </span>
                </div>
              </div>

              {isCircuitBroken && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm font-medium">熔断原因</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    {source.circuitBreakReason || '未知原因'}
                  </p>
                  {source.circuitBreakTime && (
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(source.circuitBreakTime).toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {isCircuitBroken ? (
                  <button
                    onClick={() => handleManualRestore(source.id)}
                    disabled={actionLoading === source.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    {actionLoading === source.id ? '恢复中...' : '手动恢复'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowBreakDialog(source.id);
                      setBreakReason('');
                    }}
                    disabled={actionLoading === source.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg border border-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <Pause className="w-4 h-4" />
                    手动熔断
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <History className="w-6 h-6 text-amber-400" />
          熔断日志 <span className="text-slate-500 text-sm font-normal">（最近20条）</span>
        </h2>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-700/50" />

          <div className="space-y-1">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无熔断日志</p>
              </div>
            ) : (
              logs.map((log, index) => {
                const isBreak = log.action === 'break';
                return (
                  <div
                    key={log.id}
                    className="relative flex items-start gap-4 py-3 pl-12"
                  >
                    <div
                      className={cn(
                        'absolute left-4 top-4 w-5 h-5 rounded-full flex items-center justify-center -translate-x-1/2',
                        isBreak
                          ? 'bg-red-500/20 border border-red-500/50'
                          : 'bg-emerald-500/20 border border-emerald-500/50'
                      )}
                    >
                      {isBreak ? (
                        <XCircle className="w-3 h-3 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      )}
                    </div>

                    <div className="flex-1 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-sm font-medium',
                              isBreak ? 'text-red-400' : 'text-emerald-400'
                            )}
                          >
                            {isBreak ? '熔断' : '恢复'}
                          </span>
                          <span className="text-slate-300 text-sm">
                            {getSourceNameById(log.sourceId)}
                          </span>
                        </div>
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.actionTime).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs">{log.reason}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showBreakDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              手动熔断确认
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              确定要熔断此数据源吗？熔断后该数据源将暂停服务。
            </p>
            <div className="mb-5">
              <label className="text-slate-400 text-sm block mb-2">熔断原因</label>
              <textarea
                value={breakReason}
                onChange={(e) => setBreakReason(e.target.value)}
                placeholder="请输入熔断原因..."
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50 resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBreakDialog(null)}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleManualBreak(showBreakDialog)}
                disabled={actionLoading === showBreakDialog}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === showBreakDialog ? '确认中...' : '确认熔断'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
