import { useState, useEffect } from 'react';
import {
  Key,
  Activity,
  BarChart3,
  Clock,
  Plus,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Zap,
  Timer,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { adminApi } from '../../api';
import type { ApiCallStats, ApiKey } from '../../../shared/types';
import { cn } from '../../lib/utils';

export default function ApiManagement() {
  const [apiStats, setApiStats] = useState<ApiCallStats | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newRateLimit, setNewRateLimit] = useState(1000);
  const [creating, setCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stats, keys] = await Promise.all([
        adminApi.getApiStats(),
        adminApi.getApiKeys(),
      ]);
      setApiStats(stats);
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to fetch API data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const newKey = await adminApi.createApiKey({
        keyName: newKeyName,
        rateLimit: newRateLimit,
      });
      setApiKeys((prev) => [...prev, newKey]);
      setShowCreateDialog(false);
      setNewKeyName('');
      setNewRateLimit(1000);
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleKey = async (key: ApiKey) => {
    setTogglingKey(key.id);
    try {
      const newStatus = key.status === 'active' ? 'inactive' : 'active';
      const updated = await adminApi.updateApiKeyStatus(key.id, newStatus);
      setApiKeys((prev) =>
        prev.map((k) => (k.id === key.id ? updated : k))
      );
    } catch (error) {
      console.error('Failed to toggle API key:', error);
    } finally {
      setTogglingKey(null);
    }
  };

  const handleCopyKey = async (apiKey: string) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopiedKey(apiKey);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy API key:', error);
    }
  };

  const statCards = [
    {
      title: '总调用量',
      value: apiStats?.totalCalls?.toLocaleString() || '0',
      icon: BarChart3,
      color: 'from-blue-500 to-cyan-400',
    },
    {
      title: '成功率',
      value: apiStats
        ? ((apiStats.successCalls / apiStats.totalCalls) * 100).toFixed(2) + '%'
        : '0%',
      icon: Target,
      color: 'from-emerald-500 to-teal-400',
    },
    {
      title: '平均响应时间',
      value: apiStats?.avgResponseTime
        ? apiStats.avgResponseTime.toFixed(0) + 'ms'
        : '0ms',
      icon: Timer,
      color: 'from-purple-500 to-violet-400',
    },
    {
      title: 'API 密钥数',
      value: apiKeys.length,
      icon: Key,
      color: 'from-amber-500 to-orange-400',
    },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-700/50 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-700/30 rounded-2xl" />
            ))}
          </div>
          <div className="h-80 bg-slate-700/30 rounded-2xl" />
          <div className="h-96 bg-slate-700/30 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">接口管理</h1>
        <p className="text-slate-400">
          API 调用统计与密钥管理
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="glass-card glow-blue p-5 hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                </div>
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br',
                    card.color
                  )}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            调用趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={apiStats?.dailyStats || []}>
                <defs>
                  <linearGradient id="colorApiCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.1)"
                />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            热门接口
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={apiStats?.topEndpoints || []}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.1)"
                  horizontal={false}
                />
                <XAxis type="number" stroke="#64748B" fontSize={12} />
                <YAxis
                  dataKey="endpoint"
                  stroke="#64748B"
                  fontSize={11}
                  width={120}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#barGradient)"
                  radius={[0, 4, 4, 0]}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-400" />
            API 密钥
          </h3>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建新密钥
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  密钥名称
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  API Key
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  状态
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  限流
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  创建时间
                </th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>暂无 API 密钥</p>
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr
                    key={key.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="text-white font-medium">{key.keyName}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-1.5 bg-slate-800 rounded text-slate-300 text-sm font-mono max-w-[200px] truncate">
                          {key.apiKey}
                        </code>
                        <button
                          onClick={() => handleCopyKey(key.apiKey)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                          title="复制"
                        >
                          {copiedKey === key.apiKey ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          key.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            key.status === 'active'
                              ? 'bg-emerald-500'
                              : 'bg-slate-500'
                          )}
                        />
                        {key.status === 'active' ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-300 text-sm">
                        {key.rateLimit.toLocaleString()} 次/天
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-400 text-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(key.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleKey(key)}
                          disabled={togglingKey === key.id}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
                          title={key.status === 'active' ? '禁用' : '启用'}
                        >
                          {key.status === 'active' ? (
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              创建新密钥
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm block mb-2">
                  密钥名称
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="请输入密钥名称"
                  className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-2">
                  每日限流
                </label>
                <input
                  type="number"
                  value={newRateLimit}
                  onChange={(e) => setNewRateLimit(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
                <p className="text-slate-500 text-xs mt-1">每天允许的最大调用次数</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim() || creating}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
