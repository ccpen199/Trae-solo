import { useState, useEffect } from 'react';
import {
  Shield,
  Database,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Settings2,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { adminApi } from '../../api';
import type { DataSource, QualityRule } from '../../../shared/types';
import { cn } from '../../lib/utils';

export default function Quality() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [qualityRules, setQualityRules] = useState<QualityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sources, rules] = await Promise.all([
          adminApi.getDataSources(),
          adminApi.getQualityRules(),
        ]);
        setDataSources(sources);
        setQualityRules(rules);
      } catch (error) {
        console.error('Failed to fetch quality data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusConfig = (status: DataSource['status']) => {
    const configs = {
      online: { label: '在线', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
      degraded: { label: '降级', color: 'bg-amber-500', textColor: 'text-amber-400' },
      circuit_break: { label: '熔断', color: 'bg-red-500', textColor: 'text-red-400' },
      offline: { label: '离线', color: 'bg-slate-500', textColor: 'text-slate-400' },
    };
    return configs[status];
  };

  const getTypeLabel = (type: DataSource['type']) => {
    const labels = {
      official: '官方数据源',
      radar: '雷达数据源',
      iot: '物联网数据源',
    };
    return labels[type];
  };

  const startEdit = (rule: QualityRule) => {
    setEditingRule(rule.id);
    setEditValues({
      threshold: rule.threshold,
      weight: rule.weight,
      enabled: rule.enabled,
    });
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setEditValues({});
  };

  const saveRule = async (ruleId: string) => {
    setSaving(true);
    try {
      const updated = await adminApi.updateQualityRule(ruleId, editValues);
      setQualityRules((prev) =>
        prev.map((r) => (r.id === ruleId ? updated : r))
      );
      setEditingRule(null);
      setEditValues({});
    } catch (error) {
      console.error('Failed to update quality rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: QualityRule) => {
    try {
      const updated = await adminApi.updateQualityRule(rule.id, {
        enabled: !rule.enabled,
      });
      setQualityRules((prev) =>
        prev.map((r) => (r.id === rule.id ? updated : r))
      );
    } catch (error) {
      console.error('Failed to toggle quality rule:', error);
    }
  };

  const formatThreshold = (threshold: QualityRule['threshold']) => {
    if (Array.isArray(threshold)) {
      return `${threshold[0]} ~ ${threshold[1]}`;
    }
    return String(threshold);
  };

  const getOperatorLabel = (operator: QualityRule['operator']) => {
    const labels: Record<string, string> = {
      '>': '大于',
      '<': '小于',
      '>=': '大于等于',
      '<=': '小于等于',
      '==': '等于',
      '!=': '不等于',
      range: '范围',
    };
    return labels[operator] || operator;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-700/50 rounded" />
          <div className="h-64 bg-slate-700/30 rounded-2xl" />
          <div className="h-96 bg-slate-700/30 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">数据质量监控</h1>
        <p className="text-slate-400">
          多源数据接入状态监控与质量校验规则管理
        </p>
      </div>

      <div className="glass-card p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-400" />
          数据源接入状态
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  数据源名称
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  类型
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  状态
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  延迟
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  成功率
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  质量评分
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  最后更新
                </th>
              </tr>
            </thead>
            <tbody>
              {dataSources.map((source) => {
                const statusConfig = getStatusConfig(source.status);
                return (
                  <tr
                    key={source.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full shadow-lg',
                            statusConfig.color,
                            source.status === 'online' && 'shadow-emerald-500/50',
                            source.status === 'degraded' && 'shadow-amber-500/50',
                            source.status === 'circuit_break' && 'shadow-red-500/50'
                          )}
                        />
                        <span className="text-white font-medium">{source.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-300 text-sm">
                        {getTypeLabel(source.type)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          source.status === 'online' &&
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                          source.status === 'degraded' &&
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                          source.status === 'circuit_break' &&
                            'bg-red-500/10 text-red-400 border border-red-500/20',
                          source.status === 'offline' &&
                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-300 text-sm">{source.latency}ms</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              source.successRate >= 0.95 && 'bg-emerald-500',
                              source.successRate >= 0.8 &&
                                source.successRate < 0.95 &&
                                'bg-amber-500',
                              source.successRate < 0.8 && 'bg-red-500'
                            )}
                            style={{ width: `${source.successRate * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-sm">
                          {(source.successRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          'font-semibold',
                          source.qualityScore >= 90 && 'text-emerald-400',
                          source.qualityScore >= 70 &&
                            source.qualityScore < 90 &&
                            'text-amber-400',
                          source.qualityScore < 70 && 'text-red-400'
                        )}
                      >
                        {source.qualityScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-400 text-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(source.lastUpdate).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-purple-400" />
          质量校验规则
        </h2>
        <div className="grid gap-4">
          {qualityRules.map((rule) => {
            const isEditing = editingRule === rule.id;
            return (
              <div
                key={rule.id}
                className={cn(
                  'p-5 rounded-xl border transition-all',
                  isEditing
                    ? 'bg-blue-500/5 border-blue-500/30'
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/50'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-medium">{rule.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-400">
                        {rule.field}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{rule.description}</p>

                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                          <div className="flex-1 min-w-[200px]">
                            <label className="text-slate-400 text-sm block mb-1.5">
                              操作符
                            </label>
                            <select
                              value={editValues.operator || rule.operator}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  operator: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                            >
                              <option value=">">大于</option>
                              <option value="<">小于</option>
                              <option value=">=">大于等于</option>
                              <option value="<=">小于等于</option>
                              <option value="==">等于</option>
                              <option value="!=">不等于</option>
                              <option value="range">范围</option>
                            </select>
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <label className="text-slate-400 text-sm block mb-1.5">
                              阈值
                            </label>
                            {editValues.operator === 'range' ||
                            rule.operator === 'range' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={
                                    Array.isArray(editValues.threshold)
                                      ? editValues.threshold[0]
                                      : (rule.threshold as [number, number])[0]
                                  }
                                  onChange={(e) =>
                                    setEditValues((prev) => ({
                                      ...prev,
                                      threshold: [
                                        Number(e.target.value),
                                        Array.isArray(prev.threshold)
                                          ? prev.threshold[1]
                                          : rule.threshold[1],
                                      ],
                                    }))
                                  }
                                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                                />
                                <span className="text-slate-500">~</span>
                                <input
                                  type="number"
                                  value={
                                    Array.isArray(editValues.threshold)
                                      ? editValues.threshold[1]
                                      : (rule.threshold as [number, number])[1]
                                  }
                                  onChange={(e) =>
                                    setEditValues((prev) => ({
                                      ...prev,
                                      threshold: [
                                        Array.isArray(prev.threshold)
                                          ? prev.threshold[0]
                                          : (rule.threshold as [number, number])[0],
                                        Number(e.target.value),
                                      ],
                                    }))
                                  }
                                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                                />
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={
                                  typeof editValues.threshold === 'number'
                                    ? editValues.threshold
                                    : (rule.threshold as number)
                                }
                                onChange={(e) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    threshold: Number(e.target.value),
                                  }))
                                }
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                              />
                            )}
                          </div>
                          <div className="w-32">
                            <label className="text-slate-400 text-sm block mb-1.5">
                              权重
                            </label>
                            <input
                              type="number"
                              value={editValues.weight ?? rule.weight}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  weight: Number(e.target.value),
                                }))
                              }
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => saveRule(rule.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            保存
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">操作符：</span>
                          <span className="text-slate-300">
                            {getOperatorLabel(rule.operator)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">阈值：</span>
                          <span className="text-slate-300">
                            {formatThreshold(rule.threshold)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">权重：</span>
                          <span className="text-slate-300">{rule.weight}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(rule)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleRule(rule)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-10 h-10 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
