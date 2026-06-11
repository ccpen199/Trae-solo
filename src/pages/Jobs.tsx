import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Users, Trash2, Briefcase, CheckCircle2, FileText, Target } from 'lucide-react';

const API = '/api';

type JobType = 'all' | 'summer_winter' | 'internship' | 'online_task';

interface Job {
  id: number;
  title: string;
  type: string;
  status: string;
  application_count: number;
  headcount: number;
  shortlisted_count?: number;
  interviewed_count?: number;
  match_progress?: number;
  latest_application_at?: string | null;
  salary_min: number;
  salary_max: number;
  org_name: string;
}

const typeLabels: Record<string, string> = {
  summer_winter: '寒暑假',
  internship: '实习',
  online_task: '线上任务',
};

const typeColors: Record<string, string> = {
  summer_winter: 'bg-blue-50 text-blue-700',
  internship: 'bg-purple-50 text-purple-700',
  online_task: 'bg-teal-50 text-teal-700',
};

const statusMap: Record<string, { label: string; className: string }> = {
  published: { label: '招聘中', className: 'badge-success' },
  draft: { label: '草稿', className: 'badge-info' },
  closed: { label: '已关闭', className: 'badge-danger' },
  paused: { label: '已暂停', className: 'badge-warning' },
};

const tabs: { key: JobType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'summer_winter', label: '寒暑假' },
  { key: 'internship', label: '实习' },
  { key: 'online_task', label: '线上任务' },
];

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'published', label: '招聘中' },
  { value: 'paused', label: '已暂停' },
  { value: 'closed', label: '已关闭' },
  { value: 'draft', label: '草稿' },
];

export default function Jobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<JobType>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (activeTab !== 'all') params.set('type', activeTab);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('keyword', search.trim());
      const res = await fetch(`${API}/jobs?${params}`);
      if (!res.ok) throw new Error(`请求失败: ${res.status}`);
      const json = await res.json();
      const data = json.data ?? json;
      setJobs(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载岗位失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, search, page, pageSize]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const nextSearch = searchParams.get('search') || '';
    setSearch(nextSearch);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, statusFilter, search]);

  useEffect(() => {
    const next = search.trim();
    if (next) {
      setSearchParams({ search: next }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [search, setSearchParams]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('确认删除该岗位？')) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API}/jobs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`删除失败: ${res.status}`);
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除岗位失败');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = jobs;

  const totalPages = Math.ceil(total / pageSize);
  const hasSearch = Boolean(search.trim());
  const activeStatusLabel = statusOptions.find((item) => item.value === statusFilter)?.label || '全部状态';
  const activeTypeLabel = tabs.find((item) => item.key === activeTab)?.label || '全部';
  const publishedCount = jobs.filter((job) => job.status === 'published').length;
  const reviewCount = jobs.reduce((sum, job) => sum + (job.shortlisted_count ?? 0) + (job.interviewed_count ?? 0), 0);
  const avgProgress = jobs.length
    ? Math.round(jobs.reduce((sum, job) => sum + (job.match_progress ?? 0), 0) / jobs.length)
    : 0;

  const stats = [
    { label: '岗位池', value: total, suffix: '个', icon: Briefcase, color: 'bg-blue-50 text-blue-600' },
    { label: '招聘中', value: publishedCount, suffix: '个', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
    { label: '简历复查', value: reviewCount, suffix: '份', icon: FileText, color: 'bg-amber-50 text-amber-600' },
    { label: '平均匹配进度', value: avgProgress, suffix: '%', icon: Target, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-gray-800">岗位管理</h2>
        <button onClick={() => navigate('/jobs/create')} className="btn-primary flex items-center gap-2">
          <Plus size={16} />发布岗位
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-base p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold font-mono text-gray-800">
                  {stat.value.toLocaleString()}{stat.suffix}
                </p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-base p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 text-sm rounded-md transition-all duration-200 ${
                  activeTab === tab.key ? 'bg-white text-primary shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base w-32"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索岗位名称..."
              className="input-base pl-9"
            />
          </div>
        </div>

        {hasSearch && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-blue-800">
                搜索结果：{total} 个岗位匹配“{search.trim()}”
              </p>
              <p className="mt-0.5 text-xs text-blue-600">
                查询结果已按岗位名称、岗位描述和所属机构筛选
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="badge-info">类型：{activeTypeLabel}</span>
              <span className="badge-info">状态：{activeStatusLabel}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">岗位名称</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">招聘人数</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">匹配进度</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">简历复查</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">薪资范围</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">所属机构</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">最近投递</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                        {hasSearch ? `查询结果为空：未找到与“${search.trim()}”匹配的岗位` : '暂无数据'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((job) => {
                      const statusInfo = statusMap[job.status] || { label: job.status, className: 'badge-info' };
                      const reviewTotal = (job.shortlisted_count ?? 0) + (job.interviewed_count ?? 0);
                      const progress = job.match_progress ?? 0;
                      return (
                        <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <span className="text-sm font-medium text-gray-800">{job.title}</span>
                              <div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[job.type] || 'bg-gray-100 text-gray-600'}`}>
                                  {typeLabels[job.type] || job.type}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={statusInfo.className}>{statusInfo.label}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-sm text-gray-700">{job.application_count ?? 0}/{job.headcount ?? 0}</div>
                            <div className="text-xs text-gray-400">投递/计划</div>
                          </td>
                          <td className="py-3 px-4 min-w-32">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                              </div>
                              <span className="font-mono text-xs text-gray-600">{progress}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-mono text-gray-700">{reviewTotal}</div>
                            <div className="text-xs text-gray-400">候选/已面试</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-sm text-gray-700">¥{job.salary_min}~{job.salary_max}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">{job.org_name || '--'}</td>
                          <td className="py-3 px-4 text-xs text-gray-500">
                            {job.latest_application_at ? new Date(job.latest_application_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/jobs/${job.id}/match`)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                                title="匹配"
                              >
                                <Users size={16} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                                title="查看"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(job.id)}
                                disabled={deleting === job.id}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                title="删除"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">共 {total} 条</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-600 font-mono">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
