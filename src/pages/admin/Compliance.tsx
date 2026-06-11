import { useState, useEffect } from 'react';
import {
  Shield,
  Database,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Settings2,
  FileCheck,
} from 'lucide-react';
import { complianceApi } from '../../api';
import type { ComplianceReport } from '../../../shared/types';
import { cn } from '../../lib/utils';

export default function Compliance() {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    try {
      const data = await complianceApi.getStatus();
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await complianceApi.getStatus();
      setReport(data);
    } catch (error) {
      console.error('Failed to refresh compliance data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: ComplianceReport['complianceStatus']) => {
    const configs = {
      compliant: {
        label: '合规',
        icon: CheckCircle,
        className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      },
      partial: {
        label: '部分合规',
        icon: AlertTriangle,
        className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      },
      non_compliant: {
        label: '不合规',
        icon: XCircle,
        className: 'bg-red-500/10 text-red-400 border border-red-500/20',
      },
    };
    return configs[status];
  };

  const getComplianceLevelBadge = (level: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      compliant: {
        label: '合规',
        className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      },
      partial: {
        label: '部分合规',
        className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      },
      non_compliant: {
        label: '不合规',
        className: 'bg-red-500/10 text-red-400 border border-red-500/20',
      },
    };
    return configs[level] || { label: level, className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-700/50 rounded" />
          <div className="h-40 bg-slate-700/30 rounded-2xl" />
          <div className="h-64 bg-slate-700/30 rounded-2xl" />
          <div className="h-64 bg-slate-700/30 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card p-12 text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-slate-500" />
          <p className="text-slate-400">暂无合规报告数据</p>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(report.complianceStatus);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">合规监控</h1>
          <p className="text-slate-400">数据合规状态与质量校验报告</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          刷新合规检查
        </button>
      </div>

      <div className="glass-card p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          服务合规概览
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-1">服务名称</p>
            <p className="text-white font-semibold text-lg">{report.serviceName}</p>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-1">版本</p>
            <p className="text-white font-semibold text-lg">{report.version}</p>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-1">合规状态</p>
            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium', statusBadge.className)}>
              <StatusIcon className="w-4 h-4" />
              {statusBadge.label}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm">
          <Clock className="w-4 h-4" />
          上次检查时间：{new Date(report.lastCheckTime).toLocaleString('zh-CN')}
        </div>
      </div>

      <div className="glass-card p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Database className="w-6 h-6 text-cyan-400" />
          数据源合规
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">名称</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">状态</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">质量评分</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">合规等级</th>
              </tr>
            </thead>
            <tbody>
              {report.dataSources.map((ds, idx) => {
                const levelBadge = getComplianceLevelBadge(ds.complianceLevel);
                return (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-white font-medium">{ds.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-300 text-sm">{ds.status}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        'font-semibold',
                        ds.qualityScore >= 90 && 'text-emerald-400',
                        ds.qualityScore >= 70 && ds.qualityScore < 90 && 'text-amber-400',
                        ds.qualityScore < 70 && 'text-red-400'
                      )}>
                        {ds.qualityScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', levelBadge.className)}>
                        {levelBadge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-purple-400" />
          质量规则合规
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">规则 ID</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">规则名称</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">启用状态</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">通过率</th>
              </tr>
            </thead>
            <tbody>
              {report.qualityRules.map((rule) => (
                <tr key={rule.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <code className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 text-sm font-mono">{rule.id}</code>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white font-medium">{rule.name}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      rule.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    )}>
                      {rule.enabled ? '已启用' : '已禁用'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            rule.passRate >= 0.95 && 'bg-emerald-500',
                            rule.passRate >= 0.8 && rule.passRate < 0.95 && 'bg-amber-500',
                            rule.passRate < 0.8 && 'bg-red-500'
                          )}
                          style={{ width: `${rule.passRate * 100}%` }}
                        />
                      </div>
                      <span className="text-slate-300 text-sm">{(rule.passRate * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-amber-400" />
          指数参数合规
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">类型</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">名称</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">版本</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">最后更新</th>
              </tr>
            </thead>
            <tbody>
              {report.indices.map((idx, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <code className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 text-sm font-mono">{idx.type}</code>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white font-medium">{idx.name}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-300 text-sm">{idx.version}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-400 text-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(idx.lastUpdate).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
