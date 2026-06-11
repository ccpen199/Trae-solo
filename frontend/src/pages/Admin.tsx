import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, Shield, FileText, AlertTriangle, Award, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { ProviderProfile, IPRRecord, Dispute, AuditLog, LEVEL_MAP, CATEGORY_MAP } from '../types';

interface DashboardStats {
  totalUsers: number;
  totalTasks: number;
  totalProviders: number;
  totalVolume: number;
  activeTasks: number;
  completedTasks: number;
  disputedTasks: number;
  pendingTasks: number;
  verifiedProviders: number;
  totalEmployers: number;
  categoryDistribution: { category: string; count: number }[];
}

const TABS = [
  { key: 'dashboard', label: '数据看板', icon: BarChart3 },
  { key: 'providers', label: '服务商管理', icon: Users },
  { key: 'ipr', label: '知识产权', icon: Shield },
  { key: 'disputes', label: '争议仲裁', icon: AlertTriangle },
  { key: 'audit', label: '审计日志', icon: FileText },
];

const TASK_STATUS_MAP: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  bidding: '投标中',
  selected: '已选标',
  in_progress: '进行中',
  reviewing: '审核中',
  completed: '已完成',
  cancelled: '已取消',
  disputed: '争议中',
};

const STATUS_BAR_COLORS: Record<string, string> = {
  draft: 'bg-gray-400',
  published: 'bg-blue-500',
  bidding: 'bg-indigo-500',
  selected: 'bg-purple-500',
  in_progress: 'bg-amber-500',
  reviewing: 'bg-cyan-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-300',
  disputed: 'bg-red-500',
};

const DISPUTE_TYPE_MAP: Record<string, string> = {
  quality: '质量问题',
  deadline: '交付延期',
  payment: '付款争议',
  ip: '知识产权',
  other: '其他',
};

const RESOLUTION_TYPE_MAP: Record<string, string> = {
  refund: '退款',
  partial_refund: '部分退款',
  rework: '返工',
  compensation: '赔偿',
  dismiss: '驳回',
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'providers':
        return <ProvidersTab />;
      case 'ipr':
        return <IPRTab />;
      case 'disputes':
        return <DisputesTab />;
      case 'audit':
        return <AuditTab />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">后台管理</h1>

      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {renderContent()}
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any, { data: DashboardStats }>('/admin/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-400">暂无数据</div>;
  }

  const statCards = [
    { label: '总用户数', value: stats.totalUsers, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: '总任务数', value: stats.totalTasks, icon: BarChart3, color: 'bg-accent/10 text-accent' },
    { label: '服务商数', value: stats.totalProviders, icon: Award, color: 'bg-success/10 text-success' },
    { label: '总交易额', value: `¥${stats.totalVolume.toLocaleString()}`, icon: FileText, color: 'bg-warning/10 text-warning' },
  ];

  const taskStats = [
    { label: '待处理', value: stats.pendingTasks, color: 'bg-blue-500' },
    { label: '进行中', value: stats.activeTasks, color: 'bg-amber-500' },
    { label: '已完成', value: stats.completedTasks, color: 'bg-green-500' },
    { label: '争议中', value: stats.disputedTasks, color: 'bg-red-500' },
  ];
  const maxCount = Math.max(...taskStats.map(s => s.value), 1);
  const taskTotal = taskStats.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <div className="text-sm text-gray-500">{card.label}</div>
                <div className="text-xl font-bold text-gray-800">{card.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 mb-4">任务状态分布</h3>
        <div className="space-y-3">
          {taskStats.map((item) => {
            const pct = Math.round((item.value / maxCount) * 100);
            const percent = taskTotal > 0 ? ((item.value / taskTotal) * 100).toFixed(1) : '0';
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16 text-right shrink-0">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500 ${item.color}`}
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{item.value}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-12 text-right shrink-0">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 mb-4">分类分布</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(stats.categoryDistribution || []).map((item) => (
            <div key={item.category} className="border border-gray-100 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-gray-800">{item.count}</div>
              <div className="text-xs text-gray-500 mt-1">{CATEGORY_MAP[item.category] || item.category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProvidersTab() {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProviders = useCallback(() => {
    setLoading(true);
    api.get<any, { data: ProviderProfile[] }>('/admin/providers')
      .then((res) => setProviders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleGrade = async (id: number, level: string) => {
    try {
      await api.post(`/admin/providers/${id}/grade`, { level });
      setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, level } : p)));
    } catch {}
  };

  const handleVerify = async (id: number, verified: boolean) => {
    try {
      await api.post(`/admin/providers/${id}/verify`, { verified });
      setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, verified } : p)));
    } catch {}
  };

  const filtered = providers.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (p.real_name || '').toLowerCase().includes(s) || (p.name || '').toLowerCase().includes(s);
  });

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder="搜索服务商"
          />
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">姓名</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">等级</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">评分</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">订单数</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">认证</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{p.real_name || p.name || '-'}</div>
                  <div className="text-xs text-gray-400">{(p.skills || []).slice(0, 3).join('、')}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.level}
                    onChange={(e) => handleGrade(p.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    {Object.entries(LEVEL_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1">
                    <Award size={14} className="text-warning" />
                    {p.rating?.toFixed(1) || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.total_orders ?? '-'}</td>
                <td className="px-4 py-3">
                  {p.verified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                      <CheckCircle size={14} /> 已认证
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">未认证</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleVerify(p.id, !p.verified)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      p.verified
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-success/10 text-success hover:bg-success/20'
                    }`}
                  >
                    {p.verified ? '取消认证' : '通过认证'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">暂无服务商数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IPRTab() {
  const [records, setRecords] = useState<IPRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<any, { data: IPRRecord[] }>('/admin/ipr')
      .then((res) => setRecords(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const truncateHash = (hash: string) => {
    if (!hash || hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">作品名称</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">作品哈希</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">区块链交易</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">存证时间</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">证书</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-800">{r.work_title || '-'}</td>
              <td className="px-4 py-3">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{truncateHash(r.work_hash)}</code>
              </td>
              <td className="px-4 py-3">
                {r.blockchain_tx ? (
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{truncateHash(r.blockchain_tx)}</code>
                ) : (
                  <span className="text-xs text-gray-400">待上链</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {r.timestamp ? new Date(r.timestamp * 1000).toLocaleString('zh-CN') : '-'}
              </td>
              <td className="px-4 py-3">
                {r.certificate_url ? (
                  <a href={r.certificate_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline">
                    查看证书
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-8 text-gray-400">暂无存证记录</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DisputesTab() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);
  const [resolveForm, setResolveForm] = useState<Record<number, { resolution: string; resolution_type: string; resolution_amount: string }>>({});

  const fetchDisputes = useCallback(() => {
    setLoading(true);
    api.get<any, { data: Dispute[] }>('/admin/disputes')
      .then((res) => setDisputes(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const getForm = (id: number) =>
    resolveForm[id] || { resolution: '', resolution_type: 'refund', resolution_amount: '' };

  const updateForm = (id: number, updates: Partial<{ resolution: string; resolution_type: string; resolution_amount: string }>) => {
    setResolveForm((prev) => ({
      ...prev,
      [id]: { ...getForm(id), ...updates },
    }));
  };

  const handleResolve = async (id: number) => {
    const form = getForm(id);
    if (!form.resolution.trim()) return;
    setResolving(id);
    try {
      await api.post(`/admin/disputes/${id}/resolve`, {
        resolution: form.resolution,
        resolution_type: form.resolution_type,
        resolution_amount: form.resolution_amount ? Number(form.resolution_amount) : null,
      });
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status: 'resolved', resolution: form.resolution, resolution_type: form.resolution_type, resolution_amount: form.resolution_amount ? Number(form.resolution_amount) : null }
            : d
        )
      );
      setResolveForm((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {disputes.map((d) => {
        const isResolved = d.status === 'resolved';
        return (
          <div key={d.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-800">{d.title}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>类型：{DISPUTE_TYPE_MAP[d.type] || d.type}</span>
                  <span>时间：{new Date(d.created_at).toLocaleString('zh-CN')}</span>
                </div>
              </div>
              <StatusBadge status={d.status} />
            </div>

            {d.description && (
              <p className="text-sm text-gray-600 mb-3">{d.description}</p>
            )}

            {isResolved && d.resolution && (
              <div className="bg-green-50 rounded-xl p-3 mb-3">
                <div className="text-xs text-gray-500 mb-1">仲裁结果</div>
                <div className="text-sm text-gray-800">{d.resolution}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>方式：{RESOLUTION_TYPE_MAP[d.resolution_type || ''] || d.resolution_type}</span>
                  {d.resolution_amount != null && <span>金额：¥{d.resolution_amount}</span>}
                </div>
              </div>
            )}

            {!isResolved && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">仲裁意见</label>
                  <textarea
                    value={getForm(d.id).resolution}
                    onChange={(e) => updateForm(d.id, { resolution: e.target.value })}
                    className="input-field text-sm min-h-[60px]"
                    placeholder="请输入仲裁意见"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">处理方式</label>
                    <select
                      value={getForm(d.id).resolution_type}
                      onChange={(e) => updateForm(d.id, { resolution_type: e.target.value })}
                      className="input-field text-sm"
                    >
                      {Object.entries(RESOLUTION_TYPE_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">涉及金额</label>
                    <input
                      type="number"
                      value={getForm(d.id).resolution_amount}
                      onChange={(e) => updateForm(d.id, { resolution_amount: e.target.value })}
                      className="input-field text-sm"
                      placeholder="元"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleResolve(d.id)}
                    disabled={resolving === d.id || !getForm(d.id).resolution.trim()}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {resolving === d.id ? '处理中...' : '提交仲裁'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {disputes.length === 0 && (
        <div className="text-center py-12 text-gray-400">暂无争议记录</div>
      )}
    </div>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const fetchLogs = useCallback((p: number) => {
    setLoading(true);
    api.get<any, { data: { list: AuditLog[]; total: number; page: number; pageSize: number } }>('/admin/audit-logs', {
      params: { page: p, pageSize },
    })
      .then((res) => {
        setLogs(res.data.list);
        setTotal(res.data.total);
        setPage(res.data.page);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">操作人</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">目标类型</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">目标ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">详情</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">IP地址</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">时间</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-800">{log.user_name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{log.target_type || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{log.target_id ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate" title={log.details || ''}>
                  {log.details || '-'}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ip_address || '-'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('zh-CN')}
                </td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">暂无日志记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            共 {total} 条记录，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1}
              className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600 px-2">{page}</span>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages}
              className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
